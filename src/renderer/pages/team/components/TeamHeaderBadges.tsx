// src/renderer/pages/team/components/TeamHeaderBadges.tsx
//
// W2c - Header badge cluster for the team page:
//   - Standing badge (purple dot + "Standing") when the team's source
//     launcher is in the locked Standing set OR the user has promoted it
//   - Backend rollup ("3 × Claude, 2 × Gemini") computed from team.agents
//     grouped by agentType
//
// W3b - Adds the Promote-to-Standing CTA + Demote action:
//   - When the team is NOT standing and eligibility says eligible, render a
//     small "Promote to Standing" pill that calls back to the parent.
//   - When the team IS standing because the user promoted it (not because the
//     bundle launcher is Standing), render a small Demote button next to the
//     badge.
//
// Source launcher resolution is best-effort via useTeamSourceLauncher. If we
// can't match a launcher we just omit the bundle Standing badge - the rollup
// still renders because it derives from `agents` directly.

import { Button } from '@arco-design/web-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';
import type { TeamAgent, TTeam } from '@/common/types/teamTypes';
import { getBackendLabel } from '@renderer/utils/model/backendLabel';
import type { StandingEligibility } from '../hooks/useStandingEligibility';

type Props = {
  agents: TeamAgent[];
  launcher: AssistantListItem | null;
  team?: TTeam | null;
  eligibility?: StandingEligibility;
  onPromoteClick?: () => void;
  onDemote?: () => void;
};

const TeamHeaderBadges: React.FC<Props> = ({ agents, launcher, team, eligibility, onPromoteClick, onDemote }) => {
  const { t } = useTranslation();
  const bundleStanding = launcher?._standing === true;
  const userPromoted = team?.promotedToStanding === true;
  const isStanding = bundleStanding || userPromoted;
  // User-only standing: the demote affordance is meaningful only when the
  // team was promoted by the user. Bundle-derived Standing is immutable.
  const isUserOnlyStanding = userPromoted && !bundleStanding;

  const rollupText = useMemo(() => {
    if (agents.length === 0) return '';
    const counts = new Map<string, number>();
    for (const a of agents) {
      counts.set(a.agentType, (counts.get(a.agentType) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([type, count]) => `${count} × ${getBackendLabel(type)}`)
      .join(', ');
  }, [agents]);

  // Show the Promote CTA only when not yet standing AND eligibility predicate
  // says the team has earned it. Parent owns the modal open state.
  const showPromoteCta = !isStanding && eligibility?.eligible === true && Boolean(onPromoteClick);

  return (
    <div data-testid='team-header-badges' className='flex items-center gap-8px'>
      {isStanding && (
        <span
          data-testid='team-header-standing-badge'
          className='inline-flex items-center gap-4px px-6px py-2px rd-4px text-10px font-medium uppercase tracking-wider'
          style={{
            background: 'color-mix(in srgb, var(--color-primary-6) 12%, transparent)',
            color: 'var(--color-primary-6)',
          }}
        >
          <span
            className='w-1.5 h-1.5 rd-full inline-block'
            style={{ background: 'var(--color-primary-6)' }}
            aria-hidden='true'
          />
          {t('teams.standingBadge', { defaultValue: 'Standing' })}
        </span>
      )}
      {isUserOnlyStanding && onDemote && (
        <Button
          size='mini'
          type='outline'
          status='default'
          onClick={onDemote}
          data-testid='team-header-demote'
          style={{ borderRadius: 6, fontSize: 11, paddingInline: 8 }}
        >
          {t('teams.standing.demoteAction', { defaultValue: 'Demote' })}
        </Button>
      )}
      {showPromoteCta && (
        <Button
          size='mini'
          type='outline'
          onClick={onPromoteClick}
          data-testid='team-header-promote'
          style={{ borderRadius: 6, fontSize: 11, paddingInline: 8 }}
        >
          {t('teams.standing.promoteCta', { defaultValue: 'Promote to Standing' })}
        </Button>
      )}
      {rollupText && (
        <span
          data-testid='team-header-backend-rollup'
          className='text-11px text-[color:var(--color-text-3)] whitespace-nowrap'
        >
          {rollupText}
        </span>
      )}
    </div>
  );
};

export default TeamHeaderBadges;
