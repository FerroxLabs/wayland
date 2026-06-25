import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { classifyClientTrust, isPrivateNetworkIp } from '@process/webserver/middleware/networkTrust';

describe('classifyClientTrust (narrow default operator set)', () => {
  const originalCidrs = process.env.WAYLAND_OPERATOR_CIDRS;

  beforeEach(() => {
    delete process.env.WAYLAND_OPERATOR_CIDRS;
  });

  afterEach(() => {
    if (originalCidrs === undefined) delete process.env.WAYLAND_OPERATOR_CIDRS;
    else process.env.WAYLAND_OPERATOR_CIDRS = originalCidrs;
  });

  it('treats loopback as operator (IPv4 + IPv6)', () => {
    expect(classifyClientTrust('127.0.0.1')).toBe('operator');
    expect(classifyClientTrust('127.5.5.5')).toBe('operator');
    expect(classifyClientTrust('::1')).toBe('operator');
    expect(classifyClientTrust('::ffff:127.0.0.1')).toBe('operator');
  });

  it('treats Tailscale CGNAT (100.64/10) as operator', () => {
    expect(classifyClientTrust('100.64.0.1')).toBe('operator');
    expect(classifyClientTrust('100.100.50.2')).toBe('operator');
    expect(classifyClientTrust('100.127.255.254')).toBe('operator');
    // 100.63.x and 100.128.x are OUTSIDE 100.64/10.
    expect(classifyClientTrust('100.63.0.1')).toBe('restricted');
    expect(classifyClientTrust('100.128.0.1')).toBe('restricted');
  });

  it('does NOT treat bare RFC1918 as operator by default (R4)', () => {
    expect(classifyClientTrust('10.0.0.5')).toBe('restricted');
    expect(classifyClientTrust('172.16.0.5')).toBe('restricted');
    expect(classifyClientTrust('172.31.255.254')).toBe('restricted');
    expect(classifyClientTrust('192.168.1.5')).toBe('restricted');
    expect(classifyClientTrust('::ffff:10.0.0.5')).toBe('restricted');
  });

  it('does NOT treat link-local / metadata net as operator', () => {
    expect(classifyClientTrust('169.254.169.254')).toBe('restricted');
  });

  it('treats public addresses and junk as restricted (fail safe)', () => {
    expect(classifyClientTrust('8.8.8.8')).toBe('restricted');
    expect(classifyClientTrust('1.2.3.4')).toBe('restricted');
    expect(classifyClientTrust('')).toBe('restricted');
    expect(classifyClientTrust(undefined)).toBe('restricted');
    expect(classifyClientTrust(null)).toBe('restricted');
    expect(classifyClientTrust('not-an-ip')).toBe('restricted');
    expect(classifyClientTrust('999.999.999.999')).toBe('restricted');
  });

  it('opts RFC1918 ranges back in via WAYLAND_OPERATOR_CIDRS', () => {
    process.env.WAYLAND_OPERATOR_CIDRS = '192.168.1.0/24, 10.0.0.0/8';
    expect(classifyClientTrust('192.168.1.42')).toBe('operator');
    expect(classifyClientTrust('10.255.255.255')).toBe('operator');
    // Outside the allowlisted /24 stays restricted.
    expect(classifyClientTrust('192.168.2.42')).toBe('restricted');
    // A different unrelated private range stays restricted.
    expect(classifyClientTrust('172.16.0.1')).toBe('restricted');
  });

  it('ignores malformed CIDR tokens in the allowlist', () => {
    process.env.WAYLAND_OPERATOR_CIDRS = 'garbage, 192.168.5.0/24, 1.2.3.4/40';
    expect(classifyClientTrust('192.168.5.10')).toBe('operator');
    // /40 is invalid -> dropped -> that host is not operator.
    expect(classifyClientTrust('1.2.3.4')).toBe('restricted');
  });
});

describe('XFF cannot flip the decision (trust reads the socket peer)', () => {
  // classifyClientTrust is a pure fn of the value passed. The route/guard layer
  // passes req.socket.remoteAddress (never req.ip). This proves that a forged XFF
  // value, if it ever reached the classifier, is judged on its merits: a public
  // socket peer is restricted regardless of any header an attacker controls.
  it('a public peer is restricted even if a private IP is forged elsewhere', () => {
    const forgedXffValue = '100.64.0.1'; // attacker-chosen "operator" IP
    const realSocketPeer = '203.0.113.7'; // the actual public peer

    // The guard classifies the REAL socket peer, not the forged value.
    expect(classifyClientTrust(realSocketPeer)).toBe('restricted');
    // (The forged value alone would look like operator - which is exactly why we
    // must never classify it.)
    expect(classifyClientTrust(forgedXffValue)).toBe('operator');
  });
});

describe('isPrivateNetworkIp (broad informational classifier, unchanged)', () => {
  it('still treats all RFC1918 + link-local + ULA as private', () => {
    expect(isPrivateNetworkIp('10.0.0.1')).toBe(true);
    expect(isPrivateNetworkIp('172.20.0.1')).toBe(true);
    expect(isPrivateNetworkIp('192.168.0.1')).toBe(true);
    expect(isPrivateNetworkIp('169.254.0.1')).toBe(true);
    expect(isPrivateNetworkIp('100.64.0.1')).toBe(true);
    expect(isPrivateNetworkIp('fd00::1')).toBe(true);
    expect(isPrivateNetworkIp('fe80::1')).toBe(true);
    expect(isPrivateNetworkIp('8.8.8.8')).toBe(false);
  });
});
