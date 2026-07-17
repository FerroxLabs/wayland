/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { DownloadProgress, VoiceAsset, VoiceAssetErrorCode } from '@/common/types/voiceAsset';
import {
  VoiceAssetDownloadError,
  VoiceAssetManager,
  type VoiceAssetIo,
} from '@process/services/voice/VoiceAssetManager';
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

const encoder = new TextEncoder();

const sha256Hex = (chunks: Uint8Array[]): string => {
  const h = createHash('sha256');
  for (const c of chunks) h.update(c);
  return h.digest('hex');
};

const responseFor = (
  chunks: Uint8Array[],
  opts: {
    ok?: boolean;
    status?: number;
    statusText?: string;
    omitContentLength?: boolean;
    contentLength?: number;
    keepOpen?: boolean;
    onCancel?: ReturnType<typeof vi.fn>;
    url?: string;
  } = {}
): Response => {
  const ok = opts.ok ?? true;
  const stream = new ReadableStream<Uint8Array>({
    cancel: opts.onCancel,
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      if (!opts.keepOpen) controller.close();
    },
  });
  const total = chunks.reduce((sum, c) => sum + c.byteLength, 0);
  const headers = new Headers();
  if (!opts.omitContentLength) headers.set('content-length', String(opts.contentLength ?? total));
  const response = new Response(stream, {
    status: opts.status ?? (ok ? 200 : 500),
    statusText: opts.statusText ?? '',
    headers,
  });
  if (opts.url) Object.defineProperty(response, 'url', { configurable: true, value: opts.url });
  return response;
};

const redirectResponse = (
  location?: string,
  url = 'https://x.test/a'
): { cancel: ReturnType<typeof vi.fn>; response: Response } => {
  const cancel = vi.fn();
  const stream = new ReadableStream<Uint8Array>({ cancel });
  const headers = new Headers();
  if (location !== undefined) headers.set('location', location);
  const response = new Response(stream, { headers, status: 302 });
  Object.defineProperty(response, 'url', { configurable: true, value: url });
  return { cancel, response };
};

const responseWithReader = (
  reader: {
    cancel: ReturnType<typeof vi.fn>;
    read: ReturnType<typeof vi.fn>;
    releaseLock: ReturnType<typeof vi.fn>;
  },
  bodyCancel = vi.fn(async () => undefined)
): Response =>
  ({
    body: { cancel: bodyCancel, getReader: () => reader },
    headers: new Headers(),
    ok: true,
    status: 200,
    statusText: 'OK',
    url: 'https://x.test/a',
  }) as unknown as Response;

const makeIo = (overrides: Partial<VoiceAssetIo> = {}): VoiceAssetIo => ({
  fetch: vi.fn(),
  exists: vi.fn(() => false),
  hashFile: vi.fn(async () => 'a'.repeat(64)),
  ensureDir: vi.fn(async () => undefined),
  openWrite: vi.fn(async () => ({
    write: vi.fn(async () => undefined),
    close: vi.fn(async () => undefined),
    abort: vi.fn(async () => undefined),
  })),
  rename: vi.fn(async () => undefined),
  unlink: vi.fn(async () => undefined),
  ...overrides,
});

const makeAsset = (overrides: Partial<VoiceAsset> = {}): VoiceAsset => ({
  id: 'whisper-base',
  url: 'https://x.test/a',
  destPath: '/c/a.bin',
  sha256: 'a'.repeat(64),
  maxBytes: 1024,
  ...overrides,
});

const expectDownloadError = async (
  asset: VoiceAsset,
  code: VoiceAssetErrorCode,
  io: VoiceAssetIo = makeIo()
): Promise<VoiceAssetIo> => {
  const error = await VoiceAssetManager.download(asset, undefined, undefined, io).catch((caught) => caught);
  expect(error).toBeInstanceOf(VoiceAssetDownloadError);
  expect(error.code).toBe(code);
  return io;
};

describe('VoiceAssetManager.download', () => {
  it.each([
    ['an empty digest', { sha256: '' }],
    ['a malformed digest', { sha256: 'abc' }],
    ['a data URL', { url: 'data:text/plain,payload' }],
    ['an HTTP URL', { url: 'http://example.test/a' }],
    ['a non-positive size limit', { maxBytes: 0 }],
  ] satisfies Array<[string, Partial<VoiceAsset>]>)(
    'rejects %s before any filesystem or network I/O',
    async (_label, overrides) => {
      const io = makeIo();

      await expectDownloadError(makeAsset(overrides), 'VOICE_ASSET_INVALID_DESCRIPTOR', io);

      expect(io.exists).not.toHaveBeenCalled();
      expect(io.hashFile).not.toHaveBeenCalled();
      expect(io.fetch).not.toHaveBeenCalled();
      expect(io.ensureDir).not.toHaveBeenCalled();
      expect(io.openWrite).not.toHaveBeenCalled();
    }
  );

  it('returns cached=true only when the existing file hash matches', async () => {
    const chunks = [encoder.encode('payload')];
    const asset = makeAsset({ sha256: sha256Hex(chunks) });
    const io = makeIo({ exists: vi.fn(() => true), hashFile: vi.fn(async () => asset.sha256) });
    const result = await VoiceAssetManager.download(asset, undefined, undefined, io);
    expect(result.cached).toBe(true);
    expect(result.destPath).toBe(asset.destPath);
    expect(io.hashFile).toHaveBeenCalledWith(asset.destPath);
    expect(io.fetch).not.toHaveBeenCalled();
    expect(io.openWrite).not.toHaveBeenCalled();
    expect(io.rename).not.toHaveBeenCalled();
  });

  it('does not return a cached success when the caller aborts during hashing', async () => {
    const asset = makeAsset();
    let finishHash!: (hash: string) => void;
    const hashFile = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          finishHash = resolve;
        })
    );
    const io = makeIo({ exists: vi.fn(() => true), hashFile });
    const controller = new AbortController();
    const download = VoiceAssetManager.download(asset, undefined, controller.signal, io).catch((error) => error);
    await vi.waitFor(() => expect(hashFile).toHaveBeenCalledOnce());

    controller.abort();
    finishHash(asset.sha256);
    const error = await download;

    expect(error).toBeInstanceOf(VoiceAssetDownloadError);
    expect(error.code).toBe('VOICE_ASSET_CANCELLED');
    expect(io.fetch).not.toHaveBeenCalled();
    expect(io.unlink).not.toHaveBeenCalled();
  });

  it('replaces a cached file whose hash does not match', async () => {
    const chunks = [encoder.encode('replacement')];
    const asset = makeAsset({ sha256: sha256Hex(chunks) });
    const io = makeIo({
      exists: vi.fn(() => true),
      hashFile: vi.fn(async () => 'f'.repeat(64)),
      fetch: vi.fn(async () => responseFor(chunks)),
    });

    const result = await VoiceAssetManager.download(asset, undefined, undefined, io);

    expect(result.cached).toBe(false);
    expect(io.unlink).toHaveBeenCalledWith(asset.destPath);
    expect(io.fetch).toHaveBeenCalledOnce();
    expect(io.rename).toHaveBeenCalledWith('/c/a.bin.tmp', '/c/a.bin');
  });

  it('streams chunks, fires progress events with cumulative bytes, and atomic-renames on success', async () => {
    const chunks = [encoder.encode('hello '), encoder.encode('world')];
    const asset = makeAsset({ sha256: sha256Hex(chunks) });
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

  it('manually follows a relative HTTPS redirect without enabling automatic redirects', async () => {
    const chunks = [encoder.encode('payload')];
    const asset = makeAsset({ sha256: sha256Hex(chunks) });
    const redirect = redirectResponse('/models/a.bin');
    const io = makeIo({
      fetch: vi
        .fn()
        .mockResolvedValueOnce(redirect.response)
        .mockResolvedValueOnce(responseFor(chunks, { url: 'https://x.test/models/a.bin' })),
    });

    const result = await VoiceAssetManager.download(asset, undefined, undefined, io);

    expect(result.cached).toBe(false);
    expect(io.fetch).toHaveBeenNthCalledWith(1, 'https://x.test/a', expect.objectContaining({ redirect: 'manual' }));
    expect(io.fetch).toHaveBeenNthCalledWith(
      2,
      'https://x.test/models/a.bin',
      expect.objectContaining({ redirect: 'manual' })
    );
    expect(redirect.cancel).toHaveBeenCalledOnce();
    expect(io.rename).toHaveBeenCalledOnce();
  });

  it('rejects an HTTPS redirect to HTTP before requesting or installing the payload', async () => {
    const redirect = redirectResponse('http://x.test/payload.bin');
    const io = makeIo({ fetch: vi.fn(async () => redirect.response) });

    await expectDownloadError(makeAsset(), 'VOICE_ASSET_FETCH_FAILED', io);

    expect(io.fetch).toHaveBeenCalledOnce();
    expect(redirect.cancel).toHaveBeenCalledOnce();
    expect(io.openWrite).not.toHaveBeenCalled();
    expect(io.rename).not.toHaveBeenCalled();
  });

  it('rejects a sixth redirect and never opens or installs a payload', async () => {
    const redirects = Array.from({ length: 6 }, (_, index) => redirectResponse(`/redirect-${index + 1}`));
    const io = makeIo({ fetch: vi.fn(async () => redirects.shift()!.response) });

    await expectDownloadError(makeAsset(), 'VOICE_ASSET_FETCH_FAILED', io);

    expect(io.fetch).toHaveBeenCalledTimes(6);
    expect(io.openWrite).not.toHaveBeenCalled();
    expect(io.rename).not.toHaveBeenCalled();
  });

  it.each([undefined, 'http://[invalid'])('rejects a redirect Location of %s', async (location) => {
    const redirect = redirectResponse(location);
    const io = makeIo({ fetch: vi.fn(async () => redirect.response) });

    await expectDownloadError(makeAsset(), 'VOICE_ASSET_FETCH_FAILED', io);

    expect(io.fetch).toHaveBeenCalledOnce();
    expect(redirect.cancel).toHaveBeenCalledOnce();
    expect(io.openWrite).not.toHaveBeenCalled();
  });

  it('rejects a non-HTTPS final response URL before opening a writer', async () => {
    const chunks = [encoder.encode('payload')];
    const response = responseFor(chunks, { url: 'http://x.test/payload.bin' });
    const cancel = vi.spyOn(response.body!, 'cancel');
    const io = makeIo({ fetch: vi.fn(async () => response) });

    await expectDownloadError(makeAsset(), 'VOICE_ASSET_FETCH_FAILED', io);

    expect(cancel).toHaveBeenCalledOnce();
    expect(io.openWrite).not.toHaveBeenCalled();
    expect(io.rename).not.toHaveBeenCalled();
  });

  it('rejects a declared Content-Length above maxBytes and removes temporary data', async () => {
    const chunks = [encoder.encode('abc')];
    const asset = makeAsset({ sha256: sha256Hex(chunks), maxBytes: 5 });
    const response = responseFor(chunks, { contentLength: 6 });
    const cancel = vi.spyOn(response.body!, 'cancel');
    const io = makeIo({ fetch: vi.fn(async () => response) });

    await expectDownloadError(asset, 'VOICE_ASSET_TOO_LARGE', io);

    expect(io.rename).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalledOnce();
    expect(io.openWrite).not.toHaveBeenCalled();
  });

  it('rejects a stream that crosses maxBytes without Content-Length and removes temporary data', async () => {
    const chunks = [encoder.encode('abc'), encoder.encode('def')];
    const asset = makeAsset({ sha256: sha256Hex(chunks), maxBytes: 5 });
    const cancel = vi.fn();
    const response = responseFor(chunks, {
      keepOpen: true,
      omitContentLength: true,
      onCancel: cancel,
    });
    const io = makeIo({ fetch: vi.fn(async () => response) });

    await expectDownloadError(asset, 'VOICE_ASSET_TOO_LARGE', io);

    expect(io.rename).not.toHaveBeenCalled();
    expect(io.unlink).toHaveBeenCalledWith('/c/a.bin.tmp');
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('cancels the response body for a non-ok response before opening a writer', async () => {
    const response = responseFor([encoder.encode('error')], {
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });
    const cancel = vi.spyOn(response.body!, 'cancel');
    const io = makeIo({ fetch: vi.fn(async () => response) });

    await expectDownloadError(makeAsset(), 'VOICE_ASSET_FETCH_FAILED', io);

    expect(cancel).toHaveBeenCalledOnce();
    expect(io.openWrite).not.toHaveBeenCalled();
    expect(io.rename).not.toHaveBeenCalled();
  });

  it('maps an aborted reader to CANCELLED and removes temporary data', async () => {
    const reader = {
      cancel: vi.fn(async () => undefined),
      read: vi.fn(async () => {
        throw new DOMException('The operation was aborted.', 'AbortError');
      }),
      releaseLock: vi.fn(),
    };
    const io = makeIo({ fetch: vi.fn(async () => responseWithReader(reader)) });

    await expectDownloadError(makeAsset(), 'VOICE_ASSET_CANCELLED', io);

    expect(reader.cancel).toHaveBeenCalledOnce();
    expect(reader.releaseLock).toHaveBeenCalledOnce();
    expect(io.unlink).toHaveBeenCalledWith('/c/a.bin.tmp');
    expect(io.rename).not.toHaveBeenCalled();
  });

  it('does not install when cancellation arrives as the final reader read completes', async () => {
    const chunk = encoder.encode('payload');
    let finishRead!: (result: ReadableStreamReadResult<Uint8Array>) => void;
    const reader = {
      cancel: vi.fn(async () => undefined),
      read: vi
        .fn()
        .mockResolvedValueOnce({ done: false, value: chunk })
        .mockImplementationOnce(
          () =>
            new Promise<ReadableStreamReadResult<Uint8Array>>((resolve) => {
              finishRead = resolve;
            })
        ),
      releaseLock: vi.fn(),
    };
    const io = makeIo({ fetch: vi.fn(async () => responseWithReader(reader)) });
    const controller = new AbortController();
    const download = VoiceAssetManager.download(
      makeAsset({ sha256: sha256Hex([chunk]) }),
      undefined,
      controller.signal,
      io
    ).catch((error) => error);
    await vi.waitFor(() => expect(reader.read).toHaveBeenCalledTimes(2));

    controller.abort();
    finishRead({ done: true, value: undefined });
    const error = await download;

    expect(error).toBeInstanceOf(VoiceAssetDownloadError);
    expect(error.code).toBe('VOICE_ASSET_CANCELLED');
    expect(io.rename).not.toHaveBeenCalled();
    expect(io.unlink).toHaveBeenCalledWith('/c/a.bin.tmp');
  });

  it('cleans temporary data when acquiring the response reader fails', async () => {
    const bodyCancel = vi.fn(async () => undefined);
    const response = {
      body: {
        cancel: bodyCancel,
        getReader: () => {
          throw new Error('reader unavailable');
        },
      },
      headers: new Headers(),
      ok: true,
      status: 200,
      statusText: 'OK',
      url: 'https://x.test/a',
    } as unknown as Response;
    const io = makeIo({ fetch: vi.fn(async () => response) });

    await expect(VoiceAssetManager.download(makeAsset(), undefined, undefined, io)).rejects.toThrow(
      'reader unavailable'
    );

    expect(bodyCancel).toHaveBeenCalledOnce();
    expect(io.openWrite).not.toHaveBeenCalled();
    expect(io.unlink).not.toHaveBeenCalled();
    expect(io.rename).not.toHaveBeenCalled();
  });

  it('cancels the reader and removes possible temp data when opening the writer fails', async () => {
    const reader = {
      cancel: vi.fn(async () => undefined),
      read: vi.fn(),
      releaseLock: vi.fn(),
    };
    const io = makeIo({
      fetch: vi.fn(async () => responseWithReader(reader)),
      openWrite: vi.fn(async () => {
        throw new Error('open failed');
      }),
    });

    await expect(VoiceAssetManager.download(makeAsset(), undefined, undefined, io)).rejects.toThrow('open failed');

    expect(reader.cancel).toHaveBeenCalledOnce();
    expect(reader.releaseLock).toHaveBeenCalledOnce();
    expect(io.unlink).toHaveBeenCalledWith('/c/a.bin.tmp');
    expect(io.rename).not.toHaveBeenCalled();
  });

  it.each(['write', 'progress'] as const)('cancels the reader and removes temp when %s fails', async (failure) => {
    const chunk = encoder.encode('payload');
    const reader = {
      cancel: vi.fn(async () => undefined),
      read: vi
        .fn()
        .mockResolvedValueOnce({ done: false, value: chunk })
        .mockResolvedValueOnce({ done: true, value: undefined }),
      releaseLock: vi.fn(),
    };
    const writer = {
      close: vi.fn(async () => undefined),
      write: vi.fn(async () => {
        if (failure === 'write') throw new Error('write failed');
      }),
      abort: vi.fn(async () => undefined),
    };
    const io = makeIo({
      fetch: vi.fn(async () => responseWithReader(reader)),
      openWrite: vi.fn(async () => writer),
    });
    const onProgress = (): void => {
      if (failure === 'progress') throw new Error('progress failed');
    };

    await expect(VoiceAssetManager.download(makeAsset(), onProgress, undefined, io)).rejects.toThrow(
      `${failure} failed`
    );

    expect(reader.cancel).toHaveBeenCalledOnce();
    expect(reader.releaseLock).toHaveBeenCalledOnce();
    expect(writer.close).not.toHaveBeenCalled();
    expect(writer.abort).toHaveBeenCalledOnce();
    expect(io.unlink).toHaveBeenCalledWith('/c/a.bin.tmp');
    expect(io.rename).not.toHaveBeenCalled();
  });

  it('removes temporary data when the final writer close fails', async () => {
    const chunks = [encoder.encode('payload')];
    const writer = {
      close: vi.fn(async () => {
        throw new Error('close failed');
      }),
      write: vi.fn(async () => undefined),
      abort: vi.fn(async () => undefined),
    };
    const io = makeIo({
      fetch: vi.fn(async () => responseFor(chunks)),
      openWrite: vi.fn(async () => writer),
    });

    await expect(
      VoiceAssetManager.download(makeAsset({ sha256: sha256Hex(chunks) }), undefined, undefined, io)
    ).rejects.toThrow('close failed');

    expect(io.unlink).toHaveBeenCalledWith('/c/a.bin.tmp');
    expect(io.rename).not.toHaveBeenCalled();
  });

  it('does not install when cancellation arrives while the writer is flushing', async () => {
    const chunks = [encoder.encode('payload')];
    let finishClose!: () => void;
    const writer = {
      write: vi.fn(async () => undefined),
      close: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            finishClose = resolve;
          })
      ),
      abort: vi.fn(async () => undefined),
    };
    const io = makeIo({
      fetch: vi.fn(async () => responseFor(chunks)),
      openWrite: vi.fn(async () => writer),
    });
    const controller = new AbortController();
    const download = VoiceAssetManager.download(
      makeAsset({ sha256: sha256Hex(chunks) }),
      undefined,
      controller.signal,
      io
    ).catch((error) => error);
    await vi.waitFor(() => expect(writer.close).toHaveBeenCalledOnce());

    controller.abort();
    finishClose();
    const error = await download;

    expect(error).toBeInstanceOf(VoiceAssetDownloadError);
    expect(error.code).toBe('VOICE_ASSET_CANCELLED');
    expect(io.rename).not.toHaveBeenCalled();
    expect(io.unlink).toHaveBeenCalledWith('/c/a.bin.tmp');
  });

  it('aborts a failed writer before unlinking its temporary file', async () => {
    const chunks = [encoder.encode('payload')];
    const lifecycle: string[] = [];
    let released = false;
    const writer = {
      write: vi.fn(async () => undefined),
      close: vi.fn(async () => {
        lifecycle.push('close');
        throw new Error('close failed');
      }),
      abort: vi.fn(async () => {
        lifecycle.push('abort');
        released = true;
      }),
    };
    const io = makeIo({
      fetch: vi.fn(async () => responseFor(chunks)),
      openWrite: vi.fn(async () => writer),
      unlink: vi.fn(async () => {
        lifecycle.push('unlink');
        if (!released) throw new Error('file is still open');
      }),
    });

    await expect(
      VoiceAssetManager.download(makeAsset({ sha256: sha256Hex(chunks) }), undefined, undefined, io)
    ).rejects.toThrow('close failed');

    expect(lifecycle).toEqual(['close', 'abort', 'unlink']);
    expect(writer.abort).toHaveBeenCalledOnce();
    expect(io.rename).not.toHaveBeenCalled();
  });

  it('surfaces a typed non-sensitive cleanup error when temporary unlink persists', async () => {
    const chunks = [encoder.encode('payload')];
    const primaryError = new Error('close failed');
    const writer = {
      write: vi.fn(async () => undefined),
      close: vi.fn(async () => {
        throw primaryError;
      }),
      abort: vi.fn(async () => undefined),
    };
    const io = makeIo({
      fetch: vi.fn(async () => responseFor(chunks)),
      openWrite: vi.fn(async () => writer),
      unlink: vi.fn(async () => {
        throw new Error('EACCES C:\\private\\voice.tmp');
      }),
    });

    const error = await VoiceAssetManager.download(
      makeAsset({ sha256: sha256Hex(chunks) }),
      undefined,
      undefined,
      io
    ).catch((caught) => caught);

    expect(error).toBeInstanceOf(VoiceAssetDownloadError);
    expect(error).toMatchObject({
      cause: primaryError,
      code: 'VOICE_ASSET_CLEANUP_FAILED',
      message: 'VOICE_ASSET_CLEANUP_FAILED: failed to remove temporary voice asset data',
    });
    expect(writer.abort).toHaveBeenCalledOnce();
    expect(io.unlink).toHaveBeenCalledOnce();
  });

  it('removes verified temporary data when the final rename fails', async () => {
    const chunks = [encoder.encode('payload')];
    const io = makeIo({
      fetch: vi.fn(async () => responseFor(chunks)),
      rename: vi.fn(async () => {
        throw new Error('rename failed');
      }),
    });

    await expect(
      VoiceAssetManager.download(makeAsset({ sha256: sha256Hex(chunks) }), undefined, undefined, io)
    ).rejects.toThrow('rename failed');

    expect(io.unlink).toHaveBeenCalledWith('/c/a.bin.tmp');
  });

  it('on SHA mismatch removes the .tmp and throws VOICE_ASSET_HASH_MISMATCH (no rename)', async () => {
    const chunks = [encoder.encode('payload')];
    const asset = makeAsset({ sha256: 'f'.repeat(64) });
    const io = makeIo({ fetch: vi.fn(async () => responseFor(chunks)) });

    const err = await VoiceAssetManager.download(asset, undefined, undefined, io).catch((e) => e);
    expect(err).toBeInstanceOf(VoiceAssetDownloadError);
    expect(err.code).toBe('VOICE_ASSET_HASH_MISMATCH');
    expect(io.rename).not.toHaveBeenCalled();
    expect(io.unlink).toHaveBeenCalledWith('/c/a.bin.tmp');
  });

  it('surfaces a fetch failure as VOICE_ASSET_OFFLINE and removes the .tmp', async () => {
    const asset = makeAsset();
    const io = makeIo({
      fetch: vi.fn(async () => {
        throw new Error('ENOTFOUND example.test');
      }),
    });
    const err = await VoiceAssetManager.download(asset, undefined, undefined, io).catch((e) => e);
    expect(err.code).toBe('VOICE_ASSET_OFFLINE');
    expect(io.openWrite).not.toHaveBeenCalled();
    expect(io.unlink).not.toHaveBeenCalled();
    expect(io.rename).not.toHaveBeenCalled();
  });

  it('surfaces a non-ok response as VOICE_ASSET_FETCH_FAILED', async () => {
    const asset = makeAsset();
    const io = makeIo({
      fetch: vi.fn(async () => new Response(null, { status: 503, statusText: 'Service Unavailable' })),
    });
    const err = await VoiceAssetManager.download(asset, undefined, undefined, io).catch((e) => e);
    expect(err.code).toBe('VOICE_ASSET_FETCH_FAILED');
    expect(io.openWrite).not.toHaveBeenCalled();
    expect(io.unlink).not.toHaveBeenCalled();
  });

  it('honours a pre-aborted AbortSignal with VOICE_ASSET_CANCELLED', async () => {
    const asset = makeAsset();
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

    const binResult = await VoiceAssetManager.download(
      {
        id: 'whisper-cpp-binary',
        url: 'https://x.test/whisper-cli',
        destPath: '/c/bin/whisper-cli',
        sha256: sha256Hex(binChunks),
        maxBytes: 1024,
      },
      undefined,
      undefined,
      binIo
    );
    const weightResult = await VoiceAssetManager.download(
      {
        id: 'whisper-ggml-base',
        url: 'https://x.test/ggml.bin',
        destPath: '/c/models/ggml.bin',
        sha256: sha256Hex(weightChunks),
        maxBytes: 1024,
      },
      undefined,
      undefined,
      weightIo
    );

    expect(binResult.bytesWritten).toBe(3);
    expect(weightResult.bytesWritten).toBe(12);
    expect(binIo.rename).toHaveBeenCalled();
    expect(weightIo.rename).toHaveBeenCalled();
  });

  it('uses the totalBytes hint when Content-Length is absent', async () => {
    const chunks = [encoder.encode('abc')];
    const asset = makeAsset({
      id: 'a',
      sha256: sha256Hex(chunks),
      totalBytes: 999,
    });
    const io = makeIo({ fetch: vi.fn(async () => responseFor(chunks, { omitContentLength: true })) });
    const progress: DownloadProgress[] = [];
    await VoiceAssetManager.download(asset, (p) => progress.push(p), undefined, io);
    expect(progress[0].totalBytes).toBe(999);
  });
});

describe('VoiceAssetManager.cancel', () => {
  it('rolls back its installed destination when cancel returns true during rename', async () => {
    const chunks = [encoder.encode('payload')];
    let finishRename!: () => void;
    const rename = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishRename = resolve;
        })
    );
    const io = makeIo({ fetch: vi.fn(async () => responseFor(chunks)), rename });
    const asset = makeAsset({ sha256: sha256Hex(chunks) });
    const download = VoiceAssetManager.download(asset, undefined, undefined, io).catch((error) => error);
    await vi.waitFor(() => expect(rename).toHaveBeenCalledOnce());

    const cancelIssued = VoiceAssetManager.cancel(asset.id);
    finishRename();
    const error = await download;

    expect(cancelIssued).toBe(true);
    expect(error).toBeInstanceOf(VoiceAssetDownloadError);
    expect(error.code).toBe('VOICE_ASSET_CANCELLED');
    expect(io.unlink).toHaveBeenCalledWith(asset.destPath);
  });

  it('rejects a second same-ID download before I/O and cancellation targets the owner', async () => {
    let ownerSignal: AbortSignal | undefined;
    const ownerAbort = new AbortController();
    const fetch = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      if (fetch.mock.calls.length > 1) return Promise.reject(new Error('unexpected second fetch'));
      ownerSignal = init?.signal ?? undefined;
      return new Promise<Response>((_resolve, reject) => {
        ownerSignal?.addEventListener(
          'abort',
          () => reject(new DOMException('The operation was aborted.', 'AbortError')),
          { once: true }
        );
      });
    });
    const io = makeIo({ fetch });
    const asset = makeAsset();
    const owner = VoiceAssetManager.download(asset, undefined, ownerAbort.signal, io).catch((error) => error);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());

    const contenderError = await VoiceAssetManager.download(asset, undefined, undefined, io).catch((error) => error);
    const cancelIssued = VoiceAssetManager.cancel(asset.id);
    if (!ownerSignal?.aborted) ownerAbort.abort();
    const ownerError = await owner;

    expect(contenderError).toBeInstanceOf(VoiceAssetDownloadError);
    expect(contenderError.code).toBe('VOICE_ASSET_IN_PROGRESS');
    expect(contenderError.message).toBe('VOICE_ASSET_IN_PROGRESS: download already in progress for whisper-base');
    expect(fetch).toHaveBeenCalledOnce();
    expect(io.openWrite).not.toHaveBeenCalled();
    expect(cancelIssued).toBe(true);
    expect(ownerSignal?.aborted).toBe(true);
    expect(ownerError.code).toBe('VOICE_ASSET_CANCELLED');
    expect(VoiceAssetManager.cancel(asset.id)).toBe(false);
  });

  it('returns false when no download with the given id is in flight', () => {
    expect(VoiceAssetManager.cancel('nonexistent')).toBe(false);
  });
});
