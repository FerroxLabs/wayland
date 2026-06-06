// src/renderer/pages/team/hooks/useStandingEligibility.ts
//
// W3b - Eligibility predicate for the Promote-to-Standing CTA. A team becomes
// eligible after 5 sessions OR 14 days since first activity. The counters
// (sessionCount + firstActiveAt) are persisted on TTeam and bumped lazily by
// TeamSessionService.getOrStartSession.

import { useMemo } from 'react';
import type { TTeam } from '@/common/types/teamTypes';

const FIVE_SESSIONS = 5;
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export type StandingEligibility = {
  /** True when the team meets the "5 sessions OR 14 days" bar. */
  eligible: boolean;
  /** Sessions remaining to reach the 5-session threshold (0 if already met). */
  sessionsRemaining: number;
  /** Days remaining to reach the 14-day threshold (0 if already met or firstActiveAt unknown). */
  daysRemaining: number;
};

type EligibilityInput = Pick<TTeam, 'sessionCount' | 'firstActiveAt'> | null | undefined;

export const useStandingEligibility = (team: EligibilityInput): StandingEligibility => {
  return useMemo(() => {
    const sessionCount = team?.sessionCount ?? 0;
    const firstActiveAt = team?.firstActiveAt;
    const sessionsRemaining = Math.max(0, FIVE_SESSIONS - sessionCount);
    const ageMs = firstActiveAt ? Date.now() - firstActiveAt : 0;
    const daysRemaining = firstActiveAt ? Math.max(0, Math.ceil((FOURTEEN_DAYS_MS - ageMs) / ONE_DAY_MS)) : 14;
    const eligible = sessionCount >= FIVE_SESSIONS || (firstActiveAt !== undefined && ageMs >= FOURTEEN_DAYS_MS);
    return { eligible, sessionsRemaining, daysRemaining };
  }, [team?.sessionCount, team?.firstActiveAt]);
};
