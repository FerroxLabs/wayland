/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The module imports the model bridge and the Gemini OAuth helper at load time;
// both pull in Electron/runtime deps that are irrelevant here. Passing an
// explicit opts.model bypasses the provider scan, so stub these to no-ops.
vi.mock('@process/bridge/modelBridge', () => ({
  getMergedModelProviders: vi.fn(async () => []),
}));
vi.mock('@process/services/completion/geminiOAuth', () => ({
  googleAuthGeminiComplete: vi.fn(),
  isGoogleAuthGeminiAvailable: vi.fn(() => false),
}));

import { getMergedModelProviders } from '../../../../../src/process/bridge/modelBridge';
import {
  oneShotComplete,
  oneShotCompleteBest,
  rankedBestModels,
  type PickedModel,
} from '../../../../../src/process/services/completion/oneShot';
import type { IProvider } from '../../../../../src/common/config/storage';

const anthropicModel: PickedModel = {
  provider: { platform: 'anthropic', apiKey: 'sk-ant-test', baseUrl: '' } as unknown as IProvider,
  modelId: 'claude-haiku',
};

const openaiModel: PickedModel = {
  provider: { platform: 'openai', apiKey: 'sk-test', baseUrl: '' } as unknown as IProvider,
  modelId: 'gpt-4o-mini',
};

const mockFetch = (res: Response) => {
  const fn = vi.fn().mockResolvedValue(res);
  globalThis.fetch = fn as unknown as typeof globalThis.fetch;
  return fn;
};

describe('oneShotComplete - non-JSON / HTML error bodies (#244 / #248)', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('anthropic: a 502 with an HTML body throws a clear HTTP error, not a JSON-parse error', async () => {
    mockFetch(new Response('<html> <head><title>502 Bad Gateway</title></head> </html>', { status: 502 }));
    await expect(oneShotComplete('hi', { model: anthropicModel })).rejects.toThrow(/HTTP 502/);
    await expect(oneShotComplete('hi', { model: anthropicModel })).rejects.not.toThrow(/Unexpected token/);
  });

  it('openai-compatible: a 502 with an HTML body throws a clear HTTP error, not a JSON-parse error', async () => {
    mockFetch(new Response('<html> <body>502</body> </html>', { status: 502 }));
    await expect(oneShotComplete('hi', { model: openaiModel })).rejects.toThrow(/HTTP 502/);
    await expect(oneShotComplete('hi', { model: openaiModel })).rejects.not.toThrow(/Unexpected token/);
  });

  it('anthropic: a 200 JSON body resolves to the extracted text', async () => {
    mockFetch(new Response(JSON.stringify({ content: [{ text: '  draft text  ' }] }), { status: 200 }));
    await expect(oneShotComplete('hi', { model: anthropicModel })).resolves.toBe('draft text');
  });

  it('openai-compatible: a 200 JSON body resolves to the extracted text', async () => {
    mockFetch(new Response(JSON.stringify({ choices: [{ message: { content: 'hello' } }] }), { status: 200 }));
    await expect(oneShotComplete('hi', { model: openaiModel })).resolves.toBe('hello');
  });

  it('anthropic: a non-2xx JSON error body surfaces "<status>: <message>"', async () => {
    mockFetch(new Response(JSON.stringify({ error: { message: 'invalid key' } }), { status: 401 }));
    await expect(oneShotComplete('hi', { model: anthropicModel })).rejects.toThrow('401: invalid key');
  });

  it('openai-compatible: a non-2xx JSON error body surfaces "<status>: <message>"', async () => {
    mockFetch(new Response(JSON.stringify({ error: { message: 'rate limited' } }), { status: 429 }));
    await expect(oneShotComplete('hi', { model: openaiModel })).rejects.toThrow('429: rate limited');
  });
});

describe('oneShotCompleteBest - registry provider routing', () => {
  const realFetch = globalThis.fetch;
  const getMergedModelProvidersMock = vi.mocked(getMergedModelProviders);

  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    getMergedModelProvidersMock.mockResolvedValue([]);
  });

  it('skips Flux image/chatgpt subscription bridge rows and keeps Nvidia text rows with default endpoint routing', async () => {
    getMergedModelProvidersMock.mockResolvedValue([
      {
        id: 'flux',
        platform: 'openai-compatible',
        apiKey: 'sk-flux-test',
        baseUrl: '',
        model: ['flux-auto'],
        __waylandModelRegistryBridge: 'v2:flux-router',
      },
      {
        id: 'chatgpt-subscription',
        platform: 'openai-compatible',
        apiKey: 'chatgpt-local',
        baseUrl: 'http://127.0.0.1:25808/wl-chatgpt-compat/v1',
        model: ['gpt-5.5'],
        __waylandModelRegistryBridge: 'v2:chatgpt-subscription',
      },
      {
        id: 'nvidia',
        platform: 'openai-compatible',
        apiKey: 'nvapi-test',
        baseUrl: '',
        model: ['moonshotai/kimi-k2.6'],
        __waylandModelRegistryBridge: 'v2:nvidia',
      },
    ] as unknown as IProvider[]);

    await expect(rankedBestModels()).resolves.toEqual([
      expect.objectContaining({
        modelId: 'moonshotai/kimi-k2.6',
        provider: expect.objectContaining({ id: 'nvidia' }),
      }),
    ]);

    const fetch = mockFetch(
      new Response(JSON.stringify({ choices: [{ message: { content: 'draft ok' } }] }), { status: 200 })
    );
    await expect(oneShotCompleteBest('draft')).resolves.toBe('draft ok');
    expect(fetch).toHaveBeenCalledWith(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer nvapi-test' }),
      })
    );
  });

  it('tries another model from the same provider when the top-ranked model fails', async () => {
    getMergedModelProvidersMock.mockResolvedValue([
      {
        id: 'nvidia',
        platform: 'openai-compatible',
        apiKey: 'nvapi-test',
        baseUrl: '',
        model: ['deepseek-ai/deepseek-v4-pro', 'moonshotai/kimi-k2.6'],
        __waylandModelRegistryBridge: 'v2:nvidia',
      },
    ] as unknown as IProvider[]);

    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response('<html>403</html>', { status: 403 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ choices: [{ message: { content: 'second model worked' } }] }), { status: 200 })
      );
    globalThis.fetch = fetch as unknown as typeof globalThis.fetch;

    await expect(oneShotCompleteBest('draft')).resolves.toBe('second model worked');
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body)).model).toBe('deepseek-ai/deepseek-v4-pro');
    expect(JSON.parse(String(fetch.mock.calls[1][1]?.body)).model).toBe('moonshotai/kimi-k2.6');
  });
});
