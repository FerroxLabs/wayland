/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared source of truth for the desktop left-sidebar width (#84).
 *
 * The Settings > Theme > Sidebar Width slider used to write a `--sidebar-width`
 * CSS variable + a localStorage value that nothing read, so the main sidebar
 * never actually resized. This module is the single place that owns the storage
 * key, the slider range, the default, and the live-update event so both the
 * writer (DisplayModalContent) and the reader (Layout) stay in lock-step.
 */

export const SIDEBAR_WIDTH_STORAGE_KEY = 'wayland:sidebar-width';

/** Slider bounds - the persisted value is always clamped into this range. */
export const SIDEBAR_WIDTH_MIN = 200;
export const SIDEBAR_WIDTH_MAX = 400;
/** Width used when the user has never moved the slider (matches the legacy desktop sider). */
export const SIDEBAR_WIDTH_DEFAULT = 280;

/**
 * Same-document signal that the width changed. The browser `storage` event only
 * fires in OTHER documents, so the settings panel and the live layout share one
 * window and need this custom event to update without a reload.
 */
export const SIDEBAR_WIDTH_UPDATED_EVENT = 'wayland-sidebar-width-updated';

/** Clamp an arbitrary number into the slider range. */
export const clampSidebarWidth = (value: number): number =>
  Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_WIDTH_MIN, Math.round(value)));

/**
 * Read the persisted sidebar width, clamped and defaulted. Returns the default
 * for a missing/blank/non-numeric value (and when there's no `window`).
 */
export const readSidebarWidth = (): number => {
  if (typeof window === 'undefined') return SIDEBAR_WIDTH_DEFAULT;
  const raw = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
  if (raw == null || raw.trim() === '') return SIDEBAR_WIDTH_DEFAULT;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) return SIDEBAR_WIDTH_DEFAULT;
  return clampSidebarWidth(parsed);
};

/**
 * Persist a sidebar width: clamps, writes localStorage, mirrors the value to the
 * `--sidebar-width` CSS variable, and fires {@link SIDEBAR_WIDTH_UPDATED_EVENT}
 * so the live layout reacts in the same document.
 */
export const writeSidebarWidth = (value: number): number => {
  const clamped = clampSidebarWidth(value);
  if (typeof window === 'undefined') return clamped;
  window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(clamped));
  document.documentElement.style.setProperty('--sidebar-width', `${clamped}px`);
  window.dispatchEvent(new CustomEvent(SIDEBAR_WIDTH_UPDATED_EVENT, { detail: clamped }));
  return clamped;
};
