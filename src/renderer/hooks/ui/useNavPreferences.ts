/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';

import {
  NAV_PREFS_UPDATED_EVENT,
  SIDER_NAV_HIDDEN_IDS_KEY,
  TITLEBAR_BRAND_HIDDEN_KEY,
  readHiddenSiderNavIds,
  readTitlebarBrandHidden,
} from '@renderer/utils/ui/navPreferences';

/**
 * Subscribe to nav-preference changes: the same-document
 * {@link NAV_PREFS_UPDATED_EVENT} (a settings toggle in this window) and the
 * cross-document `storage` event (a second app window). Re-reads on either.
 */
function useNavPrefSubscription(storageKey: string, onChange: () => void): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = () => onChange();
    const onStorage = (event: StorageEvent) => {
      // key === null fires on localStorage.clear(); treat as a full re-read.
      if (event.key === null || event.key === storageKey) sync();
    };
    window.addEventListener(NAV_PREFS_UPDATED_EVENT, sync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(NAV_PREFS_UPDATED_EVENT, sync);
      window.removeEventListener('storage', onStorage);
    };
    // onChange is a stable reference from the caller's setState updater.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);
}

/** Reactive titlebar-brand (logo) hidden flag. */
export function useTitlebarBrandHidden(): boolean {
  const [hidden, setHidden] = useState<boolean>(readTitlebarBrandHidden);
  useNavPrefSubscription(TITLEBAR_BRAND_HIDDEN_KEY, () => setHidden(readTitlebarBrandHidden()));
  return hidden;
}

/** Reactive set of hidden sider-nav entry ids (for O(1) `.has()` lookups). */
export function useHiddenSiderNavIds(): Set<string> {
  const [ids, setIds] = useState<Set<string>>(() => new Set(readHiddenSiderNavIds()));
  useNavPrefSubscription(SIDER_NAV_HIDDEN_IDS_KEY, () => setIds(new Set(readHiddenSiderNavIds())));
  return ids;
}
