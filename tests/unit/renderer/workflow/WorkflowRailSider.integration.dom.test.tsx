/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Build #116 regression guard. The workflow Steps rail was moved into
 * ChatLayout's single collapsible right sider. That sider defaults COLLAPSED
 * (useWorkspaceCollapse) and only auto-expands on a workspace files event - which
 * a workspace-DISABLED workflow never fires - so the Steps rail was hidden by
 * default until the user manually toggled it.
 *
 * The existing WorkflowTabbedSider tests render the sider in ISOLATION (no
 * ChatLayout), so they never exercise the collapse default and missed this. This
 * test mounts WorkflowTabbedSider INSIDE the real ChatLayout, exactly as the
 * workflow panels do (workspaceEnabled + stepsRailSider + hideHeader, no
 * workspace node), and asserts the Steps rail is VISIBLE (sider expanded) by
 * default - and that without stepsRailSider it would be collapsed (the bug).
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// jsdom lacks matchMedia; detectMobileViewportOrTouch calls it on the collapsed path.
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

// i18n: echo the provided defaultValue so tab titles / labels resolve.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string } & Record<string, unknown>) => opts?.defaultValue ?? _key,
    i18n: { language: 'en-US' },
  }),
}));

// Keep the runtime deterministic + desktop.
vi.mock('@/renderer/utils/platform', () => ({ isElectronDesktop: () => false }));
vi.mock('@/renderer/hooks/system/useIsPopoutMode', () => ({ useIsPopoutMode: () => false }));

// Contexts ChatLayout consumes that throw without a provider.
vi.mock('@/renderer/pages/conversation/hooks/ConversationTabsContext', () => ({
  useConversationTabs: () => ({ openTabs: [], updateTabName: vi.fn() }),
}));
vi.mock('@/renderer/pages/conversation/Preview', () => ({
  usePreviewContext: () => ({ isOpen: false }),
  PreviewPanel: () => null,
}));

// Peripheral deps we do not exercise here.
vi.mock('swr', () => ({ default: () => ({ data: undefined }) }));
vi.mock('@/common', () => ({ ipcBridge: { conversation: { dockBack: { invoke: vi.fn() } } } }));
vi.mock('@/common/config/storage', () => ({ ConfigStorage: { get: vi.fn() } }));

// Header-only children (not rendered under hideHeader) - stub to avoid deep import chains.
vi.mock('@/renderer/components/agent/AgentBadge', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/components/ConversationTabs', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/components/ChatTitleEditor', () => ({ default: () => null }));
vi.mock('@/renderer/pages/conversation/components/ConversationTitleMinimap', () => ({ default: () => null }));

import ChatLayout from '@renderer/pages/conversation/components/ChatLayout';
import WorkflowTabbedSider from '@renderer/pages/guid/components/workflow/WorkflowTabbedSider';
import {
  WorkflowRailSlotProvider,
  useWorkflowRailSlot,
} from '@renderer/pages/guid/components/workflow/WorkflowRailSlot';

/** Stand-in for WorkflowSurface's rail: portals a marker into the sider's Steps slot. */
const PortalingRail: React.FC = () => {
  const { slotEl } = useWorkflowRailSlot();
  if (!slotEl) return null;
  return createPortal(<div data-testid='portaled-rail'>RAIL</div>, slotEl);
};

/** Mount the tabbed sider inside ChatLayout the way the workflow panels do. */
function renderWorkflowLayout({ stepsRailSider }: { stepsRailSider: boolean }) {
  return render(
    <WorkflowRailSlotProvider>
      <ChatLayout
        title='Workflow run'
        // Workspace-DISABLED workflow: no workspace node -> Workspace tab omitted.
        sider={<WorkflowTabbedSider />}
        workspaceEnabled={true}
        conversationId='conv-workflow-1'
        hideHeader={true}
        stepsRailSider={stepsRailSider}
      >
        <PortalingRail />
      </ChatLayout>
    </WorkflowRailSlotProvider>
  );
}

function getSider(container: HTMLElement): HTMLElement {
  const sider = container.querySelector('.chat-layout-right-sider');
  if (!(sider instanceof HTMLElement)) throw new Error('right sider not rendered');
  return sider;
}

describe('Workflow Steps rail inside ChatLayout (Build #116 regression)', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it('shows the Steps rail EXPANDED by default for a workspace-disabled workflow', async () => {
    const { container } = renderWorkflowLayout({ stepsRailSider: true });

    // Steps tab renders; Workspace tab is absent (no workspace node).
    expect(screen.getByText('Steps')).toBeInTheDocument();
    expect(screen.queryByText('Workspace')).not.toBeInTheDocument();

    const sider = getSider(container);
    // Expanded sider -> min-width 220px (collapsed would be 0px). This is the fix.
    expect(sider.style.minWidth).toBe('220px');

    // The Steps slot host lives inside the sider and receives the portaled rail,
    // proving the rail is actually visible (not hidden behind a collapsed panel).
    const host = screen.getByTestId('workflow-rail-slot-host');
    expect(sider.contains(host)).toBe(true);
    await waitFor(() => expect(screen.getByTestId('portaled-rail')).toBeInTheDocument());
    expect(host).toHaveTextContent('RAIL');
  });

  it('regression contrast: without stepsRailSider the same sider defaults COLLAPSED', () => {
    const { container } = renderWorkflowLayout({ stepsRailSider: false });

    const sider = getSider(container);
    // The pre-fix behavior: the shared default hides the rail (min-width 0px).
    expect(sider.style.minWidth).toBe('0px');
  });

  it('honors an explicit per-conversation collapse preference over the expanded default', () => {
    globalThis.localStorage.setItem('workspace-preference-conv-workflow-1', 'collapsed');

    const { container } = renderWorkflowLayout({ stepsRailSider: true });

    const sider = getSider(container);
    expect(sider.style.minWidth).toBe('0px');
  });
});
