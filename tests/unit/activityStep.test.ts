/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import type { ActivityNode } from '../../src/common/chat/chatLib';
import {
  nodeToStep,
  nodesToSteps,
  stepDurationSec,
  formatDuration,
  rollupStatus,
  doneCount,
} from '../../src/common/chat/activity/activityStep';

const node = (over: Partial<ActivityNode>): ActivityNode => ({
  id: 'n1',
  kind: 'tool',
  name: 'Read',
  status: 'done',
  ...over,
});

describe('activityStep.nodeToStep', () => {
  it('projects a tool node with humanized label + glyph', () => {
    const s = nodeToStep(node({ name: 'Read', detail: '/src/config.ts', startTime: 1000, endTime: 3100 }), 'native');
    expect(s.id).toBe('n1');
    expect(s.kind).toBe('tool');
    expect(s.glyph).toBe('file');
    expect(s.label).toBe('Reading config.ts');
    expect(s.source).toBe('native');
  });
  it('carries agent name for sub_agent and recurses children', () => {
    const s = nodeToStep(
      node({
        kind: 'sub_agent',
        name: 'researcher',
        status: 'running',
        children: [node({ id: 'c1', name: 'WebFetch', detail: 'https://apnews.com', status: 'done' })],
      }),
      'native'
    );
    expect(s.agent).toBe('researcher');
    expect(s.children).toHaveLength(1);
    expect(s.children?.[0].label).toBe('Reading apnews.com');
    expect(s.children?.[0].id).toBe('c1');
  });
  it('omits children when none', () => {
    expect(nodeToStep(node({})).children).toBeUndefined();
  });
});

describe('activityStep duration + rollup', () => {
  it('stepDurationSec + formatDuration', () => {
    expect(stepDurationSec({ startTime: 1000, endTime: 7200 })).toBeCloseTo(6.2);
    expect(formatDuration(6.2)).toBe('6.2s');
    expect(formatDuration(undefined)).toBe('');
    expect(stepDurationSec({ startTime: undefined, endTime: 7200 })).toBeUndefined();
  });
  it('rollupStatus: running wins, then failed, then done', () => {
    expect(rollupStatus([{ status: 'done' }, { status: 'running' }])).toBe('running');
    expect(rollupStatus([{ status: 'done' }, { status: 'failed' }])).toBe('failed');
    expect(rollupStatus([{ status: 'done' }, { status: 'done' }])).toBe('done');
    expect(rollupStatus([])).toBe('running');
  });
  it('doneCount counts terminal steps', () => {
    expect(doneCount([{ status: 'done' }, { status: 'failed' }, { status: 'running' }])).toBe(2);
  });
});

describe('activityStep.nodesToSteps', () => {
  it('maps a list', () => {
    const steps = nodesToSteps([node({ id: 'a', name: 'Grep' }), node({ id: 'b', kind: 'thinking', name: '' })], 'acp');
    expect(steps.map((s) => s.glyph)).toEqual(['search', 'reasoning']);
    expect(steps.every((s) => s.source === 'acp')).toBe(true);
  });
});
