/// <reference types="jest" />

// Mock the storage module
jest.mock('../storage', () => {
  const storageMock: Record<string, jest.Mock> = {};
  const handler = {
    get: (_target: any, prop: string) => {
      if (!storageMock[prop]) {
        storageMock[prop] = jest.fn();
      }
      return storageMock[prop];
    }
  };
  return {
    storage: new Proxy({}, handler),
    __storageMock: storageMock,
  };
});

import {
  reserveCredits,
  refundCredits,
  canAfford,
  grantSubscriptionCredits,
  grantSignupCredits,
  getGenerationCost,
  getMaxWeeks,
  isProTier,
  CREDIT_COSTS,
  FREE_TIER_CREDITS,
  PRO_CYCLE_CREDITS,
  FREE_MAX_WEEKS,
  PRO_MAX_WEEKS,
} from '../utils/creditService';

// Access mock functions through the proxy so the Proxy handler creates them
const { storage, __storageMock: sm } = require('../storage');

// Pre-access all storage methods through the proxy to ensure mock fns exist
const mockFns = {
  deductCredits: storage.deductCredits as jest.Mock,
  grantCredits: storage.grantCredits as jest.Mock,
  resetCreditsTo: storage.resetCreditsTo as jest.Mock,
  getCreditBalance: storage.getCreditBalance as jest.Mock,
  getUser: storage.getUser as jest.Mock,
  updateUser: storage.updateUser as jest.Mock,
};

beforeEach(() => {
  Object.values(sm).forEach((fn: any) => fn.mockReset());
});

describe('Credit Service', () => {
  describe('Constants', () => {
    it('should have correct credit costs', () => {
      expect(CREDIT_COSTS.per_week).toBe(10);
      expect(CREDIT_COSTS.improve_writing).toBe(1);
      expect(CREDIT_COSTS.auto_fill).toBe(0);
    });

    it('should have correct tier limits', () => {
      expect(FREE_TIER_CREDITS).toBe(100);
      expect(PRO_CYCLE_CREDITS).toBe(130);
      expect(FREE_MAX_WEEKS).toBe(4);
      expect(PRO_MAX_WEEKS).toBe(6);
    });
  });

  describe('getGenerationCost', () => {
    it('should calculate cost based on weeks', () => {
      expect(getGenerationCost(4)).toBe(40);
      expect(getGenerationCost(6)).toBe(60);
      expect(getGenerationCost(1)).toBe(10);
    });
  });

  describe('getMaxWeeks', () => {
    it('should return 4 for free tier', () => {
      expect(getMaxWeeks('free', false)).toBe(4);
    });

    it('should return 6 for pro tiers', () => {
      expect(getMaxWeeks('pro_monthly', false)).toBe(6);
      expect(getMaxWeeks('pro_annual', false)).toBe(6);
      expect(getMaxWeeks('lifetime', false)).toBe(6);
    });

    it('should return 6 for admin regardless of tier', () => {
      expect(getMaxWeeks('free', true)).toBe(6);
    });
  });

  describe('isProTier', () => {
    it('should return false for free', () => {
      expect(isProTier('free')).toBe(false);
    });

    it('should return true for pro tiers', () => {
      expect(isProTier('pro_monthly')).toBe(true);
      expect(isProTier('pro_annual')).toBe(true);
      expect(isProTier('lifetime')).toBe(true);
    });
  });

  describe('reserveCredits', () => {
    it('should return success when deduction succeeds', async () => {
      mockFns.deductCredits.mockResolvedValue({ transactionId: 42, newBalance: 60 });

      const result = await reserveCredits('test-id', 40, 'generation', 'Test');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.transactionId).toBe(42);
        expect(result.newBalance).toBe(60);
      }
    });

    it('should return failure on insufficient credits', async () => {
      mockFns.deductCredits.mockRejectedValue(new Error('INSUFFICIENT_CREDITS'));

      const result = await reserveCredits('test-id', 200, 'generation', 'Test');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('INSUFFICIENT_CREDITS');
      }
    });

    it('should succeed for zero-cost operations', async () => {
      const result = await reserveCredits('test-id', 0, 'generation', 'Free op');
      expect(result.success).toBe(true);
    });

    it('should propagate unexpected errors', async () => {
      mockFns.deductCredits.mockRejectedValue(new Error('DB error'));
      await expect(reserveCredits('test-id', 10, 'generation', 'Test')).rejects.toThrow('DB error');
    });
  });

  describe('refundCredits', () => {
    it('should grant credits back with refund metadata', async () => {
      mockFns.grantCredits.mockResolvedValue({ transactionId: 43, newBalance: 100 });

      const result = await refundCredits('test-id', 40, 42, 'Cancelled');

      expect(mockFns.grantCredits).toHaveBeenCalledWith('test-id', 40, 'refund', 'Cancelled', 'refund_of:42');
      expect(result.newBalance).toBe(100);
    });
  });

  describe('canAfford', () => {
    it('should return true when balance sufficient', async () => {
      mockFns.getCreditBalance.mockResolvedValue(100);
      expect(await canAfford('test-id', 40)).toBe(true);
    });

    it('should return false when balance insufficient', async () => {
      mockFns.getCreditBalance.mockResolvedValue(30);
      expect(await canAfford('test-id', 40)).toBe(false);
    });

    it('should return true for zero cost', async () => {
      expect(await canAfford('test-id', 0)).toBe(true);
    });
  });

  describe('grantSignupCredits', () => {
    it('should grant 100 free credits', async () => {
      mockFns.grantCredits.mockResolvedValue({ transactionId: 1, newBalance: 100 });

      const result = await grantSignupCredits('test-id');

      expect(mockFns.grantCredits).toHaveBeenCalledWith('test-id', 100, 'signup_grant', 'Welcome! 100 free credits');
      expect(result.newBalance).toBe(100);
    });
  });

  describe('grantSubscriptionCredits', () => {
    it('should not grant for lifetime users', async () => {
      mockFns.getUser.mockResolvedValue({ id: 'x', subscriptionTier: 'lifetime' });
      const result = await grantSubscriptionCredits('x');
      expect(result.granted).toBe(false);
    });

    it('should not grant for free users', async () => {
      mockFns.getUser.mockResolvedValue({ id: 'x', subscriptionTier: 'free' });
      const result = await grantSubscriptionCredits('x');
      expect(result.granted).toBe(false);
    });

    it('should grant for pro_monthly users', async () => {
      mockFns.getUser.mockResolvedValue({ id: 'x', subscriptionTier: 'pro_monthly', creditsGrantedAt: null });
      mockFns.resetCreditsTo.mockResolvedValue({ transactionId: 1, newBalance: 130 });
      mockFns.updateUser.mockResolvedValue({});

      const result = await grantSubscriptionCredits('x');
      expect(result.granted).toBe(true);
      expect(result.newBalance).toBe(130);
    });

    it('should deduplicate monthly grants', async () => {
      const now = new Date();
      mockFns.getUser.mockResolvedValue({ id: 'x', subscriptionTier: 'pro_monthly', creditsGrantedAt: now });

      const result = await grantSubscriptionCredits('x');
      expect(result.granted).toBe(false);
    });

    it('should not grant when user not found', async () => {
      mockFns.getUser.mockResolvedValue(undefined);
      const result = await grantSubscriptionCredits('nonexistent');
      expect(result.granted).toBe(false);
    });
  });
});
