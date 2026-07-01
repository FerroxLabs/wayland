/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #478 - readWCoreConfigMcpServerNames reports the [mcp.servers] names the engine
 * already loads from config.toml, so the spawn-time injector can skip them and
 * avoid registering a server twice.
 */
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let configPath = '';
vi.mock('@process/agent/wcore/profilePaths', () => ({
  resolveActiveConfigPath: () => Promise.resolve(configPath),
}));

import { readWCoreConfigMcpServerNames } from '@process/agent/wcore/configMcpServers';

let dir = '';

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'wcore-cfg-mcp-'));
  configPath = join(dir, 'config.toml');
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('readWCoreConfigMcpServerNames (#478)', () => {
  it('returns the [mcp.servers] table names', async () => {
    await writeFile(
      configPath,
      '[mcp.servers.alpha]\ntype = "stdio"\ncommand = "a"\n\n[mcp.servers.beta]\ntype = "stdio"\ncommand = "b"\n',
      'utf-8'
    );
    const names = await readWCoreConfigMcpServerNames();
    expect([...names].toSorted()).toEqual(['alpha', 'beta']);
  });

  it('round-trips a dotted connector name as ONE key (matches the injected name)', async () => {
    // Real connector names contain dots (e.g. reverse-DNS ids). smol-toml must
    // quote the key so it stays a single [mcp.servers."a.b.c"] entry, not nested
    // tables - otherwise the dedup set would never match the injected name.
    const name = 'io.github.taylorwilsdon-google-workspace-mcp';
    await writeFile(configPath, `[mcp.servers."${name}"]\ntype = "stdio"\ncommand = "uvx"\n`, 'utf-8');
    expect(await readWCoreConfigMcpServerNames()).toEqual(new Set([name]));
  });

  it('returns an empty set when the file is missing (engine loads nothing -> inject)', async () => {
    configPath = join(dir, 'does-not-exist.toml');
    expect(await readWCoreConfigMcpServerNames()).toEqual(new Set());
  });

  it('returns an empty set when there is no [mcp.servers] table', async () => {
    await writeFile(configPath, '[tools]\nallow_list = ["ls"]\n', 'utf-8');
    expect(await readWCoreConfigMcpServerNames()).toEqual(new Set());
  });

  it('returns an empty set on malformed TOML (never throws)', async () => {
    await writeFile(configPath, 'this is = = not valid toml [[[', 'utf-8');
    expect(await readWCoreConfigMcpServerNames()).toEqual(new Set());
  });
});
