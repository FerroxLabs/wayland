/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs. Changes are documented in the project history.
 */

/**
 * API Provider Host Configuration
 *
 * Centralized management of official API hostnames for AI providers
 */
export const API_HOST_CONFIG = {
  /**
   * Google AI Official Hosts
   */
  google: {
    /** Gemini API (generativelanguage.googleapis.com) */
    gemini: 'generativelanguage.googleapis.com',
    /** Vertex AI (aiplatform.googleapis.com) */
    vertexAi: 'aiplatform.googleapis.com',
  },

  /**
   * OpenAI Official Hosts
   */
  openai: {
    api: 'api.openai.com',
  },

  /**
   * Anthropic Official Hosts
   */
  anthropic: {
    api: 'api.anthropic.com',
  },
} as const;

/**
 * Google API Hosts Whitelist (derived from config)
 */
export const GOOGLE_API_HOSTS = Object.values(API_HOST_CONFIG.google);

/**
 * Safely validate if URL is an official host for specified provider
 *
 * @param urlString - URL string to validate
 * @param allowedHosts - List of allowed hostnames
 * @returns Returns true if valid official host
 */
export function isOfficialHost(urlString: string, allowedHosts: readonly string[]): boolean {
  try {
    const url = new URL(urlString);
    return allowedHosts.includes(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Safely validate if URL is a Google APIs host
 *
 * Uses URL parsing instead of string includes to prevent malicious URL bypass
 *
 * @param urlString - URL string to validate
 * @returns Returns true if valid Google APIs host
 *
 * @example
 * isGoogleApisHost('https://generativelanguage.googleapis.com/v1') // true
 * isGoogleApisHost('https://evil.com/generativelanguage.googleapis.com') // false
 * isGoogleApisHost('https://generativelanguage.googleapis.com.evil.com') // false
 */
export function isGoogleApisHost(urlString: string): boolean {
  return isOfficialHost(urlString, GOOGLE_API_HOSTS);
}

/**
 * Validate if URL is an official OpenAI host
 */
export function isOpenAIHost(urlString: string): boolean {
  return isOfficialHost(urlString, Object.values(API_HOST_CONFIG.openai));
}

/**
 * Lowercase a hostname and strip an IPv6 bracket wrapper / zone id so checks
 * compare bare literals. `[fe80::1%25eth0]` -> `fe80::1`.
 */
export function normalizeHostLiteral(hostname: string): string {
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

/** Parse a dotted-quad IPv4 literal into its octets, or `null` if it isn't one. */
function parseIpv4Octets(host: string): [number, number, number, number] | null {
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

/**
 * Single canonical loopback / private-network host classifier.
 *
 * True for: `localhost`, loopback (127.0.0.0/8, ::1), unspecified (0.0.0.0/8),
 * RFC-1918 (10/8, 172.16-31, 192.168/16), link-local (169.254.0.0/16,
 * fe80::/10), and IPv6 unique-local (fc00::/7). Public hosts are false.
 *
 * This is the ONE place this judgment lives. It gates the keyless-provider
 * allowance (an empty API key is permitted ONLY when the resolved base-URL host
 * is local - local inference backends like Ollama / LM Studio / llama.cpp need
 * no key). It is intentionally INDEPENDENT of the narrow cloud-metadata SSRF
 * deny-list (`assertSafeBaseUrl`), which blocks a different, smaller set and
 * must not be widened by this helper.
 *
 * Pure - no DNS, no I/O. A hostname that *resolves* to a private IP is a
 * separate (DNS-rebinding) concern handled at fetch time.
 */
export function isLoopbackOrPrivateHost(hostname: string): boolean {
  if (typeof hostname !== 'string' || hostname.length === 0) return false;
  const host = normalizeHostLiteral(hostname);
  if (host === 'localhost') return true;

  // IPv6 loopback / link-local (fe80::/10) / unique-local (fc00::/7).
  if (host === '::1') return true;
  if (host.startsWith('fe8') || host.startsWith('fe9') || host.startsWith('fea') || host.startsWith('feb')) {
    return true; // fe80::/10
  }
  if (host.startsWith('fc') || host.startsWith('fd')) return true; // fc00::/7

  // IPv4 literals.
  const v4 = parseIpv4Octets(host);
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

/**
 * Parse a base URL and report whether its host is loopback / private. Returns
 * `false` for an empty / unparseable URL (no host to trust). Used by the keyless
 * gate, which must fail closed: only a clearly-local host unlocks keyless.
 */
export function isLocalBaseUrl(baseUrl: string | undefined | null): boolean {
  if (typeof baseUrl !== 'string' || baseUrl.trim().length === 0) return false;
  try {
    const raw = baseUrl.trim();
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `http://${raw}`;
    return isLoopbackOrPrivateHost(new URL(withScheme).hostname);
  } catch {
    return false;
  }
}

/**
 * Schemes allowed to be handed to the OS via shell.openExternal.
 *
 * Only web/mail and the app's own deep-link scheme (`wayland:`, see
 * src/process/utils/deepLink.ts PROTOCOL_SCHEME) are permitted. Everything else
 * - `file:`, `smb:`, `ms-*`, `vbscript:`, and any registered custom-protocol
 * handler - is rejected so model-rendered markdown links cannot drive the OS
 * into opening local files, leaking NTLM credentials, or launching arbitrary
 * protocol handlers. Schemes are compared lowercase, with the trailing colon.
 */
export const ALLOWED_EXTERNAL_URL_SCHEMES: readonly string[] = ['https:', 'http:', 'mailto:', 'wayland:'];

/**
 * Validate that a URL uses a scheme on the openExternal allowlist.
 *
 * Returns false for unparseable URLs and for any scheme not in
 * {@link ALLOWED_EXTERNAL_URL_SCHEMES}. Used by both the main-process shell
 * bridges and the renderer's openExternalUrl helper so the gate is identical on
 * every path.
 */
export function isAllowedExternalUrl(urlString: string): boolean {
  let protocol: string;
  try {
    protocol = new URL(urlString).protocol;
  } catch {
    return false;
  }
  return ALLOWED_EXTERNAL_URL_SCHEMES.includes(protocol.toLowerCase());
}
