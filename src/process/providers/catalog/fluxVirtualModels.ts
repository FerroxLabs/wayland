/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CatalogModel } from '@process/providers/types';
import { FLUX_MODEL_IDS, FLUX_MODEL_DISPLAY, FLUX_PROVIDER_ID, type FluxModelId } from '@/common/config/flux';

/**
 * Guarantee the four Flux tiers exist in the flux-router catalog regardless of
 * what the upstream /v1/models returned. Upstream entries win on id collision
 * (they may be enriched); missing ids are appended as unenriched virtuals.
 * The Curator hero-exception (curateOne) keeps these enabled downstream.
 */
export function injectFluxVirtualModels(models: CatalogModel[]): CatalogModel[] {
  const existing = new Set(models.map((m) => m.id));
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
      tags: [],
    });
  }
  return [...models, ...additions];
}
