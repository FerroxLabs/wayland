/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { ConfigStorage } from '@/common/config/storage';
import { resolveShellExperience, type ShellExperience } from '@/common/shellExperience';

export const SHELL_EXPERIENCE_CHANGED_EVENT = 'wayland:shell-experience-changed';

export async function writeShellExperience(shell: ShellExperience): Promise<void> {
  await ConfigStorage.set('ui.shell', shell);
  window.dispatchEvent(new CustomEvent<ShellExperience>(SHELL_EXPERIENCE_CHANGED_EVENT, { detail: shell }));
}

export function useShellExperience(): {
  shell: ShellExperience;
  loading: boolean;
  setShell: (shell: ShellExperience) => Promise<void>;
} {
  const [shell, setShellState] = useState<ShellExperience>('classic');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void ConfigStorage.get('ui.shell')
      .then((stored) => {
        if (active) setShellState(resolveShellExperience(stored));
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

  const setShell = useCallback(async (next: ShellExperience) => writeShellExperience(next), []);
  return { shell, loading, setShell };
}
