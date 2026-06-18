/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type HfSearchResult, searchVoiceModels } from '@/renderer/services/huggingFaceVoiceSearch';

const okResponse = (body: unknown): Response =>
  ({
    ok: true,
    status: 200,
    json: async () => body,
  }) as unknown as Response;

describe('searchVoiceModels', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('builds the HF URL with search, limit, sort and direction', async () => {
    fetchMock.mockResolvedValue(okResponse([]));

    await searchVoiceModels('kokoro', 'tts', 7);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url.startsWith('https://huggingface.co/api/models?')).toBe(true);
    expect(url).toContain('search=kokoro');
    expect(url).toContain('limit=7');
    expect(url).toContain('sort=downloads');
    expect(url).toContain('direction=-1');
  });

  it('maps TTS hits to mlx-audio-local entries filtered to supported families', async () => {
    fetchMock.mockResolvedValue(
      okResponse([
        {
          id: 'mlx-community/Kokoro-82M-mlx',
          author: 'mlx-community',
          downloads: 12345,
          tags: ['mlx', 'text-to-speech'],
        },
        {
          id: 'someone/f5-tts-voice',
          author: 'someone',
          downloads: 50,
          tags: ['f5'],
        },
      ]),
    );

    const results = await searchVoiceModels('voice', 'tts');

    expect(results.length).toBe(2);
    for (const r of results) {
      expect(r.engineId).toBe('mlx-audio-local');
      expect(r.kind).toBe('tts');
      expect(r.platform).toBe('darwin-arm64');
      expect(r.local).toBe(true);
      expect(r.trust).toBe('community');
    }

    const kokoro = results.find((r) => r.modelId === 'mlx-community/Kokoro-82M-mlx') as HfSearchResult;
    expect(kokoro.hfId).toBe('mlx-community/Kokoro-82M-mlx');
    expect(kokoro.label).toBe('Kokoro-82M-mlx');
    expect(kokoro.downloads).toBe(12345);
    expect(kokoro.blurb).toContain('mlx-community');
    expect(kokoro.blurb).toContain('12,345 downloads');
  });

  it('flags a non-matching repo as unverified rather than dropping it', async () => {
    fetchMock.mockResolvedValue(
      okResponse([
        { id: 'someone/totally-random-model', author: 'someone', downloads: 3, tags: ['nlp'] },
      ]),
    );

    const results = await searchVoiceModels('random', 'tts');

    expect(results.length).toBe(1);
    expect(results[0].trust).toBe('unverified');
    expect(results[0].modelId).toBe('someone/totally-random-model');
  });

  it('maps STT hits to whisper-local and matches whisper/parakeet/moonshine', async () => {
    fetchMock.mockResolvedValue(
      okResponse([
        { id: 'org/faster-whisper-large', author: 'org', downloads: 999, tags: ['whisper'] },
        { id: 'org/parakeet-tdt', author: 'org', downloads: 10, tags: ['asr'] },
        { id: 'org/unrelated', author: 'org', downloads: 1, tags: [] },
      ]),
    );

    const results = await searchVoiceModels('speech', 'stt');

    expect(results.length).toBe(3);
    const byId = Object.fromEntries(results.map((r) => [r.modelId, r]));
    expect(byId['org/faster-whisper-large'].engineId).toBe('whisper-local');
    expect(byId['org/faster-whisper-large'].trust).toBe('community');
    expect(byId['org/parakeet-tdt'].trust).toBe('community');
    expect(byId['org/unrelated'].trust).toBe('unverified');
    // STT entries are not platform-gated.
    expect(byId['org/faster-whisper-large'].platform).toBeUndefined();
  });

  it('orders community results before unverified', async () => {
    fetchMock.mockResolvedValue(
      okResponse([
        { id: 'a/unrelated', author: 'a', downloads: 100000, tags: [] },
        { id: 'b/kokoro', author: 'b', downloads: 5, tags: ['mlx'] },
      ]),
    );

    const results = await searchVoiceModels('x', 'tts');

    expect(results[0].trust).toBe('community');
    expect(results[1].trust).toBe('unverified');
  });

  it('returns [] on a non-200 response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 } as unknown as Response);
    expect(await searchVoiceModels('kokoro', 'tts')).toEqual([]);
  });

  it('returns [] when fetch rejects', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    expect(await searchVoiceModels('kokoro', 'tts')).toEqual([]);
  });

  it('returns [] for an empty query without calling fetch', async () => {
    expect(await searchVoiceModels('   ', 'tts')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
