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
  it('adapts persisted activity and plan messages into the canonical reducer', () => {
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
    const seed: ExecutionSeed = { ...baseSeed, actor: { backend: 'gemini', agentId: 'gemini' } };
    const result = projectExecution(seed, adaptGeminiMessages(messages, { identity, observedAt: now }), { now });
    expect(result.lifecycle).toBe('completed');
    expect(result.plan[0]).toMatchObject({ content: 'Write report', status: 'completed' });
    expect(result.activities[0]).toMatchObject({ id: 'tool-1', status: 'completed' });
    expect(result.cost.status).toBe('unavailable');
    expect(result.integrity.status).toBe('valid');
  });

  it('projects a persisted cron trigger as canonical automation evidence', () => {
    const message = {
      id: 'cron-trigger-1',
      conversation_id: 'conversation-1',
      type: 'cron_trigger',
      content: { cronJobId: 'daily-report', cronJobName: 'Daily report', triggeredAt: now },
      createdAt: now,
    } as TMessage;
    const seed: ExecutionSeed = {
      ...baseSeed,
      actor: { backend: 'gemini', agentId: 'gemini' },
      scope: { ...baseSeed.scope, scheduled: true, surface: 'automation' },
    };
    const result = projectExecution(seed, adaptGeminiMessages([message], { identity, observedAt: now }), { now });

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

  it('resumes ACP after permission; a failed tool is an activity, not a failed run', () => {
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
    expect(result.lifecycle).not.toBe('failed');
    expect(result.activities).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'tool-1', kind: 'tool', status: 'failed' })])
    );
    expect(result.integrity.status).toBe('valid');
  });

  describe("an ACP turn with a failed tool mid-run (Sean's Smart Trader chat, 2026-09-14)", () => {
    // Reconstructed from the conversation's persisted rows, in stored order:
    // the offloaded prompt read, then Fuigo's `read_file` of a staged skill
    // refused by the fs guard (#1376) - once by the real path, once relative -
    // while web searches and terminal reads carried on around it for minutes.
    const text = (id: string, content: string) =>
      ({
        id,
        conversation_id: 'ff8881cd',
        type: 'text',
        position: 'right',
        content: { content },
        createdAt: now,
      }) as TMessage;
    const thinking = (id: string) =>
      ({
        id,
        conversation_id: 'ff8881cd',
        type: 'thinking',
        position: 'left',
        content: { content: 'Let me understand the request', status: 'done' },
        createdAt: now,
      }) as TMessage;
    const tool = (id: string, status: 'pending' | 'in_progress' | 'completed' | 'failed', title: string) =>
      ({
        id,
        conversation_id: 'ff8881cd',
        type: 'acp_tool_call',
        position: 'left',
        content: { sessionId: '', update: { sessionUpdate: 'tool_call', toolCallId: id, status, title, kind: 'read' } },
        createdAt: now,
      }) as TMessage;
    const errorTip = (id: string) =>
      ({
        id,
        conversation_id: 'ff8881cd',
        type: 'tips',
        position: 'center',
        content: { content: 'Session expired', type: 'error' },
        createdAt: now,
      }) as TMessage;
    const refused =
      'Read `/Users/seandonahoe/.wayland/fuigo-temp-1789341140262/.wayland/skills/rebel-trader-rules/SKILL.md`';
    // What was on screen at 06:12:55: "Did 3 things: List · Reading SKILL.md · Searching the web".
    const midRun = [
      text('0b30b303', 'Do me a favor - I want to test an idea. A moving over cross over strategy…'),
      thinking('bba9c636'),
      tool('call_4e253f0cd2a64347b06b6551', 'completed', 'Read `…/prompts/prompt_0.txt`'),
      thinking('ef90b15a'),
      tool(
        'call_00_zwAEDzWr1zbxG65E4Bm41310',
        'completed',
        'List `/Users/seandonahoe/.wayland/fuigo-temp-1789341140262`'
      ),
      tool('call_01_2Ae5tDzg1A6bUBb4tNtC8142', 'failed', refused),
      tool('call_02_CN4NHuWL0nHfuKUrQBi02694', 'in_progress', 'Web search: "Hull moving average vs SMA EMA crossover"'),
    ];
    const wholeTurn = [
      ...midRun.slice(0, -1),
      tool('call_02_CN4NHuWL0nHfuKUrQBi02694', 'completed', 'Web search: "Hull moving average vs SMA EMA crossover"'),
      thinking('3a6e67e3'),
      tool('01a09d0c59f4e8d0f84caaf0f1239a58', 'failed', 'Read `.wayland/skills/rebel-trader-rules/SKILL.md`'),
      tool('01a09d0c5b8556aadfe4baee57d33a63', 'completed', 'Web search: "ADX regime filter moving average crossover"'),
      tool('01a09d0c5cd5629bd4a6512770b26a66', 'completed', 'Web search: "multi-timeframe trend confirmation EMA 200"'),
      thinking('e20ee63d'),
      tool('call_00_8nP7epZrVoh2YUFSsYWJ1889', 'completed', 'Execute `cat …/rebel-trader-rules/SKILL.md | head -200`'),
      tool('call_01_WyDbq4zpQsJhy7L1cU226139', 'completed', 'Execute `ls -la …/.wayland/skills/`'),
      tool('call_cb83d78a5d11480c84737ffb', 'completed', "Execute `cat …/SKILL.md | sed -n '200,500p'`"),
      tool(
        'call_05531183bd084ad7991f18ca',
        'completed',
        'Web search: "moving average crossover strategy backtest whipsaw"'
      ),
    ];
    const project = (messages: readonly TMessage[], turnActive?: boolean) =>
      projectExecution(
        { ...baseSeed, actor: { backend: 'acp', agentId: 'fuigo' } },
        adaptAcpMessages(selectCurrentExecutionMessages('acp', messages), { identity, observedAt: now, turnActive }),
        { now }
      );

    it('reads running, never failed, while the turn is still in flight', () => {
      const result = project(midRun, true);
      expect(result.lifecycle).toBe('running');
      // The tool after the refused read is still on the run, not dropped as post-terminal.
      expect(result.activities.map((activity) => [activity.id, activity.status])).toEqual([
        ['call_4e253f0cd2a64347b06b6551', 'completed'],
        ['call_00_zwAEDzWr1zbxG65E4Bm41310', 'completed'],
        ['call_01_2Ae5tDzg1A6bUBb4tNtC8142', 'failed'],
        ['call_02_CN4NHuWL0nHfuKUrQBi02694', 'running'],
      ]);
      expect(result.integrity.status).toBe('valid');
    });

    it('does not claim failed from the tool even without a turn signal', () => {
      expect(project(midRun).lifecycle).toBe('running');
      expect(project(wholeTurn).lifecycle).toBe('completed');
    });

    it('stays running through the whole turn while active, and completes when the turn ends cleanly', () => {
      const active = project(wholeTurn, true);
      expect(active.lifecycle).toBe('running');
      expect(active.activities).toHaveLength(11);

      const ended = project(wholeTurn, false);
      expect(ended.lifecycle).toBe('completed');
      expect(ended.activities).toHaveLength(11);
      expect(ended.integrity.status).toBe('valid');
    });

    it('fails only when a turn-level error is the last thing the turn did, and never while active', () => {
      const died = [...wholeTurn, errorTip('error_ff8881cd_1')];
      expect(project(died, false).lifecycle).toBe('failed');
      expect(project(died).lifecycle).toBe('failed');
      expect(project(died, true).lifecycle).toBe('running');

      // An error notice the turn then worked past is not the turn's verdict.
      const recovered = [...midRun.slice(0, 3), errorTip('notice'), ...wholeTurn.slice(3)];
      expect(project(recovered, false).lifecycle).toBe('completed');
    });
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
    expect(selectCurrentExecutionMessages('gemini', messages).map((message) => message.id)).toEqual([
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

  // With no user bubble and no `activity` rows there is no turn boundary at
  // all. Showing the tail is incomplete but bounded; showing everything would
  // replay finished turns.
  it('fails closed to the tail when nothing carries a turn id', () => {
    const messages = [
      { id: 'reply', conversation_id: 'c1', type: 'text', position: 'left', content: { content: 'Done' } },
      { id: 'tg-1', conversation_id: 'c1', type: 'tool_group', content: [{ callId: 'a' }] },
      { id: 'tg-2', conversation_id: 'c1', type: 'tool_group', content: [{ callId: 'b' }] },
    ] as TMessage[];

    expect(selectCurrentExecutionMessages('gemini', messages).map((message) => message.id)).toEqual(['tg-2']);
  });

  it('does not promote a Gemini MCP display record into canonical MCP authority', () => {
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
    const seed: ExecutionSeed = { ...baseSeed, actor: { backend: 'gemini', agentId: 'gemini' } };
    const result = projectExecution(seed, adaptGeminiMessages([message], { identity, observedAt: now }), { now });
    expect(result.activities[0].kind).toBe('system');
    expect(result.mcp).toEqual({ status: 'unsupported', reason: 'versioned M1M evidence unavailable' });
  });
});
