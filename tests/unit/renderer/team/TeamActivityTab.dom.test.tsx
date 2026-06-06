/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * W2c - TeamActivityTab DOM tests. Covers:
 *   - Polls ipcBridge.team.listEvents on mount + every interval tick
 *   - Renders events as a timeline (most recent first)
 *   - New events appearing in a subsequent poll prepend
 *   - The polling interval is cleared on unmount (no leaked timers)
 *
 * Timer strategy: we use real timers with a very short pollIntervalMs (10ms)
 * so tests stay fast. Fake timers don't compose well with @testing-library
 * `waitFor` here because the component fires async work inside its mount
 * effect and waitFor itself relies on a real setTimeout to retry. The
 * faster real-timer approach gives us the deterministic prepend/cleanup
 * behavior we need without flake.
 */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TeamEvent } from '@process/team/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key,
  }),
}));

const listEventsInvoke = vi.hoisted(() => vi.fn());
vi.mock('@/common', () => ({
  ipcBridge: {
    team: {
      listEvents: { invoke: listEventsInvoke },
    },
  },
}));

import TeamActivityTab from '@/renderer/pages/team/components/TeamActivityTab';

const makeEvent = (over: Partial<TeamEvent> = {}): TeamEvent => ({
  id: 'evt-1',
  teamId: 'team-1',
  eventType: 'mailbox',
  payload: { summary: 'hello', type: 'message' },
  createdAt: Date.now(),
  ...over,
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('TeamActivityTab', () => {
  beforeEach(() => {
    listEventsInvoke.mockReset();
  });

  it('polls listEvents on mount and renders the returned events newest-first', async () => {
    const events: TeamEvent[] = [
      makeEvent({
        id: 'a',
        createdAt: 3,
        eventType: 'spawn',
        actorSlotId: 'lead',
        payload: { agent_name: 'Copy', role: 'teammate', agent_type: 'gemini' },
      }),
      makeEvent({
        id: 'b',
        createdAt: 2,
        eventType: 'task',
        payload: { action: 'create', subject: 'plan content', status: 'pending' },
      }),
      makeEvent({
        id: 'c',
        createdAt: 1,
        eventType: 'mailbox',
        actorSlotId: 'copy',
        targetSlotId: 'lead',
        payload: { summary: 'draft ready', type: 'message' },
      }),
    ];
    listEventsInvoke.mockResolvedValue(events);

    render(<TeamActivityTab teamId='team-1' pollIntervalMs={10_000} />);

    await waitFor(() => {
      expect(listEventsInvoke).toHaveBeenCalledTimes(1);
    });
    // Initial invoke uses no `since` and the default limit
    expect(listEventsInvoke.mock.calls[0][0]).toMatchObject({ teamId: 'team-1', limit: 100 });
    expect(listEventsInvoke.mock.calls[0][0].since).toBeUndefined();

    await waitFor(() => {
      expect(screen.getAllByTestId('team-activity-event')).toHaveLength(3);
    });

    const rendered = screen.getAllByTestId('team-activity-event');
    // The component reverses via prepend during fetch; events stay
    // newest-first (createdAt 3, then 2, then 1).
    expect(rendered[0].getAttribute('data-event-id')).toBe('a');
    expect(rendered[1].getAttribute('data-event-id')).toBe('b');
    expect(rendered[2].getAttribute('data-event-id')).toBe('c');
  });

  it('prepends a fresh event when the next poll returns a new row', async () => {
    listEventsInvoke
      .mockResolvedValueOnce([makeEvent({ id: 'a', createdAt: 10 })])
      .mockResolvedValueOnce([makeEvent({ id: 'b', createdAt: 20, eventType: 'spawn' })])
      .mockResolvedValue([]);

    render(<TeamActivityTab teamId='team-1' pollIntervalMs={20} />);

    await waitFor(() => {
      expect(screen.getAllByTestId('team-activity-event')).toHaveLength(1);
    });

    // The interval ticks at 20ms; wait for the next poll to land.
    await waitFor(
      () => {
        expect(screen.getAllByTestId('team-activity-event')).toHaveLength(2);
      },
      { timeout: 1500 }
    );

    const rendered = screen.getAllByTestId('team-activity-event');
    // Newest (b) prepended
    expect(rendered[0].getAttribute('data-event-id')).toBe('b');
    expect(rendered[1].getAttribute('data-event-id')).toBe('a');

    // Second invoke includes `since` (= 10, the max seen so far)
    const secondCall = listEventsInvoke.mock.calls[1][0];
    expect(secondCall.since).toBe(10);
  });

  it('clears the polling interval on unmount (no leaked timer)', async () => {
    listEventsInvoke.mockResolvedValue([]);

    const { unmount } = render(<TeamActivityTab teamId='team-1' pollIntervalMs={20} />);

    await waitFor(() => {
      expect(listEventsInvoke).toHaveBeenCalledTimes(1);
    });

    unmount();
    listEventsInvoke.mockClear();

    // After unmount, waiting comfortably past several interval ticks must
    // not trigger any more invokes.
    await sleep(150);
    expect(listEventsInvoke).not.toHaveBeenCalled();
  });

  it('renders the empty state when no events arrive', async () => {
    listEventsInvoke.mockResolvedValue([]);

    render(<TeamActivityTab teamId='team-1' pollIntervalMs={10_000} />);

    await waitFor(() => {
      expect(screen.getByText('No team activity yet.')).toBeTruthy();
    });
  });
});
