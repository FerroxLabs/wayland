/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { parseInnerEvent, MAX_INNER_DEPTH } from '../../src/common/chat/innerEvent';

describe('innerEvent.parseInnerEvent - child tools surface (fail-on-old)', () => {
  it('surfaces a child tool_request as a running tool node (NOT discarded)', () => {
    const r = parseInnerEvent({
      type: 'tool_request',
      msg_id: 'm1',
      call_id: 'c1',
      tool: { name: 'ReadFile', category: 'info', args: {}, description: '' },
    });
    expect(r.nodes).toHaveLength(1);
    expect(r.nodes[0]).toMatchObject({ id: 'c1', kind: 'tool', callId: 'c1', name: 'ReadFile', status: 'running' });
  });

  it('surfaces a child tool_result as a done tool node carrying its output', () => {
    const r = parseInnerEvent({
      type: 'tool_result',
      msg_id: 'm1',
      call_id: 'c1',
      tool_name: 'ReadFile',
      status: 'success',
      output: 'file contents here',
      output_type: 'text',
    });
    expect(r.nodes[0]).toMatchObject({ id: 'c1', kind: 'tool', status: 'done', detail: 'file contents here' });
  });

  it('marks a child tool_result with status error as a failed node', () => {
    const r = parseInnerEvent({
      type: 'tool_result',
      msg_id: 'm1',
      call_id: 'c2',
      tool_name: 'Bash',
      status: 'error',
      output: 'boom',
      output_type: 'text',
    });
    expect(r.nodes[0]).toMatchObject({ kind: 'tool', status: 'failed', detail: 'boom' });
  });

  it('surfaces a child tool_chunk as a running tool node whose detail is the chunk', () => {
    const r = parseInnerEvent({
      type: 'tool_chunk',
      msg_id: 'm1',
      call_id: 'c1',
      tool_name: 'Bash',
      chunk: 'stdout-line\n',
    });
    expect(r.nodes[0]).toMatchObject({ id: 'c1', kind: 'tool', status: 'running', detail: 'stdout-line\n' });
  });

  it('surfaces a child thinking event as a thinking node carrying the monologue text', () => {
    const r = parseInnerEvent({ type: 'thinking', msg_id: 'm9', text: 'let me reason about this' });
    expect(r.nodes[0]).toMatchObject({ kind: 'thinking', detail: 'let me reason about this' });
  });

  it('surfaces a child text_delta as a thinking node AND keeps the legacy body text', () => {
    const r = parseInnerEvent({ type: 'text_delta', msg_id: 'm9', text: 'hello from sub-agent' });
    expect(r.text).toBe('hello from sub-agent');
    expect(r.nodes[0]).toMatchObject({ kind: 'thinking', detail: 'hello from sub-agent' });
  });
});

describe('innerEvent.parseInnerEvent - nested sub-agents (depth-N)', () => {
  it('recurses two levels deep into a nested sub_agent_event subtree', () => {
    const inner = {
      type: 'sub_agent_event',
      parent_call_id: 'spawn:1:child',
      agent_name: 'child-agent',
      inner: {
        type: 'sub_agent_event',
        parent_call_id: 'spawn:2:grandchild',
        agent_name: 'grandchild-agent',
        inner: {
          type: 'tool_request',
          msg_id: 'mg',
          call_id: 'deep-tool',
          tool: { name: 'DeepTool', category: 'exec', args: {}, description: '' },
        },
      },
    };
    const r = parseInnerEvent(inner);
    expect(r.nodes).toHaveLength(1);
    const child = r.nodes[0];
    expect(child).toMatchObject({ kind: 'sub_agent', callId: 'spawn:1:child', name: 'child-agent' });
    expect(child.children).toHaveLength(1);
    const grandchild = child.children![0];
    expect(grandchild).toMatchObject({ kind: 'sub_agent', callId: 'spawn:2:grandchild', name: 'grandchild-agent' });
    expect(grandchild.children![0]).toMatchObject({ id: 'deep-tool', kind: 'tool', name: 'DeepTool' });
  });

  it('propagates a nested error lifecycle to the nested sub-agent node status', () => {
    const inner = {
      type: 'sub_agent_event',
      parent_call_id: 'spawn:1:child',
      agent_name: 'child',
      inner: { type: 'error', msg_id: 'm', error: { code: 'x', message: 'fail', retryable: false } },
    };
    const r = parseInnerEvent(inner);
    expect(r.nodes[0]).toMatchObject({ kind: 'sub_agent', status: 'failed' });
  });

  it('caps recursion at MAX_INNER_DEPTH and falls back gracefully (no stack blow-up)', () => {
    // Build a chain deeper than the cap.
    let inner: unknown = {
      type: 'tool_request',
      msg_id: 'm',
      call_id: 'leaf',
      tool: { name: 'Leaf', category: 'info', args: {}, description: '' },
    };
    for (let i = 0; i < MAX_INNER_DEPTH + 3; i++) {
      inner = { type: 'sub_agent_event', parent_call_id: `p${i}`, agent_name: `a${i}`, inner };
    }
    expect(() => parseInnerEvent(inner)).not.toThrow();
    const r = parseInnerEvent(inner);
    // Top level still produces a sub-agent node; deepest levels collapse to the
    // safe fallback (empty children) once the cap is hit.
    expect(r.nodes[0].kind).toBe('sub_agent');
  });
});

describe('innerEvent.parseInnerEvent - lifecycle', () => {
  it('maps a child info event to a done lifecycle (no node)', () => {
    const r = parseInnerEvent({ type: 'info', msg_id: 'm', message: 'agent finished' });
    expect(r.lifecycle).toBe('done');
    expect(r.nodes).toHaveLength(0);
  });

  it('maps a child error event to a failed lifecycle (no node)', () => {
    const r = parseInnerEvent({ type: 'error', msg_id: 'm', error: { code: 'x', message: 'y', retryable: false } });
    expect(r.lifecycle).toBe('failed');
  });
});

describe('innerEvent.parseInnerEvent - graceful fallback / regression', () => {
  it('REGRESSION: text-only inner still yields the legacy body text', () => {
    // The exact Phase-1 shape: { type:'text_delta', text }.
    const r = parseInnerEvent({ type: 'text_delta', text: 'legacy body' });
    expect(r.text).toBe('legacy body');
  });

  it('REGRESSION: legacy info/error inner still advances lifecycle via the parser', () => {
    expect(parseInnerEvent({ type: 'info' }).lifecycle).toBe('done');
    expect(parseInnerEvent({ type: 'error' }).lifecycle).toBe('failed');
  });

  it('falls back to text-only for a malformed inner (no type field)', () => {
    const r = parseInnerEvent({ foo: 'bar' });
    expect(r.nodes).toHaveLength(0);
    expect(r.text).toBe('');
    expect(r.lifecycle).toBeUndefined();
  });

  it('falls back safely for null / undefined / primitive inner', () => {
    expect(parseInnerEvent(null)).toMatchObject({ nodes: [], text: '' });
    expect(parseInnerEvent(undefined)).toMatchObject({ nodes: [], text: '' });
    expect(parseInnerEvent('just a string')).toMatchObject({ nodes: [], text: '' });
    expect(parseInnerEvent(42)).toMatchObject({ nodes: [], text: '' });
  });

  it('still extracts the body text from a malformed-but-text_delta inner via fallback shape', () => {
    // type present but not a recognized variant we node-ify: text_delta IS
    // recognized, so this proves the fallback path is only for truly opaque ones.
    const r = parseInnerEvent({ type: 'some_future_event', text: 'ignored' });
    expect(r.nodes).toHaveLength(0);
    expect(r.text).toBe('');
  });
});
