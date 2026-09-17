/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  FUIGO_CACHED_FLUX_AUTO_MIGRATION_KEY,
  runFuigoCachedFluxAutoMigration,
  type FuigoCachedFluxAutoConfigStore,
} from '@process/utils/migrations/fuigoCachedFluxAutoMigration';

function makeStore(initial: Record<string, unknown>) {
  const data: Record<string, unknown> = structuredClone(initial);
  const writes: string[] = [];
  const store: FuigoCachedFluxAutoConfigStore = {
    get: (async (key: string) => data[key]) as FuigoCachedFluxAutoConfigStore['get'],
    set: (async (key: string, value: unknown) => {
      data[key] = value;
      writes.push(key);
      return value;
    }) as FuigoCachedFluxAutoConfigStore['set'],
  };
  return { store, data, writes };
}

const CATALOG = [
  { id: 'flux-auto', label: 'Flux Auto' },
  { id: 'flux-reasoning', label: 'Flux Reasoning' },
];
const cachedFuigo = (currentModelId: string | null) => ({
  currentModelId,
  currentModelLabel: currentModelId,
  availableModels: CATALOG,
  canSwitch: true,
  source: 'models',
});

describe('runFuigoCachedFluxAutoMigration', () => {
  it("clears Fuigo's cached flux-auto default, keeps its catalog and every other backend", async () => {
    const claude = cachedFuigo('opus');
    const { store, data } = makeStore({
      'acp.cachedModels': { fuigo: cachedFuigo('flux-auto'), claude },
    });

    await runFuigoCachedFluxAutoMigration(store);

    expect(data['acp.cachedModels']).toEqual({
      fuigo: { ...cachedFuigo(null), currentModelLabel: null },
      claude,
    });
    expect(data[FUIGO_CACHED_FLUX_AUTO_MIGRATION_KEY]).toBe(true);
  });

  it('leaves explicit picks alone: they live in acp.config / fuigo.defaultModel, not the cache', async () => {
    const acpConfig = { fuigo: { preferredModelId: 'flux-auto' } };
    const saved = { id: 'flux-router', useModel: 'flux-auto' };
    const { store, data, writes } = makeStore({
      'acp.cachedModels': { fuigo: cachedFuigo('flux-auto') },
      'acp.config': acpConfig,
      'fuigo.defaultModel': saved,
    });

    await runFuigoCachedFluxAutoMigration(store);

    expect(data['acp.config']).toEqual(acpConfig);
    expect(data['fuigo.defaultModel']).toEqual(saved);
    expect(writes).not.toContain('acp.config');
    expect(writes).not.toContain('fuigo.defaultModel');
  });

  it('does not touch a cached model that is not flux-auto', async () => {
    const { store, data, writes } = makeStore({ 'acp.cachedModels': { fuigo: cachedFuigo('flux-reasoning') } });

    await runFuigoCachedFluxAutoMigration(store);

    expect(data['acp.cachedModels']).toEqual({ fuigo: cachedFuigo('flux-reasoning') });
    expect(writes).toEqual([FUIGO_CACHED_FLUX_AUTO_MIGRATION_KEY]);
  });

  it('runs once: a flux-auto cached after the flag is set is left for the resolver to ignore', async () => {
    const { store, data, writes } = makeStore({
      'acp.cachedModels': { fuigo: cachedFuigo('flux-auto') },
      [FUIGO_CACHED_FLUX_AUTO_MIGRATION_KEY]: true,
    });

    await runFuigoCachedFluxAutoMigration(store);

    expect(writes).toEqual([]);
    expect((data['acp.cachedModels'] as { fuigo: { currentModelId: string } }).fuigo.currentModelId).toBe('flux-auto');
  });

  it('copes with no cache at all', async () => {
    const { store, data } = makeStore({});
    await runFuigoCachedFluxAutoMigration(store);
    expect(data['acp.cachedModels']).toBeUndefined();
    expect(data[FUIGO_CACHED_FLUX_AUTO_MIGRATION_KEY]).toBe(true);
  });
});
