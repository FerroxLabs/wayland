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

  describe('tool-capability filtering', () => {
    // Ollama reports per-model capabilities on /api/tags. A model whose list
    // omits `tools` returns HTTP 400 on its FIRST turn, because the engine
    // always advertises tools - so offering it is offering a model that cannot
    // answer. Two real models on this machine were in that state.
    it('hides a model the daemon says cannot take tools', () => {
      const repo = makeRepo();
      const outcome = autoRegisterOllamaInRepo(repo, {
        running: true,
        models: ['qwen2.5:7b', 'gemma3:4b'],
        modelCapabilities: {
          'qwen2.5:7b': ['completion', 'tools'],
          'gemma3:4b': ['completion'],
        },
      });

      expect(outcome).toEqual({ action: 'created', models: 1 });
      expect(repo.catalogs.get('ollama-local')?.map((m) => m.id)).toEqual(['qwen2.5:7b']);
    });

    it('keeps EVERY model when the daemon reports no capabilities at all', () => {
      // The failure that matters most. An older daemon omits the field, and a
      // naive `!tags.includes('tools')` check would empty the entire model
      // list - a far worse and much harder-to-diagnose bug than the 400 this
      // filter exists to prevent. Fail closed on evidence, open on ignorance.
      const repo = makeRepo();
      const outcome = autoRegisterOllamaInRepo(repo, {
        running: true,
        models: ['llama3:latest', 'mistral:latest'],
      });

      expect(outcome).toEqual({ action: 'created', models: 2 });
      expect(repo.catalogs.get('ollama-local')?.map((m) => m.id)).toEqual(['llama3:latest', 'mistral:latest']);
    });

    it('keeps a model absent from a capabilities map that covers its siblings', () => {
      // Partial reporting is the same ignorance case, per model rather than per
      // daemon: silence about THIS model is not evidence against it.
      const repo = makeRepo();
      autoRegisterOllamaInRepo(repo, {
        running: true,
        models: ['known:1', 'unlisted:1'],
        modelCapabilities: { 'known:1': ['completion', 'tools'] },
      });

      expect(repo.catalogs.get('ollama-local')?.map((m) => m.id)).toEqual(['known:1', 'unlisted:1']);
    });

    it('records tool support tri-state on the catalog row', () => {
      const repo = makeRepo();
      autoRegisterOllamaInRepo(repo, {
        running: true,
        models: ['capable:1', 'silent:1'],
        modelCapabilities: { 'capable:1': ['completion', 'tools'] },
      });

      const rows = repo.catalogs.get('ollama-local') ?? [];
      const capable = rows.find((m) => m.id === 'capable:1');
      const silent = rows.find((m) => m.id === 'silent:1');

      expect(capable?.toolCall).toBe(true);
      expect(capable?.tags).toContain('tools');
      // Never asked must stay UNDEFINED, not false - `false` would claim the
      // daemon denied tool support when it simply said nothing.
      expect(silent?.toolCall).toBeUndefined();
      expect(silent?.tags).not.toContain('tools');
    });

    it('ignores a malformed capabilities value instead of hiding the model', () => {
      const repo = makeRepo();
      autoRegisterOllamaInRepo(repo, {
        running: true,
        models: ['weird:1'],
        modelCapabilities: { 'weird:1': 'tools' as unknown as string[] },
      });

      expect(repo.catalogs.get('ollama-local')?.map((m) => m.id)).toEqual(['weird:1']);
    });
  });

  it('degrades to skipped (never throws) when the repo throws', () => {
    const repo = makeRepo();
    vi.spyOn(repo, 'getRegistryProvider').mockImplementation(() => {
      throw new Error('db down');
    });
    expect(autoRegisterOllamaInRepo(repo, { running: true, models: ['x'] })).toEqual({ action: 'skipped' });
  });
});
