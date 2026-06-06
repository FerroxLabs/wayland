/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Task 3.3 - DOM tests for the SiderMemoryEntry navigation row.
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

// Wave 7 H4: the entry now resolves its label via `useTranslation()`. Mock
// react-i18next so the test asserts on the i18n key path explicitly - if the
// component is wired to a wrong key, the test fails. Mirrors the pattern used
// by other Sider sub-component DOM tests.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// The entry uses react-router-dom's useLocation/useNavigate to highlight the
// active route. Mock them so the component renders outside a <Router>. The
// pathname is held in a hoisted object so individual tests can drive the
// route-derived active styling.
const routerState = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: routerState.pathname }),
  useNavigate: () => vi.fn(),
}));

// The entry fetches the wiki orphan count on mount; stub the bridge so the
// effect resolves quietly in jsdom.
vi.mock('@/common/adapter/ipcBridge', () => ({
  wiki: {
    getState: { invoke: vi.fn().mockResolvedValue({ orphanCandidates: [] }) },
    stateChanged: { on: vi.fn(() => () => undefined) },
  },
}));

// eslint-disable-next-line import/first
import SiderMemoryEntry from '@renderer/components/layout/Sider/SiderNav/SiderMemoryEntry';
// eslint-disable-next-line import/first
import type { SiderTooltipProps } from '@renderer/utils/ui/siderTooltip';

const tooltipProps: SiderTooltipProps = {
  trigger: 'hover',
  disabled: true,
};

afterEach(() => {
  cleanup();
});

describe('SiderMemoryEntry', () => {
  // Wave 7 H4: assertion is now on the i18n key path. The mocked t() returns
  // the key, so the rendered text is `sider.memory` - proves the component
  // resolves through i18n instead of a hardcoded literal.
  it('renders the sider.memory label when expanded', () => {
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
    expect(screen.getByText('sider.memory')).toBeTruthy();
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
    expect(screen.queryByText('sider.memory')).toBeNull();
  });

  it('toggles the expandable children when the parent row is clicked', () => {
    localStorage.removeItem('wayland.sidebar.memory.expanded');
    routerState.pathname = '/';
    render(<SiderMemoryEntry isMobile={false} isActive={false} collapsed={false} siderTooltipProps={tooltipProps} />);
    const row = screen.getByTestId('sider-memory-entry');
    // Starts collapsed (not on a memory/wiki route): no child rows yet.
    expect(row.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByTestId('sider-memory-archive-entry')).toBeNull();
    // Clicking the parent expands and reveals the Archive + Wiki children.
    fireEvent.click(row);
    expect(row.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('sider-memory-archive-entry')).toBeTruthy();
    expect(screen.getByTestId('sider-memory-wiki-entry')).toBeTruthy();
  });

  it('highlights the Archive child with primary styling when on the /memory route', () => {
    localStorage.removeItem('wayland.sidebar.memory.expanded');
    // On a memory route the group auto-expands and the matching child row
    // takes the primary-tinted active styling.
    routerState.pathname = '/memory';
    render(<SiderMemoryEntry isMobile={false} isActive collapsed={false} siderTooltipProps={tooltipProps} />);
    const archive = screen.getByTestId('sider-memory-archive-entry');
    expect(archive.className).toContain('text-primary');
    routerState.pathname = '/';
  });
});
