/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { VoiceAsset } from '@/common/types/voiceAsset';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: { getDataDir: () => '/wayland-data' },
  }),
}));

import * as voiceAssetRegistry from '@process/services/voice/voiceAssetRegistry';

type RegistryModule = {
  getVoiceAsset?: (id: string) => VoiceAsset | null;
};

const requireLookup = (): ((id: string) => VoiceAsset | null) => {
  const lookup = (voiceAssetRegistry as unknown as RegistryModule).getVoiceAsset;
  expect(lookup).toBeTypeOf('function');
  return lookup!;
};

describe('getVoiceAsset', () => {
  it('returns the canonical verified Whisper base descriptor', () => {
    const getVoiceAsset = requireLookup();

    expect(getVoiceAsset('whisper-ggml-base')).toEqual({
      id: 'whisper-ggml-base',
      url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
      destPath: path.join('/wayland-data', 'voice', 'whisper', 'ggml-base.bin'),
      sha256: '60ed5bc3dd14eea856493d334349b405782ddcaf0028d4b5df4088345fba2efe',
      totalBytes: 147_951_465,
      maxBytes: 150_000_000,
    });
  });

  it('returns the canonical verified Whisper small descriptor', () => {
    const getVoiceAsset = requireLookup();

    expect(getVoiceAsset('whisper-ggml-small')).toEqual({
      id: 'whisper-ggml-small',
      url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
      destPath: path.join('/wayland-data', 'voice', 'whisper', 'ggml-small.bin'),
      sha256: '1be3a9b2063867b937e64e2ec7483364a79917e157fa98c5d94b5c1fffea987b',
      totalBytes: 487_601_967,
      maxBytes: 490_000_000,
    });
  });

  it('returns null for unknown, empty, and prototype-key ids', () => {
    const getVoiceAsset = requireLookup();

    for (const id of ['attacker-controlled', '', '__proto__', 'constructor']) {
      expect(getVoiceAsset(id)).toBeNull();
    }
  });

  it('rejects non-string runtime values and caller-like objects', () => {
    const getVoiceAsset = requireLookup();

    for (const id of [null, undefined, 0, true, {}, { id: 'whisper-ggml-base' }, ['whisper-ggml-base']]) {
      expect(getVoiceAsset(id as never)).toBeNull();
    }
  });

  it('does not select inherited properties', () => {
    const getVoiceAsset = requireLookup();
    const inherited = Object.create({ id: 'whisper-ggml-base' }) as unknown;

    expect(getVoiceAsset(inherited as never)).toBeNull();
  });
});
