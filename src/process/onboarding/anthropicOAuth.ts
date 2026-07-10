/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Native "Sign in with Claude" desktop OAuth (main process).
 *
 * Lets a user authenticate with their Claude Pro / Max *subscription* - no
 * `claude` CLI login required and no pasted API key. It is standard OAuth 2.0
 * Authorization Code + PKCE (RFC 7636, S256) using the SAME public client Claude
 * Code uses (`claude.ai/oauth/authorize`, token exchange at
 * `console.anthropic.com/v1/oauth/token`). Anthropic may change or restrict this
 * path at any time.
 *
 * Unlike the ChatGPT/xAI flows, Anthropic's public client is NOT registered for
 * a loopback redirect - it only accepts the console callback, which renders a
 * `code#state` pair for the user to copy. So this is a MANUAL-PASTE flow (no
 * loopback server): we open the browser, then wait for the renderer to feed the
 * pasted code back via `anthropicSubmitManualCode`.
 *
 * Flow:
 *  1. If `~/.claude/.credentials.json` (the Claude Code store) already holds a
 *     usable, non-expired OAuth token, reuse it - register and return (no browser).
 *  2. Else run PKCE: generate verifier/challenge/state, open the system browser
 *     to the authorize URL, and wait for the pasted `code#state`.
 *  3. Validate `state` (CSRF), then exchange the code (JSON POST) for
 *     `{ access_token, refresh_token, expires_in, scope }`.
 *  4. Persist the refresh bundle (encrypted), WRITE `~/.claude/.credentials.json`
 *     so the Claude Code ACP agent runs on the subscription, and register the
 *     access token as the `claude-subscription` provider.
 *
 * The token is only ever sent to the pinned token endpoint
 * (`console.anthropic.com`). The flow never throws - it resolves a stable
 * `AnthropicOAuthResult`.
 *
 * IMPORTANT: Anthropic blocks subscription-OAuth logins used inside third-party
 * tools. Sign-in can succeed while a later inference turn is rejected; the ACP
 * auth-failure recovery card handles that case.
 */

import { shell } from 'electron';

import type { AnthropicOAuthResult, AnthropicPlanLabel } from '@/common/types/onboarding';
import { connectClaudeSubscriptionProvider } from '@process/providers/ipc/modelRegistryIpc';
import {
  ANTHROPIC_API_BASE,
  ANTHROPIC_REDIRECT_URI,
  ANTHROPIC_SCOPES,
  ANTHROPIC_TOKEN_URL,
  buildAuthorizeUrl,
  createPkce,
  isPinnedAnthropicTokenHttps,
  isTokenExpired,
  parseTokenResponse,
  resolveClientId,
  splitManualCode,
  type AnthropicTokens,
  type Pkce,
} from './anthropicOAuthCore';
import { loadAnthropicTokens, saveAnthropicTokens } from './anthropicTokenStore';
import { readClaudeCredentialsFile, writeClaudeCredentialsFile } from './claudeCredentialsFile';

/** Overall flow timeout - how long the user has to complete the browser sign-in + paste. */
const FLOW_TIMEOUT_MS = 5 * 60 * 1000;
/** Per-request network timeout (token exchange). */
const NET_TIMEOUT_MS = 20 * 1000;

/** Stable error reasons surfaced to the renderer (matches `AnthropicOAuthResult`). */
type AnthropicOAuthError = 'cancelled' | 'timeout' | 'unauthorized' | 'no-credit' | 'offline' | 'unknown';

/** Outcome of waiting on the pasted callback code. */
type CallbackOutcome = { kind: 'code'; code: string; state: string } | { kind: 'error'; error: AnthropicOAuthError };

/**
 * Handle to feed a manually-pasted `code#state` into the in-flight flow.
 * Anthropic's consent page shows a code to copy rather than redirecting to a
 * loopback, so the renderer offers a paste box; submitting resolves the flow.
 * Null when no sign-in is currently awaiting a code.
 */
let activeManualSubmit: ((outcome: CallbackOutcome) => void) | null = null;

/**
 * Complete an in-flight Claude sign-in with the `code#state` the user copied
 * from the Anthropic consent page. Returns false when no sign-in is awaiting a
 * code or the paste is empty. Never throws.
 */
export function anthropicSubmitManualCode(pasted: string): boolean {
  if (!activeManualSubmit) return false;
  const parts = splitManualCode(pasted);
  if (!parts) return false;
  activeManualSubmit({ kind: 'code', code: parts.code, state: parts.state });
  return true;
}

// ─── Public entry points ──────────────────────────────────────────────────────

/**
 * Run the full native Claude sign-in. Reuses an existing Claude Code credential
 * when present, otherwise runs the browser PKCE + manual-paste flow. Resolves a
 * renderer-safe `AnthropicOAuthResult`; never rejects.
 */
export async function anthropicOAuthLogin(): Promise<AnthropicOAuthResult> {
  try {
    // 1. Reuse an existing Claude Code credential if it is still usable.
    const reused = await tryReuseClaudeCredentials();
    if (reused) return reused;

    // 2. Browser PKCE + manual-paste flow.
    const pkce = createPkce();
    const clientId = resolveClientId();

    const outcome = await authorizeViaManualPaste(pkce, clientId);
    if (outcome.kind === 'error') return { ok: false, error: outcome.error };

    // CSRF guard - a mismatched state means a forged / stale callback. An empty
    // state (a code-only paste) is tolerated: the code is single-use and the
    // token endpoint binds it to our `code_verifier`.
    if (outcome.state.length > 0 && outcome.state !== pkce.state) {
      return { ok: false, error: 'unknown' };
    }

    const tokens = await exchangeCode({ code: outcome.code, verifier: pkce.verifier, state: pkce.state, clientId });
    if ('error' in tokens) return { ok: false, error: tokens.error };

    return await registerTokens(tokens);
  } catch {
    return { ok: false, error: 'unknown' };
  }
}

/**
 * Silent re-auth: exchange the persisted refresh token for a fresh access token
 * and re-register it. Surfaced for the proactive (near-expiry) + reactive (401)
 * refresh paths. Prefers a still-valid Claude Code credential over a network
 * refresh so the desktop and the CLI/engine do not fight over the refresh token.
 */
export async function anthropicRefreshToken(): Promise<AnthropicOAuthResult> {
  try {
    // Prefer the Claude Code store: if it holds a still-valid bearer, re-register
    // THAT rather than spending our refresh token (the engine/CLI may have
    // already rotated it).
    const fileTokens = await readClaudeCredentialsFile();
    if (fileTokens && !isTokenExpired(fileTokens)) {
      return await registerTokens(fileTokens);
    }

    const stored = await loadAnthropicTokens();
    const refreshToken = fileTokens?.refreshToken ?? stored?.refreshToken;
    if (!refreshToken) return { ok: false, error: 'unauthorized' };

    const clientId = resolveClientId();
    const tokens = await refreshAccessToken(refreshToken, clientId);
    if ('error' in tokens) return { ok: false, error: tokens.error };

    // A refresh response may omit a new refresh_token / plan; carry the prior
    // values forward so the bundle stays usable.
    if (!tokens.refreshToken) tokens.refreshToken = refreshToken;
    if (!tokens.planType) tokens.planType = stored?.planType ?? fileTokens?.planType;
    if (!tokens.scope) tokens.scope = stored?.scope ?? fileTokens?.scope;
    return await registerTokens(tokens);
  } catch {
    return { ok: false, error: 'unknown' };
  }
}

/**
 * Reuse an existing Claude Code login (`~/.claude/.credentials.json`) when it
 * holds a usable, non-expired OAuth token. Registers it (no browser) and returns
 * the result, or `null` to fall through to the full PKCE flow.
 */
async function tryReuseClaudeCredentials(): Promise<AnthropicOAuthResult | null> {
  const tokens = await readClaudeCredentialsFile();
  if (!tokens) return null;
  // An expired access token falls through to a fresh sign-in (the browser flow
  // also covers the no-refresh case cleanly).
  if (isTokenExpired(tokens)) return null;
  return registerTokens(tokens);
}

// ─── Manual-paste authorize ───────────────────────────────────────────────────

/**
 * Open the system browser to the authorize URL and resolve once the renderer
 * feeds back the pasted `code#state` (or the flow times out / is cancelled).
 * There is no loopback server for this client - the console callback renders the
 * code for the user to copy.
 */
function authorizeViaManualPaste(pkce: Pkce, clientId: string): Promise<CallbackOutcome> {
  return new Promise((resolve) => {
    let settled = false;
    let timer: NodeJS.Timeout | null = null;

    const finish = (outcome: CallbackOutcome): void => {
      if (settled) return;
      settled = true;
      activeManualSubmit = null;
      if (timer) clearTimeout(timer);
      resolve(outcome);
    };

    timer = setTimeout(() => finish({ kind: 'error', error: 'timeout' }), FLOW_TIMEOUT_MS);
    activeManualSubmit = (outcome) => finish(outcome);

    const url = buildAuthorizeUrl({ clientId, challenge: pkce.challenge, state: pkce.state });
    void shell.openExternal(url).catch(() => finish({ kind: 'error', error: 'unknown' }));
  });
}

// ─── Token exchange / refresh ─────────────────────────────────────────────────

/**
 * Exchange the authorization code for a token bundle. The token endpoint is
 * host-pinned (`console.anthropic.com`) before the POST. Anthropic expects a
 * JSON body (not form-encoded). Never throws.
 */
async function exchangeCode(params: {
  code: string;
  verifier: string;
  state: string;
  clientId: string;
}): Promise<AnthropicTokens | { error: AnthropicOAuthError }> {
  if (!isPinnedAnthropicTokenHttps(ANTHROPIC_TOKEN_URL)) return { error: 'unknown' };
  return postToken({
    grant_type: 'authorization_code',
    code: params.code,
    state: params.state,
    client_id: params.clientId,
    redirect_uri: ANTHROPIC_REDIRECT_URI,
    code_verifier: params.verifier,
  });
}

/** Exchange a refresh token for a fresh access token. Never throws. */
async function refreshAccessToken(
  refreshToken: string,
  clientId: string
): Promise<AnthropicTokens | { error: AnthropicOAuthError }> {
  if (!isPinnedAnthropicTokenHttps(ANTHROPIC_TOKEN_URL)) return { error: 'unknown' };
  return postToken({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    scope: ANTHROPIC_SCOPES,
  });
}

/** POST a JSON token request and parse the response. Never throws. */
async function postToken(body: Record<string, string>): Promise<AnthropicTokens | { error: AnthropicOAuthError }> {
  let res: Response;
  try {
    res = await fetchWithTimeout(ANTHROPIC_TOKEN_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    return { error: 'offline' };
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) return { error: 'unauthorized' };
    return { error: 'unknown' };
  }

  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch {
    return { error: 'unknown' };
  }
  const tokens = parseTokenResponse(parsed);
  return tokens ?? { error: 'unknown' };
}

// ─── Registry persistence ─────────────────────────────────────────────────────

/**
 * Persist the refresh bundle (encrypted), bridge the credential into the Claude
 * Code store so the ACP agent can drive inference on the subscription, and
 * register the `claude-subscription` provider. The credential-file write is
 * best-effort: a failure is not fatal to the sign-in (the registry row still
 * makes the provider + models visible).
 */
async function registerTokens(tokens: AnthropicTokens): Promise<AnthropicOAuthResult> {
  await saveAnthropicTokens({
    refreshToken: tokens.refreshToken ?? '',
    accessToken: tokens.accessToken,
    expiresAt: tokens.expiresAt,
    planType: tokens.planType,
    scope: tokens.scope,
  });

  // Bridge into `~/.claude/.credentials.json` so the Claude Code ACP agent runs
  // on the subscription (no API key). Best-effort - a failed write must not fail
  // an otherwise-good sign-in.
  const wrote = await writeClaudeCredentialsFile(tokens);
  if (!wrote) {
    console.warn(
      '[anthropicAuth] failed to write ~/.claude/.credentials.json; Claude Code may not pick up the subscription'
    );
  }

  const connected = connectClaudeSubscriptionProvider({
    accessToken: tokens.accessToken,
    baseUrl: ANTHROPIC_API_BASE,
  });
  if (!connected.ok) return { ok: false, error: narrowConnectError(connected.error) };

  return { ok: true, planType: (tokens.planType ?? 'unknown') as AnthropicPlanLabel };
}

/** Narrow a model-registry `ConnectError` onto the OAuth error union. */
function narrowConnectError(error: string | undefined): AnthropicOAuthError {
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
