/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Wire types for the in-app Wayland Core engine updater, shared between the
 * main-process updater (`wcoreUpdater`) and the typed renderer adapter
 * (`ipcBridge.wcoreUpdate`). Kept in `common` so neither side owns the shape.
 */

/** Result of an engine update check. */
export type WCoreUpdateCheck = {
  /** Installed engine version (e.g. `0.12.2`), or `null` if undetectable. */
  current: string | null;
  /** Latest released version (e.g. `0.12.3`), or `null` if the check failed. */
  latest: string | null;
  /** Latest release tag (e.g. `v0.12.3`), passed back to `install`. */
  tag: string | null;
  /** True when `latest` is strictly newer than `current`. */
  updateAvailable: boolean;
  /** Release page URL, for a "what's new" link. */
  htmlUrl: string | null;
  /** Populated when the check could not complete. */
  error?: string;
};

/** A phase of the install, streamed to the renderer for progress UI. */
export type WCoreUpdateProgress = {
  phase: 'downloading' | 'verifying' | 'extracting' | 'installing' | 'done' | 'error';
  /** 0-100, only meaningful during `downloading`. */
  percent?: number;
  message?: string;
};

/** Result of an install attempt. `staged` is set when the new binary could not
 *  replace the running engine in place (Windows lock) and was staged to apply on
 *  the next app restart instead. The renderer shows the same "restart to apply"
 *  message either way. */
export type WCoreInstallResult =
  | { ok: true; version: string; staged?: boolean }
  | { ok: false; error: string };

/** Request payload for `wcoreUpdate.install`. */
export type WCoreInstallRequest = { tag: string };
