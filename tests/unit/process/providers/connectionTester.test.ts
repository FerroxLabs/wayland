/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConnectionTester } from '@process/providers/detection/ConnectionTester';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a `Response`-like object the tester can read. */
function response(body: unknown, status = 200): Response {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => (typeof body === 'string' ? JSON.parse(body) : body),
    text: async () => text,
  } as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ConnectionTester', () => {
  const tester = new ConnectionTester();

  it('returns ok for a successful minimal completion (OpenAI)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ choices: [{ message: { content: 'hi' } }] }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await tester.test('openai', { key: 'sk-test' });
    expect(result).toEqual({ ok: true });
  });

  it('hits a chat-completions endpoint, not /v1/models', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ choices: [{ message: { content: 'hi' } }] }));
    vi.stubGlobal('fetch', fetchMock);

    await tester.test('openai', { key: 'sk-test' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).not.toContain('/v1/models');
    expect(url).toContain('chat/completions');
    expect(init.method).toBe('POST');
  });

  it('sends a real inference request: a known cheap model with a tiny token budget', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ choices: [{ message: { content: 'hi' } }] }));
    vi.stubGlobal('fetch', fetchMock);

    await tester.test('openai', { key: 'sk-test' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(typeof payload.model).toBe('string');
    expect((payload.model as string).length).toBeGreaterThan(0);
    // A 1-token cap keeps the probe as cheap as possible.
    expect(payload.max_tokens ?? payload.max_completion_tokens).toBe(1);
    expect(Array.isArray(payload.messages)).toBe(true);
  });

  // A Flux key wired as `openai` + OPENAI_BASE_URL=https://api.fluxrouter.ai/v1
  // is scoped to the gateway's own models, so the canonical `gpt-4o-mini`
  // inference probe against api.openai.com 401s. With a custom base URL the
  // probe must instead GET <base>/models on the gateway host (auth-only check).
  it('probes the custom base /models endpoint, not the canonical host, when a base URL is given', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ data: [{ id: 'flux-auto' }] }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await tester.test('openai', { key: 'sk-flux-test' }, 'https://api.fluxrouter.ai/v1');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.fluxrouter.ai/v1/models');
    expect(url).not.toContain('api.openai.com');
    expect(init.method).toBe('GET');
    expect(result).toEqual({ ok: true });
  });

  it('maps a 401 to unauthorized', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ error: 'bad key' }, 401)));
    const result = await tester.test('openai', { key: 'bad' });
    expect(result).toEqual({ ok: false, error: 'unauthorized' });
  });

  it('maps a 403 to unauthorized', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ error: 'forbidden' }, 403)));
    const result = await tester.test('openai', { key: 'bad' });
    expect(result).toEqual({ ok: false, error: 'unauthorized' });
  });

  it('maps a 402 to no-credit', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ error: 'payment required' }, 402)));
    const result = await tester.test('openai', { key: 'sk-test' });
    expect(result).toEqual({ ok: false, error: 'no-credit' });
  });

  it('maps a quota/billing error body (even on a 429) to no-credit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response({ error: { message: 'You exceeded your current quota' } }, 429))
    );
    const result = await tester.test('openai', { key: 'sk-test' });
    expect(result).toEqual({ ok: false, error: 'no-credit' });
  });

  it('maps an insufficient-credit body to no-credit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response({ error: { message: 'insufficient credits to run this model' } }, 400))
    );
    const result = await tester.test('openrouter', { key: 'sk-test' });
    expect(result).toEqual({ ok: false, error: 'no-credit' });
  });

  it('maps a network throw to offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    const result = await tester.test('openai', { key: 'sk-test' });
    expect(result).toEqual({ ok: false, error: 'offline' });
  });

  it('maps an abort/timeout to offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    const result = await tester.test('openai', { key: 'sk-test' });
    expect(result).toEqual({ ok: false, error: 'offline' });
  });

  it('maps an unclassifiable 500 to unknown', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ error: 'server error' }, 500)));
    const result = await tester.test('openai', { key: 'sk-test' });
    expect(result).toEqual({ ok: false, error: 'unknown' });
  });

  it('maps a 200 with an error-shaped body to no-credit when it reads like billing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response({ error: { message: 'billing hard limit reached' } }, 200))
    );
    const result = await tester.test('openai', { key: 'sk-test' });
    expect(result).toEqual({ ok: false, error: 'no-credit' });
  });

  it('uses the Anthropic auth scheme for anthropic (x-api-key + version header)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ content: [{ type: 'text', text: 'hi' }] }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await tester.test('anthropic', { key: 'sk-ant-test' });
    expect(result).toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/v1/messages');
    const headers = init.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('sk-ant-test');
    expect(headers['anthropic-version']).toBeTruthy();
    expect(headers.Authorization).toBeUndefined();
  });

  it('falls back to /v1/models when the inference probe model is stale (404 model-not-found)', async () => {
    // A retired TEST_MODEL → 404 not_found on /v1/messages, but a valid key →
    // 200 on /v1/models. The tester must rescue the key, not false-negative it.
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response({ type: 'error', error: { type: 'not_found_error', message: 'model: claude-stale' } }, 404)
      )
      .mockResolvedValueOnce(response({ data: [{ id: 'claude-opus-4-7' }] }, 200));
    vi.stubGlobal('fetch', fetchMock);

    const result = await tester.test('anthropic', { key: 'sk-ant-valid' });
    expect(result).toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [messagesUrl] = fetchMock.mock.calls[0] as [string];
    const [modelsUrl] = fetchMock.mock.calls[1] as [string];
    expect(messagesUrl).toContain('/v1/messages');
    expect(modelsUrl).toContain('/v1/models');
  });

  it('still reports unauthorized when a stale-model fallback hits a bad key', async () => {
    // A stale model AND a bad key: the 404 triggers the fallback, the fallback's
    // 401 must surface as `unauthorized` - the fallback never masks a bad key.
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response({ type: 'error', error: { type: 'not_found_error', message: 'model: claude-stale' } }, 404)
      )
      .mockResolvedValueOnce(response({ error: 'invalid x-api-key' }, 401));
    vi.stubGlobal('fetch', fetchMock);

    const result = await tester.test('anthropic', { key: 'sk-ant-bad' });
    expect(result).toEqual({ ok: false, error: 'unauthorized' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does NOT fall back for a 404 that is an auth failure, not a missing model', async () => {
    // A 401/403 is never a stale-model case - it must not trigger the fallback.
    const fetchMock = vi.fn().mockResolvedValue(response({ error: 'invalid x-api-key' }, 401));
    vi.stubGlobal('fetch', fetchMock);

    const result = await tester.test('anthropic', { key: 'sk-ant-bad' });
    expect(result).toEqual({ ok: false, error: 'unauthorized' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('uses the Gemini query-param auth scheme for google-gemini', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ candidates: [{ content: { parts: [{ text: 'hi' }] } }] }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await tester.test('google-gemini', { key: 'gem-test' });
    expect(result).toEqual({ ok: true });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('key=gem-test');
    expect(url).toContain('generateContent');
  });

  it('falls back to a /v1/models auth-only check for a provider with no test model', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ data: [{ id: 'x' }] }, 200));
    vi.stubGlobal('fetch', fetchMock);

    // `cohere` has a /v1/models endpoint but no known cheap chat model here.
    const result = await tester.test('cohere', { key: 'co-test' });
    expect(result).toEqual({ ok: true });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/models');
  });

  it('runs a real inference probe for NVIDIA NIM, not a weak /v1/models check (issue #45)', async () => {
    // Regression for #45: NVIDIA answers 200 on /v1/models even for a bad token.
    // With a NIM test model, connect must POST a real completion to
    // /v1/chat/completions so an invalid key fails instead of false-validating.
    const fetchMock = vi.fn().mockResolvedValue(response({ choices: [{ message: { content: 'hi' } }] }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await tester.test('nvidia', { key: 'nvapi-good' });
    expect(result).toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('integrate.api.nvidia.com');
    expect(url).toContain('chat/completions');
    expect(url).not.toContain('/v1/models');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer nvapi-good');
  });

  it('reports unauthorized for a bad NVIDIA key instead of false-validating (issue #45)', async () => {
    // The core bug: a bad NVIDIA token used to 200 on /v1/models. The inference
    // probe makes the same bad token surface its real 401 as `unauthorized`.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ error: 'invalid api key' }, 401)));

    const result = await tester.test('nvidia', { key: 'nvapi-bad' });
    expect(result).toEqual({ ok: false, error: 'unauthorized' });
  });

  it('returns unknown for a provider with neither a test model nor a models endpoint', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    // `aws-bedrock` has no PROVIDER_ENDPOINTS entry and no test model.
    const result = await tester.test('aws-bedrock', { fields: { region: 'us-east-1' } });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('unknown');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never throws - a fetch that throws synchronously still resolves to a typed failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        throw new Error('sync explosion');
      })
    );
    const result = await tester.test('openai', { key: 'sk-test' });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('offline');
  });

  // ─── #339: custom OpenAI-compatible base with no /models listing (Cloudflare) ──
  // Cloudflare Workers AI exposes /chat/completions + /embeddings but NO /models,
  // so the happy-path /models probe 404s even with a valid key. The tester must
  // fall back to an auth-only /chat/completions probe before declaring failure.
  const CF_BASE = 'https://api.cloudflare.com/client/v4/accounts/abc123/ai/v1';

  it('connects a custom base whose /models 404s but whose /chat/completions authenticates (#339)', async () => {
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve(
        String(url).includes('/models')
          ? response('no route for that URI', 404)
          : response({ choices: [{ message: { content: 'hi' } }] }, 200)
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await tester.test('openai-compatible', { key: 'cf-token' }, CF_BASE);
    expect(result).toEqual({ ok: true });

    // /models tried first (happy path), then the /chat/completions fallback POST.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [modelsUrl] = fetchMock.mock.calls[0] as [string];
    const [chatUrl, chatInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(modelsUrl).toBe(`${CF_BASE}/models`);
    expect(chatUrl).toBe(`${CF_BASE}/chat/completions`);
    expect(chatInit.method).toBe('POST');
  });

  it('connects when the chat fallback rejects the placeholder model (auth proven past the model layer, #339)', async () => {
    // The gateway authenticates the key, then 404s our deliberately-unknown probe
    // model. A model-level rejection proves auth - the connect succeeds (degraded:
    // the user supplies a real model id when adding the provider).
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve(
        String(url).includes('/models')
          ? response('not found', 404)
          : response({ error: { message: 'model wayland-connectivity-probe not found' } }, 404)
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await tester.test('openai-compatible', { key: 'cf-token' }, CF_BASE);
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('falls back to the chat probe when /models returns an empty list (#339)', async () => {
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve(
        String(url).includes('/models')
          ? response({ data: [] }, 200)
          : response({ choices: [{ message: { content: 'hi' } }] }, 200)
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await tester.test('openai-compatible', { key: 'cf-token' }, CF_BASE);
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does NOT run the chat fallback when /models is a real auth failure (401) (#339)', async () => {
    // A 401 from /models is a bad key - it must surface as unauthorized, never be
    // rescued by the chat fallback.
    const fetchMock = vi.fn().mockResolvedValue(response({ error: 'invalid token' }, 401));
    vi.stubGlobal('fetch', fetchMock);

    const result = await tester.test('openai-compatible', { key: 'bad-token' }, CF_BASE);
    expect(result).toEqual({ ok: false, error: 'unauthorized' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports unauthorized when the chat fallback itself rejects the key (#339)', async () => {
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve(
        String(url).includes('/models') ? response('not found', 404) : response({ error: 'invalid token' }, 401)
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await tester.test('openai-compatible', { key: 'bad-token' }, CF_BASE);
    expect(result).toEqual({ ok: false, error: 'unauthorized' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('still fails for a wrong base URL where neither /models nor /chat/completions exists (#339)', async () => {
    // A bare 404 on both endpoints (no model signal) means the base URL is wrong -
    // the fallback must NOT false-positive this into a successful connect.
    const fetchMock = vi.fn().mockResolvedValue(response('not found', 404));
    vi.stubGlobal('fetch', fetchMock);

    const result = await tester.test('openai-compatible', { key: 'cf-token' }, CF_BASE);
    expect(result.ok).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
