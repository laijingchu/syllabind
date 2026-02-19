import request from 'supertest';
import express from 'express';
import { resetAllMocks, mockStorage, mockUser, mockProUser } from './setup/mocks';

describe('Stripe Routes', () => {
  let freeApp: express.Express;
  let proApp: express.Express;
  let unauthApp: express.Express;

  function registerRoutes(a: express.Express) {
    const authMiddleware = (req: any, res: any, next: any) => {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      next();
    };

    // GET /api/subscription/status
    a.get('/api/subscription/status', authMiddleware, async (req, res) => {
      const user = req.user as any;
      res.json({
        subscriptionStatus: user.subscriptionStatus || 'free',
        isPro: user.subscriptionStatus === 'pro',
      });
    });

    // GET /api/subscription/limits
    a.get('/api/subscription/limits', authMiddleware, async (req, res) => {
      const user = req.user as any;
      const isPro = user.subscriptionStatus === 'pro';
      const syllabindCount = await mockStorage.countSyllabindsByCreator(user.username);
      const FREE_SYLLABIND_LIMIT = 2;
      res.json({
        syllabindCount,
        syllabindLimit: isPro ? null : FREE_SYLLABIND_LIMIT,
        canCreateMore: isPro || syllabindCount < FREE_SYLLABIND_LIMIT,
        canEnroll: isPro,
        isPro,
      });
    });

    // POST /api/create-checkout-session
    a.post('/api/create-checkout-session', authMiddleware, async (req, res) => {
      const { getStripeClient } = require('../lib/stripe');
      const stripe = getStripeClient();
      if (!stripe) return res.status(503).json({ error: 'Payments service not configured' });

      const userId = (req.user as any).id;
      const user = await mockStorage.getUser(userId);
      if (!user) return res.status(400).json({ error: 'User not found' });

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: { userId: user.id },
        });
        customerId = customer.id;
        await mockStorage.updateUser(userId, { stripeCustomerId: customerId });
      }

      const sessionPriceId = process.env.STRIPE_PRICE_ID_PRO;
      if (!sessionPriceId) return res.status(400).json({ error: 'Price ID not configured' });

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: sessionPriceId, quantity: 1 }],
        mode: 'subscription',
        success_url: 'http://localhost:5000/profile?subscription=success',
        cancel_url: 'http://localhost:5000/profile?subscription=canceled',
        metadata: { userId: user.id },
      });

      res.json({ sessionId: session.id, url: session.url });
    });

    // POST /api/create-portal-session
    a.post('/api/create-portal-session', authMiddleware, async (req, res) => {
      const { getStripeClient } = require('../lib/stripe');
      const stripe = getStripeClient();
      if (!stripe) return res.status(503).json({ error: 'Payments service not configured' });

      const userId = (req.user as any).id;
      const user = await mockStorage.getUser(userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ error: 'Customer not found or no Stripe customer ID' });
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: 'http://localhost:5000/profile',
      });
      res.json({ url: portalSession.url });
    });
  }

  beforeAll(() => {
    process.env.STRIPE_PRICE_ID_PRO = 'price_test_pro123';

    freeApp = express();
    freeApp.use(express.json());
    freeApp.use((req, _res, next) => { req.user = mockUser; next(); });
    registerRoutes(freeApp);

    proApp = express();
    proApp.use(express.json());
    proApp.use((req, _res, next) => { req.user = mockProUser; next(); });
    registerRoutes(proApp);

    unauthApp = express();
    unauthApp.use(express.json());
    registerRoutes(unauthApp);
  });

  beforeEach(() => {
    resetAllMocks();
    process.env.STRIPE_PRICE_ID_PRO = 'price_test_pro123';
  });

  describe('GET /api/subscription/status', () => {
    it('should return free status for free user', async () => {
      const res = await request(freeApp).get('/api/subscription/status').expect(200);
      expect(res.body).toEqual({ subscriptionStatus: 'free', isPro: false });
    });

    it('should return pro status for pro user', async () => {
      const res = await request(proApp).get('/api/subscription/status').expect(200);
      expect(res.body).toEqual({ subscriptionStatus: 'pro', isPro: true });
    });

    it('should return 401 when not authenticated', async () => {
      await request(unauthApp).get('/api/subscription/status').expect(401);
    });
  });

  describe('GET /api/subscription/limits', () => {
    it('should return limits for free user with no syllabinds', async () => {
      mockStorage.countSyllabindsByCreator.mockResolvedValue(0);
      const res = await request(freeApp).get('/api/subscription/limits').expect(200);
      expect(res.body).toEqual({
        syllabindCount: 0,
        syllabindLimit: 2,
        canCreateMore: true,
        canEnroll: false,
        isPro: false,
      });
    });

    it('should block free user at limit', async () => {
      mockStorage.countSyllabindsByCreator.mockResolvedValue(2);
      const res = await request(freeApp).get('/api/subscription/limits').expect(200);
      expect(res.body.canCreateMore).toBe(false);
    });

    it('should return unlimited for pro user', async () => {
      mockStorage.countSyllabindsByCreator.mockResolvedValue(10);
      const res = await request(proApp).get('/api/subscription/limits').expect(200);
      expect(res.body).toEqual({
        syllabindCount: 10,
        syllabindLimit: null,
        canCreateMore: true,
        canEnroll: true,
        isPro: true,
      });
    });
  });

  describe('POST /api/create-checkout-session', () => {
    it('should create checkout session for user without stripe customer', async () => {
      mockStorage.getUser.mockResolvedValue({ ...mockUser, stripeCustomerId: null });
      mockStorage.updateUser.mockResolvedValue({ ...mockUser, stripeCustomerId: 'cus_test123' });

      const res = await request(freeApp)
        .post('/api/create-checkout-session')
        .send({})
        .expect(200);

      expect(res.body.sessionId).toBe('cs_test123');
      expect(res.body.url).toContain('checkout.stripe.com');
    });

    it('should create checkout session for user with existing stripe customer', async () => {
      mockStorage.getUser.mockResolvedValue({ ...mockUser, stripeCustomerId: 'cus_existing' });

      const res = await request(freeApp)
        .post('/api/create-checkout-session')
        .send({})
        .expect(200);

      expect(res.body.sessionId).toBe('cs_test123');
    });

    it('should return 400 if user not found', async () => {
      mockStorage.getUser.mockResolvedValue(null);
      const res = await request(freeApp)
        .post('/api/create-checkout-session')
        .send({})
        .expect(400);
      expect(res.body.error).toBe('User not found');
    });

    it('should return 400 if price ID not configured', async () => {
      delete process.env.STRIPE_PRICE_ID_PRO;
      mockStorage.getUser.mockResolvedValue({ ...mockUser, stripeCustomerId: 'cus_test' });

      const res = await request(freeApp)
        .post('/api/create-checkout-session')
        .send({})
        .expect(400);
      expect(res.body.error).toBe('Price ID not configured');
    });
  });

  describe('POST /api/create-portal-session', () => {
    it('should create portal session for user with stripe customer', async () => {
      mockStorage.getUser.mockResolvedValue({ ...mockProUser, stripeCustomerId: 'cus_pro123' });

      const res = await request(proApp)
        .post('/api/create-portal-session')
        .send({})
        .expect(200);

      expect(res.body.url).toContain('billing.stripe.com');
    });

    it('should return 404 if user has no stripe customer', async () => {
      mockStorage.getUser.mockResolvedValue({ ...mockUser, stripeCustomerId: null });

      const res = await request(freeApp)
        .post('/api/create-portal-session')
        .send({})
        .expect(404);
      expect(res.body.error).toBe('Customer not found or no Stripe customer ID');
    });
  });
});
