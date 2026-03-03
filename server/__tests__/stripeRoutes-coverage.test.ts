/**
 * Tests for server/routes/stripe.ts
 *
 * Tests all Stripe-related routes using supertest:
 * - GET /api/subscription/status
 * - GET /api/subscription/limits
 * - POST /api/create-checkout-session
 * - POST /api/create-portal-session
 */

import express from 'express';
import request from 'supertest';
import { registerStripeRoutes } from '../routes/stripe';
import { mockUser, mockProUser } from './setup/mocks';

// Get mocked modules
const { storage } = require('../storage');
const { getStripeClient } = require('../lib/stripe');
const Stripe = require('stripe');

// Helper to build app with authenticated user
function createApp(user: any = mockUser) {
  const app = express();
  app.use(express.json());
  // Inject user into request
  app.use((req: any, _res, next) => {
    if (user) {
      req.user = user;
      req.isAuthenticated = () => true;
    } else {
      req.isAuthenticated = () => false;
    }
    next();
  });
  return app;
}

describe('Stripe Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: storage.getUser returns the mock user
    storage.getUser.mockResolvedValue(mockUser);
    storage.countBindersByCurator.mockResolvedValue(2);
    storage.countManualBinders.mockResolvedValue(1);
    storage.countActiveEnrollments.mockResolvedValue(0);
    storage.getCreditBalance.mockResolvedValue(100);
    storage.updateUser.mockResolvedValue(undefined);
  });

  describe('GET /api/subscription/status', () => {
    it('returns free status for free user', async () => {
      app = createApp(mockUser);
      await registerStripeRoutes(app);

      const res = await request(app).get('/api/subscription/status');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        subscriptionStatus: 'free',
        subscriptionTier: 'free',
        isPro: false,
      });
    });

    it('returns pro status for pro user', async () => {
      app = createApp(mockProUser);
      await registerStripeRoutes(app);

      const res = await request(app).get('/api/subscription/status');
      expect(res.status).toBe(200);
      expect(res.body.isPro).toBe(true);
      expect(res.body.subscriptionTier).toBe('pro_monthly');
    });

    it('returns pro status for admin user', async () => {
      const adminUser = { ...mockUser, isAdmin: true };
      app = createApp(adminUser);
      await registerStripeRoutes(app);

      const res = await request(app).get('/api/subscription/status');
      expect(res.status).toBe(200);
      expect(res.body.isPro).toBe(true);
    });

    it('returns 401 for unauthenticated user', async () => {
      app = createApp(null);
      await registerStripeRoutes(app);

      const res = await request(app).get('/api/subscription/status');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/subscription/limits', () => {
    it('returns limits for free user', async () => {
      app = createApp(mockUser);
      await registerStripeRoutes(app);

      const res = await request(app).get('/api/subscription/limits');
      expect(res.status).toBe(200);
      expect(res.body.isPro).toBe(false);
      expect(res.body.binderCount).toBe(2);
      expect(res.body.binderLimit).toBe(3); // FREE_MANUAL_BINDER_LIMIT
      expect(res.body.canCreateMore).toBe(true);
      expect(res.body.canEnroll).toBe(true);
      expect(res.body.creditBalance).toBe(100);
      expect(res.body.maxWeeks).toBe(4); // FREE_MAX_WEEKS
    });

    it('returns unlimited limits for pro user', async () => {
      app = createApp(mockProUser);
      await registerStripeRoutes(app);

      const res = await request(app).get('/api/subscription/limits');
      expect(res.status).toBe(200);
      expect(res.body.isPro).toBe(true);
      expect(res.body.binderLimit).toBeNull();
      expect(res.body.canCreateMore).toBe(true);
      expect(res.body.enrollmentLimit).toBeNull();
      expect(res.body.maxWeeks).toBe(6); // PRO_MAX_WEEKS
    });
  });

  describe('POST /api/create-checkout-session', () => {
    beforeEach(() => {
      process.env.STRIPE_PRICE_ID_PRO_MONTHLY = 'price_pro_monthly';
      process.env.STRIPE_PRICE_ID_PRO_ANNUAL = 'price_pro_annual';
      process.env.STRIPE_PRICE_ID_LIFETIME = 'price_lifetime';
      process.env.STRIPE_PRICE_ID_CREDITS_100 = 'price_credits_100';
    });

    afterEach(() => {
      delete process.env.STRIPE_PRICE_ID_PRO_MONTHLY;
      delete process.env.STRIPE_PRICE_ID_PRO_ANNUAL;
      delete process.env.STRIPE_PRICE_ID_LIFETIME;
      delete process.env.STRIPE_PRICE_ID_CREDITS_100;
    });

    it('creates checkout session for pro_monthly', async () => {
      app = createApp(mockUser);
      await registerStripeRoutes(app);

      const res = await request(app)
        .post('/api/create-checkout-session')
        .send({ plan: 'pro_monthly' });

      expect(res.status).toBe(200);
      expect(res.body.sessionId).toBe('cs_test123');
      expect(res.body.url).toBeDefined();
    });

    it('returns 503 when Stripe not configured', async () => {
      getStripeClient.mockReturnValueOnce(null);
      app = createApp(mockUser);
      await registerStripeRoutes(app);

      const res = await request(app)
        .post('/api/create-checkout-session')
        .send({ plan: 'pro_monthly' });

      expect(res.status).toBe(503);
      expect(res.body.error).toContain('not configured');
    });

    it('returns 400 when user not found', async () => {
      storage.getUser.mockResolvedValue(null);
      app = createApp(mockUser);
      await registerStripeRoutes(app);

      const res = await request(app)
        .post('/api/create-checkout-session')
        .send({ plan: 'pro_monthly' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('User not found');
    });

    it('returns 400 for unknown plan', async () => {
      app = createApp(mockUser);
      await registerStripeRoutes(app);

      const res = await request(app)
        .post('/api/create-checkout-session')
        .send({ plan: 'invalid_plan' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Unknown plan');
    });

    it('returns 400 when price ID not configured', async () => {
      delete process.env.STRIPE_PRICE_ID_PRO_ANNUAL;
      app = createApp(mockUser);
      await registerStripeRoutes(app);

      const res = await request(app)
        .post('/api/create-checkout-session')
        .send({ plan: 'pro_annual' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Price ID not configured');
    });

    it('returns 403 for credit packages when user is not pro', async () => {
      app = createApp(mockUser);
      await registerStripeRoutes(app);

      const res = await request(app)
        .post('/api/create-checkout-session')
        .send({ plan: 'credits_100' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('only available for Pro');
    });

    it('allows credit packages for pro users', async () => {
      app = createApp(mockProUser);
      await registerStripeRoutes(app);
      // getUser returns pro user for both calls
      storage.getUser.mockResolvedValue(mockProUser);

      const res = await request(app)
        .post('/api/create-checkout-session')
        .send({ plan: 'credits_100' });

      expect(res.status).toBe(200);
      expect(res.body.sessionId).toBeDefined();
    });

    it('handles stale Stripe customer ID', async () => {
      const userWithStripe = { ...mockUser, stripeCustomerId: 'cus_stale' };
      storage.getUser.mockResolvedValue(userWithStripe);

      // The customer retrieve should throw to simulate stale ID
      const stripeClient = getStripeClient();
      stripeClient.customers.retrieve.mockRejectedValueOnce(new Error('No such customer'));

      app = createApp(userWithStripe);
      await registerStripeRoutes(app);

      const res = await request(app)
        .post('/api/create-checkout-session')
        .send({ plan: 'pro_monthly' });

      expect(res.status).toBe(200);
      // Should have created a new customer
      expect(stripeClient.customers.create).toHaveBeenCalled();
    });

    it('uses existing Stripe customer when valid', async () => {
      const userWithStripe = { ...mockUser, stripeCustomerId: 'cus_existing' };
      storage.getUser.mockResolvedValue(userWithStripe);

      const stripeClient = getStripeClient();
      stripeClient.customers.retrieve.mockResolvedValueOnce({ id: 'cus_existing' });

      app = createApp(userWithStripe);
      await registerStripeRoutes(app);

      const res = await request(app)
        .post('/api/create-checkout-session')
        .send({ plan: 'pro_monthly' });

      expect(res.status).toBe(200);
    });

    it('handles Stripe errors gracefully', async () => {
      const stripeClient = getStripeClient();
      const StripeError = Stripe.errors.StripeError;
      stripeClient.checkout.sessions.create.mockRejectedValueOnce(
        new StripeError('Card declined')
      );

      app = createApp(mockUser);
      await registerStripeRoutes(app);

      const res = await request(app)
        .post('/api/create-checkout-session')
        .send({ plan: 'pro_monthly' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Card declined');
    });

    it('includes returnTo in success URL', async () => {
      const stripeClient = getStripeClient();
      app = createApp(mockUser);
      await registerStripeRoutes(app);

      const res = await request(app)
        .post('/api/create-checkout-session')
        .send({ plan: 'pro_monthly', returnTo: '/dashboard' });

      expect(res.status).toBe(200);
      // The session.create was called with success_url containing returnTo
      const createCall = stripeClient.checkout.sessions.create.mock.calls[0][0];
      expect(createCall.success_url).toContain('/dashboard');
    });
  });

  describe('POST /api/create-portal-session', () => {
    it('creates portal session for user with Stripe customer', async () => {
      const userWithStripe = { ...mockUser, stripeCustomerId: 'cus_portal' };
      storage.getUser.mockResolvedValue(userWithStripe);

      app = createApp(userWithStripe);
      await registerStripeRoutes(app);

      const res = await request(app)
        .post('/api/create-portal-session');

      expect(res.status).toBe(200);
      expect(res.body.url).toBeDefined();
    });

    it('creates Stripe customer if missing', async () => {
      storage.getUser.mockResolvedValue(mockUser); // no stripeCustomerId

      app = createApp(mockUser);
      await registerStripeRoutes(app);

      const stripeClient = getStripeClient();
      const res = await request(app)
        .post('/api/create-portal-session');

      expect(res.status).toBe(200);
      expect(stripeClient.customers.create).toHaveBeenCalled();
    });

    it('returns 503 when Stripe not configured', async () => {
      getStripeClient.mockReturnValueOnce(null);
      app = createApp(mockUser);
      await registerStripeRoutes(app);

      const res = await request(app)
        .post('/api/create-portal-session');

      expect(res.status).toBe(503);
    });

    it('returns 404 when user not found', async () => {
      storage.getUser.mockResolvedValue(null);
      app = createApp(mockUser);
      await registerStripeRoutes(app);

      const res = await request(app)
        .post('/api/create-portal-session');

      expect(res.status).toBe(404);
    });

    it('handles Stripe errors for portal', async () => {
      storage.getUser.mockResolvedValue({ ...mockUser, stripeCustomerId: 'cus_error' });
      const stripeClient = getStripeClient();
      const StripeError = Stripe.errors.StripeError;
      stripeClient.billingPortal.sessions.create.mockRejectedValueOnce(
        new StripeError('Portal config error')
      );

      app = createApp(mockUser);
      await registerStripeRoutes(app);

      const res = await request(app)
        .post('/api/create-portal-session');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Portal config error');
    });
  });
});
