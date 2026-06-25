/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'en-US' },
  }),
}));

vi.mock('@arco-design/web-react', () => {
  const Button = ({
    children,
    icon,
    onClick,
    ...rest
  }: React.PropsWithChildren<{
    icon?: React.ReactNode;
    onClick?: () => void;
    [k: string]: unknown;
  }>) => (
    <button onClick={onClick} aria-label={rest['aria-label'] as string | undefined}>
      {icon}
      {children}
    </button>
  );

  const Radio = ({
    children,
    value: _v,
  }: React.PropsWithChildren<{ value?: string }>) => <span>{children}</span>;
  Radio.Group = ({
    children,
    onChange,
    value,
  }: React.PropsWithChildren<{ onChange?: (v: string) => void; value?: string }>) => (
    <div data-testid='radio-group' data-value={value}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        const props = child.props as { value?: string; children?: React.ReactNode };
        return (
          <button
            data-testid={`radio-${props.value}`}
            onClick={() => onChange?.(props.value as string)}
          >
            {props.children}
          </button>
        );
      })}
    </div>
  );

  return { Button, Radio };
});

import { WorkflowHeader } from '@/renderer/pages/guid/components/workflow/WorkflowHeader';
import type { WorkflowSession } from '@/common/types/workflowTypes';

const NOW = 1_700_000_000_000;

const baseSession = (overrides: Partial<WorkflowSession> = {}): WorkflowSession => ({
  id: 'sess-1',
  workflow_name: 'automate-business-workflows',
  workflow_title: 'Automate Business Workflows',
  conversation_id: 'conv-1',
  current_step: 3,
  total_steps: 6,
  steps: [
    {
      n: 1,
      title: 'Audit current manual processes',
      body_excerpt: '',
      status: 'done',
      started_at: null,
      completed_at: null,
      eta_seconds: null,
      eta_source: null,
      autonomous_run: null,
    },
    {
      n: 2,
      title: 'Identify automation opportunities',
      body_excerpt: '',
      status: 'done',
      started_at: null,
      completed_at: null,
      eta_seconds: null,
      eta_source: null,
      autonomous_run: null,
    },
    {
      n: 3,
      title: 'Choose the right automation tool',
      body_excerpt: '',
      status: 'now',
      started_at: null,
      completed_at: null,
      eta_seconds: null,
      eta_source: null,
      autonomous_run: null,
    },
  ],
  skills: [
    { slug: 'workflow-designer', display_name: 'Workflow Designer', icon: null, description: '' },
    { slug: 'process-mapper', display_name: 'Process Mapper', icon: null, description: '' },
  ],
  asks: [],
  status: 'active',
  palette: null,
  category: 'Business Operations',
  created_at: NOW - 4 * 60 * 1000, // 4 minutes ago
  updated_at: NOW,
  completed_at: null,
  begin_sent_at: null,
  run_mode: 'running',
  interactivity: 'step',
  ...overrides,
});

describe('WorkflowHeader', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  it('renders the workflow title, step counter, and two control buttons', () => {
    render(
      <WorkflowHeader
        session={baseSession()}
        paused={false}
        onPauseToggle={vi.fn()}
        onEnd={vi.fn()}
        onDelete={vi.fn()}
        onSetInteractivity={vi.fn()}
      />
    );

    expect(screen.getByText('Automate Business Workflows')).toBeTruthy();
    expect(screen.getByText(/Step 3 of 6/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Pause$/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /End workflow/i })).toBeTruthy();
  });

  it('fires onPauseToggle when the pause button is clicked', () => {
    const onPauseToggle = vi.fn();
    render(
      <WorkflowHeader
        session={baseSession()}
        paused={false}
        onPauseToggle={onPauseToggle}
        onEnd={vi.fn()}
        onDelete={vi.fn()}
        onSetInteractivity={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /^Pause$/i }));
    expect(onPauseToggle).toHaveBeenCalledTimes(1);
  });

  it('fires onEnd when the end button is clicked', () => {
    const onEnd = vi.fn();
    render(
      <WorkflowHeader
        session={baseSession()}
        paused={false}
        onPauseToggle={vi.fn()}
        onEnd={onEnd}
        onDelete={vi.fn()}
        onSetInteractivity={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /End workflow/i }));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('flips the pause button label to "Resume" when paused', () => {
    render(
      <WorkflowHeader
        session={baseSession()}
        paused={true}
        onPauseToggle={vi.fn()}
        onEnd={vi.fn()}
        onDelete={vi.fn()}
        onSetInteractivity={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /^Resume$/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Pause$/i })).toBeNull();
  });

  it('calls onSetInteractivity when the interactivity toggle is changed', () => {
    const onSetInteractivity = vi.fn();
    render(
      <WorkflowHeader
        session={baseSession()}
        paused={false}
        onPauseToggle={vi.fn()}
        onEnd={vi.fn()}
        onDelete={vi.fn()}
        onSetInteractivity={onSetInteractivity}
      />
    );

    fireEvent.click(screen.getByTestId('radio-auto'));
    expect(onSetInteractivity).toHaveBeenCalledWith('auto');
  });

  it('applies the errored class when status === "errored"', () => {
    const { container } = render(
      <WorkflowHeader
        session={baseSession({ status: 'errored' })}
        paused={false}
        onPauseToggle={vi.fn()}
        onEnd={vi.fn()}
        onDelete={vi.fn()}
        onSetInteractivity={vi.fn()}
      />
    );

    const root = container.querySelector('[data-testid="workflow-header"]');
    expect(root).toBeTruthy();
    expect(root?.className).toMatch(/errored/i);
  });

  it('collapses to a single completion summary when status === "complete"', () => {
    const session = baseSession({
      status: 'complete',
      completed_at: NOW,
      created_at: NOW - (14 * 60 + 32) * 1000, // 14:32 duration
    });
    render(
      <WorkflowHeader
        session={session}
        paused={false}
        onPauseToggle={vi.fn()}
        onEnd={vi.fn()}
        onDelete={vi.fn()}
        onSetInteractivity={vi.fn()}
      />
    );

    // Completion summary visible
    expect(screen.getByText(/Completed in 14:32/)).toBeTruthy();
    // Controls hidden in collapsed state
    expect(screen.queryByRole('button', { name: /^Pause$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /End workflow/i })).toBeNull();
  });

  it('renders skill chip names without a checkmark and collapsed by default; expands on click', () => {
    render(
      <WorkflowHeader
        session={baseSession()}
        paused={false}
        onPauseToggle={vi.fn()}
        onEnd={vi.fn()}
        onDelete={vi.fn()}
        onSetInteractivity={vi.fn()}
      />
    );

    // Collapsed: chips not in DOM yet
    expect(screen.queryByText('Workflow Designer')).toBeNull();

    // Expand toggle present
    const toggle = screen.getByTestId('workflow-header-skills-toggle');
    fireEvent.click(toggle);

    const chip1 = screen.getByText('Workflow Designer');
    const chip2 = screen.getByText('Process Mapper');
    expect(chip1).toBeTruthy();
    expect(chip2).toBeTruthy();
    // No checkmark character in chip labels (per cut §14)
    expect(chip1.textContent).not.toContain('✓');
    expect(chip2.textContent).not.toContain('✓');
  });
});
