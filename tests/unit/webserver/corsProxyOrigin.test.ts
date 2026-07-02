/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request } from 'express';
import { deriveTrustedProxyOrigin, getConfiguredOrigins, makeCorsMiddleware } from '@process/webserver/setup';

/**
 * #524 - a self-hosted server behind a reverse TLS proxy (e.g. Caddy on the same
 * host) must get its public origin CORS-allowed WITHOUT the operator setting
 * SERVER_BASE_URL / WAYLAND_ALLOWED_ORIGINS, but ONLY when the request arrived via a
 * trusted proxy hop. A public peer spoofing X-Forwarded-Host must NOT be trusted.
 */

const PORT = 25808;

type HeaderBag = Record<string, string | string[] | undefined>;

function restoreEnv(k: string, v: string | undefined): void {
  if (v === undefined) delete process.env[k];
  else process.env[k] = v;
}

function fakeReq(opts: {
  origin?: string;
  method?: string;
  remoteAddress?: string;
  headers?: HeaderBag;
  protocol?: string;
}): Request {
  const headers: HeaderBag = { ...opts.headers };
  if (opts.origin !== undefined) headers.origin = opts.origin;
  return {
    method: opts.method ?? 'POST',
    headers,
    protocol: opts.protocol ?? 'http',
    socket: { remoteAddress: opts.remoteAddress },
  } as unknown as Request;
}

/** Minimal res double capturing headers the cors middleware sets. */
function fakeRes() {
  const store = new Map<string, string>();
  return {
    statusCode: 200,
    setHeader(key: string, value: string) {
      store.set(key.toLowerCase(), value);
    },
    getHeader(key: string) {
      return store.get(key.toLowerCase());
    },
    end() {},
  };
}

/**
 * Run the real cors middleware for a request and return the resolved
 * Access-Control-Allow-Origin header (undefined if the origin was rejected).
 */
function runCors(allowed: Set<string>, req: Request): string | undefined {
  const mw = makeCorsMiddleware(allowed);
  const res = fakeRes();
  const next = vi.fn();
  // cors resolves the delegate synchronously here (our origin fn is sync).
  mw(req as never, res as never, next as never);
  return res.getHeader('access-control-allow-origin');
}

describe('#524 CORS trusted-proxy forwarded-origin', () => {
  const savedCidrs = process.env.WAYLAND_OPERATOR_CIDRS;
  const savedBase = process.env.SERVER_BASE_URL;
  const savedAllowed = process.env.WAYLAND_ALLOWED_ORIGINS;

  beforeEach(() => {
    delete process.env.WAYLAND_OPERATOR_CIDRS;
    delete process.env.SERVER_BASE_URL;
    delete process.env.WAYLAND_ALLOWED_ORIGINS;
  });
  afterEach(() => {
    restoreEnv('WAYLAND_OPERATOR_CIDRS', savedCidrs);
    restoreEnv('SERVER_BASE_URL', savedBase);
    restoreEnv('WAYLAND_ALLOWED_ORIGINS', savedAllowed);
  });

  it('(a) trusted loopback proxy + X-Forwarded-Host, no SERVER_BASE_URL -> forwarded origin is allowed (ACAO present)', () => {
    const allowed = getConfiguredOrigins(PORT, false); // no env set
    const req = fakeReq({
      origin: 'https://wayland.customer.com',
      remoteAddress: '127.0.0.1', // Caddy on the same host = trusted loopback hop
      headers: {
        'x-forwarded-host': 'wayland.customer.com',
        'x-forwarded-proto': 'https',
      },
    });

    // The derived origin exactly matches the public origin, nothing wildcarded.
    expect(deriveTrustedProxyOrigin(req)).toBe('https://wayland.customer.com');
    expect(runCors(allowed, req)).toBe('https://wayland.customer.com');
  });

  it('(b) untrusted public peer spoofing X-Forwarded-Host -> NOT allowed (no ACAO)', () => {
    const allowed = getConfiguredOrigins(PORT, true); // remote mode, no allowlist env
    const req = fakeReq({
      origin: 'https://evil.example.com',
      remoteAddress: '203.0.113.7', // public direct peer, NOT a trusted proxy
      headers: {
        'x-forwarded-host': 'evil.example.com',
        'x-forwarded-proto': 'https',
      },
    });

    // Direct peer is untrusted, so the forwarded header is never believed.
    expect(deriveTrustedProxyOrigin(req)).toBeNull();
    expect(runCors(allowed, req)).toBeUndefined();
  });

  it('(c) SERVER_BASE_URL still works (explicit allowlist preserved, additive)', () => {
    process.env.SERVER_BASE_URL = 'https://explicit.customer.com';
    const allowed = getConfiguredOrigins(PORT, true);
    const req = fakeReq({
      origin: 'https://explicit.customer.com',
      remoteAddress: '203.0.113.9', // even a public peer: matched via static allowlist
    });
    expect(runCors(allowed, req)).toBe('https://explicit.customer.com');
  });

  it('does not believe X-Forwarded-Host when the loopback proxy did not set one', () => {
    const allowed = getConfiguredOrigins(PORT, false);
    const req = fakeReq({
      origin: 'https://wayland.customer.com',
      remoteAddress: '127.0.0.1',
      // no x-forwarded-host header
    });
    expect(deriveTrustedProxyOrigin(req)).toBeNull();
    expect(runCors(allowed, req)).toBeUndefined();
  });

  it('rejects a MULTI-VALUED X-Forwarded-Host from a trusted hop (client-injected leftmost token not picked)', () => {
    const allowed = getConfiguredOrigins(PORT, false);
    // A client pre-seeded evil.com and the proxy appended the real host.
    const commaJoined = fakeReq({
      origin: 'https://evil.example.com',
      remoteAddress: '127.0.0.1',
      headers: {
        'x-forwarded-host': 'evil.example.com, wayland.customer.com',
        'x-forwarded-proto': 'https',
      },
    });
    expect(deriveTrustedProxyOrigin(commaJoined)).toBeNull();
    expect(runCors(allowed, commaJoined)).toBeUndefined();

    // Repeated header (array form) is likewise not a single trusted hop.
    const repeated = fakeReq({
      origin: 'https://evil.example.com',
      remoteAddress: '127.0.0.1',
      headers: {
        'x-forwarded-host': ['evil.example.com', 'wayland.customer.com'],
        'x-forwarded-proto': 'https',
      },
    });
    expect(deriveTrustedProxyOrigin(repeated)).toBeNull();
    expect(runCors(allowed, repeated)).toBeUndefined();
  });

  it('defaults scheme to the trusted req.protocol when X-Forwarded-Proto is absent', () => {
    const req = fakeReq({
      origin: 'http://wayland.customer.com',
      remoteAddress: '127.0.0.1',
      protocol: 'http',
      headers: { 'x-forwarded-host': 'wayland.customer.com' },
    });
    expect(deriveTrustedProxyOrigin(req)).toBe('http://wayland.customer.com');
  });

  it('localhost origin still works and Origin: null is rejected', () => {
    const allowed = getConfiguredOrigins(PORT, false);
    expect(runCors(allowed, fakeReq({ origin: `http://localhost:${PORT}`, remoteAddress: '127.0.0.1' }))).toBe(
      `http://localhost:${PORT}`
    );
    expect(runCors(allowed, fakeReq({ origin: 'null', remoteAddress: '127.0.0.1' }))).toBeUndefined();
  });
});
