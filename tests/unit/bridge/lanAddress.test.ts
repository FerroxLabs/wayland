/**
 * Regression tests for LAN address selection used by the WebUI QR-login flow.
 *
 * GitHub #105: scanning the QR from a phone opened a browser that never
 * connected because getLanIP() returned the FIRST non-internal IPv4, which on
 * Windows is frequently a virtual adapter (Hyper-V vEthernet, VMware, WSL,
 * VPN). The phone, on the same Wi-Fi as the real NIC, could not route to it.
 *
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { getLanIP } from '@process/bridge/lanAddress';

type Iface = { family: string | number; internal: boolean; address: string };

function ipv4(address: string, internal = false): Iface {
  return { family: 'IPv4', internal, address };
}

describe('getLanIP - physical NIC preference (#105)', () => {
  it('prefers the real Wi-Fi NIC over a Hyper-V vEthernet adapter enumerated first', () => {
    // Windows commonly enumerates the Hyper-V virtual switch BEFORE Wi-Fi.
    const interfaces: NodeJS.Dict<Iface[]> = {
      'vEthernet (Default Switch)': [ipv4('172.27.80.1')],
      'Wi-Fi': [ipv4('192.168.1.42')],
    };
    expect(getLanIP(interfaces)).toBe('192.168.1.42');
  });

  it('prefers the physical NIC over a VirtualBox host-only adapter', () => {
    const interfaces: NodeJS.Dict<Iface[]> = {
      'VirtualBox Host-Only Network': [ipv4('192.168.56.1')],
      Ethernet: [ipv4('192.168.0.15')],
    };
    expect(getLanIP(interfaces)).toBe('192.168.0.15');
  });

  it('prefers the physical NIC over a WSL adapter', () => {
    const interfaces: NodeJS.Dict<Iface[]> = {
      'vEthernet (WSL)': [ipv4('172.30.16.1')],
      'Wi-Fi': [ipv4('10.0.0.7')],
    };
    expect(getLanIP(interfaces)).toBe('10.0.0.7');
  });

  it('prefers the physical NIC over a Tailscale tunnel', () => {
    const interfaces: NodeJS.Dict<Iface[]> = {
      tailscale0: [ipv4('100.101.102.103')],
      en0: [ipv4('192.168.1.50')],
    };
    expect(getLanIP(interfaces)).toBe('192.168.1.50');
  });

  it('falls back to a virtual adapter when it is the only routable option', () => {
    // No physical NIC present: still return something rather than null.
    const interfaces: NodeJS.Dict<Iface[]> = {
      'vEthernet (Default Switch)': [ipv4('172.27.80.1')],
    };
    expect(getLanIP(interfaces)).toBe('172.27.80.1');
  });

  it('skips internal loopback and IPv6 addresses', () => {
    const interfaces: NodeJS.Dict<Iface[]> = {
      lo: [ipv4('127.0.0.1', true)],
      en0: [
        { family: 'IPv6', internal: false, address: 'fe80::1' },
        ipv4('192.168.1.77'),
      ],
    };
    expect(getLanIP(interfaces)).toBe('192.168.1.77');
  });

  it('handles Node 18.4+ numeric family (4)', () => {
    const interfaces: NodeJS.Dict<Iface[]> = {
      'Wi-Fi': [{ family: 4, internal: false, address: '192.168.4.4' }],
    };
    expect(getLanIP(interfaces)).toBe('192.168.4.4');
  });

  it('prefers a private address over a link-local (DHCP-failed) address', () => {
    const interfaces: NodeJS.Dict<Iface[]> = {
      'Ethernet 2': [ipv4('169.254.10.20')],
      'Wi-Fi': [ipv4('192.168.2.2')],
    };
    expect(getLanIP(interfaces)).toBe('192.168.2.2');
  });

  it('returns null when no external IPv4 exists', () => {
    const interfaces: NodeJS.Dict<Iface[]> = {
      lo: [ipv4('127.0.0.1', true)],
    };
    expect(getLanIP(interfaces)).toBeNull();
  });
});
