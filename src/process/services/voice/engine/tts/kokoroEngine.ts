/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  KokoroLocal,
  KOKORO_DEFAULT_VOICE,
  defaultKokoroLocalRuntime,
  getKokoroModelPath,
  getKokoroVoicesPath,
  type KokoroLocalRuntime,
} from '@process/services/voice/KokoroLocal';
import { existsSync } from 'node:fs';
import log from 'electron-log';
import { getBinaryPath } from '@process/services/voice/voiceBinaryManifest';
import { sharedKokoroWorker, type KokoroWorkerClient } from './kokoroWorker';
import type { TtsEngine } from '../types';

/** Curated voice list - the single source the settings dropdown renders from. */
export const KOKORO_ENGINE_VOICES: { id: string; label: string }[] = [
  { id: 'af_sky', label: 'Sky (AF)' },
  { id: 'af_bella', label: 'Bella (AF)' },
  { id: 'af_heart', label: 'Heart (AF)' },
  { id: 'af_sarah', label: 'Sarah (AF)' },
  { id: 'af_nicole', label: 'Nicole (AF)' },
  { id: 'af_nova', label: 'Nova (AF)' },
  { id: 'af_alloy', label: 'Alloy (AF)' },
  { id: 'af_jessica', label: 'Jessica (AF)' },
  { id: 'af_river', label: 'River (AF)' },
  { id: 'am_adam', label: 'Adam (AM)' },
  { id: 'am_echo', label: 'Echo (AM)' },
  { id: 'am_eric', label: 'Eric (AM)' },
  { id: 'am_liam', label: 'Liam (AM)' },
  { id: 'am_michael', label: 'Michael (AM)' },
  { id: 'am_onyx', label: 'Onyx (AM)' },
  { id: 'bf_emma', label: 'Emma (BF)' },
  { id: 'bf_alice', label: 'Alice (BF)' },
  { id: 'bf_isabella', label: 'Isabella (BF)' },
  { id: 'bf_lily', label: 'Lily (BF)' },
  { id: 'bm_george', label: 'George (BM)' },
  { id: 'bm_daniel', label: 'Daniel (BM)' },
  { id: 'bm_lewis', label: 'Lewis (BM)' },
  { id: 'bm_fable', label: 'Fable (BM)' },
];

export const createKokoroEngine = (
  runtime: KokoroLocalRuntime = defaultKokoroLocalRuntime,
  worker: KokoroWorkerClient = sharedKokoroWorker,
): TtsEngine => ({
  id: 'kokoro-local',
  local: true,
  streaming: true,
  available: async () => {
    const uv = getBinaryPath('uv-runtime');
    if (!uv || !existsSync(uv)) return { ok: false, reason: 'uv runtime not installed' };
    if (!existsSync(getKokoroModelPath())) return { ok: false, reason: 'Kokoro model not downloaded' };
    if (!existsSync(getKokoroVoicesPath())) return { ok: false, reason: 'Kokoro voices not downloaded' };
    return { ok: true };
  },
  voices: async () => KOKORO_ENGINE_VOICES,
  // Best-effort pre-warm: start the persistent worker process and load the
  // model BEFORE the first synthesis request so the first reply is near
  // real-time. Gated on the production runtime (same seam as synthesize) and
  // guarded on missing assets; never throws.
  warmup: async () => {
    if (runtime !== defaultKokoroLocalRuntime) return;
    try {
      const uv = getBinaryPath('uv-runtime');
      const model = getKokoroModelPath();
      const voicesPath = getKokoroVoicesPath();
      if (!uv || !existsSync(uv) || !existsSync(model) || !existsSync(voicesPath)) return;
      await worker.ensureStarted(uv, model, voicesPath);
    } catch (err) {
      log.warn('[kokoro-engine] warmup failed (best-effort)', { error: String(err) });
    }
  },
  synthesize: async (text, opts, onChunk) => {
    // Warm-worker path is gated on the PRODUCTION runtime: when tests inject a
    // custom runtime seam they expect the one-shot path deterministically, and
    // the real uv binary may exist on the dev machine (which would otherwise
    // flip the adapter onto the worker path mid-test).
    if (runtime === defaultKokoroLocalRuntime) {
      const uv = getBinaryPath('uv-runtime');
      if (uv && existsSync(uv)) {
        try {
          await worker.ensureStarted(uv, getKokoroModelPath(), getKokoroVoicesPath());
          await worker.synthesize(text, opts, (c) =>
            onChunk({ data: c.data, mimeType: 'audio/wav', seq: c.seq, final: c.final }));
          return;
        } catch (err) {
          log.warn('[kokoro-engine] worker path failed; one-shot fallback', { error: String(err) });
        }
      }
    }
    const audio = await KokoroLocal.synthesize(
      text,
      { voice: opts.voice ?? KOKORO_DEFAULT_VOICE, speed: opts.speed ?? 1.0 } as Parameters<typeof KokoroLocal.synthesize>[1],
      runtime,
    );
    onChunk({ data: audio.data, mimeType: audio.mimeType, seq: 0, final: true });
  },
  dispose: async () => worker.shutdown(),
});
