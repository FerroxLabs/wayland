/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Finding 4: a refresh (or any reconnect) re-runs `mirrorConnectOrRekey`, which
 * rewrites the legacy `model.config` bridge row. Without carrying the prior
 * row's `enabled` flag, a provider the user DISABLED in the legacy pickers would
 * silently reappear (a fresh row defaults to enabled). The new registry has no
 * `disabled` state, so the legacy `enabled:false` flag is the only disable
 * signal for those surfaces and MUST survive the rewrite.
 *
 * Exercises the real `mirrorConnectOrRekey` over an in-memory `ProcessConfig`
 * and a fake repo - no DB, no Electron.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IProvider } from '@/common/config/storage';
import type { CatalogModel, ProviderId } from '@process/providers/types';

// In-memory `model.config` store backing the bridge's read/write.
let configStore: unknown = undefined;
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: {
    get: vi.fn(async (_key: string) => configStore),
    set: vi.fn(async (_key: string, value: unknown) => {
      configStore = value;
    }),
  },
}));

import { mirrorConnectOrRekey } from '@process/providers/legacyModelConfigBridge';
import type { ProviderRepository } from '@process/providers/storage/ProviderRepository';

const OLLAMA: ProviderId = 'ollama-local';

function ollamaModel(id: string): CatalogModel {
  return {
    id,
    providerId: OLLAMA,
    displayName: id,
    family: id.split(':')[0] || id,
    kind: 'text',
    enriched: false,
    tags: ['chat'],
  };
}

/** A repo fake exposing exactly the methods `mirrorConnectOrRekey` reads. */
function makeRepo(catalog: CatalogModel[]): ProviderRepository {
  return {
    getRegistryProvider: () => ({ providerId: OLLAMA, state: 'connected' }) as unknown,
    getRegistryProviderCreds: () => ({
      status: 'ok' as const,
      creds: { key: '', baseUrl: 'http://127.0.0.1:11434/v1' },
    }),
    getRegistryCatalog: () => catalog,
    listRegistryOverrides: () => [],
  } as unknown as ProviderRepository;
}

function ollamaRow(): IProvider {
  const list = (configStore as IProvider[]) ?? [];
  const found = list.find((p) => p.platform === 'openai-compatible' && p.name === 'Ollama Local');
  if (!found) throw new Error('ollama-local bridge row not found');
  return found;
}

describe('mirrorConnectOrRekey - preserves user-disabled state (Finding 4)', () => {
  beforeEach(() => {
    configStore = undefined;
    vi.clearAllMocks();
  });

  it('keeps a user-disabled ollama-local disabled across a second mirror (refresh)', async () => {
    const repo = makeRepo([ollamaModel('llama3:latest')]);

    // First mirror (detect/auto-register): writes a fresh row, enabled by default.
    await mirrorConnectOrRekey(repo, OLLAMA);
    expect(ollamaRow().enabled).not.toBe(false);

    // User disables it in the legacy Models & Providers UI.
    const list = configStore as IProvider[];
    const idx = list.findIndex((p) => p.name === 'Ollama Local');
    list[idx] = { ...list[idx], enabled: false };

    // Second detect/refresh re-runs the mirror. The disable intent must survive.
    await mirrorConnectOrRekey(repo, OLLAMA);
    expect(ollamaRow().enabled).toBe(false);
  });

  it('refreshes the catalog model list while keeping the row disabled', async () => {
    const repo1 = makeRepo([ollamaModel('llama3:latest')]);
    await mirrorConnectOrRekey(repo1, OLLAMA);

    const list = configStore as IProvider[];
    const idx = list.findIndex((p) => p.name === 'Ollama Local');
    list[idx] = { ...list[idx], enabled: false };

    // A newly pulled model appears on the next refresh.
    const repo2 = makeRepo([ollamaModel('llama3:latest'), ollamaModel('phi3:mini')]);
    await mirrorConnectOrRekey(repo2, OLLAMA);

    const row = ollamaRow();
    expect(row.enabled).toBe(false); // still disabled
    expect(row.model).toContain('phi3:mini'); // catalog still refreshed
  });

  it('does not re-create a duplicate row on the second mirror', async () => {
    const repo = makeRepo([ollamaModel('llama3:latest')]);
    await mirrorConnectOrRekey(repo, OLLAMA);
    await mirrorConnectOrRekey(repo, OLLAMA);
    const rows = (configStore as IProvider[]).filter((p) => p.name === 'Ollama Local');
    expect(rows).toHaveLength(1);
  });
});
