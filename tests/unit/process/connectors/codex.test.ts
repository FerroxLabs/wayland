/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parse as parseToml } from 'smol-toml';

import { codexStatus, managedHash, removeCodex, setupCodex } from '@process/connectors/codex';
import { getReceipt } from '@process/connectors/manifest';
import type { ConnectorContext } from '@process/connectors/types';

const BASE_URL = 'https://api.fluxrouter.ai/v1';

type TomlRoot = {
  model_providers?: { flux?: Record<string, unknown> };
} & Record<string, unknown>;

describe('codex connector', () => {
  let tmpDir: string;
  let configPath: string;
  let ctx: ConnectorContext;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'flux-codex-'));
    configPath = path.join(tmpDir, 'codex', 'config.toml');
    ctx = {
      fluxKey: 'sk-flux-test',
      baseURL: BASE_URL,
      manifestPath: path.join(tmpDir, 'flux-connectors.json'),
      backupDir: path.join(tmpDir, 'backups'),
      configPathOverride: configPath,
    };
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  function readConfig(): TomlRoot {
    return parseToml(fs.readFileSync(configPath, 'utf-8')) as TomlRoot;
  }

  it('fresh install into a non-existent config creates the file with the flux provider', async () => {
    const report = await setupCodex(ctx);

    expect(report.action).toBe('installed');
    expect(report.status).toBe('routed');
    expect(report.configExistedBefore).toBe(false);
    expect(report.backupPath).toBeNull();

    const flux = readConfig().model_providers?.flux;
    expect(flux).toBeDefined();
    expect(flux?.name).toBe('Flux');
    expect(flux?.base_url).toBe(BASE_URL);
    expect(flux?.env_key).toBe('FLUX_API_KEY');
    expect(flux?.wire_api).toBe('responses');

    expect(await codexStatus(ctx)).toBe('routed');
  });

  it('preserves sibling tables, top-level keys, and comments; snapshots original bytes', async () => {
    const original = [
      '# my codex config',
      'model_context_window = 200000',
      'sandbox_mode = "workspace-write"',
      '',
      '[features]',
      'hooks = true',
      '',
      '[projects."/Users/me/repo"]',
      'trust_level = "trusted"',
      '',
    ].join('\n');
    await fs.promises.mkdir(path.dirname(configPath), { recursive: true });
    await fs.promises.writeFile(configPath, original, 'utf-8');

    const report = await setupCodex(ctx);

    expect(report.configExistedBefore).toBe(true);
    expect(report.backupPath).not.toBeNull();

    const raw = fs.readFileSync(configPath, 'utf-8');
    // Comment and sibling tables survive verbatim.
    expect(raw).toContain('# my codex config');
    expect(raw).toContain('[features]');
    expect(raw).toContain('[projects."/Users/me/repo"]');
    expect(raw).toContain('trust_level = "trusted"');

    const root = readConfig();
    expect(Number(root.model_context_window)).toBe(200000);
    expect((root.features as Record<string, unknown>).hooks).toBe(true);
    expect(root.model_providers?.flux?.base_url).toBe(BASE_URL);

    const backup = fs.readFileSync(report.backupPath as string, 'utf-8');
    expect(backup).toBe(original);
  });

  it('replaces an existing flux provider block in place (no duplicate)', async () => {
    const original = [
      '[model_providers.flux]',
      'name = "Flux"',
      'base_url = "https://old.invalid/v1"',
      'env_key = "FLUX_API_KEY"',
      'wire_api = "responses"',
      '',
      '[features]',
      'hooks = true',
      '',
    ].join('\n');
    await fs.promises.mkdir(path.dirname(configPath), { recursive: true });
    await fs.promises.writeFile(configPath, original, 'utf-8');

    const report = await setupCodex(ctx);
    expect(report.action).toBe('updated');

    const raw = fs.readFileSync(configPath, 'utf-8');
    expect(raw.match(/\[model_providers\.flux\]/g)).toHaveLength(1);
    expect(raw).not.toContain('https://old.invalid/v1');
    expect(readConfig().model_providers?.flux?.base_url).toBe(BASE_URL);
    expect((readConfig().features as Record<string, unknown>).hooks).toBe(true);
  });

  it('reports drifted when the flux base_url changes on disk', async () => {
    await setupCodex(ctx);
    expect(await codexStatus(ctx)).toBe('routed');

    const raw = fs.readFileSync(configPath, 'utf-8').replace(BASE_URL, 'https://example.invalid/v1');
    await fs.promises.writeFile(configPath, raw, 'utf-8');

    expect(await codexStatus(ctx)).toBe('drifted');
  });

  it('roundtrips install then surgical removal, preserving siblings and dropping the receipt', async () => {
    const original = ['[features]', 'hooks = true', ''].join('\n');
    await fs.promises.mkdir(path.dirname(configPath), { recursive: true });
    await fs.promises.writeFile(configPath, original, 'utf-8');

    await setupCodex(ctx);
    const removeReport = await removeCodex(ctx);

    expect(removeReport.action).toBe('removed');
    expect(removeReport.status).toBe('unconfigured');

    const root = readConfig();
    expect(root.model_providers?.flux).toBeUndefined();
    expect((root.features as Record<string, unknown>).hooks).toBe(true);

    expect(await getReceipt(ctx.manifestPath, 'codex')).toBeUndefined();
    expect(await codexStatus(ctx)).toBe('unconfigured');
  });

  it('throws (without writing) when the existing config is malformed TOML', async () => {
    await fs.promises.mkdir(path.dirname(configPath), { recursive: true });
    const garbage = 'this = is = not = toml';
    await fs.promises.writeFile(configPath, garbage, 'utf-8');

    await expect(setupCodex(ctx)).rejects.toThrow(configPath);

    expect(fs.readFileSync(configPath, 'utf-8')).toBe(garbage);
    expect(await getReceipt(ctx.manifestPath, 'codex')).toBeUndefined();
  });

  it('reports drifted (does not throw) when an installed config becomes malformed TOML', async () => {
    await setupCodex(ctx);
    expect(await codexStatus(ctx)).toBe('routed');

    await fs.promises.writeFile(configPath, 'this = is = not = toml', 'utf-8');

    expect(await codexStatus(ctx)).toBe('drifted');
  });

  it('managedHash excludes the api key and tracks the base_url', () => {
    expect(managedHash(BASE_URL)).toBe(managedHash(BASE_URL));
    expect(managedHash(BASE_URL)).not.toBe(managedHash('https://other.invalid/v1'));
  });
});
