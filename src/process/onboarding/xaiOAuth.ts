/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Native xAI "Sign in with X (Grok)" desktop OAuth (main process).
 *
 * Lets a user authenticate Grok via their SuperGrok / X Premium subscription -
 * no `grok` CLI on PATH and no pasted API key. It is standard OAuth 2.0
 * Authorization Code + PKCE (RFC 7636 / 8252, S256) with a loopback callback
 * against `accounts.x.ai` (endpoints discovered from xAI's OIDC document). The
 * resulting bearer token works against the general API at `https://api.x.ai/v1`,
 * so it is persisted through the model-registry connect path as the `xai`
 * provider and immediately usable in chat / model selection.
 *
 * Flow:
 *  1. If `~/.grok/auth.json` (the official Grok CLI store) already holds a
 *     usable, non-expired token, reuse it - register and return (no browser).
 *  2. Else run PKCE: generate verifier/challenge/state, bind a loopback HTTP
 *     listener on a free `127.0.0.1` port, discover the authorize/token
 *     endpoints, open the system browser, and wait for `/callback?code=…`.
 *  3. Exchange the code at the token endpoint for `{ access_token, refresh_token }`.
 *  4. Persist the refresh token (encrypted) for silent re-auth, and register the
 *     access token through `connectModelRegistryProvider('xai', { key })`.
 *
 * The loopback server is ALWAYS torn down. The token is only ever sent to the
 * discovered token endpoint (host-pinned to `*.x.ai`); the bearer is only ever
 * used against `api.x.ai/v1` (the registry's pinned host). The flow never throws
 * - it resolves a stable `XaiOAuthResult`.
 */

import { promises as fs } from 'node:fs';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { homedir } from 'node:os';
import path from 'node:path';

import { shell } from 'electron';
import log from 'electron-log';

import type { XaiOAuthResult } from '@/common/types/onboarding';
import type { ProviderId } from '@process/providers/types';
import { connectModelRegistryProvider } from '@process/providers/ipc/modelRegistryIpc';
import {
  buildAuthorizeUrl,
  createPkce,
  isPinnedXaiHttps,
  isTokenExpired,
  parseDiscovery,
  parseGrokAuthJson,
  parseTokenResponse,
  resolveClientId,
  XAI_AUTHORIZE_URL_FALLBACK,
  XAI_DISCOVERY_URL,
  XAI_SCOPES,
  XAI_TOKEN_URL_FALLBACK,
  type Pkce,
  type XaiEndpoints,
  type XaiTokens,
} from './xaiOAuthCore';
import { loadXaiTokens, saveXaiTokens } from './xaiTokenStore';

/** Registry provider id the obtained token is connected as. */
const XAI_PROVIDER_ID: ProviderId = 'xai';

/** Overall flow timeout - how long the user has to complete the browser sign-in. */
const FLOW_TIMEOUT_MS = 3 * 60 * 1000;
/** Per-request network timeout (discovery + token exchange). */
const NET_TIMEOUT_MS = 20 * 1000;

/** Stable error reasons surfaced to the renderer (matches `XaiOAuthResult`). */
type XaiOAuthError = 'cancelled' | 'timeout' | 'unauthorized' | 'no-credit' | 'offline' | 'unknown';

/** Outcome of waiting on the loopback callback. */
type CallbackOutcome = { kind: 'code'; code: string } | { kind: 'error'; error: XaiOAuthError };

/**
 * Handle to feed a manually-pasted code into the in-flight loopback flow. xAI's
 * desktop consent screen shows a code to copy ("Copy the code below into Grok
 * Build...") rather than redirecting to the loopback, so the renderer offers a
 * paste box; submitting the code resolves the same flow the loopback would have.
 * Null when no sign-in is currently awaiting a code.
 */
let activeManualSubmit: ((code: string) => void) | null = null;

/**
 * Complete an in-flight xAI sign-in with the code the user copied from the xAI
 * consent page. Returns false when no sign-in is awaiting a code. Never throws.
 */
export function xaiSubmitManualCode(code: string): boolean {
  const trimmed = code.trim();
  log.info('[xai] manual submit', { active: activeManualSubmit !== null, len: trimmed.length });
  if (!activeManualSubmit || trimmed.length === 0) return false;
  activeManualSubmit(trimmed);
  return true;
}

// ─── Public entry points ──────────────────────────────────────────────────────

/**
 * Run the full native xAI sign-in. Reuses an existing Grok CLI credential when
 * present, otherwise runs the browser PKCE flow. Resolves a renderer-safe
 * `XaiOAuthResult`; never rejects.
 */
export async function xaiOAuthLogin(): Promise<XaiOAuthResult> {
  try {
    // 1. Reuse an existing Grok CLI credential if it is still usable.
    const reused = await tryReuseGrokCli();
    log.info('[xai] login start', { reusedCli: reused !== null });
    if (reused) return reused;

    // 2. Browser PKCE flow.
    const pkce = createPkce();
    const endpoints = await fetchXaiEndpoints();
    const clientId = resolveClientId();

    const { outcome, redirectUri } = await authorizeViaLoopback(pkce, endpoints.authorizeUrl, clientId);
    if (outcome.kind === 'error') return { ok: false, error: outcome.error };

    const tokens = await exchangeCode(endpoints.tokenUrl, {
      code: outcome.code,
      verifier: pkce.verifier,
      redirectUri,
      clientId,
    });
    log.info('[xai] exchange result', { ok: !('error' in tokens), error: 'error' in tokens ? tokens.error : undefined });
    if ('error' in tokens) return { ok: false, error: tokens.error };

    const result = await registerTokens(tokens, false);
    log.info('[xai] register result', { ok: result.ok, error: 'error' in result ? result.error : undefined });
    return result;
  } catch {
    return { ok: false, error: 'unknown' };
  }
}

/**
 * Silent re-auth on a 401: exchange the persisted refresh token for a new
 * access token and re-register it. Returns `{ ok: true }` when a fresh token was
 * obtained and connected, otherwise a stable error (the caller then surfaces the
 * full re-auth path - i.e. prompts the user to click "Sign in with X" again).
 */
export async function xaiRefreshToken(): Promise<XaiOAuthResult> {
  try {
    const stored = await loadXaiTokens();
    if (!stored?.refreshToken) return { ok: false, error: 'unauthorized' };

    const endpoints = await fetchXaiEndpoints();
    const clientId = resolveClientId();
    const tokens = await refreshAccessToken(endpoints.tokenUrl, stored.refreshToken, clientId);
    if ('error' in tokens) return { ok: false, error: tokens.error };

    // A refresh response may omit a new refresh_token; carry the old one forward.
    if (!tokens.refreshToken) tokens.refreshToken = stored.refreshToken;
    return await registerTokens(tokens, false);
  } catch {
    return { ok: false, error: 'unknown' };
  }
}

// ─── Grok CLI reuse ───────────────────────────────────────────────────────────

/** Absolute path to the official Grok CLI credential file. */
function grokAuthJsonPath(): string {
  return path.join(homedir(), '.grok', 'auth.json');
}

/**
 * If `~/.grok/auth.json` holds a usable, non-expired token, register it and
 * return a success result. Returns `null` when the file is missing, malformed,
 * or its token is expired (so the caller proceeds to the browser flow).
 */
async function tryReuseGrokCli(): Promise<XaiOAuthResult | null> {
  let raw: string;
  try {
    raw = await fs.readFile(grokAuthJsonPath(), 'utf-8');
  } catch {
    return null; // No CLI credential present.
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const tokens = parseGrokAuthJson(parsed);
  if (!tokens || isTokenExpired(tokens)) return null;

  return await registerTokens(tokens, true);
}

// ─── Endpoint discovery ───────────────────────────────────────────────────────

/**
 * Fetch the xAI OIDC discovery document and extract the authorize/token
 * endpoints. Falls back to the pinned constants when discovery is unreachable or
 * fails the `*.x.ai` HTTPS host pin - the flow stays functional either way.
 */
async function fetchXaiEndpoints(): Promise<XaiEndpoints> {
  const fallback: XaiEndpoints = {
    authorizeUrl: XAI_AUTHORIZE_URL_FALLBACK,
    tokenUrl: XAI_TOKEN_URL_FALLBACK,
  };
  try {
    const res = await fetchWithTimeout(XAI_DISCOVERY_URL, { method: 'GET' });
    if (!res.ok) return fallback;
    const doc = (await res.json()) as unknown;
    return parseDiscovery(doc) ?? fallback;
  } catch {
    return fallback;
  }
}

// ─── Loopback authorize ───────────────────────────────────────────────────────

/** Minimal HTML served back to the browser once the callback lands. */
function callbackHtml(ok: boolean): string {
  const heading = ok ? 'You’re signed in to Grok' : 'Sign-in didn’t complete';
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
      h1 { font-size: 18px; font-weight: 700; color: ${ok ? '#ffffff' : '#ff5a5a'}; margin: 0; }
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
 */
function authorizeViaLoopback(
  pkce: Pkce,
  authorizeUrl: string,
  clientId: string
): Promise<{ outcome: CallbackOutcome; redirectUri: string }> {
  return new Promise((resolve) => {
    let settled = false;
    let timer: NodeJS.Timeout | null = null;
    let redirectUri = '';

    const finish = (outcome: CallbackOutcome): void => {
      if (settled) return;
      log.info('[xai] flow finish', { kind: outcome.kind, error: outcome.kind === 'error' ? outcome.error : undefined });
      settled = true;
      activeManualSubmit = null;
      if (timer) clearTimeout(timer);
      closeServer(server);
      resolve({ outcome, redirectUri });
    };

    const onRequest = (req: IncomingMessage, res: ServerResponse): void => {
      const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
      log.info('[xai] loopback request', {
        path: requestUrl.pathname,
        hasCode: requestUrl.searchParams.has('code'),
        error: requestUrl.searchParams.get('error'),
        stateMatch: requestUrl.searchParams.get('state') === pkce.state,
      });
      if (requestUrl.pathname !== '/callback') {
        res.writeHead(404).end();
        return;
      }

      const code = requestUrl.searchParams.get('code') ?? '';
      const state = requestUrl.searchParams.get('state') ?? '';
      const authError = requestUrl.searchParams.get('error');

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
      // xAI may show a copy-this-code page instead of redirecting; let a pasted
      // code complete the same flow (loopback callback still wins if it fires).
      activeManualSubmit = (code) => finish({ kind: 'code', code });
      log.info('[xai] loopback listening, opening browser', { redirectUri });

      const url = buildAuthorizeUrl(authorizeUrl, {
        clientId,
        challenge: pkce.challenge,
        state: pkce.state,
        redirectUri,
      });
      void shell.openExternal(url).catch(() => finish({ kind: 'error', error: 'unknown' }));
    });
  });
}

// ─── Token exchange / refresh ─────────────────────────────────────────────────

/**
 * Exchange the authorization code for a token bundle. The token endpoint is
 * host-pinned (`isPinnedXaiHttps`) before the bearer-bearing POST so a hijacked
 * discovery doc can never exfiltrate the code. Never throws.
 */
async function exchangeCode(
  tokenUrl: string,
  params: { code: string; verifier: string; redirectUri: string; clientId: string }
): Promise<XaiTokens | { error: XaiOAuthError }> {
  if (!isPinnedXaiHttps(tokenUrl)) return { error: 'unknown' };
  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    code_verifier: params.verifier,
  });
  return postToken(tokenUrl, form);
}

/** Exchange a refresh token for a fresh access token. Never throws. */
async function refreshAccessToken(
  tokenUrl: string,
  refreshToken: string,
  clientId: string
): Promise<XaiTokens | { error: XaiOAuthError }> {
  if (!isPinnedXaiHttps(tokenUrl)) return { error: 'unknown' };
  const form = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    scope: XAI_SCOPES,
  });
  return postToken(tokenUrl, form);
}

/** POST a form-encoded token request and parse the response. Never throws. */
async function postToken(
  tokenUrl: string,
  form: URLSearchParams
): Promise<XaiTokens | { error: XaiOAuthError }> {
  let res: Response;
  try {
    res = await fetchWithTimeout(tokenUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/json',
      },
      body: form.toString(),
    });
  } catch {
    return { error: 'offline' };
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) return { error: 'unauthorized' };
    return { error: 'unknown' };
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { error: 'unknown' };
  }
  const tokens = parseTokenResponse(body);
  return tokens ?? { error: 'unknown' };
}

// ─── Registry persistence ─────────────────────────────────────────────────────

/**
 * Persist the refresh token (encrypted) and register the access token through
 * the model-registry connect path. The registry's `ConnectionTester` probes the
 * key live against `api.x.ai/v1`, so a connect failure maps onto the matching
 * renderer error.
 */
async function registerTokens(tokens: XaiTokens, reused: boolean): Promise<XaiOAuthResult> {
  if (tokens.refreshToken) {
    await saveXaiTokens({ refreshToken: tokens.refreshToken, expiresAt: tokens.expiresAt });
  }
  const connected = await connectModelRegistryProvider(XAI_PROVIDER_ID, { key: tokens.accessToken });
  if (!connected.ok) return { ok: false, error: narrowConnectError(connected.error) };
  return { ok: true, reused };
}

/** Narrow a model-registry `ConnectError` onto the OAuth error union. */
function narrowConnectError(error: string | undefined): XaiOAuthError {
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

// ─── fetch with timeout ───────────────────────────────────────────────────────

/** `fetch` bounded by `NET_TIMEOUT_MS`; a timeout aborts and rejects. */
async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NET_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
