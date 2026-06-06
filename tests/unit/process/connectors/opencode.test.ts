/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getReceipt } from '@process/connectors/manifest';
import {
  managedHash,
  opencodeStatus,
  removeOpencode,
  resolveOpencodeConfigPath,
  setupOpencode,
} from '@process/connectors/opencode';
import type { ConnectorContext } from '@process/connectors/types';

const BASE_URL = 'https://api.fluxrouter.ai/v1';

describe('opencode connector', () => {
  let tmpDir: string;
  let configPath: string;
  let ctx: ConnectorContext;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'flux-oc-'));
    configPath = path.join(tmpDir, 'config', 'opencode.json');
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

  function readConfig(): Record<string, unknown> {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
  }

  it('fresh install into a non-existent config creates the file with provider.flux', async () => {
    const report = await setupOpencode(ctx);

    expect(report.action).toBe('installed');
    expect(report.status).toBe('routed');
    expect(report.configExistedBefore).toBe(false);
    expect(report.backupPath).toBeNull();

    const root = readConfig() as { provider: { flux: Record<string, unknown> } };
    const flux = root.provider.flux;
    expect(flux.name).toBe('Flux Router');
    expect(flux.npm).toBe('@ai-sdk/openai-compatible');
    expect(flux.options).toEqual({ apiKey: 'sk-flux-test', baseURL: BASE_URL });
    expect(flux.models).toEqual({
      'flux-auto': { name: 'Flux Auto' },
      'flux-fast': { name: 'Flux Fast' },
      'flux-standard': { name: 'Flux Standard' },
      'flux-reasoning': { name: 'Flux Reasoning' },
    });

    expect(await opencodeStatus(ctx)).toBe('routed');
  });

  it('preserves sibling providers and top-level keys, and snapshots the original bytes', async () => {
    const original = {
      provider: { openai: { options: { apiKey: 'sk-openai' } } },
      theme: 'x',
    };
    await fs.promises.mkdir(path.dirname(configPath), { recursive: true });
    const originalBytes = `${JSON.stringify(original, null, 2)}\n`;
    await fs.promises.writeFile(configPath, originalBytes, 'utf-8');

    const report = await setupOpencode(ctx);

    expect(report.configExistedBefore).toBe(true);
    expect(report.backupPath).not.toBeNull();

    const root = readConfig() as {
      provider: { openai: unknown; flux: unknown };
      theme: string;
    };
    expect(root.provider.openai).toEqual({ options: { apiKey: 'sk-openai' } });
    expect(root.theme).toBe('x');
    expect(root.provider.flux).toBeDefined();

    const backup = fs.readFileSync(report.backupPath as string, 'utf-8');
    expect(backup).toBe(originalBytes);
  });

  it('does not overwrite a pre-existing provider.flux.models', async () => {
    const original = {
      provider: {
        flux: {
          models: { 'my-custom': { name: 'My Custom' } },
        },
      },
    };
    await fs.promises.mkdir(path.dirname(configPath), { recursive: true });
    await fs.promises.writeFile(configPath, JSON.stringify(original, null, 2), 'utf-8');

    await setupOpencode(ctx);

    const root = readConfig() as { provider: { flux: { models: unknown } } };
    expect(root.provider.flux.models).toEqual({ 'my-custom': { name: 'My Custom' } });
  });

  it('reports drifted when provider.flux.options.baseURL changes on disk', async () => {
    await setupOpencode(ctx);
    expect(await opencodeStatus(ctx)).toBe('routed');

    const root = readConfig() as {
      provider: { flux: { options: { baseURL: string } } };
    };
    root.provider.flux.options.baseURL = 'https://example.invalid/v1';
    await fs.promises.writeFile(configPath, JSON.stringify(root, null, 2), 'utf-8');

    expect(await opencodeStatus(ctx)).toBe('drifted');
  });

  it('roundtrips install then surgical removal, preserving siblings and dropping the receipt', async () => {
    const original = {
      provider: { openai: { options: { apiKey: 'sk-openai' } } },
      theme: 'x',
    };
    await fs.promises.mkdir(path.dirname(configPath), { recursive: true });
    await fs.promises.writeFile(configPath, JSON.stringify(original, null, 2), 'utf-8');

    await setupOpencode(ctx);
    const removeReport = await removeOpencode(ctx);

    expect(removeReport.action).toBe('removed');
    expect(removeReport.status).toBe('unconfigured');

    const root = readConfig() as {
      provider: { openai: unknown; flux?: unknown };
      theme: string;
    };
    expect(root.provider.flux).toBeUndefined();
    expect(root.provider.openai).toEqual({ options: { apiKey: 'sk-openai' } });
    expect(root.theme).toBe('x');

    expect(await getReceipt(ctx.manifestPath, 'opencode')).toBeUndefined();
    expect(await opencodeStatus(ctx)).toBe('unconfigured');
  });

  it('throws (without writing) when the existing config is malformed JSON', async () => {
    await fs.promises.mkdir(path.dirname(configPath), { recursive: true });
    const garbage = '{ this is not json';
    await fs.promises.writeFile(configPath, garbage, 'utf-8');

    await expect(setupOpencode(ctx)).rejects.toThrow(configPath);

    // The malformed config must be left untouched.
    expect(fs.readFileSync(configPath, 'utf-8')).toBe(garbage);
    expect(await getReceipt(ctx.manifestPath, 'opencode')).toBeUndefined();
  });

  it('reports drifted (does not throw) when an installed config becomes malformed JSON', async () => {
    await setupOpencode(ctx);
    expect(await opencodeStatus(ctx)).toBe('routed');

    await fs.promises.writeFile(configPath, '{ this is not json', 'utf-8');

    expect(await opencodeStatus(ctx)).toBe('drifted');
  });

  describe('resolveOpencodeConfigPath', () => {
    let savedConfigDir: string | undefined;
    let savedXdg: string | undefined;

    beforeEach(() => {
      savedConfigDir = process.env.OPENCODE_CONFIG_DIR;
      savedXdg = process.env.XDG_CONFIG_HOME;
    });

    afterEach(() => {
      if (savedConfigDir === undefined) delete process.env.OPENCODE_CONFIG_DIR;
      else process.env.OPENCODE_CONFIG_DIR = savedConfigDir;
      if (savedXdg === undefined) delete process.env.XDG_CONFIG_HOME;
      else process.env.XDG_CONFIG_HOME = savedXdg;
    });

    it('honors OPENCODE_CONFIG_DIR', () => {
      process.env.OPENCODE_CONFIG_DIR = '/custom/oc';
      delete process.env.XDG_CONFIG_HOME;
      expect(resolveOpencodeConfigPath()).toBe(path.join('/custom/oc', 'opencode.json'));
    });

    it('honors XDG_CONFIG_HOME when OPENCODE_CONFIG_DIR is unset', () => {
      delete process.env.OPENCODE_CONFIG_DIR;
      process.env.XDG_CONFIG_HOME = '/xdg/conf';
      expect(resolveOpencodeConfigPath()).toBe(
        path.join('/xdg/conf', 'opencode', 'opencode.json'),
      );
    });

    it('falls back to ~/.config/opencode/opencode.json when both env vars are unset', () => {
      delete process.env.OPENCODE_CONFIG_DIR;
      delete process.env.XDG_CONFIG_HOME;
      expect(resolveOpencodeConfigPath()).toBe(
        path.join(os.homedir(), '.config', 'opencode', 'opencode.json'),
      );
    });
  });

  it('managedHash excludes the api key and tracks the baseURL', () => {
    expect(managedHash(BASE_URL)).toBe(managedHash(BASE_URL));
    expect(managedHash(BASE_URL)).not.toBe(managedHash('https://other.invalid/v1'));
  });
});
