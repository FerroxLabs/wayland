/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { ConfigStorage } from '@/common/config/storage';

/** Stable pin key for a curated model: `providerId:modelId`. */
export const pinKey = (providerId: string, modelId: string): string => `${providerId}:${modelId}`;

/**
 * Renderer hook for the user's pinned models (composer picker "Pinned" zone).
 * Pins are a UI preference persisted in `ConfigStorage` under `pinnedModels`
 * as `providerId:modelId` keys - not provider/DB state. Loads when `enabled`
 * flips true (e.g. panel open) so a pin made in another window is reflected on
 * next open. `toggle` updates local state optimistically and persists; a failed
 * write reverts so the UI never drifts from storage.
 */
export function usePinnedModels(enabled: boolean): {
  pinned: Set<string>;
  toggle: (key: string) => void;
} {
  const [pinned, setPinned] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    ConfigStorage.get('pinnedModels')
      .then((list) => {
        if (!cancelled) setPinned(new Set(Array.isArray(list) ? list : []));
      })
      .catch(() => {
        /* pins are a preference; a read failure just shows none */
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const toggle = useCallback((key: string) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      const persisted = [...next];
      ConfigStorage.set('pinnedModels', persisted).catch(() => {
        // Revert on a failed write so the UI matches storage.
        setPinned(prev);
      });
      return next;
    });
  }, []);

  return { pinned, toggle };
}
