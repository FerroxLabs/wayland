/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * DOM tests for the Inspector component.
 *
 * Covers:
 *   - entry present: title + sections rendered
 *   - entry null: empty state
 *   - × close button calls onClose
 *   - Esc keypress calls onClose
 *   - Promote button calls onPromote(entry.id)
 *   - Open file button calls onOpenSource(path, line)
 *   - Score bar color states (green / orange / gray)
 *   - Dereference cards render + click
 *   - Empty tags array hides Tags section
 *   - Already-promoted entry disables Promote button
 */

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Silence @arco-design/web-react Message (calls document.createElement in jsdom)
vi.mock('@arco-design/web-react', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@arco-design/web-react');
  return {
    ...actual,
    Message: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

// Stub icon-park icons - they render SVGs that don't matter for logic tests
vi.mock('@icon-park/react', () => ({
  Close: (props: Record<string, unknown>) => <span data-testid='icon-close' {...props} />,
  Copy: (props: Record<string, unknown>) => <span data-testid='icon-copy' {...props} />,
  LinkOne: (props: Record<string, unknown>) => <span data-testid='icon-link' {...props} />,
  FileCode: (props: Record<string, unknown>) => <span data-testid='icon-file-code' {...props} />,
  Help: (props: Record<string, unknown>) => <span data-testid='icon-help' {...props} />,
}));

import Inspector from '@renderer/pages/memory/components/Inspector';
import type { InspectorProps } from '@renderer/pages/memory/components/Inspector';
import type { MemoryEntry } from '@/common/types/memory';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_ENTRY: MemoryEntry & { body: string } = {
  id: 'mem-001',
  type: 'decision',
  project: 'wayland-app',
  projectPath: '/Users/sean/dev/wayland-app',
  summary: 'Always use Arco components instead of raw HTML buttons',
  bodyPreview: 'Always use Arco components',
  body: 'Full body text here explaining the decision in detail.',
  why: 'Raw HTML breaks the design system constraints.',
  howToApply: 'Replace any <button> or <input> with Arco equivalents.',
  tags: ['design-system', 'arco'],
  storedAt: Date.now() - 3600_000,
  sourcePath: 'src/renderer/AGENTS.md',
  sourceLine: 42,
  referencedBy: 12,
  promotionScore: 75,
};

const defaultProps = (overrides: Partial<InspectorProps> = {}): InspectorProps => ({
  entry: BASE_ENTRY,
  promotionThreshold: 90,
  onClose: vi.fn(),
  onPromote: vi.fn(),
  onOpenSource: vi.fn(),
  onCopy: vi.fn(),
  ...overrides,
});

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Inspector', () => {
  it('renders title and body sections when entry is present', () => {
    render(<Inspector {...defaultProps()} />);
    expect(screen.getByTestId('inspector-title').textContent).toBe(BASE_ENTRY.summary);
    expect(screen.getByTestId('inspector-section-summary')).toBeTruthy();
    expect(screen.getByTestId('inspector-section-why')).toBeTruthy();
    expect(screen.getByTestId('inspector-section-howto')).toBeTruthy();
  });

  // #751: @icon-park icons don't forwardRef, so an unwrapped Arco <Tooltip>
  // trigger yields a null DOM node and crashes on hover positioning. The score
  // help icon must be wrapped in a host element.
  it('#751: wraps the score help icon in a span so the tooltip cannot crash on hover', () => {
    render(<Inspector {...defaultProps()} />);
    const wrapper = screen.getByTestId('icon-help').parentElement;
    expect(wrapper?.tagName).toBe('SPAN');
    expect(wrapper?.style.display).toBe('inline-flex');
  });

  it('renders the empty state when entry is null', () => {
    render(<Inspector {...defaultProps({ entry: null })} />);
    expect(screen.getByTestId('inspector-empty')).toBeTruthy();
    expect(screen.queryByTestId('inspector-title')).toBeNull();
  });

  it('clicking × calls onClose', () => {
    const onClose = vi.fn();
    render(<Inspector {...defaultProps({ onClose })} />);
    fireEvent.click(screen.getByTestId('inspector-close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('Esc keypress calls onClose', () => {
    const onClose = vi.fn();
    render(<Inspector {...defaultProps({ onClose })} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('clicking Promote calls onPromote with entry id', () => {
    const onPromote = vi.fn();
    render(<Inspector {...defaultProps({ onPromote })} />);
    fireEvent.click(screen.getByTestId('inspector-promote-btn'));
    expect(onPromote).toHaveBeenCalledWith(BASE_ENTRY.id);
  });

  it('clicking Open file calls onOpenSource with path and line', () => {
    const onOpenSource = vi.fn();
    render(<Inspector {...defaultProps({ onOpenSource })} />);
    fireEvent.click(screen.getByTestId('inspector-open-btn'));
    expect(onOpenSource).toHaveBeenCalledWith(BASE_ENTRY.sourcePath, BASE_ENTRY.sourceLine);
  });

  it('score 95 with threshold 90 → green fill class', () => {
    const entry = { ...BASE_ENTRY, promotionScore: 95 };
    render(<Inspector {...defaultProps({ entry, promotionThreshold: 90 })} />);
    const fill = screen.getByTestId('inspector-score-fill');
    expect(fill.className).toContain('green');
  });

  it('score 85 with threshold 90 → orange fill class', () => {
    const entry = { ...BASE_ENTRY, promotionScore: 85 };
    render(<Inspector {...defaultProps({ entry, promotionThreshold: 90 })} />);
    const fill = screen.getByTestId('inspector-score-fill');
    expect(fill.className).toContain('orange');
  });

  it('score 50 with threshold 90 → gray fill class', () => {
    const entry = { ...BASE_ENTRY, promotionScore: 50 };
    render(<Inspector {...defaultProps({ entry, promotionThreshold: 90 })} />);
    const fill = screen.getByTestId('inspector-score-fill');
    expect(fill.className).toContain('gray');
  });

  it('renders a dereference card when dereferences is non-empty', () => {
    const entry = {
      ...BASE_ENTRY,
      dereferences: [
        {
          source: 'src/renderer/hooks/useMemory.ts',
          line: 17,
          preview: 'Use Arco Button not raw <button>',
          lastAt: Date.now() - 7200_000,
        },
      ],
    };
    render(<Inspector {...defaultProps({ entry })} />);
    expect(screen.getByTestId('inspector-deref-card')).toBeTruthy();
    expect(screen.getByTestId('inspector-section-derefs')).toBeTruthy();
  });

  it('clicking a dereference card calls onOpenSource with card source + line', () => {
    const onOpenSource = vi.fn();
    const deref = {
      source: 'src/renderer/hooks/useMemory.ts',
      line: 17,
      preview: 'Use Arco Button not raw <button>',
      lastAt: Date.now() - 7200_000,
    };
    const entry = { ...BASE_ENTRY, dereferences: [deref] };
    render(<Inspector {...defaultProps({ entry, onOpenSource })} />);
    fireEvent.click(screen.getByTestId('inspector-deref-card'));
    expect(onOpenSource).toHaveBeenCalledWith(deref.source, deref.line);
  });

  it('empty tags array hides the Tags section', () => {
    const entry = { ...BASE_ENTRY, tags: [] };
    render(<Inspector {...defaultProps({ entry })} />);
    expect(screen.queryByTestId('inspector-section-tags')).toBeNull();
  });

  it('non-empty tags array renders the Tags section', () => {
    render(<Inspector {...defaultProps()} />);
    expect(screen.getByTestId('inspector-section-tags')).toBeTruthy();
  });

  it('already-promoted entry (type=wiki) disables Promote button with checkmark text', () => {
    const entry = { ...BASE_ENTRY, type: 'wiki' as const };
    render(<Inspector {...defaultProps({ entry })} />);
    const btn = screen.getByTestId('inspector-promote-btn');
    expect(btn.textContent).toContain('✓');
    // Arco Button disabled sets aria-disabled or the DOM disabled attribute
    expect(btn.getAttribute('disabled') !== null || btn.getAttribute('aria-disabled') === 'true').toBe(true);
  });

  // ----- H6: no double toast on source path copy -----

  it('H6: clicking source path calls onCopy once and does NOT show a second Message.success', async () => {
    // Get the mocked Message from the module mock registered at top of this file.
    const arco = await import('@arco-design/web-react');
    const successFn = arco.Message.success as ReturnType<typeof vi.fn>;
    successFn.mockClear();

    const onCopy = vi.fn();
    render(<Inspector {...defaultProps({ onCopy })} />);
    fireEvent.click(screen.getByTestId('inspector-source-path'));
    expect(onCopy).toHaveBeenCalledOnce();
    // Inspector itself must not call Message.success (only parent's onCopy does).
    expect(successFn).not.toHaveBeenCalled();
  });
});
