/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { synthesize } from '@process/services/voice/TextToSpeechService';
import { normalizeTextToSpeechConfig } from '@/common/types/ttsTypes';
import { ConfigStorage } from '@/common/config/storage';

export function initVoiceSynthBridge(): void {
  ipcBridge.voiceSynth.speak.provider(async ({ text }) => {
    const stored = await ConfigStorage.get('tools.textToSpeech');
    const config = normalizeTextToSpeechConfig(stored);
    const audio = await synthesize(text, config);
    return { data: Array.from(audio.data), mimeType: audio.mimeType };
  });

  ipcBridge.voiceSynth.stop.provider(async () => {
    // Stop is handled renderer-side via HTMLAudioElement; no main-process state to clear.
    return {};
  });
}
