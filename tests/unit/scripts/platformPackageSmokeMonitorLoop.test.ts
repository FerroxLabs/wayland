/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * THE WIN32-ARM64 BUG, as a test.
 *
 * `createProcessMonitor` polled a SYNCHRONOUS process snapshot on a 25ms
 * interval. On Windows that snapshot is a PowerShell + Get-CimInstance round
 * trip, and on a win-arm64 runner a single PowerShell takes seconds to start -
 * the packaged app's own detector logs it timing out at 5000ms. So for the whole
 * readiness window the harness sat inside execFileSync with its event loop
 * blocked, unable to service the CDP socket it was waiting on.
 *
 * Measured, not inferred: the socket lifecycle trace on the v0.13.2 tag recorded
 * a LOOPBACK WebSocket handshake completing in 44929ms and the send callback
 * 44761ms after that, against a 90s command budget. The app was fine throughout -
 * 178 heartbeats, zero stalls, all four processes alive, and the DevTools HTTP
 * endpoint still answering. Every "CDP command timed out" on that platform was
 * this process starving itself.
 *
 * The assertion is therefore about the EVENT LOOP, not about process records: a
 * monitor whose sampling blocks cannot be distinguished from a wedged app by any
 * other means, which is exactly what cost eighteen release attempts.
 */
import { describe, expect, it } from 'vitest';
import { createProcessMonitor } from '../../../scripts/platform-package-smoke.mjs';

const ROWS = JSON.stringify([
  {
    ProcessId: 4242,
    ParentProcessId: 1,
    CreationDate: 'now',
    ExecutablePath: 'C:\\app\\Wayland.exe',
    Name: 'Wayland.exe',
    CommandLine: 'Wayland.exe',
  },
  {
    ProcessId: 5555,
    ParentProcessId: 4242,
    CreationDate: 'now',
    ExecutablePath: 'C:\\app\\Wayland.exe',
    Name: 'Wayland.exe',
    CommandLine: 'Wayland.exe --type=renderer',
  },
]);

/** A snapshot that costs real wall-clock, the way PowerShell does on win-arm64. */
const SAMPLE_COST_MS = 25;

describe('the process monitor must not starve the loop it shares with CDP', () => {
  it('keeps timers on schedule while sampling a slow Windows process table', async () => {
    // Synchronous, and it BLOCKS - this is what the old poll called.
    const execFileSync = () => {
      const until = Date.now() + SAMPLE_COST_MS;
      while (Date.now() < until) {
        /* spin, exactly as a blocking snapshot does */
      }
      return ROWS;
    };
    // Asynchronous, same cost, off the loop - this is what the poll calls now.
    const execFile = (
      _command: string,
      _args: string[],
      _options: unknown,
      callback: (error: Error | null, stdout: string) => void
    ) => {
      setTimeout(() => callback(null, ROWS), SAMPLE_COST_MS);
    };

    const monitor = createProcessMonitor(4242, 'win32', {
      execFileSync,
      execFile,
      processMonitorIntervalMs: 1,
    });

    // Twenty 5ms timers. With a free loop that is ~100ms; with a blocking poll on
    // a 1ms interval the loop is saturated and every one of them slips.
    const started = Date.now();
    for (let i = 0; i < 20; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    const elapsed = Date.now() - started;
    monitor.stop();

    expect(elapsed).toBeLessThan(400);
  });

  it('still returns the descendants it was built to observe', async () => {
    const execFile = (
      _command: string,
      _args: string[],
      _options: unknown,
      callback: (error: Error | null, stdout: string) => void
    ) => callback(null, ROWS);
    const monitor = createProcessMonitor(4242, 'win32', {
      execFileSync: () => ROWS,
      execFile,
      processMonitorIntervalMs: 1,
    });
    await new Promise((resolve) => setTimeout(resolve, 30));
    const records = monitor.stop();
    expect(records.map((record: { pid: number }) => record.pid)).toEqual([5555]);
  });

  it('survives a sample that fails without losing the ones that worked', async () => {
    let calls = 0;
    const execFile = (
      _command: string,
      _args: string[],
      _options: unknown,
      callback: (error: Error | null, stdout: string) => void
    ) => {
      calls += 1;
      if (calls === 1) return callback(new Error('wmi is not responding'), '');
      return callback(null, ROWS);
    };
    const monitor = createProcessMonitor(4242, 'win32', {
      execFileSync: () => ROWS,
      execFile,
      processMonitorIntervalMs: 1,
    });
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(calls).toBeGreaterThan(1);
    expect(monitor.stop().map((record: { pid: number }) => record.pid)).toEqual([5555]);
  });
});
