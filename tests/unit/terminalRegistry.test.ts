/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #645 Task 4 — PTY registry no-orphan behavior. Uses fake IPtys so no real
 * process is signalled; the force-kill fallback is injected and asserted.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  forgetPty,
  getPty,
  hasPty,
  killAllPtys,
  killPty,
  livePtyCount,
  registerPty,
} from '@process/terminal/terminalRegistry';

type FakePty = { pid: number; kill: ReturnType<typeof vi.fn> };
const fakePty = (pid: number): FakePty => ({ pid, kill: vi.fn() });

afterEach(() => killAllPtys(() => void 0)); // drain any leftover between tests

describe('terminalRegistry (#645)', () => {
  it('tracks and looks up a live PTY by id', () => {
    const p = fakePty(11);
    registerPty('t1', p as never);
    expect(hasPty('t1')).toBe(true);
    expect(getPty('t1')).toBe(p);
    expect(livePtyCount()).toBe(1);
  });

  it('killPty kills the PTY and deregisters it (idempotent)', () => {
    const p = fakePty(22);
    registerPty('t2', p as never);
    killPty('t2');
    expect(p.kill).toHaveBeenCalledTimes(1);
    expect(hasPty('t2')).toBe(false);
    expect(() => killPty('t2')).not.toThrow(); // no-op second time
    expect(p.kill).toHaveBeenCalledTimes(1);
  });

  it('registering a different PTY under a live id kills the displaced one (no orphan)', () => {
    const first = fakePty(51);
    const second = fakePty(52);
    registerPty('dup', first as never);
    registerPty('dup', second as never);
    expect(first.kill).toHaveBeenCalledTimes(1); // displaced -> killed
    expect(second.kill).not.toHaveBeenCalled();
    expect(getPty('dup')).toBe(second);
    expect(livePtyCount()).toBe(1);
  });

  it('forgetPty drops bookkeeping without killing (self-exit path)', () => {
    const p = fakePty(33);
    registerPty('t3', p as never);
    forgetPty('t3');
    expect(hasPty('t3')).toBe(false);
    expect(p.kill).not.toHaveBeenCalled();
  });

  it('killAllPtys force-reaps every live PTY (graceful kill + pid fallback)', () => {
    const a = fakePty(101);
    const b = fakePty(102);
    registerPty('a', a as never);
    registerPty('b', b as never);
    const forceKill = vi.fn();
    killAllPtys(forceKill);
    expect(a.kill).toHaveBeenCalledTimes(1);
    expect(b.kill).toHaveBeenCalledTimes(1);
    expect(forceKill).toHaveBeenCalledWith(101);
    expect(forceKill).toHaveBeenCalledWith(102);
    expect(livePtyCount()).toBe(0);
  });
});
