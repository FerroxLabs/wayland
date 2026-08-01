/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type { LedgerEntry, MissionControlSnapshot } from '@/common/types/missionControl';

const state = vi.hoisted(() => ({ snapshot: undefined as MissionControlSnapshot | undefined }));

vi.mock('@/renderer/pages/mission-control/useMissionControl', () => ({
  useMissionControl: () => ({ snapshot: state.snapshot, loading: false, refresh: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      String(options?.defaultValue ?? options?.time ?? options?.shown ?? key),
  }),
}));

import { OperationsView } from '@/renderer/pages/mission-control';

const entry = (index: number): LedgerEntry => ({
  id: `core:turn:${index}`,
  sourceId: `turn-${index}`,
  source: 'core-execution',
  provenance: { origin: 'core', kind: 'turn' },
  group: 'recent',
  title: `Activity ${index}`,
  status: 'done',
  action: { kind: 'navigate', path: `/conversation/conversation-${index}`, label: 'Open activity' },
  startedAt: index,
  updatedAt: index,
});

const snapshot = (count: number): MissionControlSnapshot => ({
  generatedAt: 1,
  entries: Array.from({ length: count }, (_, index) => entry(index)),
  counts: {
    total: count,
    running: 0,
    verifying: 0,
    pending: 0,
    blocked: 0,
    done: count,
    failed: 0,
    zombie: 0,
    idle: 0,
    unknown: 0,
  },
  groupCounts: { 'needs-you': 0, running: 0, upcoming: 0, recent: count },
  sourceHealth: [{ source: 'core-execution', status: 'ok', observedAt: 1 }],
  completeness: 'complete',
});

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid='location-state'>{JSON.stringify(location.state)}</output>;
};

afterEach(() => cleanup());

describe('Mission Control activity window', () => {
  it('keeps a 1,001-entry ledger bounded while every entry remains reachable', () => {
    state.snapshot = snapshot(1_001);
    const { container } = render(
      <MemoryRouter>
        <OperationsView />
      </MemoryRouter>
    );

    const observed = new Set<string>();
    const next = screen.getByTestId('mission-control-activity-next');
    for (let page = 0; page < 30; page += 1) {
      const rows = container.querySelectorAll<HTMLButtonElement>('button[aria-label^="Open activity: Activity"]');
      expect(rows.length).toBeLessThanOrEqual(48);
      rows.forEach((row) => observed.add(row.getAttribute('aria-label') ?? ''));
      if (next.getAttribute('aria-disabled') === 'true') break;
      fireEvent.click(next);
    }

    expect(observed.size).toBe(1_001);
    expect(container.querySelectorAll('button[aria-label^="Open activity: Activity"]')).toHaveLength(41);
  });

  it('navigates a Core entry to its exact evidence-backed Workbench lane', () => {
    state.snapshot = snapshot(1);
    render(
      <MemoryRouter initialEntries={['/mission-control']}>
        <Routes>
          <Route path='/mission-control' element={<OperationsView />} />
          <Route path='/conversation/:id' element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open activity: Activity 0' }));
    expect(screen.getByTestId('location-state').textContent).toContain('projection:core');
    expect(screen.getByTestId('location-state').textContent).toContain('core:turn:0:0');
  });
});
