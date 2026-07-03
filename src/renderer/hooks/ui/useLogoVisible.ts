/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';

import {
  LOGO_VISIBLE_STORAGE_KEY,
  LOGO_VISIBLE_UPDATED_EVENT,
  readLogoVisible,
} from '@renderer/utils/ui/logoVisibility';

/**
 * Reactive sidebar-logo visibility (#118). Seeds from the persisted value on
 * first paint, then re-reads on the same-document
 * `wayland-sidebar-logo-visibility-updated` event (settings toggle in this
 * window) and on the cross-document `storage` event (a second app window).
 */
export function useLogoVisible(): boolean {
  const [visible, setVisible] = useState<boolean>(readLogoVisible);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = () => setVisible(readLogoVisible());
    const onStorage = (event: StorageEvent) => {
      if (event.key === LOGO_VISIBLE_STORAGE_KEY) sync();
    };
    window.addEventListener(LOGO_VISIBLE_UPDATED_EVENT, sync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(LOGO_VISIBLE_UPDATED_EVENT, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return visible;
}
