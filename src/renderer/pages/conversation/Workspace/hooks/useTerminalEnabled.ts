/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #645 — read the advanced "Terminal mode" flag to decide whether the Workspace
 * Terminal tab is shown. Reads once on mount; toggling the setting takes effect
 * the next time a chat's workspace mounts (acceptable for an advanced flag).
 */
import { useEffect, useState } from 'react';
import { ipcBridge } from '@/common';

export function useTerminalEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let alive = true;
    ipcBridge.systemSettings.getTerminalEnabled
      .invoke()
      .then((v) => {
        if (alive) setEnabled(Boolean(v));
      })
      .catch(() => {
        /* default off */
      });
    return () => {
      alive = false;
    };
  }, []);
  return enabled;
}
