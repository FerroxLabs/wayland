/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Simple in-memory rate limiter middleware without external dependencies
 */

import type { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  message?: string; // Custom error message
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  skip?: (req: Request) => boolean; // Function to skip certain requests
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

type RateLimitMiddleware = ((req: Request, res: Response, next: NextFunction) => void) & {
  destroy: () => void;
};

/**
 * In-memory store for rate limit tracking
 */
class RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 60 seconds.
    // .unref() so the interval does not keep the event loop alive on app
    // shutdown - without it, 5 module-level limiter stores each hold the
    // process open for up to 60s after the user quits.
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    this.cleanupInterval.unref();
  }

  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  set(key: string, value: RateLimitEntry): void {
    this.store.set(key, value);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

/**
 * Create a rate limiter middleware
 */
export function createRateLimiter(config: RateLimitConfig): RateLimitMiddleware {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later',
    keyGenerator = (req: Request) => req.ip || req.socket.remoteAddress || 'unknown',
    skipSuccessfulRequests = false,
    skip = () => false,
  } = config;

  const store = new RateLimitStore();

  const middleware: RateLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    // Skip if configured to skip
    if (skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();

    let entry = store.get(key);

    // Initialize or reset if window expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    // Increment request count
    entry.count++;
    store.set(key, entry);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

    // Check if limit exceeded
    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetTime - now) / 1000).toString());
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
      return;
    }

    // If skipSuccessfulRequests is true, decrement on successful response
    if (skipSuccessfulRequests) {
      res.on('finish', () => {
        if (res.statusCode < 400) {
          const currentEntry = store.get(key);
          if (currentEntry) {
            currentEntry.count = Math.max(0, currentEntry.count - 1);
            store.set(key, currentEntry);
          }
        }
      });
    }

    next();
  };

  // Add cleanup method
  middleware.destroy = () => store.destroy();

  return middleware;
}

/**
 * Predefined rate limiters for common use cases
 */

// Authentication endpoints - strict limit
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true, // Don't count successful logins
});

// API endpoints - moderate limit
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many API requests, please slow down',
});

// File operations - moderate limit
export const fileOperationLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 operations per minute
  message: 'Too many file operations, please slow down',
});

// WebSocket/Streaming - lenient limit
export const streamingLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  message: 'Too many streaming requests, please slow down',
});

// Authenticated user actions - protect sensitive endpoints
export const authenticatedActionLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 actions per minute
  message: 'Too many sensitive actions, please try again later',
  keyGenerator: (req) => {
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `ip:${ip}`;
  },
});
