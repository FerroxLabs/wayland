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
  LEGACY_FLUX_IMAGE_ARMS,
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
    expect(curatedImageModelsForProvider({ platform: 'openai', baseUrl: 'https://api.fluxrouter.ai/v1' })).toEqual([
      ...FLUX_IMAGE_ARMS,
    ]);
  });

  it('returns the Flux arm floor by the flux-router platform id', () => {
    expect(curatedImageModelsForProvider({ platform: 'flux-router' })).toEqual([...FLUX_IMAGE_ARMS]);
  });

  it('every Flux arm id reads as an image model so the picker keeps them', () => {
    for (const arm of FLUX_IMAGE_ARMS) {
      expect(isImageModelName(arm)).toBe(true);
    }
  });

  it('defaults to GPT Image 2.5 (standard quality), which leads the arm list', () => {
    expect(FLUX_DEFAULT_IMAGE_ARM).toBe(FLUX_RECOMMENDED_IMAGE_ID);
    expect(FLUX_RECOMMENDED_IMAGE_ID).toBe('flux-image-gpt25');
    expect(FLUX_IMAGE_ARMS[0]).toBe(FLUX_RECOMMENDED_IMAGE_ID);
  });

  it("offers the GPT Image 2.5 ladder and keeps Flux's own default alias pinnable", () => {
    for (const arm of [
      'flux-image-gpt25',
      'flux-image-gpt25-high',
      'flux-image-gpt25-low',
      'flux-image-gpt25-xl',
      'flux-image',
      'flux-image-gpt-high',
    ]) {
      expect(FLUX_IMAGE_ARMS).toContain(arm);
    }
  });

  it("only ships customer aliases - a customer key answers 403 to the proxy's internal arm names", () => {
    // Live 2026-09-12: `gpt-image-high` -> 403 permission_error; every
    // `flux-image-*` alias from GET /v1/models -> 200.
    for (const arm of FLUX_IMAGE_ARMS) {
      expect(arm).toMatch(/^flux-image(-|$)/);
      expect(LEGACY_FLUX_IMAGE_ARMS).not.toHaveProperty(arm);
    }
    expect(new Set(FLUX_IMAGE_ARMS).size).toBe(FLUX_IMAGE_ARMS.length);
  });

  it('maps every legacy picker id onto an offered alias', () => {
    expect(Object.keys(LEGACY_FLUX_IMAGE_ARMS)).toEqual([
      'gpt-image-high',
      'gpt-image-high-xl',
      'gpt-image-med',
      'nano-banana-pro-4k',
      'nano-banana-pro-2k',
      'nano-banana',
      'flux-image-together-flux',
    ]);
    for (const alias of Object.values(LEGACY_FLUX_IMAGE_ARMS)) {
      expect(FLUX_IMAGE_ARMS).toContain(alias);
    }
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
      isFluxProviderRow({
        platform: 'openai-compatible',
        baseUrl: '',
        __waylandModelRegistryBridge: 'v2:google-gemini',
      })
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
    expect(imageModelDisplayLabel('flux-image-gpt25')).toBe('GPT Image 2.5');
    expect(imageModelDisplayLabel('flux-image-gpt25-high')).toBe('GPT Image 2.5 (High)');
    expect(imageModelDisplayLabel('flux-image')).toBe('Flux Image (Auto)');
    expect(imageModelDisplayLabel('flux-image-gpt-high')).toBe('GPT Image (High)');
    expect(imageModelDisplayLabel('flux-image-nano-banana-pro')).toBe('Nano Banana Pro');
  });

  it('labels every offered arm', () => {
    for (const arm of FLUX_IMAGE_ARMS) {
      expect(imageModelDisplayLabel(arm)).not.toBe(arm);
    }
  });

  it('falls back to the raw id for non-Flux models', () => {
    expect(imageModelDisplayLabel('gpt-image-1.5')).toBe('gpt-image-1.5');
    expect(imageModelDisplayLabel('gemini-3-pro-image-preview')).toBe('gemini-3-pro-image-preview');
  });
});
