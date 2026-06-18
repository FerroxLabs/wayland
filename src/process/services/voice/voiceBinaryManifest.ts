/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPlatformServices } from '@/common/platform';
import { VoiceAssetManager } from '@process/services/voice/VoiceAssetManager';
import type { DownloadProgress } from '@/common/types/voiceAsset';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { chmod, unlink } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Manifest types
// ---------------------------------------------------------------------------

export type BinaryKind = 'whisper-cpp' | 'onnx-runtime' | 'kokoro-cli' | 'uv-runtime';

type PlatformArch = `${NodeJS.Platform}-${string}`;

type ManifestEntry = {
  url: string;
  sha256: string;
  /** Filename as it lands on disk after download (or after archive extraction). */
  filename: string;
  /**
   * Path of the desired file inside a `.tar.gz` archive (e.g.
   * `"uv-aarch64-apple-darwin/uv"`). When set, `acquireBinary` downloads the
   * archive to a temp file, extracts this entry (stripping one path component)
   * into `binDir`, then deletes the archive.
   */
  archiveEntry?: string;
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
  // TODO: populate URLs once Wayland hosts compiled kokoro-cli release binaries.
  // The CLI accepts: --model <path> --voice <name> --speed <float> --text <text>
  // and writes raw WAV bytes to stdout.
  'kokoro-cli': {
    'darwin-arm64': {
      url: '',
      sha256: '',
      filename: 'kokoro-cli',
    },
    'darwin-x64': {
      url: '',
      sha256: '',
      filename: 'kokoro-cli',
    },
    'win32-x64': {
      url: '',
      sha256: '',
      filename: 'kokoro-cli.exe',
    },
    'linux-x64': {
      url: '',
      sha256: '',
      filename: 'kokoro-cli',
    },
  },
  'uv-runtime': {
    'darwin-arm64': {
      url: 'https://github.com/astral-sh/uv/releases/download/0.7.8/uv-aarch64-apple-darwin.tar.gz',
      sha256: '',
      filename: 'uv',
      archiveEntry: 'uv-aarch64-apple-darwin/uv',
    },
    'darwin-x64': {
      url: 'https://github.com/astral-sh/uv/releases/download/0.7.8/uv-x86_64-apple-darwin.tar.gz',
      sha256: '',
      filename: 'uv',
      archiveEntry: 'uv-x86_64-apple-darwin/uv',
    },
    'linux-x64': {
      url: 'https://github.com/astral-sh/uv/releases/download/0.7.8/uv-x86_64-unknown-linux-gnu.tar.gz',
      sha256: '',
      filename: 'uv',
      archiveEntry: 'uv-x86_64-unknown-linux-gnu/uv',
    },
    'linux-arm64': {
      url: 'https://github.com/astral-sh/uv/releases/download/0.7.8/uv-aarch64-unknown-linux-gnu.tar.gz',
      sha256: '',
      filename: 'uv',
      archiveEntry: 'uv-aarch64-unknown-linux-gnu/uv',
    },
    'win32-x64': {
      url: 'https://github.com/astral-sh/uv/releases/download/0.7.8/uv-x86_64-pc-windows-msvc.zip',
      sha256: '',
      filename: 'uv.exe',
      archiveEntry: 'uv-x86_64-pc-windows-msvc/uv.exe',
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

/**
 * Returns the absolute path where a binary would be (or is) cached on this
 * machine, without triggering a download.  Returns `null` when the current
 * platform is unsupported for this kind.
 */
export const getBinaryPath = (kind: BinaryKind): string | null => {
  const entry = resolveBinaryAsset(kind);
  if (!entry) return null;
  return path.join(
    getPlatformServices().paths.getDataDir(),
    'voice',
    'bin',
    `${process.platform}-${process.arch}`,
    entry.filename,
  );
};

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
  onProgress?: (p: DownloadProgress) => void,
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
  const finalPath = path.join(binDir, entry.filename);
  const assetId = `${kind}-${process.platform}-${process.arch}`;

  if (entry.archiveEntry) {
    // Archive path: download to a temp file, extract the target entry, then clean up.
    if (existsSync(finalPath)) return finalPath;

    const isZip = entry.url.endsWith('.zip');
    const archivePath = `${finalPath}.download.${isZip ? 'zip' : 'tar.gz'}`;
    try {
      await VoiceAssetManager.download({
        id: assetId,
        url: entry.url,
        destPath: archivePath,
        sha256: entry.sha256,
      }, onProgress);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new BinaryAcquisitionError(kind, `download failed: ${msg}`);
    }

    try {
      // Extract exactly the named entry, stripping the leading directory component.
      // Windows 10+ tar.exe supports .zip without the -z flag; omit -z for zip archives.
      const tarFlags = isZip ? ['-xf'] : ['-xzf'];
      await execFileAsync('tar', [
        ...tarFlags, archivePath,
        '-C', binDir,
        '--strip-components=1',
        entry.archiveEntry,
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new BinaryAcquisitionError(kind, `extraction failed: ${msg}`);
    } finally {
      await unlink(archivePath).catch(() => {});
    }

    try {
      await io.chmodExec(finalPath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new BinaryAcquisitionError(kind, `chmod failed: ${msg}`);
    }
    if (process.platform === 'darwin') await io.removeQuarantine(finalPath);

    return finalPath;
  }

  // Non-archive path: direct download (existing behaviour).
  let result;
  try {
    result = await VoiceAssetManager.download({
      id: assetId,
      url: entry.url,
      destPath: finalPath,
      sha256: entry.sha256,
    }, onProgress);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new BinaryAcquisitionError(kind, `download failed: ${msg}`);
  }

  // Post-install steps only needed for a fresh download (not already cached).
  if (!result.cached) {
    try {
      await io.chmodExec(finalPath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new BinaryAcquisitionError(kind, `chmod failed: ${msg}`);
    }

    if (process.platform === 'darwin') {
      // Ignore errors - xattr removal is best-effort (attr may not be present).
      await io.removeQuarantine(finalPath);
    }
  }

  return finalPath;
};
