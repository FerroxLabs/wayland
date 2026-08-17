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
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IMcpServer } from '@/common/config/storage';
import type { ResolvedJsRuntime } from '@process/utils/jsRuntime';

const PACKAGED_BUN = '/Applications/Wayland.app/Contents/Resources/bundled-bun/darwin-arm64/bun';
const DEV_ELECTRON = '/repo/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron';

const h = vi.hoisted(() => ({
  /** Every `IMcpServer` list handed to the launch-local `WCoreMcpAgent`. */
  published: [] as IMcpServer[][],
  /** The config.toml path that agent was constructed against. */
  configPaths: [] as Array<string | undefined>,
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
      constructor(configPath?: string) {
        h.configPaths.push(configPath);
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

import { WCoreManager } from '@process/task/WCoreManager';
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
    const toml = toWCoreConfig(apple!);
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
  });
});
