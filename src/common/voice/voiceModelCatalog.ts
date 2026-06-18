/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Data-driven catalog of voice models the settings picker renders from.
 *
 * This mirrors the engine registry one level down: the registry is the
 * contribution surface for *engines*, and this catalog is the contribution
 * surface for the *models within an engine*. Built-ins live here; community
 * extensions can append entries (see {@link buildVoiceModelCatalog}) so a third
 * party can offer a new Whisper tier or MLX voice without forking the picker.
 *
 * Pure + engine-agnostic (no DOM, no node) so it sits in `src/common/voice/`
 * alongside the other testable voice logic and can be unit-tested directly.
 */

export type VoiceModelKind = 'tts' | 'stt';

export type VoiceModelEntry = {
  kind: VoiceModelKind;
  /** Engine that consumes this model, e.g. 'mlx-audio-local' | 'whisper-local'. */
  engineId: string;
  /** Stable id used in config (e.g. 'base', or a HuggingFace repo id). */
  modelId: string;
  /** Human label for the dropdown. */
  label: string;
  /** HuggingFace repo id where applicable. */
  hfId?: string;
  /** Approximate on-disk download size, e.g. '~600 MB'. */
  sizeLabel: string;
  /** Tooltip / description text shown next to the option. */
  blurb: string;
  /** Quantization hint, e.g. '8-bit recommended'. */
  quant?: string;
  /** When set, the entry is only offered on that platform. */
  platform?: 'darwin-arm64';
  recommended?: boolean;
};

/**
 * In-repo voice models. Extensions add to this list via
 * {@link buildVoiceModelCatalog}; they cannot override these built-ins.
 *
 * Every `hfId` below was verified to resolve (HF repo returns 200) at authoring
 * time. The F5-TTS weights live at `lucasnewman/f5-tts-mlx` (the author's repo),
 * not under `mlx-community/` — the mlx-community mirror does not exist.
 */
export const BUILT_IN_VOICE_MODELS: VoiceModelEntry[] = [
  // --- whisper-local STT ---
  {
    kind: 'stt',
    engineId: 'whisper-local',
    modelId: 'base',
    label: 'base',
    sizeLabel: '~148 MB',
    blurb:
      'Fast and lightweight. Good for clear speech and quick dictation; the best everyday balance of speed and accuracy on most machines.',
  },
  {
    kind: 'stt',
    engineId: 'whisper-local',
    modelId: 'small',
    label: 'small',
    sizeLabel: '~488 MB',
    blurb:
      'Noticeably more accurate on accents, names, and background noise, while staying reasonably quick. Pick this if base misses words.',
  },
  {
    kind: 'stt',
    engineId: 'whisper-local',
    modelId: 'large-v3-turbo',
    label: 'large-v3-turbo',
    sizeLabel: '~1.5 GB',
    blurb:
      'Near-large-v3 accuracy at much higher speed; multilingual. The best Whisper tier if your machine can hold it.',
  },

  // --- mlx-audio-local TTS (Apple Silicon only) ---
  {
    kind: 'tts',
    engineId: 'mlx-audio-local',
    modelId: 'lucasnewman/f5-tts-mlx',
    label: 'F5-TTS',
    hfId: 'lucasnewman/f5-tts-mlx',
    sizeLabel: '~1.2 GB',
    blurb: 'All-rounder with voice cloning from a reference clip',
    platform: 'darwin-arm64',
    recommended: true,
  },
  {
    kind: 'tts',
    engineId: 'mlx-audio-local',
    modelId: 'mlx-community/csm-1b',
    label: 'CSM-1B',
    hfId: 'mlx-community/csm-1b',
    sizeLabel: '~1-2 GB',
    blurb: 'Most natural conversational voice',
    quant: '8-bit',
    platform: 'darwin-arm64',
  },
  {
    kind: 'tts',
    engineId: 'mlx-audio-local',
    modelId: 'mlx-community/orpheus-3b-0.1-ft-4bit',
    label: 'Orpheus-3B',
    hfId: 'mlx-community/orpheus-3b-0.1-ft-4bit',
    sizeLabel: '~2 GB',
    blurb: 'Expressive with emotion tags; quantize it',
    quant: '4-bit',
    platform: 'darwin-arm64',
  },
  {
    kind: 'tts',
    engineId: 'mlx-audio-local',
    modelId: 'mlx-community/Dia-1.6B',
    label: 'Dia-1.6B',
    hfId: 'mlx-community/Dia-1.6B',
    sizeLabel: '~3-6 GB',
    blurb: 'Best realism + multi-speaker dialogue',
    platform: 'darwin-arm64',
  },
];

/**
 * Merge built-ins with extension-contributed entries.
 *
 * Dedups by `engineId` + `modelId`; built-ins always win, so an extension can
 * *add* a new model but cannot *override* (or silently shadow) an in-repo one.
 */
export const buildVoiceModelCatalog = (extra: VoiceModelEntry[] = []): VoiceModelEntry[] => {
  const seen = new Set(BUILT_IN_VOICE_MODELS.map((m) => `${m.engineId}:${m.modelId}`));
  const merged = [...BUILT_IN_VOICE_MODELS];
  for (const entry of extra) {
    const key = `${entry.engineId}:${entry.modelId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(entry);
  }
  return merged;
};

/** All catalog entries for a given engine, in declared order. */
export const voiceModelsFor = (catalog: VoiceModelEntry[], engineId: string): VoiceModelEntry[] =>
  catalog.filter((m) => m.engineId === engineId);
