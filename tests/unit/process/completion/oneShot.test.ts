/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Regression for #244/#248: the one-shot draft completion must surface a clean
 * HTTP error when a provider returns a non-2xx or non-JSON body (a 502/login
 * HTML page, a 404, an auth redirect) instead of the cryptic
 * `Unexpected token '<', "<html> <"... is not valid JSON` that `res.json()`
 * throws on HTML — and oneShotCompleteBest must try the next usable provider
 * rather than hard-failing on a single broken "best" pick.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IProvider } from '@/common/config/storage';

const { mockGetProviders, mockGoogleAvailable, mockGoogleComplete } = vi.hoisted(() => ({
  mockGetProviders: vi.fn(async () => [] as IProvider[]),
  mockGoogleAvailable: vi.fn(() => false as boolean),
  mockGoogleComplete: vi.fn(async () => 'GOOGLE_DRAFT'),
}));

vi.mock('@process/bridge/modelBridge', () => ({
  getMergedModelProviders: mockGetProviders,
}));

vi.mock('@process/services/completion/geminiOAuth', () => ({
  isGoogleAuthGeminiAvailable: mockGoogleAvailable,
  googleAuthGeminiComplete: mockGoogleComplete,
}));

import { oneShotComplete, oneShotCompleteBest } from '@process/services/completion/oneShot';

/** A fetch Response stub exposing BOTH `.text()` (new path) and `.json()` (old path). */
function makeRes(status: number, body: string): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
    json: async () => JSON.parse(body),
  } as unknown as Response;
}

/** A minimal openai-compatible provider that resolveEndpoint() will accept. */
function provider(id: string, modelId = 'gpt-4o'): IProvider {
  return {
    id,
    platform: 'openai',
    name: id,
    baseUrl: '',
    apiKey: `key-${id}`,
    model: [modelId],
    enabled: true,
  } as IProvider;
}

const HTML_502 = '<html> <head><title>502 Bad Gateway</title></head> <body>502</body> </html>';

beforeEach(() => {
  vi.clearAllMocks();
  mockGetProviders.mockResolvedValue([]);
  mockGoogleAvailable.mockReturnValue(false);
});

describe('oneShotComplete — HTTP/JSON error guard (#244/#248)', () => {
  const model = { provider: provider('p'), modelId: 'gpt-4o' };

  it('throws a clean HTTP error (not "Unexpected token") on a non-2xx HTML body', async () => {
    global.fetch = vi.fn().mockResolvedValue(makeRes(502, HTML_502)) as unknown as typeof fetch;
    await expect(oneShotComplete('hi', { model })).rejects.toThrow(/HTTP 502/);
    await expect(oneShotComplete('hi', { model })).rejects.not.toThrow(/Unexpected token/);
  });

  it('throws a clean error on a 200 response with a non-JSON (HTML) body', async () => {
    global.fetch = vi.fn().mockResolvedValue(makeRes(200, '<html>not json</html>')) as unknown as typeof fetch;
    await expect(oneShotComplete('hi', { model })).rejects.toThrow(/non-JSON response \(HTTP 200\)/);
  });

  it('surfaces the provider error message on a JSON error body', async () => {
    const body = JSON.stringify({ error: { message: 'invalid x-api-key' } });
    global.fetch = vi.fn().mockResolvedValue(makeRes(401, body)) as unknown as typeof fetch;
    await expect(oneShotComplete('hi', { model })).rejects.toThrow('401: invalid x-api-key');
  });

  it('returns the completion text on a valid 200 JSON body', async () => {
    const body = JSON.stringify({ choices: [{ message: { content: '  hello  ' } }] });
    global.fetch = vi.fn().mockResolvedValue(makeRes(200, body)) as unknown as typeof fetch;
    await expect(oneShotComplete('hi', { model })).resolves.toBe('hello');
  });
});

describe('oneShotCompleteBest — provider fallback (#244/#248)', () => {
  it('falls through a broken top-ranked provider to the next working one', async () => {
    mockGetProviders.mockResolvedValue([provider('broken'), provider('good')]);
    const okBody = JSON.stringify({ choices: [{ message: { content: 'GOOD DRAFT' } }] });
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeRes(502, HTML_502)) // broken provider
      .mockResolvedValueOnce(makeRes(200, okBody)) as unknown as typeof fetch; // good provider
    await expect(oneShotCompleteBest('hi')).resolves.toBe('GOOD DRAFT');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('throws the real provider error (not "Unexpected token") when every provider fails', async () => {
    mockGetProviders.mockResolvedValue([provider('a'), provider('b')]);
    global.fetch = vi.fn().mockResolvedValue(makeRes(502, HTML_502)) as unknown as typeof fetch;
    await expect(oneShotCompleteBest('hi')).rejects.toThrow(/HTTP 502/);
    await expect(oneShotCompleteBest('hi')).rejects.not.toThrow(/Unexpected token/);
  });

  it('falls back to Google-auth Gemini when no keyed provider works', async () => {
    mockGetProviders.mockResolvedValue([]);
    mockGoogleAvailable.mockReturnValue(true);
    await expect(oneShotCompleteBest('hi')).resolves.toBe('GOOGLE_DRAFT');
    expect(mockGoogleComplete).toHaveBeenCalled();
  });

  it('throws no-usable-model when there is no provider and no Google auth', async () => {
    mockGetProviders.mockResolvedValue([]);
    mockGoogleAvailable.mockReturnValue(false);
    await expect(oneShotCompleteBest('hi')).rejects.toThrow('no-usable-model');
  });
});
