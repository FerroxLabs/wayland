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

/**
 * Deliberately empty.
 *
 * It held three downloads and every one of them fed a runtime that does not
 * exist. `whisper-ggml-base` / `whisper-ggml-small` fed a whisper.cpp CLI that
 * upstream has never published for macOS and only ships as multi-file archives
 * anywhere; `kokoro-onnx-model` fed a synthesizer whose `resolveBinary` returned
 * null unconditionally. The one local engine that works - Whisper-tiny through
 * transformers.js in the renderer worker - ships bundled and downloads nothing.
 *
 * A download registered here MUST have a consumer that can run what it fetches.
 */
const REGISTRY: Record<string, RegistryEntry> = {};

/**
 * Enrich a `VoiceAsset` descriptor by id. Fills in `destPath` from the registry
 * + userData voice subtree and applies the pinned `sha256` when the caller left
 * it blank.
 *
 * An UNKNOWN id resolves to an empty `destPath`, which is what makes the
 * bridge's "no download is registered" guard bite. Echoing the caller's own
 * `destPath` back would let a compromised renderer name any path on disk and
 * have the main process write a downloaded file there.
 */
export function resolveVoiceAsset(asset: VoiceAsset): VoiceAsset {
  const entry = REGISTRY[asset.id];
  if (!entry) return { ...asset, destPath: '' };

  const baseDir = path.join(getPlatformServices().paths.getDataDir(), 'voice');
  const resolvedDest = asset.destPath?.trim() ? asset.destPath : path.join(baseDir, entry.destSubpath);
  const resolvedSha = asset.sha256?.trim() ? asset.sha256 : (entry.sha256 ?? '');
  const resolvedUrl = asset.url?.trim() ? asset.url : entry.url;

  return {
    ...asset,
    url: resolvedUrl,
    destPath: resolvedDest,
    sha256: resolvedSha,
  };
}
