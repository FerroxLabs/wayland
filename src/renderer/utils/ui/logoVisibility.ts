/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared source of truth for the left-nav (sidebar) logo visibility (#118).
 *
 * The sidebar header carries an orbit-mark + wordmark that duplicates the logo
 * already shown in the app titlebar. This module owns the storage key, the
 * default, and the live-update event so the writer (Navigation settings pane)
 * and the reader (Layout header) stay in lock-step across windows.
 *
 * Mirrors the pattern in {@link ./sidebarWidth.ts}.
 */

export const LOGO_VISIBLE_STORAGE_KEY = 'wayland:sidebar-logo-visible';

/**
 * Default OFF: the sidebar logo is redundant with the titlebar brand, so every
 * user reclaims the vertical space unless they explicitly turn it back on (#118).
 */
export const LOGO_VISIBLE_DEFAULT = false;

/**
 * Same-document signal that visibility changed. The browser `storage` event only
 * fires in OTHER documents, so the settings pane and the live layout share one
 * window and need this custom event to update without a reload.
 */
export const LOGO_VISIBLE_UPDATED_EVENT = 'wayland-sidebar-logo-visibility-updated';

/**
 * Read the persisted sidebar-logo visibility. Returns the default for a
 * missing/blank value (and when there's no `window`).
 */
export const readLogoVisible = (): boolean => {
  if (typeof window === 'undefined') return LOGO_VISIBLE_DEFAULT;
  const raw = window.localStorage.getItem(LOGO_VISIBLE_STORAGE_KEY);
  if (raw == null || raw.trim() === '') return LOGO_VISIBLE_DEFAULT;
  return raw === 'true';
};

/**
 * Persist the sidebar-logo visibility: writes localStorage and fires
 * {@link LOGO_VISIBLE_UPDATED_EVENT} so the live layout reacts in the same
 * document. Returns the written value for convenient state mirroring.
 */
export const writeLogoVisible = (value: boolean): boolean => {
  if (typeof window === 'undefined') return value;
  window.localStorage.setItem(LOGO_VISIBLE_STORAGE_KEY, String(value));
  window.dispatchEvent(new CustomEvent(LOGO_VISIBLE_UPDATED_EVENT, { detail: value }));
  return value;
};
