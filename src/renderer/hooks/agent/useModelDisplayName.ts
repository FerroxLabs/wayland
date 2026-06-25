/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import type { CuratedModel } from '@process/providers/types';
import { FLUX_MODEL_DISPLAY, isFluxModelId, type FluxModelId } from '@/common/config/flux';
import { useModelRegistry } from '@renderer/hooks/useModelRegistry';

/**
 * Resolve a raw model id (e.g. `claude-haiku-4-5-20251001`) to its catalog
 * display name (`Claude Haiku 4.5`).
 *
 * The model picker reads display names from the registry catalog
 * (`curatedForAgent`), but the conversation header and send box rendered the
 * raw id because their formatters only knew how to alias Flux ids. This hook
 * gives those surfaces the SAME registry-backed resolution the picker uses, so
 * a picked model reads as its friendly name everywhere it surfaces.
 *
 * Flux routing aliases keep their brand name; an unknown id falls back to
 * itself so nothing renders blank.
 */
export function useModelDisplayName(backend: string): (modelId?: string | null) => string {
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

  const byId = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of curated) map.set(m.id, m.displayName);
    return map;
  }, [curated]);

  return useMemo(
    () =>
      (modelId?: string | null): string => {
        if (!modelId) return '';
        if (isFluxModelId(modelId)) return FLUX_MODEL_DISPLAY[modelId as FluxModelId] ?? modelId;
        return byId.get(modelId) ?? modelId;
      },
    [byId]
  );
}
