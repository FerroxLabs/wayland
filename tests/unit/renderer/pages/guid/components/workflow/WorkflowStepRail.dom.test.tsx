/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * W3.C - DOM tests for WorkflowStepRail. Covers the SPEC §5.3 contract:
 * step list rendering, click-to-jump, the Run-autonomously confirmation
 * modal, manual-mode title flip, running-row treatment, and the rules
 * around which steps expose the ▶ Run autonomously control.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string } & Record<string, unknown>) => {
      const fallback = opts?.defaultValue ?? '';
      if (!opts) return fallback;
      // Minimal {{key}} interpolation so default-value strings like
      // "Run Step {{n}} autonomously?" render with their substituted values
      // exactly the way react-i18next would in the app.
      return fallback.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
        opts[name] != null ? String(opts[name]) : ''
      );
    },
  }),
}));

vi.mock('@arco-design/web-react', () => {
  const Button = ({
    children,
    icon,
    onClick,
    loading: _loading,
    type: _type,
    ...rest
  }: React.PropsWithChildren<{
    icon?: React.ReactNode;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    loading?: boolean;
    type?: string;
    [k: string]: unknown;
  }>) => (
    <button onClick={onClick} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {icon}
      {children}
    </button>
  );

  type ModalLike = React.FC<
    React.PropsWithChildren<{
      visible?: boolean;
      title?: React.ReactNode;
      onOk?: () => void;
      onCancel?: () => void;
      okText?: React.ReactNode;
      cancelText?: React.ReactNode;
    }>
  > & {
    confirm?: (...args: unknown[]) => void;
  };

  const Modal: ModalLike = ({ visible, title, children, onOk, onCancel, okText, cancelText }) => {
    if (!visible) return null;
    return (
      <div role='dialog' aria-modal='true' data-testid='arco-modal'>
        <div>{title}</div>
        <div>{children}</div>
        <div>
          <button onClick={onCancel} data-testid='arco-modal-cancel'>
            {cancelText ?? 'Cancel'}
          </button>
          <button onClick={onOk} data-testid='arco-modal-ok'>
            {okText ?? 'OK'}
          </button>
        </div>
      </div>
    );
  };

  return { Button, Modal };
});

vi.mock('lucide-react', () => {
  const make = (label: string) => () => <span data-icon={label}>{label}</span>;
  return {
    Play: make('Play'),
    Loader2: make('Loader2'),
    CheckCircle2: make('CheckCircle2'),
    Circle: make('Circle'),
    CircleDot: make('CircleDot'),
    AlertCircle: make('AlertCircle'),
    MinusCircle: make('MinusCircle'),
  };
});

import type { WorkflowSession, StepState } from '@/common/types/workflowTypes';
import { WorkflowStepRail } from '@/renderer/pages/guid/components/workflow/WorkflowStepRail';

const buildStep = (overrides: Partial<StepState> & Pick<StepState, 'n'>): StepState => ({
  n: overrides.n,
  title: overrides.title ?? `Step ${overrides.n}`,
  body_excerpt: overrides.body_excerpt ?? '',
  status: overrides.status ?? 'todo',
  started_at: overrides.started_at ?? null,
  completed_at: overrides.completed_at ?? null,
  eta_seconds: overrides.eta_seconds ?? null,
  eta_source: overrides.eta_source ?? null,
  autonomous_run: overrides.autonomous_run ?? null,
});

const buildSession = (steps: StepState[]): WorkflowSession => ({
  id: 'session-abc',
  workflow_name: 'automate-business-workflows',
  workflow_title: 'Automate Business Workflows',
  conversation_id: 'conv-1',
  current_step: steps.find((s) => s.status === 'now')?.n ?? 1,
  total_steps: steps.length,
  steps,
  skills: [],
  asks: [],
  status: 'active',
  palette: 'business-ops',
  category: 'Business Operations',
  created_at: 0,
  updated_at: 0,
  completed_at: null,
});

const SIX_STEP_SESSION = (): WorkflowSession =>
  buildSession([
    buildStep({
      n: 1,
      title: 'Audit current manual processes',
      status: 'done',
      started_at: 1_000,
      completed_at: 1_000 + 192_000,
    }),
    buildStep({
      n: 2,
      title: 'Identify automation opportunities',
      status: 'done',
      started_at: 2_000,
      completed_at: 2_000 + 108_000,
    }),
    buildStep({
      n: 3,
      title: 'Choose the right automation tool',
      status: 'now',
      started_at: Date.now() - 60_000,
      eta_seconds: 240,
      eta_source: 'author',
    }),
    buildStep({
      n: 4,
      title: 'Build the workflow',
      status: 'todo',
      eta_seconds: 360,
      eta_source: 'heuristic',
    }),
    buildStep({ n: 5, title: 'Test & iterate', status: 'todo' }),
    buildStep({ n: 6, title: 'Measure ROI & monitor', status: 'todo' }),
  ]);

describe('WorkflowStepRail', () => {
  it('renders one row per step', () => {
    const session = SIX_STEP_SESSION();
    render(<WorkflowStepRail session={session} onJumpToStep={vi.fn()} onRunAutonomously={vi.fn()} />);

    const rows = screen.getAllByTestId('workflow-step-rail-row');
    expect(rows).toHaveLength(6);
    expect(screen.getByText('Audit current manual processes')).toBeInTheDocument();
    expect(screen.getByText('Measure ROI & monitor')).toBeInTheDocument();
  });

  it('renders the auto-driven title strip by default', () => {
    const session = SIX_STEP_SESSION();
    render(<WorkflowStepRail session={session} onJumpToStep={vi.fn()} onRunAutonomously={vi.fn()} />);

    const title = screen.getByTestId('workflow-step-rail-title');
    expect(title).toHaveTextContent(/auto-driven/i);
    expect(screen.getByTestId('workflow-step-rail-mode-dot')).toHaveAttribute('data-mode', 'auto');
  });

  it('renders the manual title + amber dot when mode is manual', () => {
    const session = SIX_STEP_SESSION();
    render(
      <WorkflowStepRail
        session={session}
        mode='manual'
        onJumpToStep={vi.fn()}
        onRunAutonomously={vi.fn()}
      />
    );

    expect(screen.getByTestId('workflow-step-rail-title')).toHaveTextContent(/manual/i);
    expect(screen.getByTestId('workflow-step-rail-mode-dot')).toHaveAttribute('data-mode', 'manual');
  });

  it('calls onJumpToStep with the right n when a row is clicked', () => {
    const session = SIX_STEP_SESSION();
    const onJump = vi.fn();
    render(<WorkflowStepRail session={session} onJumpToStep={onJump} onRunAutonomously={vi.fn()} />);

    const rows = screen.getAllByTestId('workflow-step-rail-row');
    fireEvent.click(rows[3]); // step 4
    expect(onJump).toHaveBeenCalledWith(4);
  });

  it('does not show a ▶ Run autonomously button on done / skipped steps', () => {
    const session = SIX_STEP_SESSION();
    render(<WorkflowStepRail session={session} onJumpToStep={vi.fn()} onRunAutonomously={vi.fn()} />);

    const rows = screen.getAllByTestId('workflow-step-rail-row');
    // Step 1 is done - no run button
    expect(within(rows[0]).queryByTestId('workflow-step-rail-run-btn')).toBeNull();
    // Step 3 is now - run button present
    expect(within(rows[2]).getByTestId('workflow-step-rail-run-btn')).toBeInTheDocument();
    // Step 4 is todo - run button present
    expect(within(rows[3]).getByTestId('workflow-step-rail-run-btn')).toBeInTheDocument();
  });

  it('opens a confirmation modal when ▶ Run autonomously is clicked, and confirming fires onRunAutonomously', () => {
    const session = SIX_STEP_SESSION();
    const onRun = vi.fn();
    const onJump = vi.fn();
    render(<WorkflowStepRail session={session} onJumpToStep={onJump} onRunAutonomously={onRun} />);

    // Modal not visible yet
    expect(screen.queryByTestId('arco-modal')).toBeNull();

    const rows = screen.getAllByTestId('workflow-step-rail-row');
    const runBtn = within(rows[3]).getByTestId('workflow-step-rail-run-btn');
    fireEvent.click(runBtn);

    const dialog = screen.getByTestId('arco-modal');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent(/autonomous worker/i);
    expect(dialog).toHaveTextContent(/Step 4/);

    // Clicking the row's run button must NOT also fire onJumpToStep
    expect(onJump).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('arco-modal-ok'));
    expect(onRun).toHaveBeenCalledWith(4);
  });

  it('does not fire onRunAutonomously when the confirmation modal is cancelled', () => {
    const session = SIX_STEP_SESSION();
    const onRun = vi.fn();
    render(<WorkflowStepRail session={session} onJumpToStep={vi.fn()} onRunAutonomously={onRun} />);

    const rows = screen.getAllByTestId('workflow-step-rail-row');
    fireEvent.click(within(rows[4]).getByTestId('workflow-step-rail-run-btn'));

    fireEvent.click(screen.getByTestId('arco-modal-cancel'));
    expect(onRun).not.toHaveBeenCalled();
    expect(screen.queryByTestId('arco-modal')).toBeNull();
  });

  it('renders a running row (no ▶ button) when the step has an autonomous_run in running state', () => {
    const baseSteps = SIX_STEP_SESSION().steps;
    baseSteps[3] = {
      ...baseSteps[3],
      autonomous_run: {
        dispatch_id: 'dispatch-xyz',
        started_at: Date.now() - 45_000,
        state: 'running',
      },
    };
    const session = buildSession(baseSteps);

    render(<WorkflowStepRail session={session} onJumpToStep={vi.fn()} onRunAutonomously={vi.fn()} />);

    const rows = screen.getAllByTestId('workflow-step-rail-row');
    const runningRow = rows[3];
    expect(runningRow).toHaveAttribute('data-running', 'true');
    expect(within(runningRow).queryByTestId('workflow-step-rail-run-btn')).toBeNull();
    expect(within(runningRow).getByTestId('workflow-step-rail-running-label')).toHaveTextContent(
      /Running/i
    );
  });

  it('renders the children prop as the bottom slot', () => {
    const session = SIX_STEP_SESSION();
    render(
      <WorkflowStepRail
        session={session}
        onJumpToStep={vi.fn()}
        onRunAutonomously={vi.fn()}
      >
        <div data-testid='status-bar-slot'>status here</div>
      </WorkflowStepRail>
    );

    expect(screen.getByTestId('status-bar-slot')).toBeInTheDocument();
  });
});
