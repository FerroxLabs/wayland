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
  /** Runs fully on-device with no network/credential. Defaults all resolve to
   * a local entry; cloud entries set this false. */
  local?: boolean;
  /** Ships in-repo (vs contributed by an extension). */
  builtIn?: boolean;
  /** Ships pre-installed in the app (no download). */
  bundled?: boolean;
  /** Can be deleted from disk. Built-in floors (bundled tiny, system-native)
   * set this false — they are the guaranteed offline fallback. Default true. */
  removable?: boolean;
  /** Only selectable when the existing credential store is signed in to this
   * provider (e.g. 'openai', 'deepgram'). The voice layer has NO auth of its
   * own — this reuses the app's single sign-in. Absent = always available. */
  requiresProvider?: string;
  /** Approx peak RAM to load + run, for the hardware recommender / OOM warnings. */
  minRamGB?: number;
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
  // The bundled tiny model is the guaranteed offline floor: it ships in the
  // installer, needs no download, and can never be removed. Every STT chain
  // falls back to it.
  {
    kind: 'stt',
    engineId: 'whisper-local',
    modelId: 'tiny',
    label: 'tiny (bundled)',
    sizeLabel: '~75 MB',
    blurb:
      'Ships with the app and works offline instantly — no download. Fast but the least accurate; the always-available default and fallback.',
    local: true,
    bundled: true,
    builtIn: true,
    removable: false,
    recommended: true,
    minRamGB: 1,
  },
  {
    kind: 'stt',
    engineId: 'whisper-local',
    modelId: 'base',
    label: 'base',
    sizeLabel: '~148 MB',
    blurb:
      'Fast and lightweight. Good for clear speech and quick dictation; the best everyday balance of speed and accuracy on most machines.',
    local: true,
    minRamGB: 1,
  },
  {
    kind: 'stt',
    engineId: 'whisper-local',
    modelId: 'small',
    label: 'small',
    sizeLabel: '~488 MB',
    blurb:
      'Noticeably more accurate on accents, names, and background noise, while staying reasonably quick. Pick this if base misses words.',
    local: true,
    minRamGB: 2,
  },
  {
    kind: 'stt',
    engineId: 'whisper-local',
    modelId: 'large-v3-turbo',
    label: 'large-v3-turbo',
    sizeLabel: '~1.5 GB',
    blurb:
      'Near-large-v3 accuracy at much higher speed; multilingual. The best Whisper tier if your machine can hold it.',
    local: true,
    minRamGB: 4,
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
    local: true,
    minRamGB: 8,
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
    local: true,
    minRamGB: 8,
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
    local: true,
    minRamGB: 12,
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
    local: true,
    minRamGB: 16,
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

/** Whether a model may be deleted from disk. Built-in floors are not removable. */
export const isModelRemovable = (entry: VoiceModelEntry): boolean => entry.removable !== false;

/** The recommended default model for an engine (the `recommended` entry, else the first). */
export const defaultModelFor = (catalog: VoiceModelEntry[], engineId: string): VoiceModelEntry | null => {
  const forEngine = voiceModelsFor(catalog, engineId);
  return forEngine.find((m) => m.recommended) ?? forEngine[0] ?? null;
};

/**
 * Filter a catalog to what's offerable on this machine: drops entries gated to
 * another platform, and (when `signedInProviders` is supplied) drops cloud
 * entries whose `requiresProvider` is not signed in. Local entries always pass.
 * This is how "default to local unless signed in" is enforced — the voice layer
 * reuses the app's existing credential set, it never has its own auth.
 */
export const availableVoiceModels = (
  catalog: VoiceModelEntry[],
  ctx: { platform: 'darwin-arm64' | 'other'; signedInProviders?: ReadonlySet<string> },
): VoiceModelEntry[] =>
  catalog.filter((m) => {
    if (m.platform && m.platform !== ctx.platform) return false;
    if (m.requiresProvider && !ctx.signedInProviders?.has(m.requiresProvider)) return false;
    return true;
  });
