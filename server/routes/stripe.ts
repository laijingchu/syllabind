import type { Express } from "express";
import { storage } from "../storage";
import Stripe from "stripe";
import { isAuthenticated } from "../auth/index";
import { getStripeClient } from "../lib/stripe";

export async function registerStripeRoutes(app: Express) {
  // Get subscription status
  app.get("/api/subscription/status", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    res.json({
      subscriptionStatus: user.subscriptionStatus || 'free',
      isPro: user.subscriptionStatus === 'pro' || user.isAdmin === true,
    });
  });

  // Get subscription limits (syllabind count, can create more, can enroll)
  app.get("/api/subscription/limits", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const isPro = user.subscriptionStatus === 'pro' || user.isAdmin === true;
    const syllabindCount = await storage.countSyllabindsByCreator(user.username);
    const FREE_SYLLABIND_LIMIT = 2;

    res.json({
      syllabindCount,
      syllabindLimit: isPro ? null : FREE_SYLLABIND_LIMIT,
      canCreateMore: isPro || syllabindCount < FREE_SYLLABIND_LIMIT,
      canEnroll: isPro,
      isPro,
    });
  });

  // Create Stripe Checkout session
  app.post("/api/create-checkout-session", isAuthenticated, async (req, res) => {
    try {
      const stripe = getStripeClient();
      if (!stripe) {
        return res.status(503).json({ error: 'Payments service not configured' });
      }

      const userId = (req.user as any).id;
      let user = await storage.getUser(userId);
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: { userId: user.id },
        });
        customerId = customer.id;
        await storage.updateUser(userId, { stripeCustomerId: customerId });
      }

      // Determine price ID
      const sessionPriceId = process.env.STRIPE_PRICE_ID_PRO;
      if (!sessionPriceId) {
        return res.status(400).json({ error: "Price ID not configured" });
      }

      // Build success/cancel URLs — include returnTo so user lands back where they were
      const { returnTo } = req.body;
      const port = process.env.PORT || '5000';
      const origin = process.env.FRONTEND_URL || `http://localhost:${port}`;
      const successPath = returnTo
        ? `${returnTo}${returnTo.includes('?') ? '&' : '?'}subscription=success`
        : '/profile?subscription=success';
      const cancelPath = returnTo || '/profile?subscription=canceled';

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: sessionPriceId, quantity: 1 }],
        mode: 'payment',
        success_url: `${origin}${successPath}`,
        cancel_url: `${origin}${cancelPath}`,
        metadata: { userId: user.id },
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
