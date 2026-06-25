import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  recommendBackend,
  resolveAvailableBackends,
  type BackendId,
} from '@process/team/backends/resolveAvailableBackends';
import { ConfigStorage } from '@/common/config/storage';
import type { AcpInitializeResult } from '@/common/types/acpTypes';
import { getTeamCapableBackends } from '@/common/types/teamTypes';
import { useDetectedAgents } from './useDetectedAgents';

/**
 * Renderer-side wrapper around `resolveAvailableBackends` / `recommendBackend`.
 *
 * Bridges `useDetectedAgents()` (which returns `{ availableBackends: AvailableBackend[] }`)
 * into the plain `BackendId[]` shape the pure functions expect.
 *
 * Every consumer of this hook is a Team backend picker (launcher, roster,
 * per-agent swap), and Team mode requires backends that can call the `team_*`
 * MCP coordination tools. So `available` is filtered to team-capable backends:
 * the known set (gemini/claude/codex/wcore) qualifies immediately, other ACP
 * agents only when their cached initialize result advertises
 * `mcpCapabilities.stdio`. This stops non-capable backends (e.g. GitHub Copilot)
 * from being offered, which otherwise breaks orchestration to leader-only (#152).
 *
 * `recommend` is memoized with `detected` as its only dependency; `available`
 * additionally depends on the cached initialize results loaded on mount.
 */
export function useAvailableBackends() {
  const { availableBackends } = useDetectedAgents();

  const [cachedInitResults, setCachedInitResults] = useState<Record<string, AcpInitializeResult> | null>(null);

  useEffect(() => {
    let active = true;
    ConfigStorage.get('acp.cachedInitializeResult')
      .then((data) => {
        if (active) setCachedInitResults(data ?? null);
      })
      .catch((err) => console.warn('[useAvailableBackends.cachedInitializeResult]', err));
    return () => {
      active = false;
    };
  }, []);

  const detected = useMemo<BackendId[]>(() => availableBackends.map((b) => b.id), [availableBackends]);

  const available = useMemo<BackendId[]>(
    () => getTeamCapableBackends(resolveAvailableBackends(detected), cachedInitResults) as BackendId[],
    [detected, cachedInitResults]
  );

  const recommend = useCallback(
    (presetAgentType?: string) => recommendBackend(detected, presetAgentType),
    [detected]
  );

  return { available, recommend };
}
