/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConnectionTester } from '@process/providers/detection/ConnectionTester';

/** Build a minimal `Response`-like object for the fetch stub. */
function resp(status: number, body: unknown): Response {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
  } as unknown as Response;
}

const MODELS_OK = { data: [{ id: 'some-model' }] };

describe('ConnectionTester — openai-compatible / custom base (GH #2)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const tester = new ConnectionTester();

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('probes the user base URL (regression: used to always return unknown)', async () => {
    fetchMock.mockResolvedValueOnce(resp(200, MODELS_OK));
    const result = await tester.test('openai-compatible', { key: 'sk-x', baseUrl: 'https://ai.sumopod.com' });
    expect(result).toEqual({ ok: true });
    // Bare host gets a /v1/models suffix, with a bearer header.
    expect(fetchMock.mock.calls[0][0]).toBe('https://ai.sumopod.com/v1/models');
    expect(fetchMock.mock.calls[0][1].method).toBe('GET');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer sk-x');
  });

  it('does not double a /v1 already present in the base', async () => {
    fetchMock.mockResolvedValueOnce(resp(200, MODELS_OK));
    await tester.test('openai-compatible', { key: 'sk-x', baseUrl: 'https://host.example/v1' });
    expect(fetchMock.mock.calls[0][0]).toBe('https://host.example/v1/models');
  });

  it('classifies a rejected key as unauthorized', async () => {
    fetchMock.mockResolvedValueOnce(resp(401, { error: 'bad key' }));
    expect(await tester.test('openai-compatible', { key: 'bad', baseUrl: 'https://x.test' })).toEqual({
      ok: false,
      error: 'unauthorized',
    });
  });

  it('classifies an empty model list as no-models', async () => {
    fetchMock.mockResolvedValueOnce(resp(200, { data: [] }));
    expect(await tester.test('openai-compatible', { key: 'sk-x', baseUrl: 'https://x.test' })).toEqual({
      ok: false,
      error: 'no-models',
    });
  });

  it('falls back to a chat probe when /v1/models 404s (chat-only proxy)', async () => {
    fetchMock
      .mockResolvedValueOnce(resp(404, 'not found'))
      .mockResolvedValueOnce(resp(200, { choices: [{ message: { content: 'hi' } }] }));
    const result = await tester.test('openai-compatible', { key: 'sk-x', baseUrl: 'https://chatonly.test' });
    expect(result).toEqual({ ok: true });
    expect(fetchMock.mock.calls[1][0]).toBe('https://chatonly.test/v1/chat/completions');
    expect(fetchMock.mock.calls[1][1].method).toBe('POST');
  });

  it('treats model-not-found in the chat fallback as auth proven (ok)', async () => {
    fetchMock
      .mockResolvedValueOnce(resp(404, ''))
      .mockResolvedValueOnce(resp(400, { error: { message: 'The model `gpt-3.5-turbo` does not exist' } }));
    expect(await tester.test('openai-compatible', { key: 'sk-x', baseUrl: 'https://chatonly.test' })).toEqual({
      ok: true,
    });
  });

  it('propagates an unauthorized chat fallback', async () => {
    fetchMock.mockResolvedValueOnce(resp(404, '')).mockResolvedValueOnce(resp(401, { error: 'nope' }));
    expect(await tester.test('openai-compatible', { key: 'bad', baseUrl: 'https://chatonly.test' })).toEqual({
      ok: false,
      error: 'unauthorized',
    });
  });

  it('maps a billing/quota body to no-credit', async () => {
    fetchMock.mockResolvedValueOnce(resp(402, { error: 'insufficient quota' }));
    expect(await tester.test('openai-compatible', { key: 'sk-x', baseUrl: 'https://x.test' })).toEqual({
      ok: false,
      error: 'no-credit',
    });
  });

  it('returns offline when the endpoint is unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    expect(await tester.test('openai-compatible', { key: 'sk-x', baseUrl: 'https://down.test' })).toEqual({
      ok: false,
      error: 'offline',
    });
  });

  it('openai-compatible with no base URL falls back to the canonical OpenAI host', async () => {
    fetchMock.mockResolvedValueOnce(resp(200, MODELS_OK));
    await tester.test('openai-compatible', { key: 'sk-x' });
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.openai.com/v1/models');
  });

  it('routes any provider connected with an explicit baseUrl through the custom probe', async () => {
    fetchMock.mockResolvedValueOnce(resp(200, MODELS_OK));
    await tester.test('openai', { key: 'sk-x', baseUrl: 'https://proxy.test/v1' });
    expect(fetchMock.mock.calls[0][0]).toBe('https://proxy.test/v1/models');
  });
});
