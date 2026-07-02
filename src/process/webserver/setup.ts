/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Express, Request } from 'express';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import csrf from 'tiny-csrf';
import crypto from 'crypto';
import { AuthMiddleware } from '@process/webserver/auth/middleware/AuthMiddleware';
import { classifyClientTrust } from '@process/webserver/middleware/networkTrust';
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

export function getConfiguredOrigins(port: number, allowRemote: boolean): Set<string> {
  // Localhost is always permitted. Network interface auto-detection was removed
  // because, on coffee-shop wifi / VPN / Docker bridges, it silently exposed the
  // API with `credentials: true` to every routable origin the box could see.
  const baseOrigins = new Set<string>([`http://localhost:${port}`, `http://127.0.0.1:${port}`]);

  const envOrigins = parseAllowedOriginsEnv();

  if (allowRemote) {
    if (envOrigins.length === 0) {
      console.warn('[security] remote mode without WAYLAND_ALLOWED_ORIGINS: only localhost allowed');
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

/**
 * Read a SINGLE-valued forwarded header. The only topology whose forwarded headers
 * we believe is a single trusted hop (see deriveTrustedProxyOrigin), which sets
 * exactly one value. A comma-joined or repeated header means a multi-hop chain or a
 * client-supplied value the proxy appended/preserved - and the leftmost token is the
 * LEAST-trusted (client) end, so we must NOT pick it. We fail closed to undefined and
 * let the operator use SERVER_BASE_URL for genuine multi-hop deployments.
 */
function singleForwardedValue(header: string | string[] | undefined): string | undefined {
  // A repeated header (Express joins duplicates with ', ') arrives as a string
  // for most headers, but some can be arrays - reject anything that isn't one entry.
  let raw: string | undefined;
  if (Array.isArray(header)) {
    if (header.length !== 1) return undefined;
    raw = header[0];
  } else {
    raw = header;
  }
  if (!raw || raw.includes(',')) return undefined;
  const value = raw.trim();
  return value || undefined;
}

/**
 * Derive the public origin a TRUSTED reverse proxy is fronting, from its forwarded
 * headers, so a TLS-terminated self-hosted deploy (e.g. Caddy on the same host)
 * gets its public origin CORS-allowed OUT OF THE BOX - without the operator having
 * to set SERVER_BASE_URL / WAYLAND_ALLOWED_ORIGINS (#524).
 *
 * SECURITY (trust model): the forwarded headers are believed ONLY when the request's
 * DIRECT socket peer is a trusted proxy - loopback, Tailscale CGNAT, or an opt-in
 * `WAYLAND_OPERATOR_CIDRS` range - per `classifyClientTrust(req.socket.remoteAddress)`,
 * the same non-spoofable gate the operator-trust model uses. Trust is read from the
 * raw socket peer, NEVER from `req.ip`/XFF (which a public attacker can forge).
 *
 * A request whose direct peer is public (someone hitting the app port directly, or a
 * reverse proxy we do not trust) NEVER has its `X-Forwarded-Host` believed, so an
 * attacker cannot self-allowlist an origin. This returns a SINGLE normalized origin
 * (never a wildcard) that is then matched against the request's browser-set `Origin`.
 *
 * Note: behind a loopback proxy the DIRECT peer is always the proxy, so every proxied
 * request classifies `operator`; the real per-request gate is then the `Origin` match
 * plus the single-value requirement below - a browser cannot forge `X-Forwarded-Host`
 * on a cross-origin credentialed request (the preflight OPTIONS never carries it).
 */
export function deriveTrustedProxyOrigin(req: Request): string | null {
  if (classifyClientTrust(req.socket?.remoteAddress) !== 'operator') {
    return null;
  }

  const host = singleForwardedValue(req.headers['x-forwarded-host']);
  if (!host) return null;

  const proto = singleForwardedValue(req.headers['x-forwarded-proto'])?.toLowerCase();
  const scheme = proto === 'http' || proto === 'https' ? proto : req.protocol || 'https';
  return normalizeOrigin(`${scheme}://${host}`);
}

/**
 * Build the CORS middleware. Uses the per-request delegate form so the allowlist can
 * be augmented, additively, with the trusted-proxy origin (see deriveTrustedProxyOrigin)
 * on top of the static allowlist (localhost + SERVER_BASE_URL + WAYLAND_ALLOWED_ORIGINS).
 */
export function makeCorsMiddleware(allowedOrigins: Set<string>) {
  return cors<Request>((req, callback) => {
    // Per-request: only widens for a request that arrived via a trusted proxy.
    const forwardedOrigin = deriveTrustedProxyOrigin(req);

    callback(null, {
      credentials: true,
      origin(origin, cb) {
        if (!origin) {
          // Requests like curl or same-origin don't send an Origin header
          cb(null, true);
          return;
        }

        // Reject opaque origins (Origin: null). Sandboxed iframes, srcDoc
        // documents, data: URLs, and file: URLs all send `Origin: null`, and
        // allowing them effectively whitelists any attacker-controlled page
        // that can spawn such a context.
        if (origin === 'null') {
          cb(null, false);
          return;
        }

        const normalizedOrigin = normalizeOrigin(origin);
        if (normalizedOrigin && (allowedOrigins.has(normalizedOrigin) || normalizedOrigin === forwardedOrigin)) {
          cb(null, true);
          return;
        }

        cb(null, false);
      },
    });
  });
}

export function setupCors(app: Express, port: number, allowRemote: boolean): void {
  const allowedOrigins = getConfiguredOrigins(port, allowRemote);
  app.use(makeCorsMiddleware(allowedOrigins));
}

/**
 * Configure error handling middleware (must be registered last)
 */
export function setupErrorHandler(app: Express): void {
  app.use(errorHandler);
}
