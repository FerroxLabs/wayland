/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Network context for the remote WebUI (remote-secure-config W0).
 *
 * A pure descriptor of HOW a request reached the server, used to drive two
 * decisions:
 *  - the CONFIG-WRITE floor (HTTPS required when reached over the public
 *    internet - see configWriteGuards), and
 *  - passkey eligibility (a secure context with a stable hostname).
 *
 * `passkeyEligible` is VENDOR-NEUTRAL: it is purely `isHttps && hostnameIsStable`.
 * Tailscale-specific signals only colour `reachedVia` for recommendation/trust;
 * they NEVER gate passkeys, so Headscale / a custom domain / Cloudflare Tunnel
 * qualify identically.
 *
 * `reachedVia` is judged from the DIRECT socket peer, never `req.ip` (XFF is
 * spoofable once trust proxy is set), and is INFORMATIONAL ONLY here - it does not
 * grant any capability on its own.
 */

import os from 'os';
import type { Request } from 'express';
import { detectHttps } from '../config/constants';
import { isPrivateNetworkIp } from './networkTrust';

export type ReachedVia = 'loopback' | 'tailscale' | 'private_network' | 'public_internet';

export type NetworkContext = {
  isHttps: boolean;
  hostname: string | null;
  hostnameIsStable: boolean;
  reachedVia: ReachedVia;
  passkeyEligible: boolean;
};

/** Strip IPv4-mapped IPv6 prefix and IPv6 zone id, lowercase. */
function normalizeIp(ip: string): string {
  let value = ip.trim().toLowerCase();
  const zone = value.indexOf('%');
  if (zone !== -1) value = value.slice(0, zone);
  if (value.startsWith('::ffff:')) value = value.slice('::ffff:'.length);
  return value;
}

/** A bare IPv4 dotted quad. */
function isIpv4(host: string): boolean {
  const parts = host.split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) >= 0 && Number(p) <= 255);
}

/** Looks like an IP literal (IPv4, or IPv6 which always contains ':'). */
function isIpLiteral(host: string): boolean {
  return host.includes(':') || isIpv4(host);
}

/** Whether the host is a localhost form that cannot be a passkey rpID. */
function isLocalhostHost(host: string): boolean {
  const h = host.toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '::1' || h.endsWith('.localhost');
}

/**
 * Whether any local network interface is a Tailscale interface. Memoised per
 * process: interface names do not change at runtime. Best-effort - failures fall
 * back to false (Tailscale detection is informational only).
 */
let hasTailscaleIfaceCache: boolean | undefined;
function hasTailscaleInterface(): boolean {
  if (hasTailscaleIfaceCache !== undefined) return hasTailscaleIfaceCache;
  try {
    const ifaces = os.networkInterfaces();
    hasTailscaleIfaceCache = Object.keys(ifaces).some((name) => name.toLowerCase().startsWith('tailscale'));
  } catch {
    hasTailscaleIfaceCache = false;
  }
  return hasTailscaleIfaceCache;
}

/** Exposed for tests to reset the memoised interface probe. */
export function __resetTailscaleIfaceCacheForTests(): void {
  hasTailscaleIfaceCache = undefined;
}

/** Tailscale CGNAT 100.64.0.0/10. */
function isTailscaleCgnat(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  const a = Number(parts[0]);
  const b = Number(parts[1]);
  return a === 100 && b >= 64 && b <= 127;
}

function classifyReachedVia(rawPeer: string | undefined, hostname: string | null): ReachedVia {
  const ip = rawPeer ? normalizeIp(rawPeer) : '';

  // Loopback first - most specific.
  if (ip === '::1' || ip.startsWith('127.')) return 'loopback';

  // Tailscale (informational): a CGNAT peer, a *.ts.net host, or a private-range
  // peer on a host that has a tailscale interface up.
  const hostIsTsNet = hostname?.toLowerCase().endsWith('.ts.net') ?? false;
  if (isTailscaleCgnat(ip) || hostIsTsNet) return 'tailscale';
  if (ip !== '' && isPrivateNetworkIp(ip) && hasTailscaleInterface()) return 'tailscale';

  if (isPrivateNetworkIp(ip)) return 'private_network';
  return 'public_internet';
}

/**
 * Derive the network context for a request. Pure: no side effects, reads only
 * `req` + env (via detectHttps) + the memoised interface probe.
 *
 * @param req Express request. Peer trust is taken from `req.socket.remoteAddress`.
 */
export function detectNetworkContext(req: Request): NetworkContext {
  const isHttps = detectHttps(req);

  const rawHostname = typeof req.hostname === 'string' && req.hostname.length > 0 ? req.hostname : null;
  const hostname = rawHostname;
  const hostnameIsStable = hostname !== null && !isIpLiteral(hostname) && !isLocalhostHost(hostname);

  const peer = req.socket?.remoteAddress ?? undefined;
  const reachedVia = classifyReachedVia(peer, hostname);

  // VENDOR-NEUTRAL: passkeys require only a secure context + stable hostname.
  const passkeyEligible = isHttps && hostnameIsStable;

  return { isHttps, hostname, hostnameIsStable, reachedVia, passkeyEligible };
}
