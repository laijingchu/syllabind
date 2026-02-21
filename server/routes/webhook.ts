import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import Stripe from "stripe";
import { getStripeClient } from '../lib/stripe';

async function fulfillCheckoutSession(session: Stripe.Checkout.Session, stripe: Stripe) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('[Webhook] No user ID in session metadata');
    return;
  }

  try {
    // One-time payment: upgrade user to Pro on successful payment
    if (session.payment_status === 'paid') {
      // Store Stripe customer ID if present (ensures portal access works)
      const stripeCustomerId = typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;
      const updates: Record<string, any> = { subscriptionStatus: 'pro' };
      if (stripeCustomerId) {
        updates.stripeCustomerId = stripeCustomerId;
      }
      await storage.updateUser(userId, updates);

      // Store payment record for audit trail
      const paymentIntent = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;

      if (paymentIntent) {
        await storage.upsertSubscription({
          userId,
          stripeSubscriptionId: paymentIntent,
          stripePriceId: null,
          status: 'lifetime',
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
            await storage.updateUser(userIdFromDeleted, { subscriptionStatus: 'free' });
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
