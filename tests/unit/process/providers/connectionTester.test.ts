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
});
