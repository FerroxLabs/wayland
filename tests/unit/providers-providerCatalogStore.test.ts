/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tests for the main-process Provider Catalog store (T3.3).
 *
 * The store surfaces the ~100 connectable catalog providers (NOT per-provider
 * models) from the bundled generated JSON, optionally enriched additively from
 * the models.dev registry. The vendored catalog is the routing authority:
 * `baseUrl`/`apiPath`/`envVar` come ONLY from the bundled file and are never
 * overwritten by enrichment. A failed/empty/oversize models.dev fetch returns
 * the bundled baseline unchanged (fail-safe floor), falling back to the last
 * good enrichment when present.
 */

import { describe, it, expect } from 'vitest';
import { loadBaselineProviderCatalog, ProviderCatalogStore } from '@process/providers/catalog/providerCatalogStore';
import type { ModelsDevRegistry } from '@process/providers/enrichment/modelsDevSchema';

/** A models.dev registry slice whose `api` URL deliberately differs from the vendored baseUrl. */
function registryWithDivergentApi(providerId: string): ModelsDevRegistry {
  return {
    // The well-known anchors so this fixture is registry-shaped if ever validated.
    anthropic: {
      id: 'anthropic',
      name: 'Anthropic',
      env: ['ANTHROPIC_API_KEY'],
      models: { a: { id: 'a', name: 'A' } },
    },
    openai: { id: 'openai', name: 'OpenAI', env: ['OPENAI_API_KEY'], models: { o: { id: 'o', name: 'O' } } },
    [providerId]: {
      id: providerId,
      name: 'Spoofed Name',
      env: ['SPOOFED_API_KEY'],
      // `api` is NOT part of the pinned schema and must NEVER be read into a URL.
      // We include it as an arbitrary extra field to prove the store ignores it.
      ...({ api: 'https://evil.example.com/spoofed' } as Record<string, unknown>),
      models: { m1: { id: 'm1', name: 'Model One' }, m2: { id: 'm2', name: 'Model Two' } },
    } as ModelsDevRegistry[string],
  };
}

describe('loadBaselineProviderCatalog', () => {
  it('loads the 100 bundled entries with intact baseUrl / envVar', () => {
    const baseline = loadBaselineProviderCatalog();
    expect(baseline.length).toBe(100);
    for (const entry of baseline) {
      expect(entry.id.trim()).not.toBe('');
      expect(entry.baseUrl.trim()).not.toBe('');
      expect(entry.envVar.trim()).not.toBe('');
    }
  });

  it('returns entries sorted by displayName', () => {
    const baseline = loadBaselineProviderCatalog();
    const names = baseline.map((e) => e.displayName);
    const sorted = [...names].toSorted((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });
});

describe('ProviderCatalogStore.getCatalog', () => {
  it('returns the baseline unchanged when no enrichment was applied', () => {
    const store = new ProviderCatalogStore();
    const baseline = loadBaselineProviderCatalog();
    expect(store.getCatalog()).toEqual(baseline);
  });

  it('returns the baseline unchanged when the models.dev fetch rejects (fail-safe floor)', async () => {
    const store = new ProviderCatalogStore({
      registrySource: { getRegistry: () => Promise.reject(new Error('network')) },
    });
    const baseline = loadBaselineProviderCatalog();
    await store.refresh();
    expect(store.getCatalog()).toEqual(baseline);
  });

  it('returns the baseline unchanged when the registry is empty (failed/non-JSON upstream)', async () => {
    const store = new ProviderCatalogStore({ registrySource: { getRegistry: () => Promise.resolve({}) } });
    const baseline = loadBaselineProviderCatalog();
    await store.refresh();
    expect(store.getCatalog()).toEqual(baseline);
  });

  it('keeps the last-good enrichment when a later fetch fails', async () => {
    const baseline = loadBaselineProviderCatalog();
    const target = baseline[0].id;
    const good = registryWithDivergentApi(target);

    let call = 0;
    const store = new ProviderCatalogStore({
      registrySource: {
        getRegistry: () => {
          call += 1;
          return call === 1 ? Promise.resolve(good) : Promise.reject(new Error('network'));
        },
      },
    });

    await store.refresh();
    const afterGood = store.getCatalog();
    // The first (good) fetch must genuinely have enriched the target provider -
    // otherwise the "keep last-good" assertion below would pass trivially.
    expect(afterGood.find((e) => e.id === target)?.modelCount).toBe(2);

    await store.refresh(); // second fetch fails - must NOT drop the last-good enrichment
    expect(store.getCatalog()).toEqual(afterGood);
    expect(store.getCatalog().find((e) => e.id === target)?.modelCount).toBe(2);
    // ...and never drops a baseline entry due to the failure.
    expect(store.getCatalog().length).toBe(baseline.length);
  });

  it('NEVER overwrites baseUrl / apiPath / envVar from enrichment (vendored authority)', async () => {
    const baseline = loadBaselineProviderCatalog();
    const target = baseline[0];
    const store = new ProviderCatalogStore({
      registrySource: { getRegistry: () => Promise.resolve(registryWithDivergentApi(target.id)) },
    });

    await store.refresh();
    const enriched = store.getCatalog().find((e) => e.id === target.id);
    expect(enriched).toBeDefined();
    // The enrichment path genuinely ran (additive metadata applied)...
    expect(enriched!.modelCount).toBe(2);
    // ...but the vendored authority fields are untouched.
    expect(enriched!.baseUrl).toBe(target.baseUrl);
    expect(enriched!.envVar).toBe(target.envVar);
    expect(enriched!.apiPath).toBe(target.apiPath);
    // The spoofed models.dev `api`/`env`/`name` must not have leaked in.
    expect(enriched!.baseUrl).not.toContain('evil.example.com');
    expect(enriched!.envVar).not.toBe('SPOOFED_API_KEY');
    expect(enriched!.displayName).toBe(target.displayName);
  });

  it('never drops a baseline entry; enrichment only adds metadata', async () => {
    const baseline = loadBaselineProviderCatalog();
    const store = new ProviderCatalogStore({
      registrySource: { getRegistry: () => Promise.resolve(registryWithDivergentApi(baseline[0].id)) },
    });
    await store.refresh();
    const ids = new Set(store.getCatalog().map((e) => e.id));
    for (const entry of baseline) expect(ids.has(entry.id)).toBe(true);
    expect(store.getCatalog().length).toBe(baseline.length);
  });

  it('applies a blocklist that removes an entry, but a fetch failure never drops a baseline entry', async () => {
    const baseline = loadBaselineProviderCatalog();
    const blocked = baseline[0].id;
    const store = new ProviderCatalogStore({
      registrySource: { getRegistry: () => Promise.reject(new Error('network')) },
      blocklist: [blocked],
    });
    await store.refresh();
    const ids = store.getCatalog().map((e) => e.id);
    expect(ids).not.toContain(blocked);
    // Every other baseline entry survives the failed fetch.
    expect(store.getCatalog().length).toBe(baseline.length - 1);
  });

  it('keeps the result sorted by displayName after enrichment', async () => {
    const baseline = loadBaselineProviderCatalog();
    const store = new ProviderCatalogStore({
      registrySource: { getRegistry: () => Promise.resolve(registryWithDivergentApi(baseline[0].id)) },
    });
    await store.refresh();
    const names = store.getCatalog().map((e) => e.displayName);
    const sorted = [...names].toSorted((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });
});
