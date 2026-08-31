import { describe, it, expect } from 'vitest';
import { _collectDescendantPidsFromPsTable, __killChildTesting } from '@process/agent/acp/utils';

/**
 * The engine is disposable; a chart application a connector launched FOR THE USER
 * is not. `WorkerTaskManager` reaps an idle engine 5 min after the user hits send,
 * and the sweep took the user's chart with it because the app is a grandchild.
 *
 * These drive the real BFS against a synthetic `ps` table rather than real
 * processes: macOS Gatekeeper SIGKILLs any hand-made `.app` bundle whose
 * signature identifier does not match (exit 137), so a real fixture cannot exist,
 * and Linux CI has no bundles at all.
 */
const TV = '/Applications/TradingView.app/Contents/MacOS/TradingView';

// engine 100 -> mcp server 200 -> TradingView 300 -> its helpers 301/302
//            -> ordinary tool subprocess 201 -> grandchild 202
const TABLE = [
  '  100     1 /path/to/wayland-core',
  '  200   100 /usr/bin/node',
  `  300   200 ${TV}`,
  `  301   300 ${TV} Helper (Renderer)`,
  `  302   300 ${TV} Helper (GPU)`,
  '  201   100 /usr/bin/python3',
  '  202   201 /bin/sh',
  '  999     1 /some/unrelated/process',
].join('\n');

describe('the descendant sweep spares connector-launched user applications', () => {
  it('does not collect the application, so it is never SIGKILLed', () => {
    expect(_collectDescendantPidsFromPsTable(TABLE, 100)).not.toContain(300);
  });

  it('spares its helper children too — killing those breaks the app just as thoroughly', () => {
    const pids = _collectDescendantPidsFromPsTable(TABLE, 100);
    expect(pids).not.toContain(301);
    expect(pids).not.toContain(302);
  });

  it('still collects every ordinary descendant, so the exemption is not a blanket amnesty', () => {
    const pids = _collectDescendantPidsFromPsTable(TABLE, 100);
    expect(pids).toEqual(expect.arrayContaining([200, 201, 202]));
  });

  it('never reaches outside the engine tree', () => {
    expect(_collectDescendantPidsFromPsTable(TABLE, 100)).not.toContain(999);
  });

  it('exempts the app and helpers by exact executable path', () => {
    const { isExternalGuiApp } = __killChildTesting;
    expect(isExternalGuiApp(TV)).toBe(true);
    expect(isExternalGuiApp(`${TV} Helper (Renderer)`)).toBe(true);
  });

  it('refuses a forged exemption from a user-writable path', () => {
    const { isExternalGuiApp } = __killChildTesting;
    // an unanchored suffix match would wrongly exempt all three of these
    expect(isExternalGuiApp('/tmp/TradingView.app/Contents/MacOS/TradingView')).toBe(false);
    expect(isExternalGuiApp('/Users/x/Downloads/TradingView.app/Contents/MacOS/TradingView')).toBe(false);
    expect(isExternalGuiApp('/usr/bin/node /Applications/TradingView.app/Contents/MacOS/TradingView')).toBe(false);
    expect(isExternalGuiApp('/bin/sleep')).toBe(false);
  });
});

describe('the exemption is macOS-only, and Linux inertness is deliberate', () => {
  it('does NOT spare a Linux chart, because ps -eo comm= gives a bare name there', () => {
    // Verified on Ubuntu 24.04: `ps -eo comm=` prints `TradingView`, not the
    // absolute path macOS prints, and truncates at 15 chars (TASK_COMM_LEN). The
    // anchored pattern therefore cannot match, so a Linux chart dies with the
    // engine exactly as it did before the fix.
    //
    // This asserts the GAP so CI is not blind to it. When Linux identity moves
    // to readlink /proc/<pid>/exe, this test should fail and be rewritten -- that
    // is the point of it.
    const linuxTable = ['100 4 wayland-core', '200 100 node', '300 200 TradingView', '301 300 TradingView'].join('\n');
    expect(_collectDescendantPidsFromPsTable(linuxTable, 100)).toEqual([200, 300, 301]);
  });
});
