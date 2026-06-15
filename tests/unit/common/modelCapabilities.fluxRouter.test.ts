/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { hasSpecificModelCapability } from '@/common/utils/modelCapabilities';
import type { IProvider } from '@/common/config/storage';

const fluxProvider = { id: 'flux-router', platform: 'flux-router', model: [] } as unknown as IProvider;

/**
 * Regression for issue #108 — a brand-new user whose only connected provider is
 * Flux Router got an empty home model list and their first chat was silently
 * dropped. The cause: the `excludeFromPrimary` capability rule matched a bare
 * `flux` token, so Flux Router's chat-routing tiers (`flux-auto`, `flux-fast`,
 * `flux-balanced`, `flux-reasoning`) were treated like FLUX image-diffusion
 * models and filtered out of the primary picker. These assertions pin the
 * discrimination: Router chat tiers are primary-eligible, FLUX image models are
 * not.
 */
describe('hasSpecificModelCapability — Flux Router vs FLUX image models (issue #108)', () => {
  const ROUTER_TIERS = ['flux-auto', 'flux-fast', 'flux-balanced', 'flux-reasoning'];
  const IMAGE_MODELS = ['flux-dev', 'flux-schnell', 'flux-pro', 'flux-2-pro', 'flux.1', 'flux-1', 'flux-kontext'];

  it.each(ROUTER_TIERS)('keeps Flux Router chat tier %s in the primary picker', (model) => {
    // A primary-eligible model is one the `excludeFromPrimary` rule does NOT
    // match. `getAvailableModels` filters a model out when this returns `true`,
    // so it must be `undefined` (no match) for the Router tiers — the bug was a
    // `true` match on the bare `flux` token.
    expect(hasSpecificModelCapability(fluxProvider, model, 'excludeFromPrimary')).toBeUndefined();
  });

  it.each(ROUTER_TIERS)('does not classify Flux Router chat tier %s as image generation', (model) => {
    expect(hasSpecificModelCapability(fluxProvider, model, 'image_generation')).not.toBe(true);
  });

  it.each(IMAGE_MODELS)('still excludes FLUX image model %s from the primary picker', (model) => {
    expect(hasSpecificModelCapability(fluxProvider, model, 'excludeFromPrimary')).toBe(true);
  });

  it.each(IMAGE_MODELS)('still classifies FLUX image model %s as image generation', (model) => {
    expect(hasSpecificModelCapability(fluxProvider, model, 'image_generation')).toBe(true);
  });
});
