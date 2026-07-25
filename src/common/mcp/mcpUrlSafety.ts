/**
 * Shared MCP URL safety classifier used by both the renderer's pre-probe guard
 * and the authoritative main-process validator. Keeping one implementation is
 * important: local MCP servers are a supported product path, while cloud
 * metadata and link-local endpoints remain blocked SSRF targets.
 */

export type McpUrlSafetyResult =
  | { safe: true; url: URL }
  | {
      safe: false;
      reason:
        | 'invalid-url'
        | 'unsupported-scheme'
        | 'metadata-hostname'
        | 'ipv4-link-local'
        | 'ipv6-link-local'
        | 'ipv6-metadata'
        | 'ipv4-mapped-ipv6';
      detail: string;
    };

const BLOCKED_METADATA_HOSTNAMES = new Set(['metadata.google.internal', 'metadata.goog', 'metadata']);

function normalizeIpv6Host(hostname: string): string {
  let host = hostname;
  if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1);
  const zoneIdx = host.indexOf('%');
  if (zoneIdx !== -1) host = host.slice(0, zoneIdx);
  return host.toLowerCase();
}

function isBlockedIpv4(addr: string): boolean {
  return /^169\.254\.\d{1,3}\.\d{1,3}$/.test(addr);
}

function decodeEmbeddedIpv4(ipv6: string): string | 'mapped' | null {
  let tail: string | null = null;
  if (ipv6.startsWith('::ffff:')) tail = ipv6.slice('::ffff:'.length);
  else if (ipv6.startsWith('64:ff9b:1::')) tail = ipv6.slice('64:ff9b:1::'.length);
  else if (ipv6.startsWith('64:ff9b::')) tail = ipv6.slice('64:ff9b::'.length);
  else return null;

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(tail)) return tail;
  const hextets = tail.split(':');
  if (hextets.length === 2 && hextets.every((hextet) => /^[0-9a-f]{1,4}$/.test(hextet))) {
    const hi = parseInt(hextets[0], 16);
    const lo = parseInt(hextets[1], 16);
    return `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
  }
  return 'mapped';
}

/**
 * Accept http(s), including loopback and RFC1918/LAN hosts. Reject only the
 * metadata/link-local targets that a renderer-controlled URL must never reach.
 */
export function classifyMcpHttpUrl(raw: string): McpUrlSafetyResult {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { safe: false, reason: 'invalid-url', detail: 'URL is not valid' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return {
      safe: false,
      reason: 'unsupported-scheme',
      detail: `only http(s) URLs are allowed, got ${url.protocol}`,
    };
  }

  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_METADATA_HOSTNAMES.has(hostname)) {
    return {
      safe: false,
      reason: 'metadata-hostname',
      detail: `host "${url.hostname}" is a blocked metadata endpoint`,
    };
  }
  if (isBlockedIpv4(hostname)) {
    return {
      safe: false,
      reason: 'ipv4-link-local',
      detail: `host "${url.hostname}" is in the blocked link-local metadata range`,
    };
  }

  const ipv6 = normalizeIpv6Host(url.hostname);
  if (ipv6.includes(':')) {
    const firstHextet = ipv6.split(':')[0];
    if (/^fe[89ab][0-9a-f]$/.test(firstHextet)) {
      return {
        safe: false,
        reason: 'ipv6-link-local',
        detail: `host "${url.hostname}" is an IPv6 link-local address`,
      };
    }
    if (ipv6 === 'fd00:ec2::254') {
      return {
        safe: false,
        reason: 'ipv6-metadata',
        detail: `host "${url.hostname}" is an IPv6 metadata endpoint`,
      };
    }
    const embedded = decodeEmbeddedIpv4(ipv6);
    if (embedded !== null) {
      const suffix = embedded !== 'mapped' && isBlockedIpv4(embedded) ? ` mapping to ${embedded}` : '';
      return {
        safe: false,
        reason: 'ipv4-mapped-ipv6',
        detail: `host "${url.hostname}" is an IPv4-mapped/translated IPv6 address${suffix}`,
      };
    }
  }

  return { safe: true, url };
}
