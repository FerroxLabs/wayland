/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { DownloadProgress } from '@/common/types/voiceAsset';
import { VoiceAssetDownloadError, VoiceAssetManager, type VoiceAssetIo } from '@process/services/voice/VoiceAssetManager';
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

const encoder = new TextEncoder();

const sha256Hex = (chunks: Uint8Array[]): string => {
  const h = createHash('sha256');
  for (const c of chunks) h.update(c);
  return h.digest('hex');
};

const responseFor = (chunks: Uint8Array[], opts: { ok?: boolean; status?: number; statusText?: string; omitContentLength?: boolean } = {}): Response => {
  const ok = opts.ok ?? true;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
  const total = chunks.reduce((sum, c) => sum + c.byteLength, 0);
  const headers = new Headers();
  if (!opts.omitContentLength) headers.set('content-length', String(total));
  return new Response(stream, {
    status: opts.status ?? (ok ? 200 : 500),
    statusText: opts.statusText ?? '',
    headers,
  });
};

const makeIo = (overrides: Partial<VoiceAssetIo> = {}): VoiceAssetIo => ({
  fetch: vi.fn(),
  exists: vi.fn(() => false),
  ensureDir: vi.fn(async () => undefined),
  openWrite: vi.fn(async () => ({
    write: vi.fn(async () => undefined),
    close: vi.fn(async () => undefined),
  })),
  rename: vi.fn(async () => undefined),
  unlink: vi.fn(async () => undefined),
  ...overrides,
});

describe('VoiceAssetManager.download', () => {
  it('returns cached=true and skips the network when destPath already exists', async () => {
    const chunks = [encoder.encode('payload')];
    const asset = { id: 'whisper-base', url: 'https://x.test/a', destPath: '/c/a.bin', sha256: sha256Hex(chunks) };
    const io = makeIo({ exists: vi.fn(() => true) });
    const result = await VoiceAssetManager.download(asset, undefined, undefined, io);
    expect(result.cached).toBe(true);
    expect(result.destPath).toBe(asset.destPath);
    expect(io.fetch).not.toHaveBeenCalled();
    expect(io.openWrite).not.toHaveBeenCalled();
    expect(io.rename).not.toHaveBeenCalled();
  });

  it('streams chunks, fires progress events with cumulative bytes, and atomic-renames on success', async () => {
    const chunks = [encoder.encode('hello '), encoder.encode('world')];
    const asset = { id: 'whisper-base', url: 'https://x.test/a', destPath: '/c/a.bin', sha256: sha256Hex(chunks) };
    const io = makeIo({ fetch: vi.fn(async () => responseFor(chunks)) });
    const progress: DownloadProgress[] = [];

    const result = await VoiceAssetManager.download(asset, (p) => progress.push(p), undefined, io);

    expect(result.cached).toBe(false);
    expect(result.bytesWritten).toBe(11);
    expect(result.sha256).toBe(asset.sha256);
    expect(io.rename).toHaveBeenCalledWith('/c/a.bin.tmp', '/c/a.bin');
    expect(io.unlink).not.toHaveBeenCalled();
    expect(progress.map((p) => p.bytesDownloaded)).toEqual([6, 11]);
    expect(progress[1].totalBytes).toBe(11);
  });

  it('on SHA mismatch removes the .tmp and throws VOICE_ASSET_HASH_MISMATCH (no rename)', async () => {
    const chunks = [encoder.encode('payload')];
    const asset = { id: 'whisper-base', url: 'https://x.test/a', destPath: '/c/a.bin', sha256: 'f'.repeat(64) };
    const io = makeIo({ fetch: vi.fn(async () => responseFor(chunks)) });

    const err = await VoiceAssetManager.download(asset, undefined, undefined, io).catch((e) => e);
    expect(err).toBeInstanceOf(VoiceAssetDownloadError);
    expect(err.code).toBe('VOICE_ASSET_HASH_MISMATCH');
    expect(io.rename).not.toHaveBeenCalled();
    expect(io.unlink).toHaveBeenCalledWith('/c/a.bin.tmp');
  });

  it('surfaces a fetch failure as VOICE_ASSET_OFFLINE and removes the .tmp', async () => {
    const asset = { id: 'whisper-base', url: 'https://x.test/a', destPath: '/c/a.bin', sha256: 'a'.repeat(64) };
    const io = makeIo({
      fetch: vi.fn(async () => {
        throw new Error('ENOTFOUND example.test');
      }),
    });
    const err = await VoiceAssetManager.download(asset, undefined, undefined, io).catch((e) => e);
    expect(err.code).toBe('VOICE_ASSET_OFFLINE');
    expect(io.unlink).toHaveBeenCalledWith('/c/a.bin.tmp');
    expect(io.rename).not.toHaveBeenCalled();
  });

  it('surfaces a non-ok response as VOICE_ASSET_FETCH_FAILED', async () => {
    const asset = { id: 'whisper-base', url: 'https://x.test/a', destPath: '/c/a.bin', sha256: 'a'.repeat(64) };
    const io = makeIo({
      fetch: vi.fn(async () => new Response(null, { status: 503, statusText: 'Service Unavailable' })),
    });
    const err = await VoiceAssetManager.download(asset, undefined, undefined, io).catch((e) => e);
    expect(err.code).toBe('VOICE_ASSET_FETCH_FAILED');
    expect(io.unlink).toHaveBeenCalledWith('/c/a.bin.tmp');
  });

  it('honours a pre-aborted AbortSignal with VOICE_ASSET_CANCELLED', async () => {
    const asset = { id: 'whisper-base', url: 'https://x.test/a', destPath: '/c/a.bin', sha256: 'a'.repeat(64) };
    const io = makeIo();
    const ac = new AbortController();
    ac.abort();
    const err = await VoiceAssetManager.download(asset, undefined, ac.signal, io).catch((e) => e);
    expect(err.code).toBe('VOICE_ASSET_CANCELLED');
    expect(io.fetch).not.toHaveBeenCalled();
  });

  it('the same primitive serves both a binary and a weight download', async () => {
    const binChunks = [encoder.encode('BIN')];
    const weightChunks = [encoder.encode('WEIGHT-BYTES')];
    const binIo = makeIo({ fetch: vi.fn(async () => responseFor(binChunks)) });
    const weightIo = makeIo({ fetch: vi.fn(async () => responseFor(weightChunks)) });

    const binResult = await VoiceAssetManager.download({ id: 'whisper-cpp-binary', url: 'https://x.test/whisper-cli', destPath: '/c/bin/whisper-cli', sha256: sha256Hex(binChunks) }, undefined, undefined, binIo);
    const weightResult = await VoiceAssetManager.download({ id: 'whisper-ggml-base', url: 'https://x.test/ggml.bin', destPath: '/c/models/ggml.bin', sha256: sha256Hex(weightChunks) }, undefined, undefined, weightIo);

    expect(binResult.bytesWritten).toBe(3);
    expect(weightResult.bytesWritten).toBe(12);
    expect(binIo.rename).toHaveBeenCalled();
    expect(weightIo.rename).toHaveBeenCalled();
  });

  it('uses the totalBytes hint when Content-Length is absent', async () => {
    const chunks = [encoder.encode('abc')];
    const asset = { id: 'a', url: 'https://x.test/a', destPath: '/c/a.bin', sha256: sha256Hex(chunks), totalBytes: 999 };
    const io = makeIo({ fetch: vi.fn(async () => responseFor(chunks, { omitContentLength: true })) });
    const progress: DownloadProgress[] = [];
    await VoiceAssetManager.download(asset, (p) => progress.push(p), undefined, io);
    expect(progress[0].totalBytes).toBe(999);
  });
});

describe('VoiceAssetManager.cancel', () => {
  it('returns false when no download with the given id is in flight', () => {
    expect(VoiceAssetManager.cancel('nonexistent')).toBe(false);
  });
});
