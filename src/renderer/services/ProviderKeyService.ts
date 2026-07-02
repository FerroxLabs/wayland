/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCsrfToken } from '@process/webserver/middleware/csrfClient';
import type { IModelRegistryConnectResult } from '@/common/adapter/ipcBridge';
import type { ConnectError, ProviderConnState, ProviderId } from '@process/providers/types';

/**
 * Browser/WebUI client for the write-only provider-key route
 * (remote-secure-config W1.A). On desktop the connect flow goes through Electron
 * IPC (`modelRegistry.connect`); in a hosted WebUI that IPC is denied (it would
 * return a decrypted key to a remote caller), so the headless ConnectPanel posts
 * the key through this token-authed + CSRF'd HTTP route instead.
 *
 * The route is WRITE-ONLY: it returns only non-secret status ({ state,
 * modelCount }), never the key.
 */

function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { 'x-csrf-token': token } : {};
}

/** Non-secret status returned by a successful connect. */
export type ConnectProviderStatus = { state: ProviderConnState; modelCount: number };

/**
 * Abort the connect POST after this long so a hung request (stalled edge, a
 * proxy that never responds) surfaces an honest "offline" error instead of
 * spinning the Connect button forever (#524). Generous enough that a slow but
 * valid provider round-trip (test call host-side) still completes.
 */
const CONNECT_TIMEOUT_MS = 30_000;

/** Cap on echoed server text so a fallback message can't flood the UI. */
const MAX_SERVER_MESSAGE_LEN = 200;

/** Host-side `ConnectError` codes the connect route can return in `error`. */
const HOST_CONNECT_ERRORS: ReadonlySet<string> = new Set([
  'unauthorized',
  'no-credit',
  'offline',
  'unrecognized',
  'no-models',
  'unknown',
]);

/** Shape of the JSON body the connect route (and its guards) can return. */
type ConnectResponseBody = {
  success?: boolean;
  error?: string;
  code?: string;
  msg?: string;
  data?: ConnectProviderStatus;
};

/**
 * Scrub anything that looks like a secret out of server text before it is shown
 * in the UI. The server already redacts its own messages; this is a defensive
 * second pass so a widened future error shape can never leak a pasted key.
 */
function safeServerText(text: string): string | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  const scrubbed = trimmed
    .replace(/\b(sk|pk|rk|api|key|token|bearer)[-_ ]?[A-Za-z0-9._-]{8,}/gi, '[redacted]')
    .slice(0, MAX_SERVER_MESSAGE_LEN);
  return scrubbed;
}

/**
 * Classify a failed connect response into a `ConnectError` (plus, for the
 * catch-all, the server's own message). The hosted `/api/providers/connect`
 * route can be rejected by several guards BEFORE the key reaches a provider -
 * each guard has a distinct body shape, and this maps them to actionable codes
 * so the Connect button never dead-ends on a generic "unknown" (#524):
 *   - CSRF (tiny-csrf)        → 403 `{ code: 'csrf_invalid' }`   → 'csrf-invalid'
 *   - HTTPS config-write floor → 403 `{ msg: 'HTTPS required…' }` → 'https-required'
 *   - token auth              → 403 `{ error: 'Access denied. Please login first.' }` → 'auth-required'
 *   - real connect failure    → 400 `{ error: <ConnectError> }`  → that code
 *   - anything else           → 'unknown' + the server's message text
 */
export function classifyConnectFailure(body: ConnectResponseBody): {
  error: ConnectError;
  errorMessage?: string;
} {
  const code = typeof body.code === 'string' ? body.code : '';
  const msg = typeof body.msg === 'string' ? body.msg : '';
  const rawError = typeof body.error === 'string' ? body.error : '';

  // CSRF is disambiguated by an explicit machine code (its `error` text is a
  // human sentence, not a ConnectError enum value).
  if (code === 'csrf_invalid') return { error: 'csrf-invalid' };

  // The config-write floor identifies itself by its `msg`.
  if (/^https required/i.test(msg)) return { error: 'https-required' };

  // The token middleware rejects an unauthenticated write with this sentence.
  if (/please login first/i.test(rawError)) return { error: 'auth-required' };

  // A genuine provider connect failure returns a fixed ConnectError enum code.
  if (HOST_CONNECT_ERRORS.has(rawError)) return { error: rawError as ConnectError };

  // Never collapse silently: if the server told us why (a 400 field-validation
  // `msg`, an unexpected 500 body), surface that text so the user sees a reason.
  return { error: 'unknown', errorMessage: safeServerText(msg || rawError) };
}

/**
 * Plant a provider API key from the remote WebUI. Mirrors the desktop
 * `connect(...)` return shape ({@link IModelRegistryConnectResult}) so the
 * shared ConnectPanel can consume it unchanged: `{ ok: true }` on success, or
 * `{ ok: false, error }` carrying the server's `ConnectError` code on failure.
 */
export async function connectProviderHttp(
  providerId: ProviderId,
  key: string,
  baseUrl?: string
): Promise<IModelRegistryConnectResult> {
  const csrf = getCsrfToken();
  const controller = new AbortController();
  // The timeout must cover BOTH the fetch AND the body read: a broken proxy can
  // send response headers (resolving `fetch`) then stall the body forever. So
  // the signal stays armed across `res.json()` and the timer is only cleared in
  // `finally` - never before the body has been read (#524).
  const timer = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS);

  try {
    const res = await fetch('/api/providers/connect', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
      body: JSON.stringify({ providerId, key, baseUrl, _csrf: csrf }),
      signal: controller.signal,
    });

    let json: ConnectResponseBody = {};
    try {
      json = (await res.json()) as ConnectResponseBody;
    } catch (err) {
      // A body read aborted by our own timeout is a stall - rethrow so it
      // surfaces as offline below. A merely malformed/empty body is not fatal:
      // leave `json` empty and classify from the HTTP status instead.
      if (controller.signal.aborted) throw err;
    }

    if (!res.ok || !json.success) {
      return { ok: false, ...classifyConnectFailure(json) };
    }
    return { ok: true };
  } catch {
    // Timeout/abort (fetch or a stalled body read) or a network-level failure -
    // the server was unreachable, so surface offline rather than spinning.
    return { ok: false, error: 'offline' };
  } finally {
    clearTimeout(timer);
  }
}
