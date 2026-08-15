/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Web Worker that runs local speech-to-text via transformers.js (ONNX
 * Whisper, WASM backend). Kept off the renderer main thread so the ~5-10s
 * one-time model warmup and per-utterance inference never freeze the UI.
 *
 * Protocol (postMessage):
 *   → { type: 'init', modelBase }      load the bundled Whisper-tiny model
 *   ← { type: 'ready' } | { type: 'error', error }
 *   → { type: 'transcribe', requestId, audio }   audio = Float32Array 16kHz mono
 *   ← { type: 'result', requestId, text } | { type: 'error', requestId, error }
 */

import { pipeline, env, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers';
// ORT's WASM binary, emitted as an app asset by Vite instead of fetched from
// transformers.js's default CDN. See ORT_WASM_PATHS below.
import ortWasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm?url';

// The model is bundled in the app - never reach out to the HF Hub.
env.allowRemoteModels = false;
env.allowLocalModels = true;
// The browser Cache API rejects the wayland-asset:// scheme; disabling the
// cache silences a stream of harmless "scheme unsupported" warnings. Model
// files are local disk reads anyway, so re-fetching per load is cheap.
env.useBrowserCache = false;

// Left alone, transformers.js points ORT's WASM runtime at
// https://cdn.jsdelivr.net/npm/onnxruntime-web@<ver>/dist/ - ~22.5 MiB of
// undeclared third-party egress, and a hard failure offline or behind a
// captive portal.
//
// It is NOT blocked by our CSP, and an earlier version of this comment said
// otherwise. Measured: with the app's real CSP applied to a file: document and
// confirmed live via onHeadersReceived, a dedicated worker still fetched
// jsdelivr with HTTP 200. Workers are not covered by the document's policy
// here. The offline argument stands on its own and is the reason for this fix.
//
// The `?url` import above makes
// Vite emit the binary from our own node_modules as a renderer asset, so this
// URL is same-origin in dev and an in-asar file: URL when packaged.
//
// Only `wasm` is set, deliberately. ORT falls back to the WASM *factory* it
// already has statically bundled into this worker chunk unless `wasmPaths.mjs`
// is also set - setting it would trade a bundled module for a runtime fetch.
// With `wasmPaths.wasm` present ORT wires `locateFile` straight to this URL.
export const ORT_WASM_PATHS = { wasm: ortWasmUrl };
env.backends.onnx.wasm.wasmPaths = ORT_WASM_PATHS;
// transformers.js only pre-fetches the runtime through the Cache API when BOTH
// wasmPaths entries are set, so this is belt-and-braces: caching a local disk
// read buys nothing, and the Cache API rejects file:// anyway. Note this is a
// different flag from `useBrowserCache` above, which governs MODEL files.
env.useWasmCache = false;

// Bundled model id under the voice-models dir (resources/voice-models/whisper-tiny).
const MODEL_ID = 'whisper-tiny';

let asrPromise: Promise<AutomaticSpeechRecognitionPipeline> | null = null;

type InitMessage = { type: 'init'; modelBase: string };
type TranscribeMessage = { type: 'transcribe'; requestId: string; audio: Float32Array };
type IncomingMessage = InitMessage | TranscribeMessage;

self.onmessage = async (event: MessageEvent<IncomingMessage>) => {
  const msg = event.data;

  if (msg.type === 'init') {
    // transformers.js fetches `${localModelPath}${MODEL_ID}/<file>`.
    env.localModelPath = msg.modelBase.endsWith('/') ? msg.modelBase : `${msg.modelBase}/`;
    // `graphOptimizationLevel: 'basic'` skips ORT's QDQ→MatMulNBits transpose
    // pass, which crashes on the q8-quantized Whisper decoder ("Missing
    // required scale"). Basic-level optimization still loads cleanly.
    asrPromise = pipeline('automatic-speech-recognition', MODEL_ID, {
      dtype: 'q8',
      session_options: { graphOptimizationLevel: 'basic' },
    }) as Promise<AutomaticSpeechRecognitionPipeline>;
    try {
      await asrPromise;
      self.postMessage({ type: 'ready' });
    } catch (err) {
      asrPromise = null;
      self.postMessage({ type: 'error', error: err instanceof Error ? err.message : String(err) });
    }
    return;
  }

  if (msg.type === 'transcribe') {
    try {
      if (!asrPromise) throw new Error('whisper worker not initialized');
      const asr = await asrPromise;
      const output = await asr(msg.audio, { return_timestamps: false });
      const text = Array.isArray(output)
        ? output.map((o) => o.text).join(' ')
        : ((output as { text?: string }).text ?? '');
      self.postMessage({ type: 'result', requestId: msg.requestId, text: text.trim() });
    } catch (err) {
      self.postMessage({
        type: 'error',
        requestId: msg.requestId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
};
