/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import type { ActivityNode, IMessageActivity, IMessageToolGroup, TMessage } from '../../src/common/chat/chatLib';
import { projectRunSnapshot } from '../../src/common/chat/activity/runProjection';

const RUN = { conversationId: 'conversation-1', turnId: 'turn-1', sessionId: 'session-1' } as const;

const base = (over: Partial<TMessage> & Pick<TMessage, 'type' | 'content'>): TMessage =>
  ({
    id: `id-${Math.random()}`,
    msg_id: 'turn-1',
    conversation_id: 'conversation-1',
    ...over,
  }) as TMessage;

const activity = (
  nodes: ActivityNode[],
  status: IMessageActivity['content']['status'] = 'running',
  over: Partial<IMessageActivity['content']> = {}
): TMessage =>
  base({
    type: 'activity',
    content: {
      turnId: 'turn-1',
      nodes,
      status,
      ...over,
    },
  });

const toolGroup = (
  callId: string,
  status: IMessageToolGroup['content'][number]['status'],
  over: Partial<IMessageToolGroup['content'][number]> = {}
): TMessage =>
  base({
    type: 'tool_group',
    content: [
      {
        callId,
        name: 'Read',
        description: '',
        renderOutputAsMarkdown: false,
        status,
        ...over,
      },
    ],
  });

const circuit = (detail: string, status: ActivityNode['status']): ActivityNode => ({
  id: 'provider-a',
  kind: 'circuit',
  name: 'provider-a',
  detail,
  status,
});

describe('projectRunSnapshot', () => {
  it('projects plan, current activity, artifacts, sources, route facts, and observed cost without inventing usage', () => {
    const snapshot = projectRunSnapshot(RUN, [
      base({
        type: 'plan',
        content: {
          sessionId: 'session-1',
          entries: [
            { content: 'Research', status: 'completed' },
            { content: 'Write report', status: 'in_progress', priority: 'high' },
            { content: 'Review', status: 'pending' },
          ],
        },
      }),
      toolGroup('edit-1', 'Success', {
        name: 'Edit',
        resultDisplay: { fileDiff: '+answer', fileName: '/workspace/report.md' },
        confirmationDetails: {
          type: 'info',
          title: 'Research',
          prompt: 'Read source',
          urls: ['https://example.com/report'],
        },
      }),
      activity(
        [
          {
            id: 'web-1',
            callId: 'web-1',
            kind: 'tool',
            name: 'web_search',
            status: 'running',
            sources: [{ title: 'Example', url: 'https://example.com/report' }],
          },
          {
            id: 'provider-a',
            kind: 'circuit',
            name: 'provider-a',
            status: 'done',
            detail: 'degraded -> provider-b',
          },
        ],
        'running',
        { perTurnCost: [{ turn: 1, model: 'model-a', provider: 'provider-a', costUsd: 0.0125 }] }
      ),
    ]);

    expect(snapshot.status).toBe('running');
    expect(snapshot.currentStep).toMatchObject({ id: 'wcore:web-1', status: 'running', source: 'wcore' });
    expect(snapshot.progress).toMatchObject({
      availability: 'available',
      completed: 1,
      total: 3,
      ratio: 1 / 3,
      current: { label: 'Write report', status: 'in_progress', priority: 'high' },
    });
    expect(snapshot.outputs).toEqual([
      expect.objectContaining({ kind: 'diff', path: '/workspace/report.md', source: 'wcore' }),
    ]);
    expect(snapshot.context).toEqual([expect.objectContaining({ kind: 'url', value: 'https://example.com/report' })]);
    expect(snapshot.routeFacts).toEqual([
      expect.objectContaining({ provider: 'provider-a', detail: 'degraded -> provider-b' }),
    ]);
    expect(snapshot.cost).toMatchObject({
      availability: 'available',
      authority: 'chat_activity_only',
      amountUsd: 0.0125,
    });
    expect(snapshot.usage).toEqual({ availability: 'unavailable' });
    expect(snapshot.integrity.state).toBe('valid');
  });

  it('accepts WCore, ACP, Codex, and Gemini tool activity into the same canonical shape', () => {
    const snapshot = projectRunSnapshot(RUN, [
      toolGroup('wcore-1', 'Executing', { name: 'Bash' }),
      base({
        type: 'acp_tool_call',
        content: {
          sessionId: 'session-1',
          update: {
            sessionUpdate: 'tool_call',
            toolCallId: 'acp-1',
            status: 'in_progress',
            title: 'Bash',
            kind: 'execute',
          },
        },
      }),
      base({
        type: 'codex_tool_call',
        content: {
          toolCallId: 'codex-1',
          status: 'executing',
          title: 'Bash',
          kind: 'execute',
          subtype: 'generic',
        },
      }),
      base({
        type: 'tool_call',
        content: { callId: 'gemini-1', name: 'Bash', args: {} },
      }),
    ]);

    expect(
      snapshot.activity.map(({ id, kind, status, glyph, source }) => ({ id, kind, status, glyph, source }))
    ).toEqual([
      { id: 'wcore:wcore-1', kind: 'tool', status: 'running', glyph: 'command', source: 'wcore' },
      { id: 'acp:acp-1', kind: 'tool', status: 'running', glyph: 'command', source: 'acp' },
      { id: 'codex:codex-1', kind: 'tool', status: 'running', glyph: 'command', source: 'codex' },
      { id: 'gemini:gemini-1', kind: 'tool', status: 'running', glyph: 'command', source: 'gemini' },
    ]);
    expect(snapshot.status).toBe('running');
  });

  it('projects backend-issued pending permissions and ignores malformed identity', () => {
    const snapshot = projectRunSnapshot(RUN, [
      base({
        type: 'acp_permission',
        content: {
          sessionId: 'session-1',
          options: [],
          toolCall: { toolCallId: 'approval-1', title: 'Run tests', kind: 'execute' },
        },
      }),
      base({
        type: 'codex_permission',
        content: {
          subtype: 'exec_approval_request',
          requestId: 'approval-2',
          title: 'Use shell',
          options: [],
          data: { call_id: 'call-2', command: ['npm', 'test'], cwd: '/workspace', reason: null },
        },
      }),
      base({
        type: 'acp_permission',
        content: { sessionId: 'session-1', options: [], toolCall: { toolCallId: '' } },
      }),
    ]);

    expect(snapshot.pendingPermissions).toEqual([
      { id: 'approval-1', title: 'Run tests', kind: 'execute', source: 'acp' },
      { id: 'approval-2', title: 'Use shell', kind: 'exec_approval_request', source: 'codex' },
    ]);
    expect(snapshot.status).toBe('running');
    expect(snapshot.integrity.issues).toContainEqual(expect.objectContaining({ code: 'missing_permission_identity' }));
  });

  it('clears a transient permission only when a later canonical tool update resolves the same call', () => {
    const snapshot = projectRunSnapshot(RUN, [
      base({
        type: 'acp_permission',
        content: {
          sessionId: 'session-1',
          options: [],
          toolCall: { toolCallId: 'approval-1', title: 'Run tests', kind: 'execute' },
        },
      }),
      base({
        type: 'acp_tool_call',
        content: {
          sessionId: 'session-1',
          update: {
            sessionUpdate: 'tool_call',
            toolCallId: 'approval-1',
            status: 'completed',
            title: 'Run tests',
            kind: 'execute',
          },
        },
      }),
    ]);

    expect(snapshot.pendingPermissions).toEqual([]);
    expect(snapshot.activity[0]).toMatchObject({ id: 'acp:approval-1', status: 'done', source: 'acp' });
  });

  it('fails closed on contradictory run terminals', () => {
    const snapshot = projectRunSnapshot(RUN, [
      base({ type: 'text', status: 'finish', content: { content: 'done' } }),
      base({ type: 'text', status: 'error', content: { content: 'failed' } }),
    ]);

    expect(snapshot.status).toBe('conflicted');
    expect(snapshot.integrity.issues).toContainEqual(expect.objectContaining({ code: 'terminal_conflict' }));
  });

  it('fails closed when terminal truth coexists with live activity', () => {
    const snapshot = projectRunSnapshot(RUN, [
      toolGroup('still-running', 'Executing'),
      base({ type: 'text', status: 'finish', content: { content: 'done' } }),
    ]);

    expect(snapshot.status).toBe('conflicted');
    expect(snapshot.integrity.issues).toContainEqual(
      expect.objectContaining({ code: 'terminal_with_running_activity' })
    );
  });

  it('does not mistake a persisted user-message status for agent terminal authority', () => {
    const snapshot = projectRunSnapshot(RUN, [
      base({ type: 'text', position: 'right', status: 'finish', content: { content: 'Please do the work' } }),
      toolGroup('running', 'Executing'),
    ]);

    expect(snapshot.status).toBe('running');
    expect(snapshot.integrity.state).toBe('valid');
  });

  it('fails closed and ignores an event for the same turn after terminal activity', () => {
    const snapshot = projectRunSnapshot(RUN, [
      activity([{ id: 'tool-1', kind: 'tool', name: 'Read', status: 'done' }], 'done'),
      activity([{ id: 'tool-2', kind: 'tool', name: 'Write', status: 'running' }], 'running'),
    ]);

    expect(snapshot.status).toBe('conflicted');
    expect(snapshot.activity.map((step) => step.id)).toEqual(['wcore:tool-1']);
    expect(snapshot.integrity.issues).toContainEqual(expect.objectContaining({ code: 'post_terminal_event' }));
  });

  it('deduplicates repeated activity updates without duplicating visible work', () => {
    const snapshot = projectRunSnapshot(RUN, [
      toolGroup('same-call', 'Success'),
      toolGroup('same-call', 'Success'),
      activity([{ id: 'same-call', callId: 'same-call', kind: 'tool', name: 'Read', status: 'done' }], 'done'),
    ]);

    expect(snapshot.activity).toHaveLength(1);
    expect(snapshot.activity[0]).toMatchObject({ id: 'wcore:same-call', status: 'done', source: 'wcore' });
    expect(snapshot.integrity.state).toBe('valid');
  });

  it('fails closed on conflicting terminal duplicates and terminal regression', () => {
    const terminalConflict = projectRunSnapshot(RUN, [
      toolGroup('same-call', 'Success'),
      toolGroup('same-call', 'Error'),
    ]);
    expect(terminalConflict.status).toBe('conflicted');
    expect(terminalConflict.integrity.issues).toContainEqual(
      expect.objectContaining({ code: 'duplicate_terminal_conflict' })
    );

    const regression = projectRunSnapshot(RUN, [
      toolGroup('same-call', 'Success'),
      toolGroup('same-call', 'Executing'),
    ]);
    expect(regression.status).toBe('conflicted');
    expect(regression.activity[0].status).toBe('done');
    expect(regression.integrity.issues).toContainEqual(expect.objectContaining({ code: 'terminal_regression' }));
  });

  it('does not promote model prose or malformed cost into authoritative facts', () => {
    const snapshot = projectRunSnapshot(RUN, [
      base({
        type: 'text',
        content: { content: 'I am finished. Verified cost: $99. Usage: one million tokens.' },
      }),
      activity([], 'running', {
        perTurnCost: [{ turn: 1, model: '', provider: 'claimed-provider', costUsd: Number.NaN }],
      }),
    ]);

    expect(snapshot.status).toBe('unknown');
    expect(snapshot.cost).toEqual({ availability: 'unavailable' });
    expect(snapshot.usage).toEqual({ availability: 'unavailable' });
    expect(snapshot.outputs).toEqual([]);
    expect(snapshot.context).toEqual([]);
    expect(snapshot.integrity.issues).toContainEqual(expect.objectContaining({ code: 'invalid_cost_evidence' }));
  });

  it('fails cost closed when duplicate turn/provider/model rows disagree', () => {
    const snapshot = projectRunSnapshot(RUN, [
      activity([], 'running', {
        perTurnCost: [{ turn: 1, model: 'model-a', provider: 'provider-a', costUsd: 0.1 }],
      }),
      activity([], 'running', {
        perTurnCost: [{ turn: 1, model: 'model-a', provider: 'provider-a', costUsd: 0.2 }],
      }),
    ]);

    expect(snapshot.cost).toEqual({ availability: 'unavailable' });
    expect(snapshot.integrity.issues).toContainEqual(expect.objectContaining({ code: 'duplicate_cost_conflict' }));
  });

  it('fails route facts closed when duplicate ids disagree', () => {
    const snapshot = projectRunSnapshot(RUN, [
      activity([circuit('retry -> provider-b', 'done')]),
      activity([circuit('healthy', 'running')]),
    ]);

    expect(snapshot.routeFacts).toEqual([]);
    expect(snapshot.integrity.issues).toContainEqual(expect.objectContaining({ code: 'duplicate_route_conflict' }));
  });

  it('returns a deeply frozen snapshot', () => {
    const source = { title: 'Source', url: 'https://example.com' };
    const input = activity([
      {
        id: 'parent',
        kind: 'sub_agent',
        name: 'researcher',
        status: 'running',
        children: [{ id: 'child', kind: 'tool', name: 'Read', status: 'done', sources: [source] }],
      },
    ]);
    const snapshot = projectRunSnapshot(RUN, [input]);

    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.activity)).toBe(true);
    expect(Object.isFrozen(snapshot.activity[0])).toBe(true);
    expect(Object.isFrozen(snapshot.activity[0].children)).toBe(true);
    expect(Object.isFrozen(snapshot.integrity.issues)).toBe(true);
    // Projection immutability must not mutate or freeze caller-owned evidence.
    expect(Object.isFrozen(input)).toBe(false);
    expect(Object.isFrozen(source)).toBe(false);
  });

  it('collects nested provider retry/fallback facts without parsing model prose', () => {
    const snapshot = projectRunSnapshot(RUN, [
      activity([
        {
          id: 'parent',
          kind: 'sub_agent',
          name: 'researcher',
          status: 'running',
          children: [
            {
              id: 'provider-a',
              kind: 'circuit',
              name: 'provider-a',
              status: 'done',
              detail: 'retry -> provider-b',
            },
          ],
        },
      ]),
    ]);

    expect(snapshot.routeFacts).toEqual([
      { id: 'provider-a', provider: 'provider-a', status: 'done', detail: 'retry -> provider-b' },
    ]);
  });

  it('rejects blank expected identity and cross-conversation, cross-turn, and cross-session evidence', () => {
    const invalid = projectRunSnapshot({ conversationId: ' ', turnId: 'turn-1' }, []);
    expect(invalid.status).toBe('conflicted');
    expect(invalid.integrity.issues).toContainEqual(expect.objectContaining({ code: 'invalid_run_identity' }));

    const snapshot = projectRunSnapshot(RUN, [
      base({ type: 'thinking', conversation_id: 'other', content: { content: 'foreign', status: 'thinking' } }),
      base({ type: 'thinking', msg_id: 'other-turn', content: { content: 'foreign', status: 'thinking' } }),
      base({
        type: 'plan',
        content: { sessionId: 'other-session', entries: [{ content: 'foreign', status: 'in_progress' }] },
      }),
    ]);

    expect(snapshot.status).toBe('conflicted');
    expect(snapshot.activity).toEqual([]);
    expect(snapshot.progress).toEqual({ availability: 'unavailable' });
    expect(snapshot.integrity.issues.filter((issue) => issue.code === 'cross_run_evidence')).toHaveLength(3);
  });

  it('applies the run terminal ledger to every later projection event type', () => {
    const snapshot = projectRunSnapshot(RUN, [
      base({ type: 'text', status: 'finish', content: { content: 'done' } }),
      toolGroup('late-tool', 'Success'),
      base({
        type: 'plan',
        content: { sessionId: 'session-1', entries: [{ content: 'late plan', status: 'in_progress' }] },
      }),
      base({
        type: 'acp_permission',
        content: {
          sessionId: 'session-1',
          options: [],
          toolCall: { toolCallId: 'late-permission', title: 'Late permission' },
        },
      }),
    ]);

    expect(snapshot.status).toBe('conflicted');
    expect(snapshot.activity).toEqual([]);
    expect(snapshot.pendingPermissions).toEqual([]);
    expect(snapshot.progress).toEqual({ availability: 'unavailable' });
    expect(snapshot.integrity.issues.filter((issue) => issue.code === 'post_terminal_event')).toHaveLength(3);
  });

  it('recursively merges children and fails closed on nested terminal conflict or regression', () => {
    const nested = (childStatus: ActivityNode['status']): TMessage =>
      activity([
        {
          id: 'parent',
          kind: 'sub_agent',
          name: 'worker',
          status: 'running',
          children: [{ id: 'child', kind: 'tool', name: 'Read', status: childStatus }],
        },
      ]);
    const regression = projectRunSnapshot(RUN, [nested('done'), nested('running')]);
    expect(regression.activity[0].children?.[0].status).toBe('done');
    expect(regression.integrity.issues).toContainEqual(expect.objectContaining({ code: 'terminal_regression' }));

    const conflict = projectRunSnapshot(RUN, [nested('done'), nested('failed')]);
    expect(conflict.activity[0].children?.[0].status).toBe('done');
    expect(conflict.integrity.issues).toContainEqual(expect.objectContaining({ code: 'duplicate_terminal_conflict' }));
  });

  it('marks proposed, in-progress, failed, and materialized outputs without overstating lifecycle', () => {
    const snapshot = projectRunSnapshot(RUN, [
      toolGroup('p', 'Pending', {
        resultDisplay: { fileDiff: '', fileName: '/proposed.md' },
      }),
      toolGroup('i', 'Executing', {
        resultDisplay: { fileDiff: '', fileName: '/working.md' },
      }),
      toolGroup('f', 'Error', {
        resultDisplay: { fileDiff: '', fileName: '/failed.md' },
      }),
      toolGroup('m', 'Success', {
        resultDisplay: { fileDiff: '', fileName: '/done.md' },
      }),
    ]);

    expect(snapshot.outputs.map(({ path, state }) => ({ path, state }))).toEqual([
      { path: '/proposed.md', state: 'proposed' },
      { path: '/working.md', state: 'in_progress' },
      { path: '/failed.md', state: 'failed' },
      { path: '/done.md', state: 'materialized' },
    ]);
  });

  it('validates complete cost rows, finite aggregation, and collision-safe tuple identity', () => {
    const invalid = projectRunSnapshot(RUN, [
      activity([], 'running', {
        perTurnCost: [
          { turn: 1.5, model: 'm', provider: 'p', costUsd: 1 },
          { turn: 1, model: ' ', provider: 'p', costUsd: 1 },
          { turn: 2, model: 'm', provider: ' ', costUsd: 1 },
        ],
      }),
    ]);
    expect(invalid.cost).toEqual({ availability: 'unavailable' });
    expect(invalid.integrity.issues.filter((issue) => issue.code === 'invalid_cost_evidence')).toHaveLength(3);

    const overflow = projectRunSnapshot(RUN, [
      activity([], 'running', {
        perTurnCost: [
          { turn: 1, model: 'm1', provider: 'p', costUsd: Number.MAX_VALUE },
          { turn: 2, model: 'm2', provider: 'p', costUsd: Number.MAX_VALUE },
        ],
      }),
    ]);
    expect(overflow.cost).toEqual({ availability: 'unavailable' });
    expect(overflow.integrity.issues).toContainEqual(expect.objectContaining({ code: 'cost_aggregation_overflow' }));

    const collisionSafe = projectRunSnapshot(RUN, [
      activity([], 'running', {
        perTurnCost: [
          { turn: 1, provider: 'a:b', model: 'c', costUsd: 1 },
          { turn: 1, provider: 'a', model: 'b:c', costUsd: 2 },
        ],
      }),
    ]);
    expect(collisionSafe.cost).toMatchObject({ availability: 'available', amountUsd: 3 });
  });

  it('keeps the permission ledger order-safe and fails conflicting metadata closed', () => {
    const resolvedFirst = projectRunSnapshot(RUN, [
      base({
        type: 'acp_tool_call',
        content: {
          sessionId: 'session-1',
          update: {
            sessionUpdate: 'tool_call',
            toolCallId: 'call-1',
            status: 'completed',
            title: 'Run',
            kind: 'execute',
          },
        },
      }),
      base({
        type: 'acp_permission',
        content: {
          sessionId: 'session-1',
          options: [],
          toolCall: { toolCallId: 'call-1', title: 'Run' },
        },
      }),
    ]);
    expect(resolvedFirst.pendingPermissions).toEqual([]);

    const pendingDoesNotResolve = projectRunSnapshot(RUN, [
      base({
        type: 'acp_tool_call',
        content: {
          sessionId: 'session-1',
          update: {
            sessionUpdate: 'tool_call',
            toolCallId: 'call-2',
            status: 'pending',
            title: 'Run',
            kind: 'execute',
          },
        },
      }),
      base({
        type: 'acp_permission',
        content: {
          sessionId: 'session-1',
          options: [],
          toolCall: { toolCallId: 'call-2', title: 'Run' },
        },
      }),
    ]);
    expect(pendingDoesNotResolve.pendingPermissions).toHaveLength(1);

    const conflicting = projectRunSnapshot(RUN, [
      base({
        type: 'acp_permission',
        content: {
          sessionId: 'session-1',
          options: [],
          toolCall: { toolCallId: 'call-3', title: 'First' },
        },
      }),
      base({
        type: 'acp_permission',
        content: {
          sessionId: 'session-1',
          options: [],
          toolCall: { toolCallId: 'call-3', title: 'Second' },
        },
      }),
    ]);
    expect(conflicting.pendingPermissions).toEqual([]);
    expect(conflicting.status).toBe('conflicted');
    expect(conflicting.integrity.issues).toContainEqual(expect.objectContaining({ code: 'permission_conflict' }));
  });

  it('prefers the running parent or deepest running descendant for current step', () => {
    const parentRunning = projectRunSnapshot(RUN, [
      activity([
        {
          id: 'parent',
          kind: 'sub_agent',
          name: 'worker',
          status: 'running',
          children: [{ id: 'done-child', kind: 'tool', name: 'Read', status: 'done' }],
        },
      ]),
    ]);
    expect(parentRunning.currentStep?.id).toBe('wcore:parent');

    const childRunning = projectRunSnapshot(RUN, [
      activity([
        {
          id: 'parent',
          kind: 'sub_agent',
          name: 'worker',
          status: 'running',
          children: [{ id: 'running-child', kind: 'tool', name: 'Read', status: 'running' }],
        },
      ]),
    ]);
    expect(childRunning.currentStep?.id).toBe('wcore:running-child');
  });

  it('fails a plan with multiple current items closed', () => {
    const snapshot = projectRunSnapshot(RUN, [
      base({
        type: 'plan',
        content: {
          sessionId: 'session-1',
          entries: [
            { content: 'One', status: 'in_progress' },
            { content: 'Two', status: 'in_progress' },
          ],
        },
      }),
    ]);
    expect(snapshot.progress).toEqual({ availability: 'unavailable' });
    expect(snapshot.status).toBe('conflicted');
    expect(snapshot.integrity.issues).toContainEqual(expect.objectContaining({ code: 'multiple_current_plan_items' }));
  });

  it('aggregates cross-source activity and output provenance deterministically', () => {
    const wcore = toolGroup('shared', 'Success', {
      resultDisplay: { fileDiff: '', fileName: '/shared.md' },
    });
    const acp = base({
      type: 'acp_tool_call',
      content: {
        sessionId: 'session-1',
        update: {
          sessionUpdate: 'tool_call',
          toolCallId: 'shared',
          status: 'completed',
          title: 'Edit',
          kind: 'edit',
          content: [{ type: 'diff', path: '/shared.md' }],
        },
      },
    });
    const forward = projectRunSnapshot(RUN, [wcore, acp]);
    const reverse = projectRunSnapshot(RUN, [acp, wcore]);

    expect(forward.activity.map(({ id, provenance }) => ({ id, provenance }))).toEqual([
      { id: 'wcore:shared', provenance: ['wcore'] },
      { id: 'acp:shared', provenance: ['acp'] },
    ]);
    expect(reverse.activity.map(({ id, provenance }) => ({ id, provenance }))).toEqual([
      { id: 'acp:shared', provenance: ['acp'] },
      { id: 'wcore:shared', provenance: ['wcore'] },
    ]);
    expect(forward.outputs.map(({ id, provenance }) => ({ id, provenance }))).toEqual([
      { id: 'wcore:diff:/shared.md', provenance: ['wcore'] },
      { id: 'acp:diff:/shared.md', provenance: ['acp'] },
    ]);
    expect(reverse.outputs.map(({ id, provenance }) => ({ id, provenance }))).toEqual([
      { id: 'acp:diff:/shared.md', provenance: ['acp'] },
      { id: 'wcore:diff:/shared.md', provenance: ['wcore'] },
    ]);
  });

  it('never freezes unknown caller-owned nested source fields', () => {
    const unknown = { nested: { private: true } };
    const source = { title: 'Source', url: 'https://example.com', unknown } as never;
    const input = activity([{ id: 'read', kind: 'tool', name: 'Read', status: 'running', sources: [source] }]);
    const snapshot = projectRunSnapshot(RUN, [input]);

    expect(snapshot.activity[0].sources?.[0]).not.toHaveProperty('unknown');
    expect(Object.isFrozen(unknown)).toBe(false);
    expect(Object.isFrozen(unknown.nested)).toBe(false);
  });

  it('bounds hostile activity depth and node count without recursing or crashing', () => {
    let deep: ActivityNode = { id: 'depth-17', kind: 'tool', name: 'Read', status: 'running' };
    for (let index = 16; index >= 1; index -= 1) {
      deep = { id: `depth-${index}`, kind: 'sub_agent', name: 'worker', status: 'running', children: [deep] };
    }
    const tooDeep = projectRunSnapshot(RUN, [activity([deep])]);
    expect(tooDeep.activity).toEqual([]);
    expect(tooDeep.integrity.issues).toContainEqual(expect.objectContaining({ code: 'activity_depth_exceeded' }));

    const nodes = Array.from(
      { length: 2049 },
      (_, index): ActivityNode => ({
        id: `node-${index}`,
        kind: 'tool',
        name: 'Read',
        status: 'running',
      })
    );
    const tooMany = projectRunSnapshot(RUN, [activity(nodes)]);
    expect(tooMany.activity).toEqual([]);
    expect(tooMany.integrity.issues).toContainEqual(expect.objectContaining({ code: 'activity_node_limit_exceeded' }));
  });

  it('rejects blank evidence identities instead of manufacturing merge keys', () => {
    const snapshot = projectRunSnapshot(RUN, [
      base({ type: 'thinking', msg_id: ' ', content: { content: 'blank', status: 'thinking' } }),
      activity([{ id: ' ', kind: 'tool', name: 'Read', status: 'running' }]),
    ]);
    expect(snapshot.activity).toEqual([]);
    expect(snapshot.status).toBe('conflicted');
    expect(snapshot.integrity.issues.filter((issue) => issue.code === 'blank_identity')).toHaveLength(2);
  });

  it('requires explicit turn proof even when session identity matches', () => {
    const snapshot = projectRunSnapshot(RUN, [
      base({
        type: 'plan',
        msg_id: undefined,
        content: { sessionId: 'session-1', entries: [{ content: 'Unscoped', status: 'in_progress' }] },
      }),
    ]);
    expect(snapshot.status).toBe('conflicted');
    expect(snapshot.progress).toEqual({ availability: 'unavailable' });
    expect(snapshot.integrity.issues).toContainEqual(expect.objectContaining({ code: 'cross_run_evidence' }));
  });

  it('keeps output lifecycle source-scoped, monotonic, and fail-closed', () => {
    const output = (callId: string, status: IMessageToolGroup['content'][number]['status']): TMessage =>
      toolGroup(callId, status, { resultDisplay: { fileDiff: '', fileName: '/same.md' } });

    const regression = projectRunSnapshot(RUN, [output('first', 'Success'), output('second', 'Executing')]);
    expect(regression.outputs).toEqual([expect.objectContaining({ id: 'wcore:diff:/same.md', state: 'materialized' })]);
    expect(regression.status).toBe('conflicted');
    expect(regression.integrity.issues).toContainEqual(
      expect.objectContaining({ code: 'output_lifecycle_regression' })
    );

    const conflict = projectRunSnapshot(RUN, [output('first', 'Success'), output('second', 'Error')]);
    expect(conflict.outputs).toEqual([expect.objectContaining({ id: 'wcore:diff:/same.md', state: 'materialized' })]);
    expect(conflict.integrity.issues).toContainEqual(expect.objectContaining({ code: 'output_lifecycle_conflict' }));
  });

  it('rejects a blank original ACP tool id before the display normalizer can synthesize one', () => {
    const snapshot = projectRunSnapshot(RUN, [
      base({
        type: 'acp_tool_call',
        content: {
          sessionId: 'session-1',
          update: {
            sessionUpdate: 'tool_call',
            toolCallId: '',
            status: 'in_progress',
            title: 'Would be synthesized',
            kind: 'execute',
          },
        },
      }),
    ]);
    expect(snapshot.activity).toEqual([]);
    expect(snapshot.status).toBe('conflicted');
    expect(snapshot.integrity.issues).toContainEqual(expect.objectContaining({ code: 'blank_identity' }));
  });

  it('enforces complete message, reference, plan, source, and sub-agent wrapper limits', () => {
    const messages = Array.from({ length: 4097 }, () =>
      base({ type: 'text', position: 'right', content: { content: 'bounded' } })
    );
    expect(projectRunSnapshot(RUN, messages).integrity.issues).toContainEqual(
      expect.objectContaining({ code: 'message_limit_exceeded' })
    );

    const urls = Array.from({ length: 2049 }, (_, index) => `https://example.com/${index}`);
    const references = projectRunSnapshot(RUN, [
      toolGroup('refs', 'Success', {
        confirmationDetails: { type: 'info', title: 'Sources', prompt: 'Use sources', urls },
      }),
    ]);
    expect(references.context).toEqual([]);
    expect(references.integrity.issues).toContainEqual(expect.objectContaining({ code: 'reference_limit_exceeded' }));

    const entries = Array.from({ length: 513 }, (_, index) => ({
      content: `Item ${index}`,
      status: 'pending' as const,
    }));
    const plan = projectRunSnapshot(RUN, [base({ type: 'plan', content: { sessionId: 'session-1', entries } })]);
    expect(plan.progress).toEqual({ availability: 'unavailable' });
    expect(plan.integrity.issues).toContainEqual(expect.objectContaining({ code: 'plan_entry_limit_exceeded' }));

    const sources = Array.from({ length: 2049 }, (_, index) => ({
      title: `Source ${index}`,
      url: `https://example.com/source/${index}`,
    }));
    const sourceLimit = projectRunSnapshot(RUN, [
      activity([{ id: 'source-heavy', kind: 'tool', name: 'Search', status: 'running', sources }]),
    ]);
    expect(sourceLimit.activity).toEqual([]);
    expect(sourceLimit.integrity.issues).toContainEqual(expect.objectContaining({ code: 'source_limit_exceeded' }));

    let child: ActivityNode = { id: 'child-16', kind: 'tool', name: 'Read', status: 'running' };
    for (let index = 15; index >= 1; index -= 1) {
      child = { id: `child-${index}`, kind: 'sub_agent', name: 'worker', status: 'running', children: [child] };
    }
    const wrapperDepth = projectRunSnapshot(RUN, [
      base({
        type: 'sub_agent',
        content: { parentCallId: 'wrapper', agentName: 'root', status: 'running', body: '', nodes: [child] },
      }),
    ]);
    expect(wrapperDepth.activity).toEqual([]);
    expect(wrapperDepth.integrity.issues).toContainEqual(expect.objectContaining({ code: 'activity_depth_exceeded' }));

    const toolArray = Array.from({ length: 2049 }, (_, index) => ({
      callId: `tool-${index}`,
      name: 'Read',
      description: '',
      renderOutputAsMarkdown: false,
      status: 'Executing' as const,
    }));
    const toolLimit = projectRunSnapshot(RUN, [base({ type: 'tool_group', content: toolArray })]);
    expect(toolLimit.activity).toEqual([]);
    expect(toolLimit.integrity.issues).toContainEqual(
      expect.objectContaining({ code: 'activity_node_limit_exceeded' })
    );
  });

  it('deduplicates an exact replayed terminal while rejecting a distinct late terminal', () => {
    const terminal = base({ type: 'text', status: 'finish', content: { content: 'done' } });
    const replay = { ...terminal, content: { ...terminal.content } } as TMessage;
    const accepted = projectRunSnapshot(RUN, [terminal, replay]);
    expect(accepted.status).toBe('done');
    expect(accepted.integrity.state).toBe('valid');

    const distinct = base({ type: 'text', status: 'finish', content: { content: 'done again' } });
    const rejected = projectRunSnapshot(RUN, [terminal, distinct]);
    expect(rejected.status).toBe('conflicted');
    expect(rejected.integrity.issues).toContainEqual(expect.objectContaining({ code: 'post_terminal_event' }));
  });

  it('chooses context title and provenance deterministically across backend order', () => {
    const wcore = activity([
      {
        id: 'search-wcore',
        kind: 'tool',
        name: 'Search',
        status: 'done',
        sources: [{ title: 'Zulu', url: 'https://example.com/shared' }],
      },
    ]);
    const codex = base({
      type: 'codex_tool_call',
      content: {
        toolCallId: 'search-codex',
        status: 'success',
        title: 'Search',
        kind: 'web_search',
        subtype: 'web_search_end',
        data: { results: [{ title: 'Alpha', url: 'https://example.com/shared' }] },
      },
    });
    const forward = projectRunSnapshot(RUN, [wcore, codex]);
    const reverse = projectRunSnapshot(RUN, [codex, wcore]);
    expect(forward.context).toEqual([
      expect.objectContaining({ title: 'Alpha', provenance: ['wcore', 'codex'], source: 'wcore' }),
    ]);
    expect(reverse.context).toEqual(forward.context);
  });

  it('deduplicates terminal activity with cyclic unknown metadata without serializing caller graphs', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic['self'] = cyclic;
    const node = {
      id: 'terminal-tool',
      kind: 'tool',
      name: 'Read',
      status: 'done',
      unknownMetadata: cyclic,
      sources: [{ title: 'Source', url: 'https://example.com', unknownMetadata: cyclic }],
    } as unknown as ActivityNode;
    const terminal = activity([node], 'done');
    const replay = {
      ...terminal,
      content: { ...(terminal as Extract<TMessage, { type: 'activity' }>).content },
    } as TMessage;

    expect(() => projectRunSnapshot(RUN, [terminal, replay])).not.toThrow();
    const snapshot = projectRunSnapshot(RUN, [terminal, replay]);
    expect(snapshot.status).toBe('done');
    expect(snapshot.integrity.state).toBe('valid');
    expect(snapshot.activity[0]).not.toHaveProperty('unknownMetadata');
    expect(Object.isFrozen(cyclic)).toBe(false);
  });

  it('pre-caps oversized ACP and Codex references without filter or Object.keys materialization', () => {
    const acpContent = Array.from({ length: 2049 }, (_, index) => ({
      type: 'diff' as const,
      path: `/acp-${index}.md`,
    }));
    Object.defineProperty(acpContent, 'filter', {
      value: () => {
        throw new Error('full-copy filter must not run');
      },
    });
    const acp = base({
      type: 'acp_tool_call',
      content: {
        sessionId: 'session-1',
        update: {
          sessionUpdate: 'tool_call',
          toolCallId: 'oversized-acp',
          status: 'completed',
          title: 'Edit',
          kind: 'edit',
          content: acpContent,
        },
      },
    });
    expect(() => projectRunSnapshot(RUN, [acp])).not.toThrow();
    const acpSnapshot = projectRunSnapshot(RUN, [acp]);
    expect(acpSnapshot.outputs).toEqual([]);
    expect(acpSnapshot.integrity.issues).toContainEqual(expect.objectContaining({ code: 'reference_limit_exceeded' }));

    const changes: Record<string, unknown> = {};
    for (let index = 0; index < 2049; index += 1) changes[`/codex-${index}.md`] = {};
    const codex = base({
      type: 'codex_tool_call',
      content: {
        toolCallId: 'oversized-codex',
        status: 'success',
        title: 'Patch',
        kind: 'patch',
        subtype: 'patch_apply_begin',
        data: { call_id: 'oversized-codex', changes },
      },
    });
    const originalKeys = Object.keys;
    Object.keys = (() => {
      throw new Error('Object.keys materialization must not run');
    }) as typeof Object.keys;
    let codexSnapshot;
    try {
      codexSnapshot = projectRunSnapshot(RUN, [codex]);
    } finally {
      Object.keys = originalKeys;
    }
    expect(codexSnapshot?.outputs).toEqual([]);
    expect(codexSnapshot?.integrity.issues).toContainEqual(
      expect.objectContaining({ code: 'reference_limit_exceeded' })
    );
  });

  it('fails cyclic cost turn evidence closed without preserving or coercing the caller object', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic['self'] = cyclic;
    const terminal = activity([], 'done', {
      perTurnCost: [{ turn: cyclic as unknown as number, model: 'model-a', provider: 'provider-a', costUsd: 1 }],
    });
    const replay = {
      ...terminal,
      content: { ...(terminal as Extract<TMessage, { type: 'activity' }>).content },
    } as TMessage;

    expect(() => projectRunSnapshot(RUN, [terminal, replay])).not.toThrow();
    const snapshot = projectRunSnapshot(RUN, [terminal, replay]);
    expect(snapshot.cost).toEqual({ availability: 'unavailable' });
    expect(snapshot.integrity.state).toBe('invalid');
    expect(snapshot.integrity.issues).toContainEqual(expect.objectContaining({ code: 'invalid_cost_evidence' }));
    expect(snapshot.integrity.issues).not.toContainEqual(expect.objectContaining({ code: 'post_terminal_event' }));
    expect(Object.isFrozen(cyclic)).toBe(false);
  });
});
