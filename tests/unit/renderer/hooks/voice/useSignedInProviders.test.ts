/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it } from 'vitest';
import { providersFromRegistry } from '@/renderer/hooks/voice/useSignedInProviders';
import type { IModelRegistryProviderView } from '@/common/adapter/ipcBridge';

const view = (over: Partial<IModelRegistryProviderView>): IModelRegistryProviderView => ({
  providerId: 'openai',
  connectedVia: 'apiKey',
  state: 'connected',
  modelCount: 1,
  ...over,
});

describe('providersFromRegistry', () => {
  it('returns an empty set when nothing is connected', () => {
    expect(providersFromRegistry([]).size).toBe(0);
  });

  it('includes a connected provider id', () => {
    const set = providersFromRegistry([view({ providerId: 'deepgram' })]);
    expect(set.has('deepgram')).toBe(true);
  });

  it("treats a 'testing' provider as signed in (credentials already exist)", () => {
    const set = providersFromRegistry([view({ providerId: 'elevenlabs', state: 'testing' })]);
    expect(set.has('elevenlabs')).toBe(true);
  });

  it("excludes a provider in 'error' state", () => {
    const set = providersFromRegistry([view({ providerId: 'azure', state: 'error' })]);
    expect(set.has('azure')).toBe(false);
  });

  it('excludes a provider carrying a blocking connect error', () => {
    const set = providersFromRegistry([view({ providerId: 'groq', error: 'unauthorized' })]);
    expect(set.has('groq')).toBe(false);
  });

  it('maps a ChatGPT subscription sign-in to openai (alias)', () => {
    const set = providersFromRegistry([view({ providerId: 'chatgpt-subscription' })]);
    expect(set.has('openai')).toBe(true);
    // The raw registry id is still present too.
    expect(set.has('chatgpt-subscription')).toBe(true);
  });

  it('satisfies openai via a plain OpenAI API key as well', () => {
    const set = providersFromRegistry([view({ providerId: 'openai' })]);
    expect(set.has('openai')).toBe(true);
  });

  it('aggregates multiple signed-in voice providers', () => {
    const set = providersFromRegistry([
      view({ providerId: 'openai' }),
      view({ providerId: 'deepgram' }),
      view({ providerId: 'elevenlabs', state: 'error' }),
    ]);
    expect([...set].sort()).toEqual(['deepgram', 'openai']);
  });
});
