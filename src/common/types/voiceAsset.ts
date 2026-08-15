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
  /** Stable identifier, matched against the main-process asset registry. */
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
  | 'VOICE_ASSET_CANCELLED'
  /** No download exists for this component on this platform - not a transient failure. */
  | 'VOICE_ASSET_UNAVAILABLE'
  | 'VOICE_ASSET_FAILED';

/**
 * Why a download reports failure as a RESULT and never as a rejection.
 *
 * The IPC transport has no error channel: `buildProvider(...).provider(fn)`
 * calls `fn(data).then(emit)` with no `.catch`, and the matching `invoke` is a
 * `new Promise(resolve)` with no reject and no timeout. A provider that throws
 * therefore leaves the renderer's `await` pending FOREVER. For this channel
 * that meant a failed download - an offline host, a 404, a hash mismatch -
 * pinned the progress bar at "downloading" permanently, with no error, no
 * retry, and no way back except reloading the window. Verified by executing
 * the real transport: a rejecting provider never settles its invoke, while a
 * resolving one settles normally.
 *
 * `speechToText.transcribe` and `voiceSynth.speak` already return their
 * failures this way. This is their sibling and must do the same.
 */
export type VoiceAssetDownloadOutcome =
  | { ok: true; result: DownloadResult }
  | { ok: false; errorCode: VoiceAssetErrorCode; detail?: string };
