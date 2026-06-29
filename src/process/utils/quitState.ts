/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Whether the app is intentionally quitting (vs. hiding to tray).
 *
 * Kept in a tiny standalone module — deliberately separate from the heavy tray
 * UI module (`tray.ts`, which pulls i18n + the worker task manager) — so any
 * quit-path code can read/flip the flag without dragging those dependencies in.
 * The auto-updater needs exactly this during the macOS install handoff (#286).
 *
 * `tray.ts` re-exports {@link getIsQuitting} / {@link setIsQuitting} so existing
 * import sites keep working unchanged.
 */
let isQuitting = false;

export const getIsQuitting = (): boolean => isQuitting;

export const setIsQuitting = (quitting: boolean): void => {
  isQuitting = quitting;
};
