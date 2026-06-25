/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';

import { autoRegisterOllamaInRepo } from '@process/onboarding/autoRegisterOllama';
import type { OllamaRegistryRepo } from '@process/onboarding/autoRegisterOllama';
import type { CatalogModel, ProviderId } from '@process/providers/types';

/** Minimal in-memory repo fake covering only the slice the flow uses. */
function makeRepo(initial?: { state: string }): OllamaRegistryRepo & {
  upserts: Array<{ providerId: ProviderId; state: string; creds: Record<string, unknown> }>;
  catalogs: Map<ProviderId, CatalogModel[]>;
  provider: { state: string } | null;
} {
  const upserts: Array<{ providerId: ProviderId; state: string; creds: Record<string, unknown> }> = [];
  const catalogs = new Map<ProviderId, CatalogModel[]>();
  const repo = {
    provider: initial ?? null,
    upserts,
    catalogs,
    getRegistryProvider(_id: ProviderId) {
      return repo.provider;
    },
    upsertRegistryProvider(params: {
      providerId: ProviderId;
      connectedVia: string;
      state: 'connected' | 'testing' | 'error';
      creds: Record<string, unknown>;
    }) {
      upserts.push({ providerId: params.providerId, state: params.state, creds: params.creds });
      repo.provider = { state: params.state };
    },
    replaceRegistryCatalog(id: ProviderId, models: CatalogModel[]) {
      catalogs.set(id, models);
    },
  };
  return repo;
}

describe('autoRegisterOllamaInRepo', () => {
  it('creates the ollama-local provider once with a catalog from probe models', () => {
    const repo = makeRepo();
    const outcome = autoRegisterOllamaInRepo(repo, { running: true, models: ['llama3:latest', 'qwen2.5:7b'] });

    expect(outcome).toEqual({ action: 'created', models: 2 });
    expect(repo.upserts).toHaveLength(1);
    expect(repo.upserts[0]).toMatchObject({
      providerId: 'ollama-local',
      state: 'connected',
      creds: { key: '', baseUrl: 'http://127.0.0.1:11434/v1' },
    });
    const catalog = repo.catalogs.get('ollama-local') ?? [];
    expect(catalog.map((m) => m.id)).toEqual(['llama3:latest', 'qwen2.5:7b']);
    expect(catalog[0].providerId).toBe('ollama-local');
    expect(catalog[0].family).toBe('llama3');
  });

  it('filters out local vision/VLM models a chat agent cannot drive', () => {
    const repo = makeRepo();
    const outcome = autoRegisterOllamaInRepo(repo, {
      running: true,
      models: ['llama3:latest', 'llava:13b', 'qwen2.5-vl:7b', 'moondream:latest', 'mistral:7b'],
    });

    expect(outcome).toEqual({ action: 'created', models: 2 });
    expect(repo.catalogs.get('ollama-local')?.map((m) => m.id)).toEqual(['llama3:latest', 'mistral:7b']);
  });

  it('does nothing when Ollama is not running', () => {
    const repo = makeRepo();
    const outcome = autoRegisterOllamaInRepo(repo, { running: false, models: [] });

    expect(outcome).toEqual({ action: 'skipped' });
    expect(repo.upserts).toHaveLength(0);
    expect(repo.catalogs.size).toBe(0);
  });

  it('refreshes the catalog on a second run without duplicating or flipping state', () => {
    // Provider already exists in a user-disabled state.
    const repo = makeRepo({ state: 'error' });
    const outcome = autoRegisterOllamaInRepo(repo, { running: true, models: ['llama3:latest', 'mistral:latest'] });

    expect(outcome).toEqual({ action: 'refreshed', models: 2 });
    // No new upsert - state preserved.
    expect(repo.upserts).toHaveLength(0);
    expect(repo.provider).toEqual({ state: 'error' });
    expect(repo.catalogs.get('ollama-local')?.map((m) => m.id)).toEqual(['llama3:latest', 'mistral:latest']);
  });

  it('de-duplicates and drops empty model names', () => {
    const repo = makeRepo();
    const outcome = autoRegisterOllamaInRepo(repo, {
      running: true,
      models: ['llama3:latest', '', '  ', 'llama3:latest', 'phi3:mini'],
    });

    expect(outcome).toEqual({ action: 'created', models: 2 });
    expect(repo.catalogs.get('ollama-local')?.map((m) => m.id)).toEqual(['llama3:latest', 'phi3:mini']);
  });

  it('degrades to skipped (never throws) when the repo throws', () => {
    const repo = makeRepo();
    vi.spyOn(repo, 'getRegistryProvider').mockImplementation(() => {
      throw new Error('db down');
    });
    expect(autoRegisterOllamaInRepo(repo, { running: true, models: ['x'] })).toEqual({ action: 'skipped' });
  });
});
