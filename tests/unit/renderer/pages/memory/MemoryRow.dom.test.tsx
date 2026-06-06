/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * DOM tests for MemoryRow.
 *
 * Covers:
 *   - Renders title, snippet, relative date, project basename, chevron.
 *   - Click fires onClick(entry.id).
 *   - Enter and Space keypress fire onClick(entry.id).
 *   - selected=true adds the selected class.
 *   - entry.referencedBy > 0 renders the "Used N×" pill.
 *   - Each MemoryType renders the expected lucide icon (via testid stamp).
 */

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MemoryEntry, MemoryType } from '@/common/types/memory';

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Fixture factory
// ---------------------------------------------------------------------------

const makeEntry = (overrides: Partial<MemoryEntry> = {}): MemoryEntry => ({
  id: 'entry-1',
  type: 'decision',
  project: 'wayland-app',
  projectPath: '/Users/sean/dev/wayland-app',
  summary: 'Always use Arco for interactive elements',
  bodyPreview: 'Raw buttons and inputs are forbidden by AGENTS.md conventions.',
  tags: ['design', 'convention'],
  storedAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2d ago
  sourcePath: '/Users/sean/dev/wayland-app/AGENTS.md',
  sourceLine: 42,
  referencedBy: 0,
  promotionScore: 75,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Import after mocks are set up
// ---------------------------------------------------------------------------

import MemoryRow from '@renderer/pages/memory/components/MemoryRow';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MemoryRow', () => {
  it('renders the title from entry.summary', () => {
    render(<MemoryRow entry={makeEntry()} />);
    expect(screen.getByTestId('memory-row-title').textContent).toBe(
      'Always use Arco for interactive elements',
    );
  });

  it('renders the snippet from entry.bodyPreview', () => {
    render(<MemoryRow entry={makeEntry()} />);
    expect(screen.getByTestId('memory-row-snippet').textContent).toContain(
      'Raw buttons and inputs are forbidden',
    );
  });

  it('renders a relative date label', () => {
    render(<MemoryRow entry={makeEntry()} />);
    const date = screen.getByTestId('memory-row-date').textContent ?? '';
    // 2d ago from storedAt
    expect(date).toMatch(/ago|now/);
  });

  it('renders the project basename from projectPath', () => {
    render(<MemoryRow entry={makeEntry()} />);
    expect(screen.getByTestId('memory-row-project').textContent).toBe('wayland-app');
  });

  it('renders the chevron element', () => {
    render(<MemoryRow entry={makeEntry()} />);
    expect(screen.getByTestId('memory-row-chevron')).toBeTruthy();
  });

  it('calls onClick with entry.id when clicked', () => {
    const onClick = vi.fn();
    render(<MemoryRow entry={makeEntry({ id: 'abc-123' })} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('memory-row-abc-123'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith('abc-123');
  });

  it('calls onClick with entry.id on Enter keypress', () => {
    const onClick = vi.fn();
    render(<MemoryRow entry={makeEntry({ id: 'abc-123' })} onClick={onClick} />);
    const row = screen.getByTestId('memory-row-abc-123');
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledWith('abc-123');
  });

  it('calls onClick with entry.id on Space keypress', () => {
    const onClick = vi.fn();
    render(<MemoryRow entry={makeEntry({ id: 'abc-123' })} onClick={onClick} />);
    const row = screen.getByTestId('memory-row-abc-123');
    fireEvent.keyDown(row, { key: ' ' });
    expect(onClick).toHaveBeenCalledWith('abc-123');
  });

  it('does not call onClick on other keypresses', () => {
    const onClick = vi.fn();
    render(<MemoryRow entry={makeEntry()} onClick={onClick} />);
    fireEvent.keyDown(screen.getByTestId('memory-row-entry-1'), { key: 'Escape' });
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies the selected class when selected=true', () => {
    render(<MemoryRow entry={makeEntry()} selected />);
    const row = screen.getByTestId('memory-row-entry-1');
    expect(row.className).toMatch(/selected/);
  });

  it('does not apply selected class when selected=false', () => {
    render(<MemoryRow entry={makeEntry()} selected={false} />);
    const row = screen.getByTestId('memory-row-entry-1');
    expect(row.className).not.toMatch(/selected/);
  });

  it('renders the ref pill when referencedBy > 0', () => {
    render(<MemoryRow entry={makeEntry({ referencedBy: 12 })} />);
    const pill = screen.getByTestId('memory-row-ref-pill');
    expect(pill).toBeTruthy();
    expect(pill.textContent).toContain('12');
  });

  it('does not render the ref pill when referencedBy === 0', () => {
    render(<MemoryRow entry={makeEntry({ referencedBy: 0 })} />);
    expect(screen.queryByTestId('memory-row-ref-pill')).toBeNull();
  });

  it('renders the tag count badge when tags.length > 0', () => {
    render(<MemoryRow entry={makeEntry({ tags: ['a', 'b', 'c'] })} />);
    const badge = screen.getByTestId('memory-row-tag-count');
    expect(badge.textContent).toBe('3');
  });

  it('does not render the tag count badge when tags is empty', () => {
    render(<MemoryRow entry={makeEntry({ tags: [] })} />);
    expect(screen.queryByTestId('memory-row-tag-count')).toBeNull();
  });

  // Icon tests per type - the vitest.dom.setup stamps data-testid="icon-<Name>"
  const typeIconCases: [MemoryType, string][] = [
    ['decision', 'icon-Diamond'],
    ['pattern', 'icon-Triangle'],
    ['observation', 'icon-Eye'],
    ['session', 'icon-Clock'],
    ['wiki', 'icon-BookOpen'],
    ['preference', 'icon-Settings'],
  ];

  typeIconCases.forEach(([type, iconTestId]) => {
    it(`renders ${iconTestId} icon for type="${type}"`, () => {
      render(<MemoryRow entry={makeEntry({ id: `e-${type}`, type })} />);
      expect(screen.getByTestId(iconTestId)).toBeTruthy();
    });
  });
});
