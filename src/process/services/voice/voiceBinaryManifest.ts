/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPlatformServices } from '@/common/platform';
import { VoiceAssetManager } from '@process/services/voice/VoiceAssetManager';
import { execFile } from 'node:child_process';
import { chmod } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Manifest types
// ---------------------------------------------------------------------------

export type BinaryKind = 'whisper-cpp' | 'onnx-runtime';

type PlatformArch = `${NodeJS.Platform}-${string}`;

type ManifestEntry = {
  url: string;
  sha256: string;
  /** Filename as it lands on disk after download. */
  filename: string;
};

type KindManifest = Partial<Record<PlatformArch, ManifestEntry>>;

// ---------------------------------------------------------------------------
// Manifest table
// ---------------------------------------------------------------------------

const MANIFEST: Record<BinaryKind, KindManifest> = {
  'whisper-cpp': {
    'darwin-arm64': {
      url: 'https://github.com/ggerganov/whisper.cpp/releases/download/v1.7.1/whisper-cli-darwin-arm64',
      sha256: '',
      filename: 'whisper-cli',
    },
    'darwin-x64': {
      url: 'https://github.com/ggerganov/whisper.cpp/releases/download/v1.7.1/whisper-cli-darwin-x64',
      sha256: '',
      filename: 'whisper-cli',
    },
    'win32-x64': {
      url: 'https://github.com/ggerganov/whisper.cpp/releases/download/v1.7.1/whisper-cli-win32-x64.exe',
      sha256: '',
      filename: 'whisper-cli.exe',
    },
    'linux-x64': {
      url: 'https://github.com/ggerganov/whisper.cpp/releases/download/v1.7.1/whisper-cli-linux-x64',
      sha256: '',
      filename: 'whisper-cli',
    },
  },
  'onnx-runtime': {
    'darwin-arm64': {
      url: 'https://github.com/microsoft/onnxruntime/releases/download/v1.18.0/onnxruntime-darwin-arm64',
      sha256: '',
      filename: 'onnxruntime',
    },
    'darwin-x64': {
      url: 'https://github.com/microsoft/onnxruntime/releases/download/v1.18.0/onnxruntime-darwin-x64',
      sha256: '',
      filename: 'onnxruntime',
    },
    'win32-x64': {
      url: 'https://github.com/microsoft/onnxruntime/releases/download/v1.18.0/onnxruntime-win32-x64.exe',
      sha256: '',
      filename: 'onnxruntime.exe',
    },
    'linux-x64': {
      url: 'https://github.com/microsoft/onnxruntime/releases/download/v1.18.0/onnxruntime-linux-x64',
      sha256: '',
      filename: 'onnxruntime',
    },
  },
};

// ---------------------------------------------------------------------------
// Manifest lookup
// ---------------------------------------------------------------------------

/**
 * Internal helper - exposed so tests can call it with an arbitrary
 * platform/arch pair without needing to mock `process`.
 */
export const pickManifestEntry = (
  kind: BinaryKind,
  platform: string,
  arch: string,
): ManifestEntry | null => {
  const key: PlatformArch = `${platform}-${arch}` as PlatformArch;
  return MANIFEST[kind][key] ?? null;
};

/**
 * Returns the manifest entry for the current `process.platform` / `process.arch`,
 * or `null` when the combination is unsupported.
 */
export const resolveBinaryAsset = (kind: BinaryKind): ManifestEntry | null =>
  pickManifestEntry(kind, process.platform, process.arch);

// ---------------------------------------------------------------------------
// Typed acquisition error
// ---------------------------------------------------------------------------

export class BinaryAcquisitionError extends Error {
  constructor(
    public readonly kind: BinaryKind,
    message: string,
  ) {
    super(`BinaryAcquisitionError(${kind}): ${message}`);
    this.name = 'BinaryAcquisitionError';
  }
}

// ---------------------------------------------------------------------------
// Injectable I/O seam for the post-download platform steps
// ---------------------------------------------------------------------------

export type BinaryPostInstallIo = {
  /** Make a file executable (chmod +x). */
  chmodExec: (filePath: string) => Promise<void>;
  /**
   * Remove the macOS quarantine xattr. Should silently ignore the case where
   * the attribute is not present.
   */
  removeQuarantine: (filePath: string) => Promise<void>;
};

export const defaultBinaryPostInstallIo: BinaryPostInstallIo = {
  chmodExec: async (filePath) => {
    await chmod(filePath, 0o755);
  },
  removeQuarantine: async (filePath) => {
    try {
      await execFileAsync('xattr', ['-d', 'com.apple.quarantine', filePath]);
    } catch {
      // Attribute not present or xattr not available - both are fine.
    }
  },
};

// ---------------------------------------------------------------------------
// acquireBinary
// ---------------------------------------------------------------------------

/**
 * Resolves, downloads (if needed), and post-installs a voice native binary.
 *
 * - Looks up the manifest entry for the current platform/arch.
 * - Computes the cache path under `<userData>/voice/bin/<platform>-<arch>/`
 *   so the runtime + the Settings "Download Model" UI agree on a single
 *   tree (previous versions split between userData/voice/ and ~/.wayland/).
 * - Delegates the atomic download (with SHA-256 verification) to VoiceAssetManager.
 * - After a fresh download: sets the executable bit and removes the macOS quarantine xattr.
 * - Returns the absolute path to the ready binary.
 * - Throws `BinaryAcquisitionError` on any failure so callers can surface a typed error.
 *
 * The `io` parameter is injectable so unit tests never hit the network or filesystem.
 */
export const acquireBinary = async (
  kind: BinaryKind,
  io: BinaryPostInstallIo = defaultBinaryPostInstallIo,
): Promise<string> => {
  const entry = resolveBinaryAsset(kind);
  if (!entry) {
    throw new BinaryAcquisitionError(
      kind,
      `unsupported platform: ${process.platform}-${process.arch}`,
    );
  }

  const binDir = path.join(
    getPlatformServices().paths.getDataDir(),
    'voice',
    'bin',
    `${process.platform}-${process.arch}`,
  );
  const destPath = path.join(binDir, entry.filename);
  const assetId = `${kind}-${process.platform}-${process.arch}`;

  let result;
  try {
    result = await VoiceAssetManager.download({
      id: assetId,
      url: entry.url,
      destPath,
      sha256: entry.sha256,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new BinaryAcquisitionError(kind, `download failed: ${msg}`);
  }

  // Post-install steps only needed for a fresh download (not already cached).
  if (!result.cached) {
    try {
      await io.chmodExec(destPath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new BinaryAcquisitionError(kind, `chmod failed: ${msg}`);
    }

    if (process.platform === 'darwin') {
      // Ignore errors - xattr removal is best-effort (attr may not be present).
      await io.removeQuarantine(destPath);
    }
  }

  return destPath;
};
