/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WorkflowStatusBar - live monospace status strip at the rail bottom.
 * SPEC §5.4 (STR 1).
 *
 * Verifies:
 *  - Renders all 5 segments when liveStats provided
 *  - Drops 🪙 + 💵 segments when liveStats omitted
 *  - ETA renders "-" when no steps are done yet
 *  - Hidden entirely when session.status === 'ended'
 *  - setInterval clears on unmount (no leaked timer ticks)
 *  - Elapsed updates live every second while status === 'active'
 */

import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('lucide-react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('lucide-react')>()),
  Clock: () => <span data-testid='icon-clock'>Clock</span>,
  Coins: () => <span data-testid='icon-coins'>Coins</span>,
  DollarSign: () => <span data-testid='icon-dollar'>DollarSign</span>,
}));

import { WorkflowStatusBar } from '@/renderer/pages/guid/components/workflow/WorkflowStatusBar';
import type { StepState, WorkflowSession, WorkflowSessionStatus } from '@/common/types/workflowTypes';

const makeStep = (n: number, status: StepState['status']): StepState => ({
  n,
  title: `Step ${n}`,
  body_excerpt: '',
  status,
  started_at: status === 'todo' ? null : 1000,
  completed_at: status === 'done' ? 2000 : null,
  eta_seconds: null,
  eta_source: null,
  autonomous_run: null,
});

const makeSession = (
  overrides: Partial<WorkflowSession> & { status?: WorkflowSessionStatus } = {}
): WorkflowSession => ({
  id: 's-1',
  workflow_name: 'demo',
  workflow_title: 'Demo Workflow',
  conversation_id: 'c-1',
  current_step: 2,
  total_steps: 4,
  steps: [makeStep(1, 'done'), makeStep(2, 'now'), makeStep(3, 'todo'), makeStep(4, 'todo')],
  skills: [],
  asks: [],
  status: 'active',
  palette: null,
  category: null,
  created_at: 0,
  updated_at: 0,
  completed_at: null,
  ...overrides,
});

describe('WorkflowStatusBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Anchor "now" at 65 seconds past session.created_at (= 0) so elapsed = 01:05.
    vi.setSystemTime(new Date(65_000));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders all five segments when liveStats is provided', () => {
    render(<WorkflowStatusBar session={makeSession()} liveStats={{ tokens: 12_345, spentCents: 187 }} />);

    expect(screen.getByTestId('workflow-status-bar')).toBeInTheDocument();
    expect(screen.getByText(/active/i)).toBeInTheDocument();
    expect(screen.getByText('01:05')).toBeInTheDocument();
    // 1 step done in 65s → 65s/step × 3 remaining = 195s = 03:15 ETA.
    expect(screen.getByText('~03:15')).toBeInTheDocument();
    expect(screen.getByText('12,345')).toBeInTheDocument();
    expect(screen.getByText('$1.87')).toBeInTheDocument();
  });

  it('drops the tokens and spend segments when liveStats is undefined', () => {
    render(<WorkflowStatusBar session={makeSession()} />);

    expect(screen.getByTestId('workflow-status-bar')).toBeInTheDocument();
    expect(screen.queryByTestId('icon-coins')).not.toBeInTheDocument();
    expect(screen.queryByTestId('icon-dollar')).not.toBeInTheDocument();
    expect(screen.queryByText(/\$\d/)).not.toBeInTheDocument();
  });

  it('renders "-" for ETA when no steps are done', () => {
    const session = makeSession({
      steps: [makeStep(1, 'now'), makeStep(2, 'todo'), makeStep(3, 'todo')],
      current_step: 1,
      total_steps: 3,
    });
    render(<WorkflowStatusBar session={session} />);

    expect(screen.getByTestId('workflow-status-bar-eta')).toHaveTextContent('-');
  });

  it('renders nothing when session.status === "ended"', () => {
    const { container } = render(
      <WorkflowStatusBar session={makeSession({ status: 'ended' })} liveStats={{ tokens: 1, spentCents: 1 }} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('updates elapsed every second while status is active', () => {
    render(<WorkflowStatusBar session={makeSession()} />);
    expect(screen.getByTestId('workflow-status-bar-elapsed')).toHaveTextContent('01:05');

    // Advancing fake timers also advances the system clock - Date.now()
    // tracks the fake clock. So +5000ms means elapsed should jump 5s to 01:10.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByTestId('workflow-status-bar-elapsed')).toHaveTextContent('01:10');

    act(() => {
      vi.advanceTimersByTime(55_000);
    });
    expect(screen.getByTestId('workflow-status-bar-elapsed')).toHaveTextContent('02:05');
  });

  it('clears its interval on unmount (no leaked ticks)', () => {
    const clearSpy = vi.spyOn(global, 'clearInterval');
    const { unmount } = render(<WorkflowStatusBar session={makeSession()} />);

    unmount();
    expect(clearSpy).toHaveBeenCalled();

    // Advancing time after unmount must not throw or update anything.
    act(() => {
      vi.setSystemTime(new Date(200_000));
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByTestId('workflow-status-bar')).not.toBeInTheDocument();
  });
});
