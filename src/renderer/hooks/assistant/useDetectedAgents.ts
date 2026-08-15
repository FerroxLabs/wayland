import { ipcBridge } from '@/common';
import { DETECTED_AGENTS_SWR_KEY, fetchDetectedAgents } from '@/renderer/utils/model/agentTypes';
import type { AvailableAgent } from '@/renderer/utils/model/agentTypes';
import { useCallback, useMemo } from 'react';
import useSWR, { mutate } from 'swr';

export type AvailableBackend = {
  id: string;
  name: string;
  isExtension?: boolean;
};

/**
 * Provides detected execution engines for backend selectors (e.g. AssistantEditDrawer).
 * Excludes preset assistants - those live in ConfigStorage('assistants').
 *
 * Returns `availableBackends` (simplified shape for Select dropdowns)
 * and `refreshAgentDetection` to trigger a re-scan.
 */
/**
 * Stable empty fallback. An inline `= []` default builds a NEW array on every
 * render while SWR is unresolved (and again on an error with no cached data),
 * which churns the identity of everything memoized downstream - through
 * `useAvailableBackends`'s `recommend()` into TeamLauncherPage's `initialState`
 * memo, whose `setState`-in-effect then re-fired every render. React kills that
 * feedback loop with "Maximum update depth exceeded" (#185), dropping the whole
 * app into its root error boundary until a manual reload.
 */
const NO_AGENTS: AvailableAgent[] = [];

export const useDetectedAgents = () => {
  const { data: rawAgents = NO_AGENTS } = useSWR<AvailableAgent[]>(DETECTED_AGENTS_SWR_KEY, fetchDetectedAgents);

  const availableBackends = useMemo<AvailableBackend[]>(
    () =>
      rawAgents
        .filter((a) => !a.isPreset && a.backend !== 'remote')
        .map((a) => ({
          id: a.backend,
          name: a.name,
          isExtension: a.isExtension,
        })),
    [rawAgents]
  );

  const refreshAgentDetection = useCallback(async () => {
    try {
      await ipcBridge.acpConversation.refreshCustomAgents.invoke();
      await mutate(DETECTED_AGENTS_SWR_KEY);
    } catch {
      // ignore
    }
  }, []);

  return {
    availableBackends,
    refreshAgentDetection,
  };
};
