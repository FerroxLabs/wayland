/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Resolves the user's display name for the new-chat greeting.
 *
 * The desktop runtime has no authenticated user, so the name defaults to the
 * OS account name (`application.systemInfo.userName`). The user can override it
 * in Settings; the override is persisted in the `user.displayName` config key.
 */

import { useCallback, useEffect, useState } from 'react';
import { ipcBridge } from '@/common';
import { ConfigStorage } from '@/common/config/storage';

export type UserDisplayName = {
  /** Name to show - the configured override, or the OS account name. */
  resolvedName: string;
  /** OS account name (the default). Used as the Settings placeholder. */
  osName: string;
  /** The user's explicit override, or '' when unset. */
  configuredName: string;
  /** Persist a new override. An empty string clears it back to the OS default. */
  save: (name: string) => Promise<void>;
  /** True once both the OS name and the stored override have loaded. */
  loaded: boolean;
};

export function useUserDisplayName(): UserDisplayName {
  const [osName, setOsName] = useState('');
  const [configuredName, setConfiguredName] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [info, stored] = await Promise.all([
        ipcBridge.application.systemInfo.invoke().catch((): null => null),
        ConfigStorage.get('user.displayName').catch((): undefined => undefined),
      ]);
      if (cancelled) return;
      setOsName(info?.userName ?? '');
      setConfiguredName(stored ?? '');
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(async (name: string) => {
    const trimmed = name.trim();
    await ConfigStorage.set('user.displayName', trimmed);
    setConfiguredName(trimmed);
  }, []);

  return {
    resolvedName: (configuredName || osName).trim(),
    osName,
    configuredName,
    save,
    loaded,
  };
}
