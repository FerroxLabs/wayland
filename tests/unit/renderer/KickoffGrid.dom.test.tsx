/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { KickoffGridItem } from '@process/services/kickoff/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key,
  }),
}));

vi.mock('@/renderer/pages/guid/components/kickoffGrid/KickoffGrid.module.css', () => ({ default: {} }));

import KickoffGrid from '@/renderer/pages/guid/components/kickoffGrid/KickoffGrid';

const items: KickoffGridItem[] = [
  { kickoffId: 'k1', text: 'Organize my project files', prefill: 'Organize my files now', source: 'kickoff' },
  { text: 'Process a batch of PDFs', prefill: 'Process these PDFs', source: 'prompts' },
];

describe('<KickoffGrid>', () => {
  it('renders the heading and one card per item', () => {
    render(<KickoffGrid items={items} onSelect={vi.fn()} />);
    expect(screen.getByText('Try one of these')).toBeTruthy();
    expect(screen.getAllByTestId('assistant-kickoff-card')).toHaveLength(2);
    expect(screen.getByText('Organize my project files')).toBeTruthy();
    expect(screen.getByText('Process a batch of PDFs')).toBeTruthy();
  });

  it("clicking a card invokes onSelect with that card's prefill (not its display text)", () => {
    const onSelect = vi.fn();
    render(<KickoffGrid items={items} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Organize my project files'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('Organize my files now');
  });

  it('renders nothing when there are no items (empty assistant)', () => {
    const { container } = render(<KickoffGrid items={[]} onSelect={vi.fn()} />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('assistant-kickoff-grid')).toBeNull();
  });
});
