/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Server-side registry of known voice-runtime assets.
 *
 * The renderer descriptor only carries `id` + `url`; the main process is the
 * authority on filesystem paths (no renderer-controlled writes outside the
 * sandbox) and on the pinned SHA-256 hashes that VoiceAssetManager checks
 * against. When the renderer's downstream IPC hits voiceAssetBridge, the
 * bridge enriches the descriptor by id against this map.
 *
 * Adding a new asset:
 *   - put its id + URL here
 *   - fill `sha256` from upstream when known; leave undefined to download
 *     unverified (logged warning at download time)
 *   - `destSubpath` is appended under `<userData>/voice/`
 */

import path from 'node:path';
import { getPlatformServices } from '@/common/platform';
import type { VoiceAsset } from '@/common/types/voiceAsset';

type RegistryEntry = {
  url: string;
  destSubpath: string;
  sha256?: string;
};

const REGISTRY: Record<string, RegistryEntry> = {
  // Whisper.cpp GGML models - public huggingface mirror under ggerganov.
  // SHA-256 left undefined; the manager will accept the file without an
  // integrity gate and log a warning. Pin these once the team confirms the
  // canonical hashes (e.g. `shasum -a 256 ggml-base.bin` after a clean fetch).
  'whisper-ggml-base': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
    destSubpath: 'whisper/ggml-base.bin',
  },
  'whisper-ggml-small': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
    destSubpath: 'whisper/ggml-small.bin',
  },
  // Kokoro ONNX TTS model - github release artifact pinned to v1.0.
  'kokoro-onnx-model': {
    url: 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx',
    destSubpath: 'kokoro/kokoro-v1.0.onnx',
  },
};

/**
 * Enrich a renderer-supplied `VoiceAsset` descriptor by id. Fills in
 * `destPath` from the registry + userData voice subtree, and applies the
 * pinned `sha256` when the renderer left it blank. Renderer-supplied non-
 * empty fields win - letting callers override for tests / dev.
 */
export function resolveVoiceAsset(asset: VoiceAsset): VoiceAsset {
  const entry = REGISTRY[asset.id];
  if (!entry) return asset;

  const baseDir = path.join(getPlatformServices().paths.getDataDir(), 'voice');
  const resolvedDest = asset.destPath?.trim() ? asset.destPath : path.join(baseDir, entry.destSubpath);
  const resolvedSha = asset.sha256?.trim() ? asset.sha256 : entry.sha256 ?? '';
  const resolvedUrl = asset.url?.trim() ? asset.url : entry.url;

  return {
    ...asset,
    url: resolvedUrl,
    destPath: resolvedDest,
    sha256: resolvedSha,
  };
}
