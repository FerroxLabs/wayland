/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #466 Computer-Use macOS permission state for the onboarding card.
 *
 * Reads the current grants via the (non-prompting) bridge and exposes a manual
 * re-check + a deep-link opener. Only queries while `enabled` (the agent has the
 * CUA capability) so non-CUA chats never touch macOS APIs.
 */

import { useCallback, useEffect, useState } from 'react';
import { ipcBridge } from '@/common';

export type CuaPermissionStatus = Awaited<ReturnType<typeof ipcBridge.cua.getStatus.invoke>>;
export type CuaPrivacyPane = 'screen' | 'accessibility';

export function useCuaPermissions(enabled: boolean): {
  status: CuaPermissionStatus | null;
  checking: boolean;
  recheck: () => Promise<void>;
  openSettings: (pane: CuaPrivacyPane) => void;
  relaunch: () => void;
} {
  const [status, setStatus] = useState<CuaPermissionStatus | null>(null);
  const [checking, setChecking] = useState(false);

  const recheck = useCallback(async () => {
    setChecking(true);
    try {
      setStatus(await ipcBridge.cua.getStatus.invoke());
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void recheck();
  }, [enabled, recheck]);

  const openSettings = useCallback((pane: CuaPrivacyPane) => {
    void ipcBridge.cua.openSettings.invoke({ pane });
  }, []);

  // macOS does not apply a newly-granted Screen Recording permission to an
  // already-running process: it only reads back as granted after a relaunch.
  // So the card offers a relaunch to actually complete the round-trip.
  const relaunch = useCallback(() => {
    void ipcBridge.application.restart.invoke();
  }, []);

  return { status, checking, recheck, openSettings, relaunch };
}
