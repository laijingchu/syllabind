/**
 * Tests for server/utils/requestQueue.ts
 *
 * Tests the sliding-window rate limiter for API requests:
 * - Immediate acquisition when under limit
 * - Queuing when at limit
 * - Cleanup of expired timestamps
 * - Drain processes pending queue
 */

// We need to test the class directly, not the singleton.
// Re-implement the import to get fresh instances.
jest.useFakeTimers();

// Unmock db since requestQueue doesn't use it
jest.unmock('../storage');

describe('RequestQueue', () => {
  let RequestQueueClass: any;

  beforeAll(async () => {
    // Dynamically import to get the module
    const mod = await import('../utils/requestQueue');
    // The module only exports `apiQueue` (a singleton), so we test via that pattern.
    // But we need a fresh instance per test. We'll use the exported singleton for basic tests
    // and rely on fake timers for queue behavior.
    RequestQueueClass = mod;
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('acquires immediately when under the limit', async () => {
    const { apiQueue } = RequestQueueClass;
    // The queue allows 40 per minute. First call should resolve immediately.
    const promise = apiQueue.acquire();
    // Should resolve synchronously (no timer needed)
    await expect(promise).resolves.toBeUndefined();
  });

  it('queues requests when at the limit and resolves after drain', async () => {
    // We need a fresh module to get a clean queue
    jest.resetModules();

    // Re-mock things that jest.setup.js mocks but resetModules clears
    jest.mock('../../server/db', () => ({
      db: {}, pool: { connect: jest.fn(), query: jest.fn(), end: jest.fn() }
    }));

    const mod = await import('../utils/requestQueue');
    const queue = mod.apiQueue;

    // Fill up to the limit (40 requests)
    const acquirePromises: Promise<void>[] = [];
    for (let i = 0; i < 40; i++) {
      acquirePromises.push(queue.acquire());
    }
    // All 40 should resolve immediately
    await Promise.all(acquirePromises);

    // 41st request should be queued
    let resolved = false;
    const pending = queue.acquire().then(() => { resolved = true; });

    // Should not be resolved yet
    expect(resolved).toBe(false);

    // Advance time by 60 seconds to expire the oldest timestamps
    jest.advanceTimersByTime(61_000);

    // Now the drain timer should fire and resolve the pending request
    await pending;
    expect(resolved).toBe(true);
  });

  it('drains multiple pending requests as capacity opens', async () => {
    jest.resetModules();
    jest.mock('../../server/db', () => ({
      db: {}, pool: { connect: jest.fn(), query: jest.fn(), end: jest.fn() }
    }));

    const mod = await import('../utils/requestQueue');
    const queue = mod.apiQueue;

    // Fill to limit
    for (let i = 0; i < 40; i++) {
      await queue.acquire();
    }

    // Queue 3 more
    let resolved1 = false, resolved2 = false, resolved3 = false;
    queue.acquire().then(() => { resolved1 = true; });
    queue.acquire().then(() => { resolved2 = true; });
    queue.acquire().then(() => { resolved3 = true; });

    // None resolved yet
    expect(resolved1).toBe(false);
    expect(resolved2).toBe(false);
    expect(resolved3).toBe(false);

    // Advance past the window to expire all timestamps
    jest.advanceTimersByTime(61_000);

    // Let promises settle
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    // All 3 should now be resolved since all 40 timestamps expired
    expect(resolved1).toBe(true);
    expect(resolved2).toBe(true);
    expect(resolved3).toBe(true);
  });
});
