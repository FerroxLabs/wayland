/**
 * #468 — Output budget (Auto/Fixed) spawn wiring.
 *
 * Path B: a desktop `wcore.outputBudget` preference drives the per-call
 * `--max-tokens`. Auto (default/unset) leaves `maxTokens` undefined so the
 * engine sizes per-model (#456); Fixed passes the numeric value through to
 * `WCoreAgent` (→ buildSpawnConfig → `--max-tokens <n>`). An explicit
 * per-conversation `maxTokens` still wins. Mirrors the rawEngineMode read.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────

const { mockDb, agentCtorArgs, mockProcessConfigGet, mockProcessConfigRemove, outputBudgetRef } = vi.hoisted(() => ({
  mockDb: {
    getConversationMessages: vi.fn(() => ({ data: [] })),
    getConversation: vi.fn(() => ({ success: false })),
    updateConversation: vi.fn(),
    createConversation: vi.fn(() => ({ success: true })),
    insertMessage: vi.fn(),
    updateMessage: vi.fn(),
  },
  agentCtorArgs: [] as Array<Record<string, unknown>>,
  // Holds the current test's `wcore.outputBudget` value.
  outputBudgetRef: { current: undefined as unknown },
  mockProcessConfigRemove: vi.fn().mockResolvedValue(undefined),
  mockProcessConfigGet: vi.fn((key: string) => {
    if (key === 'wcore.outputBudget') return Promise.resolve(outputBudgetRef.current);
    return Promise.resolve(false); // rawEngineMode etc.
  }),
}));

// ── Module mocks ───────────────────────────────────────────────────

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      responseStream: { emit: vi.fn() },
      confirmation: { add: { emit: vi.fn() }, update: { emit: vi.fn() }, remove: { emit: vi.fn() } },
    },
    cron: { onJobCreated: { emit: vi.fn() }, onJobRemoved: { emit: vi.fn() } },
    cost: { budgetGateBlocked: { emit: vi.fn() } },
  },
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: { isPackaged: () => false, getAppPath: () => null },
    worker: { fork: vi.fn(() => ({ on: vi.fn().mockReturnThis(), postMessage: vi.fn(), kill: vi.fn() })) },
  }),
}));

vi.mock('@process/utils/shellEnv', () => ({ getEnhancedEnv: vi.fn(() => ({})) }));
vi.mock('@process/agent/wcore/profilePaths', async (orig) => {
  const actual = await orig<typeof import('@process/agent/wcore/profilePaths')>();
  return {
    ...actual,
    acquireRuntimeLaunchAuthority: vi.fn(async (readRawMode: () => Promise<boolean>) => {
      const raw = await readRawMode();
      return raw
        ? { raw: true as const, identity: null, release: async () => {} }
        : {
            raw: false as const,
            identity: { profile: '@native', dir: '/test/wayland-core' },
            release: async () => {},
          };
    }),
  };
});
vi.mock('@process/services/database', () => ({ getDatabase: vi.fn(() => Promise.resolve(mockDb)) }));
vi.mock('@process/services/database/export', () => ({ getDatabase: vi.fn(() => Promise.resolve(mockDb)) }));

vi.mock('@process/utils/initStorage', () => ({
  // WCoreManager.start reads getSystemDir().workDir to tell the spawn path which
  // work root it manages, which is what gates the workspace-trust flag. Without
  // this export the mock throws before any budget assertion runs.
  getSystemDir: vi.fn(() => ({ workDir: '/mock/work', cacheDir: '/mock/cache' })),
  ProcessChat: { get: vi.fn(() => Promise.resolve([])) },
  ProcessConfig: {
    get: mockProcessConfigGet,
    set: vi.fn().mockResolvedValue(undefined),
    remove: mockProcessConfigRemove,
  },
}));

vi.mock('@process/utils/message', () => ({ addMessage: vi.fn(), addOrUpdateMessage: vi.fn() }));
vi.mock('@/common/utils', () => {
  let c = 0;
  return { uuid: vi.fn(() => `uuid-${++c}`) };
});
vi.mock('@/renderer/utils/common', () => {
  let c = 0;
  return { uuid: vi.fn(() => `pipe-${++c}`) };
});
vi.mock('@process/utils/mainLogger', () => ({ mainError: vi.fn(), mainLog: vi.fn(), mainWarn: vi.fn() }));
vi.mock('@process/services/cron/cronServiceSingleton', () => ({
  cronService: {
    addJob: vi.fn(async () => ({ id: 'cron-1', name: 'test', enabled: true })),
    removeJob: vi.fn(async () => {}),
    listJobsByConversation: vi.fn(async () => []),
  },
}));

vi.mock('@process/agent/wcore', () => ({
  WCoreAgent: function WCoreAgentMock(this: Record<string, unknown>, opts: Record<string, unknown>) {
    agentCtorArgs.push(opts);
    this.start = vi.fn().mockResolvedValue(undefined);
    this.stop = vi.fn();
    this.kill = vi.fn();
    this.send = vi.fn().mockResolvedValue(undefined);
    this.approveTool = vi.fn();
    this.denyTool = vi.fn();
    this.setConfig = vi.fn();
    this.setMode = vi.fn();
    this.sendCommand = vi.fn();
    this.ping = vi.fn();
    this.isAlive = true;
    this.capabilities = null;
    this.injectConversationHistory = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock('@/process/task/agentUtils', () => ({
  buildSystemInstructionsWithSkillsIndex: vi.fn(async () => undefined),
  buildTurnSkillContext: vi.fn(async () => ({ advert: undefined, autoLoaded: [] })),
  consumePendingSessionSkills: vi.fn(async () => undefined),
  mergeLoadedSkillsExtra: vi.fn(async () => {}),
  resolveCapabilitiesManifest: vi.fn(async () => undefined),
}));

// ── Import under test ──────────────────────────────────────────────

import { WCoreManager } from '@/process/task/WCoreManager';

// ── Helpers ────────────────────────────────────────────────────────

function createManager(extra: Record<string, unknown> = {}): WCoreManager {
  const data = {
    workspace: '/test/workspace',
    model: { name: 'test-provider', useModel: 'test-model', baseUrl: '', platform: 'test' },
    conversation_id: 'conv-ob-1',
    ...extra,
  };
  return new WCoreManager(data as Record<string, unknown>, data.model as Record<string, unknown>);
}

async function spawnAndGetMaxTokens(extra: Record<string, unknown> = {}): Promise<unknown> {
  const manager = createManager(extra);
  await (manager as unknown as { start: () => Promise<void> }).start();
  return agentCtorArgs.at(-1)?.maxTokens;
}

// ── Tests ──────────────────────────────────────────────────────────

describe('WCoreManager output-budget spawn wiring (#468)', () => {
  beforeEach(() => {
    agentCtorArgs.length = 0;
    outputBudgetRef.current = undefined;
    mockProcessConfigRemove.mockReset();
    mockProcessConfigRemove.mockResolvedValue(undefined);
    mockProcessConfigGet.mockReset();
    mockProcessConfigGet.mockImplementation((key: string) => {
      if (key === 'wcore.outputBudget') return Promise.resolve(outputBudgetRef.current);
      return Promise.resolve(false);
    });
  });

  it('Auto (unset preference) → no maxTokens (engine sizes per-model)', async () => {
    outputBudgetRef.current = undefined;
    expect(await spawnAndGetMaxTokens()).toBeUndefined();
  });

  it('Auto mode explicitly → no maxTokens', async () => {
    outputBudgetRef.current = { mode: 'auto' };
    expect(await spawnAndGetMaxTokens()).toBeUndefined();
  });

  it('Fixed with a value → passes that value as maxTokens', async () => {
    outputBudgetRef.current = { mode: 'fixed', value: 16000 };
    expect(await spawnAndGetMaxTokens()).toBe(16000);
  });

  it('repairs Fixed without a usable value to Auto instead of launching an invalid cap', async () => {
    outputBudgetRef.current = { mode: 'fixed' };
    await expect(spawnAndGetMaxTokens()).resolves.toBeUndefined();
    outputBudgetRef.current = { mode: 'fixed', value: 0 };
    await expect(spawnAndGetMaxTokens()).resolves.toBeUndefined();
    expect(mockProcessConfigRemove).toHaveBeenCalledWith('wcore.outputBudget');
  });

  it.each([
    { mode: 'fixed', value: 100 },
    { mode: 'fixed', value: 1000.5 },
    { mode: 'fixed', value: 200001 },
    { mode: 'auto', value: 16000 },
    { mode: 'unknown', value: 16000 },
    { mode: 'auto', unexpected: true },
    { mode: 'fixed', value: 16000, unexpected: true },
  ])('malformed persisted budget %j is removed and recovers locally to Auto', async (value) => {
    outputBudgetRef.current = value;
    await expect(spawnAndGetMaxTokens()).resolves.toBeUndefined();
    expect(mockProcessConfigRemove).toHaveBeenCalledWith('wcore.outputBudget');
  });

  it('removes malformed raw-mode authority and launches managed mode', async () => {
    mockProcessConfigGet.mockImplementation((key: string) => {
      if (key === 'wcore.rawEngineMode') return Promise.resolve('true');
      return Promise.resolve(outputBudgetRef.current);
    });
    await expect(spawnAndGetMaxTokens()).resolves.toBeUndefined();
    expect(mockProcessConfigRemove).toHaveBeenCalledWith('wcore.rawEngineMode');
    expect(agentCtorArgs.at(-1)).toMatchObject({ rawEngineMode: false, waylandHome: '/test/wayland-core' });
  });

  it('fails closed when malformed local preference repair cannot persist', async () => {
    mockProcessConfigGet.mockImplementation((key: string) =>
      Promise.resolve(key === 'wcore.rawEngineMode' ? 'corrupt' : undefined)
    );
    mockProcessConfigRemove.mockRejectedValue(new Error('repair denied'));
    await expect(spawnAndGetMaxTokens()).rejects.toThrow('repair denied');
    expect(agentCtorArgs).toHaveLength(0);
  });

  it('aborts launch when raw-mode authority cannot be read', async () => {
    mockProcessConfigGet.mockImplementation((key: string) => {
      if (key === 'wcore.rawEngineMode') return Promise.reject(new Error('storage unavailable'));
      return Promise.resolve(outputBudgetRef.current);
    });
    await expect(spawnAndGetMaxTokens()).rejects.toThrow('storage unavailable');
    expect(agentCtorArgs).toHaveLength(0);
  });

  it('aborts launch when output-budget authority cannot be read', async () => {
    mockProcessConfigGet.mockImplementation((key: string) => {
      if (key === 'wcore.outputBudget') return Promise.reject(new Error('storage unavailable'));
      return Promise.resolve(false);
    });
    await expect(spawnAndGetMaxTokens()).rejects.toThrow('storage unavailable');
    expect(agentCtorArgs).toHaveLength(0);
  });

  it('explicit per-conversation maxTokens wins over the Fixed global setting', async () => {
    outputBudgetRef.current = { mode: 'fixed', value: 16000 };
    expect(await spawnAndGetMaxTokens({ maxTokens: 4096 })).toBe(4096);
  });
});
