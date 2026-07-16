/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #808 - loopback ⇒ operator is correct for the local-desktop case (a browser on the
 * same machine hitting the WebUI), but WRONG the moment the app is knowingly fronted by
 * a same-host reverse proxy (the documented Caddy/nginx/cloudflared deployment). There,
 * every request from the public internet arrives with `socket.remoteAddress === 127.0.0.1`
 * - the proxy - so an unconditional loopback grant hands the destructive gate (reset /
 * restore / sandbox-disable / password change) to the entire internet, leaving only
 * auth + step-up password. The network-provenance factor silently contributes nothing.
 *
 * Fix: an OPT-IN declaration, `WAYLAND_TRUSTED_PROXY`. When the operator sets it, loopback
 * stops auto-granting operator (loopback may now be the proxy forwarding a stranger), and
 * operator must be proven another way (WAYLAND_OPERATOR_CIDRS / tailnet arrival), or the
 * destructive action is done from the desktop app over IPC (which is fully trusted and
 * never touches this classifier). Default (unset) is unchanged: no regression for the
 * local-desktop case.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { classifyClientTrust } from '../../src/process/webserver/middleware/networkTrust';

const KEY = 'WAYLAND_TRUSTED_PROXY';
const prior = process.env[KEY];

afterEach(() => {
  if (prior === undefined) delete process.env[KEY];
  else process.env[KEY] = prior;
});

describe('#808 loopback ⇒ operator only when NOT behind a declared trusted proxy', () => {
  it('DEFAULT (no WAYLAND_TRUSTED_PROXY): loopback is operator (local-desktop case)', () => {
    delete process.env[KEY];
    expect(classifyClientTrust('127.0.0.1')).toBe('operator');
    expect(classifyClientTrust('::1')).toBe('operator');
    expect(classifyClientTrust('::ffff:127.0.0.1')).toBe('operator');
  });

  it('WAYLAND_TRUSTED_PROXY=1: loopback is RESTRICTED (may be the proxy forwarding a stranger)', () => {
    process.env[KEY] = '1';
    expect(classifyClientTrust('127.0.0.1')).toBe('restricted');
    expect(classifyClientTrust('127.5.5.5')).toBe('restricted');
    expect(classifyClientTrust('::1')).toBe('restricted');
    expect(classifyClientTrust('::ffff:127.0.0.1')).toBe('restricted');
  });

  it('accepts the usual truthy spellings and treats other values as unset', () => {
    for (const v of ['1', 'true', 'TRUE', 'yes']) {
      process.env[KEY] = v;
      expect(classifyClientTrust('127.0.0.1')).toBe('restricted');
    }
    for (const v of ['0', 'false', '', 'no']) {
      process.env[KEY] = v;
      expect(classifyClientTrust('127.0.0.1')).toBe('operator');
    }
  });

  it('with the proxy declared, a public peer is still restricted (no new grant path)', () => {
    process.env[KEY] = '1';
    expect(classifyClientTrust('8.8.8.8')).toBe('restricted');
    expect(classifyClientTrust('203.0.113.7')).toBe('restricted');
  });

  it('with the proxy declared, an allowlisted CIDR still grants operator (real admin path)', () => {
    const priorCidrs = process.env.WAYLAND_OPERATOR_CIDRS;
    try {
      process.env[KEY] = '1';
      process.env.WAYLAND_OPERATOR_CIDRS = '203.0.113.0/24';
      // The peer the proxy really forwards from (when it presents the client IP as the
      // socket peer, e.g. via a unix-socket-less same-host hop is not this case, but an
      // operator CIDR remains a valid operator proof independent of loopback).
      expect(classifyClientTrust('203.0.113.7')).toBe('operator');
      // Loopback itself stays restricted.
      expect(classifyClientTrust('127.0.0.1')).toBe('restricted');
    } finally {
      if (priorCidrs === undefined) delete process.env.WAYLAND_OPERATOR_CIDRS;
      else process.env.WAYLAND_OPERATOR_CIDRS = priorCidrs;
    }
  });
});
