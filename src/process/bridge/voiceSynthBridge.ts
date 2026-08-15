/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { synthesize } from '@process/services/voice/TextToSpeechService';
import {
  normalizeTextToSpeechConfig,
  TEXT_TO_SPEECH_ERROR_CODES,
  type TextToSpeechErrorCode,
} from '@/common/types/ttsTypes';
import { ProcessConfig } from '@process/utils/initStorage';
import { hostedVoiceConsentGranted } from '@/common/types/voiceConsent';
import { mainError } from '@process/utils/mainLogger';

const TTS_BRIDGE_LOG_TAG = '[VoiceSynthBridge]';

/**
 * Narrows a thrown error to the declared vocabulary. The service throws
 * `CODE: message`, so the code is the leading segment; anything unrecognised
 * becomes `TTS_SYNTHESIS_FAILED` so a main-process stack or path can never
 * reach the renderer through this channel.
 */
const publicErrorCode = (error: unknown): TextToSpeechErrorCode => {
  const message = error instanceof Error ? error.message : String(error);
  const [code] = message.split(':');
  return TEXT_TO_SPEECH_ERROR_CODES.includes(code?.trim() as TextToSpeechErrorCode)
    ? (code.trim() as TextToSpeechErrorCode)
    : 'TTS_SYNTHESIS_FAILED';
};

/**
 * The service-authored half of `CODE: message`.
 *
 * Without this the renderer can only ever say "Voice test failed:
 * TTS_SYNTHESIS_FAILED", which is the same dead end as saying nothing. The
 * detail is composed by our own code (never a raw stack, never a path), and
 * the catch-all code is exactly the case that needs it most.
 */
const publicErrorDetail = (error: unknown): string | undefined => {
  const message = error instanceof Error ? error.message : String(error);
  const separator = message.indexOf(':');
  if (separator === -1) return message.trim() || undefined;
  return message.slice(separator + 1).trim() || undefined;
};

export function initVoiceSynthBridge(): void {
  ipcBridge.voiceSynth.speak.provider(async ({ text }) => {
    // Never let this reject. The IPC transport cannot carry a rejection: the
    // provider side has no `.catch`, so a throw here leaves the renderer's
    // `invoke()` pending forever - the button does nothing, says nothing, and
    // never recovers. Every failure must leave through the `ok: false` return.
    try {
      // Use ProcessConfig (the main-process, file-backed store) NOT ConfigStorage
      // (renderer-bridged). Both read the same file, but `ConfigStorage.get` in
      // MAIN is a bridge INVOKE: it emits `subscribe-agent.config.storage.get`
      // outward to the renderer, and the provider that answers that key lives in
      // MAIN (initStorage's `ConfigStorage.interceptor`), so nothing ever
      // replies. Because this read runs INSIDE a bridge provider, that is the
      // same reentrancy that hung the doctor MCP check (#273) and every
      // channel-triggered WCore turn - and a hang is exactly what a `.catch`
      // cannot rescue. A live CDP run on this branch caught the frame on the
      // wire: main sent `subscribe-agent.config.storage.get` 24ms after the
      // press, then 25 seconds of silence, no synthesizer activity, no `say`
      // process, no audio element - the reported dead "Test voice" button.
      const stored = await ProcessConfig.get('tools.textToSpeech');
      // The platform decides the DEFAULT provider (see normalizeTextToSpeechConfig).
      // Without it a Windows user who never opened Voice settings resolved to
      // macOS `say` and got a coded failure instead of a voice.
      const config = normalizeTextToSpeechConfig(stored, process.platform);
      // VOC-03: hosted TTS ('openai') POSTs the response text off-device.
      // Fail closed unless the user has acknowledged the disclosure for it.
      if (config.provider === 'openai') {
        const consent = await ProcessConfig.get('tools.voiceHostedConsent');
        if (!hostedVoiceConsentGranted('openai', consent)) {
          return { ok: false, errorCode: 'TTS_HOSTED_CONSENT_REQUIRED' };
        }
      }
      const audio = await synthesize(text, config);
      return { ok: true, data: Array.from(audio.data), mimeType: audio.mimeType };
    } catch (error) {
      const errorCode = publicErrorCode(error);
      // Logged main-side with the full message even though only the narrowed
      // code + detail cross the wire, so an unnamed TTS_SYNTHESIS_FAILED is
      // still diagnosable from the log.
      mainError(TTS_BRIDGE_LOG_TAG, 'Speech synthesis failed', {
        errorCode,
        message: error instanceof Error ? error.message : String(error),
      });
      return { ok: false, errorCode, detail: publicErrorDetail(error) };
    }
  });

  ipcBridge.voiceSynth.stop.provider(async () => {
    // Stop is handled renderer-side via HTMLAudioElement; no main-process state to clear.
    return {};
  });
}
