// src/renderer/components/layout/Sider/SiderNav/SiderActiveTeams.tsx
//
// W2d - "Active" section in the left sidebar. Lists currently-running
// teams with a per-team token + USD rollup pulled from
// `team_event_log.token_usage` rows (W1e + W2c infrastructure).
//
// "Active" = any agent in the team has `status === 'active'`. TTeam has
// no explicit running flag; per-agent status is the most reliable signal
// the renderer has today.
//
// Rendering rules:
//   - Hidden when no teams are active (no empty stub row in the sider).
//   - Hidden when the sider is collapsed - the rollup text needs width
//     the collapsed rail does not have. Collapsed users still see the
//     existing TeamSiderSection icons.
//   - Click a row → navigate to `/team/${teamId}` (TeamPage).

import { Activity, Users } from 'lucide-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import { useTeamList } from '@renderer/pages/team/hooks/useTeamList';
import { useTeamCostMeter } from '@renderer/hooks/team/useTeamCostMeter';
import { getBackendLabel } from '@renderer/utils/model/backendLabel';
import { formatTokenCount, formatUsd } from '@renderer/utils/format/tokens';
import { cleanupSiderTooltips } from '@renderer/utils/ui/siderTooltip';
import { blurActiveElement } from '@renderer/utils/ui/focus';
import type { TTeam } from '@/common/types/teamTypes';
import AssistantIconTile from '@/renderer/pages/guid/components/AssistantIconTile';
import { resolveTeamPalette } from '@/renderer/pages/teams/components/teamPalette';
import { useAssistantList } from '@/renderer/hooks/assistant';

interface SiderActiveTeamsProps {
  pathname: string;
  collapsed: boolean;
  onSessionClick?: () => void;
}

/** Compact backend rollup ("Claude · Gemini") for a team. */
const buildBackendRollup = (team: TTeam): string => {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const agent of team.agents) {
    if (seen.has(agent.agentType)) continue;
    seen.add(agent.agentType);
    labels.push(getBackendLabel(agent.agentType));
  }
  return labels.join(' · ');
};

const isTeamRunning = (team: TTeam): boolean => team.agents.some((a) => a.status === 'active');

/** Single row - meter is hook-driven so each team polls independently. */
const ActiveTeamRow: React.FC<{
  team: TTeam;
  isActive: boolean;
  onClick: () => void;
  launcher?: ReturnType<typeof useAssistantList>['assistants'][number];
}> = ({ team, isActive, onClick, launcher }) => {
  const { t } = useTranslation();
  const { totalTokens, totalUsd } = useTeamCostMeter(team.id);
  const backendRollup = useMemo(() => buildBackendRollup(team), [team]);
  const palette = resolveTeamPalette(launcher, team.sourceLauncherId ?? team.name);
  const rollupText = t('teams.activeSidebar.rollup', {
    defaultValue: '{{tokens}} tokens · ~{{usd}} this week',
    tokens: formatTokenCount(totalTokens),
    usd: formatUsd(totalUsd),
  });

  return (
    <div
      data-testid={`sider-active-team-${team.id}`}
      onClick={onClick}
      className={classNames(
        'flex items-start gap-8px px-8px py-6px rd-6px cursor-pointer transition-colors',
        isActive ? 'bg-[rgba(var(--primary-6),0.12)]' : 'hover:bg-fill-3'
      )}
    >
      <AssistantIconTile paletteKey={palette} size='sm' className='!w-20px !h-20px shrink-0 mt-2px'>
        <Users size={12} />
      </AssistantIconTile>
      <div className='min-w-0 flex-1'>
        <div className='text-12.5px font-medium text-[color:var(--color-text-1)] truncate'>{team.name}</div>
        {backendRollup && (
          <div className='text-10.5px text-[color:var(--color-text-4)] truncate'>{backendRollup}</div>
        )}
        <div
          data-testid={`sider-active-team-rollup-${team.id}`}
          className='text-10.5px text-[color:var(--color-text-3)] truncate mt-2px'
        >
          {rollupText}
        </div>
      </div>
    </div>
  );
};

const SiderActiveTeams: React.FC<SiderActiveTeamsProps> = ({ pathname, collapsed, onSessionClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { teams } = useTeamList();
  const { assistants } = useAssistantList();

  const activeTeams = useMemo(() => teams.filter(isTeamRunning), [teams]);

  if (collapsed || activeTeams.length === 0) return null;

  const handleClick = (teamId: string): void => {
    cleanupSiderTooltips();
    blurActiveElement();
    Promise.resolve(navigate(`/team/${teamId}`)).catch(console.error);
    if (onSessionClick) onSessionClick();
  };

  return (
    <div data-testid='sider-active-teams' className='shrink-0 flex flex-col gap-2px px-4px mb-8px'>
      <div className='flex items-center gap-6px px-8px pt-6px pb-4px'>
        <Activity size={11} className='text-[color:var(--color-text-2)]' />
        <span className='text-11px font-semibold text-[color:var(--color-text-3)] uppercase tracking-wider'>
          {t('teams.activeSidebar.title', { defaultValue: 'Active' })}
        </span>
      </div>
      {activeTeams.map((team) => {
        const launcher = team.sourceLauncherId
          ? assistants.find((a) => a.id === team.sourceLauncherId)
          : undefined;
        return (
          <ActiveTeamRow
            key={team.id}
            team={team}
            isActive={pathname.startsWith(`/team/${team.id}`)}
            onClick={() => handleClick(team.id)}
            launcher={launcher}
          />
        );
      })}
    </div>
  );
};

export default SiderActiveTeams;
