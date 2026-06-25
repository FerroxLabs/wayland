// tests/unit/process/acp/runtime/IdleReclaimer.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IdleReclaimer } from '@process/acp/runtime/IdleReclaimer';

describe('IdleReclaimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function makeEntry(status: string, lastActiveAt: number) {
    return {
      session: {
        status,
        suspend: vi.fn().mockResolvedValue(undefined),
      } as any,
      lastActiveAt,
    };
  }

  it('reclaims idle active session (INV-A-02)', () => {
    const sessions = new Map<string, any>();
    sessions.set('c1', makeEntry('active', Date.now() - 60_000));
    const r = new IdleReclaimer(sessions, 30_000, 1_000);
    r.start();
    vi.advanceTimersByTime(1_000);
    expect(sessions.get('c1').session.suspend).toHaveBeenCalledOnce();
    r.stop();
  });

  it('does NOT reclaim prompting session (INV-A-02)', () => {
    const sessions = new Map<string, any>();
    sessions.set('c1', makeEntry('prompting', Date.now() - 60_000));
    const r = new IdleReclaimer(sessions, 30_000, 1_000);
    r.start();
    vi.advanceTimersByTime(1_000);
    expect(sessions.get('c1').session.suspend).not.toHaveBeenCalled();
    r.stop();
  });

  it('does NOT reclaim recently active session', () => {
    const sessions = new Map<string, any>();
    sessions.set('c1', makeEntry('active', Date.now()));
    const r = new IdleReclaimer(sessions, 30_000, 1_000);
    r.start();
    vi.advanceTimersByTime(1_000);
    expect(sessions.get('c1').session.suspend).not.toHaveBeenCalled();
    r.stop();
  });

  // Regression for #60: a session that keeps producing activity must never be
  // reclaimed, even past the idle timeout. AcpRuntime.touchActivity() refreshes
  // entry.lastActiveAt on every stream message and status change, so an actively
  // streaming session's idle clock keeps resetting. Before the fix, lastActiveAt
  // only moved on send, so a long turn (or a user reading output) was suspended
  // mid-conversation, killing the bridge every few minutes.
  it('does NOT reclaim a session whose activity is refreshed within the window (#60)', () => {
    const sessions = new Map<string, any>();
    const entry = makeEntry('active', Date.now());
    sessions.set('c1', entry);
    const r = new IdleReclaimer(sessions, 30_000, 1_000);
    r.start();
    // Simulate 10 minutes of an active session that streams activity every few
    // seconds (what touchActivity does on each onMessage / status change).
    for (let i = 0; i < 60; i++) {
      entry.lastActiveAt = Date.now(); // activity refresh
      vi.advanceTimersByTime(10_000); // 10s of scans (idle timeout is 30s)
    }
    expect(entry.session.suspend).not.toHaveBeenCalled();
    r.stop();
  });

  // Complementary: once activity genuinely stops, the idle clock is no longer
  // refreshed and reclamation proceeds as designed (resume happens on next send).
  it('reclaims after activity stops and the idle window elapses (#60)', () => {
    const sessions = new Map<string, any>();
    const entry = makeEntry('active', Date.now());
    // Mirror real suspend(): it transitions the session to 'suspended', so the
    // reclaimer stops matching it after the first reclaim.
    entry.session.suspend = vi.fn(async () => {
      entry.session.status = 'suspended';
    });
    sessions.set('c1', entry);
    const r = new IdleReclaimer(sessions, 30_000, 1_000);
    r.start();
    entry.lastActiveAt = Date.now();
    vi.advanceTimersByTime(5_000); // still within window, no suspend
    expect(entry.session.suspend).not.toHaveBeenCalled();
    vi.advanceTimersByTime(30_000); // activity stopped; window elapses
    expect(entry.session.suspend).toHaveBeenCalledOnce();
    r.stop();
  });
});
