/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import type { CuratedModel } from '@process/providers/types';
import { useModelRegistry } from '@renderer/hooks/useModelRegistry';
import { resolveModelContextLimit } from '@/renderer/utils/model/modelContextLimits';

/**
 * Resolve a raw model id (e.g. `claude-opus-4-6`) to its context-window size,
 * backed by the registry catalog (#733).
 *
 * The context usage indicator previously sized its denominator from the
 * static `MODEL_CONTEXT_LIMITS` table alone, while the model picker rows read
 * the models.dev-enriched catalog (`curatedForAgent`). The two sources
 * disagree for any model the table is stale on, so the SAME model could show
 * a 200K max in the indicator and 1M in the picker — and flip to the 1M
 * default whenever the selection was transiently unresolved. This hook gives
 * the indicator the same registry-backed resolution the picker uses; the
 * static table (and its default) remains the fallback for ids the catalog
 * doesn't know (Flux aliases, disconnected providers, unenriched models).
 *
 * Mirrors {@link useModelDisplayName}: same fetch/invalidations, keyed off
 * `registryVersion` so a background catalog refresh re-resolves live.
 */
export function useModelContextLimit(backend: string): (modelId?: string | null) => number {
  const { curatedForAgent, registryVersion } = useModelRegistry();
  const [curated, setCurated] = useState<CuratedModel[]>([]);

  useEffect(() => {
    let cancelled = false;
    curatedForAgent(backend)
      .then((models) => {
        if (!cancelled) setCurated(Array.isArray(models) ? models : []);
      })
      .catch(() => {
        if (!cancelled) setCurated([]);
      });
    return () => {
      cancelled = true;
    };
  }, [backend, curatedForAgent, registryVersion]);

  const windowsById = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of curated) {
      if (typeof m.contextWindow === 'number' && m.contextWindow > 0 && !map.has(m.id)) {
        map.set(m.id, m.contextWindow);
      }
    }
    return map;
  }, [curated]);

  return useMemo(
    () =>
      (modelId?: string | null): number =>
        resolveModelContextLimit(windowsById, modelId),
    [windowsById]
  );
}
