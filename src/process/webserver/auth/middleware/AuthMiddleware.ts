/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { AuthService } from '../service/AuthService';
import { createAuthMiddleware } from './TokenMiddleware';
import { SECURITY_CONFIG } from '../../config/constants';

const loginInputSchema = z.object({
  username: z.string().min(1).max(32),
  password: z.string().min(1).max(128),
});

const registerInputSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// Express Request type extension is defined in src/types/express.d.ts

/**
 * Authentication middleware class
 */
export class AuthMiddleware {
  private static readonly jsonAuthMiddleware = createAuthMiddleware('json');

  /**
   * JWT authentication middleware
   */
  public static authenticateToken(req: Request, res: Response, next: NextFunction): void {
    AuthMiddleware.jsonAuthMiddleware(req, res, next);
  }

  /**
   * Per-request CSP nonce middleware.
   *
   * Mints a cryptographically random nonce and exposes it on res.locals.cspNonce
   * so downstream middleware can (a) include it in the Content-Security-Policy
   * header and (b) inject it into any server-rendered inline <script> tags.
   *
   * Must run BEFORE securityHeadersMiddleware.
   */
  public static cspNonceMiddleware(_req: Request, res: Response, next: NextFunction): void {
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
    next();
  }

  /**
   * Security headers middleware
   */
  public static securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction): void {
    // Prevent clickjacking
    res.header('X-Frame-Options', SECURITY_CONFIG.HEADERS.FRAME_OPTIONS);

    // Prevent MIME type sniffing
    res.header('X-Content-Type-Options', SECURITY_CONFIG.HEADERS.CONTENT_TYPE_OPTIONS);

    // Enable XSS protection
    res.header('X-XSS-Protection', SECURITY_CONFIG.HEADERS.XSS_PROTECTION);

    // Referrer policy
    res.header('Referrer-Policy', SECURITY_CONFIG.HEADERS.REFERRER_POLICY);

    // Content Security Policy: nonce-gated inline scripts (no 'unsafe-inline').
    // Falls back to a freshly minted nonce if cspNonceMiddleware was skipped.
    const nonce =
      typeof res.locals.cspNonce === 'string' && res.locals.cspNonce.length > 0
        ? (res.locals.cspNonce as string)
        : crypto.randomBytes(16).toString('base64');
    if (res.locals.cspNonce !== nonce) {
      res.locals.cspNonce = nonce;
    }

    const isDevelopment = process.env.NODE_ENV === 'development';
    const cspPolicy = isDevelopment
      ? SECURITY_CONFIG.HEADERS.buildCspDev(nonce)
      : SECURITY_CONFIG.HEADERS.buildCspProd(nonce);

    res.header('Content-Security-Policy', cspPolicy);

    next();
  }

  /**
   * Request logging middleware
   */
  public static requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Only log API requests; skip Vite module / static asset requests to reduce noise
    const url = req.url;
    if (!url.startsWith('/api/') && !url.startsWith('/login')) {
      next();
      return;
    }

    const start = Date.now();
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    console.log(`[${new Date().toISOString()}] ${req.method} ${url} - ${ip}`);

    // Log response time
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${url} - ${res.statusCode} - ${duration}ms`);
    });

    next();
  }

  /**
   * Input validation middleware for login
   */
  public static validateLoginInput(req: Request, res: Response, next: NextFunction): void {
    const body = (req.body ?? {}) as { username?: unknown; password?: unknown };

    // Preserve original error response shape and message ordering:
    // missing fields → "required", wrong type → "must be strings", too long → "Invalid input length".
    if (body.username === undefined || body.username === null || body.username === '' || body.password === undefined || body.password === null || body.password === '') {
      res.status(400).json({
        success: false,
        error: 'Username and password are required.',
      });
      return;
    }

    if (typeof body.username !== 'string' || typeof body.password !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Username and password must be strings.',
      });
      return;
    }

    const result = loginInputSchema.safeParse(body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input length.',
      });
      return;
    }

    next();
  }

  /**
   * Input validation middleware for registration
   */
  public static validateRegisterInput(req: Request, res: Response, next: NextFunction): void {
    const parsed = registerInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Username and password are required.',
      });
      return;
    }
    const { username, password } = parsed.data;

    // Validate username
    const usernameValidation = AuthService.validateUsername(username);
    if (!usernameValidation.isValid) {
      res.status(400).json({
        success: false,
        error: 'Invalid username.',
        details: usernameValidation.errors,
      });
      return;
    }

    // Validate password strength
    const passwordValidation = AuthService.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        error: 'Password does not meet security requirements.',
        details: passwordValidation.errors,
      });
      return;
    }

    next();
  }
}

export default AuthMiddleware;
