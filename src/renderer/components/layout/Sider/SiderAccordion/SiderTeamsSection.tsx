/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * W1c - Outer accordion that subsumes the legacy SiderActiveTeams (cost meter
 * rollup) and TeamSiderSection (per-team groups + pin/rename/delete/create
 * modals + drag-pin order) into a single collapsible "Teams" section.
 *
 * Two visible sub-groups inside the body:
 *   - "Running" - the preserved cost meter rollup (one row per active team)
 *   - "My teams" - the preserved per-team groups with their own toggles
 *
 * Preservation contract (do not modify the wrapped components):
 *   - useTeamCostMeter row rendering inside SiderActiveTeams
 *   - useTeamGroupPersistence ('wayland.sider.teamGroups') stays untouched
 *   - Pin / rename / delete / create modals from TeamSiderSection
 *   - Drag-pin order infrastructure
 *
 * The OUTER accordion key (`teams` in useSiderAccordionState) is independent
 * of the per-team-group inner toggles - users keep both states across sessions.
 */

import { Users } from 'lucide-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Tooltip } from '@arco-design/web-react';
import { useTeamList } from '@renderer/pages/team/hooks/useTeamList';
import SiderActiveTeams from '@renderer/components/layout/Sider/SiderNav/SiderActiveTeams';
import TeamSiderSection from '@renderer/components/layout/Sider/TeamSiderSection';
import type { TTeam } from '@/common/types/teamTypes';
import { SiderAccordionShell } from './SiderAccordionShell';
import { useSiderAccordionState } from './useSiderAccordionState';

type SiderTooltipProps = React.ComponentProps<typeof Tooltip>;

/**
 * Union of props consumed by the two legacy sections this accordion subsumes:
 *   - SiderActiveTeams needs: pathname, collapsed, onSessionClick
 *   - TeamSiderSection needs: collapsed, pathname, siderTooltipProps, onSessionClick
 * Drop-in replaceable from Sider/index.tsx in W2.
 */
export interface SiderTeamsSectionProps {
  collapsed: boolean;
  pathname: string;
  siderTooltipProps: Partial<SiderTooltipProps>;
  onSessionClick?: () => void;
}

/** Count of agents in `active` status across every team - drives the live badge. */
const countRunningAgents = (teams: TTeam[]): number =>
  teams.reduce((acc, team) => acc + team.agents.filter((a) => a.status === 'active').length, 0);

export const SiderTeamsSection: React.FC<SiderTeamsSectionProps> = ({
  collapsed,
  pathname,
  siderTooltipProps,
  onSessionClick,
}) => {
  const { t } = useTranslation();
  const { state, toggle } = useSiderAccordionState();
  const { teams } = useTeamList();

  const liveCount = useMemo(() => countRunningAgents(teams), [teams]);
  const hasRunning = liveCount > 0;

  // v0.6.2.1 hide-when-empty: gate on whether the user has *any* teams, not on
  // whether agents are mid-call. Newly-created teams start idle (status: 'idle')
  // and would otherwise disappear from the sidebar until the first message -
  // breaks the create→see-it-in-sidebar mental model. TopZone "Teams" entry
  // still covers nav when no teams exist at all.
  if (teams.length === 0) return null;

  if (collapsed) {
    // Collapsed-mode fallback - icon-only nav. Click navigates to /teams.
    return (
      <button
        type='button'
        className='w-full h-40px flex items-center justify-center rd-7px bg-transparent border-none cursor-pointer hover:bg-fill-2 text-text-2 hover:text-text-1 relative'
        onClick={() => {
          if (typeof window !== 'undefined') window.location.hash = '#/teams';
          onSessionClick?.();
        }}
        aria-label={`${t('sider.accordion.teams')}${hasRunning ? ` (${liveCount} running)` : ''}`}
        title={`${t('sider.accordion.teams')}${hasRunning ? ` · ${liveCount} running` : ''}`}
      >
        <Users size={18} />
        {hasRunning && (
          <span
            className='absolute top-6px right-6px w-6px h-6px rounded-full bg-[rgb(var(--primary-6))] shadow-[0_0_0_2px_rgba(254,153,0,0.25)]'
            aria-hidden
          />
        )}
      </button>
    );
  }

  return (
    <SiderAccordionShell
      icon={<Users size={16} />}
      label={t('sider.accordion.teams')}
      badgeCount={liveCount}
      isLive={hasRunning}
      open={state.teams}
      onToggle={() => toggle('teams')}
      badgeAriaLabel={t('sider.accordion.running')}
      testId='sider-teams-section'
    >
      {hasRunning && (
        <div data-testid='sider-teams-running-group'>
          <div className='px-10px py-4px text-9px tracking-wide text-text-4 uppercase font-bold'>
            {t('sider.accordion.running')}
          </div>
          <SiderActiveTeams pathname={pathname} collapsed={false} onSessionClick={onSessionClick} />
        </div>
      )}

      {/* W5 fix: removed our own "My teams" header - TeamSiderSection renders
          its own group header(s). Two stacked headers was double-decoration. */}
      <div data-testid='sider-teams-myteams-group'>
        <TeamSiderSection
          collapsed={false}
          pathname={pathname}
          siderTooltipProps={siderTooltipProps}
          onSessionClick={onSessionClick}
        />
      </div>
    </SiderAccordionShell>
  );
};
