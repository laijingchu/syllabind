/**
 * Tests for server/lib/stripe.ts
 *
 * Tests the Stripe client factory:
 * - Returns null when STRIPE_SECRET_KEY not set
 * - Returns Stripe instance when key is set
 * - Caches client on subsequent calls
 * - Recreates client when key changes
 */

// Don't use the global mock — we want to test the real module
jest.unmock('../lib/stripe');

// Mock Stripe constructor
const mockStripeInstance = { _isMock: true };
const StripeMock = jest.fn(() => mockStripeInstance);
jest.mock('stripe', () => StripeMock);

describe('getStripeClient', () => {
  let getStripeClient: typeof import('../lib/stripe').getStripeClient;

  beforeEach(() => {
    jest.resetModules();
    StripeMock.mockClear();
    // Re-import to get a fresh module with reset internal state
    delete process.env.STRIPE_SECRET_KEY;
  });

  it('returns null when STRIPE_SECRET_KEY is not set', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const mod = await import('../lib/stripe');
    const result = mod.getStripeClient();
    expect(result).toBeNull();
    expect(StripeMock).not.toHaveBeenCalled();
  });

  it('returns Stripe instance when key is set', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    const mod = await import('../lib/stripe');
    const result = mod.getStripeClient();
    expect(result).toBe(mockStripeInstance);
    expect(StripeMock).toHaveBeenCalledWith('sk_test_123');
  });

  it('caches client on subsequent calls with same key', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_cached';
    const mod = await import('../lib/stripe');

    const first = mod.getStripeClient();
    const second = mod.getStripeClient();

    expect(first).toBe(second);
    // Should only create once
    expect(StripeMock).toHaveBeenCalledTimes(1);
  });

  it('recreates client when key changes', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_old';
    const mod = await import('../lib/stripe');

    mod.getStripeClient();
    expect(StripeMock).toHaveBeenCalledWith('sk_test_old');

    // Change the key
    process.env.STRIPE_SECRET_KEY = 'sk_test_new';
    mod.getStripeClient();
    expect(StripeMock).toHaveBeenCalledWith('sk_test_new');
    expect(StripeMock).toHaveBeenCalledTimes(2);
  });

  it('resets client to null when key is removed', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_temp';
    const mod = await import('../lib/stripe');

    const client = mod.getStripeClient();
    expect(client).toBe(mockStripeInstance);

    // Remove key
    delete process.env.STRIPE_SECRET_KEY;
    const result = mod.getStripeClient();
    expect(result).toBeNull();
  });
});
