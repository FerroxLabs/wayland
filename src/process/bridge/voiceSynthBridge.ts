/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { synthesize } from '@process/services/voice/TextToSpeechService';
import { normalizeTextToSpeechConfig } from '@/common/types/ttsTypes';
import { ConfigStorage } from '@/common/config/storage';

const publicErrorCode = (
  error: unknown
):
  | 'TTS_KOKORO_LOCAL_UNAVAILABLE'
  | 'TTS_SYSTEM_NATIVE_UNAVAILABLE'
  | 'TTS_OPENAI_NOT_CONFIGURED'
  | 'TTS_OPENAI_AUTH_ERROR'
  | 'TTS_OPENAI_RATE_LIMITED'
  | 'TTS_OPENAI_REQUEST_FAILED'
  | 'TTS_SYNTHESIS_FAILED' => {
  if (error instanceof Error) {
    if (error.message.startsWith('TTS_KOKORO_LOCAL_UNAVAILABLE')) {
      return 'TTS_KOKORO_LOCAL_UNAVAILABLE';
    }
    if (error.message.startsWith('TTS_SYSTEM_NATIVE_UNAVAILABLE')) {
      return 'TTS_SYSTEM_NATIVE_UNAVAILABLE';
    }
    if (error.message.startsWith('TTS_OPENAI_NOT_CONFIGURED')) {
      return 'TTS_OPENAI_NOT_CONFIGURED';
    }
    if (error.message.startsWith('TTS_OPENAI_AUTH_ERROR')) {
      return 'TTS_OPENAI_AUTH_ERROR';
    }
    if (error.message.startsWith('TTS_OPENAI_RATE_LIMITED')) {
      return 'TTS_OPENAI_RATE_LIMITED';
    }
    if (error.message.startsWith('TTS_OPENAI_REQUEST_FAILED')) {
      return 'TTS_OPENAI_REQUEST_FAILED';
    }
  }
  return 'TTS_SYNTHESIS_FAILED';
};

export function initVoiceSynthBridge(): void {
  ipcBridge.voiceSynth.speak.provider(async ({ text }) => {
    try {
      const stored = await ConfigStorage.get('tools.textToSpeech');
      const config = normalizeTextToSpeechConfig(stored);
      const audio = await synthesize(text, config);
      return { ok: true, data: Array.from(audio.data), mimeType: audio.mimeType };
    } catch (error) {
      return { ok: false, errorCode: publicErrorCode(error) };
    }
  });

  ipcBridge.voiceSynth.stop.provider(async () => {
    // Stop is handled renderer-side via HTMLAudioElement; no main-process state to clear.
    return {};
  });
}
