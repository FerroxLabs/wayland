/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync } from 'node:fs';
import { mainError } from '@process/utils/mainLogger';
import type { VoiceAssetErrorCode } from '@/common/types/voiceAsset';
import { ipcBridge } from '@/common';
import { VoiceAssetManager } from '@process/services/voice/VoiceAssetManager';
import { resolveVoiceAsset } from '@process/services/voice/voiceAssetRegistry';
import { getVoiceModelsDir } from '@process/extensions/constants';
import { toAssetUrl } from '@process/extensions/protocol/assetProtocol';

const VOICE_ASSET_LOG_TAG = '[VoiceAsset]';

const VOICE_ASSET_ERROR_CODES: readonly VoiceAssetErrorCode[] = [
  'VOICE_ASSET_OFFLINE',
  'VOICE_ASSET_FETCH_FAILED',
  'VOICE_ASSET_HASH_MISMATCH',
  'VOICE_ASSET_CANCELLED',
  'VOICE_ASSET_UNAVAILABLE',
  'VOICE_ASSET_FAILED',
];

export function initVoiceAssetBridge(): void {
  ipcBridge.voiceAsset.download.provider(async (asset) => {
    // Never let this reject. The transport cannot carry a rejection, so a
    // throw here leaves the renderer's download control pinned at
    // "downloading" forever with no error and no retry. Every failure leaves
    // through the `ok: false` return. See VoiceAssetDownloadOutcome.
    try {
      // Enrich renderer-supplied descriptor with server-known destPath +
      // pinned sha256 before handing it to the downloader. Empty fields on
      // the inbound asset get filled from the registry; non-empty fields are
      // preserved (test overrides + future extension assets).
      const resolved = resolveVoiceAsset(asset);
      if (!resolved.destPath || !resolved.url) {
        return {
          ok: false,
          errorCode: 'VOICE_ASSET_UNAVAILABLE',
          detail: `no download is registered for "${asset.id}" on ${process.platform}-${process.arch}`,
        };
      }
      // Stream per-chunk progress to the renderer so the download bar reflects
      // real bytes instead of a hardcoded 0%. Cancel is already wired through
      // the cancel provider + VoiceAssetManager's internal AbortController.
      const result = await VoiceAssetManager.download(resolved, (progress) => {
        ipcBridge.voiceAsset.downloadProgress.emit(progress);
      });
      return { ok: true, result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const [code] = message.split(':');
      const errorCode = VOICE_ASSET_ERROR_CODES.includes(code?.trim() as VoiceAssetErrorCode)
        ? (code.trim() as VoiceAssetErrorCode)
        : 'VOICE_ASSET_FAILED';
      mainError(VOICE_ASSET_LOG_TAG, 'Voice asset download failed', { assetId: asset.id, errorCode, message });
      return { ok: false, errorCode, detail: message.slice(message.indexOf(':') + 1).trim() || undefined };
    }
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
  ipcBridge.voiceAsset.localModelBase.provider(async () => {
    // transformers.js fetches `${localModelPath}/<modelId>/<file>` - return
    // the wayland-asset:// URL for the bundled voice-models dir so the
    // renderer worker resolves e.g. wayland-asset://asset/<dir>/whisper-tiny/.
    return { url: toAssetUrl(getVoiceModelsDir()) };
  });
}
