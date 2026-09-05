/**
 * GAP-8: WCoreManager Multi EventBus Emission - Black-box tests
 *
 * Tests based on GAP-8-plan.md acceptance criteria.
 * Validates that WCoreManager emits events to teamEventBus and
 * channelEventBus in addition to ipcBridge, matching AcpAgentManager pattern.
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
  mockAddOrUpdateMessage,
  mockMainError,
  mockMainLog,
} = vi.hoisted(() => ({
  emitResponseStream: vi.fn(),
  emitConfirmationAdd: vi.fn(),
  emitConfirmationUpdate: vi.fn(),
  emitConfirmationRemove: vi.fn(),
  mockAddOrUpdateMessage: vi.fn(),
  mockMainError: vi.fn(),
  mockMainLog: vi.fn(),
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
  addOrUpdateMessage: mockAddOrUpdateMessage,
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
  mainError: mockMainError,
  mainLog: mockMainLog,
  mainWarn: vi.fn(),
}));

vi.mock('@process/services/cron/cronServiceSingleton', () => ({
  cronService: {
    addJob: vi.fn(async () => ({ id: 'cron-1', name: 'test', enabled: true })),
    removeJob: vi.fn(async () => {}),
    listJobsByConversation: vi.fn(async () => []),
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

// ── Helpers ────────────────────────────────────────────────────────

const CONV_ID = 'conv-eb-1';
const FALLBACK_DELAY_MS = 15_000;

function createManager(conversationId = CONV_ID): WCoreManager {
  const data = {
    workspace: '/test/workspace',
    model: { name: 'test-provider', useModel: 'test-model', baseUrl: '', platform: 'test' },
    conversation_id: conversationId,
  };
  return new WCoreManager(data as any, data.model as any);
}

function emitEvent(manager: WCoreManager, event: Record<string, unknown>) {
  (manager as any).emit('wcore.message', event);
}

function findIpcEmissions(type: string) {
  return emitResponseStream.mock.calls.filter(([e]: [{ type: string }]) => e.type === type).map(([e]: [any]) => e);
}

function findTeamEmissions() {
  return mockTeamEventBusEmit.mock.calls;
}

function findChannelEmissions() {
  return mockChannelEmitAgentMessage.mock.calls;
}

// ── Tests ──────────────────────────────────────────────────────────

describe('GAP-8: WCoreManager Multi EventBus Emission', () => {
  let manager: WCoreManager;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    manager = createManager();
    vi.spyOn(manager as any, 'postMessagePromise').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ── AC-1: channelEventBus receives all main pipeline events ─────

  describe('AC-1: channelEventBus receives all main pipeline events', () => {
    it('emits content event to channelEventBus', () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'content', data: 'hello world', msg_id: 'msg-1' });

      const channelCalls = findChannelEmissions();
      const contentCalls = channelCalls.filter(([, data]: [string, any]) => data.type === 'content');
      expect(contentCalls.length).toBeGreaterThanOrEqual(1);

      const [convId, payload] = contentCalls[0];
      expect(convId).toBe(CONV_ID);
      expect(payload.conversation_id).toBe(CONV_ID);
    });

    it('emits finish event to channelEventBus', () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'finish', data: '', msg_id: 'msg-1' });

      const channelCalls = findChannelEmissions();
      const finishCalls = channelCalls.filter(([, data]: [string, any]) => data.type === 'finish');
      expect(finishCalls.length).toBeGreaterThanOrEqual(1);
    });

    it('emits tool_group event to channelEventBus', () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, {
        type: 'tool_group',
        data: [{ name: 'tool1', status: 'Running', callId: 'c1' }],
        msg_id: 'msg-1',
      });

      const channelCalls = findChannelEmissions();
      const toolCalls = channelCalls.filter(([, data]: [string, any]) => data.type === 'tool_group');
      expect(toolCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── AC-2: teamEventBus receives only terminal events ────────────

  describe('AC-2: teamEventBus receives only terminal events (finish/error)', () => {
    it('emits finish event to teamEventBus', () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'finish', data: '', msg_id: 'msg-1' });

      const teamCalls = findTeamEmissions();
      expect(teamCalls.length).toBeGreaterThanOrEqual(1);

      const [eventName, payload] = teamCalls.find(([, d]: [string, any]) => d.type === 'finish')!;
      expect(eventName).toBe('responseStream');
      expect(payload.conversation_id).toBe(CONV_ID);
    });

    it('emits error event to teamEventBus', () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'error', data: 'something failed', msg_id: 'msg-1' });

      const teamCalls = findTeamEmissions();
      const errorCalls = teamCalls.filter(([, data]: [string, any]) => data.type === 'error');
      expect(errorCalls.length).toBeGreaterThanOrEqual(1);
    });

    it('does NOT emit content event to teamEventBus', () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'content', data: 'hello', msg_id: 'msg-1' });

      const teamCalls = findTeamEmissions();
      const contentCalls = teamCalls.filter(([, data]: [string, any]) => data.type === 'content');
      expect(contentCalls).toHaveLength(0);
    });

    it('does NOT emit tool_group event to teamEventBus', () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, {
        type: 'tool_group',
        data: [{ name: 'tool1', status: 'Running', callId: 'c1' }],
        msg_id: 'msg-1',
      });

      const teamCalls = findTeamEmissions();
      const toolCalls = teamCalls.filter(([, data]: [string, any]) => data.type === 'tool_group');
      expect(toolCalls).toHaveLength(0);
    });
  });

  // ── AC-3: process exit finish emits to team + channel buses ──────

  describe('AC-3: process exit finish emits to teamEventBus and channelEventBus', () => {
    it('process exit finish emits to teamEventBus', () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'content', data: 'data', msg_id: 'msg-1' });

      (manager as Record<string, (...args: unknown[]) => void>)['handleProcessExit'](1, 'msg-1');

      const teamCalls = findTeamEmissions();
      const finishCalls = teamCalls.filter(([, data]: [string, any]) => data.type === 'finish');
      expect(finishCalls.length).toBeGreaterThanOrEqual(1);

      const [eventName, payload] = finishCalls[0];
      expect(eventName).toBe('responseStream');
      expect(payload.conversation_id).toBe(CONV_ID);
    });

    it('process exit finish emits to channelEventBus', () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'content', data: 'data', msg_id: 'msg-1' });

      (manager as Record<string, (...args: unknown[]) => void>)['handleProcessExit'](1, 'msg-1');

      const channelCalls = findChannelEmissions();
      const finishCalls = channelCalls.filter(([, data]: [string, any]) => data.type === 'finish');
      expect(finishCalls.length).toBeGreaterThanOrEqual(1);

      const [convId, payload] = finishCalls[0];
      expect(convId).toBe(CONV_ID);
      expect(payload.conversation_id).toBe(CONV_ID);
    });
  });

  // ── AC-4: thinking does NOT emit to team/channel buses ──────────

  describe('AC-4: thinking messages stay ipcBridge-only', () => {
    it('thinking event does NOT emit to teamEventBus', () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'thought', data: 'pondering...', msg_id: 'msg-1' });

      const teamCalls = findTeamEmissions();
      const thinkingCalls = teamCalls.filter(([, data]: [string, any]) => data.type === 'thinking');
      expect(thinkingCalls).toHaveLength(0);
    });

    it('thinking event does NOT emit to channelEventBus', () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'thought', data: 'pondering...', msg_id: 'msg-1' });

      const channelCalls = findChannelEmissions();
      const thinkingCalls = channelCalls.filter(([, data]: [string, any]) => data.type === 'thinking');
      expect(thinkingCalls).toHaveLength(0);
    });

    it('thinking still emits to ipcBridge', () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'thought', data: 'pondering...', msg_id: 'msg-1' });

      const thinkingEmissions = findIpcEmissions('thinking');
      expect(thinkingEmissions.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── AC-5: request_trace does NOT emit to team/channel buses ─────

  describe('AC-5: request_trace stays ipcBridge-only', () => {
    it('start event (request_trace) does NOT emit to teamEventBus', () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });

      const teamCalls = findTeamEmissions();
      const traceCalls = teamCalls.filter(([, data]: [string, any]) => data.type === 'request_trace');
      expect(traceCalls).toHaveLength(0);
    });

    it('start event (request_trace) does NOT emit to channelEventBus', () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });

      const channelCalls = findChannelEmissions();
      const traceCalls = channelCalls.filter(([, data]: [string, any]) => data.type === 'request_trace');
      expect(traceCalls).toHaveLength(0);
    });

    it('request_trace still emits to ipcBridge', () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });

      const traceEmissions = findIpcEmissions('request_trace');
      expect(traceEmissions).toHaveLength(1);
    });
  });

  // ── AC-6: cron system messages stay ipcBridge-only ──────────────

  describe('AC-6: cron system messages stay ipcBridge-only', () => {
    it('system messages from cron do NOT emit to teamEventBus', async () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'content', data: '[CRON_LIST]', msg_id: 'msg-1' });

      // Clear mocks to isolate cron emissions from prior events
      mockTeamEventBusEmit.mockClear();
      mockChannelEmitAgentMessage.mockClear();

      emitEvent(manager, { type: 'finish', data: '', msg_id: 'msg-1' });

      // Wait for async handleTurnEnd to process cron commands
      await vi.advanceTimersByTimeAsync(200);

      const teamCalls = findTeamEmissions();
      const systemCalls = teamCalls.filter(([, data]: [string, any]) => data.type === 'system');
      expect(systemCalls).toHaveLength(0);
    });

    it('system messages from cron do NOT emit to channelEventBus', async () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'content', data: '[CRON_LIST]', msg_id: 'msg-1' });

      // Clear to isolate cron emissions
      mockChannelEmitAgentMessage.mockClear();

      emitEvent(manager, { type: 'finish', data: '', msg_id: 'msg-1' });

      await vi.advanceTimersByTimeAsync(200);

      const channelCalls = findChannelEmissions();
      const systemCalls = channelCalls.filter(([, data]: [string, any]) => data.type === 'system');
      expect(systemCalls).toHaveLength(0);
    });
  });

  // ── AC-7: conversation_id is correctly attached ─────────────────

  describe('AC-7: conversation_id is correctly attached to payloads', () => {
    it('teamEventBus payload includes conversation_id', () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'finish', data: '', msg_id: 'msg-1' });

      const teamCalls = findTeamEmissions();
      const finishCall = teamCalls.find(([, d]: [string, any]) => d.type === 'finish');
      expect(finishCall).toBeDefined();
      expect(finishCall![1].conversation_id).toBe(CONV_ID);
    });

    it('channelEventBus receives conversation_id as first arg and in payload', () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'content', data: 'test', msg_id: 'msg-1' });

      const channelCalls = findChannelEmissions();
      const contentCall = channelCalls.find(([, d]: [string, any]) => d.type === 'content');
      expect(contentCall).toBeDefined();

      const [convIdArg, payload] = contentCall!;
      expect(convIdArg).toBe(CONV_ID);
      expect(payload.conversation_id).toBe(CONV_ID);
    });

    it('different conversation IDs are correctly propagated', () => {
      const manager2 = createManager('conv-eb-2');
      vi.spyOn(manager2 as any, 'postMessagePromise').mockResolvedValue(undefined);

      emitEvent(manager2, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager2, { type: 'finish', data: '', msg_id: 'msg-1' });

      const teamCalls = findTeamEmissions();
      const finishCall = teamCalls.find(([, d]: [string, any]) => d.conversation_id === 'conv-eb-2');
      expect(finishCall).toBeDefined();
      expect(finishCall![1].conversation_id).toBe('conv-eb-2');

      const channelCalls = findChannelEmissions();
      const channelFinish = channelCalls.find(([convId]: [string]) => convId === 'conv-eb-2');
      expect(channelFinish).toBeDefined();
    });
  });

  // ── #264: approval_required is pre-processed, never reaches transformMessage ─

  describe('#264: approval_required pre-processed by WCoreManager', () => {
    it('does NOT reach transformMessage as an unsupported type', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Non-empty msg_id is the bug condition: the event is stamped with the
      // active msg_id, so it survives the empty-msg_id guard and would fall
      // through to transformMessage's default branch on base.
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'approval_required', data: { callId: 'c1', reason: 'info' }, msg_id: 'msg-1' });

      const unsupportedWarn = warnSpy.mock.calls.find(
        ([msg]: [unknown]) => typeof msg === 'string' && msg.includes("Unsupported message type 'approval_required'")
      );
      expect(unsupportedWarn).toBeUndefined();

      // Consumed: not re-emitted to the renderer and not persisted as a message.
      expect(findIpcEmissions('approval_required')).toHaveLength(0);
      expect(mockAddOrUpdateMessage).not.toHaveBeenCalled();
    });

    it('interactive mode: quiet info (renderer confirmation gate owns it), NOT a loud error (#390)', () => {
      // Default (non-auto) mode. A non-info approval without a resume token is the
      // normal exec/mcp case: the renderer tool-confirmation gate prompts the user
      // and resumes the turn. The old build logged this as a loud mainError on
      // every exec approval, falsely reading as a dropped approval (#390).
      (manager as any).currentMode = 'default';
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, {
        type: 'approval_required',
        data: { callId: 'c1', reason: 'destructive_operation' },
        msg_id: 'msg-1',
      });

      const quiet = mockMainLog.mock.calls.find(
        ([, msg]: [unknown, unknown]) =>
          typeof msg === 'string' &&
          msg.includes("reason='destructive_operation'") &&
          msg.includes('renderer confirmation gate')
      );
      expect(quiet).toBeDefined();
      // It must NOT loud-error in interactive mode.
      const loud = mockMainError.mock.calls.find(
        ([, msg]: [unknown, unknown]) => typeof msg === 'string' && msg.includes("reason='destructive_operation'")
      );
      expect(loud).toBeUndefined();

      // Still consumed (handled by the renderer gate), not persisted.
      expect(findIpcEmissions('approval_required')).toHaveLength(0);
      expect(mockAddOrUpdateMessage).not.toHaveBeenCalled();
    });

    it('auto mode: loud error when a non-info approval cannot self-resume (real wedge, #264)', () => {
      // In Autopilot/Auto-Edit the engine was supposed to self-resolve but could
      // not (no resume token) and there is no HITL UI to fall back on, so the turn
      // can genuinely wedge — that stays a loud mainError.
      (manager as any).currentMode = 'yolo';
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, {
        type: 'approval_required',
        data: { callId: 'c1', reason: 'destructive_operation' },
        msg_id: 'msg-1',
      });

      const goneLoud = mockMainError.mock.calls.find(
        ([, msg]: [unknown, unknown]) =>
          typeof msg === 'string' && msg.includes("reason='destructive_operation'") && msg.includes('auto mode')
      );
      expect(goneLoud).toBeDefined();

      expect(findIpcEmissions('approval_required')).toHaveLength(0);
      expect(mockAddOrUpdateMessage).not.toHaveBeenCalled();
    });
  });

  // ── #264: auto-mode escalation through the existing Confirming gate ─
  //
  // A non-info `approval_required` that carries a resume token and arrives in an
  // auto mode is the wedge case: the engine could not self-resolve and there is
  // no dedicated HITL UI. We escalate it through the existing Confirming gate
  // (interactive) or loud-deny it (non-interactive), and route the card's
  // allow/deny back to the engine by resume_token via confirm().

  describe('#264: auto-mode escalation through the Confirming gate', () => {
    const PROCEED_ONCE = 'proceed_once'; // ToolConfirmationOutcome.ProceedOnce
    const CANCEL = 'cancel'; // ToolConfirmationOutcome.Cancel

    // Attach an agent whose approval calls are observable.
    function withAgent(m: WCoreManager) {
      const resumeApproval = vi.fn();
      const approveTool = vi.fn();
      const denyTool = vi.fn();
      (m as any).agent = { resumeApproval, approveTool, denyTool };
      return { resumeApproval, approveTool, denyTool };
    }

    // Drive a non-info approval_required with a resume token into `manager`.
    function escalate(m: WCoreManager, callId = 'c1', resumeToken = 'tok-1') {
      emitEvent(m, {
        type: 'approval_required',
        data: { callId, resumeToken, reason: 'destructive_operation' },
        msg_id: 'msg-1',
      });
    }

    it('interactive auto mode: escalates via the Confirming gate, does NOT auto-resume', () => {
      (manager as any).currentMode = 'yolo'; // user Autopilot: has a UI (yoloMode stays false)
      const { resumeApproval } = withAgent(manager);

      escalate(manager);

      // A card was synthesized for this callId with allow-once / deny options.
      const card = (manager as any).confirmations.find((c: any) => c.callId === 'c1');
      expect(card).toBeDefined();
      expect(card.title).toBe('messages.permissionRequest');
      expect(card.options.map((o: any) => o.value)).toEqual([PROCEED_ONCE, CANCEL]);
      // The resume token is parked for confirm() to pick up; not auto-resumed.
      expect((manager as any).pendingApprovalTokens.get('c1')).toBe('tok-1');
      expect(resumeApproval).not.toHaveBeenCalled();
    });

    it('confirm(allow) redirects to resumeApproval(true) and NOT approveTool/denyTool; clears the map (#264 a,e)', () => {
      (manager as any).currentMode = 'yolo';
      const { resumeApproval, approveTool, denyTool } = withAgent(manager);
      escalate(manager);

      manager.confirm('c1', 'c1', PROCEED_ONCE);

      expect(resumeApproval).toHaveBeenCalledWith('tok-1', true);
      expect(approveTool).not.toHaveBeenCalled();
      expect(denyTool).not.toHaveBeenCalled();
      // Map entry removed after resume: no leak, no stale reuse.
      expect((manager as any).pendingApprovalTokens.has('c1')).toBe(false);
    });

    it('confirm(deny) redirects to resumeApproval(false) (#264 d)', () => {
      (manager as any).currentMode = 'auto_edit';
      const { resumeApproval, approveTool, denyTool } = withAgent(manager);
      escalate(manager);

      manager.confirm('c1', 'c1', CANCEL);

      expect(resumeApproval).toHaveBeenCalledWith('tok-1', false);
      expect(approveTool).not.toHaveBeenCalled();
      expect(denyTool).not.toHaveBeenCalled();
    });

    it('confirm for a non-escalated callId leaves the approveTool/denyTool path byte-unchanged (#264 b)', () => {
      const { resumeApproval, approveTool } = withAgent(manager);
      // No escalation: the map is empty, so this is an ordinary tool_group approval.
      manager.confirm('m', 'other-call', PROCEED_ONCE);

      expect(approveTool).toHaveBeenCalledWith('other-call', 'once', undefined);
      expect(resumeApproval).not.toHaveBeenCalled();
    });

    it('interactive tool_group approval never escalates or double-prompts (#264 c)', () => {
      // Default (non-auto) mode: the renderer tool_group Confirming gate owns the
      // approval. No escalation card is synthesized and confirm() uses the normal
      // approveTool path — the callId is never in the map, so no double-drive.
      (manager as any).currentMode = 'default';
      const { resumeApproval, approveTool } = withAgent(manager);

      escalate(manager, 'tg-1', 'tok-tg');

      expect((manager as any).confirmations.some((c: any) => c.callId === 'tg-1')).toBe(false);
      expect((manager as any).pendingApprovalTokens.has('tg-1')).toBe(false);

      manager.confirm('tg-1', 'tg-1', PROCEED_ONCE);
      expect(approveTool).toHaveBeenCalledWith('tg-1', 'once', undefined);
      expect(resumeApproval).not.toHaveBeenCalled();
    });

    it('non-interactive (yoloMode) auto mode: auto-approves via resumeApproval(true), recorded, no card', () => {
      // A channel/cron spawn (yoloMode:true) is genuinely autonomous — there is no
      // user to prompt and it opted into full-auto. 0.11.15 restored the pre-#264
      // auto-approve here (the interim loud-deny broke legit yolo/cron egress):
      // resume(true), record via mainLog, and never synthesize a confirmation card.
      const data = {
        workspace: '/test/workspace',
        model: { name: 'test-provider', useModel: 'test-model', baseUrl: '', platform: 'test' },
        conversation_id: 'conv-yolo',
        sessionMode: 'yolo',
        yoloMode: true,
      };
      const m = new WCoreManager(data as any, data.model as any);
      vi.spyOn(m as any, 'postMessagePromise').mockResolvedValue(undefined);
      const { resumeApproval } = withAgent(m);

      escalate(m, 'cy', 'tok-y');

      expect(resumeApproval).toHaveBeenCalledWith('tok-y', true);
      // No confirmation card was created for a headless run.
      expect((m as any).confirmations.some((c: any) => c.callId === 'cy')).toBe(false);
      expect((m as any).pendingApprovalTokens.has('cy')).toBe(false);
      // And the auto-approval was recorded (mainLog, not a silent no-op).
      const recorded = mockMainLog.mock.calls.find(
        ([, msg]: [unknown, unknown]) =>
          typeof msg === 'string' && msg.includes("reason='destructive_operation'") && msg.includes('auto-approved')
      );
      expect(recorded).toBeDefined();
    });
  });

  // ── ipcBridge still receives all events (no regression) ─────────

  describe('Regression: ipcBridge still receives all events', () => {
    it('publishes exact-session MCP registration truth without the preview gate', () => {
      (manager as any).beginMcpSession([
        {
          serverId: 'tavily-id',
          serverName: 'tavily',
          runtimeName: 'tavily',
          canonicalName: 'tavily',
          definitionDigest: 'hmac-sha256:tavily',
          backend: 'wcore',
          transport: 'http',
          scope: 'conversation',
        },
      ]);
      (manager as any).publishMcpSessionServer('tavily');
      emitEvent(manager, {
        type: 'mcp_ready',
        data: { name: 'tavily', tools: ['tavily_search'] },
        msg_id: '',
      });

      const snapshots = findIpcEmissions('mcp_session_state');
      const latest = snapshots.at(-1)?.data;
      expect(latest).toMatchObject({
        conversationId: CONV_ID,
        backend: 'wcore',
        expectedServerNames: ['tavily'],
      });
      expect(latest.receipts['hmac-sha256:tavily']).toMatchObject({
        status: 'registered',
        serverId: 'tavily-id',
        generation: latest.generation,
        conversationId: CONV_ID,
        backend: 'wcore',
        transport: 'http',
        tools: ['tavily_search'],
      });
    });

    it('forwards every accepted Desktop v1 session-level authority event before the empty-msg-id guard', () => {
      for (const type of [
        'execution_policy',
        'workflow_started',
        'workflow_node_event',
        'workflow_finished',
        'anvil_receipt',
        'anvil_receipt_invalidated',
        'anvil_trust_changed',
        'mcp_ready',
        'mcp_failed',
      ]) {
        emitEvent(manager, { type, data: { evidence: type }, msg_id: '' });
        expect(findIpcEmissions(type)).toContainEqual({
          type,
          conversation_id: CONV_ID,
          msg_id: '',
          data: { evidence: type },
        });
      }
    });

    it.each(['default', 'auto_edit'])(
      'holds an unattended info resume token and denies it on expiry in %s',
      async (mode) => {
        vi.useFakeTimers();
        try {
          const resumeApproval = vi.fn();
          (manager as unknown as { agent: unknown; currentMode: string }).agent = { resumeApproval };
          (manager as unknown as { currentMode: string }).currentMode = mode;
          manager.setUnattendedHoldDeadlineMs(1000);
          emitEvent(manager, {
            type: 'approval_required',
            msg_id: '',
            data: { callId: 'info-hold', resumeToken: 'info-token', reason: 'info' },
          });
          expect(resumeApproval).not.toHaveBeenCalled();
          expect(manager.getConfirmations()).toHaveLength(1);
          await vi.advanceTimersByTimeAsync(1000);
          expect(resumeApproval).toHaveBeenCalledExactlyOnceWith('info-token', false);
          expect(manager.getConfirmations()).toHaveLength(0);
        } finally {
          manager.setUnattendedHoldDeadlineMs(undefined);
          vi.useRealTimers();
        }
      }
    );

    it('persists and re-emits a hidden main-process acceptance envelope for canonical replay', () => {
      emitEvent(manager, {
        type: 'anvil_receipt',
        msg_id: '',
        data: {
          type: 'anvil_receipt',
          receipt_id: 'receipt-1',
          event_id: 'receipt-event-1',
          origin: 'core/anvil',
          contract_version: '1.0',
          session_id: 'session-1',
          run_id: 'run-1',
          task_id: 'task-1',
          sequence: 0,
          artifact_digest: `sha256:${'a'.repeat(64)}`,
          gate_closure_digest: `sha256:${'b'.repeat(64)}`,
          receipt_body_digest: `sha256:${'c'.repeat(64)}`,
          desktop_trust_status: 'active',
        },
      });

      const accepted = findIpcEmissions('execution_evidence');
      expect(accepted).toHaveLength(1);
      expect(accepted[0].data).toMatchObject({
        acceptedBy: 'desktop-core-v1-consumer',
        event: { type: 'anvil_receipt', receipt_id: 'receipt-1' },
      });
      expect(mockAddOrUpdateMessage).toHaveBeenCalledWith(
        CONV_ID,
        expect.objectContaining({ type: 'execution_evidence', hidden: true }),
        'wcore'
      );
    });

    it('content events still go to ipcBridge', () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'content', data: 'hello', msg_id: 'msg-1' });

      const contentEmissions = findIpcEmissions('content');
      expect(contentEmissions.length).toBeGreaterThanOrEqual(1);
    });

    it('finish events still go to ipcBridge', () => {
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      emitEvent(manager, { type: 'finish', data: '', msg_id: 'msg-1' });

      const finishEmissions = findIpcEmissions('finish');
      expect(finishEmissions.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── A2: the engine's SYNTHESIZED companion frame is demoted by callId ──
  //
  // wayland-core v0.13.4's GatingProtocolWriter emits an `ApprovalRequired`
  // with an EMPTY resume_token after EVERY gated `ToolRequest`. On the wire
  // that frame is indistinguishable from a genuine un-resumable HITL suspend,
  // so the `#264` branch above shouted `turn may wedge` at ERROR on a turn
  // that was never wedged - 23 occurrences in one live log, every one of them
  // answered by the ordinary tool_group path 60-200ms later.
  //
  // The discriminator the engine did not give us: the companion always FOLLOWS
  // a `tool_request` for the SAME call_id, and Desktop has already seen that
  // call_id come through the Confirming gate. A genuinely un-actionable
  // tokenless approval has no such predecessor and stays LOUD.

  describe('A2: tokenless auto-mode approval_required is demoted only when a gate owns its callId', () => {
    function confirming(m: WCoreManager, callId: string) {
      emitEvent(m, {
        type: 'tool_group',
        data: [{ name: 'Read', status: 'Confirming', callId, description: 'read a file' }],
        msg_id: 'msg-1',
      });
    }

    function tokenlessApproval(m: WCoreManager, callId: string) {
      emitEvent(m, {
        type: 'approval_required',
        data: { callId, reason: 'destructive_operation' },
        msg_id: 'msg-1',
      });
    }

    function loudCalls() {
      return mockMainError.mock.calls.filter(
        ([, msg]: [unknown, unknown]) => typeof msg === 'string' && msg.includes('turn may wedge')
      );
    }

    function demotedCalls() {
      return mockMainLog.mock.calls.filter(
        ([, msg]: [unknown, unknown]) =>
          typeof msg === 'string' && msg.includes('tool_group approval gate already owns this call_id')
      );
    }

    it('correlated: a Confirming gate for the SAME callId demotes it to an info line', () => {
      (manager as unknown as { currentMode: string }).currentMode = 'yolo';
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      confirming(manager, 'c1');
      tokenlessApproval(manager, 'c1');

      expect(loudCalls()).toHaveLength(0);
      const demoted = demotedCalls();
      expect(demoted).toHaveLength(1);
      expect(demoted[0][1]).toContain("reason='destructive_operation'");
      expect(demoted[0][1]).toContain('c1');
      // The payload preview is kept: it is the only greppable evidence of the
      // mode divergence, and #714 requires the PREVIEW, never the raw payload.
      expect(demoted[0]).toHaveLength(3);
    });

    it('UNCORRELATED: a gate on a DIFFERENT callId does not demote (the known positive is the test above)', () => {
      (manager as unknown as { currentMode: string }).currentMode = 'yolo';
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      confirming(manager, 'c1');
      tokenlessApproval(manager, 'c2');

      expect(demotedCalls()).toHaveLength(0);
      expect(loudCalls()).toHaveLength(1);
    });

    it('the correlation set does not leak across turns, so a later turn goes loud again', () => {
      (manager as unknown as { currentMode: string }).currentMode = 'yolo';
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      confirming(manager, 'c1');
      emitEvent(manager, { type: 'finish', data: '', msg_id: 'msg-1' });

      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-2' });
      tokenlessApproval(manager, 'c1');

      expect(demotedCalls()).toHaveLength(0);
      expect(loudCalls()).toHaveLength(1);
    });

    it('interactive (non-auto) mode is untouched: still the quiet #390 line, never demoted or loud', () => {
      (manager as unknown as { currentMode: string }).currentMode = 'default';
      emitEvent(manager, { type: 'start', data: '', msg_id: 'msg-1' });
      confirming(manager, 'c1');
      tokenlessApproval(manager, 'c1');

      expect(loudCalls()).toHaveLength(0);
      expect(demotedCalls()).toHaveLength(0);
      const quiet = mockMainLog.mock.calls.find(
        ([, msg]: [unknown, unknown]) => typeof msg === 'string' && msg.includes('renderer confirmation gate')
      );
      expect(quiet).toBeDefined();
    });
  });
});
