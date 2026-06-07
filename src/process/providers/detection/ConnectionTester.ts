/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ConnectionTester - the real-inference connection probe (main process).
 *
 * A connection test must prove the credential can actually *run inference*, not
 * merely that it authenticates. `/v1/models` proves auth only - it succeeds for
 * a key with zero credit, no entitlement, or a frozen account. So the tester
 * sends the cheapest possible real chat request: a known cheap model for the
 * provider, a trivial one-word prompt, and a 1-token output cap.
 *
 * Providers fall into three groups:
 *  - A provider with a known cheap chat model → a real one-token completion.
 *  - A provider with a `/v1/models` endpoint but no known test model → a
 *    degraded auth-only check (a 200 means the key authenticates; this does NOT
 *    prove inference works, but it is the best available signal).
 *  - A provider with neither → `unknown` (e.g. cloud providers like Bedrock
 *    that have no simple HTTP probe).
 *
 * Failures map onto `ConnectError`:
 *  - `401` / `403`                       → `unauthorized`
 *  - `402`, or a quota/billing body      → `no-credit`
 *  - network / DNS / timeout             → `offline`
 *  - a 200 that still has no usable model → `no-models`
 *  - anything else                       → `unknown`
 *
 * `test()` NEVER throws - every failure mode resolves to a typed
 * `{ ok: false, error }`.
 */

import type { ConnectError, ProviderId } from '../types';
import { PROVIDER_ENDPOINTS } from './providerEndpoints';
import type { AuthStrategy } from './providerAuth';
import { ANTHROPIC_VERSION, appendQuery, authStrategyFor } from './providerAuth';

/** Per-request fetch timeout - a slow provider must not stall a connection test. */
const FETCH_TIMEOUT_MS = 15_000;

/**
 * Placeholder model for the custom-base chat fallback. It need not exist on the
 * target: a "model not found" response still proves the credential
 * authenticates (see `probeCustomChat`). A common id keeps a 1-token hit cheap
 * on proxies that DO have it.
 */
const CUSTOM_PROBE_MODEL = 'gpt-3.5-turbo';

/**
 * Credentials for a connection test: a single API key (optionally with a custom
 * `baseUrl` for `openai-compatible` / bring-your-own-endpoint providers), or
 * multi-field cloud creds.
 */
type TestCreds = { key: string; baseUrl?: string } | { fields: Record<string, string> };

/** The result of a connection test. */
type TestResult = { ok: boolean; error?: ConnectError };

/**
 * Per-provider known cheap test model. The tester sends a 1-token completion to
 * this model - it must be a small, cheap, generally-available chat model so the
 * probe costs effectively nothing. A provider absent from this map has no real
 * inference probe and falls back to the degraded `/v1/models` auth check.
 *
 * Chosen as the smallest broadly-available chat model per provider as of
 * 2026-05-22. If a provider retires one, the inference probe gets a
 * "model not found" response - a VALID key that simply picked a stale model.
 * The tester treats that case specially: it falls back to the provider's
 * `/v1/models` auth check rather than false-negating a working key (see
 * `probeInference`). A genuinely bad key still fails with `unauthorized`.
 */
const TEST_MODEL: Partial<Record<ProviderId, string>> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-haiku-4-5-20251001',
  'google-gemini': 'gemini-1.5-flash',
  groq: 'llama-3.1-8b-instant',
  openrouter: 'openai/gpt-4o-mini',
  mistral: 'mistral-small-latest',
  deepseek: 'deepseek-chat',
  xai: 'grok-2',
  together: 'meta-llama/Llama-3.2-3B-Instruct-Turbo',
  fireworks: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
  cerebras: 'llama3.1-8b',
  perplexity: 'sonar',
  moonshot: 'moonshot-v1-8k',
  'flux-router': 'flux-fast',
};

export class ConnectionTester {
  /**
   * Test that `creds` can run inference for `providerId`.
   *
   * Never throws. Returns `{ ok: true }` on a successful one-token completion
   * (or a successful degraded auth check), otherwise `{ ok: false, error }`
   * with the failure classified as a `ConnectError`.
   */
  async test(providerId: ProviderId, creds: TestCreds): Promise<TestResult> {
    const apiKey = extractKey(creds);
    const baseUrl = 'baseUrl' in creds && typeof creds.baseUrl === 'string' ? creds.baseUrl.trim() : '';

    // Custom-endpoint providers - `openai-compatible`, or any provider connected
    // with an explicit `baseUrl` - are absent from the static `TEST_MODEL` /
    // `PROVIDER_ENDPOINTS` maps, so they are probed against the user's OWN base
    // URL. This is the only probe path that honors a caller-supplied base; a
    // bare `openai-compatible` with no base falls back to the canonical OpenAI
    // host. Before this branch existed, `openai-compatible` always returned
    // `unknown` (no map entry), so the provider could never connect (GH #2).
    if (apiKey && (baseUrl || providerId === 'openai-compatible')) {
      return this.probeCustomBase(baseUrl || 'https://api.openai.com/v1', apiKey);
    }

    const testModel = TEST_MODEL[providerId];
    if (testModel && apiKey) {
      return this.probeInference(providerId, apiKey, testModel);
    }

    // No known test model - fall back to the degraded `/v1/models` auth check.
    const modelsEndpoint = PROVIDER_ENDPOINTS[providerId];
    if (modelsEndpoint && apiKey) {
      return this.probeModelsEndpoint(providerId, apiKey, modelsEndpoint);
    }

    // The provider IS probeable (it has a test model or a models endpoint) but
    // the supplied creds carried no usable key - an unrecognized creds shape,
    // distinct from a cloud provider that is genuinely unprobeable.
    const isProbeable = testModel !== undefined || modelsEndpoint !== undefined;
    if (isProbeable && !apiKey && credsArePresent(creds)) {
      return { ok: false, error: 'unrecognized' };
    }

    // Neither an inference probe nor a models endpoint (e.g. cloud providers).
    return { ok: false, error: 'unknown' };
  }

  // ─── Inference probe ────────────────────────────────────────────────────────

  /** Send a real 1-token completion and classify the outcome. */
  private async probeInference(providerId: ProviderId, apiKey: string, model: string): Promise<TestResult> {
    const auth = authStrategyFor(providerId);
    const request = buildInferenceRequest(providerId, apiKey, model, auth);

    let res: Response;
    try {
      res = await this.fetchWithTimeout(request.url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify(request.body),
      });
    } catch {
      // Any throw escaping the fetch attempt - a network/DNS failure, an abort
      // (our timeout), or the runtime refusing to dispatch - is an outage.
      return { ok: false, error: 'offline' };
    }

    const body = await readBody(res);

    // A "model not found" failure means our hardcoded probe model went stale -
    // it does NOT mean the credential is bad. Falling back to the provider's
    // `/v1/models` auth check rescues a valid key from a false negative; a
    // 200 there proves the key authenticates. A genuinely bad key still gets
    // an `unauthorized` from that fallback. (Auth `query` providers like Gemini
    // carry the key in the URL, so the fallback works for them too.)
    if (isModelNotFound(res.status, body)) {
      const modelsEndpoint = PROVIDER_ENDPOINTS[providerId];
      if (modelsEndpoint) {
        return this.probeModelsEndpoint(providerId, apiKey, modelsEndpoint);
      }
    }

    return this.classifyResponse(res, body);
  }

  /** Classify a chat-completion response (with its already-read body). */
  private classifyResponse(res: Response, body: string): TestResult {
    if (!res.ok) {
      return { ok: false, error: classifyStatus(res.status, body) };
    }

    // A 200 can still carry an error-shaped body (a quota error dressed as
    // success). Honour the body before declaring the probe a success.
    if (bodyIsError(body)) {
      return { ok: false, error: mentionsBilling(body) ? 'no-credit' : 'unknown' };
    }

    return { ok: true };
  }

  // ─── Degraded auth-only probe ───────────────────────────────────────────────

  /**
   * Degraded path: a provider with no known test model. A 200 on `/v1/models`
   * proves the key authenticates (but NOT that inference works). An empty model
   * list maps to `no-models`.
   */
  private async probeModelsEndpoint(providerId: ProviderId, apiKey: string, endpoint: string): Promise<TestResult> {
    const auth = authStrategyFor(providerId);
    const url = auth.kind === 'query' ? appendQuery(endpoint, auth.param, apiKey) : endpoint;

    let res: Response;
    try {
      res = await this.fetchWithTimeout(url, { method: 'GET', headers: authHeaders(auth, apiKey) });
    } catch {
      // Any throw escaping the fetch attempt is an outage - see `probeInference`.
      return { ok: false, error: 'offline' };
    }

    const body = await readBody(res);
    if (!res.ok) {
      return { ok: false, error: classifyStatus(res.status, body) };
    }
    if (modelsBodyIsEmpty(body)) {
      return { ok: false, error: 'no-models' };
    }
    return { ok: true };
  }

  // ─── Custom-base probe (openai-compatible / bring-your-own-endpoint) ─────────

  /**
   * Probe a custom OpenAI-compatible base URL. Built entirely from the user's
   * base, since these providers are not in the static maps.
   *
   * Strategy: try the `/v1/models` auth check first (cheap, no tokens). A 200
   * proves auth; 401/403 is a bad key; 402/billing is no-credit. If the models
   * endpoint is simply missing - some proxies (e.g. the `ai.sumopod.com` case in
   * GH #2) implement ONLY `/chat/completions` and 404 on `/models` - fall back
   * to a 1-token chat completion, where even a model-not-found proves the key
   * authenticates.
   */
  private async probeCustomBase(base: string, apiKey: string): Promise<TestResult> {
    const auth = { kind: 'bearer' } as const;
    let res: Response;
    try {
      res = await this.fetchWithTimeout(resolveCustomModelsEndpoint(base), {
        method: 'GET',
        headers: authHeaders(auth, apiKey),
      });
    } catch {
      return { ok: false, error: 'offline' };
    }
    const body = await readBody(res);

    if (res.status === 401 || res.status === 403) return { ok: false, error: 'unauthorized' };
    if (res.ok) {
      return modelsBodyIsEmpty(body) ? { ok: false, error: 'no-models' } : { ok: true };
    }
    if (res.status === 402 || mentionsBilling(body)) return { ok: false, error: 'no-credit' };

    // The models endpoint is unavailable (404 / 400 / 405 / ...) but the key was
    // not rejected - the endpoint may be chat-only. Fall back to a chat probe.
    return this.probeCustomChat(base, apiKey);
  }

  /** 1-token chat completion against a custom base; model-not-found = auth OK. */
  private async probeCustomChat(base: string, apiKey: string): Promise<TestResult> {
    const auth = { kind: 'bearer' } as const;
    let res: Response;
    try {
      res = await this.fetchWithTimeout(resolveCustomChatUrl(base), {
        method: 'POST',
        headers: authHeaders(auth, apiKey),
        body: JSON.stringify({ model: CUSTOM_PROBE_MODEL, max_tokens: 1, messages: [{ role: 'user', content: 'Hi' }] }),
      });
    } catch {
      return { ok: false, error: 'offline' };
    }
    const body = await readBody(res);
    // A model-not-found means the credential authenticated against a chat-only
    // proxy; auth is proven even though our placeholder model does not exist.
    if (isModelNotFound(res.status, body)) return { ok: true };
    return this.classifyResponse(res, body);
  }

  // ─── fetch with timeout ─────────────────────────────────────────────────────

  /** `fetch` bounded by `FETCH_TIMEOUT_MS`; a timeout aborts and rejects. */
  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }
}

// ─── Request construction ─────────────────────────────────────────────────────

/** A fully-built HTTP request for an inference probe. */
type InferenceRequest = { url: string; headers: Record<string, string>; body: unknown };

/**
 * Build the cheapest viable inference request for a provider.
 *
 * Three request shapes: Anthropic's `/v1/messages`, Gemini's `:generateContent`,
 * and the OpenAI-compatible `/v1/chat/completions` everyone else uses. Each caps
 * the output at one token and sends a one-word prompt.
 */
function buildInferenceRequest(
  providerId: ProviderId,
  apiKey: string,
  model: string,
  auth: AuthStrategy
): InferenceRequest {
  if (auth.kind === 'anthropic') {
    return {
      url: 'https://api.anthropic.com/v1/messages',
      headers: authHeaders(auth, apiKey),
      body: { model, max_tokens: 1, messages: [{ role: 'user', content: 'Hi' }] },
    };
  }

  if (auth.kind === 'query') {
    // Gemini: the key rides on the URL; the endpoint embeds the model name.
    const base = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    return {
      url: appendQuery(base, auth.param, apiKey),
      headers: authHeaders(auth, apiKey),
      body: {
        contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
        generationConfig: { maxOutputTokens: 1 },
      },
    };
  }

  // OpenAI-compatible: derive the chat endpoint from the provider's models
  // endpoint when known, else default to the canonical OpenAI host.
  //
  // OpenAI's own reasoning models (o1/o3/o4/gpt-5*) reject `max_tokens` with a
  // 400 and require `max_completion_tokens` - so for `openai` we send the
  // newer field, which works for both reasoning and chat models. Other
  // OpenAI-compatible providers (groq, together, etc.) still expect the
  // classic `max_tokens`, so they keep it.
  const outputCap = providerId === 'openai' ? { max_completion_tokens: 1 } : { max_tokens: 1 };
  return {
    url: chatCompletionsUrl(providerId),
    headers: authHeaders(auth, apiKey),
    body: { model, ...outputCap, messages: [{ role: 'user', content: 'Hi' }] },
  };
}

/**
 * Resolve the OpenAI-compatible `chat/completions` URL for a provider.
 *
 * Most providers' `/v1/models` endpoint shares the same base path as their
 * `/chat/completions` endpoint, so the chat URL is derived by swapping the
 * trailing `/models` segment. A provider with no registered endpoint falls back
 * to the canonical OpenAI host (it would only be reached for an OpenAI-style
 * provider added to `TEST_MODEL` but not `PROVIDER_ENDPOINTS`).
 */
function chatCompletionsUrl(providerId: ProviderId): string {
  const modelsEndpoint = PROVIDER_ENDPOINTS[providerId];
  if (modelsEndpoint && modelsEndpoint.endsWith('/models')) {
    return `${modelsEndpoint.slice(0, -'/models'.length)}/chat/completions`;
  }
  return 'https://api.openai.com/v1/chat/completions';
}

/** True when a user base URL already ends in an API version segment, so the
 * OpenAI-compatible path appends `/models` or `/chat/completions` directly
 * rather than inserting a `/v1`. Matches `/v1`, `/v2`, `/v1beta`, `/openai`. */
function baseHasVersionSegment(trimmedBase: string): boolean {
  return /\/(v\d+(beta)?|openai)$/i.test(trimmedBase);
}

/**
 * Resolve the `/models` endpoint for a custom OpenAI-compatible base URL,
 * respecting an existing version segment. `https://ai.sumopod.com` ->
 * `.../v1/models`; `https://host/v1` -> `https://host/v1/models`.
 */
function resolveCustomModelsEndpoint(base: string): string {
  const trimmed = base.replace(/\/+$/, '');
  return baseHasVersionSegment(trimmed) ? `${trimmed}/models` : `${trimmed}/v1/models`;
}

/** Resolve the `/chat/completions` endpoint for a custom base, same rules. */
function resolveCustomChatUrl(base: string): string {
  const trimmed = base.replace(/\/+$/, '');
  return baseHasVersionSegment(trimmed) ? `${trimmed}/chat/completions` : `${trimmed}/v1/chat/completions`;
}

/** Auth + identification headers for a request, per the provider's scheme. */
function authHeaders(auth: AuthStrategy, apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'Wayland/1.0',
  };
  switch (auth.kind) {
    case 'bearer':
      headers.Authorization = `Bearer ${apiKey}`;
      break;
    case 'anthropic':
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = ANTHROPIC_VERSION;
      break;
    case 'query':
      // Key travels as a URL query parameter - no auth header.
      break;
  }
  return headers;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/** Pull a usable API key out of either credential shape; `''` when absent. */
function extractKey(creds: TestCreds): string {
  if ('key' in creds) return creds.key;
  // Multi-field creds (cloud providers) - try the conventional key field names.
  for (const name of ['apiKey', 'api_key', 'key', 'token']) {
    const value = creds.fields[name];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return '';
}

/** True when `creds` actually carry some value (a `key` string, or any field). */
function credsArePresent(creds: TestCreds): boolean {
  if ('key' in creds) return creds.key.length > 0;
  return Object.keys(creds.fields).length > 0;
}

/** Read a response body as text; an unreadable body yields `''`. */
async function readBody(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}

/**
 * True when an inference failure reads as "the requested model does not exist"
 * rather than "the credential is invalid".
 *
 * This is the stale-probe-model case: our hardcoded `TEST_MODEL` entry was
 * retired by the provider. The status alone is ambiguous (a 404 can also be a
 * wrong endpoint), so a 404 only counts when the body confirms it is about the
 * model - and a body that says so counts regardless of status, since providers
 * disagree on whether model-not-found is a 400 or a 404. Auth failures (401 /
 * 403) are never treated as model-not-found.
 */
function isModelNotFound(status: number, body: string): boolean {
  if (status === 401 || status === 403) return false;
  const text = body.toLowerCase();
  const saysModelMissing =
    (text.includes('model') &&
      (text.includes('not found') ||
        text.includes('not_found') ||
        text.includes('does not exist') ||
        text.includes('not exist') ||
        text.includes('unknown model') ||
        text.includes('invalid model') ||
        text.includes('no such model') ||
        text.includes('not_found_error') ||
        text.includes('model_not_found'))) ||
    text.includes('model_not_found');
  if (saysModelMissing) return true;
  // A bare 404 with no readable body - most likely a missing model, since the
  // base host/path is shared by the working `/v1/models` probe.
  return status === 404 && text.trim().length === 0;
}

/** Classify a non-200 status (and its body) into a `ConnectError`. */
function classifyStatus(status: number, body: string): ConnectError {
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 402) return 'no-credit';
  if (mentionsBilling(body)) return 'no-credit';
  return 'unknown';
}

/** True when a response body reads like a quota / billing / credit failure. */
function mentionsBilling(body: string): boolean {
  const text = body.toLowerCase();
  return (
    text.includes('quota') ||
    text.includes('billing') ||
    text.includes('insufficient') ||
    text.includes('payment') ||
    text.includes('credit')
  );
}

/**
 * True when a 200 body is actually an error-shaped object.
 *
 * A NON-empty string `error`, or a record `error` carrying a `message`, counts.
 * An empty-string `error: ""` (some APIs include the field unconditionally) is
 * NOT a failure, nor is a record `error` with no `message`.
 */
function bodyIsError(body: string): boolean {
  const parsed = tryParse(body);
  if (!isRecord(parsed)) return false;
  const error = parsed.error;
  if (typeof error === 'string') return error.length > 0;
  if (isRecord(error)) return typeof error.message === 'string';
  return false;
}

/** True when a `/v1/models` body carries no models at all. */
function modelsBodyIsEmpty(body: string): boolean {
  const parsed = tryParse(body);
  if (!isRecord(parsed)) return false;
  if (Array.isArray(parsed.data)) return parsed.data.length === 0;
  if (Array.isArray(parsed.models)) return parsed.models.length === 0;
  // An unrecognized 200 shape - not provably empty, so do not flag it.
  return false;
}

/** `JSON.parse` that never throws - returns `null` on bad input. */
function tryParse(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

/** Narrow an `unknown` to a plain object record. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
