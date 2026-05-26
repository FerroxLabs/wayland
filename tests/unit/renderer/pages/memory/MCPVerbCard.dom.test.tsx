/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Wave 5 Task 5.0 — DOM tests for `MCPVerbCard`.
 *
 * Covers the four render branches:
 *   - loading → Arco Spin (testid `mcp-verb-card-loading`).
 *   - ok:false with a known reason → localized `memory.error.<reason>` text.
 *   - ok:false with an unknown reason → falls back to `memory.error.unknown`.
 *   - ok:true with empty data + `empty` prop → renders the empty slot.
 *   - ok:true with non-empty data + `empty` prop → calls `render(data)`.
 *   - ok:true with null data and no `empty` prop → still calls `render(data)`.
 */

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => {
      // Mimic i18next: return the key unless a defaultValue is set AND the
      // key is one we deliberately treat as "missing" — the production code
      // uses `defaultValue` only as a fallback for the unknown-reason case,
      // so we honor it whenever provided.
      if (opts?.defaultValue !== undefined && key === 'memory.error.gibberish') {
        return opts.defaultValue;
      }
      return key;
    },
  }),
}));

import MCPVerbCard from '@renderer/pages/memory/components/MCPVerbCard';
import type { VerbState } from '@renderer/pages/memory/hooks/useIjfwBrain';

afterEach(() => {
  cleanup();
});

describe('MCPVerbCard', () => {
  it('renders the Arco Spin when state is loading', () => {
    const state: VerbState<unknown> = { loading: true };
    render(<MCPVerbCard state={state} render={() => <div>data</div>} />);
    expect(screen.getByTestId('mcp-verb-card-loading')).toBeTruthy();
  });

  it('renders the localized error key for a known errorReason', () => {
    const state: VerbState<unknown> = {
      loading: false,
      ok: false,
      errorReason: 'mcp_error',
    };
    render(<MCPVerbCard state={state} render={() => <div>data</div>} />);
    const node = screen.getByTestId('mcp-verb-card-error');
    expect(node.textContent).toBe('memory.error.mcp_error');
  });

  it('falls back to memory.error.unknown when the errorReason is not a known key', () => {
    // @ts-expect-error — deliberately passing an out-of-union reason
    const state: VerbState<unknown> = {
      loading: false,
      ok: false,
      errorReason: 'gibberish',
    };
    render(<MCPVerbCard state={state} render={() => <div>data</div>} />);
    const node = screen.getByTestId('mcp-verb-card-error');
    expect(node.textContent).toBe('memory.error.unknown');
  });

  it('renders the empty slot when ok:true and data is an empty array', () => {
    const state: VerbState<unknown[]> = { loading: false, ok: true, data: [] };
    render(
      <MCPVerbCard
        state={state}
        empty={<div data-testid='mcp-empty'>nothing here</div>}
        render={(data) => <div data-testid='mcp-render'>{(data as unknown[]).length}</div>}
      />
    );
    expect(screen.getByTestId('mcp-empty')).toBeTruthy();
    expect(screen.queryByTestId('mcp-render')).toBeNull();
  });

  it('renders the data via render() when ok:true and data is non-empty', () => {
    const state: VerbState<Array<{ x: number }>> = {
      loading: false,
      ok: true,
      data: [{ x: 1 }],
    };
    render(
      <MCPVerbCard
        state={state}
        empty={<div data-testid='mcp-empty'>nothing here</div>}
        render={(data) => <div data-testid='mcp-render'>{data.length}</div>}
      />
    );
    expect(screen.getByTestId('mcp-render').textContent).toBe('1');
    expect(screen.queryByTestId('mcp-empty')).toBeNull();
  });

  it('still calls render() when ok:true with null data and no empty prop is provided', () => {
    const state: VerbState<null> = { loading: false, ok: true, data: null };
    render(
      <MCPVerbCard
        state={state}
        render={(data) => (
          <div data-testid='mcp-render-null'>{data === null ? 'is-null' : 'not-null'}</div>
        )}
      />
    );
    expect(screen.getByTestId('mcp-render-null').textContent).toBe('is-null');
  });
});
