/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenClaw connector writes into a file the USER owns
 * (`~/.openclaw/openclaw.json`), which is the whole reason it was chosen over a
 * Wayland-scoped state dir: OpenClaw's state also holds device identity,
 * pairing, sessions and channel config, so scoping it would hand the user a
 * second, amnesiac OpenClaw. Taking on their file instead means removal has to
 * be genuinely non-destructive, and that is mostly what these assert.
 *
 * The sharp edge is `agents.defaults.model.primary`. Registering a provider
 * routes nothing on its own, so setup must also point the default at it — which
 * overwrites a user choice. Removal that deleted the provider and left `primary`
 * pointing at it would strand OpenClaw on a provider that no longer exists:
 * worse than never having connected.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getReceipt } from '@process/connectors/manifest';
import {
  managedHash,
  openclawStatus,
  removeOpenClaw,
  resolveOpenClawConfigPath,
  setupOpenClaw,
} from '@process/connectors/openclaw';
import type { ConnectorContext } from '@process/connectors/types';

const BASE_URL = 'https://api.fluxrouter.ai/v1';
const PRIMARY = 'flux/flux-auto';

describe('openclaw connector', () => {
  let tmpDir: string;
  let configPath: string;
  let ctx: ConnectorContext;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'flux-ocl-'));
    configPath = path.join(tmpDir, 'state', 'openclaw.json');
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

  function readConfig(): Record<string, any> {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  function writeConfig(value: unknown): void {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(value, null, 2), 'utf-8');
  }

  it('registers the provider with the exact key casing OpenClaw requires', async () => {
    const report = await setupOpenClaw(ctx);

    expect(report.action).toBe('installed');
    expect(report.status).toBe('routed');

    const provider = readConfig().models.providers.flux;
    // `baseUrl`, NOT `baseURL` - opencode uses the other casing and these are
    // case-sensitive, so this assertion is the guard against copy-paste drift.
    expect(provider.baseUrl).toBe(BASE_URL);
    expect(provider).not.toHaveProperty('baseURL');
    expect(provider.apiKey).toBe('sk-flux-test');
    expect(provider.api).toBe('openai-completions');
  });

  it('never names the provider `openai`', async () => {
    // The `openai/*` prefix routes through OpenClaw's native Codex app-server
    // harness instead of its own inference loop, which would silently bypass
    // the routing this connector exists to create.
    await setupOpenClaw(ctx);
    expect(readConfig().models.providers).not.toHaveProperty('openai');
    expect(readConfig().models.providers).toHaveProperty('flux');
  });

  it('points the default model at flux, because a provider alone routes nothing', async () => {
    await setupOpenClaw(ctx);
    expect(readConfig().agents.defaults.model.primary).toBe(PRIMARY);
  });

  it('preserves every sibling provider and unrelated top-level key', async () => {
    writeConfig({
      gateway: { mode: 'local', port: 18789 },
      models: { providers: { anthropic: { baseUrl: 'https://api.anthropic.com' } } },
      channels: { telegram: { token: 'user-token' } },
    });

    await setupOpenClaw(ctx);

    const cfg = readConfig();
    expect(cfg.gateway).toEqual({ mode: 'local', port: 18789 });
    expect(cfg.channels).toEqual({ telegram: { token: 'user-token' } });
    expect(cfg.models.providers.anthropic.baseUrl).toBe('https://api.anthropic.com');
    expect(cfg.models.providers.flux.baseUrl).toBe(BASE_URL);
  });

  it('restores the default model the user had before Flux', async () => {
    writeConfig({ agents: { defaults: { model: { primary: 'anthropic/claude-opus-4-6' } } } });

    await setupOpenClaw(ctx);
    expect(readConfig().agents.defaults.model.primary).toBe(PRIMARY);

    await removeOpenClaw(ctx);

    // The point of the whole receipt field: put them back where they were.
    expect(readConfig().agents.defaults.model.primary).toBe('anthropic/claude-opus-4-6');
    expect(readConfig().models?.providers ?? {}).not.toHaveProperty('flux');
  });

  it('clears the default model when there was none before, rather than stranding it', async () => {
    await setupOpenClaw(ctx);
    await removeOpenClaw(ctx);

    // Leaving `primary: flux/flux-auto` behind after deleting the provider
    // would point OpenClaw at something that no longer exists.
    expect(readConfig().agents?.defaults?.model ?? {}).not.toHaveProperty('primary');
  });

  it('does not overwrite a default the user changed after install', async () => {
    writeConfig({ agents: { defaults: { model: { primary: 'anthropic/claude-opus-4-6' } } } });
    await setupOpenClaw(ctx);

    // User deliberately moves off Flux without using our remove action.
    const cfg = readConfig();
    cfg.agents.defaults.model.primary = 'openrouter/some-model';
    writeConfig(cfg);

    await removeOpenClaw(ctx);

    // Restoring the stale pre-install value here would undo a deliberate choice.
    expect(readConfig().agents.defaults.model.primary).toBe('openrouter/some-model');
  });

  it('does not record its own value as the thing to restore on reinstall', async () => {
    writeConfig({ agents: { defaults: { model: { primary: 'anthropic/claude-opus-4-6' } } } });

    await setupOpenClaw(ctx);
    await setupOpenClaw(ctx); // reinstall / key refresh

    const receipt = await getReceipt(ctx.manifestPath, 'openclaw');
    // If the second install captured PRIMARY, removal would "restore" flux and
    // strand the user - the failure mode this guards is silent.
    expect(receipt?.priorDefaultModel).toBe('anthropic/claude-opus-4-6');

    await removeOpenClaw(ctx);
    expect(readConfig().agents.defaults.model.primary).toBe('anthropic/claude-opus-4-6');
  });

  it('backs the original file up before the first write, and reuses that snapshot', async () => {
    writeConfig({ gateway: { mode: 'local' } });

    const first = await setupOpenClaw(ctx);
    expect(first.configExistedBefore).toBe(true);
    expect(first.backupPath).toBeTruthy();
    const snapshot = JSON.parse(fs.readFileSync(first.backupPath as string, 'utf-8'));
    expect(snapshot).toEqual({ gateway: { mode: 'local' } });

    // A reinstall must keep pointing at the PRE-FLUX snapshot, not overwrite it
    // with a post-install one that no longer represents "before".
    const second = await setupOpenClaw(ctx);
    expect(second.backupPath).toBe(first.backupPath);
    expect(JSON.parse(fs.readFileSync(second.backupPath as string, 'utf-8'))).toEqual({ gateway: { mode: 'local' } });
  });

  it('refuses to overwrite a config it cannot parse', async () => {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, '{ this is not json', 'utf-8');

    await expect(setupOpenClaw(ctx)).rejects.toThrow(/not valid JSON/);
    // The user's file must still be there, untouched.
    expect(fs.readFileSync(configPath, 'utf-8')).toBe('{ this is not json');
  });

  describe('status', () => {
    it('reports absent with no config, unconfigured with no receipt, routed once set up', async () => {
      expect(await openclawStatus(ctx)).toBe('absent');

      writeConfig({ gateway: { mode: 'local' } });
      expect(await openclawStatus(ctx)).toBe('unconfigured');

      await setupOpenClaw(ctx);
      expect(await openclawStatus(ctx)).toBe('routed');
    });

    it('reports drift when the base url is edited away', async () => {
      await setupOpenClaw(ctx);
      const cfg = readConfig();
      cfg.models.providers.flux.baseUrl = 'https://somewhere.else/v1';
      writeConfig(cfg);

      expect(await openclawStatus(ctx)).toBe('drifted');
    });

    it('reports drift when the provider survives but the default points elsewhere', async () => {
      // Installed but not routing. Calling this 'routed' would make the badge
      // claim traffic is going through Flux when none of it is.
      await setupOpenClaw(ctx);
      const cfg = readConfig();
      cfg.agents.defaults.model.primary = 'anthropic/claude-opus-4-6';
      writeConfig(cfg);

      expect(await openclawStatus(ctx)).toBe('drifted');
    });

    it('reports drift rather than throwing on an unparseable config', async () => {
      await setupOpenClaw(ctx);
      fs.writeFileSync(configPath, '{ broken', 'utf-8');

      // A health check that throws takes the settings page down with it.
      expect(await openclawStatus(ctx)).toBe('drifted');
    });
  });

  describe('path resolution', () => {
    const saved = { ...process.env };
    afterEach(() => {
      process.env = { ...saved };
    });

    it('honors OPENCLAW_CONFIG_PATH above everything', () => {
      process.env.OPENCLAW_CONFIG_PATH = '/custom/oc.json';
      process.env.OPENCLAW_STATE_DIR = '/ignored';
      expect(resolveOpenClawConfigPath()).toBe('/custom/oc.json');
    });

    it('honors OPENCLAW_STATE_DIR next', () => {
      delete process.env.OPENCLAW_CONFIG_PATH;
      process.env.OPENCLAW_STATE_DIR = '/state';
      expect(resolveOpenClawConfigPath()).toBe(path.join('/state', 'openclaw.json'));
    });

    it('falls back to ~/.openclaw', () => {
      delete process.env.OPENCLAW_CONFIG_PATH;
      delete process.env.OPENCLAW_STATE_DIR;
      expect(resolveOpenClawConfigPath()).toBe(path.join(os.homedir(), '.openclaw', 'openclaw.json'));
    });
  });

  it('hashes the base url, not the key, so a key refresh is not drift', async () => {
    await setupOpenClaw(ctx);
    const before = (await getReceipt(ctx.manifestPath, 'openclaw'))?.managedHash;

    await setupOpenClaw({ ...ctx, fluxKey: 'sk-flux-rotated' });

    expect((await getReceipt(ctx.manifestPath, 'openclaw'))?.managedHash).toBe(before);
    expect(before).toBe(managedHash(BASE_URL));
    expect(await openclawStatus(ctx)).toBe('routed');
  });
});
