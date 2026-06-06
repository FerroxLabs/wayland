/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState } from 'react';

const STORAGE_KEY = 'wayland.sider.teamGroups';

type TeamGroupState = Record<string, { expanded: boolean }>;

function readState(): TeamGroupState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      // Coerce to the expected shape, defending against partially corrupted entries.
      const result: TeamGroupState = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (v && typeof v === 'object' && 'expanded' in (v as Record<string, unknown>)) {
          result[k] = { expanded: Boolean((v as { expanded: unknown }).expanded) };
        }
      }
      return result;
    }
    return {};
  } catch {
    return {};
  }
}

function writeState(state: TeamGroupState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage write failures (quota, private mode) are non-actionable here.
  }
}

/**
 * Persists collapsed/expanded state for sidebar team groups in localStorage.
 *
 * Default behaviour on first run (no entry in storage) is **expanded**, which
 * matches the previous flat-list visual where teammates were always visible.
 *
 * Returns:
 *  - `isExpanded(teamId)` - whether the team's group is open
 *  - `toggle(teamId)` - flip and persist
 */
export function useTeamGroupPersistence(): {
  isExpanded: (teamId: string) => boolean;
  toggle: (teamId: string) => void;
} {
  const [state, setState] = useState<TeamGroupState>(() => readState());

  const isExpanded = useCallback(
    (teamId: string): boolean => {
      const entry = state[teamId];
      return entry ? entry.expanded : true;
    },
    [state]
  );

  const toggle = useCallback((teamId: string) => {
    setState((prev) => {
      const current = prev[teamId]?.expanded ?? true;
      const next: TeamGroupState = { ...prev, [teamId]: { expanded: !current } };
      writeState(next);
      return next;
    });
  }, []);

  return { isExpanded, toggle };
}

// Exported for tests only.
export const __TEAM_GROUP_STORAGE_KEY = STORAGE_KEY;
