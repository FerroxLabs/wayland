/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { parse as parseToml } from 'smol-toml';
import { materializeFluxCodexHome } from '../../../src/process/task/codexConfig';

// #56: flux-routed codex must keep the user's MCP servers, which the scoped
// CODEX_HOME otherwise drops. The injection is additive + library-serialized
// from the user's own table, so these tests assert it round-trips AND that the
// flux provider block is never disturbed (a malformed append would break routing).
describe('materializeFluxCodexHome - MCP injection (#56)', () => {
  let dataDir: string;
  let userConfig: string;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'flux-codex-data-'));
    const userHome = await mkdtemp(join(tmpdir(), 'flux-codex-user-'));
    userConfig = join(userHome, 'config.toml');
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true }).catch(() => {});
  });

  it('carries the user\'s mcp_servers into the flux home, alongside the flux provider', async () => {
    await writeFile(
      userConfig,
      [
        'model = "gpt-5"',
        '',
        '[mcp_servers.brave]',
        'command = "npx"',
        'args = ["-y", "brave-search-mcp"]',
        '',
        '[mcp_servers.brave.env]',
        'BRAVE_API_KEY = "sk_test"',
        '',
        '[mcp_servers.deepwiki]',
        'url = "https://mcp.deepwiki.com/mcp"',
        '',
      ].join('\n'),
      'utf8'
    );

    const home = await materializeFluxCodexHome(dataDir, 'workspace-write', undefined, userConfig);
    const toml = await readFile(join(home, 'config.toml'), 'utf8');
    const parsed = parseToml(toml) as {
      model_provider?: string;
      model_providers?: { flux?: { base_url?: string } };
      mcp_servers?: Record<string, { command?: string; args?: string[]; url?: string; env?: Record<string, string> }>;
    };

    // Flux routing preserved.
    expect(parsed.model_provider).toBe('flux');
    expect(parsed.model_providers?.flux?.base_url).toContain('http');

    // User MCP carried over, verbatim shape.
    expect(parsed.mcp_servers?.brave?.command).toBe('npx');
    expect(parsed.mcp_servers?.brave?.args).toEqual(['-y', 'brave-search-mcp']);
    expect(parsed.mcp_servers?.brave?.env?.BRAVE_API_KEY).toBe('sk_test');
    expect(parsed.mcp_servers?.deepwiki?.url).toBe('https://mcp.deepwiki.com/mcp');
  });

  it('still produces a valid flux home when the user config has no mcp_servers', async () => {
    await writeFile(userConfig, 'model = "gpt-5"\n', 'utf8');
    const home = await materializeFluxCodexHome(dataDir, 'workspace-write', undefined, userConfig);
    const parsed = parseToml(await readFile(join(home, 'config.toml'), 'utf8')) as {
      model_provider?: string;
      mcp_servers?: unknown;
    };
    expect(parsed.model_provider).toBe('flux');
    expect(parsed.mcp_servers).toBeUndefined();
  });

  it('degrades gracefully (flux still works) when the user config is missing', async () => {
    const home = await materializeFluxCodexHome(dataDir, 'workspace-write', undefined, join(dataDir, 'nope.toml'));
    const parsed = parseToml(await readFile(join(home, 'config.toml'), 'utf8')) as { model_provider?: string };
    expect(parsed.model_provider).toBe('flux');
  });
});

// #68: register a model catalog so codex stops warning "Model metadata not
// found" for flux-auto. Verified end-to-end against the real codex 0.135 CLI
// ("config.toml parse ok", model recognized); here we lock the file + config.
describe('materializeFluxCodexHome - model catalog (#68)', () => {
  let dataDir: string;
  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'flux-codex-cat-'));
  });
  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true }).catch(() => {});
  });

  it('writes a valid flux-model-catalog.json with every flux slug + wires the config keys', async () => {
    const home = await materializeFluxCodexHome(dataDir, 'workspace-write', undefined, join(dataDir, 'none.toml'));
    const config = parseToml(await readFile(join(home, 'config.toml'), 'utf8')) as {
      model_catalog_json?: string;
      model_auto_compact_token_limit?: number;
    };
    expect(config.model_catalog_json).toBe(join(home, 'flux-model-catalog.json'));
    expect(typeof config.model_auto_compact_token_limit).toBe('number');

    const catalog = JSON.parse(await readFile(join(home, 'flux-model-catalog.json'), 'utf8')) as {
      models: { slug: string; display_name: string; context_window: number }[];
    };
    const slugs = catalog.models.map((m) => m.slug).sort();
    expect(slugs).toEqual(['flux-auto', 'flux-fast', 'flux-reasoning', 'flux-standard']);
    // codex matches by model.starts_with(slug) - flux-auto entry must be exact.
    const auto = catalog.models.find((m) => m.slug === 'flux-auto');
    expect(auto?.display_name).toBe('Flux Auto');
    expect(auto?.context_window).toBeGreaterThan(0);
  });
});
