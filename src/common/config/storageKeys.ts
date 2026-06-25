/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Centralized localStorage keys for the application
 *
 * All localStorage keys should be defined here to:
 * - Avoid key conflicts
 * - Make it easy to find and manage all persisted states
 * - Provide a single source of truth for storage key names
 */
export const STORAGE_KEYS = {
  /** Workspace tree collapse state */
  WORKSPACE_TREE_COLLAPSE: 'wayland_workspace_collapse_state',

  /** Workspace panel collapse state */
  WORKSPACE_PANEL_COLLAPSE: 'wayland_workspace_panel_collapsed',

  /** Conversation tabs state */
  CONVERSATION_TABS: 'wayland_conversation_tabs',

  /** Sidebar collapse state */
  SIDEBAR_COLLAPSE: 'wayland_sider_collapsed',

  /** Theme preference */
  THEME: 'wayland_theme',

  /** Language preference */
  LANGUAGE: 'wayland_language',

  /** Flux Status sidebar widget dismissed by the user */
  FLUX_ENTRY_DISMISSED: 'wayland_flux_entry_dismissed',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
