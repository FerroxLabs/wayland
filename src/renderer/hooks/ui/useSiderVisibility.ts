/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { NavItemId } from '@renderer/components/layout/Sider/navRegistry';
import {
  readHiddenNavItems,
  SIDER_HIDDEN_ITEMS_STORAGE_KEY,
  SIDER_VISIBILITY_UPDATED_EVENT,
  toggleHiddenNavItem,
  writeHiddenNavItems,
} from '@renderer/utils/ui/siderVisibility';

export type SiderVisibility = {
  /** Ids currently hidden from the left nav. */
  hiddenIds: Set<NavItemId>;
  /** True when the given nav item is hidden. */
  isHidden: (id: NavItemId) => boolean;
  /** Flip visibility for a single nav item and persist. */
  toggle: (id: NavItemId) => void;
};

/**
 * Reactive per-item left-nav visibility (#118). Seeds from the persisted hidden
 * set on first paint, then re-reads on the same-document
 * `wayland-sidebar-visibility-updated` event (settings toggle in this window)
 * and on the cross-document `storage` event (a second app window).
 */
export function useSiderVisibility(): SiderVisibility {
  const [hidden, setHidden] = useState<NavItemId[]>(readHiddenNavItems);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = () => setHidden(readHiddenNavItems());
    const onStorage = (event: StorageEvent) => {
      if (event.key === SIDER_HIDDEN_ITEMS_STORAGE_KEY) sync();
    };
    window.addEventListener(SIDER_VISIBILITY_UPDATED_EVENT, sync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(SIDER_VISIBILITY_UPDATED_EVENT, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const hiddenIds = useMemo(() => new Set(hidden), [hidden]);

  const isHidden = useCallback((id: NavItemId) => hiddenIds.has(id), [hiddenIds]);

  const toggle = useCallback((id: NavItemId) => {
    setHidden((prev) => {
      const next = toggleHiddenNavItem(prev, id);
      writeHiddenNavItems(next);
      return next;
    });
  }, []);

  return { hiddenIds, isHidden, toggle };
}
