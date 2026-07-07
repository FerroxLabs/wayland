/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import type { CuratedModel, ProviderId } from '@process/providers/types';
import {
  FLUX_AUTO_MODEL,
  FLUX_MODEL_DISPLAY,
  FLUX_MODEL_IDS,
  isFluxModelId,
  type FluxModelId,
} from '@/common/config/flux';
import { useModelRegistry } from '@renderer/hooks/useModelRegistry';
import { useFluxConnected } from '@renderer/hooks/useFluxConnected';
import { usePinnedModels } from '@renderer/hooks/usage/usePinnedModels';
import { useRecentlyUsedModels } from '@renderer/hooks/usage/useRecentlyUsedModels';
import { marqueeProviderRank } from '@renderer/utils/model/marquee';
import { providerLabel } from '@renderer/components/onboarding/providerLabel';
import { describeModel, fluxTierDescriptor, modelKey, priceTier } from './modelRowHelpers';
import type { ModelRow, ModelSelectorViewModel, ModelZone } from './modelSelectorTypes';

/** Backends whose config supports an effort/reasoning knob. */
const EFFORT_BACKENDS = new Set(['codex', 'wcore', 'claude']);

/** Cap on the recently-used zone (Claude-style short list). */
const RECENT_LIMIT = 4;

/**
 * Build a row for a real curated model. `includeProvider` controls whether the
 * descriptor repeats the provider name: pass `false` for rows that live under a
 * provider-named zone header (Recommended / More) so the provider isn't shown
 * twice; leave it `true` for the mixed Pinned / Recently used zones.
 */
function curatedRow(m: CuratedModel, pinned: Set<string>, includeProvider = true): ModelRow {
  const key = modelKey(m);
  return {
    key,
    id: m.id,
    providerId: m.providerId,
    label: m.displayName,
    descriptor: describeModel(m, includeProvider),
    price: priceTier(m),
    pinned: pinned.has(key),
    available: m.enabled,
  };
}

/**
 * Synthesize a Flux routing-tier row (no catalog entry required - the tiers are
 * always selectable when Flux is connected via `injectFluxVirtualModels`).
 */
function fluxTierRow(id: FluxModelId, pinned: Set<string>): ModelRow {
  const key = `flux-router:${id}`;
  return {
    key,
    id,
    providerId: 'flux-router',
    label: FLUX_MODEL_DISPLAY[id],
    descriptor: fluxTierDescriptor(id),
    pinned: pinned.has(key),
    available: true,
    isFlux: true,
  };
}

/** Stable provider-grouped zones, marquee makers first. */
function groupByProvider(rows: ModelRow[], idPrefix: string): ModelZone[] {
  const byProvider = new Map<string, ModelRow[]>();
  for (const row of rows) {
    const list = byProvider.get(row.providerId);
    if (list) list.push(row);
    else byProvider.set(row.providerId, [row]);
  }
  return [...byProvider.entries()]
    .toSorted(([a], [b]) => marqueeProviderRank(a as ProviderId) - marqueeProviderRank(b as ProviderId))
    .map(([providerId, providerRows]) => ({
      id: `${idPrefix}:${providerId}`,
      label: providerLabel(providerId),
      rows: providerRows,
    }));
}

/**
 * Pure adapter: compose the EXISTING data sources (`curatedForAgent`,
 * `useFluxConnected`, `usePinnedModels`, recently-used usage) into one
 * `ModelSelectorViewModel` for the unified flyout. Every list is driven off
 * `curatedForAgent(backend)` (the connected-provider gate) so there is no
 * cross-backend leakage - never merge a global catalog.
 *
 * `activeModelKey` (`providerId:id`) flags the active row; omit it for surfaces
 * that don't yet know the current selection.
 */
export function useModelSelectorViewModel(backend: string, activeModelKey?: string | null): ModelSelectorViewModel {
  const { curatedForAgent, registryVersion } = useModelRegistry();
  const fluxConnected = useFluxConnected();
  const { pinned } = usePinnedModels(true);
  const { models: recentlyUsed } = useRecentlyUsedModels(true);

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

  return useMemo<ModelSelectorViewModel>(() => {
    // Only models the user can actually pick: a real catalog model whose vendor
    // is connected AND whose per-model toggle is on (`enabled`). Disabled /
    // disconnected-vendor models are HIDDEN, not greyed - never show a model you
    // cannot choose. Flux virtual ids are handled separately (the hero + zone).
    const base = curated.filter((m) => !isFluxModelId(m.id) && m.enabled);
    const empty = base.length === 0 && !fluxConnected;

    if (empty) {
      return {
        fluxHero: undefined,
        zones: [],
        moreZones: [],
        activeKey: activeModelKey ?? null,
        effortSupported: EFFORT_BACKENDS.has(backend),
        empty: true,
      };
    }

    const fluxHero = fluxConnected ? fluxTierRow(FLUX_AUTO_MODEL, pinned) : undefined;

    // Pinned zone: pinned models that exist in this backend's curated set.
    const pinnedRows = base.filter((m) => pinned.has(modelKey(m))).map((m) => curatedRow(m, pinned));
    const pinnedKeys = new Set(pinnedRows.map((r) => r.key));

    // Recent zone: recency-ordered usage resolved against the curated set,
    // de-duped against pinned, capped. Usage carries a bare modelId, so match
    // on both `id` and `providerId:id`.
    const idMap = new Map<string, CuratedModel>();
    // Which connected providers expose each bare model id. When two connected
    // providers share a bare id (e.g. `gpt-5.5` under both `openai` and
    // `chatgpt-subscription`), the bare-id `idMap` entry is overwritten by
    // whichever provider is iterated last, so a recently-used lookup binds the
    // model to an arbitrary (often wrong) provider - it then renders under the
    // wrong vendor, routes chat-start to that provider (a ChatGPT-subscription
    // pick falling back to the disabled OpenAI API), and gets pulled out of its
    // correct provider group by the recent/recommended de-dup below. Usage
    // records no providerId, so an ambiguous id cannot be attributed correctly.
    const providersByBareId = new Map<string, Set<string>>();
    for (const m of base) {
      idMap.set(m.id, m);
      idMap.set(modelKey(m), m);
      const owners = providersByBareId.get(m.id) ?? new Set<string>();
      owners.add(m.providerId);
      providersByBareId.set(m.id, owners);
    }
    const recentRows: ModelRow[] = [];
    const seenRecent = new Set<string>();
    for (const usage of recentlyUsed) {
      // Skip a bare id shared by 2+ connected providers: it cannot be attributed
      // to the one the user actually used, so keep it out of the Recently-used
      // zone rather than binding it to the wrong vendor. It still shows in each
      // owning provider's group, correctly attributed.
      if ((providersByBareId.get(usage.modelId)?.size ?? 0) > 1) continue;
      const m = idMap.get(usage.modelId);
      if (!m) continue;
      const key = modelKey(m);
      if (pinnedKeys.has(key) || seenRecent.has(key)) continue;
      seenRecent.add(key);
      recentRows.push(curatedRow(m, pinned));
      if (recentRows.length >= RECENT_LIMIT) break;
    }

    // Recommended zone: each connected provider's recommended flagships,
    // grouped + marquee-ordered. This reflects the stable curated catalog, so
    // a pinned flagship still appears here (the Pinned zone is an additional
    // affordance, not a relocation). De-dupe only against the dynamic Recently
    // used zone so a model never shows twice among the just-used rows.
    const recentKeys = new Set(recentRows.map((r) => r.key));
    const recommendedRows = base
      .filter((m) => m.recommended && !recentKeys.has(modelKey(m)))
      .map((m) => curatedRow(m, pinned, false));
    const recommendedZones = groupByProvider(recommendedRows, 'recommended');

    const zones: ModelZone[] = [];
    // Flux routing tiers (reasoning/standard/fast) sit right under the Flux Auto
    // hero as the primary picks - they are the product, not buried in the tail.
    // Auto is the hero, so the zone carries the other three (picker order).
    if (fluxConnected) {
      const tierRows = FLUX_MODEL_IDS.filter((id) => id !== FLUX_AUTO_MODEL).map((id) => fluxTierRow(id, pinned));
      zones.push({ id: 'flux', label: 'Flux routing', rows: tierRows });
    }
    if (pinnedRows.length > 0) zones.push({ id: 'pinned', label: 'Pinned', rows: pinnedRows });
    if (recentRows.length > 0) zones.push({ id: 'recent', label: 'Recently used', rows: recentRows });
    zones.push(...recommendedZones);

    // More-models: the long tail not surfaced in any zone above, grouped by
    // provider (pinned ∪ recent ∪ recommended are excluded).
    const surfaced = new Set<string>([...pinnedKeys, ...recentKeys, ...recommendedRows.map((r) => r.key)]);
    const moreRows = base.filter((m) => !surfaced.has(modelKey(m))).map((m) => curatedRow(m, pinned, false));
    const moreZones = groupByProvider(moreRows, 'more');

    return {
      fluxHero,
      zones,
      moreZones,
      activeKey: activeModelKey ?? null,
      effortSupported: EFFORT_BACKENDS.has(backend),
      empty: false,
    };
  }, [curated, fluxConnected, pinned, recentlyUsed, backend, activeModelKey]);
}
