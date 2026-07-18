/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import type { TMessage } from '@/common/chat/chatLib';
import { adaptAcpMessages, adaptWCoreMessages, projectExecution, type ExecutionSeed } from '@/common/execution';

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
    expect(result.lifecycle).toBe('waiting');
    expect(result.activities).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'tool-1', kind: 'tool', status: 'completed' })])
    );
    expect(result.mcp.status).toBe('unsupported');
    expect(result.integrity.status).toBe('valid');
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
