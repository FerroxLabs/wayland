/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GitHubReleaseAsset {
  name: string;
  /** Primary download URL - rewritten to CDN for faster download. */
  url: string;
  /** Original GitHub download URL - used as fallback when CDN fails. */
  fallbackUrl?: string;
  size: number;
  contentType?: string;
}

export interface UpdateReleaseInfo {
  tagName: string;
  version: string;
  name?: string;
  body?: string;
  htmlUrl: string;
  publishedAt?: string;
  prerelease: boolean;
  draft: boolean;
  assets: GitHubReleaseAsset[];
  recommendedAsset?: GitHubReleaseAsset;
}

export interface UpdateCheckResult {
  currentVersion: string;
  updateAvailable: boolean;
  latest?: UpdateReleaseInfo;
  ijfw?: IjfwUpdateStatus;
}

export interface IjfwUpdateStatus {
  installed: boolean;
  currentVersion?: string;
  latestVersion?: string | null;
  updateAvailable: boolean;
  offline?: boolean;
  detectedVia: 'directory' | 'symlink' | 'cli' | 'none';
  cliOnPath?: boolean;
  mcpServerPath?: string;
  commandPath?: string;
  pathHealthy: boolean;
  error?: string;
}

export interface UpdateCheckRequest {
  includePrerelease?: boolean;
  /** Defaults to FerroxLabs/wayland when omitted */
  repo?: string;
}

export interface UpdateDownloadRequest {
  url: string;
  /** Fallback URL tried when the primary URL fails (e.g. CDN down). */
  fallbackUrl?: string;
  fileName?: string;
  /**
   * Release tag the asset belongs to (e.g. `v1.2.3`). Required so the main
   * process can locate the signed electron-updater metadata (`latest*.yml`)
   * on the GitHub release and verify the downloaded artifact's sha512 before
   * the renderer is allowed to open/run it. When omitted, integrity
   * verification cannot run and the download is refused (fail-closed).
   */
  tagName?: string;
  /** Repo (`owner/name`) the release lives in; defaults to the trusted repo. */
  repo?: string;
}

export interface UpdateDownloadResult {
  downloadId: string;
  filePath: string;
}

export type UpdateDownloadStatus = 'starting' | 'downloading' | 'completed' | 'error' | 'cancelled';

export interface UpdateDownloadProgressEvent {
  downloadId: string;
  status: UpdateDownloadStatus;
  receivedBytes: number;
  totalBytes?: number;
  percent?: number;
  bytesPerSecond?: number;
  filePath?: string;
  error?: string;
}

// Auto-updater status types (electron-updater)
export type AutoUpdateStatusType =
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'
  | 'cancelled';

export interface AutoUpdateProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export interface AutoUpdateStatus {
  status: AutoUpdateStatusType;
  version?: string;
  releaseDate?: string;
  releaseNotes?: string;
  progress?: AutoUpdateProgress;
  error?: string;
}
