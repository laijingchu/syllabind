import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import Stripe from "stripe";
import { getStripeClient } from '../lib/stripe';
import { PRO_CYCLE_CREDITS, CREDIT_PACKAGES } from '../utils/creditService';

// Map plan names to their tier and credit grant
const PLAN_FULFILLMENT: Record<string, { tier: string; credits?: number }> = {
  pro_monthly: { tier: 'pro_monthly', credits: PRO_CYCLE_CREDITS },
  pro_annual: { tier: 'pro_annual', credits: PRO_CYCLE_CREDITS },
  lifetime: { tier: 'lifetime', credits: 5000 },
  credits_100: { tier: '', credits: 100 },
  credits_250: { tier: '', credits: 250 },
  credits_500: { tier: '', credits: 550 },
};

async function fulfillCheckoutSession(session: Stripe.Checkout.Session, stripe: Stripe) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan || 'legacy_pro';
  if (!userId) {
    console.error('[Webhook] No user ID in session metadata');
    return;
  }

  try {
    if (session.payment_status === 'paid') {
      const stripeCustomerId = typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;

      const fulfillment = PLAN_FULFILLMENT[plan];
      const paymentIntent = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;

      if (fulfillment) {
        const updates: Record<string, any> = { subscriptionStatus: 'pro' };
        if (stripeCustomerId) updates.stripeCustomerId = stripeCustomerId;
        if (fulfillment.tier) {
          updates.subscriptionTier = fulfillment.tier;
        }

        // Only update user status for plan purchases (not credit packages)
        if (fulfillment.tier) {
          await storage.updateUser(userId, updates);
        } else if (stripeCustomerId) {
          await storage.updateUser(userId, { stripeCustomerId });
        }

        // Grant credits
        if (fulfillment.credits) {
          const isCreditPackage = plan.startsWith('credits_');
          const type = isCreditPackage ? 'package_purchase' : 'subscription_grant';
          const desc = isCreditPackage
            ? `Credit package: ${fulfillment.credits} credits`
            : plan === 'lifetime'
              ? `Lifetime membership: ${fulfillment.credits} credits`
              : `Pro subscription: ${fulfillment.credits} monthly credits`;

          await storage.grantCredits(userId, fulfillment.credits, type, desc, `stripe:${paymentIntent || session.id}`);

          // Set creditsGrantedAt for deduplication (subscriptions only)
          if (!isCreditPackage && plan !== 'lifetime') {
            await storage.updateUser(userId, { creditsGrantedAt: new Date() } as any);
          }
        }
      } else {
        // Legacy one-time Pro purchase (backwards compat)
        const updates: Record<string, any> = { subscriptionStatus: 'pro', subscriptionTier: 'lifetime' };
        if (stripeCustomerId) updates.stripeCustomerId = stripeCustomerId;
        await storage.updateUser(userId, updates);
        // Grant lifetime credits for legacy
        await storage.grantCredits(userId, 5000, 'subscription_grant', 'Legacy Pro upgrade: 5,000 credits', `stripe:${paymentIntent || session.id}`);
      }

      // Store payment record for audit trail
      if (paymentIntent && !plan.startsWith('credits_')) {
        await storage.upsertSubscription({
          userId,
          stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : (paymentIntent),
          stripePriceId: null,
          status: plan === 'lifetime' || plan === 'legacy_pro' ? 'lifetime' : 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        });
      }
    }
  } catch (error) {
    console.error('[Webhook] Error fulfilling checkout session:', error);
    throw error;
  }
}

export async function registerWebhookRoutes(app: Express) {
  app.post('/api/webhook', async (req: Request, res: Response) => {
    const stripe = getStripeClient();
    if (!stripe) {
      return res.status(503).json({ error: 'Payments service not configured' });
    }

    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    try {
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!endpointSecret) {
        throw new Error('Webhook secret not configured');
      }
      // Use rawBody captured by express.json verify callback in server/index.ts
      event = stripe.webhooks.constructEvent(
        (req as any).rawBody,
        sig as string,
        endpointSecret
      );
    } catch (err) {
      console.log('[Webhook] Signature verification failed:', (err as Error).message);
      return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const checkoutSession = event.data.object as Stripe.Checkout.Session;
          if (checkoutSession.payment_status === 'paid') {
            await fulfillCheckoutSession(checkoutSession, stripe);
          }
          break;
        }

        case 'customer.subscription.updated': {
          const updatedSubscription = event.data.object as Stripe.Subscription;
          const userIdFromSub = updatedSubscription.metadata.userId;
          if (userIdFromSub) {
            if (updatedSubscription.status === 'active') {
              await storage.updateUser(userIdFromSub, { subscriptionStatus: 'pro' });
            } else if (['canceled', 'unpaid', 'past_due'].includes(updatedSubscription.status)) {
              await storage.updateUser(userIdFromSub, { subscriptionStatus: 'free' });
            }
          }
          // Update subscription record
          const updatedItem = updatedSubscription.items?.data?.[0];
          await storage.updateSubscriptionByStripeId(updatedSubscription.id, {
            status: updatedSubscription.status,
            currentPeriodStart: updatedItem ? new Date(updatedItem.current_period_start * 1000) : undefined,
            currentPeriodEnd: updatedItem ? new Date(updatedItem.current_period_end * 1000) : undefined,
            cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
          });
          break;
        }

        case 'customer.subscription.deleted': {
          const deletedSubscription = event.data.object as Stripe.Subscription;
          const userIdFromDeleted = deletedSubscription.metadata.userId;
          if (userIdFromDeleted) {
            await storage.updateUser(userIdFromDeleted, {
              subscriptionStatus: 'free',
              subscriptionTier: 'free',
            } as any);
          }
          await storage.updateSubscriptionByStripeId(deletedSubscription.id, {
            status: 'canceled',
          });
          break;
        }

        case 'invoice.payment_succeeded': {
          const paidInvoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null };
          if (paidInvoice.subscription && typeof paidInvoice.subscription === 'string') {
            const subscription = await stripe.subscriptions.retrieve(paidInvoice.subscription);
            const userIdFromInvoice = subscription.metadata.userId;
            if (userIdFromInvoice) {
              await storage.updateUser(userIdFromInvoice, { subscriptionStatus: 'pro' });

              // Grant monthly credits on renewal (with deduplication)
              const user = await storage.getUser(userIdFromInvoice);
              if (user && (user.subscriptionTier === 'pro_monthly' || user.subscriptionTier === 'pro_annual')) {
                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const lastGrant = user.creditsGrantedAt ? new Date(user.creditsGrantedAt) : null;
                if (!lastGrant || lastGrant < monthStart) {
                  await storage.grantCredits(userIdFromInvoice, PRO_CYCLE_CREDITS, 'subscription_grant', `Monthly ${PRO_CYCLE_CREDITS} credit grant`, `stripe:${paidInvoice.id}`);
                  await storage.updateUser(userIdFromInvoice, { creditsGrantedAt: now } as any);
                }
              }
            }
          }
          break;
        }

        case 'invoice.payment_failed': {
          const failedInvoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null };
          if (failedInvoice.subscription && typeof failedInvoice.subscription === 'string') {
            const subscription = await stripe.subscriptions.retrieve(failedInvoice.subscription);
            const userIdFromFailed = subscription.metadata.userId;
            if (userIdFromFailed) {
              console.log('[Webhook] Invoice payment failed for user:', userIdFromFailed);
            }
          }
          break;
        }

        default:
          break;
      }

      res.json({ received: true });
    } catch (err) {
      console.error('[Webhook] Error processing event:', err);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  });
}
