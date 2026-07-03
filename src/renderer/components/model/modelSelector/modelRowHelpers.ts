/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CatalogModel } from '@/process/providers/types';
import { providerLabel } from '@renderer/components/onboarding/providerLabel';

/** Stable pin/selection key for a model: `providerId:id`. */
export const modelKey = (m: Pick<CatalogModel, 'providerId' | 'id'>): string => `${m.providerId}:${m.id}`;

/**
 * One-line descriptor for a model row: "<context> context · <provider>".
 * The context segment is dropped when `contextWindow` is unknown.
 *
 * Set `includeProvider = false` for rows that already sit under a provider-named
 * zone header (e.g. "Recommended for OpenAI"), so the provider isn't repeated a
 * second time in the descriptor. Those rows collapse to "<context> context", or
 * an empty string when the context window is unknown. Mixed zones (Pinned /
 * Recently used) keep the provider since they have no provider header.
 */
export const describeModel = (
  m: Pick<CatalogModel, 'providerId' | 'contextWindow'>,
  includeProvider = true
): string => {
  const hasCtx = typeof m.contextWindow === 'number' && m.contextWindow > 0;
  const ctx = hasCtx ? `${Math.round(m.contextWindow / 1000)}K context` : '';
  if (!includeProvider) return ctx;
  const provider = providerLabel(m.providerId);
  if (!hasCtx) return provider;
  return `${ctx} · ${provider}`;
};

/**
 * Bucket a model into a price tier by output cost per million tokens:
 * `<5` → `$`, `<25` → `$$`, else `$$$`. Returns `undefined` when cost is unknown
 * so the row simply renders no tier rather than a fabricated one.
 */
export const priceTier = (m: Pick<CatalogModel, 'costOutPerM'>): '$' | '$$' | '$$$' | undefined => {
  const cost = m.costOutPerM;
  if (typeof cost !== 'number') return undefined;
  if (cost < 5) return '$';
  if (cost < 25) return '$$';
  return '$$$';
};

/** Locked UI descriptors for the four Flux tiers (English baseline). */
const FLUX_TIER_DESCRIPTORS: Record<string, string> = {
  'flux-auto': 'Routes each turn to the best model automatically',
  'flux-reasoning': 'Always routes to a top reasoning model',
  'flux-standard': 'Balanced quality and speed',
  'flux-fast': 'Cheapest, fastest models',
};

/** Descriptor string for a Flux tier id; empty string for an unknown id. */
export const fluxTierDescriptor = (id: string): string => FLUX_TIER_DESCRIPTORS[id] ?? '';
