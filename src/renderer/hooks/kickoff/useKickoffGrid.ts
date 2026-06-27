/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { ipcBridge } from '@/common';
import type { KickoffGridItem, KickoffGridResult } from '@process/services/kickoff/types';

/**
 * #375 - hook for the per-assistant suggested-prompts GRID rendered below the
 * composer in the assistant detail view. Unlike `useKickoff` (the single
 * yes-bias card), this is a flat browse surface: it fetches up to N ranked
 * starters and the caller renders them as clickable cards that PREFILL the
 * composer (not auto-send).
 *
 * Behavior:
 *  - Re-fetches whenever `assistantId` or `locale` changes. An undefined
 *    assistantId (no preset selected) clears the grid.
 *  - A `notRendered` result or an IPC failure resolves to an empty grid - the
 *    detail view simply shows nothing, matching the pre-#375 behavior for
 *    assistants with no suggestions.
 *  - No telemetry / no per-session dismiss: the grid is a passive,
 *    always-available browse surface, not a one-shot offer.
 */

function isItems(result: KickoffGridResult): result is { items: KickoffGridItem[] } {
  return Array.isArray((result as { items?: unknown }).items);
}

export type UseKickoffGridReturn = {
  items: KickoffGridItem[];
  visible: boolean;
};

export function useKickoffGrid(assistantId: string | undefined, locale?: string): UseKickoffGridReturn {
  const [items, setItems] = useState<KickoffGridItem[]>([]);

  useEffect(() => {
    if (!assistantId) {
      setItems([]);
      return;
    }
    let cancelled = false;
    void ipcBridge.kickoff.suggestMany
      .invoke({ assistantId, locale })
      .then((result) => {
        if (cancelled) return;
        setItems(isItems(result) ? result.items : []);
      })
      .catch((err) => {
        console.warn('[useKickoffGrid] suggestMany IPC failed', err);
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [assistantId, locale]);

  return { items, visible: items.length > 0 };
}
