// tests/unit/ForkTaskBoundedCall.test.ts
//
// #983 regression: `postMessagePromise` used to settle ONLY on the child's
// callback message. A child that died (crash, kill, failed spawn) left every
// caller pending forever - which is how a teammate froze in "Processing" with
// no error to show anyone.
import { describe, it, expect, vi, beforeEach } from 'vitest';

type Handler = (...args: any[]) => void;

const childHandlers = vi.hoisted(() => new Map<string, Handler>());
const mockFcp = vi.hoisted(() => ({
  on: vi.fn((event: string, handler: Handler) => {
    childHandlers.set(event, handler);
    return mockFcp;
  }),
  postMessage: vi.fn(),
  kill: vi.fn(),
}));

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: { isPackaged: () => false, getAppPath: () => null },
    worker: { fork: vi.fn(() => mockFcp) },
  }),
}));
vi.mock('../../src/process/utils/shellEnv', () => ({
  getEnhancedEnv: vi.fn(() => ({})),
}));

import { ForkTask } from '../../src/process/worker/fork/ForkTask';

/** Reach the protected round-trip the same way the real subclasses do. */
function call(task: ForkTask<unknown>, type: string, options?: { timeoutMs?: number }): Promise<unknown> {
  return (task as any).postMessagePromise(type, {}, options);
}

describe('ForkTask.postMessagePromise is bounded (#983)', () => {
  beforeEach(() => {
    childHandlers.clear();
    vi.clearAllMocks();
  });

  it('rejects an in-flight call when the child exits unexpectedly', async () => {
    const task = new ForkTask('test-path', {}, true);
    const pending = call(task, 'send.message');

    // Nothing has answered yet - this is the state that used to hang forever.
    childHandlers.get('exit')!(1, null);

    await expect(pending).rejects.toThrow(/child exited before responding/);
  });

  it('rejects an in-flight call when the child exit was expected (kill)', async () => {
    const task = new ForkTask('test-path', {}, true);
    const pending = call(task, 'send.message');

    void task.kill(); // marks the exit expected
    childHandlers.get('exit')!(0, 'SIGTERM');

    await expect(pending).rejects.toThrow(/child exited before responding/);
  });

  it('rejects every concurrent waiter on a single exit', async () => {
    const task = new ForkTask('test-path', {}, true);
    const first = call(task, 'send.message');
    const second = call(task, 'mcp.tools');

    childHandlers.get('exit')!(null, 'SIGKILL');

    await expect(first).rejects.toThrow(/child exited before responding/);
    await expect(second).rejects.toThrow(/child exited before responding/);
  });

  it('rejects an in-flight call when the child errors', async () => {
    const task = new ForkTask('test-path', {}, true);
    const pending = call(task, 'send.message');

    childHandlers.get('error')!(new Error('spawn ENOENT'));

    await expect(pending).rejects.toThrow(/child errored: spawn ENOENT/);
  });

  it('rejects on the opt-in timeout', async () => {
    vi.useFakeTimers();
    try {
      const task = new ForkTask('test-path', {}, true);
      const pending = call(task, 'email.connect', { timeoutMs: 5_000 });
      const assertion = expect(pending).rejects.toThrow(/timed out after 5000ms/);

      await vi.advanceTimersByTimeAsync(5_001);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it('still resolves normally on the child callback, and a later exit is harmless', async () => {
    const task = new ForkTask('test-path', {}, true);
    const pending = call(task, 'mcp.tools');

    const sent = mockFcp.postMessage.mock.calls.at(-1)![0] as { pipeId: string };
    (task as any).emit(`${sent.pipeId}.callback`, { state: 'fulfilled', data: ['ok'] });

    await expect(pending).resolves.toEqual(['ok']);

    // The waiter is gone, so the exit sweep must not produce a stray rejection.
    expect(() => childHandlers.get('exit')!(0, null)).not.toThrow();
  });

  it('does not leave the callback listener behind after an exit rejection', async () => {
    const task = new ForkTask('test-path', {}, true);
    const pending = call(task, 'send.message');
    const sent = mockFcp.postMessage.mock.calls.at(-1)![0] as { pipeId: string };

    childHandlers.get('exit')!(1, null);
    await expect(pending).rejects.toThrow();

    expect((task as any).listener[`${sent.pipeId}.callback`] ?? []).toHaveLength(0);
  });
});
