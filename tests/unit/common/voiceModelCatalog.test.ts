/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it } from 'vitest';
import {
  BUILT_IN_VOICE_MODELS,
  buildVoiceModelCatalog,
  voiceModelsFor,
  isModelRemovable,
  defaultModelFor,
  availableVoiceModels,
  type VoiceModelEntry,
} from '@/common/voice/voiceModelCatalog';

const whisperIds = (entries: VoiceModelEntry[]) => entries.map((m) => m.modelId);

describe('common/voiceModelCatalog', () => {
  it('built-ins include whisper base/small/turbo + at least F5', () => {
    const ids = whisperIds(BUILT_IN_VOICE_MODELS);
    expect(ids).toContain('base');
    expect(ids).toContain('small');
    expect(ids).toContain('large-v3-turbo');

    const f5 = BUILT_IN_VOICE_MODELS.find((m) => m.modelId === 'lucasnewman/f5-tts-mlx');
    expect(f5).toBeDefined();
    expect(f5?.engineId).toBe('mlx-audio-local');
    expect(f5?.kind).toBe('tts');
  });

  it('buildVoiceModelCatalog appends extension-contributed entries', () => {
    const extra: VoiceModelEntry = {
      kind: 'tts',
      engineId: 'mlx-audio-local',
      modelId: 'acme/extra-voice',
      label: 'Extra Voice',
      sizeLabel: '~500 MB',
      blurb: 'A community-contributed voice',
    };
    const catalog = buildVoiceModelCatalog([extra]);
    expect(catalog).toHaveLength(BUILT_IN_VOICE_MODELS.length + 1);
    expect(catalog.some((m) => m.modelId === 'acme/extra-voice')).toBe(true);
  });

  it('dedups extension entries colliding with each other', () => {
    const dup: VoiceModelEntry = {
      kind: 'tts',
      engineId: 'mlx-audio-local',
      modelId: 'acme/dup',
      label: 'Dup',
      sizeLabel: '~1 MB',
      blurb: 'dup',
    };
    const catalog = buildVoiceModelCatalog([dup, { ...dup, label: 'Dup 2' }]);
    const matches = catalog.filter((m) => m.modelId === 'acme/dup');
    expect(matches).toHaveLength(1);
    // First entry wins; the colliding second one is dropped.
    expect(matches[0].label).toBe('Dup');
  });

  it('an extension entry with an existing engineId+modelId does NOT override the built-in', () => {
    const override: VoiceModelEntry = {
      kind: 'stt',
      engineId: 'whisper-local',
      modelId: 'base',
      label: 'HIJACKED',
      sizeLabel: '~0 MB',
      blurb: 'malicious override attempt',
    };
    const catalog = buildVoiceModelCatalog([override]);
    const base = catalog.filter((m) => m.engineId === 'whisper-local' && m.modelId === 'base');
    expect(base).toHaveLength(1);
    expect(base[0].label).toBe('base');
    expect(base[0].blurb).not.toBe('malicious override attempt');
  });

  it("voiceModelsFor returns only that engine's entries", () => {
    const catalog = buildVoiceModelCatalog();
    const whisper = voiceModelsFor(catalog, 'whisper-local');
    expect(whisper.length).toBeGreaterThanOrEqual(3);
    expect(whisper.every((m) => m.engineId === 'whisper-local')).toBe(true);
    expect(whisper.every((m) => m.kind === 'stt')).toBe(true);
    expect(whisperIds(whisper)).toEqual(expect.arrayContaining(['base', 'small', 'large-v3-turbo']));

    const mlx = voiceModelsFor(catalog, 'mlx-audio-local');
    expect(mlx.every((m) => m.engineId === 'mlx-audio-local')).toBe(true);
    expect(mlx.every((m) => m.kind === 'tts')).toBe(true);
  });

  it('whisper-tiny is the bundled, non-removable, recommended default', () => {
    const tiny = BUILT_IN_VOICE_MODELS.find((m) => m.engineId === 'whisper-local' && m.modelId === 'tiny');
    expect(tiny).toBeDefined();
    expect(tiny?.bundled).toBe(true);
    expect(tiny?.builtIn).toBe(true);
    expect(tiny?.local).toBe(true);
    expect(isModelRemovable(tiny!)).toBe(false);
    expect(defaultModelFor(buildVoiceModelCatalog(), 'whisper-local')?.modelId).toBe('tiny');
  });

  it('downloadable models are removable; the floor is not', () => {
    const catalog = buildVoiceModelCatalog();
    const base = catalog.find((m) => m.modelId === 'base')!;
    expect(isModelRemovable(base)).toBe(true);
  });

  it('availableVoiceModels drops other-platform and unsigned cloud entries; keeps local', () => {
    const cloud: VoiceModelEntry = {
      kind: 'stt', engineId: 'openai-whisper', modelId: 'whisper-1', label: 'OpenAI',
      sizeLabel: '—', blurb: 'cloud', requiresProvider: 'openai', local: false,
    };
    const catalog = buildVoiceModelCatalog([cloud]);
    // non-mac, not signed in: mlx (darwin-arm64) and the cloud entry are dropped; local whisper stays
    const onOther = availableVoiceModels(catalog, { platform: 'other', signedInProviders: new Set() });
    expect(onOther.some((m) => m.modelId === 'tiny')).toBe(true);
    expect(onOther.some((m) => m.engineId === 'mlx-audio-local')).toBe(false);
    expect(onOther.some((m) => m.modelId === 'whisper-1')).toBe(false);
    // signed in to openai: the cloud entry appears
    const signedIn = availableVoiceModels(catalog, { platform: 'other', signedInProviders: new Set(['openai']) });
    expect(signedIn.some((m) => m.modelId === 'whisper-1')).toBe(true);
    // mac: mlx entries appear
    const onMac = availableVoiceModels(catalog, { platform: 'darwin-arm64' });
    expect(onMac.some((m) => m.engineId === 'mlx-audio-local')).toBe(true);
  });
});
