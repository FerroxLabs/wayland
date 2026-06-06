/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'wiki.orphan.noPageYet': 'No page yet',
      };
      return map[key] ?? key;
    },
    i18n: { language: 'en-US' },
  }),
}));

import { WikilinkRenderer } from '@renderer/pages/wiki/components/WikilinkRenderer';
import type { BacklinkResolver } from '@renderer/pages/wiki/components/WikilinkRenderer';

afterEach(() => {
  cleanup();
});

const resolver: BacklinkResolver = (name) => {
  if (name === 'TurnElement enum') return { slug: 'turnelement-enum' };
  if (name === 'file-per-backend pattern') return { slug: 'file-per-backend-pattern' };
  return { slug: null };
};

describe('WikilinkRenderer', () => {
  it('renders plain text without wikilinks unchanged', () => {
    const { container } = render(
      <WikilinkRenderer text='Hello world' resolveBacklink={resolver} />,
    );
    expect(container.textContent).toBe('Hello world');
  });

  it('renders a single wikilink as a BacklinkChip', () => {
    render(
      <WikilinkRenderer text='See [[TurnElement enum]] for details' resolveBacklink={resolver} />,
    );
    const chips = screen.getAllByTestId('backlink-chip');
    expect(chips).toHaveLength(1);
    expect(chips[0].textContent).toBe('TurnElement enum');
  });

  it('renders multiple wikilinks', () => {
    render(
      <WikilinkRenderer
        text='[[TurnElement enum]] uses [[file-per-backend pattern]]'
        resolveBacklink={resolver}
      />,
    );
    const chips = screen.getAllByTestId('backlink-chip');
    expect(chips).toHaveLength(2);
  });

  it('renders alias display text for [[X|alias]] syntax', () => {
    render(
      <WikilinkRenderer text='See [[TurnElement enum|the enum]] here' resolveBacklink={resolver} />,
    );
    const chip = screen.getByTestId('backlink-chip');
    expect(chip.textContent).toBe('the enum');
  });

  it('renders orphan chip for unknown wikilinks', () => {
    render(<WikilinkRenderer text='[[Nonexistent Concept]]' resolveBacklink={resolver} />);
    const chip = screen.getByTestId('backlink-chip');
    expect(chip.title).toBe('No page yet');
  });

  it('preserves surrounding text', () => {
    const { container } = render(
      <WikilinkRenderer text='Before [[TurnElement enum]] after' resolveBacklink={resolver} />,
    );
    expect(container.textContent).toContain('Before');
    expect(container.textContent).toContain('after');
    expect(container.textContent).toContain('TurnElement enum');
  });

  it('calls onNavigate when a resolved chip is clicked', () => {
    const onNavigate = vi.fn();
    render(
      <WikilinkRenderer
        text='[[TurnElement enum]]'
        resolveBacklink={resolver}
        onNavigate={onNavigate}
      />,
    );
    screen.getByTestId('backlink-chip').click();
    expect(onNavigate).toHaveBeenCalledWith('turnelement-enum');
  });
});
