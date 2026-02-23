import type { Request, Response, NextFunction } from "express";
import { logSecurity } from "../lib/audit";

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

/**
 * Simple in-memory sliding-window rate limiter per IP.
 * Not suitable for multi-process deployments — use Redis-backed limiter instead.
 */
export function createRateLimiter({ windowMs, maxRequests }: RateLimiterOptions) {
  const hits = new Map<string, number[]>();

  // Periodically clean up old entries to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    hits.forEach((timestamps, key) => {
      const valid = timestamps.filter((t: number) => now - t < windowMs);
      if (valid.length === 0) {
        hits.delete(key);
      } else {
        hits.set(key, valid);
      }
    });
  }, windowMs);
  cleanupInterval.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const timestamps = (hits.get(ip) || []).filter(t => now - t < windowMs);

    if (timestamps.length >= maxRequests) {
      logSecurity("rate_limit_exceeded", { ip, path: req.path });
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }

    timestamps.push(now);
    hits.set(ip, timestamps);
    next();
  };
}
