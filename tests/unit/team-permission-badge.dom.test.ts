/**
 * Tests for the team pending-permission badge system (REQ-5 … REQ-8).
 *
 * These exercise the ACTUAL shipped hooks, not reimplemented fakes:
 *   - src/renderer/pages/team/hooks/useTeamPendingPermissions.ts
 *   - src/renderer/pages/team/hooks/useSiderTeamBadges.ts
 *
 * Together they own the count semantics behind every requirement:
 *   - REQ-5 (member tab ‼️ icon): TeamTabs renders the ‼️ span purely on
 *     `pendingCount > 0`; the count it keys off is produced here.
 *   - REQ-6 (sider iOS-style red badge with aggregate count): useSiderTeamBadges.
 *   - REQ-7 (real-time bidirectional update): both hooks subscribe to
 *     conversation.confirmation.add / .remove IPC events.
 *   - REQ-8 (localStorage persistence + pruning + corruption-safety):
 *     useTeamPendingPermissions persists pruned counts under
 *     `team-pending-permissions-<teamId>`.
 *
 * The earlier version of this file asserted a hand-rolled
 * `team-permission-pending-counts` schema that prod never used, and parked the
 * real behaviour as `.todo`. The feature shipped - so this tests the real thing.
 *
 * The pure-DOM render of the ‼️ glyph / iOS badge lives in the heavyweight
 * TeamTabs / TeamPage component tree (drag handlers, avatars, i18n) and is out
 * of scope here; the count logic that drives those renders is fully covered.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TTeam } from '@/common/types/teamTypes';

// ---------------------------------------------------------------------------
// IPC mock - capture the confirmation.add / .remove handlers so tests can fire
// real-time events, and control confirmation.list for the initial backend sync.
// ---------------------------------------------------------------------------

type ConfirmationEvent = { conversation_id: string };

const { listInvoke, addHandlers, removeHandlers } = vi.hoisted(() => ({
  listInvoke: vi.fn(),
  addHandlers: new Set<(d: ConfirmationEvent) => void>(),
  removeHandlers: new Set<(d: ConfirmationEvent) => void>(),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      confirmation: {
        list: { invoke: (...args: unknown[]) => listInvoke(...args) },
        add: {
          on: (h: (d: ConfirmationEvent) => void) => {
            addHandlers.add(h);
            return () => addHandlers.delete(h);
          },
        },
        remove: {
          on: (h: (d: ConfirmationEvent) => void) => {
            removeHandlers.add(h);
            return () => removeHandlers.delete(h);
          },
        },
      },
    },
  },
}));

// removeStack just composes unsubscribe callbacks - supply a faithful tiny impl
// so we don't drag the whole renderer util barrel into a jsdom unit test.
vi.mock('@/renderer/utils/common', () => ({
  removeStack:
    (...fns: Array<() => void>) =>
    () => {
      for (const f of fns) if (f) f();
    },
}));

import { useTeamPendingPermissions } from '@/renderer/pages/team/hooks/useTeamPendingPermissions';
import { useSiderTeamBadges } from '@/renderer/pages/team/hooks/useSiderTeamBadges';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const teamKey = (teamId: string) => `team-pending-permissions-${teamId}`;
const seed = (teamId: string, counts: Record<string, number>) =>
  localStorage.setItem(teamKey(teamId), JSON.stringify(counts));

/** Fire a live confirmation.add for a conversation, inside act(). */
const emitAdd = (cid: string) =>
  act(() => {
    for (const h of addHandlers) h({ conversation_id: cid });
  });

/** Fire a live confirmation.remove for a conversation, inside act(). */
const emitRemove = (cid: string) =>
  act(() => {
    for (const h of removeHandlers) h({ conversation_id: cid });
  });

/** Flush mounted async effects (the fetchInitial / fetchCurrent backend sync). */
const flush = () => act(async () => {});

/** Build a minimal TTeam carrying only the fields the badge hooks read. */
const team = (id: string, conversationIds: string[]): TTeam =>
  ({ id, agents: conversationIds.map((c) => ({ conversationId: c })) }) as unknown as TTeam;

beforeEach(() => {
  localStorage.clear();
  addHandlers.clear();
  removeHandlers.clear();
  listInvoke.mockReset();
  listInvoke.mockResolvedValue([]); // backend reports zero pending by default
});

// ---------------------------------------------------------------------------
// useTeamPendingPermissions - REQ-7 (real-time) + REQ-8 (persistence)
// ---------------------------------------------------------------------------

describe('useTeamPendingPermissions', () => {
  it('REQ-8: seeds counts and totalPending from localStorage for an instant first render', () => {
    // Never-resolving backend → the synchronous localStorage seed is what the
    // user sees on first paint, before any network round-trip.
    listInvoke.mockReturnValue(new Promise(() => {}));
    seed('team-1', { c1: 3, c2: 1 });

    const { result } = renderHook(() => useTeamPendingPermissions('team-1', ['c1', 'c2']));

    expect(result.current.pendingCounts).toEqual({ c1: 3, c2: 1 });
    expect(result.current.totalPending).toBe(4);
  });

  it('REQ-7: increments a slot count on a live confirmation.add event', async () => {
    const { result } = renderHook(() => useTeamPendingPermissions('team-1', ['c1']));
    await flush();

    emitAdd('c1');
    expect(result.current.pendingCounts.c1).toBe(1);
    expect(result.current.totalPending).toBe(1);

    emitAdd('c1');
    expect(result.current.pendingCounts.c1).toBe(2);
    expect(result.current.totalPending).toBe(2);
  });

  it('REQ-7: decrements on confirmation.remove and floors at 0', async () => {
    const { result } = renderHook(() => useTeamPendingPermissions('team-1', ['c1']));
    await flush();

    emitAdd('c1');
    emitRemove('c1');
    expect(result.current.pendingCounts.c1).toBe(0);

    // Removing again must not go negative.
    emitRemove('c1');
    expect(result.current.pendingCounts.c1).toBe(0);
  });

  it('REQ-7: ignores events for conversations outside this team', async () => {
    const { result } = renderHook(() => useTeamPendingPermissions('team-1', ['c1']));
    await flush();

    emitAdd('someone-elses-conversation');
    expect(result.current.totalPending).toBe(0);
    expect(result.current.pendingCounts.c1 ?? 0).toBe(0);
  });

  it('REQ-8: persists only pruned (count>0, current-conversation) counts to localStorage', async () => {
    // A stale entry for a conversation no longer in the team must be pruned out.
    seed('team-1', { c_stale: 5 });

    const { result } = renderHook(() => useTeamPendingPermissions('team-1', ['c1', 'c2']));
    await flush();

    emitAdd('c1');
    emitAdd('c1');

    const persisted = JSON.parse(localStorage.getItem(teamKey('team-1')) ?? '{}');
    // c1 kept (>0), c2 omitted (==0), c_stale pruned (not a current conversation).
    expect(persisted).toEqual({ c1: 2 });
    expect(result.current.totalPending).toBe(2);
  });

  it('REQ-8: corrupted localStorage yields empty counts without throwing', () => {
    listInvoke.mockReturnValue(new Promise(() => {}));
    localStorage.setItem(teamKey('team-1'), 'not-valid-json');

    const { result } = renderHook(() => useTeamPendingPermissions('team-1', ['c1']));

    expect(result.current.pendingCounts).toEqual({});
    expect(result.current.totalPending).toBe(0);
  });

  it('clearStorage removes the team key (called when a team is deleted)', () => {
    listInvoke.mockReturnValue(new Promise(() => {}));
    seed('team-1', { c1: 2 });

    const { result } = renderHook(() => useTeamPendingPermissions('team-1', ['c1']));
    expect(localStorage.getItem(teamKey('team-1'))).not.toBeNull();

    act(() => result.current.clearStorage());
    expect(localStorage.getItem(teamKey('team-1'))).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// useSiderTeamBadges - REQ-6 (aggregate sider badge) + REQ-7 (real-time)
// ---------------------------------------------------------------------------

describe('useSiderTeamBadges', () => {
  it('REQ-6: aggregates each team localStorage counts into a per-team Map (instant render)', () => {
    listInvoke.mockReturnValue(new Promise(() => {}));
    seed('teamA', { a1: 2, a2: 1 });
    seed('teamB', { b1: 3 });

    const teams = [team('teamA', ['a1', 'a2']), team('teamB', ['b1'])];
    const { result } = renderHook(() => useSiderTeamBadges(teams));

    expect(result.current.get('teamA')).toBe(3); // 2 + 1 across members
    expect(result.current.get('teamB')).toBe(3);
  });

  it('REQ-7: a live confirmation.add increments only the owning team badge', async () => {
    const teams = [team('teamA', ['a1', 'a2']), team('teamB', ['b1'])];
    const { result } = renderHook(() => useSiderTeamBadges(teams));
    await flush(); // backend resolves [] → badges settle to 0

    emitAdd('a1');
    expect(result.current.get('teamA')).toBe(1);
    expect(result.current.get('teamB')).toBe(0);
  });

  it('REQ-6: keeps the localStorage fallback when every backend query for a team fails', async () => {
    // If the agent session is not running, confirmation.list rejects. The hook
    // must keep the last-known localStorage count rather than zeroing the badge.
    seed('teamA', { a1: 4 });
    listInvoke.mockRejectedValue(new Error('session not running'));

    const teams = [team('teamA', ['a1'])];
    const { result } = renderHook(() => useSiderTeamBadges(teams));
    await flush();

    expect(result.current.get('teamA')).toBe(4);
  });
});
