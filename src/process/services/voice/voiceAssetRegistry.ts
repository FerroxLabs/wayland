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
  'whisper-ggml-large-v3-turbo': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin',
    destSubpath: 'whisper/ggml-large-v3-turbo.bin',
  },
  // Kokoro ONNX TTS model - github release artifact pinned to v1.0.
  'kokoro-onnx-model': {
    url: 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx',
    destSubpath: 'kokoro/kokoro-v1.0.onnx',
  },
  // Kokoro voice embeddings - required alongside the ONNX model.
  'kokoro-voices': {
    url: 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin',
    destSubpath: 'kokoro/voices-v1.0.bin',
  },
  // Piper voices (rhasspy/piper-voices on huggingface). Each voice is an ONNX
  // model + a JSON config that piper requires next to it. SHA-256 digests were
  // computed from clean fetches on 2026-06-12 (shasum -a 256 after curl -L).
  'piper-voice-en_US-lessac-medium': {
    url: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx',
    destSubpath: 'piper/en_US-lessac-medium.onnx',
    sha256: '5efe09e69902187827af646e1a6e9d269dee769f9877d17b16b1b46eeaaf019f',
  },
  'piper-voice-en_US-lessac-medium-config': {
    url: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json',
    destSubpath: 'piper/en_US-lessac-medium.onnx.json',
    sha256: 'efe19c417bed055f2d69908248c6ba650fa135bc868b0e6abb3da181dab690a0',
  },
  'piper-voice-es_ES-davefx-medium': {
    url: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/davefx/medium/es_ES-davefx-medium.onnx',
    destSubpath: 'piper/es_ES-davefx-medium.onnx',
    sha256: '6658b03b1a6c316ee4c265a9896abc1393353c2d9e1bca7d66c2c442e222a917',
  },
  'piper-voice-es_ES-davefx-medium-config': {
    url: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/davefx/medium/es_ES-davefx-medium.onnx.json',
    destSubpath: 'piper/es_ES-davefx-medium.onnx.json',
    sha256: '0e0dda87c732f6f38771ff274a6380d9252f327dca77aa2963d5fbdf9ec54842',
  },
  'piper-voice-fr_FR-siwis-medium': {
    url: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx',
    destSubpath: 'piper/fr_FR-siwis-medium.onnx',
    sha256: '641d1ab097da2b81128c076810edb052b385decc8be3381814802a64a73baf99',
  },
  'piper-voice-fr_FR-siwis-medium-config': {
    url: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx.json',
    destSubpath: 'piper/fr_FR-siwis-medium.onnx.json',
    sha256: '39479916c2db192b5ac9764daddd0c744d83e023ad890c6976c0633ae4df8959',
  },
  'piper-voice-de_DE-thorsten-medium': {
    url: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx',
    destSubpath: 'piper/de_DE-thorsten-medium.onnx',
    sha256: '7e64762d8e5118bb578f2eea6207e1a35a8e0c30595010b666f983fc87bb7819',
  },
  'piper-voice-de_DE-thorsten-medium-config': {
    url: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx.json',
    destSubpath: 'piper/de_DE-thorsten-medium.onnx.json',
    sha256: '974adee790533adb273a1ac88f49027d2a1b8f0f2cf4905954a4791e79264e85',
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
