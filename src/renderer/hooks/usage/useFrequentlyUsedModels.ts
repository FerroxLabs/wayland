/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { ipcBridge } from '@/common';

export type FrequentlyUsedModel = {
  modelId: string;
  useCount: number;
  lastUsedMs: number;
};

/**
 * Renderer hook that fetches the top-N most-used models from the main-process
 * `FrequentlyUsedAggregator`. Backs the "Frequently used" zone of the GUID
 * model selector. `enabled=false` suppresses the fetch (e.g. while the panel
 * is closed). Refetches whenever `enabled` flips to true so the panel always
 * shows fresh data on open. IPC errors resolve to an empty list - telemetry
 * must never break the picker.
 */
export function useFrequentlyUsedModels(enabled: boolean): {
  models: FrequentlyUsedModel[];
  loading: boolean;
} {
  const [models, setModels] = useState<FrequentlyUsedModel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    ipcBridge.usage.queryFrequentlyUsedModels
      .invoke({})
      .then((result) => {
        if (cancelled) return;
        setModels(Array.isArray(result) ? result : []);
      })
      .catch((err) => {
        console.warn('[useFrequentlyUsedModels] query failed:', err);
        if (!cancelled) setModels([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { models, loading };
}
