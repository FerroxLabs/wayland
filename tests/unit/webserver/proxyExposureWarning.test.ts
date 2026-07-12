/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #830 - when a same-host reverse proxy forwards public traffic (loopback peer +
 * X-Forwarded-Host) and the operator has NOT declared WAYLAND_TRUSTED_PROXY, loopback
 * still auto-grants operator (the #808 exposure) and deriveTrustedProxyOrigin believes
 * the forwarded host. Warn ONCE. When the proxy IS declared (loopback demoted) or the
 * operator peer is a genuine tailnet/CIDR proxy, do not warn.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request } from 'express';
import { deriveTrustedProxyOrigin, _resetProxyExposureWarningForTests } from '@process/webserver/setup';

const priorTrusted = process.env.WAYLAND_TRUSTED_PROXY;
const priorCidrs = process.env.WAYLAND_OPERATOR_CIDRS;

function makeReq(remoteAddress: string): Request {
  return {
    protocol: 'https',
    socket: { remoteAddress, localAddress: remoteAddress },
    headers: { 'x-forwarded-host': 'box.example.com', 'x-forwarded-proto': 'https' },
  } as unknown as Request;
}

beforeEach(() => {
  _resetProxyExposureWarningForTests();
  delete process.env.WAYLAND_TRUSTED_PROXY;
  delete process.env.WAYLAND_OPERATOR_CIDRS;
});

afterEach(() => {
  vi.restoreAllMocks();
  if (priorTrusted === undefined) delete process.env.WAYLAND_TRUSTED_PROXY;
  else process.env.WAYLAND_TRUSTED_PROXY = priorTrusted;
  if (priorCidrs === undefined) delete process.env.WAYLAND_OPERATOR_CIDRS;
  else process.env.WAYLAND_OPERATOR_CIDRS = priorCidrs;
});

describe('#830 undeclared-proxy exposure warning', () => {
  it('warns ONCE when a loopback peer forwards a host and WAYLAND_TRUSTED_PROXY is unset', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const origin = deriveTrustedProxyOrigin(makeReq('127.0.0.1'));
    expect(origin).toBe('https://box.example.com'); // still derived (behavior unchanged)

    const hits = warn.mock.calls.filter((c) => String(c[0]).includes('WAYLAND_TRUSTED_PROXY'));
    expect(hits).toHaveLength(1);

    // Second forwarded request must NOT warn again (once per process).
    deriveTrustedProxyOrigin(makeReq('127.0.0.1'));
    const hits2 = warn.mock.calls.filter((c) => String(c[0]).includes('WAYLAND_TRUSTED_PROXY'));
    expect(hits2).toHaveLength(1);
  });

  it('does NOT warn when WAYLAND_TRUSTED_PROXY is declared (loopback already demoted)', () => {
    process.env.WAYLAND_TRUSTED_PROXY = '1';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // With the proxy declared, loopback is no longer operator, so no origin is derived.
    expect(deriveTrustedProxyOrigin(makeReq('127.0.0.1'))).toBeNull();
    expect(warn.mock.calls.some((c) => String(c[0]).includes('WAYLAND_TRUSTED_PROXY'))).toBe(false);
  });

  it('does NOT warn when the proxy IS declared but loopback was re-allowlisted (footgun path)', () => {
    // The CIDR-loopback footgun (#830): WAYLAND_OPERATOR_CIDRS re-grants loopback => operator,
    // so a loopback peer reaches the warn site even with the proxy declared. The warning
    // ("set WAYLAND_TRUSTED_PROXY") would be wrong here - it is already set - so suppress it.
    process.env.WAYLAND_TRUSTED_PROXY = '1';
    process.env.WAYLAND_OPERATOR_CIDRS = '127.0.0.0/8';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(deriveTrustedProxyOrigin(makeReq('127.0.0.1'))).toBe('https://box.example.com');
    expect(warn.mock.calls.some((c) => String(c[0]).includes('WAYLAND_TRUSTED_PROXY'))).toBe(false);
  });

  it('does NOT warn for a genuine allowlisted (non-loopback) operator proxy', () => {
    process.env.WAYLAND_OPERATOR_CIDRS = '203.0.113.0/24';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const origin = deriveTrustedProxyOrigin(makeReq('203.0.113.7'));
    expect(origin).toBe('https://box.example.com'); // trusted proxy, origin derived
    expect(warn.mock.calls.some((c) => String(c[0]).includes('WAYLAND_TRUSTED_PROXY'))).toBe(false);
  });
});
