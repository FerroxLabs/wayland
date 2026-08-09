import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

// Resolve i18n to the defaultValue so the assertions read as the user reads
// them, without coupling this file to the locale JSON. Requested keys are
// recorded because the lifecycle badge's defaultValue IS the raw enum, so
// asserting on the rendered text alone cannot tell a translated badge from an
// untranslated one - that assertion would pass either way.
const requestedKeys: string[] = [];

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      requestedKeys.push(key);
      let out = (options?.defaultValue as string | undefined) ?? key;
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

import type { selectCanonicalRunSnapshot } from '@/common/execution';
import MissionProgressPanel from '@/renderer/pages/conversation/components/ExecutionSpine/MissionProgressPanel';

type CanonicalRun = ReturnType<typeof selectCanonicalRunSnapshot>;

const run = (over: Partial<CanonicalRun>): CanonicalRun =>
  ({
    identity: { runId: 'run-1', turnId: 'turn-1', correlationId: 'conversation-1' },
    lifecycle: 'running',
    progress: { completed: 0, total: 0, percent: 0 },
    plan: [],
    planHistory: [],
    activities: [],
    outcomes: [],
    handoffs: [],
    costLedger: { status: 'unavailable' },
    ...over,
  }) as unknown as CanonicalRun;

describe('MissionProgressPanel', () => {
  it('numbers plan steps in their own column so wrapped text stays aligned', () => {
    render(
      <MissionProgressPanel
        run={run({
          progress: { completed: 1, total: 3, percent: 33 },
          plan: [
            { id: 's1', content: 'Research evidence-backed trading strategies', status: 'completed' },
            { id: 's2', content: 'Cover risk management and realistic expectations', status: 'in-progress' },
            { id: 's3', content: 'Synthesize and verify findings', status: 'pending' },
          ],
        } as Partial<CanonicalRun>)}
        progressLabel='1 of 3 complete'
      />
    );
    // The marker is real rendered text, not a browser list-style pseudo-element
    // that no assertion (and no wrapped line) can see.
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('Synthesize and verify findings')).toBeTruthy();
    expect(screen.queryByTestId('execution-mission-empty')).toBeNull();
  });

  it('explains itself instead of rendering blank when a live run has recorded nothing yet', () => {
    // Reachable on every turn: the section opens as soon as the run leaves
    // `queued`, which is before the first step is recorded.
    render(<MissionProgressPanel run={run({ lifecycle: 'running' })} progressLabel='0 of 0 complete' />);
    const empty = screen.getByTestId('execution-mission-empty');
    expect(empty).toBeTruthy();
    expect(screen.getByText('No steps yet')).toBeTruthy();
    expect(screen.getByText(/will appear here as this task runs/)).toBeTruthy();
  });

  it('drops the empty state as soon as a single step is recorded', () => {
    render(
      <MissionProgressPanel
        run={run({
          activities: [
            { id: 'a1', kind: 'tool', name: 'Edit', status: 'running', detail: 'trading-strategies-research.md' },
          ],
        } as Partial<CanonicalRun>)}
        progressLabel='0 of 0 complete'
      />
    );
    expect(screen.queryByTestId('execution-mission-empty')).toBeNull();
    expect(screen.getByText('Steps taken')).toBeTruthy();
  });

  it('translates the lifecycle badge rather than printing the raw enum', () => {
    requestedKeys.length = 0;
    render(<MissionProgressPanel run={run({ lifecycle: 'completed' })} progressLabel='0 of 0 complete' />);
    expect(screen.getByText('completed')).toBeTruthy();
    // The rendered text is identical either way, so the discriminating check is
    // that the badge asked i18n for the key at all. Print the enum straight to
    // the DOM and this goes red; every non-English locale depends on it.
    expect(requestedKeys).toContain('conversation.execution.lifecycle.completed');
  });
});
