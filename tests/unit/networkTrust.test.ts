/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { classifyClientTrust, isPrivateNetworkIp } from '../../src/process/webserver/middleware/networkTrust';

describe('networkTrust - private-network classification (#83)', () => {
  it('treats loopback (v4 + v6 + mapped) as operator', () => {
    expect(classifyClientTrust('127.0.0.1')).toBe('operator');
    expect(classifyClientTrust('127.5.5.5')).toBe('operator');
    expect(classifyClientTrust('::1')).toBe('operator');
    expect(classifyClientTrust('::ffff:127.0.0.1')).toBe('operator');
  });

  it('treats bare RFC1918 LAN ranges as restricted by default (operator only via allowlist, R4)', () => {
    // Cross-audit 2026-06-15 R4: broad RFC1918 is NOT operator by default - on a
    // cloud VPS it covers the VPC/Docker-bridge/metadata net. Operators opt a
    // trusted LAN back in via WAYLAND_OPERATOR_CIDRS (see the allowlist test).
    expect(classifyClientTrust('10.0.0.4')).toBe('restricted');
    expect(classifyClientTrust('192.168.1.50')).toBe('restricted');
    expect(classifyClientTrust('172.16.0.1')).toBe('restricted');
    expect(classifyClientTrust('172.31.255.254')).toBe('restricted');
    expect(classifyClientTrust('172.32.0.1')).toBe('restricted');
    expect(classifyClientTrust('172.15.0.1')).toBe('restricted');
  });

  // 100.64.0.0/10 is RFC 6598 carrier-grade NAT space, NOT a Tailscale identity, so
  // membership alone is no longer enough: the connection must have ARRIVED over the
  // tailnet (#529). With no local address to prove that, a CGNAT peer FAILS CLOSED.
  // The arrival-based cases live in tests/unit/webserver/networkTrust.test.ts, which
  // mocks the host's interfaces; this file stays hermetic and asserts the fail-closed
  // contract only.
  it('treats a CGNAT peer (100.64.0.0/10) as restricted when arrival cannot be proven', () => {
    expect(classifyClientTrust('100.105.198.32')).toBe('restricted');
    expect(classifyClientTrust('100.64.0.0')).toBe('restricted');
    expect(classifyClientTrust('100.127.255.255')).toBe('restricted');
    // 100.128 is OUTSIDE the /10 - public. 100.63 is below it - public.
    expect(classifyClientTrust('100.128.0.1')).toBe('restricted');
    expect(classifyClientTrust('100.63.0.1')).toBe('restricted');
  });

  it('treats link-local + IPv6 unique-local as restricted by default', () => {
    expect(classifyClientTrust('169.254.1.1')).toBe('restricted');
    expect(classifyClientTrust('fe80::1')).toBe('restricted');
    expect(classifyClientTrust('fd00::1')).toBe('restricted');
    expect(classifyClientTrust('fc00::1')).toBe('restricted');
  });

  it('escalates an allowlisted LAN range to operator via WAYLAND_OPERATOR_CIDRS (R4)', () => {
    const prev = process.env.WAYLAND_OPERATOR_CIDRS;
    try {
      process.env.WAYLAND_OPERATOR_CIDRS = '10.0.0.0/8, 192.168.1.0/24';
      expect(classifyClientTrust('10.0.0.4')).toBe('operator');
      expect(classifyClientTrust('192.168.1.50')).toBe('operator');
      // Outside the allowlisted ranges stays restricted.
      expect(classifyClientTrust('192.168.2.50')).toBe('restricted');
      expect(classifyClientTrust('172.16.0.1')).toBe('restricted');
    } finally {
      if (prev === undefined) delete process.env.WAYLAND_OPERATOR_CIDRS;
      else process.env.WAYLAND_OPERATOR_CIDRS = prev;
    }
  });

  it('treats public IPs as restricted', () => {
    expect(classifyClientTrust('8.8.8.8')).toBe('restricted');
    expect(classifyClientTrust('1.1.1.1')).toBe('restricted');
    expect(classifyClientTrust('203.0.113.7')).toBe('restricted');
    expect(classifyClientTrust('2606:4700:4700::1111')).toBe('restricted');
  });

  it('fails safe to restricted on missing/garbage input', () => {
    expect(classifyClientTrust(undefined)).toBe('restricted');
    expect(classifyClientTrust(null)).toBe('restricted');
    expect(classifyClientTrust('')).toBe('restricted');
    expect(classifyClientTrust('not-an-ip')).toBe('restricted');
    expect(classifyClientTrust('999.999.999.999')).toBe('restricted');
    expect(classifyClientTrust('10.0.0')).toBe('restricted');
  });

  it('isPrivateNetworkIp matches the classifier', () => {
    expect(isPrivateNetworkIp('100.105.198.32')).toBe(true);
    expect(isPrivateNetworkIp('8.8.8.8')).toBe(false);
  });
});
