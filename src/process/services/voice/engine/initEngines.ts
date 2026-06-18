/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerSttEngine, registerTtsEngine } from './registry';
import { createKokoroEngine } from './tts/kokoroEngine';
import { createSystemNativeEngine } from './tts/systemNativeEngine';
import { createMlxAudioEngine } from './tts/mlxAudioEngine';
import { createPiperEngine } from './tts/piperEngine';
import { createWhisperLocalSttEngine } from './stt/whisperLocalEngine';
import { createOpenaiSttEngine } from './stt/openaiSttEngine';
import { createDeepgramSttEngine } from './stt/deepgramSttEngine';

let initialized = false;
export const initVoiceEngines = (): void => {
  if (initialized) return;
  initialized = true;
  registerTtsEngine(createKokoroEngine());
  registerTtsEngine(createMlxAudioEngine());
  registerTtsEngine(createPiperEngine());
  registerTtsEngine(createSystemNativeEngine());
  // STT registry port only - the speechToText.transcribe bridge keeps calling
  // SpeechToTextService directly until Phase 2 routes it through the registry.
  registerSttEngine(createWhisperLocalSttEngine());
  registerSttEngine(createOpenaiSttEngine());
  registerSttEngine(createDeepgramSttEngine());
};
