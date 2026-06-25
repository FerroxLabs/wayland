/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * GitHub #130: the Exa MCP catalog entry shipped as an npx stdio package whose
 * spawn failed, so the key appeared not to save and the server never connected.
 * Exa actually runs as a hosted server that authenticates via a URL query
 * parameter (https://mcp.exa.ai/mcp?exaApiKey=<key>) - a Bearer header is
 * ignored by it. These tests lock the query-param injection path and assert the
 * real Exa entry is wired to it.
 */

import { describe, it, expect } from 'vitest';

import { entryToServerData } from '@/renderer/pages/settings/McpLibrary/entryToServerData';
import type { CatalogEntry } from '@/renderer/pages/settings/McpLibrary/types';
import exaEntry from '@/renderer/mcp-catalog/entries/com.exa-exa-mcp.json';

function baseEntry(overrides: Partial<CatalogEntry>): CatalogEntry {
  return {
    name: 'com.test/svc',
    title: 'Test',
    description: 'desc',
    version: '1.0.0',
    packages: [],
    'x-wayland': {
      tier: 'builder',
      categories: ['developer'],
      maintainerType: 'community',
      iconUrl: 'icons/test.svg',
      auth: { method: 'api-key' },
    },
    ...overrides,
  } as unknown as CatalogEntry;
}

describe('entryToServerData query-param api-key auth (#130)', () => {
  it('injects the token into the URL query string when auth.queryParam is set', () => {
    const entry = baseEntry({
      remotes: [{ type: 'streamable-http', url: 'https://mcp.exa.ai/mcp' }],
      'x-wayland': {
        tier: 'builder',
        categories: ['developer'],
        maintainerType: 'community',
        iconUrl: 'icons/test.svg',
        auth: { method: 'api-key', queryParam: 'exaApiKey' },
      },
    } as unknown as Partial<CatalogEntry>);

    const data = entryToServerData(entry, { EXA_API_KEY: 'sk-secret-123' });

    expect(data.transport.type).toBe('streamable_http');
    expect(data.transport.url).toBe('https://mcp.exa.ai/mcp?exaApiKey=sk-secret-123');
    // No Authorization header - the query param carries the key.
    expect(data.transport.headers).toBeUndefined();
  });

  it('still uses the Bearer header path when auth.queryParam is absent', () => {
    const entry = baseEntry({
      remotes: [{ type: 'streamable-http', url: 'https://mcp.example.com/mcp' }],
    } as unknown as Partial<CatalogEntry>);

    const data = entryToServerData(entry, { TOKEN: 'abc' });

    expect(data.transport.url).toBe('https://mcp.example.com/mcp');
    expect(data.transport.headers).toEqual({ Authorization: 'Bearer abc' });
  });

  it('the shipped Exa entry is wired to the hosted query-param path', () => {
    expect(exaEntry.packages).toEqual([]);
    expect(exaEntry.remotes?.[0]?.url).toBe('https://mcp.exa.ai/mcp');
    expect(exaEntry['x-wayland'].auth.queryParam).toBe('exaApiKey');

    const data = entryToServerData(exaEntry as unknown as CatalogEntry, { EXA_API_KEY: 'live-key' });
    expect(data.transport.url).toBe('https://mcp.exa.ai/mcp?exaApiKey=live-key');
  });
});
