/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiProviderSource, ProviderSourceError } from '@process/providers/sources/ApiProviderSource';
import { WaylandCoreSource } from '@process/providers/sources/WaylandCoreSource';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal `Response`-like object good enough for the source code. */
function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

/** A non-JSON error response - `json()` rejects, `text()` yields the raw body. */
function textResponse(text: string, status: number): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      throw new SyntaxError('not json');
    },
    text: async () => text,
  } as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ─── ApiProviderSource ────────────────────────────────────────────────────────

describe('ApiProviderSource', () => {
  it('exposes the api kind and the provider id it was constructed with', () => {
    const source = new ApiProviderSource('openai', 'sk-test');
    expect(source.kind).toBe('api');
    expect(source.providerId).toBe('openai');
  });

  it('normalizes an OpenAI-style { data: [{ id }] } response to RawModel[]', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [{ id: 'gpt-5' }, { id: 'gpt-4o' }] }));
    vi.stubGlobal('fetch', fetchMock);

    const models = await new ApiProviderSource('openai', 'sk-test').listModels();

    expect(models).toEqual([
      { id: 'gpt-5', providerId: 'openai' },
      { id: 'gpt-4o', providerId: 'openai' },
    ]);
  });

  it('sends the api key as a Bearer token to the provider models endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await new ApiProviderSource('openai', 'sk-secret').listModels();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.openai.com/v1/models');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer sk-secret');
  });

  it('normalizes an Anthropic-style response and keeps display_name as rawName', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: [{ id: 'claude-opus-4', display_name: 'Claude Opus 4' }],
        has_more: false,
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const models = await new ApiProviderSource('anthropic', 'sk-ant').listModels();

    expect(models).toEqual([{ id: 'claude-opus-4', providerId: 'anthropic', rawName: 'Claude Opus 4' }]);
  });

  it('strips the models/ prefix from Gemini ids and keeps name as rawName', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        models: [{ name: 'models/gemini-2.5-pro' }],
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const models = await new ApiProviderSource('google-gemini', 'g-key').listModels();

    expect(models).toEqual([{ id: 'gemini-2.5-pro', providerId: 'google-gemini', rawName: 'gemini-2.5-pro' }]);
  });

  it('follows Anthropic has_more pagination via the after_id query param', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: 'claude-a' }, { id: 'claude-b' }],
          has_more: true,
          last_id: 'claude-b',
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: 'claude-c' }],
          has_more: false,
          last_id: 'claude-c',
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    const models = await new ApiProviderSource('anthropic', 'sk-ant').listModels();

    expect(models.map((m) => m.id)).toEqual(['claude-a', 'claude-b', 'claude-c']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondUrl = fetchMock.mock.calls[1]?.[0] as string;
    expect(secondUrl).toContain('after_id=claude-b');
  });

  it('follows Gemini nextPageToken pagination via the pageToken query param', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          models: [{ name: 'models/gemini-a' }],
          nextPageToken: 'tok-2',
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          models: [{ name: 'models/gemini-b' }],
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    const models = await new ApiProviderSource('google-gemini', 'g-key').listModels();

    expect(models.map((m) => m.id)).toEqual(['gemini-a', 'gemini-b']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondUrl = fetchMock.mock.calls[1]?.[0] as string;
    expect(secondUrl).toContain('pageToken=tok-2');
  });

  it('returns [] without throwing for a 200 response with an empty model list', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [] }));
    vi.stubGlobal('fetch', fetchMock);

    const models = await new ApiProviderSource('openai', 'sk-test').listModels();

    expect(models).toEqual([]);
  });

  it('returns [] without throwing for a 200 response with no model field at all', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ object: 'list' }));
    vi.stubGlobal('fetch', fetchMock);

    const models = await new ApiProviderSource('openai', 'sk-test').listModels();

    expect(models).toEqual([]);
  });

  it('throws ProviderSourceError with code unauthorized on a 401', async () => {
    const fetchMock = vi.fn().mockResolvedValue(textResponse('Invalid API key', 401));
    vi.stubGlobal('fetch', fetchMock);

    const source = new ApiProviderSource('openai', 'sk-bad');
    await expect(source.listModels()).rejects.toBeInstanceOf(ProviderSourceError);
    await expect(source.listModels()).rejects.toMatchObject({ code: 'unauthorized' });
  });

  it('throws ProviderSourceError with code unauthorized on a 403', async () => {
    const fetchMock = vi.fn().mockResolvedValue(textResponse('Forbidden', 403));
    vi.stubGlobal('fetch', fetchMock);

    await expect(new ApiProviderSource('openai', 'sk-bad').listModels()).rejects.toMatchObject({
      code: 'unauthorized',
    });
  });

  it('throws ProviderSourceError with code no-credit on a 402', async () => {
    const fetchMock = vi.fn().mockResolvedValue(textResponse('Payment required', 402));
    vi.stubGlobal('fetch', fetchMock);

    await expect(new ApiProviderSource('openai', 'sk-test').listModels()).rejects.toMatchObject({
      code: 'no-credit',
    });
  });

  it('throws ProviderSourceError with code no-credit when a body mentions a quota/billing issue', async () => {
    const fetchMock = vi.fn().mockResolvedValue(textResponse('You exceeded your current quota', 429));
    vi.stubGlobal('fetch', fetchMock);

    await expect(new ApiProviderSource('openai', 'sk-test').listModels()).rejects.toMatchObject({
      code: 'no-credit',
    });
  });

  it('throws ProviderSourceError with code unknown on a generic 500', async () => {
    const fetchMock = vi.fn().mockResolvedValue(textResponse('Internal error', 500));
    vi.stubGlobal('fetch', fetchMock);

    await expect(new ApiProviderSource('openai', 'sk-test').listModels()).rejects.toMatchObject({
      code: 'unknown',
    });
  });

  it('throws ProviderSourceError with code offline when fetch rejects with a network error', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(new ApiProviderSource('openai', 'sk-test').listModels()).rejects.toMatchObject({
      code: 'offline',
    });
  });

  it('throws ProviderSourceError with code offline when the request aborts on timeout', async () => {
    const abortErr = new DOMException('aborted', 'AbortError');
    const fetchMock = vi.fn().mockRejectedValue(abortErr);
    vi.stubGlobal('fetch', fetchMock);

    await expect(new ApiProviderSource('openai', 'sk-test').listModels()).rejects.toMatchObject({
      code: 'offline',
    });
  });

  it('throws ProviderSourceError with code unknown when the provider has no known endpoint', async () => {
    // aws-bedrock has no /v1/models endpoint in PROVIDER_ENDPOINTS.
    const source = new ApiProviderSource('aws-bedrock', 'key');
    await expect(source.listModels()).rejects.toMatchObject({ code: 'unknown' });
  });

  it('throws code unknown when pagination hits the safety cap with a cursor still pending', async () => {
    // A misbehaving provider that always claims more pages.
    const fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(jsonResponse({ data: [{ id: 'loop-model' }], has_more: true, last_id: 'loop-model' }))
      );
    vi.stubGlobal('fetch', fetchMock);

    // A stuck cursor is a provider fault - it must surface, not return a partial list.
    await expect(new ApiProviderSource('anthropic', 'sk-ant').listModels()).rejects.toMatchObject({
      code: 'unknown',
    });
    // The loop still terminates - it does not hang or fetch unbounded pages.
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(100);
  });

  it('sends Anthropic auth via x-api-key + anthropic-version and no Authorization header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [], has_more: false }));
    vi.stubGlobal('fetch', fetchMock);

    await new ApiProviderSource('anthropic', 'sk-ant-secret').listModels();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.anthropic.com/v1/models');
    const headers = init.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('sk-ant-secret');
    expect(headers['anthropic-version']).toBe('2023-06-01');
    expect(headers.Authorization).toBeUndefined();
  });

  it('sends Gemini auth as a key query param and no Authorization header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ models: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await new ApiProviderSource('google-gemini', 'g-secret').listModels();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('key=g-secret');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('aborts the request when the fetch timeout elapses and maps it to offline', async () => {
    vi.useFakeTimers();
    try {
      // A fetch that never resolves on its own - only an abort can settle it.
      const fetchMock = vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            const signal = init.signal;
            signal?.addEventListener('abort', () => {
              reject(new DOMException('aborted', 'AbortError'));
            });
          })
      );
      vi.stubGlobal('fetch', fetchMock);

      const pending = new ApiProviderSource('openai', 'sk-test').listModels();
      // Surface the rejection so an unhandled-rejection warning is not emitted.
      const assertion = expect(pending).rejects.toMatchObject({ code: 'offline' });

      // Advance past the 15s fetch-timeout constant - the setTimeout fires and aborts.
      await vi.advanceTimersByTimeAsync(15_000);
      await assertion;
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('throws code unknown for a 200 response with a non-JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(textResponse('<html>error</html>', 200));
    vi.stubGlobal('fetch', fetchMock);

    await expect(new ApiProviderSource('openai', 'sk-test').listModels()).rejects.toMatchObject({
      code: 'unknown',
    });
  });

  it('throws code no-credit for a 200 response carrying an insufficient-quota error body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        error: { type: 'insufficient_quota', message: 'You exceeded your current quota' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(new ApiProviderSource('openai', 'sk-test').listModels()).rejects.toMatchObject({
      code: 'no-credit',
    });
  });

  it('throws code unknown for a 200 response carrying a non-billing error body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: { message: 'internal failure' } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(new ApiProviderSource('openai', 'sk-test').listModels()).rejects.toMatchObject({
      code: 'unknown',
    });
  });
  // Wave 3 Fix 10 - a refresh on a custom-base provider must NOT silently
  // re-target the canonical default. The constructor's third arg overrides
  // `PROVIDER_ENDPOINTS[providerId]` end-to-end.
  it('targets the user-supplied custom base URL when one is provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [{ id: 'llama3' }] }));
    vi.stubGlobal('fetch', fetchMock);

    await new ApiProviderSource('openai-compatible', 'sk-self', 'https://my-host.example.com/v1').listModels();

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe('https://my-host.example.com/v1/models');
  });

  it('appends /v1/models to a custom base URL that lacks a /v1 segment', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await new ApiProviderSource('openai-compatible', 'sk', 'https://my-gateway.example.com').listModels();

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe('https://my-gateway.example.com/v1/models');
  });
});

// ─── WaylandCoreSource ────────────────────────────────────────────────────────

describe('WaylandCoreSource', () => {
  it('exposes the wcore kind and a wcore provider id', () => {
    const source = new WaylandCoreSource();
    expect(source.kind).toBe('wcore');
    expect(source.providerId).toBe('wcore');
  });

  it('returns an empty model list - Wayland Core proxies connected providers and owns none', async () => {
    const models = await new WaylandCoreSource().listModels();
    expect(models).toEqual([]);
  });
});
