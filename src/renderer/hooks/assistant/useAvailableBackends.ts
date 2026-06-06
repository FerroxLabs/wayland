import { useCallback, useMemo } from 'react';
import {
  recommendBackend,
  resolveAvailableBackends,
  type BackendId,
} from '@process/team/backends/resolveAvailableBackends';
import { useDetectedAgents } from './useDetectedAgents';

/**
 * Renderer-side wrapper around `resolveAvailableBackends` / `recommendBackend`.
 *
 * Bridges `useDetectedAgents()` (which returns `{ availableBackends: AvailableBackend[] }`)
 * into the plain `BackendId[]` shape the pure functions expect.
 *
 * `available` and `recommend` are both memoized with `detected` as the only
 * dependency, so consumers can safely include them in `useMemo` / `useEffect`
 * dep arrays without triggering re-renders on every parent update.
 */
export function useAvailableBackends() {
  const { availableBackends } = useDetectedAgents();

  const detected = useMemo<BackendId[]>(() => availableBackends.map((b) => b.id), [availableBackends]);

  const available = useMemo<BackendId[]>(() => resolveAvailableBackends(detected), [detected]);

  const recommend = useCallback(
    (presetAgentType?: string) => recommendBackend(detected, presetAgentType),
    [detected]
  );

  return { available, recommend };
}
