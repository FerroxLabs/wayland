/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import os from 'os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  classifyClientTrust,
  isPrivateNetworkIp,
  __resetTailscaleIfaceCacheForTests,
} from '../../src/process/webserver/middleware/networkTrust';

vi.mock('os');

describe('networkTrust - private-network classification (#83)', () => {
  beforeEach(() => {
    // Default: no Tailscale interface on this host.
    vi.mocked(os.networkInterfaces).mockReturnValue({});
    __resetTailscaleIfaceCacheForTests();
  });

  afterEach(() => {
    vi.clearAllMocks();
    __resetTailscaleIfaceCacheForTests();
  });

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

  it('does NOT treat a CGNAT peer (100.64.0.0/10) as operator without a Tailscale interface (#529, RFC6598 CGNAT)', () => {
    // No tailscale* interface configured in beforeEach - a real ISP's carrier-grade
    // NAT customer must not be escalated to operator.
    expect(classifyClientTrust('100.105.198.32')).toBe('restricted');
    expect(classifyClientTrust('100.64.0.0')).toBe('restricted');
    expect(classifyClientTrust('100.127.255.255')).toBe('restricted');
  });

  it('treats the Tailscale CGNAT range (100.64.0.0/10) as operator when a tailscale interface is present', () => {
    vi.mocked(os.networkInterfaces).mockReturnValue({
      tailscale0: [{ address: '100.105.198.32', family: 'IPv4' } as os.NetworkInterfaceInfo],
    });
    __resetTailscaleIfaceCacheForTests();

    expect(classifyClientTrust('100.105.198.32')).toBe('operator'); // the DGX reporter's tailnet IP
    expect(classifyClientTrust('100.64.0.0')).toBe('operator');
    expect(classifyClientTrust('100.127.255.255')).toBe('operator');
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
