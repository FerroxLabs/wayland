/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1099 — the process half of the folder grant, end to end from an escalated
 * `tool_request` to the `ApprovalScope::AlwaysPath` command on the wire.
 *
 * Two properties are load-bearing and both are asserted with a positive
 * control in the same file:
 *   - a `path_boundary` escalation is NEVER auto-approved, in any mode. Every
 *     auto-approve path in this manager answers with `once`, and Core cannot
 *     run a boundary call under a one-shot grant — so an auto-approval is both
 *     a silent grant of authority outside the workspace AND a refused read.
 *   - granting sends `{ always_path: { root, write: false } }`, scoped to the
 *     CONTAINING FOLDER the engine suggested, never to the target file and
 *     never with write.
 *
 * Contract source: wayland-core main `56ec176e` (`ApprovalScope` in
 * `crates/wcore-protocol/src/commands.rs:587`). v0.13.4 is unpublished, so this
 * is a contract test — no live engine was involved.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────

const {
  emitResponseStream,
  emitConfirmationAdd,
  emitConfirmationUpdate,
  emitConfirmationRemove,
  mockDb,
  mockTeamEventBusEmit,
  mockChannelEmitAgentMessage,
  mockNotifyPotentialCompletion,
} = vi.hoisted(() => ({
  emitResponseStream: vi.fn(),
  emitConfirmationAdd: vi.fn(),
  emitConfirmationUpdate: vi.fn(),
  emitConfirmationRemove: vi.fn(),
  mockDb: {
    getConversationMessages: vi.fn(() => ({ data: [] })),
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

vi.mock('@process/utils/initStorage', () => ({
  ProcessChat: { get: vi.fn(() => Promise.resolve([])) },
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
  WCoreAgent: vi.fn().mockImplementation(() => ({
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
  })),
}));

// ── Import under test ──────────────────────────────────────────────

import { WCoreManager } from '@/process/task/WCoreManager';
import { PATH_BOUNDARY_DENY, PATH_BOUNDARY_GRANT_FOLDER } from '@/common/chat/pathBoundaryConsent';

// ── Helpers ────────────────────────────────────────────────────────

const CONV_ID = 'conv-1099';
const ROOT = '/Users/sean/Documents/reports';
const TARGET = `${ROOT}/q3.md`;

function createManager(conversationId = CONV_ID) {
  const data = {
    workspace: '/test/workspace',
    model: { name: 'test-provider', useModel: 'test-model', baseUrl: '', platform: 'test' },
    conversation_id: conversationId,
  };
  return new WCoreManager(data as any, data.model as any);
}

type FakeAgent = { approveTool: ReturnType<typeof vi.fn>; denyTool: ReturnType<typeof vi.fn> };

function attachAgent(manager: WCoreManager): FakeAgent {
  const agent: FakeAgent = { approveTool: vi.fn(), denyTool: vi.fn() };
  (manager as any).agent = agent;
  return agent;
}

/** A `tool_group` frame carrying a `path_boundary` escalation, as the wcore adapter maps it. */
function boundaryFrame(callId = 'call-boundary') {
  return {
    type: 'tool_group',
    msg_id: 'turn-1',
    data: [
      {
        callId,
        name: 'Read',
        description: `Read ${TARGET}`,
        status: 'Confirming',
        renderOutputAsMarkdown: false,
        confirmationDetails: {
          type: 'path_boundary',
          title: `Read ${TARGET}`,
          target: TARGET,
          suggestedRoot: ROOT,
          access: 'read',
        },
      },
    ],
  };
}

/** The same frame shape for an ordinary `info` call — the positive control. */
function infoFrame(callId = 'call-info') {
  return {
    type: 'tool_group',
    msg_id: 'turn-1',
    data: [
      {
        callId,
        name: 'Read',
        description: 'Read README.md',
        status: 'Confirming',
        renderOutputAsMarkdown: false,
        confirmationDetails: { type: 'info', title: 'Read README.md', prompt: '{}' },
      },
    ],
  };
}

function emitEvent(manager: WCoreManager, event: Record<string, unknown>) {
  (manager as any).emit('wcore.message', event);
}

// ── Tests ──────────────────────────────────────────────────────────

describe('#1099 a path boundary is never auto-approved', () => {
  let manager: WCoreManager;
  let agent: FakeAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = createManager();
    agent = attachAgent(manager);
    vi.spyOn(manager as any, 'postMessagePromise').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  for (const mode of ['yolo', 'auto_edit']) {
    it(`renders a card instead of auto-approving in ${mode} mode`, () => {
      (manager as any).currentMode = mode;
      (manager as any).yoloMode = mode === 'yolo';

      emitEvent(manager, boundaryFrame());

      expect(agent.approveTool).not.toHaveBeenCalled();
      expect(agent.denyTool).not.toHaveBeenCalled();
      expect(emitConfirmationAdd).toHaveBeenCalledTimes(1);
    });

    it(`CONTROL: an ordinary info call IS auto-approved in ${mode} mode`, () => {
      (manager as any).currentMode = mode;
      (manager as any).yoloMode = mode === 'yolo';

      emitEvent(manager, infoFrame());

      expect(agent.approveTool).toHaveBeenCalledWith('call-info', 'once');
      expect(emitConfirmationAdd).not.toHaveBeenCalled();
    });
  }

  // Isolates the INDEX-keyed gate in BaseAgentManager.addConfirmation, which is
  // reachable on its own: `yoloMode` and `sessionMode` are independent fields,
  // so a session can carry yoloMode without currentMode === 'yolo'. That gate
  // picks options[0] by position — on this card, the grant itself — so own
  // option values give it no protection at all.
  it('is not auto-confirmed by the index-keyed yolo gate when sessionMode is not yolo', () => {
    (manager as any).currentMode = 'default';
    (manager as any).yoloMode = true;

    emitEvent(manager, boundaryFrame());

    expect(emitConfirmationAdd).toHaveBeenCalledTimes(1);
    expect(agent.approveTool).not.toHaveBeenCalled();
    expect(agent.denyTool).not.toHaveBeenCalled();
  });

  it('CONTROL: the index-keyed yolo gate DOES auto-confirm an ordinary card', async () => {
    vi.useFakeTimers();
    (manager as any).currentMode = 'default';
    (manager as any).yoloMode = true;
    const confirmSpy = vi.spyOn(manager, 'confirm').mockImplementation(() => undefined as never);

    emitEvent(manager, infoFrame());
    await vi.advanceTimersByTimeAsync(100);

    expect(emitConfirmationAdd).not.toHaveBeenCalled();
    expect(confirmSpy).toHaveBeenCalled();
    // options[0] — picked by POSITION, which is the whole hazard.
    expect(confirmSpy.mock.calls[0][2]).toBe('proceed_once');
    vi.useRealTimers();
  });

  it('builds the card with its own option values, the grant first, and no allow-once', () => {
    emitEvent(manager, boundaryFrame());

    const card = emitConfirmationAdd.mock.calls[0][0] as {
      action?: string;
      options: Array<{ value: string; params?: Record<string, string> }>;
    };

    expect(card.options.map((o) => o.value)).toEqual([PATH_BOUNDARY_GRANT_FOLDER, PATH_BOUNDARY_DENY]);
    // The grant is options[0] because it is the PRIMARY action: Core cannot
    // resolve a boundary with a one-shot approval, so there is no allow-once.
    expect(card.options[0].value).toBe(PATH_BOUNDARY_GRANT_FOLDER);
    expect(card.options.map((o) => o.value)).not.toContain('proceed_once');
    expect(card.options.map((o) => o.value)).not.toContain('proceed_always');
    // No `action`: the approval store is category-keyed and cannot say WHICH
    // folder, so there is no key it would be honest to store or replay.
    expect(card.action).toBeUndefined();
    // The button carries the root it opens, so the label and the grant are one value.
    expect(card.options[0].params?.folder).toBe(ROOT);
  });

  it('CONTROL: an ordinary card still gets proceed_once / proceed_always / cancel and an action', () => {
    emitEvent(manager, infoFrame());

    const card = emitConfirmationAdd.mock.calls[0][0] as { action?: string; options: Array<{ value: string }> };
    expect(card.options.map((o) => o.value)).toEqual(['proceed_once', 'proceed_always', 'cancel']);
    expect(card.action).toBe('info');
  });
});

describe('#1099 granting sends ApprovalScope::AlwaysPath', () => {
  let manager: WCoreManager;
  let agent: FakeAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = createManager();
    agent = attachAgent(manager);
    vi.spyOn(manager as any, 'postMessagePromise').mockResolvedValue(undefined);
    emitEvent(manager, boundaryFrame());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the folder root read-only, not the target file and never write', () => {
    manager.confirm('call-boundary', 'call-boundary', PATH_BOUNDARY_GRANT_FOLDER);

    expect(agent.approveTool).toHaveBeenCalledTimes(1);
    const [callId, scope] = agent.approveTool.mock.calls[0];
    expect(callId).toBe('call-boundary');
    expect(scope).toEqual({ always_path: { root: ROOT, write: false } });
    // The grant opens the CONTAINING FOLDER. Granting `target` would be a
    // button that lies about its own scope in the other direction.
    expect((scope as any).always_path.root).not.toBe(TARGET);
    expect(agent.denyTool).not.toHaveBeenCalled();
  });

  it('serialises to the externally-tagged wire form wayland-core deserialises', () => {
    manager.confirm('call-boundary', 'call-boundary', PATH_BOUNDARY_GRANT_FOLDER);

    const [, scope] = agent.approveTool.mock.calls[0];
    expect(JSON.parse(JSON.stringify({ type: 'tool_approve', call_id: 'call-boundary', scope }))).toEqual({
      type: 'tool_approve',
      call_id: 'call-boundary',
      scope: { always_path: { root: ROOT, write: false } },
    });
  });

  it('denies the tool call outright when the folder is refused', () => {
    manager.confirm('call-boundary', 'call-boundary', PATH_BOUNDARY_DENY);

    expect(agent.denyTool).toHaveBeenCalledTimes(1);
    expect(agent.denyTool.mock.calls[0][0]).toBe('call-boundary');
    expect(agent.approveTool).not.toHaveBeenCalled();
  });

  it('CONTROL: an ordinary approval still sends the bare `once` string scope', () => {
    vi.clearAllMocks();
    emitEvent(manager, infoFrame());
    manager.confirm('call-info', 'call-info', 'proceed_once');

    expect(agent.approveTool).toHaveBeenCalledWith('call-info', 'once', undefined);
  });
});
