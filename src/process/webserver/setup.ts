/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Express, Request } from 'express';
import type { IncomingHttpHeaders } from 'http';
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

export type RequestOriginContext = {
  headers: IncomingHttpHeaders;
  protocol?: string;
  rawHeaders?: readonly string[];
  socket: {
    encrypted?: boolean;
    remoteAddress?: string;
  };
};

type RequestHeaderResult = {
  present: boolean;
  value: string | null;
};

function normalizeSingleHeaderValue(value: string): string | null {
  if (value === '' || value !== value.trim() || value.includes(',')) return null;
  return value;
}

function readRequestHeader(req: RequestOriginContext, headerName: string): RequestHeaderResult {
  const normalizedName = headerName.toLowerCase();
  const normalizedEntries = Object.entries(req.headers).filter(
    ([name, value]) => name.toLowerCase() === normalizedName && value !== undefined
  );
  const normalizedPresent = normalizedEntries.length > 0;
  const rawHeaders = req.rawHeaders;

  if (Array.isArray(rawHeaders) && rawHeaders.length > 0) {
    const rawValues: string[] = [];
    for (let index = 0; index + 1 < rawHeaders.length; index += 2) {
      if (rawHeaders[index]?.toLowerCase() === normalizedName) {
        rawValues.push(rawHeaders[index + 1] ?? '');
      }
    }

    const present = normalizedPresent || rawValues.length > 0;
    if (!present) return { present: false, value: null };
    if (rawHeaders.length % 2 !== 0 || rawValues.length !== 1) {
      return { present: true, value: null };
    }
    return { present: true, value: normalizeSingleHeaderValue(rawValues[0]!) };
  }

  if (!normalizedPresent) return { present: false, value: null };
  if (normalizedEntries.length !== 1) return { present: true, value: null };
  const value = normalizedEntries[0]?.[1];
  if (typeof value !== 'string') return { present: true, value: null };
  return { present: true, value: normalizeSingleHeaderValue(value) };
}

export function hasRequestHeader(req: RequestOriginContext, headerName: string): boolean {
  return readRequestHeader(req, headerName).present;
}

export function getSingleRequestHeaderValue(req: RequestOriginContext, headerName: string): string | null {
  return readRequestHeader(req, headerName).value;
}

function parseCanonicalHttpOrigin(origin: string): string | null {
  try {
    const url = new URL(origin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
    return url.origin === origin ? origin : null;
  } catch {
    return null;
  }
}

export function getCanonicalRequestOrigin(req: RequestOriginContext): string | null {
  const origin = getSingleRequestHeaderValue(req, 'origin');
  return origin ? parseCanonicalHttpOrigin(origin) : null;
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
export function deriveTrustedProxyOrigin(req: RequestOriginContext): string | null {
  if (classifyClientTrust(req.socket?.remoteAddress) !== 'operator') {
    return null;
  }

  const forwardedHost = readRequestHeader(req, 'x-forwarded-host');
  if (!forwardedHost.present || !forwardedHost.value) return null;

  const forwardedProto = readRequestHeader(req, 'x-forwarded-proto');
  let scheme: 'http' | 'https';
  if (forwardedProto.present) {
    const proto = forwardedProto.value?.toLowerCase();
    if (proto !== 'http' && proto !== 'https') return null;
    scheme = proto;
  } else if (req.protocol === 'http' || req.protocol === 'https') {
    scheme = req.protocol;
  } else if (req.protocol !== undefined) {
    return null;
  } else {
    scheme = req.socket.encrypted === true ? 'https' : 'http';
  }

  return parseCanonicalHttpOrigin(`${scheme}://${forwardedHost.value}`);
}

export function isRequestOriginTrusted(req: RequestOriginContext, allowedOrigins: Set<string>): boolean {
  const origin = getCanonicalRequestOrigin(req);
  if (!origin) return false;
  return allowedOrigins.has(origin) || deriveTrustedProxyOrigin(req) === origin;
}

/**
 * Build the CORS middleware. Uses the per-request delegate form so the allowlist can
 * be augmented, additively, with the trusted-proxy origin (see deriveTrustedProxyOrigin)
 * on top of the static allowlist (localhost + SERVER_BASE_URL + WAYLAND_ALLOWED_ORIGINS).
 */
export function makeCorsMiddleware(allowedOrigins: Set<string>) {
  return cors<Request>((req, callback) => {
    const hasOrigin = hasRequestHeader(req, 'origin');

    callback(null, {
      credentials: true,
      origin(_origin, cb) {
        if (!hasOrigin) {
          // Requests like curl or same-origin don't send an Origin header
          cb(null, true);
          return;
        }

        cb(null, isRequestOriginTrusted(req, allowedOrigins));
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
