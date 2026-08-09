/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import { composeMessage, transformMessage, type TMessage } from '@/common/chat/chatLib';
import {
  adaptAcpMessages,
  adaptGeminiMessages,
  adaptWCoreMessages,
  projectExecution,
  selectCurrentExecutionMessages,
  type ExecutionSeed,
} from '@/common/execution';

const identity = { runId: 'run-1', turnId: 'turn-1', correlationId: 'corr-1' } as const;
const now = 1_000;
const baseSeed = {
  identity,
  scope: { workspaceId: 'workspace-1', host: 'desktop', trust: 'trusted', scheduled: false },
  requestedGovernance: { mode: 'ask', enforceability: 'advisory' },
} as const;

describe('execution backend adapters', () => {
  it('adapts WCore activity and plan into the canonical reducer', () => {
    const messages = [
      {
        id: 'plan-1',
        conversation_id: 'conversation-1',
        type: 'plan',
        content: {
          sessionId: 'session-1',
          entries: [{ content: 'Write report', status: 'completed', priority: 'high' }],
        },
        createdAt: now,
      },
      {
        id: 'activity-1',
        conversation_id: 'conversation-1',
        type: 'activity',
        content: {
          turnId: 'turn-1',
          status: 'done',
          nodes: [{ id: 'tool-1', kind: 'tool', name: 'write_file', status: 'done' }],
          perTurnCost: [{ turn: 1, model: 'gpt-test', provider: 'openai', costUsd: 0.1 }],
        },
        createdAt: now,
      },
    ] as TMessage[];
    const seed: ExecutionSeed = { ...baseSeed, actor: { backend: 'wcore', agentId: 'core' } };
    const result = projectExecution(seed, adaptWCoreMessages(messages, { identity, observedAt: now }), { now });
    expect(result.lifecycle).toBe('completed');
    expect(result.plan[0]).toMatchObject({ content: 'Write report', status: 'completed' });
    expect(result.activities[0]).toMatchObject({ id: 'tool-1', status: 'completed' });
    expect(result.cost.status).toBe('unavailable');
    expect(result.integrity.status).toBe('valid');
  });

  it('projects a persisted WCore cron trigger as canonical automation evidence', () => {
    const message = {
      id: 'cron-trigger-1',
      conversation_id: 'conversation-1',
      type: 'cron_trigger',
      content: { cronJobId: 'daily-report', cronJobName: 'Daily report', triggeredAt: now },
      createdAt: now,
    } as TMessage;
    const seed: ExecutionSeed = {
      ...baseSeed,
      actor: { backend: 'wcore', agentId: 'core' },
      scope: { ...baseSeed.scope, scheduled: true, surface: 'automation' },
    };
    const result = projectExecution(seed, adaptWCoreMessages([message], { identity, observedAt: now }), { now });

    expect(result.scope).toMatchObject({ scheduled: true, surface: 'automation' });
    expect(result.activities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'cron-trigger-1', kind: 'system', name: 'Scheduled run: Daily report' }),
      ])
    );
  });

  it('adapts ACP permissions and tools without claiming MCP support', () => {
    const messages = [
      {
        id: 'permission-1',
        conversation_id: 'conversation-1',
        type: 'acp_permission',
        content: {
          sessionId: 'session-1',
          options: [{ optionId: 'yes', name: 'Allow', kind: 'allow_once' }],
          toolCall: { toolCallId: 'tool-1', title: 'Run command', kind: 'execute' },
        },
        createdAt: now,
      },
      {
        id: 'tool-update-1',
        conversation_id: 'conversation-1',
        type: 'acp_tool_call',
        content: {
          sessionId: 'session-1',
          update: {
            sessionUpdate: 'tool_call',
            toolCallId: 'tool-1',
            status: 'completed',
            title: 'Run command',
            kind: 'execute',
          },
        },
        createdAt: now,
      },
    ] as TMessage[];
    const seed: ExecutionSeed = { ...baseSeed, actor: { backend: 'acp', agentId: 'codex' } };
    const result = projectExecution(seed, adaptAcpMessages(messages, { identity, observedAt: now }), { now });
    expect(result.lifecycle).toBe('completed');
    expect(result.activities).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'tool-1', kind: 'tool', status: 'completed' })])
    );
    expect(result.mcp.status).toBe('unsupported');
    expect(result.integrity.status).toBe('valid');
  });

  it('resumes ACP after permission and fails closed on a failed tool', () => {
    const messages = [
      {
        id: 'permission-1',
        conversation_id: 'conversation-1',
        type: 'acp_permission',
        content: {
          sessionId: 'session-1',
          options: [{ optionId: 'yes', name: 'Allow', kind: 'allow_once' }],
          toolCall: { toolCallId: 'tool-1', title: 'Run command', kind: 'execute' },
        },
        createdAt: now,
      },
      {
        id: 'tool-update-1',
        conversation_id: 'conversation-1',
        type: 'acp_tool_call',
        content: {
          sessionId: 'session-1',
          update: {
            sessionUpdate: 'tool_call',
            toolCallId: 'tool-1',
            status: 'failed',
            title: 'Run command',
            kind: 'execute',
          },
        },
        createdAt: now,
      },
    ] as TMessage[];
    const result = projectExecution(
      { ...baseSeed, actor: { backend: 'acp', agentId: 'codex' } },
      adaptAcpMessages(messages, { identity, observedAt: now }),
      { now }
    );
    expect(result.lifecycle).toBe('failed');
    expect(result.integrity.status).toBe('valid');
  });

  it('does not terminate an ACP session between multiple completed tools', () => {
    const tool = (id: string) =>
      ({
        id,
        conversation_id: 'conversation-1',
        type: 'acp_tool_call',
        content: {
          sessionId: 'session-1',
          update: {
            sessionUpdate: 'tool_call',
            toolCallId: id,
            status: 'completed',
            title: id,
            kind: 'execute',
          },
        },
        createdAt: now,
      }) as TMessage;
    const result = projectExecution(
      { ...baseSeed, actor: { backend: 'acp', agentId: 'codex' } },
      adaptAcpMessages([tool('tool-1'), tool('tool-2')], { identity, observedAt: now }),
      { now }
    );
    expect(result.lifecycle).toBe('completed');
    expect(result.activities).toHaveLength(2);
    expect(result.integrity.status).toBe('valid');
  });

  it('routes Gemini through its explicit canonical adapter', () => {
    const message = {
      id: 'activity-gemini',
      conversation_id: 'conversation-1',
      type: 'activity',
      content: { turnId: 'turn-1', status: 'done', nodes: [] },
      createdAt: now,
    } as TMessage;
    const result = projectExecution(
      { ...baseSeed, actor: { backend: 'gemini', agentId: 'gemini' } },
      adaptGeminiMessages([message], { identity, observedAt: now }),
      { now }
    );
    expect(result.lifecycle).toBe('completed');
    expect(result.integrity.status).toBe('valid');
  });

  it('selects only the current run instead of replaying terminal history', () => {
    const messages = [
      {
        id: 'old',
        conversation_id: 'conversation-1',
        type: 'activity',
        content: { turnId: 'old-turn', status: 'done', nodes: [] },
      },
      {
        id: 'plan-current',
        conversation_id: 'conversation-1',
        type: 'plan',
        content: { sessionId: 'current', entries: [] },
      },
      {
        id: 'current',
        conversation_id: 'conversation-1',
        type: 'activity',
        content: { turnId: 'turn-1', status: 'running', nodes: [] },
      },
    ] as TMessage[];
    expect(selectCurrentExecutionMessages('wcore', messages).map((message) => message.id)).toEqual([
      'plan-current',
      'current',
    ]);
  });

  it('uses the ACP user-turn boundary when one session spans an old completed tool and a current plan', () => {
    const messages = [
      {
        id: 'old-user',
        conversation_id: 'conversation-1',
        type: 'text',
        position: 'right',
        content: { content: 'Finish the old task' },
      },
      {
        id: 'old-plan',
        msg_id: 'old-plan',
        conversation_id: 'conversation-1',
        type: 'plan',
        content: {
          sessionId: 'reused-session',
          entries: [{ content: 'Historical plan', status: 'completed', priority: 'high' }],
        },
      },
      {
        id: 'old-completed-tool',
        conversation_id: 'conversation-1',
        type: 'acp_tool_call',
        content: {
          sessionId: 'reused-session',
          update: {
            sessionUpdate: 'tool_call',
            toolCallId: 'old-tool',
            status: 'completed',
            title: 'Old tool',
            kind: 'execute',
          },
        },
      },
      {
        id: 'current-user',
        conversation_id: 'conversation-1',
        type: 'text',
        position: 'right',
        content: { content: 'Start the new task' },
      },
      {
        id: 'current-plan',
        msg_id: 'current-plan',
        conversation_id: 'conversation-1',
        type: 'plan',
        content: {
          sessionId: 'reused-session',
          entries: [{ content: 'Current turn only', status: 'in_progress', priority: 'high' }],
        },
      },
    ] as TMessage[];

    const composed = messages.reduce<TMessage[]>((list, message) => composeMessage(message, list), []);
    expect(composed.filter((message) => message.type === 'plan').map((message) => message.id)).toEqual([
      'old-plan',
      'current-plan',
    ]);
    expect(selectCurrentExecutionMessages('acp', composed).map((message) => message.id)).toEqual(['current-plan']);
  });

  // Message order taken from a live profile DB: WCore turns persist as
  // text:right -> tool_group... with no `activity` rows at all. Historically a
  // merge bug destroyed the user's row, leaving conversations with no turn
  // boundary; the generic tail fallback then returned a single tool_group, so
  // Progress and Observability showed one step out of eleven.
  it('keeps the whole WCore run when the user turn boundary is present', () => {
    const messages = [
      { id: 'old-user', conversation_id: 'c1', type: 'text', position: 'right', content: { content: 'Earlier' } },
      { id: 'old-tg', msg_id: 'turn-A', conversation_id: 'c1', type: 'tool_group', content: [{ callId: 'x' }] },
      { id: 'user', conversation_id: 'c1', type: 'text', position: 'right', content: { content: 'Do the thing' } },
      { id: 'tg-1', msg_id: 'turn-B', conversation_id: 'c1', type: 'tool_group', content: [{ callId: 'a' }] },
      { id: 'tg-2', msg_id: 'turn-B', conversation_id: 'c1', type: 'tool_group', content: [{ callId: 'b' }] },
      { id: 'tg-3', msg_id: 'turn-B', conversation_id: 'c1', type: 'tool_group', content: [{ callId: 'c' }] },
    ] as TMessage[];

    // The current turn in full, and none of the completed turn before it.
    expect(selectCurrentExecutionMessages('wcore', messages).map((message) => message.id)).toEqual([
      'tg-1',
      'tg-2',
      'tg-3',
    ]);
  });

  // A receipt can land after the last tool group. It carries a synthetic
  // `execution-evidence:<key>` msg_id, so picking the turn from the last
  // message full stop would select the receipt's key and match nothing else -
  // emptying the panel exactly where this fallback is meant to fill it.
  it('does not let a trailing evidence message hijack the recovered turn', () => {
    const messages = [
      { id: 'reply', conversation_id: 'c1', type: 'text', position: 'left', content: { content: 'Done' } },
      { id: 'tg-1', msg_id: 'turn-B', conversation_id: 'c1', type: 'tool_group', content: [{ callId: 'a' }] },
      { id: 'tg-2', msg_id: 'turn-B', conversation_id: 'c1', type: 'tool_group', content: [{ callId: 'b' }] },
      {
        id: 'ev',
        msg_id: 'execution-evidence:anvil:1',
        conversation_id: 'c1',
        type: 'execution_evidence',
        content: { acceptedBy: 'desktop-core-v1-consumer', event: { type: 'anvil_receipt' } },
      },
    ] as TMessage[];

    expect(selectCurrentExecutionMessages('wcore', messages).map((message) => message.id)).toEqual(['tg-1', 'tg-2']);
  });

  // With no turn id anywhere there is no boundary at all. Showing the tail is
  // incomplete but bounded; showing everything would replay finished turns.
  it('fails closed to the tail when nothing carries a turn id', () => {
    const messages = [
      { id: 'reply', conversation_id: 'c1', type: 'text', position: 'left', content: { content: 'Done' } },
      { id: 'tg-1', conversation_id: 'c1', type: 'tool_group', content: [{ callId: 'a' }] },
      { id: 'tg-2', conversation_id: 'c1', type: 'tool_group', content: [{ callId: 'b' }] },
    ] as TMessage[];

    expect(selectCurrentExecutionMessages('wcore', messages).map((message) => message.id)).toEqual(['tg-2']);
  });

  // Conversations corrupted by the user-bubble merge bug have no `text:right`
  // at all. WCore stamps every message of a turn with the turn id in `msg_id`,
  // so the turn is still recoverable - and MUST be used, or the panel replays
  // completed historical turns. Both cross-audit legs reproduced that replay
  // against an earlier "just return everything" fallback.
  it('recovers the WCore turn from msg_id when no user boundary survives', () => {
    const messages = [
      { id: 'reply', conversation_id: 'c1', type: 'text', position: 'left', content: { content: 'Done' } },
      { id: 'old-1', msg_id: 'turn-A', conversation_id: 'c1', type: 'tool_group', content: [{ callId: 'a' }] },
      { id: 'old-2', msg_id: 'turn-A', conversation_id: 'c1', type: 'tool_group', content: [{ callId: 'b' }] },
      { id: 'cur-1', msg_id: 'turn-B', conversation_id: 'c1', type: 'tool_group', content: [{ callId: 'c' }] },
      { id: 'cur-2', msg_id: 'turn-B', conversation_id: 'c1', type: 'tool_group', content: [{ callId: 'd' }] },
      { id: 'cur-3', msg_id: 'turn-B', conversation_id: 'c1', type: 'tool_group', content: [{ callId: 'e' }] },
    ] as TMessage[];

    // The whole current turn, and none of the completed one before it.
    expect(selectCurrentExecutionMessages('wcore', messages).map((message) => message.id)).toEqual([
      'cur-1',
      'cur-2',
      'cur-3',
    ]);
  });

  it('does not promote a WCore MCP display record into canonical MCP authority', () => {
    const message = {
      id: 'group-1',
      conversation_id: 'conversation-1',
      type: 'tool_group',
      content: [
        {
          callId: 'mcp-1',
          description: 'Search the web',
          name: 'search',
          renderOutputAsMarkdown: true,
          status: 'Success',
          confirmationDetails: {
            type: 'mcp',
            title: 'Search',
            toolName: 'search',
            toolDisplayName: 'Search',
            serverName: 'example',
          },
        },
      ],
      createdAt: now,
    } as TMessage;
    const seed: ExecutionSeed = { ...baseSeed, actor: { backend: 'wcore', agentId: 'core' } };
    const result = projectExecution(seed, adaptWCoreMessages([message], { identity, observedAt: now }), { now });
    expect(result.activities[0].kind).toBe('system');
    expect(result.mcp).toEqual({ status: 'unsupported', reason: 'versioned M1M evidence unavailable' });
  });
});

/**
 * K-03 - a wcore turn never reached `lifecycle: 'completed'`. Observed live: the
 * assistant had fully answered, the summary rail still read data-lifecycle
 * ="running", and the elapsed timer climbed past 4632 seconds.
 *
 * The suite above already asserted `completed` from an activity card written
 * `{ status: 'done', nodes: [{ status: 'done' }] }` by hand - a shape the wcore
 * pipeline cannot produce. That fabricated fixture is exactly what let the bug
 * ship green, so every card below is built by REPLAYING RAW ENGINE FRAMES
 * through the real production pipeline (`transformMessage` -> `composeMessage`,
 * the same two functions WCoreManager and the renderer use). Nothing here
 * hand-writes a node or card status.
 */
describe('K-03: a finished WCore turn reaches a terminal lifecycle', () => {
  type Frame = { type: string; data: unknown; msg_id: string };

  /** Replay raw stream frames exactly as WCoreManager/the renderer fold them. */
  const replay = (frames: readonly Frame[]): TMessage[] => {
    let list: TMessage[] = [];
    for (const frame of frames) {
      const message = transformMessage({ ...frame, conversation_id: 'conversation-1' } as IResponseMessage);
      if (message) list = composeMessage({ ...message, createdAt: now } as TMessage, list);
    }
    return list;
  };

  const toolFrame = (callId: string, status: string): Frame => ({
    type: 'tool_group',
    msg_id: 'turn-1',
    data: [{ callId, name: 'run_shell_command', description: 'ls', status }],
  });

  /** The zero-node cost card wcore force-forwards at the end of EVERY turn. */
  const costFrame: Frame = {
    type: 'session_cost',
    msg_id: 'turn-1',
    data: { perTurn: [{ turn: 1, model: 'gpt-test', provider: 'openai', cost_usd: 0.02 }] },
  };

  /** The turn-end verdict synthesized from the engine's `stream_end`. */
  const turnEndFrame = (outcome: 'done' | 'failed' = 'done'): Frame => ({
    type: 'activity_turn_end',
    msg_id: 'turn-1',
    data: { outcome },
  });

  const project = (messages: readonly TMessage[]) => {
    const seed: ExecutionSeed = { ...baseSeed, actor: { backend: 'wcore', agentId: 'core' } };
    return projectExecution(seed, adaptWCoreMessages(messages, { identity, observedAt: now }), { now });
  };

  it('completes a turn whose only activity card is the zero-node session_cost card', () => {
    // The live repro. The cost card has no nodes, `rollUpStatus` therefore calls
    // it 'running' forever, and its mere existence used to disable the tool-only
    // settlement fallback - so nothing could ever settle the turn.
    const messages = replay([toolFrame('call-1', 'Success'), costFrame]);
    const card = messages.find((message) => message.type === 'activity');
    expect(card).toBeDefined();
    expect((card as Extract<TMessage, { type: 'activity' }>).content.nodes).toHaveLength(0);

    expect(project(messages).lifecycle).toBe('completed');
  });

  it('completes a turn whose steps exist only as tool_chunk-born activity nodes', () => {
    // Defect 2: `tool_chunk` mints a node as 'running' and no production event
    // ever completes it, so the card was pinned 'running' by its own nodes too.
    const streaming = replay([
      { type: 'tool_chunk', msg_id: 'turn-1', data: { callId: 'call-1', toolName: 'Bash', chunk: 'hello\n' } },
      costFrame,
    ]);
    expect(project(streaming).lifecycle).toBe('running');

    const finished = replay([
      { type: 'tool_chunk', msg_id: 'turn-1', data: { callId: 'call-1', toolName: 'Bash', chunk: 'hello\n' } },
      costFrame,
      turnEndFrame(),
    ]);
    const result = project(finished);
    expect(result.lifecycle).toBe('completed');
    expect(result.activities).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'call-1', status: 'completed' })])
    );
  });

  it('marks the turn failed when the engine died mid-turn', () => {
    const messages = replay([
      { type: 'tool_chunk', msg_id: 'turn-1', data: { callId: 'call-1', toolName: 'Bash', chunk: 'partial' } },
      turnEndFrame('failed'),
    ]);
    expect(project(messages).lifecycle).toBe('failed');
  });

  it('leaves a turn that is still in flight running (anti-overshoot)', () => {
    // Settling a live turn is worse than the bug it fixes. Two independent
    // in-flight signals, each of which must hold the rail on `running`.
    const executingTool = replay([toolFrame('call-1', 'Executing'), costFrame]);
    expect(project(executingTool).lifecycle).toBe('running');

    const streamingStep = replay([
      toolFrame('call-1', 'Success'),
      { type: 'tool_chunk', msg_id: 'turn-1', data: { callId: 'call-2', toolName: 'Bash', chunk: 'still going' } },
      costFrame,
    ]);
    expect(project(streamingStep).lifecycle).toBe('running');

    // And a turn with no observable work at all cannot be settled either.
    expect(project([]).lifecycle).toBe('queued');
  });

  it('keeps every tool of the turn when the card settles before them in the window', () => {
    // The card is created at the FIRST observability frame, so it can be
    // persisted ahead of tools that run later in the same turn. The reducer
    // drops every non-lifecycle event after a terminal one, so settling inline
    // with the card deleted those tools and marked the projection invalid.
    const messages = replay([
      { type: 'tool_chunk', msg_id: 'turn-1', data: { callId: 'call-1', toolName: 'Bash', chunk: 'a' } },
      toolFrame('call-2', 'Success'),
      turnEndFrame(),
    ]);
    const result = project(messages);
    expect(result.lifecycle).toBe('completed');
    expect(result.activities.map((activity) => activity.id).sort()).toEqual(['call-1', 'call-2']);
    expect(result.integrity.status).toBe('valid');
  });

  it('stays settled when session_cost lands after the turn ended', () => {
    // Real ordering: WCoreManager force-forwards `session_cost` AFTER the stream
    // finishes, stamped with the last turn's msg_id.
    const messages = replay([toolFrame('call-1', 'Success'), turnEndFrame(), costFrame]);
    expect(project(messages).lifecycle).toBe('completed');
  });
});
