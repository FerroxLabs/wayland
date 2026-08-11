/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import { ipcBridge } from '@/common';
import type { SpeechToTextErrorCode } from '@/common/types/speech';
import { SpeechToTextService } from './services/SpeechToTextService';

const PUBLIC_ERROR_CODES: readonly SpeechToTextErrorCode[] = [
  'STT_DISABLED',
  'STT_OPENAI_NOT_CONFIGURED',
  'STT_DEEPGRAM_NOT_CONFIGURED',
  'STT_FLUX_NOT_CONFIGURED',
  'STT_FLUX_AUTH_ERROR',
  'STT_FLUX_PREMIUM_LOCKED',
  'STT_HOSTED_CONSENT_REQUIRED',
  'STT_FILE_TOO_LARGE',
  'STT_RATE_LIMITED',
  'STT_REQUEST_FAILED',
];

/**
 * Narrows a thrown error to the declared vocabulary. Anything unrecognised
 * becomes `STT_REQUEST_FAILED` with no detail, so a main-process stack or path
 * can never reach the renderer through this channel.
 */
export const publicSpeechErrorCode = (error: unknown): SpeechToTextErrorCode => {
  const message = error instanceof Error ? error.message : String(error);
  const [code] = message.split(':');
  return PUBLIC_ERROR_CODES.includes(code as SpeechToTextErrorCode)
    ? (code as SpeechToTextErrorCode)
    : 'STT_REQUEST_FAILED';
};

/**
 * The provider-supplied half of `STT_REQUEST_FAILED:<message>`, which the
 * composer already renders next to the generic copy. Only that one code carries
 * a detail; every other code is a fixed string the renderer translates itself.
 */
export const publicSpeechErrorDetail = (error: unknown): string | undefined => {
  const message = error instanceof Error ? error.message : String(error);
  if (!message.startsWith('STT_REQUEST_FAILED:')) return undefined;
  const detail = message.slice('STT_REQUEST_FAILED:'.length).trim();
  return detail || undefined;
};

export function initSpeechToTextBridge(): void {
  ipcBridge.speechToText.transcribe.provider(async (request) => {
    // Never let this reject. The bridge cannot transport a rejection: it would
    // become an unhandledRejection here and a promise that never settles in the
    // renderer, leaving the mic stuck on its spinner with nothing said.
    try {
      const result = await SpeechToTextService.transcribe(request);
      return { ok: true, result };
    } catch (error) {
      return { ok: false, errorCode: publicSpeechErrorCode(error), detail: publicSpeechErrorDetail(error) };
    }
  });
}
