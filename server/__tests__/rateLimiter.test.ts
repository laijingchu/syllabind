/**
 * Tests for server/utils/rateLimiter.ts
 *
 * Tests the in-memory sliding-window rate limiter:
 * - Requests under limit pass through
 * - Request at limit returns 429
 * - Different IPs tracked independently
 */

// Mock the audit module to prevent PostHog calls
jest.mock('../lib/audit', () => ({
  logSecurity: jest.fn(),
  logEvent: jest.fn(),
}));

import { createRateLimiter } from '../utils/rateLimiter';
import type { Request, Response, NextFunction } from 'express';

function createMockReqRes(ip = '127.0.0.1', path = '/test') {
  const req = {
    ip,
    socket: { remoteAddress: ip },
    path,
  } as unknown as Request;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  const next = jest.fn() as NextFunction;

  return { req, res, next };
}

describe('createRateLimiter', () => {
  it('allows requests under the limit', () => {
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 3 });

    const { req, res, next } = createMockReqRes();
    limiter(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('allows multiple requests up to the limit', () => {
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 3 });

    for (let i = 0; i < 3; i++) {
      const { req, res, next } = createMockReqRes();
      limiter(req, res, next);
      expect(next).toHaveBeenCalled();
    }
  });

  it('returns 429 when limit is exceeded', () => {
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 2 });

    // Use up the limit
    for (let i = 0; i < 2; i++) {
      const { req, res, next } = createMockReqRes();
      limiter(req, res, next);
    }

    // Next request should be blocked
    const { req, res, next } = createMockReqRes();
    limiter(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Too many requests. Please try again later.',
    });
  });

  it('tracks different IPs independently', () => {
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 1 });

    // First IP uses its limit
    const r1 = createMockReqRes('10.0.0.1');
    limiter(r1.req, r1.res, r1.next);
    expect(r1.next).toHaveBeenCalled();

    // Second IP should still be allowed
    const r2 = createMockReqRes('10.0.0.2');
    limiter(r2.req, r2.res, r2.next);
    expect(r2.next).toHaveBeenCalled();

    // First IP should be blocked
    const r3 = createMockReqRes('10.0.0.1');
    limiter(r3.req, r3.res, r3.next);
    expect(r3.next).not.toHaveBeenCalled();
    expect(r3.res.status).toHaveBeenCalledWith(429);
  });

  it('logs security event when rate limit exceeded', () => {
    const { logSecurity } = require('../lib/audit');
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 1 });

    // Use up the limit
    const r1 = createMockReqRes('192.168.1.1', '/api/login');
    limiter(r1.req, r1.res, r1.next);

    // Trigger rate limit
    const r2 = createMockReqRes('192.168.1.1', '/api/login');
    limiter(r2.req, r2.res, r2.next);

    expect(logSecurity).toHaveBeenCalledWith('rate_limit_exceeded', {
      ip: '192.168.1.1',
      path: '/api/login',
    });
  });

  it('uses remoteAddress as fallback when ip is undefined', () => {
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 1 });

    const req = {
      ip: undefined,
      socket: { remoteAddress: '10.0.0.5' },
      path: '/test',
    } as unknown as Request;

    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const next = jest.fn();

    limiter(req, res, next);
    expect(next).toHaveBeenCalled();

    // Same remoteAddress should be tracked
    const next2 = jest.fn();
    limiter(req, res, next2);
    expect(next2).not.toHaveBeenCalled();
  });
});
