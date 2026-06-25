/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { hasSpecificModelCapability } from '@/common/utils/modelCapabilities';
import type { IProvider } from '@/common/config/storage';

// Regression for the flux-auto "No model configured" bug: the Flux routing
// aliases (flux-auto / -fast / -reasoning / -standard) contain "flux", which
// matched the image_generation / excludeFromPrimary patterns and hid them from
// the model picker. They must be treated as first-class chat models, while real
// FLUX.1 image models (different ids) stay excluded.
const provider = { platform: 'openai-compatible' } as unknown as IProvider;

describe('hasSpecificModelCapability - Flux routing aliases', () => {
  const fluxIds = ['flux-auto', 'flux-fast', 'flux-reasoning', 'flux-standard'];

  for (const id of fluxIds) {
    it(`${id} is NOT excluded from the primary picker`, () => {
      expect(hasSpecificModelCapability(provider, id, 'excludeFromPrimary')).toBe(false);
    });

    it(`${id} is NOT treated as an image-generation model`, () => {
      expect(hasSpecificModelCapability(provider, id, 'image_generation')).toBe(false);
    });

    it(`${id} is a chat (text + function_calling) model`, () => {
      expect(hasSpecificModelCapability(provider, id, 'text')).toBe(true);
      expect(hasSpecificModelCapability(provider, id, 'function_calling')).toBe(true);
    });
  }

  it('a real FLUX.1 image model is still excluded from the primary picker', () => {
    expect(hasSpecificModelCapability(provider, 'flux-1-schnell', 'excludeFromPrimary')).toBe(true);
  });

  it('a real FLUX.1 image model is still detected as image generation', () => {
    expect(hasSpecificModelCapability(provider, 'flux-1-schnell', 'image_generation')).toBe(true);
  });
});
