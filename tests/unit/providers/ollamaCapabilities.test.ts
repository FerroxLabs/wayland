/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Reading thinking capability off a local Ollama daemon.
 *
 * Measured on 0.34.1: `POST /api/show {"model":"qwen2.5:0.5b"}` answers
 * `capabilities: ["completion","tools"]`, and a reasoning request on that model
 * fails the turn. So a missing `thinking` member must read as "no option", and
 * so must every way the question can fail to get an answer.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ollamaThinkingModels } from '@process/providers/local/ollamaCapabilities';

const ROOT = 'http://127.0.0.1:11434';

const jsonResponse = (body: unknown) => ({ ok: true, json: async () => body }) as unknown as Response;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ollamaThinkingModels', () => {
  it('keeps only the models whose capabilities list thinking', async () => {
    const seen: { url: string; model: unknown }[] = [];
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      const model = JSON.parse(String(init.body)).model;
      seen.push({ url, model });
      return jsonResponse({
        capabilities: model === 'qwen3:8b' ? ['completion', 'thinking', 'tools'] : ['completion', 'tools'],
      });
    });

    await expect(ollamaThinkingModels(ROOT, ['qwen3:8b', 'qwen2.5:0.5b', 'llama3.2:3b'])).resolves.toEqual(
      new Set(['qwen3:8b'])
    );
    expect(seen.map((s) => s.url)).toEqual([
      'http://127.0.0.1:11434/api/show',
      'http://127.0.0.1:11434/api/show',
      'http://127.0.0.1:11434/api/show',
    ]);
    expect(seen.map((s) => s.model)).toEqual(['qwen3:8b', 'qwen2.5:0.5b', 'llama3.2:3b']);
  });

  // A daemon that is down, a model that is not pulled, a build old enough to
  // return no capabilities at all, and a body that is not what we expect.
  it.each([
    ['the daemon refuses the connection', () => Promise.reject(new Error('connect ECONNREFUSED 127.0.0.1:11434'))],
    // A non-2xx answer is not evidence, whatever its body says. Ollama's own
    // 404 carries an error object, but a proxy or a future build could hand
    // back a stale-looking one, and a failed request must never be believed.
    [
      'the answer is not 2xx, whatever its body says',
      async () =>
        ({ ok: false, json: async () => ({ capabilities: ['completion', 'thinking'] }) }) as unknown as Response,
    ],
    ['the build returns no capabilities field', async () => jsonResponse({ model_info: {} })],
    ['capabilities is not an array', async () => jsonResponse({ capabilities: 'thinking' })],
    ['the body does not parse', async () => ({ ok: true, json: async () => JSON.parse('{') }) as unknown as Response],
  ] as [string, () => Promise<Response>][])('answers no when %s', async (_name, respond) => {
    vi.stubGlobal('fetch', respond);
    await expect(ollamaThinkingModels(ROOT, ['qwen3:8b'])).resolves.toEqual(new Set());
  });

  it('asks about each model once and answers nothing for an empty list', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ capabilities: ['completion', 'thinking'] }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(ollamaThinkingModels(ROOT, ['qwen3:8b', 'qwen3:8b'])).resolves.toEqual(new Set(['qwen3:8b']));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockClear();
    await expect(ollamaThinkingModels(ROOT, [])).resolves.toEqual(new Set());
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
