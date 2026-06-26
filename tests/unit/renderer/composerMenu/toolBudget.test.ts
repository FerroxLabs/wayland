/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  countEnabledMcpTools,
  nextActiveSelection,
  toolBudgetStatus,
} from '@renderer/pages/conversation/components/composerMenu/toolBudget';
import type { IMcpServer } from '@/common/config/storage';

const server = (over: Partial<IMcpServer>): IMcpServer =>
  ({
    id: 'm',
    name: 'svc',
    enabled: true,
    status: 'connected',
    transport: { type: 'stdio', command: 'x', args: [] },
    tools: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
    originalJson: '{}',
    createdAt: 1,
    updatedAt: 1,
    ...over,
  }) as IMcpServer;

describe('countEnabledMcpTools (#348)', () => {
  it('sums tools across enabled + connected servers', () => {
    expect(countEnabledMcpTools([server({ id: 'a' }), server({ id: 'b', tools: [{ name: 'x' }] })])).toBe(4);
  });

  it('skips disabled servers', () => {
    expect(countEnabledMcpTools([server({ enabled: false })])).toBe(0);
  });

  it('skips servers that are not connected (tools not live)', () => {
    expect(countEnabledMcpTools([server({ status: 'disconnected' })])).toBe(0);
  });

  it('honours allowedTools scoping over the raw tool list', () => {
    // 3 tools available, but the user scoped to 1.
    expect(countEnabledMcpTools([server({ allowedTools: ['a'] })])).toBe(1);
  });

  it('counts allowedTools: [] as zero (all scoped out)', () => {
    expect(countEnabledMcpTools([server({ allowedTools: [] })])).toBe(0);
  });

  it('treats a connected server with no tools yet as zero', () => {
    expect(countEnabledMcpTools([server({ tools: undefined })])).toBe(0);
  });
});

describe('nextActiveSelection (#348)', () => {
  const all = ['a', 'b', 'c'];

  it('toggling one off from "all" (undefined) materializes the rest', () => {
    expect(nextActiveSelection(undefined, all, 'b', false)).toEqual(['a', 'c']);
  });

  it('toggling the last one back on returns undefined (clean "all")', () => {
    expect(nextActiveSelection(['a', 'c'], all, 'b', true)).toBeUndefined();
  });

  it('toggling off from a defined set removes that id', () => {
    expect(nextActiveSelection(['a', 'b'], all, 'a', false)).toEqual(['b']);
  });

  it('toggling the only-active server off yields [] (none)', () => {
    expect(nextActiveSelection(['a'], all, 'a', false)).toEqual([]);
  });

  it('toggling on from [] adds just that id', () => {
    expect(nextActiveSelection([], all, 'b', true)).toEqual(['b']);
  });

  it('does not duplicate an id already present', () => {
    expect(nextActiveSelection(['a'], all, 'a', true)).toEqual(['a']);
  });
});

describe('toolBudgetStatus (#348)', () => {
  it('is over only when the count exceeds the cap', () => {
    expect(toolBudgetStatus(129, 128)).toBe('over');
    expect(toolBudgetStatus(128, 128)).toBe('near'); // at cap = near, not over
  });

  it('is near within the top 15% of headroom', () => {
    expect(toolBudgetStatus(109, 128)).toBe('near'); // >= 108.8
    expect(toolBudgetStatus(108, 128)).toBe('ok'); // < 108.8
  });

  it('is ok comfortably under the cap', () => {
    expect(toolBudgetStatus(10, 128)).toBe('ok');
    expect(toolBudgetStatus(0, 128)).toBe('ok');
  });
});
