/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

// Return the defaultValue with {{count}}/{{duration}} interpolated so the
// "Did N things" summary text is assertable without locale JSON.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: Record<string, unknown>) => {
      let out = (options?.defaultValue as string | undefined) ?? _key;
      if (options) {
        for (const [k, v] of Object.entries(options)) {
          if (k === 'defaultValue') continue;
          out = out.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
        }
      }
      return out;
    },
  }),
}));

import type { ActivityStep } from '@/common/chat/activity/activityStep';
import ActivityTimeline from '@/renderer/components/chat/observability/ActivityTimeline';

const step = (over: Partial<ActivityStep> & Pick<ActivityStep, 'id' | 'label'>): ActivityStep => ({
  kind: 'tool',
  glyph: 'tool',
  status: 'done',
  startTime: 1000,
  endTime: 2000,
  ...over,
});

describe('ActivityTimeline', () => {
  it('renders collapsed with a "Did N things" summary when all steps are done', () => {
    render(
      <ActivityTimeline
        steps={[
          step({ id: 'a', label: 'Planning the work', startTime: 1000, endTime: 2000 }),
          step({ id: 'b', label: 'Searching the web', startTime: 2000, endTime: 5000 }),
        ]}
      />
    );
    // Resting state: summary visible, step labels hidden until expanded.
    expect(screen.getByText(/Did 2 things/)).toBeTruthy();
    expect(screen.queryByText('Planning the work')).toBeNull();
  });

  it('expands to show each step label when the header is clicked', () => {
    render(
      <ActivityTimeline
        steps={[step({ id: 'a', label: 'Planning the work' }), step({ id: 'b', label: 'Searching the web' })]}
      />
    );
    fireEvent.click(screen.getByText(/Did 2 things/));
    expect(screen.getByText('Planning the work')).toBeTruthy();
    expect(screen.getByText('Searching the web')).toBeTruthy();
  });

  it('stays expanded and shows the running header while a step runs', () => {
    render(
      <ActivityTimeline
        steps={[
          step({ id: 'a', label: 'Done step', status: 'done' }),
          step({ id: 'b', label: 'Live step', status: 'running', startTime: 3000, endTime: undefined }),
        ]}
      />
    );
    const timeline = screen.getByTestId('activity-timeline');
    expect(timeline.getAttribute('data-timeline-status')).toBe('running');
    // Running header (count) + expanded list (labels visible), no "Did" summary.
    expect(screen.getByText('2 steps')).toBeTruthy();
    expect(screen.getByText('Live step')).toBeTruthy();
    expect(screen.queryByText(/Did .* things/)).toBeNull();
  });

  it('reveals a step detail when its row is clicked', () => {
    render(
      <ActivityTimeline
        defaultExpanded
        steps={[step({ id: 'a', label: 'Read a file', detail: 'file contents here' })]}
      />
    );
    expect(screen.queryByText('file contents here')).toBeNull();
    fireEvent.click(screen.getByText('Read a file'));
    expect(screen.getByText('file contents here')).toBeTruthy();
  });

  it('renders a nested timeline for a step with children', () => {
    render(
      <ActivityTimeline
        defaultExpanded
        steps={[
          step({
            id: 'parent',
            label: 'Researcher sub-agent',
            kind: 'sub_agent',
            agent: 'researcher',
            children: [step({ id: 'child', label: 'Nested fetch' })],
          }),
        ]}
      />
    );
    // Agent tag surfaces, and expanding the parent reveals the nested step.
    expect(screen.getByText('researcher')).toBeTruthy();
    fireEvent.click(screen.getByText('Researcher sub-agent'));
    expect(screen.getByText('Nested fetch')).toBeTruthy();
    // Two timelines now exist (parent + nested child).
    expect(screen.getAllByTestId('activity-timeline').length).toBe(2);
  });

  it('auto-collapses on the running -> done edge', () => {
    const running = [step({ id: 'a', label: 'Working now', status: 'running', startTime: 1000, endTime: undefined })];
    const { rerender } = render(<ActivityTimeline steps={running} />);
    // While running: expanded, label visible.
    expect(screen.getByText('Working now')).toBeTruthy();
    expect(screen.getByTestId('activity-timeline').getAttribute('data-timeline-status')).toBe('running');

    // Same instance finishes -> edge fires -> collapses to the summary.
    rerender(
      <ActivityTimeline
        steps={[step({ id: 'a', label: 'Working now', status: 'done', startTime: 1000, endTime: 2000 })]}
      />
    );
    expect(screen.getByTestId('activity-timeline').getAttribute('data-timeline-status')).toBe('done');
    // Collapsed is now asserted on the header's own state rather than on the
    // absence of the label: a single step promotes its label INTO the summary,
    // so the text stays on screen while the row below it is gone.
    expect(
      screen.getByTestId('activity-timeline').querySelector('[aria-expanded]')?.getAttribute('aria-expanded')
    ).toBe('false');
    expect(screen.getByText(/Working now/)).toBeTruthy();
  });

  it('promotes the sole step label instead of saying "Did 1 things"', () => {
    render(<ActivityTimeline steps={[step({ id: 'a', label: 'Looking for a "load skill" tool' })]} />);
    expect(screen.getByText(/Looking for a "load skill" tool/)).toBeTruthy();
    // The ungrammatical group-of-one header must be gone entirely, not merely
    // reworded - it hid exactly one row that said more than the header did.
    expect(screen.queryByText(/Did 1 things/)).toBeNull();
    expect(screen.queryByText(/Did \d+ things/)).toBeNull();
  });

  it('still counts when there is genuinely more than one step', () => {
    render(
      <ActivityTimeline
        steps={[step({ id: 'a', label: 'Planning the work' }), step({ id: 'b', label: 'Searching the web' })]}
      />
    );
    expect(screen.getByText(/Did 2 things/)).toBeTruthy();
  });
});
