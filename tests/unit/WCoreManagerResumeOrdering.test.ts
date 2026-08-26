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

// ── Hoisted mocks ──────────────────────────────────────────────────

const {
  emitResponseStream,
  emitConfirmationAdd,
  emitConfirmationUpdate,
  emitConfirmationRemove,
  callOrder,
  mockLoadReplayableGrantRoots,
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
  mockLoadReplayableGrantRoots: vi.fn(async () => [] as string[]),
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
  loadReplayableGrantRoots: (...args: unknown[]) => {
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

vi.mock('@process/agent/wcore', () => ({
  WCoreAgent: vi.fn().mockImplementation((...args: unknown[]) => {
    WCoreAgentCtor(...(args as []));
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
  }),
}));


// ── Import under test ──────────────────────────────────────────────

import { WCoreManager } from '@/process/task/WCoreManager';

// ── Tests ──────────────────────────────────────────────────────────

const CONV = 'conv-order-1';

function makeManager(): WCoreManager {
  const data = {
    workspace: '/test/workspace',
    model: { name: 'p', useModel: 'm', baseUrl: '', platform: 'test' },
    conversation_id: CONV,
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
    await manager.start().catch(() => undefined);

    const readAt = callOrder.indexOf('db:getConversationMessages');
    const grantsAt = callOrder.indexOf('grants:load');
    expect(readAt).toBeGreaterThanOrEqual(0);
    expect(grantsAt).toBeGreaterThanOrEqual(0);
    // The whole defect in one assertion.
    expect(readAt).toBeLessThan(grantsAt);
  });

});
