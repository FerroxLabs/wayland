/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  addOrUpdateNode,
  emptyActivityContent,
  mergeActivityContent,
  mergeNodeList,
  type ActivityContent,
  type ActivityEvent,
} from '../../src/common/chat/activityTree';
import type { ActivityNode } from '../../src/common/chat/chatLib';

const base = (): ActivityContent => emptyActivityContent('turn-1');

describe('activityTree.addOrUpdateNode', () => {
  it('creates a running tool node from a tool_request phase', () => {
    const c = addOrUpdateNode(base(), {
      kind: 'tool',
      callId: 'c1',
      name: 'ReadFile',
      phase: 'running',
      ts: 1000,
    });
    expect(c.nodes).toHaveLength(1);
    expect(c.nodes[0]).toMatchObject({ id: 'c1', kind: 'tool', name: 'ReadFile', status: 'running', startTime: 1000 });
    expect(c.nodes[0].endTime).toBeUndefined();
    expect(c.status).toBe('running');
  });

  it('merges tool lifecycle by callId (running -> done) and sets endTime', () => {
    let c = addOrUpdateNode(base(), { kind: 'tool', callId: 'c1', name: 'ReadFile', phase: 'running', ts: 1000 });
    c = addOrUpdateNode(c, { kind: 'tool', callId: 'c1', name: 'ReadFile', phase: 'done', ts: 1500, detail: 'ok' });
    expect(c.nodes).toHaveLength(1);
    expect(c.nodes[0]).toMatchObject({ status: 'done', startTime: 1000, endTime: 1500, detail: 'ok' });
    expect(c.status).toBe('done');
  });

  it('keeps the descriptive name when a later running update has a blank name', () => {
    let c = addOrUpdateNode(base(), { kind: 'tool', callId: 'c1', name: 'ReadFile', phase: 'running', ts: 1 });
    c = addOrUpdateNode(c, { kind: 'tool', callId: 'c1', name: '', phase: 'running', ts: 2 });
    expect(c.nodes[0].name).toBe('ReadFile');
  });

  it('accumulates tool_chunk stdout into the node detail', () => {
    let c = addOrUpdateNode(base(), { kind: 'tool', callId: 'c1', name: 'Bash', phase: 'running', ts: 1 });
    c = addOrUpdateNode(c, { kind: 'tool_chunk', callId: 'c1', chunk: 'line1\n', ts: 2 });
    c = addOrUpdateNode(c, { kind: 'tool_chunk', callId: 'c1', chunk: 'line2\n', ts: 3 });
    expect(c.nodes[0].detail).toBe('line1\nline2\n');
  });

  it('synthesizes a node when a tool_chunk arrives before the tool_request', () => {
    const c = addOrUpdateNode(base(), { kind: 'tool_chunk', callId: 'c9', name: 'Bash', chunk: 'early', ts: 5 });
    expect(c.nodes).toHaveLength(1);
    expect(c.nodes[0]).toMatchObject({ id: 'c9', status: 'running', detail: 'early' });
  });

  it('appends final tool result detail after streamed chunks', () => {
    let c = addOrUpdateNode(base(), { kind: 'tool', callId: 'c1', name: 'Bash', phase: 'running', ts: 1 });
    c = addOrUpdateNode(c, { kind: 'tool_chunk', callId: 'c1', chunk: 'partial ', ts: 2 });
    c = addOrUpdateNode(c, { kind: 'tool', callId: 'c1', name: 'Bash', phase: 'done', ts: 3, detail: 'final' });
    expect(c.nodes[0].detail).toBe('partial final');
    expect(c.nodes[0].status).toBe('done');
  });

  it('rolls status up to failed when any node failed and none running', () => {
    let c = addOrUpdateNode(base(), { kind: 'tool', callId: 'a', name: 'A', phase: 'done', ts: 1 });
    c = addOrUpdateNode(c, { kind: 'tool', callId: 'b', name: 'B', phase: 'failed', ts: 2 });
    expect(c.status).toBe('failed');
  });

  it('keeps status running while any node is still running', () => {
    let c = addOrUpdateNode(base(), { kind: 'tool', callId: 'a', name: 'A', phase: 'done', ts: 1 });
    c = addOrUpdateNode(c, { kind: 'tool', callId: 'b', name: 'B', phase: 'running', ts: 2 });
    expect(c.status).toBe('running');
  });

  it('attaches per-turn cost rows without adding a node', () => {
    const c = addOrUpdateNode(base(), {
      kind: 'cost',
      perTurn: [{ turn: 1, model: 'gpt-x', provider: 'openai', costUsd: 0.012 }],
    });
    expect(c.nodes).toHaveLength(0);
    expect(c.perTurnCost).toEqual([{ turn: 1, model: 'gpt-x', provider: 'openai', costUsd: 0.012 }]);
  });

  it('adds a circuit op-trail node', () => {
    const c = addOrUpdateNode(base(), {
      kind: 'circuit',
      id: 'anthropic',
      name: 'anthropic',
      detail: 'open -> openai',
      ts: 1,
    });
    expect(c.nodes[0]).toMatchObject({ id: 'anthropic', kind: 'circuit', status: 'done', detail: 'open -> openai' });
  });

  it('does not mutate the input content (immutability)', () => {
    const original = base();
    const next = addOrUpdateNode(original, { kind: 'tool', callId: 'c1', name: 'X', phase: 'running', ts: 1 });
    expect(original.nodes).toHaveLength(0);
    expect(next).not.toBe(original);
  });
});

describe('activityTree.mergeActivityContent', () => {
  const delta = (evt: ActivityEvent): ActivityContent => addOrUpdateNode(emptyActivityContent('turn-1'), evt);

  it('merges a fresh delta node into an empty accumulator', () => {
    const merged = mergeActivityContent(
      base(),
      delta({ kind: 'tool', callId: 'c1', name: 'A', phase: 'running', ts: 1 })
    );
    expect(merged.nodes).toHaveLength(1);
    expect(merged.status).toBe('running');
  });

  it('merges a tool_chunk delta into the existing node by callId', () => {
    let acc = mergeActivityContent(
      base(),
      delta({ kind: 'tool', callId: 'c1', name: 'Bash', phase: 'running', ts: 1 })
    );
    acc = mergeActivityContent(acc, delta({ kind: 'tool_chunk', callId: 'c1', chunk: 'out', ts: 2 }));
    expect(acc.nodes).toHaveLength(1);
    expect(acc.nodes[0].detail).toBe('out');
  });

  it('advances status to done when the terminal delta merges in', () => {
    let acc = mergeActivityContent(
      base(),
      delta({ kind: 'tool', callId: 'c1', name: 'Bash', phase: 'running', ts: 1 })
    );
    acc = mergeActivityContent(acc, delta({ kind: 'tool', callId: 'c1', name: 'Bash', phase: 'done', ts: 2 }));
    expect(acc.nodes[0].status).toBe('done');
    expect(acc.status).toBe('done');
  });

  it('carries per-turn cost through the merge', () => {
    const acc = mergeActivityContent(
      base(),
      delta({ kind: 'cost', perTurn: [{ turn: 1, model: 'm', provider: 'p', costUsd: 1 }] })
    );
    expect(acc.perTurnCost).toHaveLength(1);
  });

  it('no-op merge of empty content leaves nodes empty (no regression)', () => {
    const acc = mergeActivityContent(base(), base());
    expect(acc.nodes).toHaveLength(0);
    expect(acc.status).toBe('running');
  });
});

const tool = (id: string, status: ActivityNode['status'], detail?: string): ActivityNode => ({
  id,
  kind: 'tool',
  callId: id,
  name: id,
  status,
  ...(detail ? { detail } : {}),
});

describe('activityTree.mergeNodeList (#252 Phase 2 sub-agent subtree)', () => {
  it('appends a new child node when its id is unseen', () => {
    const merged = mergeNodeList([tool('a', 'running')], [tool('b', 'running')]);
    expect(merged.map((n) => n.id)).toEqual(['a', 'b']);
  });

  it('merges by id: appends detail and advances status to terminal', () => {
    const merged = mergeNodeList([tool('a', 'running', 'part1')], [tool('a', 'done', 'part2')]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ id: 'a', status: 'done', detail: 'part1part2' });
  });

  it('recurses into nested sub-agent children by id (depth-N)', () => {
    const prev: ActivityNode[] = [
      {
        id: 'sub:1',
        kind: 'sub_agent',
        callId: '1',
        name: 'child',
        status: 'running',
        children: [tool('t1', 'running', 'x')],
      },
    ];
    const next: ActivityNode[] = [
      {
        id: 'sub:1',
        kind: 'sub_agent',
        callId: '1',
        name: 'child',
        status: 'done',
        children: [tool('t1', 'done', 'y')],
      },
    ];
    const merged = mergeNodeList(prev, next);
    expect(merged[0].status).toBe('done');
    expect(merged[0].children).toHaveLength(1);
    expect(merged[0].children![0]).toMatchObject({ id: 't1', status: 'done', detail: 'xy' });
  });

  it('handles undefined inputs without throwing', () => {
    expect(mergeNodeList(undefined, [tool('a', 'running')])).toHaveLength(1);
    expect(mergeNodeList([tool('a', 'running')], undefined)).toHaveLength(1);
    expect(mergeNodeList()).toEqual([]);
  });
});
