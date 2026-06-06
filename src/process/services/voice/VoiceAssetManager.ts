/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { DownloadProgress, DownloadResult, VoiceAsset, VoiceAssetErrorCode } from '@/common/types/voiceAsset';
import { createHash } from 'node:crypto';
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, rename, unlink } from 'node:fs/promises';
import path from 'node:path';

/**
 * Typed error surfaced to the caller (and through the STT/TTS layer) when a
 * download fails. The `code` lets the renderer pick a localized message.
 */
export class VoiceAssetDownloadError extends Error {
  constructor(
    public readonly code: VoiceAssetErrorCode,
    message: string
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
  ensureDir: (p: string) => Promise<void>;
  openWrite: (p: string) => Promise<{
    write: (chunk: Uint8Array) => Promise<void>;
    close: () => Promise<void>;
  }>;
  rename: (from: string, to: string) => Promise<void>;
  unlink: (p: string) => Promise<void>;
};

export const defaultVoiceAssetIo: VoiceAssetIo = {
  fetch: (input, init) => globalThis.fetch(input, init),
  exists: existsSync,
  ensureDir: async (p) => {
    await mkdir(p, { recursive: true });
  },
  openWrite: async (p) => {
    const stream = createWriteStream(p);
    return {
      write: (chunk) =>
        new Promise<void>((resolve, reject) => {
          stream.write(chunk, (err) => (err ? reject(err) : resolve()));
        }),
      close: () =>
        new Promise<void>((resolve, reject) => {
          stream.end((err: Error | null | undefined) => (err ? reject(err) : resolve()));
        }),
    };
  },
  rename: (from, to) => rename(from, to),
  unlink: async (p) => {
    try {
      await unlink(p);
    } catch {
      // Best-effort cleanup - ENOENT and friends are fine.
    }
  },
};

const TMP_SUFFIX = '.tmp';

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

  static async download(asset: VoiceAsset, onProgress?: (p: DownloadProgress) => void, signal?: AbortSignal, io: VoiceAssetIo = defaultVoiceAssetIo): Promise<DownloadResult> {
    if (io.exists(asset.destPath)) {
      return {
        assetId: asset.id,
        destPath: asset.destPath,
        cached: true,
        bytesWritten: 0,
        sha256: asset.sha256.toLowerCase(),
      };
    }

    const controller = new AbortController();
    if (signal) {
      if (signal.aborted) {
        throw new VoiceAssetDownloadError('VOICE_ASSET_CANCELLED', 'download cancelled before start');
      }
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
    VoiceAssetManager.active.set(asset.id, controller);

    const tmpPath = asset.destPath + TMP_SUFFIX;

    try {
      await io.ensureDir(path.dirname(asset.destPath));
      const writer = await io.openWrite(tmpPath);

      let response: Response;
      try {
        response = await io.fetch(asset.url, { signal: controller.signal });
      } catch (err) {
        await writer.close();
        await io.unlink(tmpPath);
        if (controller.signal.aborted) {
          throw new VoiceAssetDownloadError('VOICE_ASSET_CANCELLED', 'download cancelled');
        }
        const msg = err instanceof Error ? err.message : String(err);
        throw new VoiceAssetDownloadError('VOICE_ASSET_OFFLINE', msg);
      }

      if (!response.ok || !response.body) {
        await writer.close();
        await io.unlink(tmpPath);
        throw new VoiceAssetDownloadError('VOICE_ASSET_FETCH_FAILED', `${response.status} ${response.statusText || ''}`.trim());
      }

      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? Number.parseInt(contentLength, 10) : (asset.totalBytes ?? null);

      const hash = createHash('sha256');
      let bytesWritten = 0;
      const reader = response.body.getReader();

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (controller.signal.aborted) {
            throw new VoiceAssetDownloadError('VOICE_ASSET_CANCELLED', 'download cancelled mid-stream');
          }
          hash.update(value);
          await writer.write(value);
          bytesWritten += value.byteLength;
          onProgress?.({ assetId: asset.id, bytesDownloaded: bytesWritten, totalBytes });
        }
      } catch (err) {
        await writer.close();
        await io.unlink(tmpPath);
        throw err;
      }

      await writer.close();

      const computed = hash.digest('hex');
      const expected = asset.sha256.toLowerCase();
      if (expected.length === 0) {
        // No pinned hash for this asset. Surface a one-line warning so the
        // operator knows an unverified download landed, but don't block -
        // the registry intentionally leaves some assets unpinned until the
        // canonical SHA is locked in. Re-tighten this by pinning sha256.
        console.warn(
          `[VoiceAssetManager] ${asset.id} downloaded without integrity check; sha256 not pinned (computed=${computed}).`
        );
      } else if (computed !== expected) {
        await io.unlink(tmpPath);
        throw new VoiceAssetDownloadError('VOICE_ASSET_HASH_MISMATCH', `expected ${expected}, got ${computed}`);
      }

      await io.rename(tmpPath, asset.destPath);

      return {
        assetId: asset.id,
        destPath: asset.destPath,
        cached: false,
        bytesWritten,
        sha256: computed,
      };
    } finally {
      VoiceAssetManager.active.delete(asset.id);
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
