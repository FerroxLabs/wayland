/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { isNavItemId, type NavItemId } from '@renderer/components/layout/Sider/navRegistry';

/**
 * Shared source of truth for per-item left-nav visibility (#118).
 *
 * Persists the SET OF HIDDEN nav-item ids (default empty = everything visible).
 * Storing the hidden set — rather than the visible set — means any nav item
 * added in the future defaults to visible without a migration.
 *
 * Mirrors the storage + live-update-event pattern in {@link ./sidebarWidth.ts}
 * so the settings pane (writer) and the Sider (reader) stay in lock-step across
 * windows.
 */

export const SIDER_HIDDEN_ITEMS_STORAGE_KEY = 'wayland:sidebar-hidden-nav-items';

/**
 * Same-document signal that the hidden set changed. The browser `storage` event
 * only fires in OTHER documents, so the settings pane and the live Sider share
 * one window and need this custom event to update without a reload.
 */
export const SIDER_VISIBILITY_UPDATED_EVENT = 'wayland-sidebar-visibility-updated';

/**
 * Read the persisted hidden-item ids, filtered to known nav ids. Returns an
 * empty array for a missing/blank/malformed value (and when there's no
 * `window`) — i.e. everything visible.
 */
export const readHiddenNavItems = (): NavItemId[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SIDER_HIDDEN_ITEMS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is NavItemId => typeof item === 'string' && isNavItemId(item));
  } catch {
    return [];
  }
};

/**
 * Persist the hidden-item ids: writes localStorage and fires
 * {@link SIDER_VISIBILITY_UPDATED_EVENT} so the live Sider reacts in the same
 * document. Duplicate / unknown ids are dropped before writing.
 */
export const writeHiddenNavItems = (ids: NavItemId[]): void => {
  if (typeof window === 'undefined') return;
  const clean = Array.from(new Set(ids.filter((id) => isNavItemId(id))));
  window.localStorage.setItem(SIDER_HIDDEN_ITEMS_STORAGE_KEY, JSON.stringify(clean));
  window.dispatchEvent(new CustomEvent(SIDER_VISIBILITY_UPDATED_EVENT, { detail: clean }));
};

/** Return the hidden set with `id` toggled (added if visible, removed if hidden). */
export const toggleHiddenNavItem = (hidden: NavItemId[], id: NavItemId): NavItemId[] =>
  hidden.includes(id) ? hidden.filter((item) => item !== id) : [...hidden, id];
