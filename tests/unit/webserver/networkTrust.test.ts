import os from 'os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  classifyClientTrust,
  isPrivateNetworkIp,
  __resetTailscaleIfaceCacheForTests,
} from '@process/webserver/middleware/networkTrust';

vi.mock('os');

describe('classifyClientTrust (narrow default operator set)', () => {
  const originalCidrs = process.env.WAYLAND_OPERATOR_CIDRS;
  const originalOverride = process.env.WAYLAND_TAILSCALE_CGNAT_OPERATOR;

  beforeEach(() => {
    delete process.env.WAYLAND_OPERATOR_CIDRS;
    // Default: no Tailscale interface on this host.
    vi.mocked(os.networkInterfaces).mockReturnValue({});
    __resetTailscaleIfaceCacheForTests();
  });

  afterEach(() => {
    if (originalCidrs === undefined) delete process.env.WAYLAND_OPERATOR_CIDRS;
    else process.env.WAYLAND_OPERATOR_CIDRS = originalCidrs;
    vi.clearAllMocks();
    __resetTailscaleIfaceCacheForTests();
  });

  it('treats loopback as operator (IPv4 + IPv6)', () => {
    expect(classifyClientTrust('127.0.0.1')).toBe('operator');
    expect(classifyClientTrust('127.5.5.5')).toBe('operator');
    expect(classifyClientTrust('::1')).toBe('operator');
    expect(classifyClientTrust('::ffff:127.0.0.1')).toBe('operator');
  });

  it('does NOT treat a CGNAT peer (100.64/10) as operator without a Tailscale interface (#529, RFC6598 CGNAT)', () => {
    // No tailscale* interface configured in beforeEach - a carrier-grade-NAT'd
    // ISP customer must not be escalated to operator.
    expect(classifyClientTrust('100.64.0.1')).toBe('restricted');
    expect(classifyClientTrust('100.100.50.2')).toBe('restricted');
    expect(classifyClientTrust('100.127.255.254')).toBe('restricted');
  });

  it('treats Tailscale CGNAT (100.64/10) as operator when a tailscale interface is present', () => {
    vi.mocked(os.networkInterfaces).mockReturnValue({
      tailscale0: [{ address: '100.100.50.2', family: 'IPv4' } as os.NetworkInterfaceInfo],
    });
    __resetTailscaleIfaceCacheForTests();

    expect(classifyClientTrust('100.64.0.1')).toBe('operator');
    expect(classifyClientTrust('100.100.50.2')).toBe('operator');
    expect(classifyClientTrust('100.127.255.254')).toBe('operator');
    // 100.63.x and 100.128.x are OUTSIDE 100.64/10.
    expect(classifyClientTrust('100.63.0.1', TS_LOCAL)).toBe('restricted');
    expect(classifyClientTrust('100.128.0.1', TS_LOCAL)).toBe('restricted');
  });

  // ─── THE VICTIM (#529). ────────────────────────────────────────────────────
  // Tailscale is the standard workaround FOR a CGNAT ISP, so "behind carrier NAT"
  // and "on a tailnet" are largely the SAME hosts. A host-global "is this machine
  // on a tailnet?" check therefore answers YES for exactly the at-risk population
  // and leaves the hole wide open. The gate must be per-CONNECTION.
  it('does NOT trust a carrier-segment stranger on a host that is ALSO on a tailnet', () => {
    mockNetworkInterfaces.mockReturnValue(CARRIER_NAT_PLUS_TAILSCALE as never);
    resetNetworkTrustCache();

    // Stranger from the carrier segment: lands on the PHYSICAL nic. Must be refused
    // even though this host genuinely is on a tailnet.
    expect(classifyClientTrust('100.64.0.1', '100.71.4.9')).toBe('restricted');

    // The same host's REAL tailnet peer lands on the tailnet address -> operator.
    expect(classifyClientTrust('100.64.0.1', '100.79.121.109')).toBe('operator');
  });

  it('fails CLOSED for a CGNAT peer when the local address is unknown', () => {
    mockNetworkInterfaces.mockReturnValue(REAL_MACOS_TAILSCALE as never);
    resetNetworkTrustCache();

    expect(classifyClientTrust('100.64.0.1', undefined)).toBe('restricted');
  });

  // A `tailscale0` that is down / logged out has NO address, so nothing can arrive
  // on it. A name-only match would still have called this host "on a tailnet".
  it('does NOT trust an address-less (down / logged-out) tailscale interface', () => {
    mockNetworkInterfaces.mockReturnValue({
      tailscale0: [],
      en0: [{ address: '10.0.0.5', family: 'IPv4', internal: false }],
    } as never);
    resetNetworkTrustCache();

    expect(classifyClientTrust('100.64.0.1', '10.0.0.5')).toBe('restricted');
  });

  // THE BUG (#529). 100.64.0.0/10 is RFC 6598 carrier-grade NAT space, NOT a
  // Tailscale identity. In remote mode (bound 0.0.0.0) reached over a carrier-NAT
  // path, the DIRECT socket peer can be a 100.64.x STRANGER - and this gate is what
  // guards requireDestructive (reset / restore / sandbox-disable / password change).
  it('does NOT trust a CGNAT peer when this host is not on a tailnet', () => {
    mockNetworkInterfaces.mockReturnValue(NO_TAILNET as never);
    resetNetworkTrustCache();

    expect(classifyClientTrust('100.64.0.1', '192.168.1.20')).toBe('restricted');
    expect(classifyClientTrust('100.100.50.2', '192.168.1.20')).toBe('restricted');
    expect(classifyClientTrust('100.127.255.254', '192.168.1.20')).toBe('restricted');
  });

  // A host directly on carrier NAT holds a 100.64/10 address of its OWN, on a
  // PHYSICAL nic. That must not be mistaken for a tailnet, or the fix defeats itself.
  it('does NOT mistake a carrier-NAT host for a tailnet (100.x on a physical nic)', () => {
    mockNetworkInterfaces.mockReturnValue(CARRIER_NAT_HOST as never);
    resetNetworkTrustCache();

    // Even landing on the host's OWN 100.x - it is on a physical nic from the ISP.
    expect(classifyClientTrust('100.64.0.1', '100.71.4.9')).toBe('restricted');
  });

  // REGRESSION GUARD: real Tailscale operators must be untouched. On macOS the
  // tailnet address rides `utun<N>` - an interface-NAME-only check (as
  // detectNetworkContext uses) misses it and would strip every macOS operator.
  it('keeps a real Tailscale operator as operator on macOS (utun) and Linux (tailscale0)', () => {
    mockNetworkInterfaces.mockReturnValue(TAILNET_MACOS as never);
    resetNetworkTrustCache();
    expect(classifyClientTrust('100.64.0.1', '100.101.102.103')).toBe('operator');

    mockNetworkInterfaces.mockReturnValue(TAILNET_LINUX as never);
    resetNetworkTrustCache();
    expect(classifyClientTrust('100.64.0.1', '100.90.1.2')).toBe('operator');
  });

  // The decoy case. Stock macOS has utun0/1/3/4 with NO VPN running, so a
  // tunnel-NAME check alone is not enough - the tailnet address must actually be
  // there. Captured from a real macOS + Tailscale host.
  it('identifies the tailnet on a REAL macOS host despite stock utun decoys', () => {
    mockNetworkInterfaces.mockReturnValue(REAL_MACOS_TAILSCALE as never);
    resetNetworkTrustCache();

    expect(classifyClientTrust('100.64.0.1', '100.79.121.109')).toBe('operator');
    // ...and the stock utun decoys grant nothing: landing on en0 is still refused.
    expect(classifyClientTrust('100.64.0.1', '192.168.1.116')).toBe('restricted');
  });

  // The hole must not reopen just because SOME tunnel exists. An unrelated VPN on a
  // carrier-NAT host must not read as a tailnet.
  it('does NOT read an unrelated VPN on a carrier-NAT host as a tailnet', () => {
    mockNetworkInterfaces.mockReturnValue(CARRIER_NAT_PLUS_VPN as never);
    resetNetworkTrustCache();

    expect(classifyClientTrust('100.64.0.1', '100.71.4.9')).toBe('restricted');
    expect(classifyClientTrust('100.64.0.1', '10.8.0.6')).toBe('restricted');
  });

  // The ULA prefix is how we tell WHICH interface is Tailscale's - decisive on macOS,
  // where the device is a bare `utun<N>` indistinguishable by name from any other
  // VPN. Two tunnels each holding a 100.64/10 address; only the one carrying fd7a:
  // is Tailscale, so only IT confers operator. This is what keeps an unrelated VPN
  // (which may legitimately be handed RFC 6598 space) out of the operator set.
  it('trusts only the tunnel proven Tailscale by its ULA, not a lookalike VPN', () => {
    mockNetworkInterfaces.mockReturnValue({
      utun2: [
        { address: '100.79.121.109', family: 'IPv4', internal: false },
        { address: 'fd7a:115c:a1e0::4d3b:796d', family: 'IPv6', internal: false },
      ],
      // A corporate/WireGuard tunnel that was ALSO handed RFC 6598 space. No fd7a:.
      utun7: [{ address: '100.90.7.7', family: 'IPv4', internal: false }],
    } as never);
    resetNetworkTrustCache();

    expect(classifyClientTrust('100.64.0.1', '100.79.121.109')).toBe('operator');
    expect(classifyClientTrust('100.64.0.1', '100.90.7.7')).toBe('restricted');
  });

  it('honours WAYLAND_TAILSCALE_CGNAT_OPERATOR for exotic setups (subnet router)', () => {
    mockNetworkInterfaces.mockReturnValue(NO_TAILNET as never);
    resetNetworkTrustCache();
    process.env.WAYLAND_TAILSCALE_CGNAT_OPERATOR = '1';
    expect(classifyClientTrust('100.64.0.1', '192.168.1.20')).toBe('operator');

    mockNetworkInterfaces.mockReturnValue(TAILNET_LINUX as never);
    resetNetworkTrustCache();
    process.env.WAYLAND_TAILSCALE_CGNAT_OPERATOR = '0';
    expect(classifyClientTrust('100.64.0.1', '100.90.1.2')).toBe('restricted');
  });

  it('fails CLOSED when interface enumeration throws', () => {
    mockNetworkInterfaces.mockImplementation(() => {
      throw new Error('EPERM');
    });
    resetNetworkTrustCache();

    expect(classifyClientTrust('100.64.0.1', '100.79.121.109')).toBe('restricted');
    expect(classifyClientTrust('127.0.0.1')).toBe('operator'); // loopback still fine
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
  afterEach(() => {
    vi.clearAllMocks();
    __resetTailscaleIfaceCacheForTests();
  });

  it('a public peer is restricted even if a private IP is forged elsewhere', () => {
    vi.mocked(os.networkInterfaces).mockReturnValue({
      tailscale0: [{ address: '100.100.50.2', family: 'IPv4' } as os.NetworkInterfaceInfo],
    });
    __resetTailscaleIfaceCacheForTests();

    const forgedXffValue = '100.64.0.1'; // attacker-chosen "operator" IP
    const realSocketPeer = '203.0.113.7'; // the actual public peer

    // The guard classifies the REAL socket peer, not the forged value.
    expect(classifyClientTrust(realSocketPeer)).toBe('restricted');
    // (The forged value alone would look like operator on a host with a Tailscale
    // interface - which is exactly why we must never classify it.)
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
