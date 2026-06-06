// src/renderer/pages/team/hooks/useTeamSourceLauncher.ts
//
// Best-effort lookup of the bundle launcher that spawned this team. Used
// by W2c to surface launcher-only metadata (rituals + Standing badge) in
// the team page header + right rail.
//
// Prefers team.sourceLauncherId (persisted at create-time); falls back to
// case-insensitive name match for legacy teams created before v36.

import { useMemo } from 'react';
import type { AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';
import { useAssistantList } from '@/renderer/hooks/assistant';

export type UseTeamSourceLauncherResult = {
  launcher: AssistantListItem | null;
};

export type UseTeamSourceLauncherInput = {
  name: string;
  sourceLauncherId?: string;
} | null | undefined;

const resolveLauncherName = (launcher: AssistantListItem, localeKey: string): string => {
  const localized = launcher.nameI18n?.[localeKey];
  if (localized) return localized;
  const en = launcher.nameI18n?.['en-US'];
  if (en) return en;
  return launcher.name ?? '';
};

export const useTeamSourceLauncher = (team: UseTeamSourceLauncherInput): UseTeamSourceLauncherResult => {
  const { assistants, localeKey } = useAssistantList();

  const launcher = useMemo<AssistantListItem | null>(() => {
    if (!team) return null;

    // Strict ID match (preferred): when the team carries a sourceLauncherId
    // we honor it exclusively. A stale ID returns null rather than falling
    // back to name match - that would silently re-bind to an unrelated
    // launcher after the source bundle was uninstalled.
    if (team.sourceLauncherId) {
      for (const a of assistants) {
        if (a._kind === 'team' && a.id === team.sourceLauncherId) return a;
      }
      return null;
    }

    // Legacy name-match fallback for teams created before v36.
    if (!team.name) return null;
    const needle = team.name.trim().toLowerCase();
    if (!needle) return null;
    for (const a of assistants) {
      if (a._kind !== 'team') continue;
      const resolved = resolveLauncherName(a, localeKey).trim().toLowerCase();
      if (resolved && resolved === needle) return a;
    }
    return null;
  }, [assistants, localeKey, team]);

  return { launcher };
};
