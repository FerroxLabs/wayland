/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import QuickLaunchRow from '@/renderer/pages/guid/components/newChatStarter/QuickLaunchRow';

describe('QuickLaunchRow', () => {
  const baseProps = { onAnchorClick: vi.fn(), onViewAll: vi.fn() };

  it('renders all 6 anchor cards', () => {
    const { container } = render(<QuickLaunchRow {...baseProps} />);
    expect(container.querySelectorAll('[data-quicklaunch-id]')).toHaveLength(6);
  });

  it('renders Cowork first', () => {
    const { container } = render(<QuickLaunchRow {...baseProps} />);
    expect(container.querySelector('[data-quicklaunch-id]')?.getAttribute('data-quicklaunch-id')).toBe('cowork');
  });

  it('routes card clicks to onAnchorClick with the anchor object', () => {
    const onAnchorClick = vi.fn();
    const { container } = render(<QuickLaunchRow {...baseProps} onAnchorClick={onAnchorClick} />);
    fireEvent.click(container.querySelector('[data-quicklaunch-id="write-copy"]') as HTMLButtonElement);
    expect(onAnchorClick).toHaveBeenCalledWith(expect.objectContaining({
      id: 'write-copy', label: 'Write copy', assistantId: 'ext-copy',
    }));
  });

  it('renders a View-all link that calls onViewAll', () => {
    const onViewAll = vi.fn();
    render(<QuickLaunchRow {...baseProps} onViewAll={onViewAll} />);
    fireEvent.click(screen.getByText(/view all/i));
    expect(onViewAll).toHaveBeenCalledTimes(1);
  });
});
