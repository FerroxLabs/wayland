/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #838 - what an agent reports when a turn ends.
 *
 * Gemini, NanoBot, OpenClaw and Remote never emitted `conversation.turn.completed`,
 * so those chats raised no completion banner and autonomous workflows on them
 * could not self-advance.
 *
 * The obvious fix - notify on every `finish` - is worse than the bug. Every
 * backend ends a turn with an identical bare `{ type: 'finish', data: null }`,
 * whether it succeeded, errored, was aborted, or never ran because the socket
 * dropped. A notify built from that carries the default
 * `state: 'ai_waiting_input'`, and WorkflowSessionService reads that as a step
 * that finished - marking a FAILED step done and advancing an AUTO run. Today
 * those runs stall and the 30-minute watchdog parks them, which is the safe
 * outcome, so the naive fix trades a slow correct result for a fast wrong one.
 *
 * Hence `onTurnEnd(outcome)`, reported out of band from `finish`. These tests
 * pin the outcome each path reports; `turnCompletionManagerGate.test.ts` pins
 * that only `'ok'` reaches the notifier. Together those are the end-to-end claim.
 *
 * The case worth keeping in mind is disconnect: `handleDisconnect` emits the
 * same `finish` as a clean turn while bypassing `handleEndTurn` entirely, so a
 * dropped socket is invisible to anything reading the message stream.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ChatEvent, EventFrame } from '../../src/process/agent/openclaw/types';
import type { TurnEndOutcome } from '../../src/common/types/acpTypes';

// ── Mocks shared by the two gateway transports ─────────────────────

const mockConnection = vi.hoisted(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  isConnected: true,
  sessionKey: 'session-1' as string | null,
  chatSend: vi.fn().mockResolvedValue(undefined),
  chatHistory: vi.fn().mockResolvedValue({ messages: [] }),
  sessionsResolve: vi.fn().mockResolvedValue({ key: 'session-1' }),
  sessionsReset: vi.fn().mockResolvedValue({ key: 'session-1' }),
}));

const capturedCallbacks = vi.hoisted(() => ({
  onClose: null as ((code: number, reason: string) => void) | null,
}));

const mockNanobotSend = vi.hoisted(() => vi.fn());

vi.mock('../../src/process/agent/openclaw/OpenClawGatewayConnection', () => ({
  OpenClawGatewayConnection: vi.fn().mockImplementation((opts: Record<string, unknown>) => {
    capturedCallbacks.onClose = opts.onClose as typeof capturedCallbacks.onClose;
    return mockConnection;
  }),
}));

vi.mock('../../src/process/agent/openclaw/OpenClawGatewayManager', () => ({
  OpenClawGatewayManager: vi.fn(),
}));

vi.mock('../../src/process/agent/openclaw/openclawConfig', () => ({
  getGatewayAuthPassword: vi.fn(),
  getGatewayAuthToken: vi.fn(),
  getGatewayPort: vi.fn().mockReturnValue(18789),
}));

vi.mock('../../src/process/agent/acp/AcpAdapter', () => ({
  AcpAdapter: class {
    resetMessageTracking = vi.fn();
    convertSessionUpdate = vi.fn(() => []);
  },
}));

vi.mock('../../src/process/agent/acp/ApprovalStore', () => ({
  AcpApprovalStore: class {
    clear = vi.fn();
  },
}));

vi.mock('../../src/common/chat/navigation', () => ({
  NavigationInterceptor: {
    isNavigationTool: vi.fn(() => false),
    extractUrl: vi.fn(() => null),
    createPreviewMessage: vi.fn(),
  },
}));

vi.mock('../../src/common/utils', () => {
  let counter = 0;
  return { uuid: () => `uuid-${++counter}` };
});

vi.mock('../../src/process/services/database', () => ({
  getDatabase: vi.fn().mockResolvedValue({ updateRemoteAgent: vi.fn() }),
}));

vi.mock('node:net', () => ({ default: { createConnection: vi.fn() } }));

vi.mock('../../src/process/agent/nanobot/NanobotConnection', () => ({
  NanobotConnection: class {
    sendMessage = mockNanobotSend;
    stop = vi.fn();
    kill = vi.fn();
  },
}));

import { OpenClawAgent } from '../../src/process/agent/openclaw/index';
import { RemoteAgentCore } from '../../src/process/agent/remote/RemoteAgentCore';
import { NanobotAgent } from '../../src/process/agent/nanobot/index';

// ── Helpers ────────────────────────────────────────────────────────

/** Both gateway transports dispatch chat events through a private handleEvent. */
function dispatchChatEvent(agent: object, chatEvent: ChatEvent): void {
  const frame: EventFrame = { type: 'event', event: 'chat.event', payload: chatEvent };
  (agent as { handleEvent: (evt: EventFrame) => void }).handleEvent(frame);
}

function chatEvent(state: string, overrides: Record<string, unknown> = {}): ChatEvent {
  return {
    runId: 'run-1',
    sessionKey: 'session-1',
    seq: 1,
    state,
    ...overrides,
  } as ChatEvent;
}

describe('OpenClawAgent reports how each turn ended (#838)', () => {
  let outcomes: TurnEndOutcome[];
  let agent: OpenClawAgent;

  beforeEach(async () => {
    outcomes = [];
    mockConnection.isConnected = true;
    mockConnection.sessionKey = 'session-1';
    agent = new OpenClawAgent({
      id: 'conv-1',
      workingDir: '/tmp/test',
      onStreamEvent: vi.fn(),
      onSignalEvent: vi.fn(),
      onTurnEnd: (outcome) => outcomes.push(outcome),
    });
    (agent as unknown as { connection: typeof mockConnection }).connection = mockConnection;
    await agent.sendMessage({ content: 'hello' });
  });

  it('reports ok when the turn completes normally', () => {
    dispatchChatEvent(agent, chatEvent('final', { message: { content: 'done' } }));
    expect(outcomes).toEqual(['ok']);
  });

  it('reports aborted, never ok, when the user stops the turn', () => {
    dispatchChatEvent(agent, chatEvent('aborted'));
    expect(outcomes).toEqual(['aborted']);
  });

  it('reports error, never ok, when the turn fails', () => {
    dispatchChatEvent(agent, chatEvent('error', { errorMessage: 'boom' }));
    expect(outcomes).toEqual(['error']);
  });

  it('reports nothing when the socket drops mid-turn', () => {
    // handleDisconnect emits the same bare `finish` as a clean turn while
    // bypassing handleEndTurn, so this is the path a message-stream reader
    // cannot tell apart from success.
    (agent as unknown as { handleDisconnect: (reason: string) => void }).handleDisconnect('socket closed');
    expect(outcomes).toEqual([]);
  });

  it('reports nothing for an end-of-turn arriving with no turn in flight', () => {
    dispatchChatEvent(agent, chatEvent('final', { message: { content: 'done' } }));
    outcomes.length = 0;
    // A duplicate or late final, e.g. after an app quit.
    dispatchChatEvent(agent, chatEvent('final', { message: { content: 'done' } }));
    expect(outcomes).toEqual([]);
  });
});

describe('RemoteAgentCore reports how each turn ended (#838)', () => {
  let outcomes: TurnEndOutcome[];
  let core: RemoteAgentCore;

  beforeEach(async () => {
    outcomes = [];
    mockConnection.isConnected = true;
    mockConnection.sessionKey = 'session-1';
    core = new RemoteAgentCore({
      conversationId: 'conv-1',
      remoteConfig: {
        id: 'agent-1',
        name: 'Test Agent',
        protocol: 'openclaw',
        url: 'wss://example.com',
        authType: 'bearer',
        authToken: 'tok',
        createdAt: 0,
        updatedAt: 0,
      },
      onStreamEvent: vi.fn(),
      onSignalEvent: vi.fn(),
      onSessionKeyUpdate: vi.fn(),
      onTurnEnd: (outcome) => outcomes.push(outcome),
    } as ConstructorParameters<typeof RemoteAgentCore>[0]);
    (core as unknown as { connection: typeof mockConnection }).connection = mockConnection;
    await core.sendMessage({ content: 'hello' });
  });

  it('reports ok when the turn completes normally', () => {
    dispatchChatEvent(core, chatEvent('final', { message: { content: 'done' } }));
    expect(outcomes).toEqual(['ok']);
  });

  it('reports aborted, never ok, when the user stops the turn', () => {
    dispatchChatEvent(core, chatEvent('aborted'));
    expect(outcomes).toEqual(['aborted']);
  });

  it('reports error, never ok, when the turn fails', () => {
    dispatchChatEvent(core, chatEvent('error', { errorMessage: 'boom' }));
    expect(outcomes).toEqual(['error']);
  });

  it('reports nothing when the socket drops mid-turn', () => {
    (core as unknown as { handleDisconnect: (reason: string) => void }).handleDisconnect('socket closed');
    expect(outcomes).toEqual([]);
  });

  it('reports nothing for a duplicate end-of-turn', () => {
    // Unlike OpenClaw, this transport's handleChatEvent has no turn-active
    // early return - it filters only on session. So the turn gate inside
    // handleEndTurn is the only thing stopping a repeated final from
    // reporting a second success.
    dispatchChatEvent(core, chatEvent('final', { message: { content: 'done' } }));
    outcomes.length = 0;
    dispatchChatEvent(core, chatEvent('final', { message: { content: 'done' } }));
    expect(outcomes).toEqual([]);
  });

  it('reports nothing when the send never reached the gateway', async () => {
    outcomes.length = 0;
    mockConnection.chatSend.mockRejectedValueOnce(new Error('offline'));
    await core.sendMessage({ content: 'hello again' });
    // A later unrelated end-of-turn must not be credited to the failed send.
    dispatchChatEvent(core, chatEvent('final', { message: { content: 'done' } }));
    expect(outcomes).toEqual([]);
  });
});

describe('NanobotAgent reports how each turn ended (#838)', () => {
  let outcomes: TurnEndOutcome[];
  let agent: NanobotAgent;

  beforeEach(() => {
    outcomes = [];
    mockNanobotSend.mockReset();
    agent = new NanobotAgent({
      id: 'conv-1',
      workingDir: '/tmp/test',
      onStreamEvent: vi.fn(),
      onSignalEvent: vi.fn(),
      onTurnEnd: (outcome) => outcomes.push(outcome),
    });
  });

  it('reports ok when the CLI returns a reply', async () => {
    mockNanobotSend.mockResolvedValue('a reply');
    await agent.sendMessage({ content: 'hello' });
    expect(outcomes).toEqual(['ok']);
  });

  it('reports error, never ok, when the CLI fails', async () => {
    // Nanobot emits `finish` on this path too, identical to the success one.
    mockNanobotSend.mockRejectedValue(new Error('nanobot not installed'));
    await agent.sendMessage({ content: 'hello' });
    expect(outcomes).toEqual(['error']);
  });
});
