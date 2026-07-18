/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { ConfigStorage } from '@/common/config/storage';
import { resolveShellExperience, type ShellExperience } from '@/common/shellExperience';
import type { CockpitReturnReason, CockpitRolloutStatus } from '@/common/types/cohortRollout';

export const SHELL_EXPERIENCE_CHANGED_EVENT = 'wayland:shell-experience-changed';

/** Update every mounted shell consumer without claiming the preference was persisted. */
export function activateShellExperienceForSession(shell: ShellExperience): void {
  window.dispatchEvent(new CustomEvent<ShellExperience>(SHELL_EXPERIENCE_CHANGED_EVENT, { detail: shell }));
}

const BROWSER_ROLLOUT_STATUS: CockpitRolloutStatus = Object.freeze({
  eligible: true,
  stage: 'internal-dogfood',
  source: 'development',
  reason: 'development-build',
});

const UNAVAILABLE_ROLLOUT_STATUS: CockpitRolloutStatus = Object.freeze({
  eligible: false,
  stage: null,
  source: 'none',
  reason: 'service-unavailable',
});

export class CockpitRolloutBlockedError extends Error {
  constructor(readonly status: CockpitRolloutStatus) {
    super(`Cockpit rollout is not authorized: ${status.reason}`);
    this.name = 'CockpitRolloutBlockedError';
  }
}

export async function readCockpitRolloutStatus(): Promise<CockpitRolloutStatus> {
  const api = window.electronAPI;
  if (!api) return BROWSER_ROLLOUT_STATUS;
  if (!api.cockpitRolloutStatus) return UNAVAILABLE_ROLLOUT_STATUS;
  try {
    return await api.cockpitRolloutStatus();
  } catch {
    return UNAVAILABLE_ROLLOUT_STATUS;
  }
}

export async function writeShellExperience(shell: ShellExperience, returnReason?: CockpitReturnReason): Promise<void> {
  if (shell === 'cockpit') {
    const status = await readCockpitRolloutStatus();
    if (!status.eligible) throw new CockpitRolloutBlockedError(status);
  }
  await ConfigStorage.set('ui.shell', shell);
  activateShellExperienceForSession(shell);
  if (shell === 'classic' && returnReason && window.electronAPI?.cohortRecordShellReturn) {
    // Returning to the proven shell is never blocked by optional evidence.
    await window.electronAPI.cohortRecordShellReturn(returnReason).catch((): void => undefined);
  }
}

export function useShellExperience(): {
  shell: ShellExperience;
  loading: boolean;
  cockpitRollout: CockpitRolloutStatus;
  setShell: (shell: ShellExperience, returnReason?: CockpitReturnReason) => Promise<void>;
} {
  const [shell, setShellState] = useState<ShellExperience>('classic');
  const [loading, setLoading] = useState(true);
  const [cockpitRollout, setCockpitRollout] = useState<CockpitRolloutStatus>(UNAVAILABLE_ROLLOUT_STATUS);

  useEffect(() => {
    let active = true;
    void Promise.all([ConfigStorage.get('ui.shell'), readCockpitRolloutStatus()])
      .then(([stored, rollout]) => {
        if (!active) return;
        setCockpitRollout(rollout);
        const resolved = resolveShellExperience(stored);
        if (resolved === 'cockpit' && !rollout.eligible) {
          setShellState('classic');
          void ConfigStorage.set('ui.shell', 'classic').catch((): void => undefined);
        } else {
          setShellState(resolved);
        }
      })
      .catch(() => {
        if (active) setShellState('classic');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const handleChange = (event: Event) => {
      setShellState(resolveShellExperience((event as CustomEvent<unknown>).detail));
      setLoading(false);
    };
    window.addEventListener(SHELL_EXPERIENCE_CHANGED_EVENT, handleChange);
    return () => {
      active = false;
      window.removeEventListener(SHELL_EXPERIENCE_CHANGED_EVENT, handleChange);
    };
  }, []);

  const setShell = useCallback(async (next: ShellExperience, returnReason?: CockpitReturnReason) => {
    await writeShellExperience(next, returnReason);
    if (next === 'cockpit') setCockpitRollout(await readCockpitRolloutStatus());
  }, []);
  return { shell, loading, cockpitRollout, setShell };
}
