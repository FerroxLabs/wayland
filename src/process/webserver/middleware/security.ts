/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  SECURITY_CONFIG,
  getCookieOptions,
} from '@process/webserver/config/constants';

/**
 * Rate-limit for sensitive operations like login/register
 */
export const authRateLimiter = rateLimit({
  standardHeaders: true,
  legacyHeaders: false,
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.',
  },
  skipSuccessfulRequests: true,
});

/**
 * Rate-limit for general API requests
 */
export const apiRateLimiter = rateLimit({
  standardHeaders: true,
  legacyHeaders: false,
  windowMs: 60 * 1000,
  max: 60,
  message: {
    error: 'Too many API requests, please slow down.',
  },
});

/**
 * Rate-limit for file-browsing and similar operations
 */
export const fileOperationLimiter = rateLimit({
  standardHeaders: true,
  legacyHeaders: false,
  windowMs: 60 * 1000,
  max: 30,
  message: {
    error: 'Too many file operations, please slow down.',
  },
});

/**
 * Rate-limit for sensitive actions by authenticated users (keyed by user ID, falling back to IP)
 */
export const authenticatedActionLimiter = rateLimit({
  standardHeaders: true,
  legacyHeaders: false,
  windowMs: 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: 'Too many sensitive actions, please try again later.',
  },
  keyGenerator: (req: Request) => {
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }
    return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
  },
});

/**
 * Attach CSRF token to response for client-side usage
 * tiny-csrf provides req.csrfToken() method to generate tokens
 */
export function attachCsrfToken(req: Request, res: Response, next: NextFunction): void {
  // tiny-csrf provides req.csrfToken() method
  if (typeof req.csrfToken === 'function') {
    const token = req.csrfToken();
    if (token) {
      res.setHeader(CSRF_HEADER_NAME, token);
      // tiny-csrf itself only ever validates `req.body._csrf` - the header above
      // was write-only (nothing ever read it back into a follow-up request).
      // Mirror it into a JS-readable (non-httpOnly) cookie so csrfClient.ts's
      // getCsrfToken() can actually retrieve it and echo it back as `_csrf` on
      // the next mutating request. Without this, every WebUI/headless POST
      // (including the knowledge wizard's desktop-fallback fetch) always sent
      // an empty `_csrf` and tiny-csrf rejected it (#681).
      res.cookie(CSRF_COOKIE_NAME, token, { ...getCookieOptions(req), httpOnly: false });
      res.locals.csrfToken = token;
    }
  }
  next();
}

/**
 * Generic rate-limiter factory for use cases like static routes
 */
export function createRateLimiter(options: Parameters<typeof rateLimit>[0]) {
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  });
}
