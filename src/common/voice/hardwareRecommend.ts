/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Hardware-aware, local-first voice-model recommendation.
 *
 * Pure + dependency-free (no DOM, no node) so it lives in `src/common/voice/`
 * alongside the catalog it reads and can be unit-tested directly. It consumes
 * the catalog's `minRamGB` / `platform` / `requiresProvider` flags to pick a
 * sensible default STT model and TTS engine for the current machine.
 *
 * Policy: local-first. A cloud entry (one with `requiresProvider`) is only ever
 * recommended when that provider is present in `signedInProviders`; otherwise we
 * stay fully on-device. We never recommend a model whose `minRamGB` exceeds the
 * machine's RAM.
 */

import type { VoiceModelEntry } from './voiceModelCatalog';

export type HardwareInfo = {
  /** Total system RAM, rounded to whole GB. */
  totalRamGB: number;
  /** True on Apple Silicon (darwin + arm64). */
  appleSilicon: boolean;
  /** Coarse platform tag mirroring the catalog's `platform` gate. */
  platform: 'darwin-arm64' | 'other';
};

export type VoiceRecommendation = {
  /** Recommended TTS model id (engine-specific). Absent if only an engine is suggested. */
  ttsModelId?: string;
  /** Recommended TTS engine id, e.g. 'kokoro-local' | 'mlx-audio-local'. */
  ttsEngineId?: string;
  /** Recommended STT model id (always set — there is always a bundled floor). */
  sttModelId: string;
  /** Short human-readable explanation of the choice. */
  reason: string;
};

/** Engine id for the cross-platform Kokoro TTS default. */
const KOKORO_ENGINE_ID = 'kokoro-local';
/** Engine id for the Apple-Silicon MLX TTS engine. */
const MLX_ENGINE_ID = 'mlx-audio-local';
/** Engine id for the bundled Whisper STT. */
const WHISPER_ENGINE_ID = 'whisper-local';
/** Always-available bundled STT floor. */
const STT_FLOOR = 'tiny';

/** Whether an entry may run on this machine given platform + RAM gating. */
const fits = (entry: VoiceModelEntry, hw: HardwareInfo): boolean => {
  if (entry.platform && entry.platform !== hw.platform) return false;
  if (entry.minRamGB != null && entry.minRamGB > hw.totalRamGB) return false;
  return true;
};

/** A cloud entry is offerable only when its provider is signed in. */
const providerOk = (entry: VoiceModelEntry, signedInProviders?: ReadonlySet<string>): boolean =>
  !entry.requiresProvider || (signedInProviders?.has(entry.requiresProvider) ?? false);

/**
 * Recommend a local-first STT model and TTS engine for the given hardware.
 *
 * STT tiers (best that fits wins): on Apple Silicon with >=4 GB → `large-v3-turbo`;
 * with >=2 GB → `base`; otherwise the bundled `tiny`. Every candidate is still
 * RAM- and platform-gated against the catalog, so an underpowered machine can
 * never be handed a model it cannot load.
 *
 * TTS: Kokoro (cross-platform) is the default. On Apple Silicon with >=16 GB the
 * catalog's recommended MLX entry (F5-TTS) is offered as the premium option,
 * provided it actually fits.
 */
export const recommendVoiceModels = (
  hw: HardwareInfo,
  catalog: VoiceModelEntry[],
  signedInProviders?: ReadonlySet<string>
): VoiceRecommendation => {
  const sttEntries = catalog.filter(
    (m) => m.kind === 'stt' && m.engineId === WHISPER_ENGINE_ID && fits(m, hw) && providerOk(m, signedInProviders)
  );
  const hasStt = (id: string): boolean => sttEntries.some((m) => m.modelId === id);

  // Best STT tier that fits on this machine.
  let sttModelId = STT_FLOOR;
  if (hw.totalRamGB >= 2 && hasStt('base')) {
    sttModelId = 'base';
  }
  if (hw.totalRamGB >= 4 && hw.appleSilicon && hasStt('large-v3-turbo')) {
    sttModelId = 'large-v3-turbo';
  }
  // Guard: never end up below the guaranteed floor if a tier was somehow gated.
  if (!hasStt(sttModelId) && hasStt(STT_FLOOR)) {
    sttModelId = STT_FLOOR;
  }

  // TTS: default to cross-platform Kokoro; offer the recommended MLX entry as the
  // premium option only on Apple Silicon with enough RAM and if it actually fits.
  let ttsEngineId: string = KOKORO_ENGINE_ID;
  let ttsModelId: string | undefined;
  let mlxAvailable = false;

  if (hw.appleSilicon && hw.totalRamGB >= 16) {
    const mlx = catalog.find(
      (m) =>
        m.kind === 'tts' &&
        m.engineId === MLX_ENGINE_ID &&
        m.recommended === true &&
        fits(m, hw) &&
        providerOk(m, signedInProviders)
    );
    if (mlx) {
      ttsEngineId = MLX_ENGINE_ID;
      ttsModelId = mlx.modelId;
      mlxAvailable = true;
    }
  }

  const reason = buildReason(hw, sttModelId, ttsEngineId, mlxAvailable);

  return { ttsEngineId, ttsModelId, sttModelId, reason };
};

/** Build the short human-readable sentence describing the recommendation. */
const buildReason = (
  hw: HardwareInfo,
  sttModelId: string,
  ttsEngineId: string,
  mlxAvailable: boolean
): string => {
  const machine = hw.appleSilicon ? 'Apple Silicon' : 'this machine';
  const ttsName = ttsEngineId === MLX_ENGINE_ID ? 'MLX (F5-TTS)' : 'Kokoro';
  const sttName = `Whisper ${sttModelId}`;
  const base = `${machine} with ${hw.totalRamGB} GB — ${ttsName} + ${sttName} recommended`;
  // When Apple Silicon has MLX-capable RAM but we still defaulted to Kokoro
  // (premium not selected), hint that the MLX voices exist.
  if (hw.appleSilicon && !mlxAvailable) {
    return `${base} (MLX voices available on capable Macs).`;
  }
  if (mlxAvailable) {
    return `${base} (MLX voices enabled).`;
  }
  return `${base}.`;
};
