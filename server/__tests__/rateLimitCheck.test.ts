// Mock @anthropic-ai/sdk before importing the module under test
const mockCountTokens = jest.fn();
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      countTokens: mockCountTokens,
    },
  }));
});

// Mock claudeClient to provide CLAUDE_MODEL
jest.mock('../utils/claudeClient', () => ({
  CLAUDE_MODEL: 'claude-3-5-haiku-20241022',
}));

import { checkRateLimitStatus, isRateLimitSufficient, RateLimitStatus } from '../utils/rateLimitCheck';

describe('rateLimitCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkRateLimitStatus', () => {
    it('should return ok when API call succeeds', async () => {
      mockCountTokens.mockResolvedValue({ input_tokens: 1 });

      const result = await checkRateLimitStatus();
      expect(result.status).toBe('ok');
      expect(result.message).toContain('Rate limits OK');
    });

    it('should parse 429 rate limit headers', async () => {
      const resetTime = new Date(Date.now() + 60000).toISOString();
      mockCountTokens.mockRejectedValue({
        status: 429,
        headers: {
          'anthropic-ratelimit-requests-remaining': '0',
          'anthropic-ratelimit-requests-limit': '100',
          'anthropic-ratelimit-requests-reset': resetTime,
        },
      });

      const result = await checkRateLimitStatus();
      expect(result.status).toBe('exceeded');
      expect(result.remaining).toBe(0);
      expect(result.limit).toBe(100);
      expect(result.resetTime).toBe(resetTime);
      expect(result.resetIn).toBeGreaterThan(0);
    });

    it('should handle 529 overloaded error', async () => {
      mockCountTokens.mockRejectedValue({ status: 529 });

      const result = await checkRateLimitStatus();
      expect(result.status).toBe('exceeded');
      expect(result.message).toContain('overloaded');
    });

    it('should propagate unknown errors', async () => {
      const unknownError = new Error('Network failure');
      mockCountTokens.mockRejectedValue(unknownError);

      await expect(checkRateLimitStatus()).rejects.toThrow('Network failure');
    });
  });

  describe('isRateLimitSufficient', () => {
    it('should return false when exceeded', () => {
      const status: RateLimitStatus = { status: 'exceeded', message: 'Rate limit exceeded' };
      expect(isRateLimitSufficient(status)).toBe(false);
    });

    it('should return false when remaining < 10', () => {
      const status: RateLimitStatus = { status: 'ok', remaining: 5, message: 'Low' };
      expect(isRateLimitSufficient(status)).toBe(false);
    });

    it('should return true when ok and sufficient remaining', () => {
      const status: RateLimitStatus = { status: 'ok', remaining: 50, message: 'OK' };
      expect(isRateLimitSufficient(status)).toBe(true);
    });

    it('should return true when ok with no remaining info', () => {
      const status: RateLimitStatus = { status: 'ok', message: 'OK' };
      expect(isRateLimitSufficient(status)).toBe(true);
    });
  });
});
