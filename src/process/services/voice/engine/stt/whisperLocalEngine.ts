/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SpeechToTextConfig, SpeechToTextRequest, SpeechToTextResult } from '@/common/types/speech';
import { getBinaryPath } from '@process/services/voice/voiceBinaryManifest';
import { resolveVoiceAsset } from '@process/services/voice/voiceAssetRegistry';
import { existsSync } from 'node:fs';
import type { SttEngine } from '../types';

/** Injectable service seam - tests substitute a fake; production uses SpeechToTextService. */
export type WhisperLocalSttService = {
  transcribeWithWhisperLocal(config: SpeechToTextConfig, request: SpeechToTextRequest): Promise<SpeechToTextResult>;
};

// The per-provider methods are `private` on SpeechToTextService (its public
// transcribe() resolves the provider from stored config itself, so it cannot
// force one). This adapter is the registry-side wrapper of exactly those
// methods - wrap without modifying the service - so cast once at the seam
// instead of widening the service's public surface. Phase 2 retires the class
// in favour of these engines. The import is lazy because the service pulls in
// initStorage, whose module-level platform calls must not run at registry
// registration time (engine registration is side-effect free).
const realService = (): WhisperLocalSttService => ({
  transcribeWithWhisperLocal: async (config, request) => {
    const { SpeechToTextService } = await import('@process/bridge/services/SpeechToTextService');
    return (SpeechToTextService as unknown as WhisperLocalSttService).transcribeWithWhisperLocal(config, request);
  },
});

// Minimal default config. The canonical DEFAULT_SPEECH_TO_TEXT_CONFIG lives in
// the renderer (ToolsModalContent.tsx) and must not be imported into main-process
// code, so the equivalent whisper-local defaults are defined inline. Phase 2
// unifies STT config and removes this.
const defaultConfig = (): SpeechToTextConfig => ({
  enabled: true,
  provider: 'whisper-local',
  whisperLocal: { model: 'base' },
});

export const createWhisperLocalSttEngine = (
  service: WhisperLocalSttService = realService(),
  getConfig: () => SpeechToTextConfig = defaultConfig
): SttEngine => ({
  id: 'whisper-local',
  local: true,
  streaming: false,
  available: async () => {
    const binary = getBinaryPath('whisper-cpp');
    if (!binary || !existsSync(binary)) {
      return { ok: false, reason: 'whisper.cpp binary not installed' };
    }
    const model = getConfig().whisperLocal?.model || 'base';
    // Route through voiceAssetRegistry so the model path matches what the
    // Settings "Download Model" button wrote (same lookup WhisperLocal uses).
    const asset = resolveVoiceAsset({ id: `whisper-ggml-${model}`, url: '', destPath: '', sha256: '' });
    if (!asset.destPath || !existsSync(asset.destPath)) {
      return { ok: false, reason: `whisper model "${model}" not installed` };
    }
    return { ok: true };
  },
  // The wrapped service is request/response - no abort support - so the
  // optional AbortSignal is intentionally not consumed. One final event.
  transcribe: async (audio, onEvent) => {
    const config: SpeechToTextConfig = { ...getConfig(), provider: 'whisper-local' };
    const result = await service.transcribeWithWhisperLocal(config, {
      audioBuffer: audio.data,
      fileName: audio.fileName,
      mimeType: audio.mimeType,
    });
    onEvent({ text: result.text, final: true });
  },
});
