/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { hasSpecificModelCapability } from '@/common/utils/modelCapabilities';
import { FLUX_IMAGE_ARMS, isImageModelName } from '@/common/config/imageModels';
import type { IProvider } from '@/common/config/storage';

// The image_generation token list is re-derived from the families Wayland
// actually ships an image path for - the same set `isImageModelName` uses for
// the picker (`src/common/config/imageModels.ts`), plus the FLUX.1 matcher and
// the `stable-diffusion` / `midjourney` / `dall-e` ids already named in
// CAPABILITY_EXCLUSIONS. These assertions pin that the two detectors agree, so
// a model the picker offers is never classified as a non-image model here.
const provider = { platform: 'openai-compatible' } as unknown as IProvider;

describe('hasSpecificModelCapability - image_generation token set', () => {
  const imageIds = [
    'gpt-image-1.5', // OpenAI Images - curated floor, imageModels.ts
    'gpt-image-1',
    'chatgpt-image-latest',
    'gemini-3-pro-image-preview', // nano-banana-pro
    'gemini-2.5-flash-image',
    'google/gemini-2.5-flash-image', // OpenRouter vendor-prefixed
    'nano-banana', // Flux arm - no "image" token, matched via `banana`
    'nano-banana-pro-4k',
    'imagen-4.0-generate-001',
    'dall-e-3',
    'stable-diffusion-xl-base-1.0',
    'midjourney-v6',
    'flux-1-schnell', // real FLUX.1, via FLUX_IMAGE_MODEL
  ];

  for (const id of imageIds) {
    it(`${id} is classified as an image-generation model`, () => {
      expect(hasSpecificModelCapability(provider, id, 'image_generation')).toBe(true);
    });
  }

  // Every id the image picker offers must also classify here. Keeps the two
  // detectors from drifting apart the way the inherited token list had.
  for (const arm of FLUX_IMAGE_ARMS) {
    it(`Flux image arm ${arm} passes both detectors`, () => {
      expect(isImageModelName(arm)).toBe(true);
      expect(hasSpecificModelCapability(provider, arm, 'image_generation')).toBe(true);
    });
  }

  // Chat models must never be classified as image generators.
  const chatIds = [
    'gpt-4o',
    'claude-3-5-sonnet',
    'deepseek-chat',
    'qwen2.5-coder:7b',
    'kuae-coder',
    'mistral-large-latest',
    'flux-auto', // Flux Router chat tier (#108)
    'flux-reasoning',
  ];

  for (const id of chatIds) {
    it(`${id} is NOT classified as an image-generation model`, () => {
      expect(hasSpecificModelCapability(provider, id, 'image_generation')).not.toBe(true);
    });
  }
});
