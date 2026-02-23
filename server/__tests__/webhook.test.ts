import request from 'supertest';
import express from 'express';
import { registerWebhookRoutes } from '../routes/webhook';
import { resetAllMocks, mockStorage } from './setup/mocks';

describe('Webhook Routes', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    // Webhook needs raw body for signature verification
    app.use(express.json({
      verify: (req: any, _res, buf) => { req.rawBody = buf; },
    }));
    await registerWebhookRoutes(app);
  });

  beforeAll(() => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  beforeEach(() => {
    resetAllMocks();
  });

  afterAll(() => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  const mockEvents = {
    checkoutSessionCompleted: {
      id: 'evt_test_checkout_completed',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_session123',
          mode: 'payment',
          payment_status: 'paid',
          customer: 'cus_test_checkout456',
          metadata: { userId: 'test-user-id-123' },
          payment_intent: 'pi_test123',
        },
      },
    },
    subscriptionUpdated: {
      id: 'evt_test_sub_updated',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test123',
          status: 'active',
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 2592000,
          cancel_at_period_end: false,
          metadata: { userId: 'test-user-id-123' },
        },
      },
    },
    subscriptionDeleted: {
      id: 'evt_test_sub_deleted',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_test123',
          status: 'canceled',
          metadata: { userId: 'test-user-id-123' },
        },
      },
    },
    invoicePaymentSucceeded: {
      id: 'evt_test_invoice_paid',
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: 'in_test123',
          subscription: 'sub_test123',
        },
      },
    },
    invoicePaymentFailed: {
      id: 'evt_test_invoice_failed',
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_failed123',
          subscription: 'sub_test123',
        },
      },
    },
  };

  const createWebhookPayload = (event: any) => ({
    payload: JSON.stringify(event),
    signature: `t=${Math.floor(Date.now() / 1000)},v1=test_signature`,
  });

  const mockConstructEvent = (expectedEvent: any) => {
    const stripe = require('stripe');
    const mockStripe = stripe();
    mockStripe.webhooks.constructEvent.mockReturnValue(expectedEvent);
  };

  describe('Signature Verification', () => {
    it('should reject webhook with missing secret', async () => {
      const original = process.env.STRIPE_WEBHOOK_SECRET;
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const { payload, signature } = createWebhookPayload(mockEvents.checkoutSessionCompleted);
      const res = await request(app)
        .post('/api/webhook')
        .send(payload)
        .set('stripe-signature', signature)
        .set('content-type', 'application/json')
        .expect(400);

      expect(res.text).toContain('Webhook Error: Webhook secret not configured');
      process.env.STRIPE_WEBHOOK_SECRET = original;
    });

    it('should reject webhook with invalid signature', async () => {
      const stripe = require('stripe');
      const mockStripe = stripe();
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const { payload } = createWebhookPayload(mockEvents.checkoutSessionCompleted);
      const res = await request(app)
        .post('/api/webhook')
        .send(payload)
        .set('stripe-signature', 'bad-sig')
        .set('content-type', 'application/json')
        .expect(400);

      expect(res.text).toContain('Webhook Error: Invalid signature');
    });
  });

  describe('checkout.session.completed', () => {
    it('should upgrade user to pro on paid subscription checkout', async () => {
      mockConstructEvent(mockEvents.checkoutSessionCompleted);
      mockStorage.updateUser.mockResolvedValue({ id: 'test-user-id-123', subscriptionStatus: 'pro' });

      const { payload, signature } = createWebhookPayload(mockEvents.checkoutSessionCompleted);
      const res = await request(app)
        .post('/api/webhook')
        .send(payload)
        .set('stripe-signature', signature)
        .set('content-type', 'application/json')
        .expect(200);

      expect(mockStorage.updateUser).toHaveBeenCalledWith('test-user-id-123', { subscriptionStatus: 'pro', stripeCustomerId: 'cus_test_checkout456' });
      expect(mockStorage.upsertSubscription).toHaveBeenCalled();
      expect(res.body).toEqual({ received: true });
    });

    it('should skip fulfillment if payment not completed', async () => {
      const unpaidEvent = {
        ...mockEvents.checkoutSessionCompleted,
        data: {
          object: { ...mockEvents.checkoutSessionCompleted.data.object, payment_status: 'unpaid' },
        },
      };
      mockConstructEvent(unpaidEvent);

      const { payload, signature } = createWebhookPayload(unpaidEvent);
      await request(app)
        .post('/api/webhook')
        .send(payload)
        .set('stripe-signature', signature)
        .set('content-type', 'application/json')
        .expect(200);

      expect(mockStorage.updateUser).not.toHaveBeenCalled();
    });

    it('should handle missing user ID in metadata', async () => {
      const noUserEvent = {
        ...mockEvents.checkoutSessionCompleted,
        data: {
          object: { ...mockEvents.checkoutSessionCompleted.data.object, metadata: {} },
        },
      };
      mockConstructEvent(noUserEvent);

      const { payload, signature } = createWebhookPayload(noUserEvent);
      await request(app)
        .post('/api/webhook')
        .send(payload)
        .set('stripe-signature', signature)
        .set('content-type', 'application/json')
        .expect(200);

      expect(mockStorage.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('customer.subscription.updated', () => {
    it('should set user to pro when subscription active', async () => {
      mockConstructEvent(mockEvents.subscriptionUpdated);
      mockStorage.updateUser.mockResolvedValue({});

      const { payload, signature } = createWebhookPayload(mockEvents.subscriptionUpdated);
      await request(app)
        .post('/api/webhook')
        .send(payload)
        .set('stripe-signature', signature)
        .set('content-type', 'application/json')
        .expect(200);

      expect(mockStorage.updateUser).toHaveBeenCalledWith('test-user-id-123', { subscriptionStatus: 'pro' });
    });

    it('should set user to free when subscription canceled', async () => {
      const canceledEvent = {
        ...mockEvents.subscriptionUpdated,
        data: {
          object: { ...mockEvents.subscriptionUpdated.data.object, status: 'canceled' },
        },
      };
      mockConstructEvent(canceledEvent);
      mockStorage.updateUser.mockResolvedValue({});

      const { payload, signature } = createWebhookPayload(canceledEvent);
      await request(app)
        .post('/api/webhook')
        .send(payload)
        .set('stripe-signature', signature)
        .set('content-type', 'application/json')
        .expect(200);

      expect(mockStorage.updateUser).toHaveBeenCalledWith('test-user-id-123', { subscriptionStatus: 'free' });
    });
  });

  describe('customer.subscription.deleted', () => {
    it('should downgrade user when subscription deleted', async () => {
      mockConstructEvent(mockEvents.subscriptionDeleted);
      mockStorage.updateUser.mockResolvedValue({});

      const { payload, signature } = createWebhookPayload(mockEvents.subscriptionDeleted);
      await request(app)
        .post('/api/webhook')
        .send(payload)
        .set('stripe-signature', signature)
        .set('content-type', 'application/json')
        .expect(200);

      expect(mockStorage.updateUser).toHaveBeenCalledWith('test-user-id-123', { subscriptionStatus: 'free' });
    });
  });

  describe('invoice.payment_succeeded', () => {
    it('should confirm pro status after successful payment', async () => {
      mockConstructEvent(mockEvents.invoicePaymentSucceeded);
      mockStorage.updateUser.mockResolvedValue({});

      const { payload, signature } = createWebhookPayload(mockEvents.invoicePaymentSucceeded);
      await request(app)
        .post('/api/webhook')
        .send(payload)
        .set('stripe-signature', signature)
        .set('content-type', 'application/json')
        .expect(200);

      expect(mockStorage.updateUser).toHaveBeenCalledWith('test-user-id', { subscriptionStatus: 'pro' });
    });
  });

  describe('invoice.payment_failed', () => {
    it('should not downgrade user on payment failure (Stripe retries)', async () => {
      mockConstructEvent(mockEvents.invoicePaymentFailed);

      const { payload, signature } = createWebhookPayload(mockEvents.invoicePaymentFailed);
      await request(app)
        .post('/api/webhook')
        .send(payload)
        .set('stripe-signature', signature)
        .set('content-type', 'application/json')
        .expect(200);

      // Should NOT call updateUser to downgrade
      expect(mockStorage.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('Unknown events', () => {
    it('should handle unknown event types gracefully', async () => {
      const unknownEvent = { id: 'evt_unknown', type: 'unknown.type', data: { object: {} } };
      mockConstructEvent(unknownEvent);

      const { payload, signature } = createWebhookPayload(unknownEvent);
      const res = await request(app)
        .post('/api/webhook')
        .send(payload)
        .set('stripe-signature', signature)
        .set('content-type', 'application/json')
        .expect(200);

      expect(res.body).toEqual({ received: true });
    });
  });
});
