/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import type { CuratedModel } from '@process/providers/types';
import {
  describeModel,
  priceTier,
  modelKey,
  fluxTierDescriptor,
} from '@renderer/components/model/modelSelector/modelRowHelpers';

/** Minimal fully-typed curated model fixture; override fields per case. */
const model = (over: Partial<CuratedModel>): CuratedModel => ({
  id: 'm',
  providerId: 'openai',
  displayName: 'M',
  family: 'gpt',
  kind: 'text',
  enriched: true,
  tags: [],
  recommended: false,
  enabled: true,
  ...over,
});

describe('modelRowHelpers', () => {
  it('describeModel renders "<context> context · <provider>"', () => {
    expect(
      describeModel(
        model({
          id: 'claude-opus-4-8',
          providerId: 'anthropic',
          displayName: 'Opus 4.8',
          family: 'claude',
          contextWindow: 200000,
        })
      )
    ).toBe('200K context · Anthropic');
  });
  it('describeModel omits context when unknown', () => {
    expect(describeModel(model({ id: 'x', providerId: 'openai', displayName: 'X', family: 'gpt' }))).toBe('OpenAI');
  });
  it('describeModel drops the provider when includeProvider=false (provider-grouped zone)', () => {
    // Rows under a "Recommended for OpenAI" header must not repeat the provider.
    expect(describeModel(model({ providerId: 'anthropic', contextWindow: 200000 }), false)).toBe('200K context');
  });
  it('describeModel returns an empty descriptor when includeProvider=false and context is unknown', () => {
    expect(describeModel(model({ providerId: 'openai' }), false)).toBe('');
  });
  it('priceTier buckets by output cost per M', () => {
    expect(priceTier(model({ costOutPerM: 2 }))).toBe('$');
    expect(priceTier(model({ costOutPerM: 12 }))).toBe('$$');
    expect(priceTier(model({ costOutPerM: 40 }))).toBe('$$$');
  });
  it('modelKey is providerId:id', () => {
    expect(modelKey(model({ providerId: 'anthropic', id: 'claude-opus-4-8' }))).toBe('anthropic:claude-opus-4-8');
  });
  it('fluxTierDescriptor returns a non-empty UI string per tier', () => {
    for (const id of ['flux-auto', 'flux-reasoning', 'flux-standard', 'flux-fast']) {
      expect(fluxTierDescriptor(id).length).toBeGreaterThan(0);
    }
  });
});
