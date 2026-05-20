/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { VoiceAssetManager } from '@process/services/voice/VoiceAssetManager';

export function initVoiceAssetBridge(): void {
  ipcBridge.voiceAsset.download.provider(async (asset) => {
    return VoiceAssetManager.download(asset);
  });
  ipcBridge.voiceAsset.cancel.provider(async ({ assetId }) => ({
    cancelled: VoiceAssetManager.cancel(assetId),
  }));
}
