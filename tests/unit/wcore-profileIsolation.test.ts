/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #278 (host-boundary profile isolation).
 *
 * The engine treats `WAYLAND_HOME` as the single source of truth for which
 * isolated profile a process runs as (its own config.toml, memory.db,
 * credentials, skills). The desktop must therefore set it on every
 * Desktop-managed engine spawn. Raw mode deliberately leaves it unset.
 *
 * The engine ships a fail-closed guard of its own, but it only fires when there
 * is explicit profile intent (`--profile`) AND `WAYLAND_HOME` is unset — and the
 * desktop never passes `--profile`. So the engine guard does NOT cover the
 * desktop, and `WAYLAND_HOME` is the only thing holding the boundary up.
 *
 * These tests pin the boundary at the real seam: the env handed to `spawn()`.
 */
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { existsSync, lstatSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { TProviderWithModel } from '@/common/config/storage';
import { ProfileIsolationError } from '@process/agent/wcore/profilePaths';
import { attachVertexSpawnCredentials } from '@process/providers/vertexSpawnCredentials';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const spawnMock = vi.fn();
const collectForwardedEnvMock = vi.fn((): Record<string, string> => ({}));
vi.mock('node:child_process', async (orig) => {
  const actual = await orig<typeof import('node:child_process')>();
  return { ...actual, spawn: (...args: unknown[]) => spawnMock(...args) };
});

const resolveActiveConfigDirMock = vi.fn();
let spawnEnvDenylistMock: readonly string[] | undefined;
let ambientEnvDenylistMock: readonly string[] | undefined;
vi.mock('@process/agent/wcore/profilePaths', async (orig) => {
  const actual = await orig<typeof import('@process/agent/wcore/profilePaths')>();
  return {
    ...actual,
    resolveActiveConfigDir: () => resolveActiveConfigDirMock(),
    acquireProfileLaunchLease: () => Promise.resolve(async () => {}),
  };
});

vi.mock('@process/agent/wcore/binaryResolver', () => ({
  resolveWCoreBinary: () => '/fake/bin/wayland-core',
  isWCoreAvailable: () => true,
}));

vi.mock('@process/agent/wcore/toolKeyStore', () => ({
  getToolKeyStore: async () => ({ collectForwardedEnv: collectForwardedEnvMock }),
}));

vi.mock('@process/providers/ipc/modelRegistryIpc', () => ({
  hydrateModelForSpawn: async (model: unknown) => model,
  resolveModelSecretsForSpawn: async () => null,
}));

vi.mock('@process/secrets', () => ({
  VAULT_PASSPHRASE_CHILD_FD: 3,
  resolveSpawnVaultPassphrase: async () => null,
}));

// buildEngineSpawnEnv stays REAL — it is what actually stamps WAYLAND_HOME onto
// the spawn env, so mocking it would test nothing. Only buildSpawnConfig (which
// needs a fully-hydrated provider/model) is stubbed out of the way.
vi.mock('@process/agent/wcore/envBuilder', async (orig) => {
  const actual = await orig<typeof import('@process/agent/wcore/envBuilder')>();
  return {
    ...actual,
    buildSpawnConfig: () => ({
      args: ['--json-stream'],
      env: {},
      projectConfig: null,
      resolvedMaxTokens: 4096,
      missingRequiredApiKey: false,
      requiredKeyEnvVar: undefined,
      spawnEnvDenylist: spawnEnvDenylistMock,
      ambientEnvDenylist: ambientEnvDenylistMock,
    }),
  };
});

import { WCoreAgent } from '@process/agent/wcore';
import { AWS_AUTHORITY_ENV_KEYS } from '@process/agent/wcore/envBuilder';

const NATIVE_DIR = '/native/Application Support/wayland-core';
const PROFILE_DIR = '/home/u/.wayland/profiles/work';

const MODEL = { provider: 'openai', useModel: 'gpt-5', apiKey: 'sk-test' } as unknown as TProviderWithModel;

function makeFakeChild() {
  const child = new EventEmitter() as EventEmitter & Record<string, unknown>;
  child.pid = 4242;
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.stdin = new PassThrough();
  child.stdio = [child.stdin, child.stdout, child.stderr];
  child.kill = vi.fn();
  return child;
}

/** The env object actually handed to spawn(). */
function spawnedEnv(): Record<string, string | undefined> {
  const opts = spawnMock.mock.calls[0]?.[2] as { env: Record<string, string | undefined> };
  return opts.env;
}

function newAgent(): WCoreAgent {
  const workspace = mkdtempSync(join(tmpdir(), 'wcore-profile-isolation-'));
  testWorkspaces.push(workspace);
  return new WCoreAgent({ workspace, model: MODEL });
}

const testWorkspaces: string[] = [];

describe('#278: the engine spawn must never bind a named profile to the default home', () => {
  beforeEach(() => {
    spawnMock.mockReset();
    spawnMock.mockImplementation(() => makeFakeChild());
    resolveActiveConfigDirMock.mockReset();
    collectForwardedEnvMock.mockReset();
    collectForwardedEnvMock.mockReturnValue({});
    spawnEnvDenylistMock = undefined;
    ambientEnvDenylistMock = undefined;
  });

  afterEach(() => {
    for (const workspace of testWorkspaces.splice(0)) {
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  it('CONTROL: stamps the active profile dir onto WAYLAND_HOME', async () => {
    resolveActiveConfigDirMock.mockResolvedValue(PROFILE_DIR);
    void newAgent()
      .start()
      .catch(() => {});
    await vi.waitFor(() => expect(spawnMock).toHaveBeenCalled());
    expect(spawnedEnv().WAYLAND_HOME).toBe(PROFILE_DIR);
    expect(spawnedEnv().BRAVE_SEARCH_API_KEY).toBeUndefined();
  });

  it('CONTROL: the default profile still spawns WITH WAYLAND_HOME (every spawn, per the contract)', async () => {
    resolveActiveConfigDirMock.mockResolvedValue(NATIVE_DIR);
    void newAgent()
      .start()
      .catch(() => {});
    await vi.waitFor(() => expect(spawnMock).toHaveBeenCalled());
    expect(spawnedEnv().WAYLAND_HOME).toBe(NATIVE_DIR);
  });

  it('applies a credential denylist to the actual child spawn environment', async () => {
    resolveActiveConfigDirMock.mockResolvedValue(NATIVE_DIR);
    spawnEnvDenylistMock = AWS_AUTHORITY_ENV_KEYS;
    ambientEnvDenylistMock = AWS_AUTHORITY_ENV_KEYS;
    const original = Object.fromEntries(AWS_AUTHORITY_ENV_KEYS.map((key) => [key, process.env[key]]));
    try {
      for (const key of AWS_AUTHORITY_ENV_KEYS) process.env[key] = `ambient-spawn-${key}`;
      void newAgent()
        .start()
        .catch(() => {});
      await vi.waitFor(() => expect(spawnMock).toHaveBeenCalled());
      for (const key of AWS_AUTHORITY_ENV_KEYS) expect(spawnedEnv()[key], key).toBeUndefined();
    } finally {
      for (const key of AWS_AUTHORITY_ENV_KEYS) {
        const value = original[key];
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });

  it('materializes Vertex credentials only for the child and removes them on exit', async () => {
    resolveActiveConfigDirMock.mockResolvedValue(NATIVE_DIR);
    const workspace = mkdtempSync(join(tmpdir(), 'wcore-vertex-spawn-'));
    testWorkspaces.push(workspace);
    const model = attachVertexSpawnCredentials(
      { ...MODEL },
      {
        projectId: 'project-a',
        region: 'us-central1',
        serviceAccountJson: '{"client_email":"vertex@example.test"}',
      }
    );
    const agent = new WCoreAgent({ workspace, model, onStreamEvent: () => {} });

    void agent.start().catch(() => {});
    await vi.waitFor(() => expect(spawnMock).toHaveBeenCalled());
    const env = spawnedEnv();
    const credentialPath = env.GOOGLE_APPLICATION_CREDENTIALS;
    expect(credentialPath).toBeTruthy();
    expect(readFileSync(credentialPath!, 'utf8')).toContain('vertex@example.test');
    if (process.platform !== 'win32') {
      expect(lstatSync(credentialPath!).mode & 0o777).toBe(0o600);
      expect(lstatSync(join(credentialPath!, '..')).mode & 0o777).toBe(0o700);
    }
    expect(env.VERTEX_PROJECT_ID).toBe('project-a');
    expect(env.VERTEX_REGION).toBe('us-central1');

    const child = spawnMock.mock.results[0]?.value as EventEmitter;
    child.emit('exit', 0);
    await vi.waitFor(() => expect(existsSync(credentialPath!)).toBe(false));
  });

  it('uses the manager-captured profile home without re-resolving a switched marker', async () => {
    resolveActiveConfigDirMock.mockRejectedValue(new ProfileIsolationError('switched-after-publication', 'EACCES'));
    const workspace = mkdtempSync(join(tmpdir(), 'wcore-pinned-profile-'));
    testWorkspaces.push(workspace);
    const agent = new WCoreAgent({
      workspace,
      model: MODEL,
      waylandHome: PROFILE_DIR,
      onStreamEvent: () => {},
    });

    void agent.start().catch(() => {});
    await vi.waitFor(() => expect(spawnMock).toHaveBeenCalled());
    expect(resolveActiveConfigDirMock).not.toHaveBeenCalled();
    expect(spawnedEnv().WAYLAND_HOME).toBe(PROFILE_DIR);
  });

  it('raw-engine launch bypasses Desktop overrides but preserves tool, team, and host protocol wiring', async () => {
    resolveActiveConfigDirMock.mockResolvedValue(PROFILE_DIR);
    collectForwardedEnvMock.mockReturnValue({ BRAVE_SEARCH_API_KEY: 'brave-test-key' });
    const workspace = mkdtempSync(join(tmpdir(), 'wcore-raw-engine-'));
    testWorkspaces.push(workspace);
    const onStreamEvent = vi.fn();
    const agent = new WCoreAgent({
      workspace,
      model: MODEL,
      rawEngineMode: true,
      mcpServerNames: ['tavily', 'firecrawl'],
      stdioMcpServers: [
        {
          name: 'wayland-team-bridge',
          command: '/fake/team-bridge',
          args: ['--stdio'],
          env: [{ name: 'WAYLAND_TEAM_ID', value: 'team-7' }],
        },
      ],
      onStreamEvent,
    });

    const started = agent.start();
    await vi.waitFor(() => expect(spawnMock).toHaveBeenCalled());
    const child = spawnMock.mock.results[0]?.value as ReturnType<typeof makeFakeChild>;
    let stdin = '';
    (child.stdin as PassThrough).on('data', (chunk) => {
      stdin += chunk.toString();
    });
    (
      agent as unknown as {
        handleEvent: (event: { type: 'ready'; session_id: string; capabilities: Record<string, never> }) => void;
      }
    ).handleEvent({ type: 'ready', session_id: 'raw-session', capabilities: {} });
    await started;

    expect(resolveActiveConfigDirMock).not.toHaveBeenCalled();
    expect(spawnedEnv().WAYLAND_HOME).toBeUndefined();
    expect(spawnedEnv().BRAVE_SEARCH_API_KEY).toBe('brave-test-key');
    const args = spawnMock.mock.calls[0]?.[1] as string[];
    expect(args).not.toContain('--profile');
    expect(existsSync(join(workspace, '.wcore.toml'))).toBe(false);
    expect(stdin).toContain('"type":"add_mcp_server"');
    expect(stdin).toContain('"name":"wayland-team-bridge"');

    (
      agent as unknown as {
        handleEvent: (event: { type: 'stream_start'; msg_id: string }) => void;
      }
    ).handleEvent({ type: 'stream_start', msg_id: 'raw-turn' });
    expect(onStreamEvent).toHaveBeenCalledWith({ type: 'start', data: '', msg_id: 'raw-turn' });
  });

  it('does not fabricate a team bridge when no host-owned stdio declaration exists', async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'wcore-no-team-bridge-'));
    testWorkspaces.push(workspace);
    const agent = new WCoreAgent({ workspace, model: MODEL, rawEngineMode: true, onStreamEvent: () => {} });

    const started = agent.start();
    await vi.waitFor(() => expect(spawnMock).toHaveBeenCalled());
    const child = spawnMock.mock.results[0]?.value as ReturnType<typeof makeFakeChild>;
    let stdin = '';
    (child.stdin as PassThrough).on('data', (chunk) => {
      stdin += chunk.toString();
    });
    (
      agent as unknown as {
        handleEvent: (event: { type: 'ready'; session_id: string; capabilities: Record<string, never> }) => void;
      }
    ).handleEvent({ type: 'ready', session_id: 'raw-session-no-team', capabilities: {} });
    await started;

    expect(stdin).not.toContain('"type":"add_mcp_server"');
  });

  it('REGRESSION: an unresolvable NAMED profile must ABORT the spawn, not fall back to the default home', async () => {
    // A ProfileIsolationError means: a named profile IS active and we could not
    // resolve its dir. Spawning anyway (WAYLAND_HOME unset) binds that profile's
    // session to the DEFAULT profile's config.toml / memory.db / credentials — the
    // exact cross-account bleed this contract exists to prevent. Refuse the spawn.
    resolveActiveConfigDirMock.mockRejectedValue(new ProfileIsolationError('work', 'EACCES'));

    await expect(newAgent().start()).rejects.toBeInstanceOf(ProfileIsolationError);
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it('ANTI-BRICK: a NON-profile fault (e.g. os.homedir() throwing) must still spawn, exactly as before', async () => {
    // nativeConfigDir() reaches os.homedir() unguarded, and that throws
    // ERR_SYSTEM_ERROR when uv_os_homedir fails — so the `default` branch is NOT
    // throw-free. Failing closed on THAT would refuse the spawn for every ordinary
    // default-profile user (i.e. everyone today, since no profile UI ships) over a
    // fault that has nothing to do with profiles.
    //
    // The narrowing to `instanceof ProfileIsolationError` is the only thing standing
    // between this fix and a brick. Delete it and this test goes red.
    resolveActiveConfigDirMock.mockRejectedValue(
      Object.assign(new Error('uv_os_homedir returned ENOENT'), { code: 'ERR_SYSTEM_ERROR' })
    );

    void newAgent()
      .start()
      .catch(() => {});
    await vi.waitFor(() => expect(spawnMock).toHaveBeenCalled());
    // Spawned, and with WAYLAND_HOME absent — the engine falls back to the same
    // default home it would have used before this change. Behaviour preserved.
    expect(spawnedEnv().WAYLAND_HOME).toBeUndefined();
  });

  it('passes the reserved profile and exact MCP allowlist on a Desktop-managed launch', async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'wcore-mcp-profile-'));
    resolveActiveConfigDirMock.mockResolvedValue(NATIVE_DIR);
    const agent = new WCoreAgent({
      workspace,
      model: MODEL,
      mcpServerNames: ['tavily', 'firecrawl'],
      onStreamEvent: () => {},
    });

    void agent.start().catch(() => {});
    await vi.waitFor(() => expect(spawnMock).toHaveBeenCalled());
    const args = spawnMock.mock.calls[0]?.[1] as string[];
    expect(args).toContain('--profile');
    expect(args[args.indexOf('--profile') + 1]).toBe('__wayland_desktop_session');
    const projectConfig = readFileSync(join(workspace, '.wcore.toml'), 'utf-8');
    expect(projectConfig).toContain('[profiles.__wayland_desktop_session]');
    expect(projectConfig).toContain('"firecrawl"');
    expect(projectConfig).toContain('"tavily"');
    rmSync(workspace, { recursive: true, force: true });
  });
});
