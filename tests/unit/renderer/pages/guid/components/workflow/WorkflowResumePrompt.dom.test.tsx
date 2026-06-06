/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkflowResumePrompt } from '@/renderer/pages/guid/components/workflow/WorkflowResumePrompt';
import type { WorkflowSession } from '@/common/types/workflowTypes';

const NOW = new Date('2026-05-25T12:00:00Z').getTime();

const makeSession = (overrides: Partial<WorkflowSession> = {}): WorkflowSession => ({
  id: 'sess_1',
  workflow_name: 'launch-plan',
  workflow_title: 'Launch Plan',
  conversation_id: 'conv_1',
  current_step: 3,
  total_steps: 6,
  steps: [],
  skills: [],
  asks: [],
  status: 'active',
  palette: null,
  category: null,
  created_at: NOW - 2 * 60 * 60 * 1000,
  updated_at: NOW - 2 * 60 * 60 * 1000,
  completed_at: null,
  ...overrides,
});

describe('WorkflowResumePrompt', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the step counter from existingSession.current_step', () => {
    render(
      <WorkflowResumePrompt
        existingSession={makeSession({ current_step: 3 })}
        onResume={vi.fn()}
        onStartFresh={vi.fn()}
      />,
    );

    expect(screen.getByText(/Resume from Step 3/i)).toBeTruthy();
  });

  it('renders "just now" when updated_at is < 1 minute ago', () => {
    render(
      <WorkflowResumePrompt
        existingSession={makeSession({ updated_at: NOW - 30 * 1000 })}
        onResume={vi.fn()}
        onStartFresh={vi.fn()}
      />,
    );

    expect(screen.getByText(/just now/i)).toBeTruthy();
  });

  it('renders "{n} minutes ago" when < 1 hour ago', () => {
    render(
      <WorkflowResumePrompt
        existingSession={makeSession({ updated_at: NOW - 5 * 60 * 1000 })}
        onResume={vi.fn()}
        onStartFresh={vi.fn()}
      />,
    );

    expect(screen.getByText(/5 minutes ago/i)).toBeTruthy();
  });

  it('renders "1 minute ago" (singular) at exactly 1 minute', () => {
    render(
      <WorkflowResumePrompt
        existingSession={makeSession({ updated_at: NOW - 60 * 1000 })}
        onResume={vi.fn()}
        onStartFresh={vi.fn()}
      />,
    );

    expect(screen.getByText(/1 minute ago/i)).toBeTruthy();
  });

  it('renders "{n} hours ago" when < 24 hours ago', () => {
    render(
      <WorkflowResumePrompt
        existingSession={makeSession({ updated_at: NOW - 2 * 60 * 60 * 1000 })}
        onResume={vi.fn()}
        onStartFresh={vi.fn()}
      />,
    );

    expect(screen.getByText(/2 hours ago/i)).toBeTruthy();
  });

  it('renders "1 hour ago" (singular) at exactly 1 hour', () => {
    render(
      <WorkflowResumePrompt
        existingSession={makeSession({ updated_at: NOW - 60 * 60 * 1000 })}
        onResume={vi.fn()}
        onStartFresh={vi.fn()}
      />,
    );

    expect(screen.getByText(/1 hour ago/i)).toBeTruthy();
  });

  it('renders "yesterday" when 1-2 days ago', () => {
    render(
      <WorkflowResumePrompt
        existingSession={makeSession({ updated_at: NOW - 30 * 60 * 60 * 1000 })}
        onResume={vi.fn()}
        onStartFresh={vi.fn()}
      />,
    );

    expect(screen.getByText(/yesterday/i)).toBeTruthy();
  });

  it('renders "{n} days ago" when > 2 days ago', () => {
    render(
      <WorkflowResumePrompt
        existingSession={makeSession({ updated_at: NOW - 3 * 24 * 60 * 60 * 1000 })}
        onResume={vi.fn()}
        onStartFresh={vi.fn()}
      />,
    );

    expect(screen.getByText(/3 days ago/i)).toBeTruthy();
  });

  it('fires onResume when Resume button is clicked', () => {
    const onResume = vi.fn();
    const onStartFresh = vi.fn();

    render(
      <WorkflowResumePrompt
        existingSession={makeSession()}
        onResume={onResume}
        onStartFresh={onStartFresh}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^Resume$/i }));

    expect(onResume).toHaveBeenCalledTimes(1);
    expect(onStartFresh).not.toHaveBeenCalled();
  });

  it('fires onStartFresh when Start fresh button is clicked', () => {
    const onResume = vi.fn();
    const onStartFresh = vi.fn();

    render(
      <WorkflowResumePrompt
        existingSession={makeSession()}
        onResume={onResume}
        onStartFresh={onStartFresh}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Start fresh/i }));

    expect(onStartFresh).toHaveBeenCalledTimes(1);
    expect(onResume).not.toHaveBeenCalled();
  });
});
