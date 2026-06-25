/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { STORAGE_KEYS } from '@/common/config/storageKeys';
import { useCallback, useEffect, useState } from 'react';

const FLUX_ENTRY_DISMISSED_EVENT = 'wayland:flux-entry-dismissed';

const readDismissed = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEYS.FLUX_ENTRY_DISMISSED) === 'true';
  } catch {
    return false;
  }
};

/**
 * Tracks whether the user dismissed the Flux Status sidebar widget (#94).
 * Persists to localStorage and broadcasts a custom event so the widget hides
 * immediately on dismiss (the dismiss control lives inside the widget itself).
 */
export const useFluxEntryDismissed = (): { dismissed: boolean; dismiss: () => void } => {
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    const sync = (): void => setDismissed(readDismissed());
    window.addEventListener(FLUX_ENTRY_DISMISSED_EVENT, sync);
    return () => window.removeEventListener(FLUX_ENTRY_DISMISSED_EVENT, sync);
  }, []);

  const dismiss = useCallback((): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.FLUX_ENTRY_DISMISSED, 'true');
    } catch {
      // Ignore write failures (private mode / quota); the in-memory flag below
      // still hides the widget for this session.
    }
    setDismissed(true);
    window.dispatchEvent(new Event(FLUX_ENTRY_DISMISSED_EVENT));
  }, []);

  return { dismissed, dismiss };
};
