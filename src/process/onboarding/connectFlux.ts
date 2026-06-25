/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Flux Router one-click desktop sign-in (main process).
 *
 * Implements the desktop side of Flux's OAuth 2.0 Authorization Code + PKCE
 * flow (RFC 7636 / 8252) - the conversion hero of first-run onboarding. The
 * user clicks "Connect Flux", the system browser opens to the Flux authorize
 * page, they sign in, and a fresh per-device `sk-flux` key is minted and
 * persisted with zero copy-paste.
 *
 * Flow:
 *  1. Generate a high-entropy PKCE `code_verifier`, its S256 `code_challenge`,
 *     and a random CSRF `state`.
 *  2. Bind a loopback HTTP listener to a random free port on `127.0.0.1` with a
 *     single `/callback` route.
 *  3. Open `https://fluxrouter.ai/desktop/authorize` in the system browser with
 *     the PKCE params + the loopback `redirect_uri`.
 *  4. Wait for the browser redirect back to `/callback?code=...&state=...`,
 *     validate `state`, serve a "return to Wayland" page, and tear the server
 *     down.
 *  5. Exchange the code at `POST https://fluxrouter.ai/api/desktop/token` with
 *     `{ code, code_verifier, redirect_uri }` for `{ api_key, key_prefix, name }`.
 *  6. Persist the key through the model-registry connect path so it is tested,
 *     saved to the OS keychain, and immediately usable.
 *
 * The loopback server is ALWAYS torn down - on success, error, timeout, or
 * cancel. All state is local to a single `connectFlux()` call, so concurrent
 * invocations never interfere.
 */

import { createHash, randomBytes } from 'node:crypto';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { hostname } from 'node:os';

import { shell } from 'electron';

import type { ConnectFluxResult } from '@/common/types/onboarding';
import { connectModelRegistryProvider } from '@process/providers/ipc/modelRegistryIpc';

/** Flux desktop authorize page (system browser opens here). */
export const FLUX_AUTHORIZE_URL = 'https://fluxrouter.ai/desktop/authorize';
/** Flux desktop PKCE token-exchange endpoint. */
export const FLUX_TOKEN_URL = 'https://fluxrouter.ai/api/desktop/token';
/** Local aliases (the desktop flow body reads the short names). */
const AUTHORIZE_URL = FLUX_AUTHORIZE_URL;
const TOKEN_URL = FLUX_TOKEN_URL;
/** Registry provider id the minted key is connected as. */
export const FLUX_PROVIDER_ID = 'flux-router';

/** Overall flow timeout - the user has this long to complete the browser sign-in. */
const FLOW_TIMEOUT_MS = 3 * 60 * 1000;
/** Token-exchange request timeout. */
const TOKEN_TIMEOUT_MS = 20 * 1000;

/** Stable error reasons surfaced to the renderer (matches `ConnectFluxResult`). */
export type ConnectFluxError = 'cancelled' | 'timeout' | 'unauthorized' | 'no-credit' | 'offline' | 'unknown';

/** Shape the Flux `/api/desktop/token` route returns on success. */
export type FluxTokenResponse = {
  api_key: string;
  key_prefix: string;
  name: string;
};

/** PKCE material for one flow. */
export type Pkce = { verifier: string; challenge: string; state: string };

/** Outcome of waiting on the loopback callback. */
type CallbackOutcome = { kind: 'code'; code: string } | { kind: 'error'; error: ConnectFluxError };

/** Generate the PKCE verifier (43-char base64url), its S256 challenge, and CSRF state. */
export function createPkce(): Pkce {
  // 32 random bytes → 43-char base64url verifier, within the RFC 7636 43–128
  // range and the Flux token route's `min(43).max(128)` Zod bound.
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const state = randomBytes(16).toString('base64url');
  return { verifier, challenge, state };
}

/**
 * Build the authorize URL with the exact query params the Flux desktop authorize
 * route reads: `response_type=code`, `code_challenge`, `code_challenge_method=S256`,
 * `state`, `redirect_uri`, and a short `device` label.
 */
export function buildAuthorizeUrl(challenge: string, state: string, redirectUri: string, device: string): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);
  url.searchParams.set('redirect_uri', redirectUri);
  // The route trims `device` to 80 chars and uses it to label the issued key.
  if (device) url.searchParams.set('device', device.slice(0, 80));
  return url.toString();
}

/** Minimal HTML served back to the browser once the callback lands. */
function callbackHtml(ok: boolean): string {
  const heading = ok ? 'You’re connected to Flux' : 'Sign-in didn’t complete';
  const body = ok
    ? 'You can close this tab and return to Wayland.'
    : 'Something went wrong. Return to Wayland and try again.';
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${heading}</title>
    <style>
      body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
        background: #0d0d0d; color: #e6e6e6; font-family: Inter, system-ui, sans-serif; padding: 24px; }
      .card { max-width: 420px; text-align: center; }
      h1 { font-size: 18px; font-weight: 700; color: ${ok ? '#ff6b35' : '#ff5a5a'}; margin: 0; }
      p { margin-top: 10px; font-size: 14px; color: #9a9a9a; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${heading}</h1>
      <p>${body}</p>
    </div>
  </body>
</html>`;
}

/** Close a loopback server without ever throwing. */
function closeServer(server: Server): void {
  try {
    server.close();
  } catch {
    // Already closed / never listened - nothing to do.
  }
}

/**
 * Bind a loopback HTTP server on a random free port of `127.0.0.1`, open the
 * system browser to the authorize URL, and resolve once the browser redirects
 * back to `/callback` with a code (or an error). The CSRF `state` is validated
 * here. The server is always torn down before resolving.
 *
 * Returns the redirect_uri actually used alongside the code, because the token
 * exchange must echo the SAME value the authorize step stored.
 */
function authorizeViaLoopback(pkce: Pkce, device: string): Promise<{ outcome: CallbackOutcome; redirectUri: string }> {
  return new Promise((resolve) => {
    let settled = false;
    let timer: NodeJS.Timeout | null = null;
    let redirectUri = '';

    const finish = (outcome: CallbackOutcome): void => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      closeServer(server);
      resolve({ outcome, redirectUri });
    };

    const onRequest = (req: IncomingMessage, res: ServerResponse): void => {
      // Only the callback path is meaningful; ignore favicon / other probes so a
      // browser prefetch can't prematurely settle the flow.
      const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
      if (requestUrl.pathname !== '/callback') {
        res.writeHead(404).end();
        return;
      }

      const code = requestUrl.searchParams.get('code') ?? '';
      const state = requestUrl.searchParams.get('state') ?? '';
      const authError = requestUrl.searchParams.get('error');

      // The user denied the request, or the authorize page reported an error.
      if (authError || !code) {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(callbackHtml(false));
        finish({ kind: 'error', error: 'cancelled' });
        return;
      }
      // CSRF guard - a mismatched state means a forged / stale callback.
      if (state !== pkce.state) {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(callbackHtml(false));
        finish({ kind: 'error', error: 'unknown' });
        return;
      }

      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(callbackHtml(true));
      finish({ kind: 'code', code });
    };

    const server = createServer(onRequest);

    // A bind failure (port exhaustion, sandbox) means the flow can't start.
    server.once('error', () => finish({ kind: 'error', error: 'unknown' }));

    // Port 0 → OS assigns a free ephemeral port, bound to loopback only.
    server.listen(0, '127.0.0.1', () => {
      const address = server.address() as AddressInfo | null;
      if (!address || typeof address === 'string') {
        finish({ kind: 'error', error: 'unknown' });
        return;
      }

      redirectUri = `http://127.0.0.1:${address.port}/callback`;
      timer = setTimeout(() => finish({ kind: 'error', error: 'timeout' }), FLOW_TIMEOUT_MS);

      const authorizeUrl = buildAuthorizeUrl(pkce.challenge, pkce.state, redirectUri, device);
      // Open the system browser. A failure here (no browser, blocked) means the
      // user can never complete the flow, so fail fast rather than wait it out.
      void shell.openExternal(authorizeUrl).catch(() => finish({ kind: 'error', error: 'unknown' }));
    });
  });
}

/**
 * Exchange the authorization code for a freshly-minted key. Maps Flux's error
 * responses onto the renderer-facing reasons and never throws.
 */
export async function exchangeCode(
  code: string,
  verifier: string,
  redirectUri: string
): Promise<FluxTokenResponse | { error: ConnectFluxError }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TOKEN_TIMEOUT_MS);
  try {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code, code_verifier: verifier, redirect_uri: redirectUri }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { error: mapTokenError(response.status) };
    }

    const body = (await response.json()) as Partial<FluxTokenResponse>;
    if (!body.api_key || typeof body.api_key !== 'string') {
      return { error: 'unknown' };
    }
    return {
      api_key: body.api_key,
      key_prefix: typeof body.key_prefix === 'string' ? body.key_prefix : '',
      name: typeof body.name === 'string' ? body.name : 'Flux Desktop',
    };
  } catch {
    // Network failure / DNS / abort → treat as offline so the UI can prompt a retry.
    return { error: 'offline' };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Map a token-exchange HTTP status onto a renderer-facing reason. The desktop
 * token route emits `invalid_request` / `invalid_grant` / `expired_grant` /
 * `redirect_uri_mismatch` (all 400) and `key_issuance_failed` (500). A 400 here
 * is an unrecoverable single-use-code failure, so the user simply retries the
 * click - surfaced as a generic error rather than a specific auth state.
 */
function mapTokenError(status: number): ConnectFluxError {
  if (status === 401 || status === 403) return 'unauthorized';
  return 'unknown';
}

/** Narrow a model-registry `ConnectError` onto the onboarding error union. */
export function narrowConnectError(error: string | undefined): ConnectFluxError {
  switch (error) {
    case 'unauthorized':
      return 'unauthorized';
    case 'no-credit':
      return 'no-credit';
    case 'offline':
      return 'offline';
    default:
      return 'unknown';
  }
}

/** A short, privacy-safe device label for the issued key (host name, capped). */
function safeDeviceLabel(): string {
  try {
    const host = hostname().trim();
    return host ? host.slice(0, 60) : 'Wayland';
  } catch {
    return 'Wayland';
  }
}

/**
 * Exchange an authorization code for a minted Flux key and persist it through
 * the existing model-registry connect path (tested, keychained, catalog built,
 * legacy mirror written, open pickers revalidated). Shared by the desktop
 * loopback flow AND the remote WebUI route (W4a) so both run identical token
 * exchange + persistence with one redirect_uri contract.
 *
 * WRITE-ONLY: the minted `api_key` is consumed here and never returned to the
 * caller - the result is status only (`{ ok }` + a stable error reason). The
 * `redirectUri` MUST be the exact value the authorize step used (the Flux token
 * route validates it server-side).
 *
 * Never rejects: maps any failure onto the `ConnectFluxError` union.
 */
export async function connectFluxRemoteExchange(input: {
  code: string;
  verifier: string;
  redirectUri: string;
}): Promise<{ ok: true } | { ok: false; error: ConnectFluxError }> {
  try {
    const exchanged = await exchangeCode(input.code, input.verifier, input.redirectUri);
    if ('error' in exchanged) {
      return { ok: false, error: exchanged.error };
    }

    const connected = await connectModelRegistryProvider(FLUX_PROVIDER_ID, { key: exchanged.api_key });
    if (!connected.ok) {
      return { ok: false, error: narrowConnectError(connected.error) };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'unknown' };
  }
}

/**
 * Run the full Flux one-click connect flow. Resolves with a renderer-safe
 * `ConnectFluxResult` and never rejects.
 *
 * @returns `{ ok: true }` once the minted key is connected + persisted, or
 *   `{ ok: false, error }` with a stable reason the onboarding UI maps to copy.
 */
export async function connectFlux(): Promise<ConnectFluxResult> {
  try {
    const pkce = createPkce();
    const device = safeDeviceLabel();

    const { outcome, redirectUri } = await authorizeViaLoopback(pkce, device);
    if (outcome.kind === 'error') {
      return { ok: false, error: outcome.error };
    }

    // The token route validates redirect_uri against what was stored at authorize
    // time, so we echo the exact value the loopback step used. Exchange + persist
    // share the remote core so both flows are identical past the code.
    return await connectFluxRemoteExchange({
      code: outcome.code,
      verifier: pkce.verifier,
      redirectUri,
    });
  } catch {
    return { ok: false, error: 'unknown' };
  }
}
