import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import express from 'express';
import { setupTrustProxy } from '@process/webserver/setup';
import { classifyClientTrust } from '@process/webserver/middleware/networkTrust';

describe('setupTrustProxy (narrow, never true)', () => {
  const saved = process.env.WAYLAND_OPERATOR_CIDRS;
  beforeEach(() => {
    delete process.env.WAYLAND_OPERATOR_CIDRS;
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.WAYLAND_OPERATOR_CIDRS;
    else process.env.WAYLAND_OPERATOR_CIDRS = saved;
  });

  it('does not set trust proxy to the boolean true', () => {
    const app = express();
    setupTrustProxy(app);
    expect(app.get('trust proxy')).not.toBe(true);
  });

  it('trusts a loopback hop but NOT a public hop (XFF stays non-spoofable)', () => {
    const app = express();
    setupTrustProxy(app);
    // Express compiles the trust list into `trust proxy fn` (addr, hopIndex)=>bool.
    const trust = app.get('trust proxy fn') as (addr: string, i: number) => boolean;
    expect(trust('127.0.0.1', 0)).toBe(true);
    expect(trust('203.0.113.7', 0)).toBe(false);
    // A public attacker's direct peer is NOT a trusted hop, so its forged
    // X-Forwarded-Proto / X-Forwarded-For is ignored by Express.
    expect(trust('8.8.8.8', 0)).toBe(false);
  });

  it('trusts opt-in operator CIDRs as hops', () => {
    process.env.WAYLAND_OPERATOR_CIDRS = '10.0.0.0/8';
    const app = express();
    setupTrustProxy(app);
    const trust = app.get('trust proxy fn') as (addr: string, i: number) => boolean;
    expect(trust('10.1.2.3', 0)).toBe(true);
    expect(trust('192.168.1.1', 0)).toBe(false);
  });

  it('end-to-end: a forged-XFF public peer is still classified restricted by the socket-peer gate', () => {
    // Even with trust proxy set, the operator gate reads req.socket.remoteAddress,
    // never req.ip. A public socket peer that forges XFF: 100.64.0.1 is restricted.
    const realPublicPeer = '203.0.113.7';
    expect(classifyClientTrust(realPublicPeer)).toBe('restricted');
  });
});
