/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/** Registry provider id the minted Flux key connects as. */
export const FLUX_PROVIDER_ID = 'flux-router' as const;

/** Default auto-routing model. */
export const FLUX_AUTO_MODEL = 'flux-auto' as const;

/** The four selectable Flux tiers, auto first. Order is the picker order. */
export const FLUX_MODEL_IDS = ['flux-auto', 'flux-reasoning', 'flux-standard', 'flux-fast'] as const;

export type FluxModelId = (typeof FLUX_MODEL_IDS)[number];

/** Human labels for the picker (English; rendered via i18n key when in UI chrome). */
export const FLUX_MODEL_DISPLAY: Record<FluxModelId, string> = {
  'flux-auto': 'Flux Auto',
  'flux-reasoning': 'Flux Reasoning',
  'flux-standard': 'Flux Standard',
  'flux-fast': 'Flux Fast',
};

/**
 * One host, three surfaces (R1). Backends must point at the correct one.
 * - openai: /chat/completions + /models (gemini, wcore, generic ACP)
 * - responses: /v1 with wire_api=responses (codex; Phase 2)
 * - anthropic: /v1/messages (claude; Phase 2)
 */
export const FLUX_SURFACE = {
  openai: 'https://api.fluxrouter.ai/v1',
  responses: 'https://api.fluxrouter.ai/v1',
  anthropic: 'https://api.fluxrouter.ai/anthropic',
} as const;

export function isFluxProvider(providerId: string | undefined | null): boolean {
  return providerId === FLUX_PROVIDER_ID;
}

export function isFluxModelId(modelId: string | undefined | null): boolean {
  return typeof modelId === 'string' && (FLUX_MODEL_IDS as readonly string[]).includes(modelId);
}
