/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { DownloadProgress, DownloadResult, VoiceAsset, VoiceAssetErrorCode } from '@/common/types/voiceAsset';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync } from 'node:fs';
import { mkdir, rename, unlink } from 'node:fs/promises';
import path from 'node:path';

/**
 * Typed error surfaced to the caller (and through the STT/TTS layer) when a
 * download fails. The `code` lets the renderer pick a localized message.
 */
export class VoiceAssetDownloadError extends Error {
  constructor(
    public readonly code: VoiceAssetErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(`${code}: ${message}`);
    this.name = 'VoiceAssetDownloadError';
  }
}

/**
 * Injectable I/O seam. Production wires this to node:fs and globalThis.fetch.
 * Unit tests substitute fakes so the network and the filesystem stay out.
 */
export type VoiceAssetIo = {
  fetch: typeof globalThis.fetch;
  exists: (p: string) => boolean;
  hashFile: (p: string) => Promise<string>;
  ensureDir: (p: string) => Promise<void>;
  openWrite: (p: string) => Promise<{
    write: (chunk: Uint8Array) => Promise<void>;
    close: () => Promise<void>;
    abort: () => Promise<void>;
  }>;
  rename: (from: string, to: string) => Promise<void>;
  unlink: (p: string) => Promise<void>;
};

export const defaultVoiceAssetIo: VoiceAssetIo = {
  fetch: (input, init) => globalThis.fetch(input, init),
  exists: existsSync,
  hashFile: async (p) => {
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(p)) {
      hash.update(chunk);
    }
    return hash.digest('hex');
  },
  ensureDir: async (p) => {
    await mkdir(p, { recursive: true });
  },
  openWrite: async (p) => {
    const stream = createWriteStream(p);
    const streamClosed = new Promise<void>((resolve) => {
      stream.once('close', resolve);
    });
    let abortPromise: Promise<void> | undefined;

    // Write/close callbacks receive the operational failure. This listener
    // prevents the stream's matching error event from becoming unhandled while
    // cleanup destroys the handle and waits for its close event.
    stream.on('error', () => undefined);

    return {
      write: (chunk) =>
        new Promise<void>((resolve, reject) => {
          stream.write(chunk, (err) => (err ? reject(err) : resolve()));
        }),
      close: () =>
        new Promise<void>((resolve, reject) => {
          stream.end((err: Error | null | undefined) => (err ? reject(err) : resolve()));
        }),
      abort: () => {
        abortPromise ??= (async () => {
          if (!stream.destroyed) stream.destroy();
          await streamClosed;
        })();
        return abortPromise;
      },
    };
  },
  rename: (from, to) => rename(from, to),
  unlink: async (p) => {
    try {
      await unlink(p);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return;
      throw error;
    }
  },
};

const TMP_SUFFIX = '.tmp';
const SHA256_HEX = /^[0-9a-f]{64}$/;
const MAX_REDIRECTS = 5;
const REDIRECT_STATUSES: ReadonlySet<number> = new Set([301, 302, 303, 307, 308]);

const invalidDescriptor = (): VoiceAssetDownloadError =>
  new VoiceAssetDownloadError('VOICE_ASSET_INVALID_DESCRIPTOR', 'invalid voice asset descriptor');

const validateDescriptor = (asset: VoiceAsset): void => {
  if (
    !asset ||
    typeof asset.url !== 'string' ||
    typeof asset.destPath !== 'string' ||
    typeof asset.sha256 !== 'string'
  ) {
    throw invalidDescriptor();
  }

  let url: URL;
  try {
    url = new URL(asset.url);
  } catch {
    throw invalidDescriptor();
  }

  if (
    url.protocol !== 'https:' ||
    !path.isAbsolute(asset.destPath) ||
    !SHA256_HEX.test(asset.sha256) ||
    !Number.isSafeInteger(asset.maxBytes) ||
    asset.maxBytes <= 0
  ) {
    throw invalidDescriptor();
  }
};

const fetchFailed = (message: string): VoiceAssetDownloadError =>
  new VoiceAssetDownloadError('VOICE_ASSET_FETCH_FAILED', message);

const isAbortError = (error: unknown): boolean => error instanceof Error && error.name === 'AbortError';

const cancelResponseBody = async (response: Response): Promise<void> => {
  try {
    await response.body?.cancel();
  } catch {
    // The body may already be locked, errored, or cancelled.
  }
};

const validateResponseUrl = async (response: Response): Promise<void> => {
  if (response.redirected) {
    await cancelResponseBody(response);
    throw fetchFailed('automatic redirects are not allowed');
  }
  if (!response.url) return;

  let responseUrl: URL;
  try {
    responseUrl = new URL(response.url);
  } catch {
    await cancelResponseBody(response);
    throw fetchFailed('response URL is invalid');
  }
  if (responseUrl.protocol !== 'https:') {
    await cancelResponseBody(response);
    throw fetchFailed('response URL must use HTTPS');
  }
};

const fetchWithHttpsRedirects = async (
  initialUrl: string,
  controller: AbortController,
  io: VoiceAssetIo
): Promise<Response> => {
  let currentUrl = initialUrl;
  let redirectCount = 0;

  while (true) {
    let response: Response;
    try {
      response = await io.fetch(currentUrl, {
        redirect: 'manual',
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted || isAbortError(error)) {
        throw new VoiceAssetDownloadError('VOICE_ASSET_CANCELLED', 'download cancelled');
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new VoiceAssetDownloadError('VOICE_ASSET_OFFLINE', message);
    }

    await validateResponseUrl(response);
    if (!REDIRECT_STATUSES.has(response.status)) return response;

    await cancelResponseBody(response);
    if (redirectCount >= MAX_REDIRECTS) {
      throw fetchFailed(`too many redirects (maximum ${MAX_REDIRECTS})`);
    }

    const location = response.headers.get('location');
    if (!location) throw fetchFailed('redirect response is missing Location');

    let nextUrl: URL;
    try {
      nextUrl = new URL(location, currentUrl);
    } catch {
      throw fetchFailed('redirect Location is invalid');
    }
    if (nextUrl.protocol !== 'https:') {
      throw fetchFailed('redirect Location must use HTTPS');
    }

    currentUrl = nextUrl.href;
    redirectCount += 1;
  }
};

/**
 * Atomic, content-addressed download of voice runtime assets.
 *
 * The flow is deliberately conservative: stream the URL into `<dest>.tmp`
 * while accumulating a SHA-256, compare against the pinned hash on completion,
 * and atomically rename only on a match. Any other outcome unlinks the `.tmp`
 * - so a half-written or wrong-hash file never poses as a valid asset.
 *
 * Tasks D2 (native binary acquisition) and D5/D6 (model weight downloads) both
 * call this same primitive.
 */
export class VoiceAssetManager {
  private static readonly active = new Map<string, AbortController>();

  static async download(
    asset: VoiceAsset,
    onProgress?: (p: DownloadProgress) => void,
    signal?: AbortSignal,
    io: VoiceAssetIo = defaultVoiceAssetIo
  ): Promise<DownloadResult> {
    validateDescriptor(asset);

    if (signal?.aborted) {
      throw new VoiceAssetDownloadError('VOICE_ASSET_CANCELLED', 'download cancelled before start');
    }
    if (VoiceAssetManager.active.has(asset.id)) {
      throw new VoiceAssetDownloadError('VOICE_ASSET_IN_PROGRESS', `download already in progress for ${asset.id}`);
    }

    const controller = new AbortController();
    const abortFromCaller = (): void => controller.abort(signal?.reason);
    signal?.addEventListener('abort', abortFromCaller, { once: true });
    VoiceAssetManager.active.set(asset.id, controller);

    const tmpPath = asset.destPath + TMP_SUFFIX;
    let response: Response | undefined;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    let readerReleased = false;
    let responseConsumed = false;
    let writer: Awaited<ReturnType<VoiceAssetIo['openWrite']>> | undefined;
    let writerClosed = false;
    let writerAborted = false;
    let tempMayExist = false;
    let installedByThisAttempt = false;

    const throwIfAborted = (): void => {
      if (controller.signal.aborted) {
        throw new VoiceAssetDownloadError('VOICE_ASSET_CANCELLED', 'download cancelled');
      }
    };

    const releaseReader = (): void => {
      if (!reader || readerReleased) return;
      readerReleased = true;
      try {
        reader.releaseLock();
      } catch {
        // A failed/closed reader can already have released its lock.
      }
    };

    const cancelReader = async (): Promise<void> => {
      if (!reader || readerReleased) return;
      try {
        await reader.cancel();
      } catch {
        // Cancellation is best-effort; temp cleanup must still continue.
      } finally {
        releaseReader();
      }
    };

    const closeWriter = async (): Promise<void> => {
      if (!writer || writerClosed) return;
      await writer.close();
      writerClosed = true;
    };

    const abortWriter = async (): Promise<void> => {
      if (!writer || writerClosed || writerAborted) return;
      await writer.abort();
      writerAborted = true;
    };

    const cleanupFailure = (message: string, primaryError: unknown): VoiceAssetDownloadError =>
      new VoiceAssetDownloadError('VOICE_ASSET_CLEANUP_FAILED', message, primaryError);

    const cleanup = async (primaryError: unknown): Promise<void> => {
      if (reader && !readerReleased) {
        await cancelReader();
      } else if (response && !responseConsumed) {
        await cancelResponseBody(response);
        responseConsumed = true;
      }

      let writerAbortError: unknown;
      try {
        await abortWriter();
      } catch (error) {
        writerAbortError = error;
      }

      if (tempMayExist) {
        tempMayExist = false;
        try {
          await io.unlink(tmpPath);
        } catch {
          throw cleanupFailure('failed to remove temporary voice asset data', primaryError);
        }
      }

      if (installedByThisAttempt) {
        installedByThisAttempt = false;
        try {
          await io.unlink(asset.destPath);
        } catch {
          throw cleanupFailure('failed to remove installed voice asset data', primaryError);
        }
      }

      if (writerAbortError) {
        throw cleanupFailure('failed to release temporary voice asset data', primaryError);
      }
    };

    try {
      if (io.exists(asset.destPath)) {
        const cachedHash = await io.hashFile(asset.destPath);
        throwIfAborted();
        if (cachedHash === asset.sha256) {
          return {
            assetId: asset.id,
            destPath: asset.destPath,
            cached: true,
            bytesWritten: 0,
            sha256: asset.sha256,
          };
        }
        await io.unlink(asset.destPath);
        throwIfAborted();
      }

      response = await fetchWithHttpsRedirects(asset.url, controller, io);
      throwIfAborted();

      if (!response.ok || !response.body) {
        throw fetchFailed(`${response.status} ${response.statusText || ''}`.trim());
      }

      const contentLength = response.headers.get('content-length');
      const parsedContentLength = contentLength === null ? null : Number(contentLength);
      const hasFiniteContentLength = parsedContentLength !== null && Number.isFinite(parsedContentLength);
      if (hasFiniteContentLength && parsedContentLength > asset.maxBytes) {
        throw new VoiceAssetDownloadError('VOICE_ASSET_TOO_LARGE', 'voice asset exceeds maximum size');
      }
      const totalBytes = hasFiniteContentLength ? parsedContentLength : (asset.totalBytes ?? null);

      const hash = createHash('sha256');
      let bytesWritten = 0;
      reader = response.body.getReader();

      await io.ensureDir(path.dirname(asset.destPath));
      throwIfAborted();
      tempMayExist = true;
      writer = await io.openWrite(tmpPath);
      throwIfAborted();

      while (true) {
        if (controller.signal.aborted) {
          throw new VoiceAssetDownloadError('VOICE_ASSET_CANCELLED', 'download cancelled mid-stream');
        }
        const { value, done } = await reader.read();
        throwIfAborted();
        if (done) {
          responseConsumed = true;
          releaseReader();
          break;
        }
        const nextBytesWritten = bytesWritten + value.byteLength;
        if (nextBytesWritten > asset.maxBytes) {
          throw new VoiceAssetDownloadError('VOICE_ASSET_TOO_LARGE', 'voice asset exceeds maximum size');
        }
        hash.update(value);
        await writer.write(value);
        throwIfAborted();
        bytesWritten = nextBytesWritten;
        onProgress?.({ assetId: asset.id, bytesDownloaded: bytesWritten, totalBytes });
      }

      await closeWriter();
      throwIfAborted();

      const computed = hash.digest('hex');
      const expected = asset.sha256;
      if (computed !== expected) {
        throw new VoiceAssetDownloadError('VOICE_ASSET_HASH_MISMATCH', `expected ${expected}, got ${computed}`);
      }

      throwIfAborted();
      await io.rename(tmpPath, asset.destPath);
      tempMayExist = false;
      installedByThisAttempt = true;
      throwIfAborted();

      return {
        assetId: asset.id,
        destPath: asset.destPath,
        cached: false,
        bytesWritten,
        sha256: computed,
      };
    } catch (error) {
      await cleanup(error);
      if (error instanceof VoiceAssetDownloadError) throw error;
      if (controller.signal.aborted || isAbortError(error)) {
        throw new VoiceAssetDownloadError('VOICE_ASSET_CANCELLED', 'download cancelled');
      }
      throw error;
    } finally {
      signal?.removeEventListener('abort', abortFromCaller);
      if (VoiceAssetManager.active.get(asset.id) === controller) {
        VoiceAssetManager.active.delete(asset.id);
      }
    }
  }

  /** Cancel an in-flight download by id. Returns true if a cancel was issued. */
  static cancel(assetId: string): boolean {
    const controller = VoiceAssetManager.active.get(assetId);
    if (!controller) return false;
    controller.abort();
    return true;
  }
}
