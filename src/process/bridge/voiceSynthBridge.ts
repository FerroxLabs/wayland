/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { app } from 'electron';
import log from 'electron-log';
import { ipcBridge } from '@/common';
import { normalizeTextToSpeechConfig } from '@/common/types/ttsTypes';
import { runTtsChain, warmTtsChain } from '@process/services/voice/engine/chainRunner';
import { initVoiceEngines } from '@process/services/voice/engine/initEngines';
import { pcmToWav, sharedKokoroWorker } from '@process/services/voice/engine/tts/kokoroWorker';
import { sharedPiperWorker } from '@process/services/voice/engine/tts/piperWorker';
import type { TtsChunk } from '@process/services/voice/engine/types';

const WAV_HEADER_BYTES = 44;

/**
 * Merge synthesis chunks into one playable clip. Streaming engines (warm
 * kokoro) emit one WAV per sentence, each with its own 44-byte header -
 * blindly concatenating those makes HTMLAudioElement stop at the first
 * header's declared length. For multi-part WAV, strip each header, join the
 * PCM, and rebuild a single header (sample rate read from the first part).
 * Single-part and non-WAV results pass through untouched.
 */
export const mergeAudioParts = (parts: Uint8Array[], mimeType: string): Uint8Array => {
  if (parts.length === 1) return parts[0];
  if (mimeType !== 'audio/wav' || parts.length === 0) {
    const total = parts.reduce((n, p) => n + p.length, 0);
    const joined = new Uint8Array(total);
    let offset = 0;
    for (const p of parts) {
      joined.set(p, offset);
      offset += p.length;
    }
    return joined;
  }
  const sampleRate = Buffer.from(parts[0].slice(24, 28)).readUInt32LE(0);
  const pcmSegments = parts.map((p) => p.slice(WAV_HEADER_BYTES));
  const pcmTotal = pcmSegments.reduce((n, p) => n + p.length, 0);
  const pcm = new Uint8Array(pcmTotal);
  let offset = 0;
  for (const segment of pcmSegments) {
    pcm.set(segment, offset);
    offset += segment.length;
  }
  return pcmToWav(pcm, sampleRate);
};

export function initVoiceSynthBridge(): void {
  initVoiceEngines();

  // The warm kokoro/piper workers are detached uv child processes; make sure
  // they never outlive the app.
  app.on('will-quit', () => {
    sharedKokoroWorker.shutdown();
    sharedPiperWorker.shutdown();
  });

  // Whole-clip envelope (settings Test voice + simple callers), chain-aware.
  // The renderer sends its TTS config with the request - do NOT read
  // ConfigStorage here (main-side get() round-trips to the renderer and
  // never resolves; `.catch` cannot save a hang).
  ipcBridge.voiceSynth.speak.provider(async ({ text, config: requestConfig }) => {
    const startedAt = Date.now();
    const config = normalizeTextToSpeechConfig(requestConfig);
    const parts: Uint8Array[] = [];
    let mimeType = 'audio/wav';
    const result = await runTtsChain(text, config, (c: TtsChunk) => {
      parts.push(c.data);
      mimeType = c.mimeType;
    });
    if (!result.ok) {
      log.error('[voice-synth] speak failed', { ms: Date.now() - startedAt, error: result.error });
      return { ok: false, error: result.error };
    }
    const data = mergeAudioParts(parts, mimeType);
    log.info('[voice-synth] speak ok', { engine: result.engineUsed, bytes: data.length, ms: Date.now() - startedAt });
    return { ok: true, data: Array.from(data), mimeType, engineUsed: result.engineUsed };
  });

  // Streaming: frames out via the emitter (base64, requestId-scoped), envelope after final.
  ipcBridge.voiceSynth.speakStream.provider(async ({ requestId, text, config: requestConfig }) => {
    const startedAt = Date.now();
    const config = normalizeTextToSpeechConfig(requestConfig);
    const result = await runTtsChain(text, config, (c: TtsChunk) => {
      ipcBridge.voiceSynth.stream.emit({
        requestId,
        seq: c.seq,
        dataB64: Buffer.from(c.data).toString('base64'),
        mimeType: c.mimeType,
        final: c.final,
      });
    });
    log[result.ok ? 'info' : 'error']('[voice-synth] stream done', {
      requestId,
      engine: result.engineUsed,
      ok: result.ok,
      ms: Date.now() - startedAt,
      error: result.error,
    });
    return { ok: result.ok, error: result.error, engineUsed: result.engineUsed, notices: result.notices };
  });

  ipcBridge.voiceSynth.stop.provider(async () => {
    // Stop is handled renderer-side via the shared playback util; no main-process state yet.
    return {};
  });

  // Pre-warm the active engine before the first reply. Best-effort - the chain
  // helper never throws; the envelope just reports which engine (if any) warmed.
  ipcBridge.voiceSynth.warmup.provider(async ({ config }) => {
    const c = normalizeTextToSpeechConfig(config);
    const r = await warmTtsChain(c);
    log.info('[voice-synth] warmup', r);
    return r;
  });
}
