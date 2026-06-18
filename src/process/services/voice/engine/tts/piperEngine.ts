/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPlatformServices } from '@/common/platform';
import { getBinaryPath } from '@process/services/voice/voiceBinaryManifest';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import log from 'electron-log';
import { sharedPiperWorker, type PiperWorkerClient } from './piperWorker';
import type { TtsEngine } from '../types';

export const PIPER_DEFAULT_VOICE = 'en_US-lessac-medium';

/** Curated voice list - the single source the settings dropdown renders from. */
export const PIPER_VOICES: { id: string; label: string }[] = [
  { id: 'en_US-lessac-medium', label: 'Lessac — English (US)' },
  { id: 'es_ES-davefx-medium', label: 'DaveFX — Español' },
  { id: 'fr_FR-siwis-medium', label: 'Siwis — Français' },
  { id: 'de_DE-thorsten-medium', label: 'Thorsten — Deutsch' },
];

export const getPiperVoicePath = (voice: string): string =>
  path.join(getPlatformServices().paths.getDataDir(), 'voice', 'piper', `${voice}.onnx`);

export type PiperRuntime = {
  resolveUv: () => string | null;
  resolveVoiceModel: (voice: string) => string | null;
  run: (uv: string, args: string[], cwd: string, input?: string) => Promise<void>;
};

/**
 * One-shot `uv run --with piper-tts python -m piper ...` with the text on
 * stdin (the arg form validated by the Task 8 Step 1 shell proof). Node's
 * execFile has no `input` option, so spawn + stdin write it is.
 */
const runWithStdin = (uv: string, args: string[], cwd: string, input?: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn(uv, args, { cwd, stdio: ['pipe', 'ignore', 'pipe'] });
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('piper synthesis timed out after 120s'));
    }, 120_000);
    child.stderr.on('data', (d: Buffer) => {
      stderr += d.toString();
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`piper exited with code ${code}: ${stderr.slice(-2000)}`));
    });
    child.stdin.on('error', () => {}); // EPIPE if the child dies early - close handler reports
    child.stdin.end(input ?? '');
  });

export const defaultPiperRuntime: PiperRuntime = {
  resolveUv: () => {
    const p = getBinaryPath('uv-runtime');
    return p && existsSync(p) ? p : null;
  },
  resolveVoiceModel: (voice) => {
    const p = getPiperVoicePath(voice);
    return existsSync(p) ? p : null;
  },
  run: runWithStdin,
};

export const createPiperEngine = (
  runtime: PiperRuntime = defaultPiperRuntime,
  worker: PiperWorkerClient = sharedPiperWorker,
): TtsEngine => ({
  id: 'piper-local',
  local: true,
  streaming: true,
  available: async () => {
    if (!runtime.resolveUv()) return { ok: false, reason: 'uv runtime not installed' };
    if (!runtime.resolveVoiceModel(PIPER_DEFAULT_VOICE)) {
      return { ok: false, reason: 'Piper voice not downloaded' };
    }
    return { ok: true };
  },
  voices: async () =>
    PIPER_VOICES.filter((v) => runtime.resolveVoiceModel(v.id) !== null || v.id === PIPER_DEFAULT_VOICE),
  // Best-effort pre-warm: start the persistent worker process before the first
  // request so the uv-run spawn cost is paid up front (Piper loads voices
  // per-request, so ensureStarted only boots the process). Gated on the
  // production runtime (same seam as synthesize); never throws.
  warmup: async () => {
    if (runtime !== defaultPiperRuntime) return;
    try {
      const uv = runtime.resolveUv();
      if (!uv) return;
      await worker.ensureStarted(uv);
    } catch (err) {
      log.warn('[piper-engine] warmup failed (best-effort)', { error: String(err) });
    }
  },
  synthesize: async (text, opts, onChunk) => {
    const uv = runtime.resolveUv();
    if (!uv) throw new Error('TTS_PIPER_UNAVAILABLE: uv runtime not installed');
    const voice = opts.voice && runtime.resolveVoiceModel(opts.voice) ? opts.voice : PIPER_DEFAULT_VOICE;
    const modelPath = runtime.resolveVoiceModel(voice);
    if (!modelPath) throw new Error('TTS_PIPER_UNAVAILABLE: Piper voice not downloaded');
    // Warm-worker path is gated on the PRODUCTION runtime: when tests inject a
    // custom runtime seam they expect the one-shot path deterministically, and
    // the real uv binary may exist on the dev machine (which would otherwise
    // flip the adapter onto the worker path mid-test).
    if (runtime === defaultPiperRuntime) {
      try {
        await worker.ensureStarted(uv);
        await worker.synthesize(modelPath, text, { speed: opts.speed }, (c) =>
          onChunk({ data: c.data, mimeType: 'audio/wav', seq: c.seq, final: c.final }));
        return;
      } catch (err) {
        log.warn('[piper-engine] worker path failed; one-shot fallback', { error: String(err) });
      }
    }
    const outDir = await mkdtemp(path.join(tmpdir(), 'wayland-piper-'));
    const outFile = path.join(outDir, 'out.wav');
    try {
      // Args validated by the Task 8 Step 1 shell proof: piper reads the text
      // on stdin via `python -m piper`. length_scale = 1/speed (piper tempo).
      const lengthScale = 1 / Math.min(2, Math.max(0.5, opts.speed ?? 1.0));
      await runtime.run(
        uv,
        [
          'run',
          '--with',
          'piper-tts',
          'python',
          '-m',
          'piper',
          '--model',
          modelPath,
          '--output_file',
          outFile,
          '--length_scale',
          String(lengthScale),
        ],
        outDir,
        text
      );
      if (!existsSync(outFile)) throw new Error('TTS_PIPER_UNAVAILABLE: synthesis produced no output file');
      onChunk({ data: new Uint8Array(readFileSync(outFile)), mimeType: 'audio/wav', seq: 0, final: true });
    } finally {
      await rm(outDir, { recursive: true, force: true }).catch(() => {});
    }
  },
  dispose: async () => worker.shutdown(),
});
