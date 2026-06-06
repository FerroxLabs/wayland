/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Renderer-side local speech-to-text via the bundled Whisper-tiny ONNX model.
 *
 * Owns the lifecycle of the whisper Web Worker: lazy-spawned on first use,
 * initialized with the bundled-model URL (from the main process), and reused
 * for every subsequent transcription. Fully offline once the model is loaded.
 *
 * This is the "floor" engine - always available, no download, no cloud key.
 * The tiered STT router falls through to this when no cloud provider key is
 * configured.
 */

import { ipcBridge } from '@/common';

type WorkerOutbound =
  | { type: 'ready' }
  | { type: 'result'; requestId: string; text: string }
  | { type: 'error'; requestId?: string; error: string };

let worker: Worker | null = null;
let initPromise: Promise<void> | null = null;
const pending = new Map<string, { resolve: (text: string) => void; reject: (err: Error) => void }>();

/** Spawn + initialize the worker once. Subsequent calls reuse the same promise. */
function ensureWorker(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const w = new Worker(new URL('../../workers/whisperWorker.ts', import.meta.url), {
      type: 'module',
    });

    w.onmessage = (event: MessageEvent<WorkerOutbound>) => {
      const msg = event.data;
      if (msg.type === 'result') {
        pending.get(msg.requestId)?.resolve(msg.text);
        pending.delete(msg.requestId);
      } else if (msg.type === 'error' && msg.requestId) {
        pending.get(msg.requestId)?.reject(new Error(msg.error));
        pending.delete(msg.requestId);
      }
    };

    const { url } = await ipcBridge.voiceAsset.localModelBase.invoke();

    await new Promise<void>((resolve, reject) => {
      const onReady = (event: MessageEvent<WorkerOutbound>) => {
        if (event.data.type === 'ready') {
          w.removeEventListener('message', onReady);
          resolve();
        } else if (event.data.type === 'error' && !event.data.requestId) {
          w.removeEventListener('message', onReady);
          reject(new Error(event.data.error));
        }
      };
      w.addEventListener('message', onReady);
      w.postMessage({ type: 'init', modelBase: url });
    });

    worker = w;
  })();

  // If init fails, clear the cached promise so a later call can retry.
  initPromise.catch(() => {
    initPromise = null;
    worker = null;
  });

  return initPromise;
}

/**
 * Decode an audio blob (webm/opus from MediaRecorder, or any browser-decodable
 * format) into the 16 kHz mono Float32 PCM that Whisper expects.
 */
async function blobToPcm16k(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();
  const decodeCtx = new AudioContext();
  let decoded: AudioBuffer;
  try {
    decoded = await decodeCtx.decodeAudioData(arrayBuffer);
  } finally {
    void decodeCtx.close();
  }

  // Resample to 16 kHz mono via an OfflineAudioContext.
  const frameCount = Math.max(1, Math.ceil(decoded.duration * 16000));
  const offline = new OfflineAudioContext(1, frameCount, 16000);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0);
}

/** True if the local engine is loaded and ready (no async work pending). */
export function isLocalWhisperReady(): boolean {
  return worker !== null;
}

/** Pre-warm the worker + model. Safe to call eagerly (e.g. Settings → Voice). */
export async function warmLocalWhisper(): Promise<void> {
  await ensureWorker();
}

/**
 * Transcribe an audio blob locally. Throws on worker/model failure so the
 * caller can surface a typed STT error.
 */
export async function transcribeLocally(blob: Blob): Promise<string> {
  await ensureWorker();
  if (!worker) throw new Error('whisper worker unavailable');

  const pcm = await blobToPcm16k(blob);
  const requestId = `stt-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

  return new Promise<string>((resolve, reject) => {
    pending.set(requestId, { resolve, reject });
    worker!.postMessage({ type: 'transcribe', requestId, audio: pcm }, [pcm.buffer]);
  });
}
