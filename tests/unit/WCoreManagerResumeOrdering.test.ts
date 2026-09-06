/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * REGRESSION GUARD: resume-vs-new must be decided BEFORE anything else is
 * awaited in `WCoreManager.start()`.
 *
 * The decision reads whether the conversation already has a message. That read
 * races the renderer persisting the turn's OWN user message, so every await
 * placed ahead of it widens the window until the race is reliably lost.
 *
 * #982 put the replayable-grant snapshot ahead of it, and that alone was
 * enough. On a FIRST turn the message landed during that await, the brand-new
 * conversation read as resumable, and Desktop asked a freshly spawned engine to
 * resume a session it had never created. The engine answers `Session not found`
 * BEFORE the ready handshake, so the Desktop contract gate fails closed on
 * `ready_required` - correctly - and the fallback to a new session cannot
 * rescue it, because the contract consumer has already latched `failed`.
 *
 * The user-visible result was a packaged chat that never replied, with the
 * entire unit suite green. It was caught only by launching the signed build and
 * typing into it, and isolated by A/B: main PASS, main+lane/teams FAIL, on a
 * byte-identical engine (sha256 4607f30dbe52).
 *
 * This pins the ORDER rather than the race, because order is what the next
 * author can accidentally change. `start()` does not run to completion under
 * this harness - it does not need to; both calls happen before it stops, and
 * asserting their relative order is the whole invariant.
 *
 * CONTROL: verified to FAIL when the await is moved back in front of the read
 * ("expected 2 to be less than 0"), so it is not a tautology.
 */

/**
 * GAP-9: WCoreManager Turn Completion Service - Black-box tests
 *
 * Tests based on GAP-9-plan.md acceptance criteria.
 * Validates that WCoreManager calls ConversationTurnCompletionService
 * on turn completion (normal finish and fallback finish).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import path from 'node:path';
import type { LiveFolderGrant } from '@/common/workspace/folderGrants';
import type { FolderGrantListResult } from '@/common/workspace/folderGrantsIpc';
import type { WCoreAgentOptions } from '@/process/agent/wcore';
import { clearLivePathGrantSessionsForTest, listLivePathGrantSessions } from '@/process/agent/wcore/pathGrantSessions';

// ── Hoisted mocks ──────────────────────────────────────────────────

const {
  emitResponseStream,
  emitConfirmationAdd,
  emitConfirmationUpdate,
  emitConfirmationRemove,
  callOrder,
  mockLoadReplayableGrantRoots,
  liveHarness,
  WCoreAgentCtor,
  mockDb,
  mockTeamEventBusEmit,
  mockChannelEmitAgentMessage,
  mockNotifyPotentialCompletion,
} = vi.hoisted(() => ({
  emitResponseStream: vi.fn(),
  emitConfirmationAdd: vi.fn(),
  emitConfirmationUpdate: vi.fn(),
  emitConfirmationRemove: vi.fn(),
  callOrder: [] as string[],
  mockLoadReplayableGrantRoots: vi.fn(async () => [] as LiveFolderGrant[]),
  liveHarness: {
    enabled: false,
    agent: null as import('@/process/agent/wcore').WCoreAgent | null,
    child: null as
      | (import('node:events').EventEmitter & {
          stdout: import('node:stream').PassThrough;
          stderr: import('node:stream').PassThrough;
          stdin: import('node:stream').PassThrough;
        })
      | null,
    written: [] as string[],
    list: null as (() => Promise<FolderGrantListResult>) | null,
    barrierStarted: null as (() => void) | null,
  },
  WCoreAgentCtor: vi.fn(),
  mockDb: {
    getConversationMessages: vi.fn(() => ({ data: [] })),
    __recordRead: true,
    getConversation: vi.fn(() => ({ success: false })),
    updateConversation: vi.fn(),
    createConversation: vi.fn(() => ({ success: true })),
    insertMessage: vi.fn(),
    updateMessage: vi.fn(),
  },
  mockTeamEventBusEmit: vi.fn(),
  mockChannelEmitAgentMessage: vi.fn(),
  mockNotifyPotentialCompletion: vi.fn().mockResolvedValue(undefined),
}));

// ── Module mocks ───────────────────────────────────────────────────

vi.mock('@/common', () => ({
  ipcBridge: {
    workspaceFolderGrants: {
      list: {
        provider: (handler: () => Promise<FolderGrantListResult>) => {
          liveHarness.list = handler;
        },
      },
      remove: { provider: vi.fn() },
      add: { provider: vi.fn() },
    },
    conversation: {
      responseStream: { emit: emitResponseStream },
      confirmation: {
        add: { emit: emitConfirmationAdd },
        update: { emit: emitConfirmationUpdate },
        remove: { emit: emitConfirmationRemove },
      },
    },
    cron: {
      onJobCreated: { emit: vi.fn() },
      onJobRemoved: { emit: vi.fn() },
    },
  },
}));

vi.mock('@process/services/workspace/folderGrantReplay', () => ({
  loadReplayableGrants: (...args: unknown[]) => {
    callOrder.push('grants:load');
    return mockLoadReplayableGrantRoots(...(args as []));
  },
  replayableGrantRootFor: () => null,
  resolveReplayableGrantRoot: async () => null,
}));

vi.mock('@process/team/teamEventBus', () => ({
  teamEventBus: { emit: mockTeamEventBusEmit },
}));

vi.mock('@process/channels/agent/ChannelEventBus', () => ({
  channelEventBus: { emitAgentMessage: mockChannelEmitAgentMessage },
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: { isPackaged: () => false, getAppPath: () => null },
    worker: {
      fork: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        postMessage: vi.fn(),
        kill: vi.fn(),
      })),
    },
  }),
}));

vi.mock('@process/utils/shellEnv', () => ({
  getEnhancedEnv: vi.fn(() => ({})),
}));

vi.mock('@process/services/database', () => ({
  getDatabase: vi.fn(() => Promise.resolve(mockDb)),
}));

vi.mock('@process/services/database/export', () => ({
  getDatabase: vi.fn(() => Promise.resolve(mockDb)),
}));

// Permissive: this suite is about ONE ordering decision, and initStorage has a
// wide surface the decision does not touch. Naming each export would be
// whack-a-mole that adds no coverage.
vi.mock('@process/utils/initStorage', () => ({
  ProcessChat: { get: vi.fn(() => Promise.resolve([])) },
  ProcessConfig: {
    get: vi.fn(() => Promise.resolve(undefined)),
    set: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
  },
  getSkillsDir: vi.fn(() => '/tmp/wl-test-skills'),
  getSystemDir: vi.fn(() => ({ workDir: '/test/work', cacheDir: '/test/cache' })),
}));

vi.mock('@process/utils/message', () => ({
  addMessage: vi.fn(),
  addOrUpdateMessage: vi.fn(),
}));

vi.mock('@/common/utils', () => {
  let counter = 0;
  return { uuid: vi.fn(() => `uuid-${++counter}`) };
});

vi.mock('@/renderer/utils/common', () => {
  let counter = 0;
  return { uuid: vi.fn(() => `pipe-${++counter}`) };
});

vi.mock('@process/utils/mainLogger', () => ({
  mainError: vi.fn(),
  mainLog: vi.fn(),
  mainWarn: vi.fn(),
}));

vi.mock('@process/services/cron/cronServiceSingleton', () => ({
  cronService: {
    addJob: vi.fn(async () => ({ id: 'cron-1', name: 'test', enabled: true })),
    removeJob: vi.fn(async () => {}),
    listJobsByConversation: vi.fn(async () => []),
  },
}));

vi.mock('./ConversationTurnCompletionService', async () => {
  const actual = await vi.importActual<typeof import('@/process/task/ConversationTurnCompletionService')>(
    '@/process/task/ConversationTurnCompletionService'
  );
  return actual;
});

vi.mock('@/process/task/ConversationTurnCompletionService', () => ({
  ConversationTurnCompletionService: {
    getInstance: vi.fn(() => ({
      notifyPotentialCompletion: mockNotifyPotentialCompletion,
    })),
  },
}));

vi.mock('@process/agent/wcore/profilePaths', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/process/agent/wcore/profilePaths')>();
  return {
    ...actual,
    acquireRuntimeLaunchAuthority: vi.fn(async () => ({ raw: true, identity: null, release: async () => undefined })),
  };
});

// Existing fake-child fixture pattern: execute WCoreAgent.start itself and
// feed ready/receipts through its actual bounded JSONL stdout consumer.
vi.mock('node:child_process', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:child_process')>()),
  spawn: vi.fn(() => {
    const child = Object.assign(new EventEmitter(), {
      stdout: new PassThrough(),
      stderr: new PassThrough(),
      stdin: new PassThrough(),
    });
    liveHarness.child = child;
    child.stdin.on('data', (chunk: Buffer) => {
      const line = chunk.toString();
      liveHarness.written.push(line);
      const command = JSON.parse(line);
      if (command.type === 'ping') liveHarness.barrierStarted?.();
      if (command.type === 'add_mcp_server') {
        child.stdout.write(
          JSON.stringify({ type: 'mcp_ready', name: command.name, tools: [], already_connected: false }) + '\n'
        );
      }
    });
    // spawn() returns before start() attaches stdout/exit listeners. The
    // microtask delivers ready only after that synchronous attachment phase.
    void Promise.resolve().then(() => {
      child.stdout.write(
        readFileSync(
          path.resolve(process.cwd(), 'contracts/wayland-desktop-core/v1/events/ready.json'),
          'utf8'
        ).trimEnd() + '\n'
      );
    });
    return child;
  }),
}));
vi.mock('@process/agent/wcore/binaryResolver', () => ({ resolveWCoreBinary: () => '/fixture/wcore' }));
vi.mock('@process/agent/wcore/toolKeyStore', () => ({
  getToolKeyStore: async () => ({ collectForwardedEnv: () => ({}) }),
}));
vi.mock('@process/agent/agentChildRegistry', () => ({ trackAgentChild: vi.fn() }));
vi.mock('@process/agent/acp/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/process/agent/acp/utils')>()),
  killChild: vi.fn(async () => undefined),
}));

vi.mock('@process/agent/wcore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/process/agent/wcore')>();
  return {
    ...actual,
    WCoreAgent: function AgentFixture(options: WCoreAgentOptions) {
      WCoreAgentCtor(options);
      if (liveHarness.enabled) {
        const agent = new actual.WCoreAgent(options);
        liveHarness.agent = agent;
        return agent;
      }
      return {
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn(),
        kill: vi.fn(),
        send: vi.fn().mockResolvedValue(undefined),
        approveTool: vi.fn(),
        denyTool: vi.fn(),
        injectConversationHistory: vi.fn().mockResolvedValue(undefined),
        get bootstrap() {
          return Promise.resolve();
        },
      };
    },
  };
});

// ── Import under test ──────────────────────────────────────────────

import { WCoreManager } from '@/process/task/WCoreManager';

// ── Tests ──────────────────────────────────────────────────────────

const CONV = 'conv-order-1';

function makeManager(): WCoreManager {
  const data = {
    workspace: '/test/workspace',
    model: { name: 'p', useModel: 'm', baseUrl: '', platform: 'test' },
    conversation_id: CONV,
    teamMcpStdioConfig: { name: 'fixture-team', command: 'unused', args: [], env: [] },
  };
  return new WCoreManager(data as any, data.model as any);
}

describe('WCoreManager.start - resume decision ordering', () => {
  beforeEach(() => {
    callOrder.length = 0;
    mockDb.getConversationMessages.mockImplementation(() => {
      callOrder.push('db:getConversationMessages');
      return { data: [] };
    });
    mockLoadReplayableGrantRoots.mockResolvedValue([]);
  });

  it('reads the conversation BEFORE awaiting the grant snapshot', async () => {
    const manager = makeManager();
    await (manager as unknown as { agentReady: Promise<void> }).agentReady;
    await manager.stop();

    const readAt = callOrder.indexOf('db:getConversationMessages');
    const grantsAt = callOrder.indexOf('grants:load');
    expect(readAt).toBeGreaterThanOrEqual(0);
    expect(grantsAt).toBeGreaterThanOrEqual(0);
    // The whole defect in one assertion.
    expect(readAt).toBeLessThan(grantsAt);
  });
});

describe('saved-folder startup through manager and existing Settings list (#1236)', () => {
  const grant = {
    grantId: 'grant-001',
    root: '/srv/reports',
    access: 'read',
    grantedAtMs: 1,
    origin: 'settings',
  } as LiveFolderGrant;
  let manager: WCoreManager | undefined;

  beforeEach(() => {
    mockLoadReplayableGrantRoots.mockClear();
    WCoreAgentCtor.mockClear();
    vi.useFakeTimers();
    liveHarness.enabled = true;
    liveHarness.agent = null;
    liveHarness.child = null;
    liveHarness.written = [];
    callOrder.length = 0;
    mockDb.getConversationMessages.mockReturnValue({ data: [] });
    mockLoadReplayableGrantRoots.mockResolvedValue([grant]);
  });

  afterEach(async () => {
    await manager?.stop();
    if (liveHarness.agent) await liveHarness.agent.kill();
    liveHarness.child?.stdout.destroy();
    liveHarness.child?.stderr.destroy();
    liveHarness.child?.stdin.destroy();
    vi.clearAllTimers();
    vi.useRealTimers();
    clearLivePathGrantSessionsForTest();
    liveHarness.enabled = false;
    liveHarness.barrierStarted = null;
    vi.restoreAllMocks();
  });

  async function launch() {
    let notify!: () => void;
    const barrier = new Promise<void>((resolve) => {
      notify = resolve;
    });
    liveHarness.barrierStarted = notify;
    manager = makeManager();
    const internal = manager as unknown as {
      agentReady: Promise<void>;
      startError: unknown;
      heartbeatActive: boolean;
      heartbeatInterval: ReturnType<typeof setInterval> | null;
    };
    // If bootstrap fails before reaching the fixture, surface that failure
    // rather than leave this test hanging on its own barrier.
    await Promise.race([
      barrier,
      internal.agentReady.then(() => {
        if (!liveHarness.agent) throw internal.startError ?? new Error('agent was not constructed');
      }),
    ]);
    const events = path.resolve(process.cwd(), 'contracts/wayland-desktop-core/v1/events');
    const raw = (frame: unknown) => {
      liveHarness.child!.stdout.write(JSON.stringify(frame) + '\n');
    };
    return { internal, raw, events };
  }

  it.each(['local_opt_in_required', 'policy_rejected', 'applied'] as const)(
    'projects %s from decoded engine frames while preserving stored consent',
    async (outcome) => {
      const h = await launch();
      expect(h.internal.heartbeatActive).toBe(false);
      expect(h.internal.heartbeatInterval).toBeNull();
      expect(liveHarness.written.map((line) => JSON.parse(line).type)).toEqual(['grant_path', 'ping']);
      expect(mockLoadReplayableGrantRoots).toHaveBeenCalledTimes(2);
      expect(listLivePathGrantSessions()).toHaveLength(1);
      const policy = JSON.parse(readFileSync(path.join(h.events, 'workspace_policy.json'), 'utf8'));
      h.raw({ ...policy, policy: { ...policy.policy, readable_roots: ['/srv/reports'] } });
      if (outcome !== 'applied') {
        h.raw({ ...JSON.parse(readFileSync(path.join(h.events, 'grant_refused.json'), 'utf8')), reason: outcome });
      }
      h.raw({ type: 'pong' });
      await h.internal.agentReady;
      expect(h.internal.startError).toBeNull();
      expect(h.internal.heartbeatActive).toBe(false);
      expect(h.internal.heartbeatInterval).not.toBeNull();
      expect(liveHarness.written.map((line) => JSON.parse(line).type)).toEqual([
        'grant_path',
        'ping',
        'add_mcp_server',
      ]);
      const { initWorkspaceFolderGrantsBridge } = await import('@/process/bridge/workspaceFolderGrantsBridge');
      initWorkspaceFolderGrantsBridge({
        store: { listAll: async () => [{ workspaceId: 'workspace', grants: [grant], withheld: [] }] } as never,
        resolveWorkspaces: async () => new Map([['workspace', { dir: '/test/workspace', displayName: 'Workspace' }]]),
      });
      const result = await liveHarness.list!();
      if (result.ok === false) throw new Error('list failed');
      expect(result.workspaces[0].grants).toEqual([grant]);
      expect(result.workspaces[0].sessions?.[0]).toMatchObject({
        conversationId: CONV,
        applications: [
          outcome === 'applied'
            ? { grantId: grant.grantId, status: 'applied', coverage: 'policy-confirmed' }
            : { grantId: grant.grantId, status: 'refused', reason: outcome },
        ],
      });
    }
  );

  it('re-reads consent with the new agent registered, excludes withdrawals and waits on additions', async () => {
    mockLoadReplayableGrantRoots.mockResolvedValueOnce([grant]).mockImplementationOnce(async () => {
      expect(listLivePathGrantSessions()).toHaveLength(1);
      return [{ ...grant, grantId: 'new-consent' }];
    });
    const h = await launch();
    await h.internal.agentReady;
    expect(liveHarness.written.map((line) => JSON.parse(line).type)).toEqual(['add_mcp_server']);
    expect(WCoreAgentCtor).toHaveBeenLastCalledWith(expect.objectContaining({ allowHostPathGrants: true }));
  });

  it('does not opt in or issue a grant batch for empty consent', async () => {
    mockLoadReplayableGrantRoots.mockResolvedValue([]);
    const h = await launch();
    await h.internal.agentReady;
    expect(liveHarness.written.map((line) => JSON.parse(line).type)).toEqual(['add_mcp_server']);
    expect(WCoreAgentCtor).toHaveBeenLastCalledWith(expect.objectContaining({ allowHostPathGrants: false }));
    expect(mockLoadReplayableGrantRoots).toHaveBeenCalledTimes(1);
  });
});

// Same child/stdout fixture as the manager/list journey, with history supplied
// directly so the real agent's own post-ready history path is also exercised.
describe('real WCoreAgent startup command order (#1236)', () => {
  it('keeps MCP/history and the first message behind the ready grant/pong barrier', async () => {
    vi.useFakeTimers();
    liveHarness.written = [];
    let notify!: () => void;
    const barrier = new Promise<void>((resolve) => {
      notify = resolve;
    });
    liveHarness.barrierStarted = notify;
    const { WCoreAgent: RealAgent } =
      await vi.importActual<typeof import('@/process/agent/wcore')>('@/process/agent/wcore');
    const agent = new RealAgent({
      workspace: '/test/workspace',
      model: { platform: 'openai', useModel: 'fixture', baseUrl: '', name: 'fixture' } as WCoreAgentOptions['model'],
      rawEngineMode: true,
      allowHostPathGrants: true,
      presetRules: 'Fixture history',
      stdioMcpServers: [{ name: 'fixture-tools', command: 'unused', args: [], env: [], awaitReady: true }],
      onStreamEvent: vi.fn(),
    });
    agent.prepareStartupPathGrants([
      {
        grantId: 'grant-001',
        root: '/srv/reports',
        access: 'read',
        grantedAtMs: 1,
        origin: 'settings',
      } as LiveFolderGrant,
    ]);
    const started = agent.start();
    try {
      await Promise.race([
        barrier,
        started.then(() => {
          throw new Error('startup escaped the grant barrier');
        }),
      ]);
      expect(liveHarness.written.map((line) => JSON.parse(line).type)).toEqual(['grant_path', 'ping']);
      await expect(agent.send('too soon', 'early-turn')).rejects.toThrow(/owns the idle command phase/);
      const frame = JSON.parse(
        readFileSync(
          path.resolve(process.cwd(), 'contracts/wayland-desktop-core/v1/events/workspace_policy.json'),
          'utf8'
        )
      );
      liveHarness.child!.stdout.write(
        JSON.stringify({ ...frame, policy: { ...frame.policy, readable_roots: ['/srv/reports'] } }) + '\n'
      );
      liveHarness.child!.stdout.write('{"type":"pong"}\n');
      await started;
      await agent.send('first message', 'first-turn');
      expect(liveHarness.written.map((line) => JSON.parse(line).type)).toEqual([
        'grant_path',
        'ping',
        'add_mcp_server',
        'init_history',
        'message',
      ]);
      expect(JSON.parse(liveHarness.written[3])).toEqual({
        type: 'init_history',
        text: '[Assistant System Rules]\nFixture history',
      });
    } finally {
      await agent.kill();
      liveHarness.child?.stdout.destroy();
      liveHarness.child?.stderr.destroy();
      liveHarness.child?.stdin.destroy();
      liveHarness.barrierStarted = null;
      clearLivePathGrantSessionsForTest();
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });
});
