/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import useSWR from 'swr';
import { ipcBridge } from '@/common';
import { useAuth } from '@renderer/hooks/context/AuthContext';
import type { MissionControlSnapshot } from '@/common/types/missionControl';

/**
 * Loads the Mission Control snapshot and keeps it live: a short poll catches the
 * transient durable-execution states (verifying / zombie / freshly-failed) that
 * persist for less than a Watchdog interval, and team + cron events refetch
 * immediately on a known change so the user is not waiting on the poll.
 */
export function useMissionControl() {
  const { user } = useAuth();
  const userId = user?.id ?? 'system_default_user';

  const { data, isLoading, mutate } = useSWR<MissionControlSnapshot>(
    `mission-control/${userId}`,
    (): Promise<MissionControlSnapshot> => ipcBridge.missionControl.snapshot.invoke({ userId }),
    { revalidateOnFocus: true, refreshInterval: 5000 }
  );

  useEffect(() => {
    const refresh = (): void => {
      void mutate();
    };
    const offs = [
      // Team task lifecycle is driven by agent activity; these fire on the
      // transitions that move tasks between running / verifying / zombie / done.
      ipcBridge.team.agentStatusChanged.on(refresh),
      ipcBridge.team.listChanged.on(refresh),
      ipcBridge.cron.onJobExecuted.on(refresh),
      ipcBridge.cron.onJobUpdated.on(refresh),
      ipcBridge.cron.onJobCreated.on(refresh),
    ];
    return () => offs.forEach((off) => off());
  }, [mutate]);

  return { snapshot: data, loading: isLoading, refresh: mutate };
}
