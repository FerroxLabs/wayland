/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync } from 'node:fs';
import { ipcBridge } from '@/common';
import { VoiceAssetDownloadError, VoiceAssetManager } from '@process/services/voice/VoiceAssetManager';
import { getVoiceAsset } from '@process/services/voice/voiceAssetRegistry';
import { getVoiceModelsDir } from '@process/extensions/constants';
import { toAssetUrl } from '@process/extensions/protocol/assetProtocol';

export function initVoiceAssetBridge(): void {
  ipcBridge.voiceAsset.download.provider(async ({ id }) => {
    const asset = getVoiceAsset(id);
    if (!asset) {
      throw new VoiceAssetDownloadError('VOICE_ASSET_UNKNOWN', 'unknown voice asset');
    }
    return VoiceAssetManager.download(asset, (progress) => {
      ipcBridge.voiceAsset.downloadProgress.emit(progress);
    });
  });
  ipcBridge.voiceAsset.cancel.provider(async ({ assetId }) => ({
    cancelled: VoiceAssetManager.cancel(assetId),
  }));
  ipcBridge.voiceAsset.exists.provider(async ({ id }) => {
    const asset = getVoiceAsset(id);
    if (!asset) return { installed: false };
    return { installed: existsSync(asset.destPath) };
  });
  ipcBridge.voiceAsset.localModelBase.provider(async () => {
    // transformers.js fetches `${localModelPath}/<modelId>/<file>` - return
    // the wayland-asset:// URL for the bundled voice-models dir so the
    // renderer worker resolves e.g. wayland-asset://asset/<dir>/whisper-tiny/.
    return { url: toAssetUrl(getVoiceModelsDir()) };
  });
}
