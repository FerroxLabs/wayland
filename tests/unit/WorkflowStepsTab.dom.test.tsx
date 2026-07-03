/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { WorkflowSession } from '../../src/common/types/workflowTypes';
import { WorkflowStepsTab } from '../../src/renderer/pages/guid/components/workflow/WorkflowStepsTab';

// react-i18next isn't initialised in DOM tests - return the provided
// defaultValue (or the key) so the rail/status/complete strings render.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string } & Record<string, unknown>) => opts?.defaultValue ?? key,
  }),
}));

// WorkflowCompleteCard pulls in the heavy Markdown renderer; stub it.
vi.mock('@/renderer/components/Markdown', () => ({
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

const makeSession = (overrides: Partial<WorkflowSession> = {}): WorkflowSession => ({
  id: 'sess-1',
  workflow_name: 'demo',
  workflow_title: 'Demo Workflow',
  conversation_id: 'conv-1',
  current_step: 1,
  total_steps: 2,
  steps: [
    {
      n: 1,
      title: 'First step',
      body_excerpt: '',
      status: 'now',
      started_at: null,
      completed_at: null,
      eta_seconds: null,
      eta_source: null,
      autonomous_run: null,
    },
    {
      n: 2,
      title: 'Second step',
      body_excerpt: '',
      status: 'todo',
      started_at: null,
      completed_at: null,
      eta_seconds: null,
      eta_source: null,
      autonomous_run: null,
    },
  ],
  skills: [],
  asks: [],
  status: 'active',
  palette: null,
  category: null,
  created_at: Date.now(),
  updated_at: Date.now(),
  completed_at: null,
  begin_sent_at: Date.now(),
  run_mode: 'running',
  interactivity: 'step',
  ...overrides,
});

describe('WorkflowStepsTab', () => {
  it('renders nothing when there is no session', () => {
    const { container } = render(
      <WorkflowStepsTab session={null} needsInput={false} onJumpToStep={vi.fn()} onLaunchWorkflow={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the step rail and status bar for an active session', () => {
    render(
      <WorkflowStepsTab session={makeSession()} needsInput={false} onJumpToStep={vi.fn()} onLaunchWorkflow={vi.fn()} />
    );
    expect(screen.getByTestId('workflow-step-rail')).toBeInTheDocument();
    expect(screen.getByTestId('workflow-status-bar')).toBeInTheDocument();
    expect(screen.queryByTestId('workflow-complete-card')).not.toBeInTheDocument();
  });

  it('renders the complete card instead of the rail when the session is complete', () => {
    render(
      <WorkflowStepsTab
        session={makeSession({ status: 'complete', completed_at: Date.now() })}
        needsInput={false}
        onJumpToStep={vi.fn()}
        onLaunchWorkflow={vi.fn()}
      />
    );
    expect(screen.getByTestId('workflow-complete-card')).toBeInTheDocument();
    expect(screen.queryByTestId('workflow-step-rail')).not.toBeInTheDocument();
  });

  it('invokes onJumpToStep when a step row is clicked', () => {
    const onJumpToStep = vi.fn();
    render(
      <WorkflowStepsTab
        session={makeSession()}
        needsInput={false}
        onJumpToStep={onJumpToStep}
        onLaunchWorkflow={vi.fn()}
      />
    );
    const rows = screen.getAllByTestId('workflow-step-rail-row');
    fireEvent.click(rows[1]);
    expect(onJumpToStep).toHaveBeenCalledWith(2);
  });

  it('marks the current step as awaiting input when needsInput is true', () => {
    render(<WorkflowStepsTab session={makeSession()} needsInput onJumpToStep={vi.fn()} onLaunchWorkflow={vi.fn()} />);
    const rows = screen.getAllByTestId('workflow-step-rail-row');
    expect(rows[0]).toHaveAttribute('data-needsinput', 'true');
  });

  it('runs onLaunchWorkflow with the session workflow_name from the complete card Run again CTA', () => {
    const onLaunchWorkflow = vi.fn();
    render(
      <WorkflowStepsTab
        session={makeSession({ status: 'complete', workflow_name: 'demo', completed_at: Date.now() })}
        needsInput={false}
        onJumpToStep={vi.fn()}
        onLaunchWorkflow={onLaunchWorkflow}
      />
    );
    // The complete card's primary CTA is a button; clicking it re-launches.
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);
    expect(onLaunchWorkflow).toHaveBeenCalledWith('demo');
  });
});
