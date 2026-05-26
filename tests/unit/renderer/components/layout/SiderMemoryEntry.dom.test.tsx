/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Task 3.3 — DOM tests for the SiderMemoryEntry navigation row.
 *
 * Mirrors the patterns established by `SiderScheduledEntry` /
 * `SiderWorkflowsEntry` / `SiderTeamsEntry`:
 *   - Click invokes the supplied `onClick` handler.
 *   - Collapsed mode renders an icon-only row (tested via testid).
 *   - Expanded mode renders the literal label.
 *   - Active class is applied when `isActive` is true.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SiderMemoryEntry from '@renderer/components/layout/Sider/SiderNav/SiderMemoryEntry';
import type { SiderTooltipProps } from '@renderer/utils/ui/siderTooltip';

const tooltipProps: SiderTooltipProps = {
  trigger: 'hover',
  disabled: true,
};

afterEach(() => {
  cleanup();
});

describe('SiderMemoryEntry', () => {
  it('renders the Memory label when expanded', () => {
    render(
      <SiderMemoryEntry
        isMobile={false}
        isActive={false}
        collapsed={false}
        siderTooltipProps={tooltipProps}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByTestId('sider-memory-entry')).toBeTruthy();
    expect(screen.getByText('Memory')).toBeTruthy();
  });

  it('hides the label and renders icon-only when collapsed', () => {
    render(
      <SiderMemoryEntry
        isMobile={false}
        isActive={false}
        collapsed
        siderTooltipProps={tooltipProps}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByTestId('sider-memory-entry')).toBeTruthy();
    expect(screen.queryByText('Memory')).toBeNull();
  });

  it('invokes onClick when clicked', () => {
    const onClick = vi.fn();
    render(
      <SiderMemoryEntry
        isMobile={false}
        isActive={false}
        collapsed={false}
        siderTooltipProps={tooltipProps}
        onClick={onClick}
      />
    );
    fireEvent.click(screen.getByTestId('sider-memory-entry'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies the active styling when isActive is true', () => {
    render(
      <SiderMemoryEntry
        isMobile={false}
        isActive
        collapsed={false}
        siderTooltipProps={tooltipProps}
        onClick={vi.fn()}
      />
    );
    const node = screen.getByTestId('sider-memory-entry');
    // Active state uses the primary-tinted bg utility; matches the pattern
    // used in SiderScheduledEntry / SiderWorkflowsEntry / SiderTeamsEntry.
    expect(node.className).toContain('text-primary');
  });
});
