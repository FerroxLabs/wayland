/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPlatformServices } from '@/common/platform';
import type { VoiceAsset } from '@/common/types/voiceAsset';
import path from 'node:path';

type RegistryEntry = {
  url: string;
  destSubpath: string;
  sha256: string;
  totalBytes: number;
  maxBytes: number;
};

const REGISTRY: Readonly<Record<string, RegistryEntry>> = {
  'whisper-ggml-base': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
    destSubpath: 'whisper/ggml-base.bin',
    sha256: '60ed5bc3dd14eea856493d334349b405782ddcaf0028d4b5df4088345fba2efe',
    totalBytes: 147_951_465,
    maxBytes: 150_000_000,
  },
  'whisper-ggml-small': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
    destSubpath: 'whisper/ggml-small.bin',
    sha256: '1be3a9b2063867b937e64e2ec7483364a79917e157fa98c5d94b5c1fffea987b',
    totalBytes: 487_601_967,
    maxBytes: 490_000_000,
  },
};

/** Returns a main-owned voice asset descriptor for a registered identifier. */
export function getVoiceAsset(id: string): VoiceAsset | null {
  if (typeof id !== 'string' || id.length === 0 || !Object.prototype.hasOwnProperty.call(REGISTRY, id)) {
    return null;
  }

  const entry = REGISTRY[id];
  const baseDir = path.join(getPlatformServices().paths.getDataDir(), 'voice');
  return {
    id,
    url: entry.url,
    destPath: path.join(baseDir, entry.destSubpath),
    sha256: entry.sha256,
    totalBytes: entry.totalBytes,
    maxBytes: entry.maxBytes,
  };
}
