/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it } from 'vitest';
import {
  recommendVoiceModels,
  type HardwareInfo,
} from '@/common/voice/hardwareRecommend';
import { buildVoiceModelCatalog, type VoiceModelEntry } from '@/common/voice/voiceModelCatalog';

const catalog = buildVoiceModelCatalog();

const intel8: HardwareInfo = { totalRamGB: 8, appleSilicon: false, platform: 'other' };
const apple18: HardwareInfo = { totalRamGB: 18, appleSilicon: true, platform: 'darwin-arm64' };
const apple4: HardwareInfo = { totalRamGB: 4, appleSilicon: true, platform: 'darwin-arm64' };
const tiny1: HardwareInfo = { totalRamGB: 1, appleSilicon: false, platform: 'other' };

/** Max minRamGB across the catalog entries the recommendation selected. */
const minRamForStt = (modelId: string): number =>
  catalog.find((m) => m.kind === 'stt' && m.modelId === modelId)?.minRamGB ?? 0;

describe('recommendVoiceModels', () => {
  it('8 GB Intel → base STT + Kokoro, no MLX', () => {
    const rec = recommendVoiceModels(intel8, catalog);
    // tiny/base tier (not turbo — turbo is Apple-Silicon-only in our rule).
    expect(['tiny', 'base']).toContain(rec.sttModelId);
    expect(rec.sttModelId).toBe('base');
    expect(rec.ttsEngineId).toBe('kokoro-local');
    expect(rec.ttsModelId).toBeUndefined();
    expect(rec.reason).toContain('8 GB');
  });

  it('18 GB Apple Silicon → base/turbo STT + MLX TTS, reason mentions hardware', () => {
    const rec = recommendVoiceModels(apple18, catalog);
    expect(['base', 'large-v3-turbo']).toContain(rec.sttModelId);
    // Our rule: >=4 GB + Apple Silicon → turbo.
    expect(rec.sttModelId).toBe('large-v3-turbo');
    // >=16 GB Apple Silicon → recommended MLX entry.
    expect(rec.ttsEngineId).toBe('mlx-audio-local');
    expect(rec.ttsModelId).toBe('lucasnewman/f5-tts-mlx');
    expect(rec.reason).toContain('Apple Silicon');
    expect(rec.reason).toContain('18 GB');
  });

  it('4 GB machine never gets a model whose minRamGB > 4', () => {
    const rec = recommendVoiceModels(apple4, catalog);
    expect(minRamForStt(rec.sttModelId)).toBeLessThanOrEqual(4);
    // 4 GB Apple Silicon: turbo fits (minRam 4), but MLX premium (>=16) does not.
    expect(rec.ttsEngineId).toBe('kokoro-local');
    expect(rec.ttsModelId).toBeUndefined();
  });

  it('1 GB machine falls back to the bundled tiny floor', () => {
    const rec = recommendVoiceModels(tiny1, catalog);
    expect(rec.sttModelId).toBe('tiny');
    expect(rec.ttsEngineId).toBe('kokoro-local');
  });

  it('cloud entry only appears when its provider is signed in', () => {
    const cloudStt: VoiceModelEntry = {
      kind: 'stt',
      engineId: 'whisper-local',
      modelId: 'cloud-deepgram',
      label: 'Deepgram',
      sizeLabel: 'cloud',
      blurb: 'Cloud STT',
      local: false,
      requiresProvider: 'deepgram',
      minRamGB: 0,
    };
    const withCloud = buildVoiceModelCatalog([cloudStt]);

    // Not signed in → recommender never selects the cloud model.
    const recLocal = recommendVoiceModels(apple18, withCloud);
    expect(recLocal.sttModelId).not.toBe('cloud-deepgram');

    // Even when signed in, the recommender stays local-first for STT tiers,
    // but the cloud entry must at least be considered offerable (providerOk).
    // Verify gating behaviour directly: a cloud TTS entry that is recommended
    // is only picked when its provider is signed in.
    const cloudTts: VoiceModelEntry = {
      kind: 'tts',
      engineId: 'mlx-audio-local',
      modelId: 'cloud-voice',
      label: 'Cloud Voice',
      sizeLabel: 'cloud',
      blurb: 'Cloud TTS',
      platform: 'darwin-arm64',
      recommended: true,
      local: false,
      requiresProvider: 'openai',
      minRamGB: 0,
    };
    // Put the cloud recommended entry first so it would win the .find() if not gated.
    const withCloudTts = [cloudTts, ...buildVoiceModelCatalog()];

    const recNoProvider = recommendVoiceModels(apple18, withCloudTts);
    expect(recNoProvider.ttsModelId).not.toBe('cloud-voice');

    const recWithProvider = recommendVoiceModels(apple18, withCloudTts, new Set(['openai']));
    expect(recWithProvider.ttsModelId).toBe('cloud-voice');
    expect(recWithProvider.ttsEngineId).toBe('mlx-audio-local');
  });
});
