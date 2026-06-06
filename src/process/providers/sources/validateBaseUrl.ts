/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Provider `baseUrl` validation (main process).
 *
 * Used at provider-save AND at refresh time to gate where the catalog fetcher
 * is allowed to talk. Auto-refresh skips providers whose saved base fails this
 * check - an unattended background fetch must never be pointed at a loopback,
 * link-local, or private-network literal (SSRF surface).
 *
 * Rules:
 *  - Must parse as a URL with an `https:` scheme.
 *  - `http:` is allowed ONLY for `localhost` / `127.0.0.1` and ONLY outside
 *    production (`NODE_ENV !== 'production'`) - a dev convenience, never shipped.
 *  - Any loopback / link-local / private-IP literal host is rejected outright
 *    (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16, ::1, fc00::/7,
 *    fe80::/10), as is any non-http(s) scheme.
 *
 * Pure - no I/O, no DNS resolution, no deps. A hostname that *resolves* to a
 * private IP is a separate (DNS-rebinding) concern handled at fetch time.
 */

export type BaseUrlValidation = { ok: true } | { ok: false; reason: string };

/** Validate a provider base URL. Pure; returns a typed pass/fail with a reason. */
export function validateProviderBaseUrl(baseUrl: string): BaseUrlValidation {
  if (typeof baseUrl !== 'string' || baseUrl.trim().length === 0) {
    return { ok: false, reason: 'empty' };
  }

  let url: URL;
  try {
    url = new URL(baseUrl.trim());
  } catch {
    return { ok: false, reason: 'unparseable' };
  }

  const scheme = url.protocol;
  if (scheme !== 'https:' && scheme !== 'http:') {
    return { ok: false, reason: `scheme-not-allowed:${scheme.replace(/:$/, '')}` };
  }

  const host = normalizeHost(url.hostname);

  if (scheme === 'http:') {
    const isDevLoopback = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (isDevLoopback && !isProduction()) {
      return { ok: true };
    }
    return { ok: false, reason: 'http-not-allowed' };
  }

  // https: - still reject literal loopback / link-local / private-IP hosts so
  // auto-refresh can never be aimed inside the local network.
  if (isPrivateOrLoopbackHost(host)) {
    return { ok: false, reason: 'private-host' };
  }

  return { ok: true };
}

// ─── Pure helpers ───────────────────────────────────────────────────────────────

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** Lowercase + strip an IPv6 bracket/zone so checks compare bare literals. */
function normalizeHost(hostname: string): string {
  let host = hostname.toLowerCase();
  if (host.startsWith('[') && host.endsWith(']')) {
    host = host.slice(1, -1);
  }
  const zoneIdx = host.indexOf('%');
  if (zoneIdx !== -1) {
    host = host.slice(0, zoneIdx);
  }
  return host;
}

/** True for loopback, link-local, and RFC-1918 private literals (v4 + v6). */
function isPrivateOrLoopbackHost(host: string): boolean {
  if (host === 'localhost') return true;

  // IPv6 loopback / link-local (fe80::/10) / unique-local (fc00::/7).
  if (host === '::1') return true;
  if (host.startsWith('fe8') || host.startsWith('fe9') || host.startsWith('fea') || host.startsWith('feb')) {
    return true; // fe80::/10
  }
  if (host.startsWith('fc') || host.startsWith('fd')) return true; // fc00::/7

  // IPv4 literals.
  const v4 = parseIpv4(host);
  if (v4) {
    const [a, b] = v4;
    if (a === 127) return true; // 127.0.0.0/8 loopback
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local
    if (a === 0) return true; // 0.0.0.0/8
  }

  return false;
}

/** Parse a dotted-quad IPv4 literal into its octets, or `null` if it isn't one. */
function parseIpv4(host: string): [number, number, number, number] | null {
  const parts = host.split('.');
  if (parts.length !== 4) return null;
  const octets: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    octets.push(n);
  }
  return [octets[0], octets[1], octets[2], octets[3]];
}
