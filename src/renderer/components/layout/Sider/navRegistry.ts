/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Canonical registry of the toggleable left-nav destinations (#118).
 *
 * Mission Control is intentionally NOT in this list: it is pinned first and
 * always visible (the live dashboard hub). Every other top-zone destination is
 * individually hideable from Settings → Navigation; hidden items stay reachable
 * from that pane (the "manage nav" control).
 *
 * The order here is the canonical display order used by the settings pane. The
 * Sider renders the matching bespoke entry components in the same order, with
 * Mission Control pinned ahead of them.
 */

export type NavItemId =
  | 'conversations'
  | 'search'
  | 'projects'
  | 'assistants'
  | 'workflows'
  | 'scheduled'
  | 'teams'
  | 'memory';

export type NavItemMeta = {
  /** Stable id persisted in the hidden-set; never localize or reorder-sensitive. */
  id: NavItemId;
  /** i18n key for the human label shown in the Navigation settings pane. */
  labelKey: string;
};

/** Toggleable nav items in canonical display order (Mission Control excluded). */
export const TOGGLEABLE_NAV_ITEMS: NavItemMeta[] = [
  { id: 'conversations', labelKey: 'sider.navItems.conversations' },
  { id: 'search', labelKey: 'sider.navItems.search' },
  { id: 'projects', labelKey: 'sider.navItems.projects' },
  { id: 'assistants', labelKey: 'sider.navItems.assistants' },
  { id: 'workflows', labelKey: 'sider.navItems.workflows' },
  { id: 'scheduled', labelKey: 'sider.navItems.scheduled' },
  { id: 'teams', labelKey: 'sider.navItems.teams' },
  { id: 'memory', labelKey: 'sider.navItems.memory' },
];

/** All toggleable ids, in canonical order. */
export const TOGGLEABLE_NAV_ITEM_IDS: NavItemId[] = TOGGLEABLE_NAV_ITEMS.map((item) => item.id);

const NAV_ITEM_ID_SET = new Set<string>(TOGGLEABLE_NAV_ITEM_IDS);

/** Type guard: is the given string a known toggleable nav id? */
export const isNavItemId = (value: string): value is NavItemId => NAV_ITEM_ID_SET.has(value);
