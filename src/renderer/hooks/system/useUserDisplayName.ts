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
 *
 * 🔴 The override is written DURING first-run onboarding, while the page that
 * greets the user is already mounted behind the modal. A one-shot `useEffect`
 * read therefore runs BEFORE the write, gets '', falls back to the OS account
 * name, and never re-reads - so a buyer who typed "Matty" was greeted "Rise and
 * shine, Sean" for the whole of session one. The stored name lives on its own
 * SWR key so any writer can announce it; `save()` does that itself, and
 * onboarding revalidates {@link USER_DISPLAY_NAME_SWR_KEY} after its write.
 * Same shape as the model-pin fix, and the same defect: onboarding writing a
 * value the home page had already read.
 */

import { useCallback, useEffect, useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { ipcBridge } from '@/common';
import { ConfigStorage } from '@/common/config/storage';

/** SWR key holding the stored `user.displayName` override. */
export const USER_DISPLAY_NAME_SWR_KEY = 'user.displayName';

/** Tell every mounted consumer to re-read the stored name. */
export const announceUserDisplayName = () => {
  void globalMutate(USER_DISPLAY_NAME_SWR_KEY);
};

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
  // The OS account name cannot change while the app runs, so it stays a
  // one-shot read. Only the override needs to be revalidatable.
  const [osName, setOsName] = useState('');
  const [osLoaded, setOsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const info = await ipcBridge.application.systemInfo.invoke().catch((): null => null);
      if (cancelled) return;
      setOsName(info?.userName ?? '');
      setOsLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { data: stored, isLoading } = useSWR(USER_DISPLAY_NAME_SWR_KEY, () =>
    ConfigStorage.get('user.displayName').catch((): undefined => undefined)
  );
  const configuredName = stored ?? '';

  const save = useCallback(async (name: string) => {
    const trimmed = name.trim();
    await ConfigStorage.set('user.displayName', trimmed);
    // Publish through SWR rather than local state so EVERY consumer updates,
    // not just the one that happened to own the Settings field.
    await globalMutate(USER_DISPLAY_NAME_SWR_KEY, trimmed, { revalidate: false });
  }, []);

  return {
    resolvedName: (configuredName || osName).trim(),
    osName,
    configuredName,
    save,
    loaded: osLoaded && !isLoading,
  };
}
