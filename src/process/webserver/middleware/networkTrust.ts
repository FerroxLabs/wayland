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

import { networkInterfaces } from 'node:os';

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
 * Whether an IP is loopback (IPv4 127.0.0.0/8 or IPv6 ::1).
 */
function isLoopback(ip: string): boolean {
  if (ip === '::1') return true;
  const octets = parseIpv4(ip);
  if (!octets) return false;
  return octets[0] === 127;
}

/**
 * Whether the operator has DECLARED that this instance sits behind a same-host reverse
 * proxy (`WAYLAND_TRUSTED_PROXY`). When they have, loopback can no longer be read as
 * "the local human": the documented Caddy/nginx/cloudflared deployment forwards public
 * internet traffic to the app on `127.0.0.1`, so an unconditional loopback ⇒ operator
 * grant would hand the destructive gate to the entire internet (#808).
 *
 * Opt-in on purpose: the default (unset) keeps loopback ⇒ operator for the local-desktop
 * case (a browser on the same machine), so there is no regression. Operators who set it
 * prove operator another way - WAYLAND_OPERATOR_CIDRS or tailnet arrival. Note the
 * tradeoff: most destructive routes (restore, keys-included export) are reached over
 * HTTP loopback (StorageService.*Http), so with the proxy declared and no CIDR/tailnet
 * operator path they are unavailable over the WebUI by design (fail closed). Only the
 * password reset has a direct IPC path (webui-direct-reset-password) that bypasses this
 * classifier entirely.
 */
export function trustedProxyDeclared(): boolean {
  const raw = process.env.WAYLAND_TRUSTED_PROXY?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

/** Public helper: whether a raw peer address is loopback (after normalization). (#830) */
export function isLoopbackAddress(rawIp: string | undefined | null): boolean {
  if (!rawIp) return false;
  return isLoopback(normalizeIp(rawIp));
}

/**
 * Whether an IP is in 100.64.0.0/10.
 *
 * This is NOT a Tailscale-exclusive range - it is RFC 6598 shared address space,
 * used by real ISPs for carrier-grade NAT. The name is kept for continuity with
 * the range's usual role here, but membership alone proves NOTHING about the peer
 * (see `cgnatPeersAreOperator`). (#529)
 */
function isCgnatRange(ip: string): boolean {
  const octets = parseIpv4(ip);
  if (!octets) return false;
  return octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127;
}

/** Cached set of THIS HOST's own tailnet addresses. `networkInterfaces()` is a
 *  syscall; the answer changes only when tailscale goes up/down, so a short TTL is
 *  plenty. */
let tailnetCache: { value: Set<string>; at: number } | null = null;
const TAILNET_CACHE_MS = 30_000;

/** Test seam: drop the memoized tailnet probe. */
export function resetNetworkTrustCache(): void {
  tailnetCache = null;
}

/**
 * Interfaces Tailscale rides on. It is `tailscale0` on Linux and `Tailscale` on
 * Windows, but a plain `utun<N>` on macOS - so a NAME-ONLY match (as
 * detectNetworkContext.hasTailscaleInterface does) misses every macOS operator.
 * Hence: name match, OR a CGNAT address sitting on a TUNNEL interface.
 */
/**
 * Tailscale's ULA prefix, `fd7a:115c:a1e0::/48`. This is the strongest tailnet
 * signal available: the prefix is registered to Tailscale and is assigned to every
 * tailnet node, so - unlike 100.64.0.0/10 - nothing else hands it out. Not an ISP's
 * carrier NAT, and not an unrelated VPN. It is what lets us identify WHICH interface
 * is Tailscale's, on macOS where the device is a bare `utun<N>`.
 */
const TAILSCALE_ULA = /^fd7a:115c:a1e0:/i;

/**
 * THIS HOST's own tailnet addresses - the local addresses a connection must have
 * LANDED ON to have arrived over the tailnet. Two signals:
 *
 *  1. Any address in Tailscale's registered ULA prefix (`fd7a:115c:a1e0::/48`).
 *     Nothing else hands that out - not an ISP, not another VPN.
 *  2. A 100.64/10 address on a TUNNEL interface (`tailscale0`, macOS `utun<N>`,
 *     `wg0`, ...). Deliberately NOT "a 100.64/10 address anywhere": a host behind
 *     carrier NAT holds one too, but on a PHYSICAL nic (en0/eth0/wlan0) from the
 *     ISP's DHCP. Requiring a tunnel is what separates the tailnet from the ISP.
 *
 * An interface merely NAMED `tailscale*` is NOT enough on its own: a down or
 * logged-out `tailscale0` has no address, and nothing can arrive on it.
 *
 * NOTE on stock macOS: `utun0/1/3/4` exist with no VPN at all (Handoff, Private
 * Relay, AWDL) but carry only `fe80::` link-local and no IPv4, so they contribute
 * nothing here. Verified against a live macOS host.
 */
function hostTailnetAddresses(now: number): Set<string> {
  if (tailnetCache && now - tailnetCache.at < TAILNET_CACHE_MS) return tailnetCache.value;

  const addresses = new Set<string>();
  try {
    for (const [name, addrs] of Object.entries(networkInterfaces())) {
      const entries = (addrs ?? []).filter((a) => !a.internal);

      // Is THIS INTERFACE Tailscale's? Two proofs, and it must be one of them:
      //   - it is named `tailscale*` (Linux `tailscale0`, Windows `Tailscale`), or
      //   - it carries an address in Tailscale's registered ULA prefix.
      // Identifying the INTERFACE (not just the host) is what keeps an unrelated
      // VPN out: WireGuard/corporate pools legitimately hand out RFC 6598 space on
      // a tun/wg device, and "a CGNAT address on some tunnel" would have accepted
      // them. A Tailscale device always carries the fd7a: ULA.
      const isTailscaleIface =
        /^tailscale/i.test(name) || entries.some((a) => TAILSCALE_ULA.test(normalizeIp(a.address)));
      if (!isTailscaleIface) continue;

      for (const addr of entries) {
        const ip = normalizeIp(addr.address);
        // Node reports family as 'IPv4' (older) or 4 (newer). Accept both.
        const isV4 = addr.family === 'IPv4' || (addr.family as unknown as number) === 4;
        if (TAILSCALE_ULA.test(ip) || (isV4 && isCgnatRange(ip))) {
          addresses.add(ip);
        }
      }
    }
  } catch {
    // Interface enumeration failed -> we cannot prove a tailnet. FAIL CLOSED.
    return new Set<string>();
  }

  tailnetCache = { value: addresses, at: now };
  return addresses;
}

/**
 * Whether a 100.64.0.0/10 peer arrived OVER THE TAILNET, and so may be `operator`.
 *
 * The old rule trusted the whole range unconditionally, reasoning that "Tailscale
 * peers are cryptographically authenticated". But 100.64.0.0/10 is RFC 6598 CGNAT
 * space, NOT Tailscale's: with the app in remote mode (bound 0.0.0.0) and reached
 * over a carrier-NAT path, the DIRECT socket peer can be a 100.64.x STRANGER - and
 * this is the gate behind `requireDestructive` (reset / restore / sandbox-disable /
 * password change, configWriteGuards.ts) and behind the forwarded-origin derivation
 * in setup.ts. So the range alone escalated an ISP-adjacent stranger to operator.
 * (#529)
 *
 * The decisive point: asking "is this HOST on a tailnet?" is the WRONG question.
 * Tailscale is the standard workaround FOR a CGNAT ISP, so the hosts behind carrier
 * NAT and the hosts on a tailnet are largely the SAME hosts - a host-global check
 * answers "yes" for exactly the population at risk, and the hole stays open for
 * them. The question is per-CONNECTION: did this connection arrive over the tailnet?
 *
 * `localIp` - the address the connection LANDED ON (`socket.localAddress`) - answers
 * it. A peer that reached us on the tailnet interface landed on one of our OWN
 * tailnet addresses; a stranger on the carrier segment landed on the physical nic.
 * An absent localIp cannot prove tailnet arrival, so it FAILS CLOSED.
 *
 * `WAYLAND_TAILSCALE_CGNAT_OPERATOR` forces the rule on/off for setups where the
 * local node holds no tailnet address of its own (e.g. reached via a subnet router).
 */
function cgnatPeerArrivedOverTailnet(localIp: string | undefined | null, now: number): boolean {
  const override = process.env.WAYLAND_TAILSCALE_CGNAT_OPERATOR?.trim();
  if (override === '1' || override?.toLowerCase() === 'true') return true;
  if (override === '0' || override?.toLowerCase() === 'false') return false;

  if (!localIp) return false; // cannot prove tailnet arrival -> fail closed
  return hostTailnetAddresses(now).has(normalizeIp(localIp));
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
 *
 * FOOTGUN (#830): do NOT list loopback (`127.0.0.0/8`, or a superset like `0.0.0.0/0`)
 * here when `WAYLAND_TRUSTED_PROXY` is set - it re-grants loopback => operator via
 * `matchesOperatorCidr` and reopens the same-host-proxy hole #808 closed. If you are
 * behind a proxy, prove operator by the tailnet path or a NON-loopback forwarded
 * identity, never by allowlisting the loopback the proxy itself connects from.
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
 * EXCEPTION (#808): when `WAYLAND_TRUSTED_PROXY` is declared, loopback is NOT operator
 * - a same-host reverse proxy forwards public traffic as a `127.0.0.1` peer, so a
 * loopback grant there would be operator-for-the-internet. Operator must then come from
 * the CIDR/tailnet checks (or be done from the desktop app over IPC).
 *
 * CALLERS MUST PASS `req.socket.remoteAddress`, never `req.ip` (XFF is spoofable).
 */
export function classifyClientTrust(
  rawIp: string | undefined | null,
  localIp?: string | undefined | null
): NetworkTrust {
  if (!rawIp) return 'restricted';
  const ip = normalizeIp(rawIp);
  // Loopback is the local human ONLY when the app is not knowingly proxied. If the
  // operator declared a same-host reverse proxy, a loopback peer may be that proxy
  // forwarding a stranger, so it is not an operator on its own - it must still clear
  // the CIDR/tailnet checks below (which a bare 127.0.0.1 never will). (#808)
  if (isLoopback(ip) && !trustedProxyDeclared()) return 'operator';
  // 100.64.0.0/10 is RFC 6598 CGNAT, not a Tailscale identity. Honour it as operator
  // ONLY when this connection actually ARRIVED over the tailnet - i.e. it landed on
  // one of our own tailnet addresses. Callers MUST pass `socket.localAddress`; a
  // missing one fails closed. (#529)
  if (isCgnatRange(ip) && cgnatPeerArrivedOverTailnet(localIp, Date.now())) return 'operator';
  if (matchesOperatorCidr(ip)) return 'operator';
  return 'restricted';
}
