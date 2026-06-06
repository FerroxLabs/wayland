/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// vi.hoisted so the mock functions exist when vi.mock factories run.
const ipcMock = vi.hoisted(() => ({
  countActive: vi.fn<() => Promise<number>>(),
  findAllActive: vi.fn<(arg: unknown) => Promise<unknown>>(),
  sessionChangedOn: vi.fn<(handler: () => void) => () => void>(),
}));

let sessionChangedHandler: (() => void) | null = null;

vi.mock('@/common', () => ({
  ipcBridge: {
    workflow: {
      countActive: { invoke: ipcMock.countActive },
      findAllActive: { invoke: ipcMock.findAllActive },
      sessionChanged: { on: ipcMock.sessionChangedOn },
    },
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) => (opts?.count !== undefined ? `${key}:${opts.count}` : key),
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { SiderWorkflowsSection } from '@renderer/components/layout/Sider/SiderAccordion/SiderWorkflowsSection';
import { ACCORDION_STORAGE_KEY } from '@renderer/components/layout/Sider/SiderAccordion/useSiderAccordionState';

function makeSession(overrides: {
  id: string;
  workflow_title?: string;
  workflow_name?: string;
  conversation_id?: string;
  current_step?: number;
  total_steps?: number;
}) {
  return {
    session: {
      id: overrides.id,
      workflow_name: overrides.workflow_name ?? 'wf-name',
      workflow_title: overrides.workflow_title ?? 'Workflow Title',
      conversation_id: overrides.conversation_id ?? `conv-${overrides.id}`,
      current_step: overrides.current_step ?? 1,
      total_steps: overrides.total_steps ?? 3,
      steps: [],
      skills: [],
      asks: [],
      status: 'active' as const,
      palette: null,
      category: null,
      created_at: 0,
      updated_at: 0,
      completed_at: null,
      begin_sent_at: null,
    },
    conversation_preview: '',
  };
}

function renderSection(collapsed = false) {
  return render(
    <MemoryRouter>
      <SiderWorkflowsSection collapsed={collapsed} />
    </MemoryRouter>
  );
}

function setAccordionOpen(open: boolean) {
  localStorage.setItem(
    ACCORDION_STORAGE_KEY,
    JSON.stringify({ scheduled: false, workflows: open, teams: false })
  );
}

describe('SiderWorkflowsSection', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    localStorage.clear();
    sessionChangedHandler = null;
    ipcMock.sessionChangedOn.mockImplementation((handler: () => void) => {
      sessionChangedHandler = handler;
      return () => {
        sessionChangedHandler = null;
      };
    });
    ipcMock.countActive.mockResolvedValue(0);
    ipcMock.findAllActive.mockResolvedValue({ sessions: [] });
  });

  it('hide-when-empty: renders nothing when count is 0 (expanded mode)', async () => {
    vi.useFakeTimers();
    ipcMock.countActive.mockResolvedValue(0);
    const { container } = renderSection();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    // Entire section absent - TopZone "Workflows" entry covers discover/create.
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('sider.accordion.workflows')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sider-accordion-badge')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('hide-when-empty: renders nothing when count is 0 (collapsed mode)', async () => {
    vi.useFakeTimers();
    ipcMock.countActive.mockResolvedValue(0);
    const { container } = renderSection(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    // No redundant icon - TopZone "Workflows" icon serves nav at all times.
    expect(container.firstChild).toBeNull();
    vi.useRealTimers();
  });

  it('shows live-styled badge when countActive returns > 0', async () => {
    vi.useFakeTimers();
    ipcMock.countActive.mockResolvedValue(3);
    renderSection();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    const badge = screen.getByTestId('sider-accordion-badge');
    expect(badge).toHaveTextContent('3');
    expect(badge.className).toMatch(/live/);
  });

  it('refreshes count when sessionChanged emitter fires (debounced)', async () => {
    vi.useFakeTimers();
    ipcMock.countActive.mockResolvedValue(1);
    renderSection();
    // Initial debounced refresh
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    expect(ipcMock.countActive).toHaveBeenCalledTimes(1);

    ipcMock.countActive.mockResolvedValue(2);
    act(() => {
      sessionChangedHandler?.();
    });
    // Still pending inside the debounce window
    expect(ipcMock.countActive).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    expect(ipcMock.countActive).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('sider-accordion-badge')).toHaveTextContent('2');
  });

  it('debounces a burst of sessionChanged events into a single invocation', async () => {
    vi.useFakeTimers();
    ipcMock.countActive.mockResolvedValue(0);
    renderSection();
    // Burn the initial debounced refresh.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    expect(ipcMock.countActive).toHaveBeenCalledTimes(1);

    // 5 events within 100ms (well under the 300ms debounce window).
    act(() => {
      for (let i = 0; i < 5; i += 1) {
        sessionChangedHandler?.();
      }
    });
    // No flush yet inside the debounce window.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(ipcMock.countActive).toHaveBeenCalledTimes(1);
    // Flush the trailing call.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(ipcMock.countActive).toHaveBeenCalledTimes(2);
  });

  it('does not call findAllActive while the accordion is closed; calls it when opened', async () => {
    // Closed branch - real timers, just wait for debounce to flush naturally.
    ipcMock.countActive.mockResolvedValue(1);
    ipcMock.findAllActive.mockResolvedValue({
      sessions: [makeSession({ id: 's1', workflow_title: 'Demo WF' })],
    });
    const { unmount } = renderSection();
    await waitFor(() => expect(ipcMock.countActive).toHaveBeenCalled());
    expect(ipcMock.findAllActive).not.toHaveBeenCalled();
    unmount();

    // Open branch - remount with accordion-open state seeded.
    setAccordionOpen(true);
    renderSection();
    await waitFor(() => expect(ipcMock.findAllActive).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId('workflow-row-s1')).toBeInTheDocument());
  });

  it('navigates with workflowSessionId state when an in-flight row is clicked', async () => {
    setAccordionOpen(true);
    ipcMock.countActive.mockResolvedValue(1);
    ipcMock.findAllActive.mockResolvedValue({
      sessions: [
        makeSession({
          id: 's-abc',
          workflow_title: 'Demo WF',
          conversation_id: 'conv-xyz',
          current_step: 2,
          total_steps: 4,
        }),
      ],
    });
    renderSection();
    const row = await screen.findByTestId('workflow-row-s-abc');
    fireEvent.click(row);
    expect(mockNavigate).toHaveBeenCalledWith('/conversation/conv-xyz', {
      state: { workflowSessionId: 's-abc' },
    });
  });

  it('does not navigate when conversationId is missing (preset launch defer guard)', async () => {
    setAccordionOpen(true);
    ipcMock.countActive.mockResolvedValue(1);
    ipcMock.findAllActive.mockResolvedValue({
      sessions: [
        makeSession({
          id: 's-pending',
          workflow_title: 'Pending WF',
          conversation_id: '',
        }),
      ],
    });
    renderSection();
    await waitFor(() => expect(screen.getByTestId('workflow-row-s-pending')).toBeInTheDocument(), {
      timeout: 3000,
    });
    mockNavigate.mockClear();
    fireEvent.click(screen.getByTestId('workflow-row-s-pending'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('collapsed mode with count > 0 renders an icon-only button (not the accordion shell)', async () => {
    vi.useFakeTimers();
    ipcMock.countActive.mockResolvedValue(2);
    renderSection(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    // The collapsed branch renders a plain <button>, not the accordion shell.
    expect(screen.queryByTestId('sider-workflows-section')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Workflows \(2 in-flight\)/ })).toBeInTheDocument();
    vi.useRealTimers();
  });
});
