/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';

import {
  readSidebarWidth,
  SIDEBAR_WIDTH_STORAGE_KEY,
  SIDEBAR_WIDTH_UPDATED_EVENT,
} from '@renderer/utils/ui/sidebarWidth';

/**
 * Reactive desktop sidebar width (#84). Seeds from the persisted value on first
 * paint, then re-reads on the same-document `wayland-sidebar-width-updated`
 * event (settings slider in this window) and on the cross-document `storage`
 * event (a second app window). Always returns a clamped, defaulted number.
 */
export function useSidebarWidth(): number {
  const [width, setWidth] = useState<number>(readSidebarWidth);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = () => setWidth(readSidebarWidth());
    const onStorage = (event: StorageEvent) => {
      if (event.key === SIDEBAR_WIDTH_STORAGE_KEY) sync();
    };
    window.addEventListener(SIDEBAR_WIDTH_UPDATED_EVENT, sync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(SIDEBAR_WIDTH_UPDATED_EVENT, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return width;
}
