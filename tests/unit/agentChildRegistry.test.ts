/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #443: the last-resort engine-child reaper. The graceful per-agent kill
 * (WorkerTaskManager.clear -> manager.kill -> killChild) is the primary path;
 * this registry-backed reaper runs as the final before-quit step and force-kills
 * any wayland-core / ACP child still alive, so engine processes never orphan past
 * the app ("two sets of Wayland").
 *
 * These tests spawn REAL child processes (POSIX) to exercise the actual kill,
 * mirroring tests/unit/acpKillChild.test.ts.
 */
import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import { isProcessAlive } from '../../src/process/agent/acp/utils';
import { trackAgentChild, killAllAgentChildren, liveAgentChildCount } from '../../src/process/agent/agentChildRegistry';

const describeIfPosix = process.platform === 'win32' ? describe.skip : describe;

describeIfPosix('agentChildRegistry - last-resort reaper (#443)', () => {
  it('force-kills every tracked child and empties the registry', async () => {
    const a = spawn('sleep', ['60']);
    const b = spawn('sleep', ['60']);
    trackAgentChild(a);
    trackAgentChild(b);
    expect(liveAgentChildCount()).toBe(2);
    expect(isProcessAlive(a.pid!)).toBe(true);
    expect(isProcessAlive(b.pid!)).toBe(true);

    // Short grace so the SIGTERM->SIGKILL escalation path doesn't pay the full
    // production wait; behavior is identical.
    await killAllAgentChildren(250);

    expect(isProcessAlive(a.pid!)).toBe(false);
    expect(isProcessAlive(b.pid!)).toBe(false);
    expect(liveAgentChildCount()).toBe(0);
  });

  it('group-kills a detached child tree when tracked as detached', async () => {
    // Parent spawns two grandchildren in its own process group.
    const parent = spawn('bash', ['-c', 'sleep 60 & sleep 60 & wait'], { detached: true });
    parent.unref();
    trackAgentChild(parent, true);
    await new Promise((r) => setTimeout(r, 300)); // let grandchildren spawn
    expect(isProcessAlive(parent.pid!)).toBe(true);

    await killAllAgentChildren(250);

    expect(isProcessAlive(parent.pid!)).toBe(false);
    expect(liveAgentChildCount()).toBe(0);
  });

  it('reaps a child even when it ignores SIGTERM (SIGKILL escalation)', async () => {
    const child = spawn('bash', ['-c', 'trap "" TERM; sleep 60']);
    trackAgentChild(child);
    await new Promise((r) => setTimeout(r, 200)); // let the trap install
    expect(isProcessAlive(child.pid!)).toBe(true);

    await killAllAgentChildren(250);

    expect(isProcessAlive(child.pid!)).toBe(false);
    expect(liveAgentChildCount()).toBe(0);
  });

  it('auto-removes a child that exits on its own (no leak, nothing to reap)', async () => {
    const child = spawn('sleep', ['0.05']);
    trackAgentChild(child);
    expect(liveAgentChildCount()).toBe(1);

    // Wait for natural exit; the once("exit") handler must drop it from the set.
    await new Promise<void>((resolve) => child.once('exit', () => resolve()));
    // exit handlers fire on the same tick set; yield once to be safe.
    await new Promise((r) => setTimeout(r, 10));
    expect(liveAgentChildCount()).toBe(0);

    // Reaping an empty registry is a no-op.
    await expect(killAllAgentChildren(250)).resolves.toBeUndefined();
  });

  it('auto-removes a child that fails to spawn (error, no exit) so it does not leak', async () => {
    // A spawn failure emits `error` and NO `exit`; the registry must still drop it.
    const child = spawn('wayland-nonexistent-binary-xyz-123', []);
    trackAgentChild(child);
    await new Promise<void>((resolve) => child.once('error', () => resolve()));
    await new Promise((r) => setTimeout(r, 10));
    expect(liveAgentChildCount()).toBe(0);
  });

  it('ignores null/undefined children', () => {
    const before = liveAgentChildCount();
    trackAgentChild(null);
    trackAgentChild(undefined);
    expect(liveAgentChildCount()).toBe(before);
  });
});
