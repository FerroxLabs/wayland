/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SpeechToTextConfig, SpeechToTextRequest, SpeechToTextResult } from '@/common/types/speech';
import type { SttEngine } from '../types';

/** Injectable service seam - tests substitute a fake; production uses SpeechToTextService. */
export type OpenAiSttService = {
  transcribeWithOpenAI(config: SpeechToTextConfig, request: SpeechToTextRequest): Promise<SpeechToTextResult>;
};

// The per-provider methods are `private` on SpeechToTextService (its public
// transcribe() resolves the provider from stored config itself, so it cannot
// force one). This adapter is the registry-side wrapper of exactly those
// methods - wrap without modifying the service - so cast once at the seam
// instead of widening the service's public surface. Phase 2 retires the class
// in favour of these engines. The import is lazy because the service pulls in
// initStorage, whose module-level platform calls must not run at registry
// registration time (engine registration is side-effect free).
const realService = (): OpenAiSttService => ({
  transcribeWithOpenAI: async (config, request) => {
    const { SpeechToTextService } = await import('@process/bridge/services/SpeechToTextService');
    return (SpeechToTextService as unknown as OpenAiSttService).transcribeWithOpenAI(config, request);
  },
});

// Minimal default config. The canonical DEFAULT_SPEECH_TO_TEXT_CONFIG lives in
// the renderer (ToolsModalContent.tsx) and must not be imported into main-process
// code, so the equivalent OpenAI defaults are defined inline. Phase 2 unifies
// STT config and removes this.
const defaultConfig = (): SpeechToTextConfig => ({
  enabled: true,
  provider: 'openai',
  openai: { apiKey: '', model: 'whisper-1' },
});

export const createOpenaiSttEngine = (
  service: OpenAiSttService = realService(),
  getConfig: () => SpeechToTextConfig = defaultConfig
): SttEngine => ({
  id: 'openai-whisper',
  local: false,
  streaming: false,
  // STT API keys live in the per-provider SpeechToTextConfig passed at
  // transcribe time, not the provider key store, so availability cannot be
  // checked here; a missing key surfaces as STT_OPENAI_NOT_CONFIGURED when
  // transcribe runs. Phase 2 unifies key handling.
  available: async () => ({ ok: true }),
  // The wrapped service is request/response - no abort support - so the
  // optional AbortSignal is intentionally not consumed. One final event.
  transcribe: async (audio, onEvent) => {
    const config: SpeechToTextConfig = { ...getConfig(), provider: 'openai' };
    const result = await service.transcribeWithOpenAI(config, {
      audioBuffer: audio.data,
      fileName: audio.fileName,
      mimeType: audio.mimeType,
    });
    onEvent({ text: result.text, final: true });
  },
});
