/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Native "Sign in with ChatGPT" desktop OAuth (main process).
 *
 * Lets a user authenticate with their ChatGPT *subscription* - no `codex` CLI on
 * PATH and no pasted API key. It is standard OAuth 2.0 Authorization Code + PKCE
 * (RFC 7636 / 8252, S256) with a loopback callback against `auth.openai.com`,
 * using the SAME client + flow the Codex CLI uses (`originator=codex_cli_rs`,
 * `codex_cli_simplified_flow`). OpenAI may change or restrict this path at any
 * time.
 *
 * Flow:
 *  1. Generate PKCE (verifier/challenge/state).
 *  2. Bind a one-shot loopback HTTP server on `127.0.0.1:1455` (fallback 1457)
 *     for `GET /auth/callback`. The redirect_uri is part of the registered OAuth
 *     client, so the port must be one of the registered ports.
 *  3. Open the system browser to the authorize URL.
 *  4. On callback: validate `state`, read `code`, exchange it at the token
 *     endpoint for `{ id_token, access_token, refresh_token, expires_in }`.
 *  5. Extract `chatgpt-account-id` + `chatgpt_plan_type` from the id_token's
 *     nested `https://api.openai.com/auth` claim.
 *  6. Persist the full bundle (encrypted) for inference + refresh, and register
 *     the `chatgpt-subscription` provider (no HTTP probe; static catalog).
 *
 * The loopback server is ALWAYS torn down. The token is only ever sent to the
 * pinned token endpoint (`auth.openai.com`). The flow never throws - it resolves
 * a stable `ChatGptOAuthResult`.
 *
 * --- INFERENCE SEAM (NOT fully wired in this module) ---
 * A ChatGPT subscription token is rejected by `api.openai.com`. Inference must
 * POST to `https://chatgpt.com/backend-api/codex/responses` with the headers
 * `Authorization: Bearer <access>`, `chatgpt-account-id: <accountId>`,
 * `OpenAI-Beta: responses=experimental`, `originator: codex_cli_rs`,
 * `Accept: text/event-stream`, and a Responses-API body (`input`/`instructions`,
 * `store:false`, `stream:true`, ...). The base URL + access token are persisted
 * on the registry row; the remaining header injection + Responses body
 * translation is the deferred seam. See `registerChatGptSubscription` below for
 * the exact file:function where it must be completed.
 */

import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';

import { shell } from 'electron';

import type { ChatGptOAuthResult, ChatGptPlanLabel } from '@/common/types/onboarding';
import { connectChatGptSubscriptionProvider } from '@process/providers/ipc/modelRegistryIpc';
import {
  buildAuthorizeUrl,
  buildRedirectUri,
  CHATGPT_BACKEND_BASE,
  CHATGPT_REDIRECT_PORT,
  CHATGPT_REDIRECT_PORT_FALLBACK,
  CHATGPT_REDIRECT_PATH,
  CHATGPT_SCOPES,
  CHATGPT_TOKEN_URL,
  createPkce,
  isPinnedOpenAiAuthHttps,
  isTokenExpired,
  parseTokenResponse,
  resolveClientId,
  type ChatGptTokens,
  type Pkce,
} from './chatgptOAuthCore';
import { loadChatGptTokens, saveChatGptTokens } from './chatgptTokenStore';
import { readCodexAuthFile, writeCodexAuthFile } from './codexAuthFile';

/** Overall flow timeout - how long the user has to complete the browser sign-in. */
const FLOW_TIMEOUT_MS = 3 * 60 * 1000;
/** Per-request network timeout (token exchange). */
const NET_TIMEOUT_MS = 20 * 1000;

/** Stable error reasons surfaced to the renderer (matches `ChatGptOAuthResult`). */
type ChatGptOAuthError = 'cancelled' | 'timeout' | 'unauthorized' | 'no-credit' | 'offline' | 'unknown';

/** Outcome of waiting on the loopback callback. */
type CallbackOutcome = { kind: 'code'; code: string } | { kind: 'error'; error: ChatGptOAuthError };

// ─── Public entry points ──────────────────────────────────────────────────────

/**
 * Run the full native ChatGPT sign-in via the browser PKCE flow. Resolves a
 * renderer-safe `ChatGptOAuthResult`; never rejects.
 */
export async function chatgptOAuthLogin(): Promise<ChatGptOAuthResult> {
  try {
    // If the user already signed in via the Codex CLI (`~/.codex/auth.json`),
    // reuse that credential instead of opening the browser - the ChatGPT analog
    // of xAI's `~/.grok/auth.json` reuse.
    const reused = await tryReuseCodexCli();
    if (reused) return reused;

    const pkce = createPkce();
    const clientId = resolveClientId();

    const { outcome, redirectUri } = await authorizeViaLoopback(pkce, clientId);
    if (outcome.kind === 'error') return { ok: false, error: outcome.error };

    const tokens = await exchangeCode({
      code: outcome.code,
      verifier: pkce.verifier,
      redirectUri,
      clientId,
    });
    if ('error' in tokens) return { ok: false, error: tokens.error };

    return await registerChatGptSubscription(tokens);
  } catch {
    return { ok: false, error: 'unknown' };
  }
}

/**
 * Silent re-auth: exchange the persisted refresh token for a fresh access token
 * and re-register it. Surfaced for the proactive (near-expiry) + reactive (401)
 * refresh paths. Returns `{ ok: true, planType }` when a fresh token was
 * obtained and connected, otherwise a stable error.
 */
export async function chatgptRefreshToken(): Promise<ChatGptOAuthResult> {
  try {
    const stored = await loadChatGptTokens();
    if (!stored?.refreshToken) return { ok: false, error: 'unauthorized' };

    const clientId = resolveClientId();
    const tokens = await refreshAccessToken(stored.refreshToken, clientId);
    if ('error' in tokens) return { ok: false, error: tokens.error };

    // A refresh response may omit a new refresh_token / account_id; carry the
    // prior values forward so the bundle stays usable for inference.
    if (!tokens.refreshToken) tokens.refreshToken = stored.refreshToken;
    if (!tokens.accountId) tokens.accountId = stored.accountId;
    if (!tokens.planType) tokens.planType = stored.planType;
    return await registerChatGptSubscription(tokens);
  } catch {
    return { ok: false, error: 'unknown' };
  }
}

/**
 * Reuse an existing Codex CLI login (`~/.codex/auth.json`) when it holds a
 * usable, non-expired ChatGPT subscription token. Registers it (no browser) and
 * returns the result, or `null` to fall through to the full PKCE flow. Mirrors
 * the xAI `tryReuseGrokCli()` path.
 */
async function tryReuseCodexCli(): Promise<ChatGptOAuthResult | null> {
  const bundle = await readCodexAuthFile();
  if (!bundle || !bundle.accountId) return null;
  // An expired access token falls through to a fresh sign-in (the browser flow
  // also covers the no-refresh case cleanly).
  if (isTokenExpired(bundle)) return null;
  return registerChatGptSubscription(bundle);
}

// ─── Loopback authorize ───────────────────────────────────────────────────────

/** Minimal HTML served back to the browser once the callback lands. */
function callbackHtml(ok: boolean): string {
  const heading = ok ? "You're signed in to ChatGPT" : "Sign-in didn't complete";
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
 * Try to bind the loopback server on `127.0.0.1:port`. Resolves the bound
 * `Server` or `null` when the port is busy (caller falls back to the next port).
 */
function listenOnPort(server: Server, port: number): Promise<Server | null> {
  return new Promise((resolve) => {
    const onError = (): void => {
      server.removeListener('error', onError);
      resolve(null);
    };
    server.once('error', onError);
    server.listen(port, '127.0.0.1', () => {
      server.removeListener('error', onError);
      resolve(server);
    });
  });
}

/**
 * Bind a loopback HTTP server on a registered port of `127.0.0.1` (1455, else
 * 1457), open the system browser to the authorize URL, and resolve once the
 * browser redirects back to `/auth/callback` with a code (or an error). The CSRF
 * `state` is validated here. The server is always torn down before resolving.
 */
function authorizeViaLoopback(
  pkce: Pkce,
  clientId: string
): Promise<{ outcome: CallbackOutcome; redirectUri: string }> {
  return new Promise((resolve) => {
    let settled = false;
    let timer: NodeJS.Timeout | null = null;
    let redirectUri = '';

    const finish = (server: Server | null, outcome: CallbackOutcome): void => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (server) closeServer(server);
      resolve({ outcome, redirectUri });
    };

    const onRequest = (server: Server) => (req: IncomingMessage, res: ServerResponse): void => {
      const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
      if (requestUrl.pathname !== CHATGPT_REDIRECT_PATH) {
        res.writeHead(404).end();
        return;
      }

      const code = requestUrl.searchParams.get('code') ?? '';
      const state = requestUrl.searchParams.get('state') ?? '';
      const authError = requestUrl.searchParams.get('error');

      if (authError || !code) {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(callbackHtml(false));
        finish(server, { kind: 'error', error: 'cancelled' });
        return;
      }
      // CSRF guard - a mismatched state means a forged / stale callback.
      if (state !== pkce.state) {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(callbackHtml(false));
        finish(server, { kind: 'error', error: 'unknown' });
        return;
      }

      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(callbackHtml(true));
      finish(server, { kind: 'code', code });
    };

    void (async (): Promise<void> => {
      const server = createServer();
      server.on('request', onRequest(server));

      let port = CHATGPT_REDIRECT_PORT;
      let bound = await listenOnPort(server, port);
      if (!bound) {
        port = CHATGPT_REDIRECT_PORT_FALLBACK;
        bound = await listenOnPort(server, port);
      }
      if (!bound) {
        finish(null, { kind: 'error', error: 'unknown' });
        return;
      }

      redirectUri = buildRedirectUri(port);
      timer = setTimeout(() => finish(server, { kind: 'error', error: 'timeout' }), FLOW_TIMEOUT_MS);

      const url = buildAuthorizeUrl({
        clientId,
        challenge: pkce.challenge,
        state: pkce.state,
        redirectUri,
      });
      void shell.openExternal(url).catch(() => finish(server, { kind: 'error', error: 'unknown' }));
    })();
  });
}

// ─── Token exchange / refresh ─────────────────────────────────────────────────

/**
 * Exchange the authorization code for a token bundle. The token endpoint is
 * host-pinned (`auth.openai.com`) before the POST. Never throws.
 */
async function exchangeCode(params: {
  code: string;
  verifier: string;
  redirectUri: string;
  clientId: string;
}): Promise<ChatGptTokens | { error: ChatGptOAuthError }> {
  if (!isPinnedOpenAiAuthHttps(CHATGPT_TOKEN_URL)) return { error: 'unknown' };
  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: params.clientId,
    code: params.code,
    code_verifier: params.verifier,
    redirect_uri: params.redirectUri,
  });
  return postToken(form);
}

/** Exchange a refresh token for a fresh access token. Never throws. */
async function refreshAccessToken(
  refreshToken: string,
  clientId: string
): Promise<ChatGptTokens | { error: ChatGptOAuthError }> {
  if (!isPinnedOpenAiAuthHttps(CHATGPT_TOKEN_URL)) return { error: 'unknown' };
  const form = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: refreshToken,
    scope: CHATGPT_SCOPES,
  });
  return postToken(form);
}

/** POST a form-encoded token request and parse the response. Never throws. */
async function postToken(form: URLSearchParams): Promise<ChatGptTokens | { error: ChatGptOAuthError }> {
  let res: Response;
  try {
    res = await fetchWithTimeout(CHATGPT_TOKEN_URL, {
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
 * Persist the OAuth bundle (encrypted) and register the `chatgpt-subscription`
 * provider in the model registry.
 *
 * INFERENCE SEAM: the access token + the ChatGPT backend base URL
 * (`https://chatgpt.com/backend-api`) are written onto the registry row by
 * `connectChatGptSubscriptionProvider` (in
 * `src/process/providers/ipc/modelRegistryIpc.ts`). That makes the provider +
 * its static model set visible in the picker and writes an `openai-compatible`
 * legacy row pointing at the backend base. What is NOT yet wired is the per-spawn
 * injection of the extra Responses headers (`chatgpt-account-id`,
 * `OpenAI-Beta: responses=experimental`, `originator: codex_cli_rs`,
 * `Accept: text/event-stream`) and the chat/completions -> Responses body
 * translation (`/codex/responses`, `input`/`instructions`, `store:false`,
 * `include:["reasoning.encrypted_content"]`, strip `max_output_tokens`).
 *
 * TO COMPLETE THE INFERENCE PATH, inject those headers + translate the body
 * where the chat-start dispatch builds the OpenAI-compatible request for a
 * provider whose `platform === 'openai-compatible'` and
 * `providerId === 'chatgpt-subscription'`. The required `accountId` is available
 * from `loadChatGptTokens()` in `chatgptTokenStore.ts`. The natural injection
 * point mirrors how the Flux/codex Responses surface is wired in
 * `src/process/task/fluxRouting.ts` and `src/process/agent/acp/acpConnectors.ts`.
 */
async function registerChatGptSubscription(tokens: ChatGptTokens): Promise<ChatGptOAuthResult> {
  if (!tokens.accountId) {
    // Without the chatgpt-account-id the backend rejects every request, so a
    // bundle missing it is not usable for inference.
    return { ok: false, error: 'unauthorized' };
  }

  await saveChatGptTokens({
    refreshToken: tokens.refreshToken ?? '',
    accessToken: tokens.accessToken,
    expiresAt: tokens.expiresAt,
    accountId: tokens.accountId,
    planType: tokens.planType,
  });

  const connected = connectChatGptSubscriptionProvider({
    accessToken: tokens.accessToken,
    baseUrl: CHATGPT_BACKEND_BASE,
  });
  if (!connected.ok) return { ok: false, error: narrowConnectError(connected.error) };

  // Bridge the credential to Wayland Core / the Codex CLI, which read it from
  // `~/.codex/auth.json` to drive ChatGPT inference. Best-effort - a failed
  // write never fails the sign-in (the app registry copy still works).
  await writeCodexAuthFile(tokens);

  return { ok: true, planType: (tokens.planType ?? 'unknown') as ChatGptPlanLabel };
}

/** Narrow a model-registry `ConnectError` onto the OAuth error union. */
function narrowConnectError(error: string | undefined): ChatGptOAuthError {
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
