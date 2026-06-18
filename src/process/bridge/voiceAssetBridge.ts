/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, rmSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ipcBridge } from '@/common';
import { VoiceAssetManager } from '@process/services/voice/VoiceAssetManager';
import { resolveVoiceAsset } from '@process/services/voice/voiceAssetRegistry';
import { acquireBinary, getBinaryPath } from '@process/services/voice/voiceBinaryManifest';
import { getVoiceModelsDir } from '@process/extensions/constants';
import { toAssetUrl } from '@process/extensions/protocol/assetProtocol';

const execFileAsync = promisify(execFile);

export function initVoiceAssetBridge(): void {
  ipcBridge.voiceAsset.download.provider(async (asset) => {
    const resolved = resolveVoiceAsset(asset);
    return VoiceAssetManager.download(resolved, (progress) => {
      ipcBridge.voiceAsset.downloadProgress.emit(progress);
    });
  });
  ipcBridge.voiceAsset.cancel.provider(async ({ assetId }) => ({
    cancelled: VoiceAssetManager.cancel(assetId),
  }));
  ipcBridge.voiceAsset.exists.provider(async ({ id }) => {
    // Build a minimal descriptor; resolveVoiceAsset returns the canonical
    // destPath from the registry. If id is unknown the resolved path will
    // be empty and existsSync('') returns false - same outcome.
    const resolved = resolveVoiceAsset({ id, url: '', destPath: '', sha256: '' });
    if (!resolved.destPath) return { installed: false, destPath: null };
    return { installed: existsSync(resolved.destPath), destPath: resolved.destPath };
  });
  ipcBridge.voiceAsset.delete.provider(async ({ id }) => {
    const resolved = resolveVoiceAsset({ id, url: '', destPath: '', sha256: '' });
    if (!resolved.destPath || !existsSync(resolved.destPath)) return { deleted: false };
    try {
      rmSync(resolved.destPath, { force: true });
      return { deleted: true };
    } catch {
      return { deleted: false };
    }
  });

  ipcBridge.voiceAsset.uvStatus.provider(async ({ pkg }) => {
    const uv = getBinaryPath('uv-runtime');
    if (!uv || !existsSync(uv)) return { installed: false };
    // Use --offline so the check is instant: exits 0 if already cached, non-zero if not.
    // importlib.metadata.version() gives the installed version string without a separate import.
    try {
      const { stdout } = await execFileAsync(uv, [
        'run', '--offline', '--with', pkg, '--prerelease=allow', 'python', '-c',
        `import importlib.metadata as m; print(m.version('${pkg}'))`,
      ], { encoding: 'utf8', timeout: 10_000 });
      return { installed: true, version: stdout.trim() };
    } catch {
      return { installed: false };
    }
  });

  ipcBridge.voiceAsset.uvInstall.provider(async ({ pkg }) => {
    // Auto-acquire the uv binary if not already downloaded.
    let uv = getBinaryPath('uv-runtime');
    if (!uv || !existsSync(uv)) {
      try {
        uv = await acquireBinary('uv-runtime', undefined, (progress) => {
          ipcBridge.voiceAsset.downloadProgress.emit(progress);
        });
      } catch (err) {
        return { ok: false, error: `uv download failed: ${err instanceof Error ? err.message : String(err)}` };
      }
    }
    // Pre-warm the uv package cache using the same mechanism as synthesis (uv run --with).
    // This avoids `uv tool install` which exits non-zero for library packages without CLI entry points.
    const mod = pkg.replace(/-/g, '_');
    try {
      await execFileAsync(uv, ['run', '--with', pkg, '--prerelease=allow', 'python', '-c', `import ${mod}`], {
        encoding: 'utf8',
        timeout: 300_000,
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcBridge.voiceAsset.uvRemove.provider(async ({ pkg }) => {
    // Packages installed via `uv run --with` live in uv's global cache and cannot be
    // selectively removed without clearing the entire cache. Return ok so callers can
    // proceed; the model files themselves are deleted separately.
    void pkg;
    return { ok: true };
  });

  ipcBridge.voiceAsset.localModelBase.provider(async () => {
    // transformers.js fetches `${localModelPath}/<modelId>/<file>` - return
    // the wayland-asset:// URL for the bundled voice-models dir so the
    // renderer worker resolves e.g. wayland-asset://asset/<dir>/whisper-tiny/.
    return { url: toAssetUrl(getVoiceModelsDir()) };
  });
}
