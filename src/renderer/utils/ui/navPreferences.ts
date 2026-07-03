/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared source of truth for the left-navigation appearance preferences (#118):
 *
 * - The titlebar brand lockup (logo) can be hidden.
 * - Individual sider nav entries can be hidden (persisted as a "hidden-set" of
 *   entry ids; anything not in the set stays visible, so a nav entry added in a
 *   later release defaults to shown).
 *
 * Mirrors {@link ./sidebarWidth}: localStorage is the store, a same-document
 * CustomEvent lets the live UI react without a reload, and the consuming hooks
 * additionally listen to the cross-document `storage` event for a second window.
 */

export const TITLEBAR_BRAND_HIDDEN_KEY = 'wayland:titlebar-brand-hidden';
export const SIDER_NAV_HIDDEN_IDS_KEY = 'wayland:sider-nav-hidden-ids';

/**
 * Same-document signal that a nav preference changed. The browser `storage`
 * event only fires in OTHER documents, so the settings panel and the live
 * layout share one window and need this custom event to update without reload.
 */
export const NAV_PREFS_UPDATED_EVENT = 'wayland-nav-prefs-updated';

const isBrowser = (): boolean => typeof window !== 'undefined';

const emitNavPrefsUpdated = (): void => {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(NAV_PREFS_UPDATED_EVENT));
};

/** Read whether the titlebar brand (logo) is hidden. Defaults to shown. */
export const readTitlebarBrandHidden = (): boolean => {
  if (!isBrowser()) return false;
  try {
    // getItem can throw in Chromium when site-data is blocked/partitioned;
    // this runs during Titlebar render, so degrade to "shown" instead of
    // crashing the top-level chrome.
    return window.localStorage.getItem(TITLEBAR_BRAND_HIDDEN_KEY) === 'true';
  } catch {
    return false;
  }
};

/** Persist the titlebar-brand hidden flag and broadcast the change. */
export const writeTitlebarBrandHidden = (hidden: boolean): boolean => {
  if (!isBrowser()) return hidden;
  try {
    window.localStorage.setItem(TITLEBAR_BRAND_HIDDEN_KEY, hidden ? 'true' : 'false');
  } catch {
    // Storage unavailable (private mode / quota / partitioned): still broadcast
    // so listeners re-read a consistent value rather than throwing in a handler.
  }
  emitNavPrefsUpdated();
  return hidden;
};

/**
 * Read the set of hidden sider-nav entry ids, deduplicated. Returns an empty
 * array for a missing/blank/malformed value (everything visible).
 */
export const readHiddenSiderNavIds = (): string[] => {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(SIDER_NAV_HIDDEN_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return Array.from(new Set(parsed.filter((value): value is string => typeof value === 'string')));
  } catch {
    return [];
  }
};

/** Persist the hidden-set (deduplicated) and broadcast the change. */
export const writeHiddenSiderNavIds = (ids: string[]): string[] => {
  const unique = Array.from(new Set(ids));
  if (!isBrowser()) return unique;
  try {
    window.localStorage.setItem(SIDER_NAV_HIDDEN_IDS_KEY, JSON.stringify(unique));
  } catch {
    // Storage unavailable: degrade without throwing inside the toggle handler.
  }
  emitNavPrefsUpdated();
  return unique;
};

/**
 * Toggle a single nav entry's visibility. `hidden === true` adds it to the
 * hidden-set; `false` removes it. Returns the resulting hidden-set.
 */
export const setSiderNavHidden = (id: string, hidden: boolean): string[] => {
  const current = new Set(readHiddenSiderNavIds());
  if (hidden) {
    current.add(id);
  } else {
    current.delete(id);
  }
  return writeHiddenSiderNavIds(Array.from(current));
};

/** Clear all nav preferences (logo shown, every entry visible) and broadcast. */
export const resetNavPreferences = (): void => {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(TITLEBAR_BRAND_HIDDEN_KEY);
    window.localStorage.removeItem(SIDER_NAV_HIDDEN_IDS_KEY);
  } catch {
    // Storage unavailable: nothing persisted, still broadcast to reset the UI.
  }
  emitNavPrefsUpdated();
};
