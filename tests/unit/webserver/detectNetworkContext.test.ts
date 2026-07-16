import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import os from 'os';
import type { Request } from 'express';
import {
  detectNetworkContext,
  __resetTailscaleIfaceCacheForTests,
} from '@process/webserver/middleware/detectNetworkContext';

/**
 * `hasTailscaleInterface()` probes the REAL host via os.networkInterfaces(), so without this stub
 * these assertions silently depend on whether the machine running the suite happens to have
 * Tailscale up: a private-range peer resolves to 'tailscale' on a host with a `tailscale*` iface and
 * to 'private_network' otherwise. That passed on CI (no Tailscale) and on macOS (Tailscale binds
 * `utun*`, which doesn't match the `tailscale` prefix) while failing on any Linux host with
 * Tailscale up. Stub the probe so the host can never decide the outcome.
 */
function stubIfaces(names: string[]): void {
  // The explicit tuple return type is load-bearing: without it `noImplicitAny` infers
  // `[string, any[]]`, Object.fromEntries falls to its `any`-returning overload, and the cast below
  // would assert nothing at all.
  vi.spyOn(os, 'networkInterfaces').mockReturnValue(
    Object.fromEntries(names.map((n): [string, os.NetworkInterfaceInfo[]] => [n, []]))
  );
  __resetTailscaleIfaceCacheForTests(); // the probe is memoised — drop the cache so the stub is read
}

type ReqOpts = { hostname?: string; peer?: string; secure?: boolean };

function makeReq({ hostname, peer, secure }: ReqOpts): Request {
  return {
    hostname,
    secure: secure ?? false,
    socket: { remoteAddress: peer },
  } as unknown as Request;
}

describe('detectNetworkContext', () => {
  const saved = {
    WAYLAND_HTTPS: process.env.WAYLAND_HTTPS,
    SERVER_BASE_URL: process.env.SERVER_BASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    HTTPS: process.env.HTTPS,
  };

  beforeEach(() => {
    delete process.env.WAYLAND_HTTPS;
    delete process.env.SERVER_BASE_URL;
    delete process.env.HTTPS;
    process.env.NODE_ENV = 'test';
    stubIfaces(['lo', 'eth0']); // default: a host WITHOUT Tailscale, whatever the real machine is
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    vi.restoreAllMocks();
    __resetTailscaleIfaceCacheForTests();
  });

  it('isHttps reflects WAYLAND_HTTPS env', () => {
    process.env.WAYLAND_HTTPS = 'true';
    const ctx = detectNetworkContext(makeReq({ hostname: 'box.example.com', peer: '203.0.113.5' }));
    expect(ctx.isHttps).toBe(true);
  });

  it('isHttps reflects SERVER_BASE_URL https://', () => {
    process.env.SERVER_BASE_URL = 'https://box.example.com';
    const ctx = detectNetworkContext(makeReq({ hostname: 'box.example.com', peer: '203.0.113.5' }));
    expect(ctx.isHttps).toBe(true);
  });

  it('isHttps reflects req.secure (trust-proxy resolved)', () => {
    const ctx = detectNetworkContext(makeReq({ hostname: 'box.example.com', peer: '203.0.113.5', secure: true }));
    expect(ctx.isHttps).toBe(true);
  });

  it('hostnameIsStable is true for a real domain', () => {
    const ctx = detectNetworkContext(makeReq({ hostname: 'wayland.example.com', peer: '203.0.113.5' }));
    expect(ctx.hostnameIsStable).toBe(true);
  });

  it('hostnameIsStable is false for an IPv4 literal, localhost, and missing host', () => {
    expect(detectNetworkContext(makeReq({ hostname: '192.168.1.5', peer: '192.168.1.5' })).hostnameIsStable).toBe(
      false
    );
    expect(detectNetworkContext(makeReq({ hostname: 'localhost', peer: '127.0.0.1' })).hostnameIsStable).toBe(false);
    expect(detectNetworkContext(makeReq({ hostname: '127.0.0.1', peer: '127.0.0.1' })).hostnameIsStable).toBe(false);
    expect(detectNetworkContext(makeReq({ hostname: undefined, peer: '203.0.113.5' })).hostnameIsStable).toBe(false);
  });

  it('hostnameIsStable is false for an IPv6 literal host', () => {
    expect(detectNetworkContext(makeReq({ hostname: '::1', peer: '::1' })).hostnameIsStable).toBe(false);
    expect(detectNetworkContext(makeReq({ hostname: '2001:db8::1', peer: '2001:db8::1' })).hostnameIsStable).toBe(
      false
    );
  });

  it('reachedVia=loopback for a loopback peer', () => {
    expect(detectNetworkContext(makeReq({ hostname: 'localhost', peer: '127.0.0.1' })).reachedVia).toBe('loopback');
    expect(detectNetworkContext(makeReq({ hostname: 'localhost', peer: '::1' })).reachedVia).toBe('loopback');
  });

  it('reachedVia=tailscale for a CGNAT peer or a .ts.net host', () => {
    expect(detectNetworkContext(makeReq({ hostname: 'box.example.com', peer: '100.64.0.9' })).reachedVia).toBe(
      'tailscale'
    );
    expect(detectNetworkContext(makeReq({ hostname: 'box.tailnet.ts.net', peer: '203.0.113.5' })).reachedVia).toBe(
      'tailscale'
    );
  });

  it('reachedVia=private_network for a bare RFC1918 peer on a host without Tailscale', () => {
    expect(detectNetworkContext(makeReq({ hostname: 'box.example.com', peer: '192.168.1.10' })).reachedVia).toBe(
      'private_network'
    );
  });

  // The other half of the same branch, previously unasserted (and the reason the test above was
  // host-dependent): the SAME private peer reads as 'tailscale' when the host has a Tailscale iface.
  it('reachedVia=tailscale for an RFC1918 peer when the host HAS a Tailscale interface', () => {
    stubIfaces(['lo', 'eth0', 'tailscale0']);
    expect(detectNetworkContext(makeReq({ hostname: 'box.example.com', peer: '192.168.1.10' })).reachedVia).toBe(
      'tailscale'
    );
  });

  // A Tailscale iface being up must NOT relabel a PUBLIC peer. This is a security floor, not a nicety:
  // requireSecureConfigWrite() only refuses when reachedVia === 'public_internet' && !isHttps, so a
  // classifier that called every public peer 'tailscale' on a Tailscale-running host would silently
  // open the plain-HTTP secret-write path. Without this assertion, dropping the `isPrivateNetworkIp(ip)`
  // guard from the impl leaves the whole suite green.
  it('a public peer stays public_internet even when the host HAS a Tailscale interface', () => {
    stubIfaces(['lo', 'eth0', 'tailscale0']);
    expect(detectNetworkContext(makeReq({ hostname: 'box.example.com', peer: '203.0.113.5' })).reachedVia).toBe(
      'public_internet'
    );
  });

  // Pins the claim the hermetic stub rests on: macOS Tailscale binds `utun*`, which does NOT match the
  // `tailscale` prefix the detector looks for. If someone "improves" the detector to match utun*/wg*,
  // classification (and the config-write floor above) shifts under every macOS dev — loudly, here.
  it('a utun* interface (macOS Tailscale) does not count as a Tailscale interface', () => {
    stubIfaces(['lo0', 'utun0', 'utun1', 'en0']);
    expect(detectNetworkContext(makeReq({ hostname: 'box.example.com', peer: '192.168.1.10' })).reachedVia).toBe(
      'private_network'
    );
  });

  it('reachedVia=public_internet for a public peer', () => {
    expect(detectNetworkContext(makeReq({ hostname: 'box.example.com', peer: '203.0.113.5' })).reachedVia).toBe(
      'public_internet'
    );
  });

  it('passkeyEligible = isHttps && hostnameIsStable (vendor-neutral)', () => {
    process.env.WAYLAND_HTTPS = 'true';
    // HTTPS + stable hostname, public peer -> still eligible (NOT gated on Tailscale).
    expect(
      detectNetworkContext(makeReq({ hostname: 'wayland.example.com', peer: '203.0.113.5' })).passkeyEligible
    ).toBe(true);
  });

  it('passkeyEligible is false without HTTPS even on a stable hostname', () => {
    expect(
      detectNetworkContext(makeReq({ hostname: 'wayland.example.com', peer: '203.0.113.5' })).passkeyEligible
    ).toBe(false);
  });

  it('passkeyEligible is false on HTTPS with an IP-literal host', () => {
    process.env.WAYLAND_HTTPS = 'true';
    expect(detectNetworkContext(makeReq({ hostname: '203.0.113.5', peer: '203.0.113.5' })).passkeyEligible).toBe(false);
  });
});
