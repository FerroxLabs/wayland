/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import QuickLaunchCard from '@/renderer/pages/guid/components/newChatStarter/QuickLaunchCard';

describe('QuickLaunchCard', () => {
  const baseProps = {
    id: 'write-copy' as const,
    label: 'Write copy',
    sub: 'Email, ad, page',
    lucideIcon: 'pen-line',
    onSelect: vi.fn(),
  };

  it('renders the label and the sub-line', () => {
    render(<QuickLaunchCard {...baseProps} />);
    expect(screen.getByText('Write copy')).toBeInTheDocument();
    expect(screen.getByText('Email, ad, page')).toBeInTheDocument();
  });

  it('fires onSelect with the anchor id on click', () => {
    const onSelect = vi.fn();
    render(<QuickLaunchCard {...baseProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('write-copy');
  });

  it('applies the cowork variant class for the cowork anchor', () => {
    const { container } = render(<QuickLaunchCard {...baseProps} id='cowork' label='Cowork' />);
    expect(container.querySelector('button')?.className).toMatch(/cowork/);
  });

  it('paints the cowork tile with the orange palette', () => {
    const { container } = render(<QuickLaunchCard {...baseProps} id='cowork' label='Cowork' />);
    // The first <span> inside the button is the AssistantIconTile.
    const tile = container.querySelector('button > span') as HTMLElement | null;
    expect(tile).toBeTruthy();
    expect(tile?.style.backgroundColor).toContain('249');
  });

  it('paints non-cowork tiles with the category palette (write → violet)', () => {
    const { container } = render(<QuickLaunchCard {...baseProps} />);
    const tile = container.querySelector('button > span') as HTMLElement | null;
    expect(tile?.style.backgroundColor).toContain('139');
  });

  it('sets data-quicklaunch-id for E2E targeting', () => {
    const { container } = render(<QuickLaunchCard {...baseProps} />);
    expect(container.querySelector('button')?.getAttribute('data-quicklaunch-id')).toBe('write-copy');
  });
});
