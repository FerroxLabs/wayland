/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

const WORKSPACE_UPDATE_TIME_KEY = 'wayland_workspace_update_time';

/**
 * Get the last update time for a workspace
 */
export const getWorkspaceUpdateTime = (workspace: string): number => {
  try {
    const stored = localStorage.getItem(WORKSPACE_UPDATE_TIME_KEY);
    if (stored) {
      const times = JSON.parse(stored) as Record<string, number>;
      return times[workspace] || 0;
    }
  } catch {
    // Ignore parsing errors and fall back to default
  }
  return 0;
};

/**
 * Update the last update time for a workspace
 * Call this when creating a new conversation
 */
export const updateWorkspaceTime = (workspace: string): void => {
  try {
    const stored = localStorage.getItem(WORKSPACE_UPDATE_TIME_KEY);
    const times = stored ? JSON.parse(stored) : {};
    times[workspace] = Date.now();
    localStorage.setItem(WORKSPACE_UPDATE_TIME_KEY, JSON.stringify(times));
  } catch (error) {
    console.error('[WorkspaceHistory] Failed to update workspace time:', error);
  }
};
