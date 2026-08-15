/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * K-03 Task 1 - the literal, unmocked, real-process proof for TRN-01/TRN-03:
 * a `stream_end` frame whose bytes are fully written to a REAL, separately
 * spawned OS process's stdout, but whose trailing newline delimiter is NEVER
 * sent, is still recovered by the real production `DesktopCoreV1Consumer` -
 * the exact defect reported ("no further engine activity in the log", turn
 * stuck running), reproduced against real OS pipe bytes rather than a string
 * fixture.
 *
 * This spawns `fixtures/unterminatedLineHarness.ts` as a genuinely separate
 * OS process, wires its REAL `stdout` directly into a REAL
 * `DesktopCoreV1Consumer` instance the exact same way `index.ts`'s `'data'`
 * listener does in production (`child.stdout.on('data', chunk =>
 * consumer.consumeChunk(chunk))`), waits for the marker file proving the
 * partial write physically landed in the OS pipe, then asserts the
 * `stream_end` event is already recovered BEFORE the child ever writes
 * another byte or exits.
 *
 * RED (pre-fix): this assertion never becomes true against today's code -
 * the poll bound is hit and the test times out, because the real OS pipe
 * delivers the partial write as a `data` event with no trailing `\n`, and
 * today's `consumeChunk` buffers it into `inputRemainder` with zero
 * observable effect, matching the report exactly.
 */
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DesktopCoreV1Consumer, type DesktopCoreConsumeResult } from '@/process/agent/wcore/desktopContractV1';

const REPO_ROOT = resolve(__dirname, '..', '..', '..');
const HARNESS_PATH = resolve(__dirname, 'fixtures', 'unterminatedLineHarness.ts');

/** Poll until `predicate()` is true or `timeoutMs` elapses. */
async function waitFor(predicate: () => boolean, timeoutMs = 15000, intervalMs = 50): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`waitFor: condition not met within ${timeoutMs}ms`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

describe('K-03: a real, unterminated stream_end frame is recovered without waiting for its newline', () => {
  let root: string;
  let markerPath: string;
  let child: ChildProcessWithoutNullStreams | null;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'wayland-wcore-unterminated-'));
    markerPath = join(root, 'marker');
    child = null;
  });

  afterEach(() => {
    if (child && !child.killed) child.kill('SIGKILL');
    rmSync(root, { recursive: true, force: true });
  });

  it('recovers a complete, unterminated stream_end the instant its bytes arrive, before the child writes anything else or exits', async () => {
    const consumer = new DesktopCoreV1Consumer();
    const results: DesktopCoreConsumeResult[] = [];

    child = spawn('bun', [HARNESS_PATH, markerPath], {
      cwd: REPO_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.stdout.on('data', (chunk: Buffer) => {
      // The exact wiring index.ts's 'data' listener uses in production.
      results.push(...consumer.consumeChunk(chunk));
    });

    try {
      // Proves the partial write physically landed in the OS pipe, not
      // merely that the harness function returned.
      await waitFor(() => existsSync(markerPath));

      await waitFor(
        () =>
          results.some(
            (r) =>
              r.kind === 'event' &&
              r.event.type === 'stream_end' &&
              r.event.msg_id === 'm1' &&
              r.event.finish_reason === 'stop'
          ),
        15000
      );
    } catch (error) {
      throw new Error(
        `stream_end was not recovered from the unterminated frame; stderr: ${stderr}; results so far: ${JSON.stringify(results)}; original error: ${(error as Error).message}`
      );
    }

    // The child is still alive and has written nothing further - the
    // recovery happened purely because the bytes already received formed a
    // complete object, not because of a subsequent delimiter or exit.
    expect(child.killed).toBe(false);
    expect(child.exitCode).toBeNull();

    const exited = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolvePromise) => {
      child?.once('exit', (code, signal) => resolvePromise({ code, signal }));
    });
    child.kill('SIGKILL');
    const { signal } = await exited;
    expect(signal).toBe('SIGKILL');
  }, 30000);
});
