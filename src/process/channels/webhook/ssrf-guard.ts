/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * SSRF guard for outbound URLs. Resolves the URL's hostname and returns true
 * if any resolved address points at a host the receiver must not contact
 * (RFC1918, loopback, link-local, cloud metadata endpoints, etc.).
 *
 * Used by the receiver when callers ask it to fetch an attachment URL
 * provided in a webhook payload. NOT used to gate inbound delivery - for
 * that we rely on the connection token + signature verification.
 */

const LITERAL_METADATA_HOSTS = new Set<string>([
  'metadata.google.internal',
  'metadata.googleapis.com',
  'metadata',
  'fd00:ec2::254',
]);

export async function isSsrfTarget(url: string): Promise<boolean> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return true;
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (LITERAL_METADATA_HOSTS.has(hostname)) {
    return true;
  }

  const literalFamily = isIP(hostname);
  if (literalFamily === 4 && isReservedIPv4(hostname)) return true;
  if (literalFamily === 6 && isReservedIPv6(hostname)) return true;
  if (literalFamily !== 0) return false;

  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await lookup(hostname, { all: true });
  } catch {
    return true;
  }

  if (addresses.length === 0) return true;

  for (const { address, family } of addresses) {
    if (family === 4 && isReservedIPv4(address)) return true;
    if (family === 6 && isReservedIPv6(address)) return true;
  }

  return false;
}

/**
 * RFC1918, loopback, link-local, CGNAT, "this network".
 */
function isReservedIPv4(addr: string): boolean {
  const parts = addr.split('.').map((p) => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    return true;
  }
  const [a, b] = parts as [number, number, number, number];

  if (a === 0) return true;
  if (a === 10) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;

  return false;
}

/**
 * Loopback (::1), link-local (fe80::/10), unique-local (fc00::/7),
 * and IPv4-mapped variants of the reserved IPv4 ranges.
 */
function isReservedIPv6(addr: string): boolean {
  const normalized = addr.toLowerCase();

  if (normalized === '::1') return true;
  if (normalized === '::' || normalized === '::0') return true;

  if (/^fe[89ab][0-9a-f]?:/.test(normalized)) return true;
  if (/^f[cd][0-9a-f]{0,2}:/.test(normalized)) return true;

  const mapped = /^::ffff:([0-9.]+)$/.exec(normalized);
  if (mapped && mapped[1] && isIP(mapped[1]) === 4) {
    return isReservedIPv4(mapped[1]);
  }

  return false;
}
