/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Network-provenance trust classification for the remote WebUI (#83, remote-secure-config W0).
 *
 * The desktop app reaches storage/config actions over IPC and is fully trusted.
 * The WebUI reaches them over HTTP, where "remote" is not one trust level. We use
 * network provenance as an ESCALATION factor for DESTRUCTIVE actions only (reset,
 * restore, sandbox-disable, password change) - never as the floor for plain
 * config-writes (a phone on cellular has a PUBLIC ip and must still be able to
 * plant a write-only key; that gate is auth + HTTPS + CSRF, see configWriteGuards).
 *
 * TRUST IS JUDGED FROM THE DIRECT SOCKET PEER (`req.socket.remoteAddress`), NEVER
 * from `req.ip` / `X-Forwarded-For`. With `trust proxy` set to explicit private
 * ranges (see setup.ts) `req.ip` can be rewritten from a spoofable XFF header by a
 * public attacker; the raw socket peer cannot be forged. Callers MUST pass the
 * socket peer, not req.ip.
 *
 * DEFAULT OPERATOR SET (cross-audit 2026-06-15 R4): loopback + the Tailscale CGNAT
 * range (100.64.0.0/10) ONLY. The broad RFC1918 ranges (10/8, 172.16/12,
 * 192.168/16) and link-local are NOT operator by default - on a cloud VPS those
 * cover the VPC/Docker-bridge/metadata net, so a private-range neighbour would
 * auto-escalate to operator. Operators who genuinely front Wayland on a trusted
 * LAN can opt those ranges back in via the `WAYLAND_OPERATOR_CIDRS` env allowlist.
 */

export type NetworkTrust = 'operator' | 'restricted';

/**
 * Strip an IPv4-mapped IPv6 prefix (`::ffff:192.168.1.5` -> `192.168.1.5`) and
 * surrounding whitespace/zone-id so the range checks see a bare address.
 */
function normalizeIp(ip: string): string {
  let value = ip.trim().toLowerCase();
  // Drop an IPv6 zone id (e.g. `fe80::1%eth0`).
  const zone = value.indexOf('%');
  if (zone !== -1) value = value.slice(0, zone);
  // IPv4-mapped IPv6.
  if (value.startsWith('::ffff:')) value = value.slice('::ffff:'.length);
  return value;
}

/** Parse a dotted IPv4 string into its four octets, or null if malformed. */
function parseIpv4(ip: string): [number, number, number, number] | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  const octets = parts.map((p) => {
    if (!/^\d{1,3}$/.test(p)) return NaN;
    return Number(p);
  });
  if (octets.some((o) => Number.isNaN(o) || o < 0 || o > 255)) return null;
  return octets as [number, number, number, number];
}

/** Convert four octets to a 32-bit unsigned integer. */
function ipv4ToInt(octets: [number, number, number, number]): number {
  return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
}

/**
 * Whether an IP is loopback (IPv4 127.0.0.0/8 or IPv6 ::1). Always operator.
 */
function isLoopback(ip: string): boolean {
  if (ip === '::1') return true;
  const octets = parseIpv4(ip);
  if (!octets) return false;
  return octets[0] === 127;
}

/**
 * Whether an IP is in the Tailscale CGNAT range (100.64.0.0/10). Always operator:
 * Tailscale peers are cryptographically authenticated, so this address is not
 * spoofable from the public internet.
 */
function isTailscaleCgnat(ip: string): boolean {
  const octets = parseIpv4(ip);
  if (!octets) return false;
  return octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127;
}

/**
 * Whether an IP belongs to a private/trusted network in the BROAD sense: loopback,
 * all of RFC1918, the Tailscale CGNAT range, link-local, or IPv6 unique-local.
 *
 * This is the informational classifier used by detectNetworkContext.reachedVia and
 * is NOT the operator gate. Operator classification (classifyClientTrust) is
 * narrower by default - see the module header and getOperatorCidrs().
 */
export function isPrivateNetworkIp(rawIp: string | undefined | null): boolean {
  if (!rawIp) return false;
  const ip = normalizeIp(rawIp);

  // IPv6 forms we treat as private/trusted.
  if (ip === '::1') return true; // loopback
  if (ip.startsWith('fe80:')) return true; // link-local
  if (ip.startsWith('fc') || ip.startsWith('fd')) return true; // unique-local fc00::/7

  const octets = parseIpv4(ip);
  if (!octets) return false;
  const [a, b] = octets;

  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (Tailscale CGNAT)
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local

  return false;
}

type Cidr = { base: number; mask: number };

/** Parsed `WAYLAND_OPERATOR_CIDRS`, cached per process-lifetime env value. */
let cidrCacheKey: string | undefined;
let cidrCache: Cidr[] = [];

/**
 * Parse an IPv4 `a.b.c.d/n` CIDR (n in 0..32). Returns null for anything malformed
 * or for IPv6 (operator allowlisting for IPv6 is intentionally not supported here;
 * use loopback/Tailscale or a reverse proxy that presents an IPv4 peer).
 */
function parseCidr(token: string): Cidr | null {
  const slash = token.indexOf('/');
  if (slash === -1) return null;
  const addr = token.slice(0, slash).trim();
  const bitsRaw = token.slice(slash + 1).trim();
  if (!/^\d{1,2}$/.test(bitsRaw)) return null;
  const bits = Number(bitsRaw);
  if (bits < 0 || bits > 32) return null;
  const octets = parseIpv4(addr);
  if (!octets) return null;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  const base = (ipv4ToInt(octets) & mask) >>> 0;
  return { base, mask };
}

/**
 * Operator CIDR allowlist from `WAYLAND_OPERATOR_CIDRS` (comma-separated IPv4
 * CIDRs). Default empty: loopback + Tailscale are always operator regardless of
 * this var. Re-parsed only when the env value changes (so tests can flip it).
 */
function getOperatorCidrs(): Cidr[] {
  const raw = process.env.WAYLAND_OPERATOR_CIDRS ?? '';
  if (raw === cidrCacheKey) return cidrCache;
  cidrCacheKey = raw;
  cidrCache = raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .map(parseCidr)
    .filter((c): c is Cidr => c !== null);
  return cidrCache;
}

function matchesOperatorCidr(ip: string): boolean {
  const octets = parseIpv4(ip);
  if (!octets) return false;
  const value = ipv4ToInt(octets);
  return getOperatorCidrs().some((c) => (value & c.mask) >>> 0 === c.base);
}

/**
 * Classify a request's DIRECT-PEER IP as `operator` or `restricted`.
 *
 * Operator = loopback OR Tailscale-CGNAT OR an explicitly-allowlisted
 * `WAYLAND_OPERATOR_CIDRS` range. Everything else - including a bare 10.x /
 * 172.16.x / 192.168.x with no allowlist entry, and every public address - is
 * `restricted`. Unparseable/empty addresses fail safe to `restricted`.
 *
 * CALLERS MUST PASS `req.socket.remoteAddress`, never `req.ip` (XFF is spoofable).
 */
export function classifyClientTrust(rawIp: string | undefined | null): NetworkTrust {
  if (!rawIp) return 'restricted';
  const ip = normalizeIp(rawIp);
  if (isLoopback(ip)) return 'operator';
  if (isTailscaleCgnat(ip)) return 'operator';
  if (matchesOperatorCidr(ip)) return 'operator';
  return 'restricted';
}
