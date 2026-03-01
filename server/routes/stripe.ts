import type { Express } from "express";
import { storage } from "../storage";
import Stripe from "stripe";
import { isAuthenticated } from "../auth/index";
import { getStripeClient } from "../lib/stripe";
import {
  CREDIT_COSTS, FREE_ENROLLMENT_LIMIT, FREE_MANUAL_BINDER_LIMIT,
  isProTier, getMaxWeeks
} from "../utils/creditService";

export async function registerStripeRoutes(app: Express) {
  // Get subscription status
  app.get("/api/subscription/status", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const isPro = isProTier(user.subscriptionTier || 'free') || user.isAdmin === true;
    res.json({
      subscriptionStatus: user.subscriptionStatus || 'free',
      subscriptionTier: user.subscriptionTier || 'free',
      isPro,
    });
  });

  // Get subscription limits (binder count, can create more, can enroll)
  app.get("/api/subscription/limits", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const isPro = isProTier(user.subscriptionTier || 'free') || user.isAdmin === true;
    const binderCount = await storage.countBindersByCurator(user.username);
    const manualBinderCount = await storage.countManualBinders(user.username);
    const activeEnrollmentCount = await storage.countActiveEnrollments(user.username);
    const creditBalance = await storage.getCreditBalance(user.id);

    res.json({
      binderCount,
      binderLimit: isPro ? null : FREE_MANUAL_BINDER_LIMIT,
      canCreateMore: isPro || manualBinderCount < FREE_MANUAL_BINDER_LIMIT,
      canEnroll: isPro || activeEnrollmentCount < FREE_ENROLLMENT_LIMIT,
      isPro,
      // Credit system fields
      creditBalance,
      subscriptionTier: user.subscriptionTier || 'free',
      costs: CREDIT_COSTS,
      enrollmentLimit: isPro ? null : FREE_ENROLLMENT_LIMIT,
      activeEnrollmentCount,
      maxWeeks: getMaxWeeks(user.subscriptionTier || 'free', user.isAdmin === true),
    });
  });

  // Plan → Stripe price mapping
  const PLAN_CONFIG: Record<string, { envVar: string; mode: 'subscription' | 'payment'; credits?: number; tier?: string }> = {
    pro_monthly: { envVar: 'STRIPE_PRICE_ID_PRO_MONTHLY', mode: 'subscription', tier: 'pro_monthly' },
    pro_annual: { envVar: 'STRIPE_PRICE_ID_PRO_ANNUAL', mode: 'subscription', tier: 'pro_annual' },
    lifetime: { envVar: 'STRIPE_PRICE_ID_LIFETIME', mode: 'payment', credits: 5000, tier: 'lifetime' },
    credits_100: { envVar: 'STRIPE_PRICE_ID_CREDITS_100', mode: 'payment', credits: 100 },
    credits_250: { envVar: 'STRIPE_PRICE_ID_CREDITS_250', mode: 'payment', credits: 250 },
    credits_550: { envVar: 'STRIPE_PRICE_ID_CREDITS_550', mode: 'payment', credits: 550 },
  };

  // Create Stripe Checkout session
  app.post("/api/create-checkout-session", isAuthenticated, async (req, res) => {
    try {
      const stripe = getStripeClient();
      if (!stripe) {
        return res.status(503).json({ error: 'Payments service not configured' });
      }

      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      const { plan, returnTo } = req.body;
      console.log('[Stripe Checkout] plan:', plan, 'returnTo:', returnTo);

      // Determine plan config
      const planConfig = PLAN_CONFIG[plan];
      if (!planConfig) {
        return res.status(400).json({ error: `Unknown plan: ${plan}` });
      }

      const sessionPriceId = process.env[planConfig.envVar];
      const mode = planConfig.mode;
      const checkoutPlan = plan;

      if (!sessionPriceId) {
        return res.status(400).json({ error: `Price ID not configured for plan: ${plan}` });
      }

      // Block credit packages for non-Pro users
      if (plan?.startsWith('credits_') && !isProTier(user.subscriptionTier || 'free') && !(user as any).isAdmin) {
        return res.status(403).json({ error: "Credit packages are only available for Pro subscribers" });
      }

      // Create or get Stripe customer (re-fetch from DB to avoid stale session data)
      const freshUser = await storage.getUser(userId);
      let customerId = freshUser?.stripeCustomerId || null;
      if (customerId) {
        // Verify customer still exists in Stripe
        try {
          await stripe.customers.retrieve(customerId);
        } catch {
          console.log('[Checkout] Stale Stripe customer ID, creating new one');
          customerId = null;
          await storage.updateUser(userId, { stripeCustomerId: null } as any);
        }
      }
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: { userId: user.id },
        });
        customerId = customer.id;
        await storage.updateUser(userId, { stripeCustomerId: customerId });
      }

      // Build success/cancel URLs
      const port = process.env.PORT || '5000';
      const origin = process.env.FRONTEND_URL || `http://localhost:${port}`;
      const successPath = returnTo
        ? `${returnTo}${returnTo.includes('?') ? '&' : '?'}subscription=success`
        : '/billing?subscription=success';
      const cancelPath = returnTo || '/billing?subscription=canceled';

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: sessionPriceId, quantity: 1 }],
        mode,
        success_url: `${origin}${successPath}`,
        cancel_url: `${origin}${cancelPath}`,
        metadata: { userId: user.id, plan: checkoutPlan },
        allow_promotion_codes: true,
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error('[Checkout] Error creating checkout session:', error);
      if (error instanceof Stripe.errors.StripeError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Create Stripe Customer Portal session
  app.post('/api/create-portal-session', isAuthenticated, async (req, res) => {
    try {
      const stripe = getStripeClient();
      if (!stripe) {
        return res.status(503).json({ error: 'Payments service not configured' });
      }

      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Create Stripe customer if one doesn't exist (e.g., admin-promoted users)
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: { userId: user.id },
        });
        customerId = customer.id;
        await storage.updateUser(userId, { stripeCustomerId: customerId });
      }

      const port = process.env.PORT || '5000';
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.FRONTEND_URL || `http://localhost:${port}`}/profile`,
      });

      res.json({ url: portalSession.url });
    } catch (error) {
      console.error('[Portal] Error creating portal session:', error);
      if (error instanceof Stripe.errors.StripeError) {
        return res.status(400).json({ error: error.message, type: error.type });
      }
      res.status(500).json({ error: 'Failed to create portal session' });
    }
  });
}
