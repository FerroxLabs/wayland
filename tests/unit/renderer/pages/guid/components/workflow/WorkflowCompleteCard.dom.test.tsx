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

// MarkdownView pulls in ReactMarkdown + KaTeX CSS imports that jsdom can't
// resolve. Stub it to a plain div that surfaces its children string.
vi.mock('@/renderer/components/Markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div data-testid='md'>{children}</div>,
}));

import { WorkflowCompleteCard } from '@/renderer/pages/guid/components/workflow/WorkflowCompleteCard';
import type { WorkflowSession } from '@/common/types/workflowTypes';

const NOW = 1_700_000_000_000;

const baseSession = (overrides: Partial<WorkflowSession> = {}): WorkflowSession => ({
  id: 'sess-1',
  workflow_name: 'automate-business-workflows',
  workflow_title: 'Automate Business Workflows',
  conversation_id: 'conv-1',
  current_step: 6,
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
      status: 'done',
      started_at: null,
      completed_at: null,
      eta_seconds: null,
      eta_source: null,
      autonomous_run: null,
    },
  ],
  skills: [],
  asks: [],
  status: 'complete',
  palette: null,
  category: 'Business Operations',
  // 14m 32s duration when completed_at is set below
  created_at: NOW - (14 * 60 + 32) * 1000,
  updated_at: NOW,
  completed_at: NOW,
  ...overrides,
});

describe('WorkflowCompleteCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  it('renders the checkmark, headline, duration, and step count', () => {
    const { container } = render(
      <WorkflowCompleteCard
        session={baseSession({ steps: baseSession().steps.slice(0, 3) })}
        onRunAgain={vi.fn()}
        onLaunchNext={vi.fn()}
      />
    );

    expect(screen.getByText(/Workflow Complete/i)).toBeTruthy();
    // Big checkmark - rendered as a lucide icon inside a dedicated tile
    expect(container.querySelector('[data-testid="workflow-complete-check"]')).toBeTruthy();

    const stats = container.querySelector('[data-testid="workflow-complete-stats"]');
    expect(stats).toBeTruthy();
    expect(stats?.textContent ?? '').toMatch(/14m 32s/);
    expect(stats?.textContent ?? '').toMatch(/3 steps/);
  });

  it('drops the tokens and cost segments when not provided', () => {
    const { container } = render(
      <WorkflowCompleteCard
        session={baseSession()}
        onRunAgain={vi.fn()}
        onLaunchNext={vi.fn()}
      />
    );

    const stats = container.querySelector('[data-testid="workflow-complete-stats"]');
    expect(stats).toBeTruthy();
    const text = stats?.textContent ?? '';
    expect(text).not.toMatch(/tokens/i);
    expect(text).not.toMatch(/\$/);
  });

  it('renders tokens and cost segments when provided', () => {
    const { container } = render(
      <WorkflowCompleteCard
        session={baseSession()}
        totalTokens={12_500}
        totalCostCents={42}
        onRunAgain={vi.fn()}
        onLaunchNext={vi.fn()}
      />
    );

    const stats = container.querySelector('[data-testid="workflow-complete-stats"]');
    const text = stats?.textContent ?? '';
    expect(text).toMatch(/12,500 tokens/);
    expect(text).toMatch(/\$0\.42/);
  });

  it('formats long durations as hours and minutes', () => {
    const { container } = render(
      <WorkflowCompleteCard
        session={baseSession({
          created_at: NOW - (2 * 3600 + 5 * 60) * 1000,
          completed_at: NOW,
        })}
        onRunAgain={vi.fn()}
        onLaunchNext={vi.fn()}
      />
    );

    const stats = container.querySelector('[data-testid="workflow-complete-stats"]');
    expect(stats?.textContent ?? '').toMatch(/2h 5m/);
  });

  it('omits the "What this produced" section when keyOutputs is empty', () => {
    render(
      <WorkflowCompleteCard
        session={baseSession()}
        onRunAgain={vi.fn()}
        onLaunchNext={vi.fn()}
      />
    );

    expect(screen.queryByText(/What this produced/i)).toBeNull();
  });

  it('renders up to 3 key output cards when keyOutputs has entries', () => {
    render(
      <WorkflowCompleteCard
        session={baseSession()}
        keyOutputs={['First output paragraph', 'Second output paragraph', 'Third output', 'Fourth (should not render)']}
        onRunAgain={vi.fn()}
        onLaunchNext={vi.fn()}
      />
    );

    expect(screen.getByText(/What this produced/i)).toBeTruthy();
    const cards = screen.getAllByTestId('workflow-complete-output');
    expect(cards.length).toBe(3);
    expect(cards[0].textContent).toContain('First output paragraph');
    expect(cards[2].textContent).toContain('Third output');
    expect(screen.queryByText(/Fourth/)).toBeNull();
  });

  it('omits the "Up next" section when suggestedNext is empty', () => {
    render(
      <WorkflowCompleteCard
        session={baseSession()}
        onRunAgain={vi.fn()}
        onLaunchNext={vi.fn()}
      />
    );

    expect(screen.queryByText(/Up next/i)).toBeNull();
  });

  // S10 regression: the "Up next" block was permanently dead UI because no
  // <WorkflowSurface> caller ever supplies `suggestedNext`. It was removed,
  // so the section must NOT render even when suggestions are passed.
  it('never renders the "Up next" section, even when suggestedNext is provided (S10)', () => {
    render(
      <WorkflowCompleteCard
        session={baseSession()}
        suggestedNext={[
          { slug: 'launch-a-new-offer', display: 'Launch A New Offer' },
          { slug: 'ship-a-newsletter', display: 'Ship A Newsletter' },
          { slug: 'plan-a-quarter', display: 'Plan A Quarter' },
        ]}
        onRunAgain={vi.fn()}
        onLaunchNext={vi.fn()}
      />
    );

    expect(screen.queryByText(/Up next/i)).toBeNull();
    expect(screen.queryByText('Ship A Newsletter')).toBeNull();
  });

  it('no longer renders the dead "Save this run" CTA (#82)', () => {
    render(
      <WorkflowCompleteCard
        session={baseSession()}
        onRunAgain={vi.fn()}
        onLaunchNext={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /Save this run/i })).toBeNull();
  });

  it('fires onRunAgain when "Run again" is clicked', () => {
    const onRunAgain = vi.fn();
    render(
      <WorkflowCompleteCard
        session={baseSession()}
        onRunAgain={onRunAgain}
        onLaunchNext={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Run again/i }));
    expect(onRunAgain).toHaveBeenCalledTimes(1);
  });

  it('falls back to (Date.now - created_at) when completed_at is null', () => {
    const { container } = render(
      <WorkflowCompleteCard
        session={baseSession({
          completed_at: null,
          created_at: NOW - 90 * 1000, // 1m 30s ago
        })}
        onRunAgain={vi.fn()}
        onLaunchNext={vi.fn()}
      />
    );

    const stats = container.querySelector('[data-testid="workflow-complete-stats"]');
    expect(stats?.textContent ?? '').toMatch(/1m 30s/);
  });
});
