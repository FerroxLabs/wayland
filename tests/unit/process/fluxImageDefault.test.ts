/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { resolveFluxImageDefault } from '@/process/utils/fluxImageDefault';
import type { IProvider } from '@/common/config/storage';

const fluxRow = (overrides: Partial<IProvider> = {}): IProvider => ({
  id: 'flux-router',
  platform: 'openai',
  name: 'Flux Router',
  baseUrl: 'https://api.fluxrouter.ai/v1',
  apiKey: 'legacy-plaintext-key',
  model: ['flux-auto'],
  ...overrides,
});

const otherRow = (): IProvider => ({
  id: 'oai',
  platform: 'openai',
  name: 'OpenAI',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: 'sk-oai',
  model: ['gpt-5'],
});

describe('resolveFluxImageDefault', () => {
  it('seeds the Flux default arm when Flux is connected and no image model is chosen', () => {
    const seed = resolveFluxImageDefault({ current: undefined, providers: [fluxRow()], fluxKey: 'sk-flux' });
    expect(seed).toEqual({
      id: 'flux-router',
      name: 'Flux Router',
      platform: 'openai',
      baseUrl: 'https://api.fluxrouter.ai/v1',
      apiKey: 'sk-flux',
      useModel: 'flux-image',
    });
  });

  it('seeds for the real bridged Flux row (openai-compatible + empty baseUrl + registry tag)', () => {
    const bridged = {
      id: '3a5a47d1',
      platform: 'openai-compatible',
      name: 'Flux Router',
      baseUrl: '',
      apiKey: '',
      model: ['flux-image'],
      __waylandModelRegistryBridge: 'v2:flux-router',
    } as unknown as IProvider;
    const seed = resolveFluxImageDefault({ current: undefined, providers: [bridged], fluxKey: 'sk-flux' });
    expect(seed?.useModel).toBe('flux-image');
    expect(seed?.id).toBe('3a5a47d1');
    expect(seed?.apiKey).toBe('sk-flux');
    // Empty baseUrl falls back to the Flux OpenAI surface.
    expect(seed?.baseUrl).toBe('https://api.fluxrouter.ai/v1');
  });

  it('uses the registry key, not the legacy row apiKey', () => {
    const seed = resolveFluxImageDefault({ current: undefined, providers: [fluxRow()], fluxKey: 'sk-from-registry' });
    expect(seed?.apiKey).toBe('sk-from-registry');
  });

  it('matches a Flux row by the flux-router platform id even without a baseUrl', () => {
    const seed = resolveFluxImageDefault({
      current: undefined,
      providers: [fluxRow({ platform: 'flux-router', baseUrl: '' })],
      fluxKey: 'sk-flux',
    });
    expect(seed?.useModel).toBe('flux-image');
    expect(seed?.baseUrl).toBe('https://api.fluxrouter.ai/v1');
  });

  it('does NOT seed when the user already chose an image model', () => {
    const current = {
      id: 'fal',
      name: 'FAL',
      platform: 'fal',
      baseUrl: '',
      apiKey: 'k',
      useModel: 'flux-2-pro',
    } as Parameters<typeof resolveFluxImageDefault>[0]['current'];
    expect(resolveFluxImageDefault({ current, providers: [fluxRow()], fluxKey: 'sk-flux' })).toBeNull();
  });

  it('does NOT seed when Flux is not connected (no key)', () => {
    expect(resolveFluxImageDefault({ current: undefined, providers: [fluxRow()], fluxKey: undefined })).toBeNull();
  });

  it('does NOT seed when no Flux row exists in model.config', () => {
    expect(resolveFluxImageDefault({ current: undefined, providers: [otherRow()], fluxKey: 'sk-flux' })).toBeNull();
  });

  it('does not mistake an OpenAI row for Flux', () => {
    expect(resolveFluxImageDefault({ current: undefined, providers: [otherRow()], fluxKey: 'sk-flux' })).toBeNull();
  });
});
