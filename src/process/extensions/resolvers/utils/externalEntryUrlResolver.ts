/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared gate for an extension contribution's EXTERNAL (`http(s)://`) entry URL.
 *
 * Multiple resolvers (settings tabs, workspace panels, file-preview actions)
 * accept an external `entryPoint` and feed the result into a webview/iframe. Each
 * used to re-derive the same validation, and the cleartext-http guard was added to
 * only one of them (#818 / PR #823) — leaving the identical hole open on the others
 * (#824). Hoisting the rule here means one gate protects every surface, so wiring a
 * new external entry URL into a webview cannot silently reintroduce the MITM shape.
 *
 * The rule: `https` is always allowed; `http` is allowed ONLY on loopback
 * (localhost / 127.0.0.1 / ::1), which is not MITM-able and is how a hosted panel is
 * developed. Any other protocol, or cleartext http to a non-loopback host, or an
 * unparseable URL, is refused (returns `undefined` + a warning) so it never renders.
 */

/** Loopback is not MITM-able, so cleartext there is safe (and is how a hosted surface is developed). */
export function isLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

/**
 * Validate an external `http(s)://` entry point. Returns the normalized URL string,
 * or `undefined` (with a warning) if the protocol is unsupported, the URL is
 * malformed, or it is cleartext http to a non-loopback host.
 *
 * @param entryPoint The raw external URL from the extension manifest.
 * @param label      Human label for the contribution surface (used in warnings).
 * @param extName    Source extension name (used in warnings).
 */
export function resolveExternalEntryUrl(entryPoint: string, label: string, extName: string): string | undefined {
  try {
    const external = new URL(entryPoint);
    if (external.protocol !== 'http:' && external.protocol !== 'https:') {
      console.warn(`[Extensions] Unsupported ${label} external protocol: ${entryPoint} (extension: ${extName})`);
      return undefined;
    }
    if (external.protocol === 'http:' && !isLoopbackHost(external.hostname)) {
      console.warn(`[Extensions] Refusing cleartext http ${label} (use https): ${entryPoint} (extension: ${extName})`);
      return undefined;
    }
    return external.toString();
  } catch {
    console.warn(`[Extensions] Invalid ${label} external URL: ${entryPoint} (extension: ${extName})`);
    return undefined;
  }
}
