/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Descriptor for a voice runtime asset (a whisper.cpp binary, an ONNX
 * runtime library, or a model weights file). The hash is pinned in-app
 * - VoiceAssetManager never trusts a hash served by the download host.
 */
export type VoiceAsset = {
  /** Stable identifier - e.g. 'whisper-cpp-binary' or 'whisper-ggml-base'. */
  id: string;
  url: string;
  /** Absolute path where the verified asset should live after download. */
  destPath: string;
  /** Lowercase hex SHA-256 - pinned in-app, never fetched from the host. */
  sha256: string;
  /** Optional hint when the server omits Content-Length. */
  totalBytes?: number;
};

export type DownloadProgress = {
  assetId: string;
  bytesDownloaded: number;
  totalBytes: number | null;
};

export type DownloadResult = {
  assetId: string;
  destPath: string;
  /** true when the asset was already installed (no network call was made). */
  cached: boolean;
  bytesWritten: number;
  sha256: string;
};

export type VoiceAssetErrorCode =
  | 'VOICE_ASSET_OFFLINE'
  | 'VOICE_ASSET_FETCH_FAILED'
  | 'VOICE_ASSET_HASH_MISMATCH'
  | 'VOICE_ASSET_CANCELLED';
