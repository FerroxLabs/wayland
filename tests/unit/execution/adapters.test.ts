/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { composeMessage, type TMessage } from '@/common/chat/chatLib';
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
      { id: 'user', conversation_id: 'c1', type: 'text', position: 'right', content: { content: 'Do the thing' } },
      { id: 'tg-1', conversation_id: 'c1', type: 'tool_group', content: [{ callId: 'a', name: 'ToolSearch' }] },
      { id: 'tg-2', conversation_id: 'c1', type: 'tool_group', content: [{ callId: 'b', name: 'Bash' }] },
      { id: 'tg-3', conversation_id: 'c1', type: 'tool_group', content: [{ callId: 'c', name: 'Bash' }] },
    ] as TMessage[];

    expect(selectCurrentExecutionMessages('wcore', messages).map((message) => message.id)).toEqual([
      'tg-1',
      'tg-2',
      'tg-3',
    ]);
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
