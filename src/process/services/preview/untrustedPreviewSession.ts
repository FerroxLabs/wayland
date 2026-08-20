/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * P2-8, main-process half: make the preview partition incapable of reaching the
 * network, and stamp the policy onto documents we cannot inject a `<meta>` into.
 *
 * This is the layer that holds when the others do not. The renderer's CSP meta
 * covers HTML we assemble into a `data:` URL; it cannot cover a report opened
 * straight off disk as `file://`, because those bytes are the user's file. The
 * session covers both, because every subresource from either document kind -
 * a `<img src="https://…">` beacon, a `fetch()`, a font, a stylesheet - is a
 * request in this session, and this cancels it.
 *
 * Scoped to ONE partition on purpose. The app's other web contents (ambient
 * window, URL viewers, OAuth flows) need the network; blocking it globally
 * would break them, and blocking it here breaks nothing, because a preview of a
 * locally-generated report has no legitimate remote dependency.
 */

import { isBlockedPreviewRequestUrl, UNTRUSTED_PREVIEW_CSP } from '@/common/preview/untrustedPreview';

/**
 * The slice of Electron's `Session` this module touches. Narrowed to what is
 * used so the policy can be exercised without an Electron runtime - the rules
 * are the part worth testing, and they are pure.
 */
export interface UntrustedPreviewSessionLike {
  webRequest: {
    onBeforeRequest(
      filter: { urls: string[] },
      listener: (details: { url: string }, callback: (response: { cancel: boolean }) => void) => void
    ): void;
    onHeadersReceived(
      filter: { urls: string[] },
      listener: (
        details: { url: string; responseHeaders?: Record<string, string[]> },
        callback: (response: { responseHeaders?: Record<string, string[]> }) => void
      ) => void
    ): void;
  };
  setPermissionRequestHandler(
    handler: ((webContents: unknown, permission: string, callback: (granted: boolean) => void) => void) | null
  ): void;
  setPermissionCheckHandler(handler: ((webContents: unknown, permission: string) => boolean) | null): void;
}

/**
 * `<all_urls>` is the only filter that also matches non-http schemes; the
 * default (`urls: []`) would silently skip `file://`, which is exactly the
 * document kind this session exists to cover.
 */
const ALL_URLS = { urls: ['<all_urls>'] };

/**
 * Apply the preview policy to a session.
 *
 * Idempotent per session by construction at the call site (installed once at
 * startup); calling it twice would stack listeners, and Electron replaces
 * rather than stacks for `onBeforeRequest`/`onHeadersReceived`, so a second
 * call is harmless but pointless.
 */
export function hardenUntrustedPreviewSession(target: UntrustedPreviewSessionLike): void {
  target.webRequest.onBeforeRequest(ALL_URLS, (details, callback) => {
    callback({ cancel: isBlockedPreviewRequestUrl(details?.url ?? '') });
  });

  target.webRequest.onHeadersReceived(ALL_URLS, (details, callback) => {
    const responseHeaders: Record<string, string[]> = { ...details?.responseHeaders };
    // Header names are case-insensitive on the wire, so a response carrying
    // `Content-Security-Policy` would sit beside a newly added lower-case key
    // and both would be enforced (they intersect, so this is a correctness and
    // auditability fix, not a bypass). Strip every casing, then add exactly one.
    for (const key of Object.keys(responseHeaders)) {
      if (key.toLowerCase() === 'content-security-policy') delete responseHeaders[key];
      if (key.toLowerCase() === 'content-security-policy-report-only') delete responseHeaders[key];
    }
    responseHeaders['Content-Security-Policy'] = [UNTRUSTED_PREVIEW_CSP];
    callback({ responseHeaders });
  });

  // A report has no business asking for the camera, the microphone, geolocation
  // or notifications. Electron's default is to PROMPT, which on an unattended
  // cron render is a dialog nobody is there to dismiss.
  target.setPermissionRequestHandler((_contents, _permission, callback) => {
    callback(false);
  });
  target.setPermissionCheckHandler(() => false);
}
