/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Build #116 (workflow rail merge). The workflow step rail no longer lives in a
 * second fixed 280px rail; it is portaled into ChatLayout's single collapsible
 * right sider, shown as Arco Tabs "Steps | Workspace" via WorkflowTabbedSider.
 *
 * These tests cover the two moving parts:
 *  - WorkflowTabbedSider renders the Steps tab always and the Workspace tab only
 *    when a workspace node is supplied; Steps hosts the rail-slot host.
 *  - WorkflowRailSlot's portal bridge: a consumer reading useWorkflowRailSlot()
 *    can createPortal into the slot host mounted by the sider, and the default
 *    (no provider) context reports hasSlotHost=false so legacy inline mounts work.
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string } & Record<string, unknown>) => opts?.defaultValue ?? _key,
    i18n: { language: 'en-US' },
  }),
}));

import WorkflowTabbedSider from '@renderer/pages/guid/components/workflow/WorkflowTabbedSider';
import {
  WorkflowRailSlotProvider,
  useWorkflowRailSlot,
} from '@renderer/pages/guid/components/workflow/WorkflowRailSlot';

/**
 * Stand-in for WorkflowSurface's rail: reads the slot from context and, once the
 * Steps tab has registered its host element, portals a marker into it. Context
 * flows through the portal, exactly like the real rail keeping its session.
 */
const PortalingRail: React.FC = () => {
  const { slotEl } = useWorkflowRailSlot();
  if (!slotEl) return null;
  return createPortal(<div data-testid='portaled-rail'>RAIL</div>, slotEl);
};

/** Probe that surfaces the raw context so we can assert the default/no-provider case. */
const SlotProbe: React.FC = () => {
  const { hasSlotHost } = useWorkflowRailSlot();
  return <div>{hasSlotHost ? <span>has-host</span> : <span>legacy-inline</span>}</div>;
};

describe('WorkflowTabbedSider (Build #116)', () => {
  it('renders BOTH Steps and Workspace tabs, and shows workspace content when its tab is active', () => {
    render(<WorkflowTabbedSider workspace={<div data-testid='workspace-body'>WORKSPACE</div>} />);

    // Both tab titles are always present in the tab strip.
    expect(screen.getByText('Steps')).toBeInTheDocument();
    expect(screen.getByText('Workspace')).toBeInTheDocument();

    // Activate the Workspace tab, then assert its node rendered.
    fireEvent.click(screen.getByText('Workspace'));
    expect(screen.getByTestId('workspace-body')).toHaveTextContent('WORKSPACE');
  });

  it('renders only the Steps tab when no workspace is provided', () => {
    render(<WorkflowTabbedSider />);

    expect(screen.getByText('Steps')).toBeInTheDocument();
    expect(screen.queryByText('Workspace')).not.toBeInTheDocument();
  });

  it('mounts the rail-slot host inside the Steps tab', () => {
    render(<WorkflowTabbedSider workspace={<div>WORKSPACE</div>} />);
    expect(screen.getByTestId('workflow-rail-slot-host')).toBeInTheDocument();
  });

  it('portals a consumer-rendered rail into the sider slot host (round-trip through context)', async () => {
    render(
      <WorkflowRailSlotProvider>
        <WorkflowTabbedSider workspace={<div>WORKSPACE</div>} />
        <PortalingRail />
      </WorkflowRailSlotProvider>
    );

    // Slot registration happens on the host's ref callback after mount.
    await waitFor(() => {
      expect(screen.getByTestId('portaled-rail')).toBeInTheDocument();
    });

    // The marker must land INSIDE the slot host, not merely somewhere on the page.
    const host = screen.getByTestId('workflow-rail-slot-host');
    expect(host.querySelector('[data-testid="portaled-rail"]')).not.toBeNull();
    expect(host).toHaveTextContent('RAIL');
  });

  it('useWorkflowRailSlot defaults to hasSlotHost=false with no provider (legacy inline branch)', () => {
    render(<SlotProbe />);
    expect(screen.getByText('legacy-inline')).toBeInTheDocument();
    expect(screen.queryByText('has-host')).not.toBeInTheDocument();
  });
});
