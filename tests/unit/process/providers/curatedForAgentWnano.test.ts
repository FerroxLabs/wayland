/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1039 - the half that turns a defensible default into a trust problem.
 *
 * Wayland Nano routes across every connected provider, but `curatedForAgent`
 * had no arm for the `wnano` agent key, so the home picker's curated set came
 * back EMPTY and the flyout never rendered. A user could therefore not see
 * which provider Nano was about to spend, and could not change it, before the
 * first turn - the first evidence was their provider usage going up.
 *
 * Nano's picker must offer exactly the providers Nano is told about
 * (`NANO_KNOWN_PROVIDER_IDS`, the same set `WAYLAND_NANO_PROVIDERS` carries),
 * with the `<provider>:<model>` colon ids Nano advertises and routes on, so a
 * pick made here names a provider unambiguously at spawn.
 */
import { describe, it, expect, vi } from 'vitest';

const { mockSafeStorage } = vi.hoisted(() => ({
  mockSafeStorage: {
    isEncryptionAvailable: vi.fn(() => true),
    encryptString: vi.fn((p: string) => Buffer.from(p)),
    decryptString: vi.fn((c: Buffer) => c.toString('utf8')),
  },
}));
vi.mock('electron', () => ({ safeStorage: mockSafeStorage }));
vi.mock('@process/utils/fetchWithRetry', () => ({
  fetchWithRetry: vi.fn(async () => ({ ok: false, json: async () => ({}) })),
}));
vi.mock('@process/onboarding/codexAuthFile', () => ({ readCodexAuthFile: vi.fn().mockResolvedValue(null) }));

import { createModelRegistryHandlers } from '@process/providers/ipc/modelRegistryIpc';
import type { ModelRegistryDeps } from '@process/providers/ipc/modelRegistryIpc';
import type { CatalogModel, ProviderId } from '@process/providers/types';

type Row = { providerId: ProviderId; connectedVia: string; state: string; creds: Record<string, unknown> };

function makeDeps(rows: Row[], catalogs: Partial<Record<ProviderId, string[]>>): ModelRegistryDeps {
  const providers = new Map<ProviderId, Row>(rows.map((r) => [r.providerId, r]));
  const repo = {
    listRegistryProviders: () => [...providers.values()],
    getRegistryProvider: (id: ProviderId) => providers.get(id) ?? null,
    getRegistryProviderCreds: (id: ProviderId) => {
      const row = providers.get(id);
      return row ? { status: 'ok', creds: row.creds } : { status: 'missing' };
    },
    getRegistryCatalog: (id: ProviderId): CatalogModel[] =>
      (catalogs[id] ?? []).map((m) => ({
        id: m,
        providerId: id,
        displayName: m,
        family: m,
        kind: 'text' as const,
        enriched: false,
        tags: [],
      })),
    listRegistryOverrides: () => [],
    listCustomModels: () => [],
  };
  return {
    repo: repo as unknown as ModelRegistryDeps['repo'],
    keyDiscovery: { scan: async () => [], readValue: () => null },
    connectionTester: { test: async () => ({ ok: true }) },
    modelsDevClient: { getRegistry: async () => ({}) as never },
    makeApiSource: (providerId) => ({ kind: 'api', providerId, listModels: async () => [] }),
    makeCliSource: (agentKey) => ({
      kind: 'cli',
      providerId: agentKey as never,
      enumerable: false,
      underlyingProviderId: 'openai' as ProviderId,
      listModels: async () => [],
    }),
  };
}

const CONNECTED = (providerId: ProviderId): Row => ({
  providerId,
  connectedVia: 'api-key',
  state: 'connected',
  creds: { key: 'k' },
});

describe('curatedForAgent - wnano (#1039)', () => {
  it('offers the connected providers Nano can actually route', async () => {
    const h = createModelRegistryHandlers(
      makeDeps([CONNECTED('anthropic'), CONNECTED('openai')], {
        anthropic: ['claude-opus-4-8'],
        openai: ['gpt-5.6-terra'],
      })
    );

    const curated = await h.curatedForAgent({ agentKey: 'wnano' });

    expect(curated.map((m) => m.id).toSorted()).toEqual(['anthropic:claude-opus-4-8', 'openai:gpt-5.6-terra']);
    expect(curated.map((m) => m.providerId).toSorted()).toEqual(['anthropic', 'openai']);
  });

  it('keeps Flux ids bare - Nano owns the live Flux catalog and routes it unprefixed', async () => {
    const h = createModelRegistryHandlers(
      makeDeps([CONNECTED('flux-router' as ProviderId)], { ['flux-router' as ProviderId]: ['flux-auto'] })
    );

    const curated = await h.curatedForAgent({ agentKey: 'wnano' });

    expect(curated.map((m) => m.id)).toContain('flux-auto');
    expect(curated.map((m) => m.id)).not.toContain('flux-router:flux-auto');
  });

  it('never offers a provider Nano has no catalog table for', async () => {
    // `ollama-local` is connected and real, but it is not in
    // NANO_KNOWN_PROVIDER_IDS, so Nano is never told about it and could not
    // route it. Offering it would be offering a model that cannot answer.
    const h = createModelRegistryHandlers(
      makeDeps([CONNECTED('ollama-local' as ProviderId), CONNECTED('openai')], {
        ['ollama-local' as ProviderId]: ['llama3:latest'],
        openai: ['gpt-5.6-terra'],
      })
    );

    const curated = await h.curatedForAgent({ agentKey: 'wnano' });

    expect(curated.map((m) => m.providerId)).not.toContain('ollama-local');
    expect(curated.map((m) => m.id)).toEqual(['openai:gpt-5.6-terra']);
  });

  it('still returns [] when nothing is connected', async () => {
    const h = createModelRegistryHandlers(makeDeps([], {}));
    expect(await h.curatedForAgent({ agentKey: 'wnano' })).toEqual([]);
  });
});
