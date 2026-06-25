/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Express } from 'express';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import csrf from 'tiny-csrf';
import crypto from 'crypto';
import { AuthMiddleware } from '@process/webserver/auth/middleware/AuthMiddleware';
import { errorHandler } from './middleware/errorHandler';
import { attachCsrfToken } from './middleware/security';

/**
 * Get or generate CSRF secret
 *
 * CSRF secret must be exactly 32 characters for AES-256-CBC
 *
 * Priority: Environment variable > Random generation (different on each startup)
 */
function getCsrfSecret(): string {
  // Prefer environment variable
  if (process.env.CSRF_SECRET && process.env.CSRF_SECRET.length === 32) {
    return process.env.CSRF_SECRET;
  }

  // Generate random 32-character secret (16 bytes hex encoded)
  const randomSecret = crypto.randomBytes(16).toString('hex');
  console.log('[security] Generated random CSRF secret for this session');
  return randomSecret;
}

// Generate once at module load, remains constant for process lifetime
const CSRF_SECRET = getCsrfSecret();

/**
 * Configure basic middleware for Express app
 */
export function setupBasicMiddleware(app: Express): void {
  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // CSRF Protection using tiny-csrf (CodeQL compliant)
  // Must be applied after cookieParser and before routes.
  // tiny-csrf transports its CSRF token as a *signed* cookie (it sets
  // `cookieParams.signed = true` internally), so cookie-parser MUST be
  // initialised with the same secret - otherwise req.signedCookies is
  // always {} and every protected POST/PUT/DELETE/PATCH throws 500.
  app.use(cookieParser(CSRF_SECRET));
  // P1 Security fix: Enable CSRF for login (frontend already uses withCsrfToken)
  // Only exclude QR login (has its own one-time token protection)
  app.use(
    csrf(
      CSRF_SECRET,
      ['POST', 'PUT', 'DELETE', 'PATCH'], // Protected methods
      ['/login', '/api/auth/qr-login', '/channels/wecom/webhook'], // Excluded: login form, QR login, WeCom server callback (signed by WeCom)
      [] // No service worker URLs
    )
  );
  app.use(attachCsrfToken); // Attach token to response headers

  // Security middleware
  // cspNonceMiddleware MUST run before securityHeadersMiddleware so the CSP header
  // and any server-rendered HTML can share the same per-request nonce.
  app.use(AuthMiddleware.cspNonceMiddleware);
  app.use(AuthMiddleware.securityHeadersMiddleware);
  app.use(AuthMiddleware.requestLoggingMiddleware);
}

/**
 * Configure CORS based on server mode
 */
function normalizeOrigin(origin: string): string | null {
  try {
    const url = new URL(origin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    const portSuffix = url.port ? `:${url.port}` : '';
    return `${url.protocol}//${url.hostname}${portSuffix}`;
  } catch (error) {
    return null;
  }
}

function parseAllowedOriginsEnv(): string[] {
  return (process.env.WAYLAND_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => normalizeOrigin(origin))
    .filter((origin): origin is string => Boolean(origin));
}

function getConfiguredOrigins(port: number, allowRemote: boolean): Set<string> {
  // Localhost is always permitted. Network interface auto-detection was removed
  // because, on coffee-shop wifi / VPN / Docker bridges, it silently exposed the
  // API with `credentials: true` to every routable origin the box could see.
  const baseOrigins = new Set<string>([`http://localhost:${port}`, `http://127.0.0.1:${port}`]);

  const envOrigins = parseAllowedOriginsEnv();

  if (allowRemote) {
    if (envOrigins.length === 0) {
      console.warn(
        '[security] remote mode without WAYLAND_ALLOWED_ORIGINS: only localhost allowed'
      );
    } else {
      // In remote mode, WAYLAND_ALLOWED_ORIGINS is the explicit allowlist.
      for (const origin of envOrigins) {
        baseOrigins.add(origin);
      }
    }
  } else {
    // In local-only mode, the env var still augments the allowlist (e.g. for a
    // user-configured reverse proxy on the same host).
    for (const origin of envOrigins) {
      baseOrigins.add(origin);
    }
  }

  if (process.env.SERVER_BASE_URL) {
    const normalizedBase = normalizeOrigin(process.env.SERVER_BASE_URL);
    if (normalizedBase) {
      baseOrigins.add(normalizedBase);
    }
  }

  return baseOrigins;
}

/**
 * Configure Express `trust proxy` NARROWLY (cross-audit 2026-06-15 R3).
 *
 * `trust proxy: true` is dangerous: it makes `req.ip` / `X-Forwarded-For`
 * spoofable, so a public attacker could forge `X-Forwarded-For: 100.64.0.1` and
 * appear to be operator. We instead trust ONLY explicit private hops - loopback
 * plus any `WAYLAND_OPERATOR_CIDRS` ranges - so that a TLS-terminating reverse
 * proxy on the same host (or an allowlisted private range) can set `req.secure`,
 * while a request whose direct peer is public never has its XFF believed.
 *
 * NOTE: trust classification for the operator gate does NOT rely on this - it
 * reads `req.socket.remoteAddress` directly. This setting only affects
 * `req.ip` / `req.secure` / `req.protocol` derivation for the HTTPS floor.
 */
export function setupTrustProxy(app: Express): void {
  const operatorCidrs = (process.env.WAYLAND_OPERATOR_CIDRS || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  // Express accepts a list of trusted IPs/subnets. Loopback is always a trusted
  // hop (a local reverse proxy); operator CIDRs are opt-in private ranges.
  const trusted = ['loopback', ...operatorCidrs];
  app.set('trust proxy', trusted);
}

export function setupCors(app: Express, port: number, allowRemote: boolean): void {
  const allowedOrigins = getConfiguredOrigins(port, allowRemote);

  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        if (!origin) {
          // Requests like curl or same-origin don't send an Origin header
          callback(null, true);
          return;
        }

        // Reject opaque origins (Origin: null). Sandboxed iframes, srcDoc
        // documents, data: URLs, and file: URLs all send `Origin: null`, and
        // allowing them effectively whitelists any attacker-controlled page
        // that can spawn such a context.
        if (origin === 'null') {
          callback(null, false);
          return;
        }

        const normalizedOrigin = normalizeOrigin(origin);
        if (normalizedOrigin && allowedOrigins.has(normalizedOrigin)) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
    })
  );
}

/**
 * Configure error handling middleware (must be registered last)
 */
export function setupErrorHandler(app: Express): void {
  app.use(errorHandler);
}
