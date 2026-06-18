/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { ConfigStorage } from '@/common/config/storage';
import type { SpeechToTextResult } from '@/common/types/speech';
import { isElectronDesktop } from '@/renderer/utils/platform';
import { transcribeLocally } from '@/renderer/services/voice/localWhisper';

const MAX_AUDIO_FILE_SIZE_MB = 30;
const MAX_AUDIO_FILE_SIZE_BYTES = MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024;

/**
 * ggml whisper models that ship as downloadable assets (via Settings) and run
 * through the main-process whisper.cpp path. The bundled in-renderer engine only
 * ever runs whisper-tiny, so anything in this set must be routed to whisper.cpp
 * to actually honour the user's model choice.
 */
const DOWNLOADABLE_GGML_MODELS = new Set(['base', 'small', 'large-v3-turbo']);

/**
 * Pure routing decision for the `whisper-local` provider on desktop.
 *
 * - `'bundled'`: use the zero-download in-renderer whisper-tiny engine. This is
 *   the floor that always works (tiny/unset model, or the selected ggml model
 *   isn't installed on disk yet).
 * - `'ggml'`: route to the main-process whisper.cpp path so the user's selected
 *   ggml model is actually used.
 */
export const chooseWhisperPath = (model: string | undefined, installed: boolean): 'ggml' | 'bundled' => {
  if (!model || !DOWNLOADABLE_GGML_MODELS.has(model)) {
    return 'bundled';
  }
  return installed ? 'ggml' : 'bundled';
};

const getAudioExtension = (mimeType: string) => {
  switch (mimeType) {
    case 'audio/mp4':
    case 'audio/x-m4a':
      return 'm4a';
    case 'audio/mpeg':
      return 'mp3';
    case 'audio/ogg':
    case 'audio/ogg;codecs=opus':
      return 'ogg';
    case 'audio/wav':
    case 'audio/wave':
      return 'wav';
    default:
      return 'webm';
  }
};

const createAudioFileName = (mimeType: string) => {
  return `speech-input.${getAudioExtension(mimeType)}`;
};

const ensureAudioSize = (blob: Blob) => {
  if (blob.size > MAX_AUDIO_FILE_SIZE_BYTES) {
    throw new Error('STT_FILE_TOO_LARGE');
  }
};

const parseWebResponse = async (response: XMLHttpRequest): Promise<SpeechToTextResult> => {
  const payload = JSON.parse(response.responseText) as {
    data?: SpeechToTextResult;
    msg?: string;
    success: boolean;
  };

  if (!payload.success || !payload.data) {
    throw new Error(payload.msg || 'STT_REQUEST_FAILED');
  }

  return payload.data;
};

export async function transcribeAudioBlob(blob: Blob, languageHint?: string): Promise<SpeechToTextResult> {
  ensureAudioSize(blob);

  const mimeType = blob.type || 'audio/webm';
  const fileName = createAudioFileName(mimeType);

  // Local tier - transcription runs entirely in the renderer via the bundled
  // Whisper-tiny ONNX model (transformers.js / WASM). No IPC, no cloud, no
  // native binary. This is the default when no cloud provider key is set.
  // `whisper-local` is the legacy provider id; treat it + an unset provider
  // as "use the bundled local engine".
  const sttConfig = await ConfigStorage.get('tools.speechToText').catch((): undefined => undefined);
  const provider = sttConfig?.provider;
  if (!provider || provider === 'whisper-local') {
    // On desktop, honour the user's selected ggml model by routing through the
    // main-process whisper.cpp path when that model is installed. The bundled
    // in-renderer engine only ever runs whisper-tiny, so without this the bigger
    // base/small/large-v3-turbo models the user downloaded would do nothing.
    if (isElectronDesktop()) {
      const selectedModel = sttConfig?.whisperLocal?.model;
      const installed = DOWNLOADABLE_GGML_MODELS.has(selectedModel ?? '')
        ? await ipcBridge.voiceAsset.exists
            .invoke({ id: `whisper-ggml-${selectedModel}` })
            .then((res) => res.installed)
            .catch(() => false)
        : false;

      if (chooseWhisperPath(selectedModel, installed) === 'ggml') {
        try {
          const audioBuffer = new Uint8Array(await blob.arrayBuffer());
          return await ipcBridge.speechToText.transcribe.invoke({
            audioBuffer: Array.from(audioBuffer),
            fileName,
            languageHint,
            mimeType,
          });
        } catch (error) {
          // Any failure (model gone, binary missing, transcribe threw, offline)
          // falls back to the bundled tiny engine so dictation never breaks.
          console.warn('[SpeechToText] whisper.cpp path failed, falling back to bundled tiny', error);
        }
      }
    }

    const text = await transcribeLocally(blob);
    return { text, provider: 'whisper-local', model: 'whisper-tiny', language: languageHint };
  }

  if (isElectronDesktop()) {
    const audioBuffer = new Uint8Array(await blob.arrayBuffer());
    return ipcBridge.speechToText.transcribe.invoke({
      audioBuffer: Array.from(audioBuffer),
      fileName,
      languageHint,
      mimeType,
    });
  }

  const formData = new FormData();
  formData.append('audio', blob, fileName);
  formData.append('mimeType', mimeType);
  if (languageHint) {
    formData.append('languageHint', languageHint);
  }

  return new Promise<SpeechToTextResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/stt');
    xhr.withCredentials = true;

    xhr.addEventListener('load', () => {
      if (xhr.status === 413) {
        reject(new Error('STT_FILE_TOO_LARGE'));
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`STT_REQUEST_FAILED:${xhr.status} ${xhr.statusText}`));
        return;
      }

      parseWebResponse(xhr).then(resolve).catch(reject);
    });

    xhr.addEventListener('error', () => {
      reject(new Error('STT_NETWORK_ERROR'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('STT_ABORTED'));
    });

    xhr.send(formData);
  });
}
