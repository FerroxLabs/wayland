/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #1015 F1 — the WAYLAND CORE launch path, driven through `WCoreManager.start()`.
 *
 * The flagship backend's connectors do not come from
 * `McpService.syncMcpToAgents`. `WCoreManager` constructs its OWN
 * `WCoreMcpAgent(<launch-local config.toml>)` and publishes into that file, and
 * the wcore chat loads its connectors from there. So the eight publication
 * targets being covered says NOTHING about this path — it needed the shared
 * builtin-runtime rewrite applied to it separately.
 *
 * The victims are NOT the three core builtins: `buildWCoreSessionMcpServers`
 * filters `builtin !== true`, which excludes them. They are the four bundled
 * @wayland siblings (Apple/IMAP/News/Cal.com), which are installed from the MCP
 * Library and carry no `builtin` field, so they pass the filter and arrive as
 * `node` + a bare relative filename. On a stock macOS that is ENOENT; where a
 * system node exists it is MODULE_NOT_FOUND resolved against Core's cwd.
 *
 * Every assertion below is produced in ONE run alongside its known positives, so
 * a green result cannot be a harness artifact:
 *   - the @wayland sibling (the defect) — must be resolved runtime + absolute path
 *   - an `npx` connector (known positive for the rewrite layer) — must stay the
 *     PORTABLE `bun x --bun` form, because `WCoreMcpAgent` deliberately refuses to
 *     persist an absolute bundled-Bun path that a Linux AppImage remounts
 *   - a core builtin (known negative for the selection filter) — must not be here
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';
import type { ResolvedJsRuntime } from '@process/utils/jsRuntime';

const PACKAGED_BUN = '/Applications/Wayland.app/Contents/Resources/bundled-bun/darwin-arm64/bun';
const DEV_ELECTRON = '/repo/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron';

const h = vi.hoisted(() => ({
  /** Every `IMcpServer` list handed to the launch-local `WCoreMcpAgent`. */
  published: [] as IMcpServer[][],
  /** The config.toml path that agent was constructed against. */
  configPaths: [] as Array<string | undefined>,
  /** Whether that agent was told the file is rewritten on every launch (#1056). */
  launchLocalFlags: [] as Array<boolean | undefined>,
  resolveJsRuntime: vi.fn<() => ResolvedJsRuntime>(),
  runtimeServers: [] as IMcpServer[],
}));

vi.mock('@process/utils/jsRuntime', () => ({ resolveJsRuntime: h.resolveJsRuntime }));

// Keep the REAL `toWCoreConfig` (the config.toml serializer under test) and swap
// only the agent, so what lands on disk is still produced by production code.
vi.mock('@process/services/mcpServices/agents/WCoreMcpAgent', async (orig) => {
  const actual = await orig<typeof import('@process/services/mcpServices/agents/WCoreMcpAgent')>();
  return {
    ...actual,
    WCoreMcpAgent: class {
      constructor(configPath?: string, launchLocal?: boolean) {
        h.configPaths.push(configPath);
        h.launchLocalFlags.push(launchLocal);
      }
      installMcpServers(servers: IMcpServer[]) {
        h.published.push(servers);
        return Promise.resolve({ success: true });
      }
    },
  };
});

vi.mock('@process/services/mcpServices/runtimeMcpServers', () => ({
  loadRuntimeMcpServers: vi.fn(async () => h.runtimeServers),
}));

vi.mock('@process/services/mcpServices/McpService', () => ({
  mcpService: {
    // Identity, exactly like the real implementation for servers with no OAuth
    // token — so this test observes the tuple WCoreManager built, not ours.
    attachOAuthTokens: vi.fn(async (servers: IMcpServer[]) => servers),
  },
}));

vi.mock('@process/agent/wcore/profilePaths', () => ({
  acquireRuntimeLaunchAuthority: vi.fn(async () => ({
    raw: false,
    identity: { dir: '/launch/wayland-home' },
    release: async () => {},
  })),
}));

vi.mock('@process/agent/wcore/effectiveRuntimeActions', () => ({
  readRawEngineModePreference: vi.fn(async () => false),
  readOutputBudgetPreference: vi.fn(async () => undefined),
}));

// Stop the launch immediately AFTER the publication block: the engine spawn and
// everything downstream is irrelevant here and `start()` rethrows, which the test
// catches. Nothing in the publication block runs after this point.
function stopAfterPublication(): never {
  throw new Error('STOP_AFTER_MCP_PUBLICATION');
}
vi.mock('@process/agent/wcore', () => ({ WCoreAgent: stopAfterPublication }));

vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(async () => ({
    getConversationMessages: () => ({ data: [] }),
    getConversation: () => ({ success: false }),
    updateConversation: vi.fn(),
    insertMessage: vi.fn(),
    updateMessage: vi.fn(),
  })),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      responseStream: { emit: vi.fn() },
      confirmation: { add: { emit: vi.fn() }, update: { emit: vi.fn() }, remove: { emit: vi.fn() } },
    },
    cron: { onJobCreated: { emit: vi.fn() }, onJobRemoved: { emit: vi.fn() } },
  },
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: {
      isPackaged: () => false,
      getAppPath: () => null,
      getDataDir: () => '/tmp/wayland-test-data',
      getHomeDir: () => '/tmp/wayland-test-home',
      getTempDir: () => '/tmp',
      getName: () => 'Wayland',
      getVersion: () => '1.0.0',
    },
    worker: { fork: vi.fn() },
  }),
}));

// `initStorage` builds real on-disk stores at import time; only `ProcessConfig`
// is reachable from this path, and the two preference readers that use it are
// already mocked above.
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: vi.fn(async () => undefined), set: vi.fn(async () => {}), remove: vi.fn(async () => {}) },
  ProcessChat: { get: vi.fn(async () => []) },
}));

vi.mock('@process/utils/mainLogger', () => ({ mainError: vi.fn(), mainLog: vi.fn(), mainWarn: vi.fn() }));
vi.mock('@process/services/cron/cronServiceSingleton', () => ({
  cronService: { addJob: vi.fn(), removeJob: vi.fn(), listJobsByConversation: vi.fn(async () => []) },
}));
vi.mock('@process/task/agentUtils', () => ({
  buildSystemInstructionsWithSkillsIndex: vi.fn(async () => undefined),
  buildTurnSkillContext: vi.fn(async () => undefined),
  consumePendingSessionSkills: vi.fn(() => []),
  mergeLoadedSkillsExtra: vi.fn((x: unknown) => x),
  resolveCapabilitiesManifest: vi.fn(async () => undefined),
}));

import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { WCoreManager } from '@process/task/WCoreManager';
import { applyBuiltinMcpRuntime } from '@process/services/mcpServices/builtinMcpRuntime';
import { toWCoreConfig } from '@process/services/mcpServices/agents/WCoreMcpAgent';
import { getMcpScriptPath } from '@process/utils/mcpScriptDir';

const server = (over: Partial<IMcpServer>): IMcpServer => ({
  id: 'id',
  name: 'name',
  enabled: true,
  status: 'connected',
  transport: { type: 'stdio', command: 'node', args: [], env: {} },
  tools: [],
  createdAt: 1,
  updatedAt: 1,
  originalJson: '{}',
  ...over,
});

/** Exactly what the MCP Library persists for a bundled @wayland install. */
const APPLE = server({
  id: 'lib_apple',
  name: 'com.wayland-apple-mcp',
  source: 'library',
  libraryEntryId: 'com.wayland/apple-mcp',
  transport: { type: 'stdio', command: 'node', args: ['builtin-mcp-apple.mjs'], env: {} },
});
/** KNOWN POSITIVE for the rewrite layer; must keep the restart-safe form. */
const NPX = server({
  id: 'npx',
  name: 'npx-connector',
  transport: { type: 'stdio', command: 'npx', args: ['-y', 'some-mcp'], env: {} },
});
/** KNOWN NEGATIVE for the selection filter: a core builtin never reaches wcore. */
const CORE_BUILTIN = server({
  id: 'builtin-search-skills',
  name: 'wayland-search-skills',
  builtin: true,
  transport: { type: 'stdio', command: 'node', args: [getMcpScriptPath('builtin-mcp-search-skills.js')], env: {} },
});

const startManager = async () => {
  const manager = new WCoreManager({
    id: 'conv-1',
    data: {
      workspace: '/ws',
      model: { name: 'm', useModel: 'm', platform: 'openai', baseUrl: '' },
      activeMcpServers: [APPLE.id, NPX.id, CORE_BUILTIN.id],
    },
  } as never);
  await expect(manager.start()).rejects.toThrow('STOP_AFTER_MCP_PUBLICATION');
  // `BaseAgentManager` may retry the bootstrap; each attempt republishes, and
  // every attempt must be correct, so assert over ALL of them.
  expect(h.published.length).toBeGreaterThan(0);
  expect(h.published.map((list) => JSON.stringify(list))).toEqual(
    h.published.map(() => JSON.stringify(h.published[0]))
  );
  return h.published[0]!;
};

describe.each([
  [
    'packaged (bundled Bun)',
    (): ResolvedJsRuntime => ({ command: PACKAGED_BUN, env: {}, kind: 'bundled-bun' }),
    PACKAGED_BUN,
    undefined,
  ],
  [
    'dev (Electron as Node)',
    (): ResolvedJsRuntime => ({ command: DEV_ELECTRON, env: { ELECTRON_RUN_AS_NODE: '1' }, kind: 'electron-node' }),
    DEV_ELECTRON,
    { ELECTRON_RUN_AS_NODE: '1' },
  ],
])('WCoreManager publishes the resolved runtime into the launch config.toml — %s', (_l, runtime, command, env) => {
  beforeEach(() => {
    h.published.length = 0;
    h.configPaths.length = 0;
    h.launchLocalFlags.length = 0;
    h.runtimeServers = [APPLE, NPX, CORE_BUILTIN];
    h.resolveJsRuntime.mockReset().mockImplementation(runtime);
  });

  it('rewrites the bundled @wayland sibling onto the resolved JS runtime', async () => {
    const published = await startManager();
    const apple = published.find((s) => s.name === 'com.wayland-apple-mcp');
    expect(apple).toBeDefined();
    const transport = apple!.transport as Extract<IMcpServer['transport'], { type: 'stdio' }>;
    expect(transport.command).toBe(command);
    expect(transport.command).not.toBe('node');
    // Absolute, not the bare relative filename Core would resolve against its cwd.
    expect(transport.args?.[0]).not.toBe('builtin-mcp-apple.mjs');
    expect(transport.args?.[0]).toMatch(/[/\\]builtin-mcp-apple\.mjs$/);

    // ...and it survives the REAL config.toml serializer, ENV half included: the
    // dev runtime is the app binary and is only a Node runtime with
    // ELECTRON_RUN_AS_NODE=1 riding along.
    const toml = toWCoreConfig(apple!, { launchLocal: true });
    expect(toml.command).toBe(command);
    expect(toml.args?.[0]).toMatch(/[/\\]builtin-mcp-apple\.mjs$/);
    expect(toml.env).toEqual(env);
  });

  it('leaves the npx connector on the restart-safe portable form (AppImage carve-out)', async () => {
    const published = await startManager();
    const npx = published.find((s) => s.name === 'npx-connector');
    expect(npx).toBeDefined();
    // applyBuiltinMcpRuntime deliberately does NOT pre-resolve npx, so
    // WCoreMcpAgent keeps its own choice of the portable form.
    expect(toWCoreConfig(npx!)).toEqual({ transport: 'stdio', command: 'bun', args: ['x', '--bun', 'some-mcp'] });
  });

  it('never publishes a core builtin into the wcore launch config', async () => {
    const published = await startManager();
    expect(published.map((s) => s.name)).not.toContain('wayland-search-skills');
    // The publication targeted the launch-local profile, not the global config.
    expect(h.configPaths[0]).toContain('/launch/wayland-home');
    // ...and said so, which is what licenses the absolute bundled-runtime path
    // asserted above: this file is rewritten on every launch (#1056).
    expect(h.launchLocalFlags[0]).toBe(true);
  });
});

/**
 * #1015 F3 / #1056 — the GLOBAL config.toml, the OTHER writer of `toWCoreConfig`.
 *
 * `McpService.syncMcpToAgents` publishes through `new WCoreMcpAgent()` with no
 * launch-local flag, and NOTHING resyncs that file: every `syncMcpToAgents`
 * caller is user-action driven, so whatever one launch writes stays until the
 * user next touches MCP settings. On a Linux AppImage (a shipped target,
 * `electron-builder.yml`) `process.resourcesPath` is a per-launch squashfs mount
 * point, so the absolute bundled-Bun command `applyBuiltinMcpRuntime` produces
 * names a binary that stops existing the moment the app restarts.
 *
 * The remount is simulated for real: the tuple is serialized while mount A is on
 * disk, mount A is then removed (unmounted) and mount B is the live one, and
 * both sides of every comparison are produced in the SAME run.
 */
describe('#1056 global config.toml survives an AppImage remount', () => {
  const realPlatform = process.platform;
  let root = '';
  let mountA = '';
  let mountB = '';
  const bunIn = (mount: string) => join(mount, 'bundled-bun', 'linux-x64', 'bun');
  const scriptIn = (mount: string) => (name: string) => join(mount, 'app.asar.unpacked', 'out', 'main', name);
  /** Exactly what launch A resolves for the sibling, before any serializer. */
  const resolvedOnA = () =>
    applyBuiltinMcpRuntime(APPLE, { scriptPath: scriptIn(mountA), platform: 'linux' }).transport as Extract<
      IMcpServer['transport'],
      { type: 'stdio' }
    >;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'wl-1056-'));
    mountA = join(root, '.mount_WaylanAAAAAA');
    mountB = join(root, '.mount_WaylanBBBBBB');
    for (const mount of [mountA, mountB]) {
      mkdirSync(dirname(bunIn(mount)), { recursive: true });
      writeFileSync(bunIn(mount), '#!/bin/sh\n');
      const script = scriptIn(mount)('builtin-mcp-apple.mjs');
      mkdirSync(dirname(script), { recursive: true });
      writeFileSync(script, '');
    }
    h.resolveJsRuntime.mockReset().mockImplementation(() => ({ command: bunIn(mountA), env: {}, kind: 'bundled-bun' }));
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: realPlatform, configurable: true });
    rmSync(root, { recursive: true, force: true });
  });

  it('persists a command that is still resolvable after the mount point changes', () => {
    const persisted = toWCoreConfig(applyBuiltinMcpRuntime(APPLE, { scriptPath: scriptIn(mountA), platform: 'linux' }));
    const absolute = resolvedOnA().command;

    expect(absolute).toBe(bunIn(mountA));
    expect(existsSync(absolute)).toBe(true); // known positive: valid on the launch that wrote it
    rmSync(mountA, { recursive: true, force: true }); // ...the AppImage unmounts
    expect(existsSync(absolute)).toBe(false); // so the persisted absolute command is gone
    expect(existsSync(bunIn(mountB))).toBe(true); // known positive: the check does find a live mount

    // The persisted command is not a mount path at all: it is the portable `bun`
    // Core finds on the PATH it is launched with, exactly like the npx form.
    expect(persisted.command).toBe('bun');
    expect(persisted.command).not.toContain(root);

    // Stated, not blessed: the SCRIPT path is still mount-local, so this entry
    // does not become spawnable again on its own after a remount — no file
    // Desktop never resyncs can be. That half is unchanged by this fix and
    // predates it (the core builtins have persisted an absolute
    // `app.asar.unpacked` args[0] since long before the runtime rewrite). What
    // the fix removes is the runtime path this PR newly introduced.
    expect(persisted.args?.[0]).toBe(scriptIn(mountA)('builtin-mcp-apple.mjs'));
    expect(existsSync(persisted.args![0]!)).toBe(false);
  });

  it('keeps the absolute runtime on Windows, where install paths are stable', () => {
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    const persisted = toWCoreConfig(applyBuiltinMcpRuntime(APPLE, { scriptPath: scriptIn(mountA), platform: 'linux' }));
    expect(persisted.command).toBe(bunIn(mountA));
  });

  it('leaves the launch-local file on the absolute tuple the probe spawns', () => {
    const spawnable = applyBuiltinMcpRuntime(APPLE, { scriptPath: scriptIn(mountA), platform: 'linux' });
    const persisted = toWCoreConfig(spawnable, { launchLocal: true });
    expect(persisted.command).toBe(resolvedOnA().command);
    expect(persisted.args).toEqual(resolvedOnA().args);
  });

  it('rewrites only OUR bundled runtime, and leaves the npx form untouched', () => {
    const foreign = server({
      id: 'foreign',
      name: 'foreign-bun',
      transport: { type: 'stdio', command: '/opt/tools/bun', args: ['server.js'], env: {} },
    });
    expect(toWCoreConfig(foreign).command).toBe('/opt/tools/bun');
    expect(toWCoreConfig(NPX)).toEqual({ transport: 'stdio', command: 'bun', args: ['x', '--bun', 'some-mcp'] });

    // A non-bundled runtime is never collapsed either: the dev runtime is the app
    // binary and is only a Node runtime while its ENV half rides along, so `bun`
    // would be a different program entirely.
    h.resolveJsRuntime.mockImplementation(() => ({
      command: DEV_ELECTRON,
      env: { ELECTRON_RUN_AS_NODE: '1' },
      kind: 'electron-node',
    }));
    const dev = server({
      id: 'dev',
      name: 'dev-runtime',
      transport: { type: 'stdio', command: DEV_ELECTRON, args: ['s.mjs'], env: { ELECTRON_RUN_AS_NODE: '1' } },
    });
    expect(toWCoreConfig(dev).command).toBe(DEV_ELECTRON);
  });
});
