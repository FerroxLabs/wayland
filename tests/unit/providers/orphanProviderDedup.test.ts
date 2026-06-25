/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import type { IProvider } from '@/common/config/storage';
import {
  dedupeOrphanProviders,
  runOrphanProviderDedup,
  SINGLETON_PLATFORMS,
  type OrphanDedupStore,
} from '@process/providers/migration/orphanProviderDedup';

const BRIDGE_TAG_KEY = '__waylandModelRegistryBridge';

function provider(over: Partial<IProvider> & { platform: string; name: string }): IProvider {
  return {
    id: over.name.toLowerCase(),
    baseUrl: '',
    apiKey: 'sk-test',
    model: [],
    ...over,
  } as IProvider;
}

function bridge(over: Partial<IProvider> & { platform: string; name: string }, tag: string): IProvider {
  return { ...provider(over), [BRIDGE_TAG_KEY]: tag } as IProvider;
}

describe('dedupeOrphanProviders', () => {
  it('removes an untagged Gemini when a bridge Google Gemini shares the platform', () => {
    const rows = [
      provider({ name: 'Gemini', platform: 'gemini', model: ['gemini-2.5-flash'] }),
      bridge({ name: 'Google Gemini', platform: 'gemini', model: ['gemini-3-pro'] }, 'v2:google-gemini'),
    ];
    const { kept, removed } = dedupeOrphanProviders(rows);
    expect(removed.map((r) => r.name)).toEqual(['Gemini']);
    expect(kept.map((r) => r.name)).toEqual(['Google Gemini']);
  });

  it('also dedups anthropic and openai (the other singleton platforms)', () => {
    const rows = [
      provider({ name: 'Anthropic', platform: 'anthropic' }),
      bridge({ name: 'Anthropic', platform: 'anthropic' }, 'v2:anthropic'),
      provider({ name: 'Openai', platform: 'openai' }),
      bridge({ name: 'Openai', platform: 'openai' }, 'v2:openai'),
    ];
    const { kept, removed } = dedupeOrphanProviders(rows);
    expect(removed.map((r) => r.platform).toSorted()).toEqual(['anthropic', 'openai']);
    expect(kept.every((r) => typeof (r as Record<string, unknown>)[BRIDGE_TAG_KEY] === 'string')).toBe(true);
  });

  it('keeps an untagged Gemini when NO bridge sibling exists (Google-auth case: no bridge row)', () => {
    const rows = [provider({ name: 'Gemini', platform: 'gemini' })];
    const { kept, removed } = dedupeOrphanProviders(rows);
    expect(removed).toHaveLength(0);
    expect(kept).toHaveLength(1);
  });

  it('never collapses openai-compatible siblings even with a bridge row present', () => {
    const rows = [
      provider({ name: 'My Custom LLM', platform: 'openai-compatible', baseUrl: 'https://custom.example/v1' }),
      bridge({ name: 'Groq', platform: 'openai-compatible' }, 'v2:groq'),
    ];
    const { kept, removed } = dedupeOrphanProviders(rows);
    expect(removed).toHaveLength(0);
    expect(kept).toHaveLength(2);
  });

  it('does not touch bridge rows even on singleton platforms', () => {
    const rows = [bridge({ name: 'Google Gemini', platform: 'gemini' }, 'v2:google-gemini')];
    const { removed } = dedupeOrphanProviders(rows);
    expect(removed).toHaveLength(0);
  });

  it('removes multiple orphans on the same platform', () => {
    const rows = [
      provider({ name: 'Gemini', platform: 'gemini' }),
      provider({ name: 'Gemini (old)', platform: 'gemini' }),
      bridge({ name: 'Google Gemini', platform: 'gemini' }, 'v2:google-gemini'),
    ];
    const { kept, removed } = dedupeOrphanProviders(rows);
    expect(removed).toHaveLength(2);
    expect(kept.map((r) => r.name)).toEqual(['Google Gemini']);
  });

  it('treats an empty-string tag as non-bridge (untagged)', () => {
    const rows = [
      bridge({ name: 'Gemini', platform: 'gemini' }, ''),
      bridge({ name: 'Google Gemini', platform: 'gemini' }, 'v2:google-gemini'),
    ];
    const { removed } = dedupeOrphanProviders(rows);
    expect(removed.map((r) => r.name)).toEqual(['Gemini']);
  });

  it('exposes exactly the three singleton platforms', () => {
    expect([...SINGLETON_PLATFORMS].toSorted()).toEqual(['anthropic', 'gemini', 'openai']);
  });
});

function fakeStore(initial: unknown): { store: OrphanDedupStore; writes: unknown[] } {
  let value = initial;
  const writes: unknown[] = [];
  return {
    writes,
    store: {
      get: async () => value,
      set: async (_key, v) => {
        value = v;
        writes.push(v);
      },
    },
  };
}

describe('runOrphanProviderDedup', () => {
  it('writes back only the kept rows when an orphan is removed', async () => {
    const rows = [
      provider({ name: 'Gemini', platform: 'gemini' }),
      bridge({ name: 'Google Gemini', platform: 'gemini' }, 'v2:google-gemini'),
    ];
    const { store, writes } = fakeStore(rows);
    const removed = await runOrphanProviderDedup(store);
    expect(removed).toBe(1);
    expect(writes).toHaveLength(1);
    expect((writes[0] as IProvider[]).map((r) => r.name)).toEqual(['Google Gemini']);
  });

  it('does not write when there is nothing to remove (idempotent steady state)', async () => {
    const rows = [bridge({ name: 'Google Gemini', platform: 'gemini' }, 'v2:google-gemini')];
    const { store, writes } = fakeStore(rows);
    const removed = await runOrphanProviderDedup(store);
    expect(removed).toBe(0);
    expect(writes).toHaveLength(0);
  });

  it('no-ops on a missing or non-array model.config', async () => {
    const { store, writes } = fakeStore(undefined);
    expect(await runOrphanProviderDedup(store)).toBe(0);
    expect(writes).toHaveLength(0);
  });

  it('swallows a throwing store and returns 0', async () => {
    const store: OrphanDedupStore = {
      get: async () => {
        throw new Error('disk gone');
      },
      set: async () => {},
    };
    expect(await runOrphanProviderDedup(store)).toBe(0);
  });
});
