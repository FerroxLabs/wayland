/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The descendant walk in `platform-package-smoke.mjs` had no coverage at all,
 * and it assumed the process table is a tree. It is not: Windows recycles PIDs,
 * so a surviving child whose parent slot was reused can report a ppid that is
 * itself inside the subtree being walked. That is a cycle, and the walk refilled
 * its queue forever until `Array.push` hit the 2^32-1 limit and threw
 * "RangeError: Invalid array length".
 *
 * It took down the windows-x64 leg of the v0.12.1 release AFTER a clean build
 * and a successful 181s silent install, and the identical windows-arm64 leg
 * passed - which is what a data-dependent defect looks like from the outside.
 */
import { describe, expect, it } from 'vitest';
import { listDescendantPids, listDescendantProcessRecords } from '../../../scripts/platform-package-smoke.mjs';

/** Feed the real win32 parser a synthetic Get-CimInstance payload. */
function winSnapshot(rows: Array<{ pid: number; ppid: number; name?: string }>) {
  const payload = JSON.stringify(
    rows.map((r) => ({
      ProcessId: r.pid,
      ParentProcessId: r.ppid,
      CreationDate: '20260818000000.000000+000',
      ExecutablePath: `C:\\\\p\\\\${r.name || `p${r.pid}`}.exe`,
      Name: `${r.name || `p${r.pid}`}.exe`,
      CommandLine: `${r.name || `p${r.pid}`}.exe`,
    }))
  );
  return { execFileSync: () => payload };
}

describe('descendant walk over a process table that is not a tree', () => {
  it('returns every descendant of a normal tree, depth first from the root (known positive)', () => {
    // Without this the cycle cases below could pass by returning nothing.
    const deps = winSnapshot([
      { pid: 100, ppid: 1 },
      { pid: 200, ppid: 100 },
      { pid: 300, ppid: 100 },
      { pid: 400, ppid: 200 },
      { pid: 999, ppid: 1 }, // unrelated, must NOT appear
    ]);

    expect(listDescendantPids(100, 'win32', deps).sort()).toEqual([200, 300, 400]);
  });

  it('TERMINATES when a descendant claims a parent inside the subtree (PID reuse)', () => {
    // 400's parent slot was recycled and now points back at 200, closing a loop
    // 200 -> 400 -> 200. Before the visited set this never returned: it grew the
    // result array until push threw RangeError.
    const deps = winSnapshot([
      { pid: 100, ppid: 1 },
      { pid: 200, ppid: 100 },
      { pid: 400, ppid: 200 },
      { pid: 200, ppid: 400 },
    ]);

    const pids = listDescendantPids(100, 'win32', deps);
    expect(pids).toContain(200);
    expect(pids).toContain(400);
    // One entry per process, however many parents claim it.
    expect(new Set(pids).size).toBe(pids.length);
  });

  it('TERMINATES when a process is its own parent', () => {
    const deps = winSnapshot([
      { pid: 100, ppid: 1 },
      { pid: 250, ppid: 100 },
      { pid: 250, ppid: 250 },
    ]);

    expect(listDescendantPids(100, 'win32', deps)).toEqual([250]);
  });

  it('TERMINATES when a child points back at the root itself', () => {
    const deps = winSnapshot([
      { pid: 100, ppid: 500 },
      { pid: 500, ppid: 100 },
    ]);

    expect(listDescendantPids(100, 'win32', deps)).toEqual([500]);
  });

  it('carries the full record through, not just the pid', () => {
    const deps = winSnapshot([
      { pid: 100, ppid: 1 },
      { pid: 200, ppid: 100, name: 'Wayland' },
    ]);

    const [record] = listDescendantProcessRecords(100, 'win32', deps);
    expect(record.pid).toBe(200);
    expect(record.scopeText).toContain('Wayland');
    expect(record.identity).toContain('20260818000000');
  });
});
