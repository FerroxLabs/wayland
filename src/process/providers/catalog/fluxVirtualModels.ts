/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CatalogModel } from '@process/providers/types';
import {
  FLUX_MODEL_IDS,
  FLUX_MODEL_DISPLAY,
  FLUX_PROVIDER_ID,
  FLUX_TIER_CONTEXT_WINDOW,
  type FluxModelId,
} from '@/common/config/flux';

/**
 * Guarantee the four Flux tiers exist in the flux-router catalog regardless of
 * what the upstream /v1/models returned. Upstream entries win on id collision
 * (they may be enriched); missing ids are appended as unenriched virtuals.
 * The Curator hero-exception (curateOne) keeps these enabled downstream.
 */
export function injectFluxVirtualModels(models: CatalogModel[]): CatalogModel[] {
  const tierIds = new Set<string>(FLUX_MODEL_IDS);
  // Upstream DOES return the four tiers, so the injection below almost never
  // fires - which is why giving only the virtuals a window would have fixed
  // nothing. The window has to be backfilled on whatever row survives.
  const withWindow = models.map((model) =>
    tierIds.has(model.id) && !(typeof model.contextWindow === 'number' && model.contextWindow > 0)
      ? { ...model, contextWindow: FLUX_TIER_CONTEXT_WINDOW }
      : model
  );

  const existing = new Set(withWindow.map((m) => m.id));
  const additions: CatalogModel[] = [];
  for (const id of FLUX_MODEL_IDS) {
    if (existing.has(id)) continue;
    additions.push({
      id,
      providerId: FLUX_PROVIDER_ID,
      displayName: FLUX_MODEL_DISPLAY[id as FluxModelId],
      family: id,
      kind: 'text',
      enriched: false,
      contextWindow: FLUX_TIER_CONTEXT_WINDOW,
      tags: [],
    });
  }
  return [...withWindow, ...additions];
}
