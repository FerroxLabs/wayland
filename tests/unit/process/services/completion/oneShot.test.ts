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

import { oneShotComplete, type PickedModel } from '../../../../../src/process/services/completion/oneShot';
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
