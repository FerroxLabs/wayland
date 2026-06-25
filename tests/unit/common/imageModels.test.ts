/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect } from 'vitest';
import {
  isImageModelName,
  curatedImageModelsForProvider,
  imageModelDisplayLabel,
  isFluxProviderRow,
  FLUX_IMAGE_ARMS,
  FLUX_DEFAULT_IMAGE_ARM,
  FLUX_RECOMMENDED_IMAGE_ID,
} from '@/common/config/imageModels';

describe('isImageModelName', () => {
  it('matches OpenAI Images family', () => {
    expect(isImageModelName('gpt-image-1.5')).toBe(true);
    expect(isImageModelName('gpt-image-1')).toBe(true);
    expect(isImageModelName('chatgpt-image-latest')).toBe(true);
    expect(isImageModelName('dall-e-3')).toBe(true);
  });

  it('matches Google + alias image ids', () => {
    expect(isImageModelName('gemini-3-pro-image-preview')).toBe(true);
    expect(isImageModelName('gemini-2.5-flash-image')).toBe(true);
    expect(isImageModelName('imagen-4.0-generate')).toBe(true);
    expect(isImageModelName('nano-banana-pro')).toBe(true);
    expect(isImageModelName('google/gemini-2.5-flash-image')).toBe(true);
  });

  it('does not match text models', () => {
    expect(isImageModelName('gpt-5')).toBe(false);
    expect(isImageModelName('claude-opus-4')).toBe(false);
    expect(isImageModelName('flux-auto')).toBe(false);
    expect(isImageModelName('gemini-3-pro')).toBe(false);
  });
});

describe('curatedImageModelsForProvider', () => {
  it('returns the OpenAI floor for the native OpenAI platform', () => {
    expect(curatedImageModelsForProvider({ platform: 'openai' })).toEqual([
      'gpt-image-1.5',
      'gpt-image-1',
      'chatgpt-image-latest',
    ]);
  });

  it('matches OpenAI by Images API host even when platform is openai-compatible', () => {
    expect(
      curatedImageModelsForProvider({ platform: 'openai-compatible', baseUrl: 'https://api.openai.com/v1' })
    ).toEqual(['gpt-image-1.5', 'gpt-image-1', 'chatgpt-image-latest']);
  });

  it('returns the Gemini floor (nano-banana-pro first) for native Gemini', () => {
    expect(curatedImageModelsForProvider({ platform: 'gemini' })).toEqual([
      'gemini-3-pro-image-preview',
      'gemini-2.5-flash-image',
    ]);
  });

  it('returns vendor-prefixed ids for OpenRouter regardless of platform string', () => {
    expect(curatedImageModelsForProvider({ platform: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1' })).toEqual([
      'google/gemini-3-pro-image-preview',
      'google/gemini-2.5-flash-image',
      'openai/gpt-image-1.5',
    ]);
  });

  it('checks host before platform so an openai-compatible OpenRouter row gets OpenRouter ids', () => {
    expect(
      curatedImageModelsForProvider({ platform: 'openai-compatible', baseUrl: 'https://openrouter.ai/api/v1' })
    ).toEqual(['google/gemini-3-pro-image-preview', 'google/gemini-2.5-flash-image', 'openai/gpt-image-1.5']);
  });

  it('returns an empty floor for unknown providers', () => {
    expect(curatedImageModelsForProvider({ platform: 'mystery', baseUrl: 'https://example.com' })).toEqual([]);
    expect(curatedImageModelsForProvider({})).toEqual([]);
  });

  it('returns the Flux arm floor by host, before the OpenAI rule, for a flux-host openai row', () => {
    // A connected Flux provider is mirrored with platform 'openai' + a Flux
    // baseUrl. It must get the Flux arms, NOT the OpenAI floor.
    expect(
      curatedImageModelsForProvider({ platform: 'openai', baseUrl: 'https://api.fluxrouter.ai/v1' })
    ).toEqual([...FLUX_IMAGE_ARMS]);
  });

  it('returns the Flux arm floor by the flux-router platform id', () => {
    expect(curatedImageModelsForProvider({ platform: 'flux-router' })).toEqual([...FLUX_IMAGE_ARMS]);
  });

  it('every Flux arm id reads as an image model so the picker keeps them', () => {
    for (const arm of FLUX_IMAGE_ARMS) {
      expect(isImageModelName(arm)).toBe(true);
    }
  });

  it('defaults to the recommended Flux Image entry, which leads the arm list', () => {
    expect(FLUX_DEFAULT_IMAGE_ARM).toBe(FLUX_RECOMMENDED_IMAGE_ID);
    expect(FLUX_RECOMMENDED_IMAGE_ID).toBe('flux-image');
    expect(FLUX_IMAGE_ARMS[0]).toBe(FLUX_RECOMMENDED_IMAGE_ID);
  });
});

describe('isFluxProviderRow', () => {
  it('matches by the Flux host or the flux-router platform id', () => {
    expect(isFluxProviderRow({ platform: 'openai', baseUrl: 'https://api.fluxrouter.ai/v1' })).toBe(true);
    expect(isFluxProviderRow({ platform: 'flux-router' })).toBe(true);
  });

  it('matches the real bridged Flux row (openai-compatible + empty baseUrl) via the registry tag', () => {
    expect(
      isFluxProviderRow({ platform: 'openai-compatible', baseUrl: '', __waylandModelRegistryBridge: 'v2:flux-router' })
    ).toBe(true);
  });

  it('does not match OpenAI, a non-flux bridge tag, or empty providers', () => {
    expect(isFluxProviderRow({ platform: 'openai', baseUrl: 'https://api.openai.com/v1' })).toBe(false);
    expect(
      isFluxProviderRow({ platform: 'openai-compatible', baseUrl: '', __waylandModelRegistryBridge: 'v2:google-gemini' })
    ).toBe(false);
    expect(isFluxProviderRow({})).toBe(false);
  });

  it('curated floor returns the Flux arms for the real bridged Flux row', () => {
    expect(
      curatedImageModelsForProvider({
        platform: 'openai-compatible',
        baseUrl: '',
        __waylandModelRegistryBridge: 'v2:flux-router',
      })
    ).toEqual([...FLUX_IMAGE_ARMS]);
  });
});

describe('imageModelDisplayLabel', () => {
  it('gives Flux arms friendly names', () => {
    expect(imageModelDisplayLabel('flux-image')).toBe('Flux Image');
    expect(imageModelDisplayLabel('gpt-image-high')).toBe('GPT Image (High)');
    expect(imageModelDisplayLabel('nano-banana-pro-2k')).toBe('Nano Banana Pro 2K');
    expect(imageModelDisplayLabel('flux-image-together-flux')).toBe('Together FLUX (Fastest)');
  });

  it('falls back to the raw id for non-Flux models', () => {
    expect(imageModelDisplayLabel('gpt-image-1.5')).toBe('gpt-image-1.5');
    expect(imageModelDisplayLabel('gemini-3-pro-image-preview')).toBe('gemini-3-pro-image-preview');
  });
});
