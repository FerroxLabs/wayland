/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IProvider, TProviderWithModel } from '@/common/config/storage';
import { FLUX_PROVIDER_ID, isFluxModelId } from '@/common/config/flux';
import { modelKey } from './modelRowHelpers';

/** The tag the registry bridge stamps on each mirrored row: `v2:<registryProviderId>`. */
export const BRIDGE_TAG_KEY = '__waylandModelRegistryBridge';
export const V2_TAG_PREFIX = 'v2:';

/**
 * Resolve the legacy `IProvider` that owns a model the unified flyout emitted.
 *
 * The flyout reports `(modelId, providerId)` where `providerId` is the model
 * registry's `ProviderId` (e.g. `'openai'`). That is NOT the legacy storage
 * `provider.id` (an opaque per-install id), so matching purely on
 * `p.id === providerId` silently fails for every non-Flux model and the click
 * is swallowed (#99/#102/#103/#104). Resolve robustly instead:
 *
 *  - Flux routing aliases (`flux-auto`, ...): the live Flux provider's id is
 *    opaque AND its tiers are not function_calling models, so match by the raw
 *    `provider.model` catalog (NOT the function-calling-filtered
 *    `getAvailableModels`, which would exclude them).
 *  - Everything else: try the exact id first (cheap, correct when registry and
 *    storage ids happen to align), then fall back to the membership join - the
 *    provider whose available models actually include this `modelId`. That join
 *    is the same identity `useWCoreModelSelection` uses for its stale-model
 *    check, so `modelId` is guaranteed to align with `getAvailableModels`.
 *
 * Returns `undefined` only when no connected provider offers the model.
 */
export const resolveSelectedProvider = (
  providers: IProvider[],
  getAvailableModels: (provider: IProvider) => string[],
  modelId: string,
  providerId: string
): IProvider | undefined => {
  if (isFluxModelId(modelId)) {
    return providers.find((p) => (p.model ?? []).some((m) => isFluxModelId(m)));
  }
  // Resolve in priority order: exact legacy id → the registry bridge tag
  // (`v2:<providerId>`) → the membership fallback. The bridge-tag match is the
  // deterministic owner of the selection: it stops an OpenRouter model id that
  // overlaps another provider from binding to the WRONG legacy row (#167 false
  // 401), and it resolves a ChatGPT-subscription row even when getAvailableModels
  // filters that row's models out of the function-calling set (#168/#158). The
  // membership fallback remains only for untagged (non-bridge) providers.
  const bridgeTagMatch = providers.find((p) => {
    const tag = (p as unknown as Record<string, unknown>)[BRIDGE_TAG_KEY];
    return typeof tag === 'string' && tag === `${V2_TAG_PREFIX}${providerId}`;
  });
  return (
    providers.find((p) => p.id === providerId) ??
    bridgeTagMatch ??
    providers.find((p) => getAvailableModels(p).includes(modelId))
  );
};

/**
 * The flyout's active-row key for the current selection.
 *
 * The flyout keys its rows by the registry `ProviderId`, but a selection carries
 * the legacy storage `provider.id`, so keying the active row off `selection.id`
 * never matched and the selected model showed no check - and at chat start the
 * mismatch blanked the picker entirely (#124). Recover the registry `ProviderId`
 * from the owning legacy provider's bridge tag (`v2:<registryProviderId>`),
 * falling back to the legacy id when the row is untagged (a non-bridge provider,
 * whose models are not in the registry flyout anyway).
 */
export const resolveActiveModelKey = (
  modelConfig: IProvider[] | undefined,
  selection: Pick<TProviderWithModel, 'id' | 'useModel'> | undefined
): string | null => {
  if (!selection?.useModel) return null;
  if (isFluxModelId(selection.useModel)) return modelKey({ providerId: FLUX_PROVIDER_ID, id: selection.useModel });
  const owner = modelConfig?.find((p) => p.id === selection.id);
  const tag = owner ? (owner as unknown as Record<string, unknown>)[BRIDGE_TAG_KEY] : undefined;
  const registryProviderId =
    typeof tag === 'string' && tag.startsWith(V2_TAG_PREFIX) ? tag.slice(V2_TAG_PREFIX.length) : undefined;
  return modelKey({ providerId: registryProviderId ?? selection.id ?? '', id: selection.useModel });
};
