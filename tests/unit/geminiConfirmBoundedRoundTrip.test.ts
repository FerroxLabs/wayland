// tests/unit/geminiConfirmBoundedRoundTrip.test.ts
//
// #983 regression: `ChannelMessageService.confirm` AWAITS what
// `GeminiAgentManager.confirm` returns, and that used to be
// `postMessagePromise(callId, data)` with no deadline and no repeat guard.
//
// The worker registers exactly one `pipe.once(tool.callId, ...)` listener per
// callId and deletes it when it fires (src/process/worker/gemini.ts), so any
// confirm the live worker cannot answer - a channel platform replaying its
// callback, or a stale approval card met by a fresh worker - produced a promise
// bounded ONLY by child death. The awaiting channel action handler then wedged
// permanently: the exact "frozen in Processing" class #983 exists to kill.
import { describe, it, expect, vi, beforeEach } from 'vitest';

type Handler = (...args: any[]) => void;

const childHandlers = vi.hoisted(() => new Map<string, Handler>());
const mockFcp = vi.hoisted(() => ({
  on: vi.fn((event: string, handler: Handler) => {
    childHandlers.set(event, handler);
    return mockFcp;
  }),
  postMessage: vi.fn(),
  kill: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: {
      isPackaged: () => false,
      getAppPath: () => null,
      getDataDir: () => '/tmp',
      getHomeDir: () => '/tmp',
      getTempDir: () => '/tmp',
      needsCliSafeSymlinks: () => false,
    },
    worker: { fork: vi.fn(() => mockFcp) },
  }),
}));
vi.mock('@process/utils/shellEnv', () => ({ getEnhancedEnv: vi.fn(() => ({})) }));

import { GeminiAgentManager } from '../../src/process/task/GeminiAgentManager';

function makeManager(yoloMode = false): GeminiAgentManager {
  return new GeminiAgentManager(
    { workspace: '/tmp/ws', conversation_id: 'conv-1', yoloMode } as any,
    {
      id: 'model',
      platform: 'gemini',
    } as any
  );
}

/** Worker messages posted for `callId` (the confirm round-trip uses callId as the type). */
function postsFor(callId: string): number {
  return mockFcp.postMessage.mock.calls.filter((c) => (c[0] as { type: string }).type === callId).length;
}

/** Answer the most recent round-trip the way the real worker's deferred does. */
function answerLatest(mgr: GeminiAgentManager): void {
  const sent = mockFcp.postMessage.mock.calls.at(-1)![0] as { pipeId: string };
  (mgr as any).emit(`${sent.pipeId}.callback`, { state: 'fulfilled', data: undefined });
}

describe('GeminiAgentManager.confirm round-trip is bounded (#983)', () => {
  beforeEach(() => {
    childHandlers.clear();
    vi.clearAllMocks();
  });

  it('rejects on a deadline when the live worker never registered the callId', async () => {
    vi.useFakeTimers();
    try {
      const mgr = makeManager();
      // Nothing in the confirmations cache and no listener on the child: this is
      // the stale-card/fresh-worker case that used to stay pending forever.
      const pending = Promise.resolve(mgr.confirm('msg-1', 'call-unregistered', 'proceed_once'));
      const assertion = expect(pending).rejects.toThrow(/timed out after 60000ms/);

      await vi.advanceTimersByTimeAsync(60_001);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not leave the confirm pending forever while the child is alive', async () => {
    vi.useFakeTimers();
    try {
      const mgr = makeManager();
      const pending = Promise.resolve(mgr.confirm('msg-1', 'call-unregistered', 'proceed_once'));

      let settled = false;
      void pending.then(
        () => (settled = true),
        () => (settled = true)
      );

      // An hour of a perfectly healthy child. No exit, no error, no answer.
      await vi.advanceTimersByTimeAsync(3_600_000);
      expect(settled).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not post a second time for a callId that was already confirmed', async () => {
    const mgr = makeManager();

    const first = Promise.resolve(mgr.confirm('msg-1', 'call-repeat', 'proceed_once'));
    expect(postsFor('call-repeat')).toBe(1);
    answerLatest(mgr);
    await expect(first).resolves.toBeUndefined();

    // The channel platform replays its callback. The worker's one-shot listener
    // is gone, so posting again would be a promise nobody can settle.
    await expect(Promise.resolve(mgr.confirm('msg-1', 'call-repeat', 'proceed_once'))).resolves.toBeUndefined();
    expect(postsFor('call-repeat')).toBe(1);
  });

  it('OVER-FIX CONTROL: a first yolo auto-confirm is still delivered even though it is never in the confirmations cache', async () => {
    vi.useFakeTimers();
    try {
      const mgr = makeManager(true);
      (mgr as any).addConfirmation({
        title: 'exec',
        id: 'call-yolo',
        action: 'exec',
        description: 'run it',
        callId: 'call-yolo',
        options: [{ label: 'ok', value: 'proceed_once' }],
      });

      // yoloMode returns from addConfirmation BEFORE populating the cache, so a
      // guard keyed on "absent from this.confirmations" would swallow this.
      expect((mgr as any).confirmations).toHaveLength(0);

      await vi.advanceTimersByTimeAsync(100);
      expect(postsFor('call-yolo')).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('collapses a repeated yolo auto-confirm to a single worker post', async () => {
    vi.useFakeTimers();
    try {
      const mgr = makeManager(true);
      const confirmation = {
        title: 'exec',
        id: 'call-yolo-2',
        action: 'exec',
        description: 'run it',
        callId: 'call-yolo-2',
        options: [{ label: 'ok', value: 'proceed_once' }],
      };
      // onToolCallsUpdate re-emits every tool still in awaiting_approval, so
      // addConfirmation fires repeatedly for the same callId.
      (mgr as any).addConfirmation({ ...confirmation });
      (mgr as any).addConfirmation({ ...confirmation });

      await vi.advanceTimersByTimeAsync(100);
      expect(postsFor('call-yolo-2')).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('still resolves a normal confirm on the child callback, and still clears the card', async () => {
    const mgr = makeManager();
    (mgr as any).addConfirmation({
      title: 'exec',
      id: 'call-ok',
      action: 'exec',
      description: 'run it',
      callId: 'call-ok',
      options: [{ label: 'ok', value: 'proceed_once' }],
    });
    expect((mgr as any).confirmations).toHaveLength(1);

    const pending = Promise.resolve(mgr.confirm('msg-1', 'call-ok', 'proceed_once'));
    answerLatest(mgr);

    await expect(pending).resolves.toBeUndefined();
    expect((mgr as any).confirmations).toHaveLength(0);
  });

  it('bounds the remembered-callId set without forgetting the most recent callIds', () => {
    const mgr = makeManager();
    for (let i = 0; i < 600; i++) (mgr as any).claimConfirmCallId(`bulk-${i}`);

    // Bounded, so a very long conversation cannot grow the set without limit.
    expect((mgr as any).consumedConfirmCallIds.size).toBeLessThanOrEqual(500);
    // Eviction takes the OLDEST, so a callId that could still be replayed is
    // the one kept - not the one dropped.
    expect((mgr as any).claimConfirmCallId('bulk-599')).toBe(false);
  });

  it('still rejects on child exit rather than waiting out the deadline', async () => {
    const mgr = makeManager();
    const pending = Promise.resolve(mgr.confirm('msg-1', 'call-exit', 'proceed_once'));

    childHandlers.get('exit')!(1, null);

    await expect(pending).rejects.toThrow(/child exited before responding/);
  });
});
