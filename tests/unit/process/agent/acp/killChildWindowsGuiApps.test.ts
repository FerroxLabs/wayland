/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The Windows half of the external-GUI-app prune.
 *
 * SYNTHETIC TABLE, for the same reason as the macOS sibling and one more: a real
 * fixture would need a signed TradingView install on a CI runner, and the macOS
 * lesson was that hand-made app bundles get SIGKILLed rather than exempted.
 *
 * What makes the Windows case different, and what these tests pin:
 *   - `%PROGRAMFILES%` / `WindowsApps` are admin-writable, so a path anchor is
 *     evidence on its own, exactly as `/Applications` is on macOS.
 *   - `%LOCALAPPDATA%` is USER-writable. A path there proves nothing, so it is
 *     exempt only with a valid Authenticode signature. That is the whole reason
 *     the Windows path is not a straight port of the POSIX one.
 */
import { describe, expect, it } from 'vitest';

import {
  _normalizeWindowsPath,
  _resolveWin32ExemptPaths,
  _win32TableCommands,
  _collectDescendantPidsFromProcTable,
  _windowsGuiAppAnchors,
} from '@process/agent/acp/utils';

const ENV = {
  PROGRAMFILES: 'C:\\Program Files',
  'PROGRAMFILES(X86)': 'C:\\Program Files (x86)',
  LOCALAPPDATA: 'C:\\Users\\trader\\AppData\\Local',
} as NodeJS.ProcessEnv;

const TV_MSIX = 'C:\\Program Files\\WindowsApps\\TradingView.Desktop_3.1.0_x64__v\\TradingView.exe';
const TV_LOCAL = 'C:\\Users\\trader\\AppData\\Local\\TradingView\\TradingView.exe';

const TABLE = [
  '100 4 C:\\Users\\trader\\AppData\\Local\\Programs\\Wayland\\wayland-core.exe',
  '200 100 C:\\Program Files\\nodejs\\node.exe',
  `300 200 ${TV_MSIX}`,
  `301 300 ${TV_MSIX}`, // helper shares the exe path on Windows
  '201 100 C:\\Windows\\System32\\cmd.exe',
  '202 201 C:\\Windows\\System32\\where.exe',
  '203 100 ', // NULL ExecutablePath -> unknown -> must still be collected
  '999 4 C:\\Windows\\explorer.exe',
].join('\n');

const never = async () => false;
const always = async () => true;

async function collect(table: string, env: NodeJS.ProcessEnv, verify: (p: string) => Promise<boolean>) {
  const exempt = await _resolveWin32ExemptPaths(_win32TableCommands(table), env, verify);
  return _collectDescendantPidsFromProcTable(table, 100, (command) => {
    const n = _normalizeWindowsPath(command);
    return n !== null && exempt.has(n);
  });
}

describe('killChild spares a connector-launched TradingView on Windows', () => {
  it('does not collect the chart or its helpers, but does collect everything else', async () => {
    const pids = await collect(TABLE, ENV, never);
    expect(pids).not.toContain(300);
    expect(pids).not.toContain(301);
    expect(pids).toEqual(expect.arrayContaining([200, 201, 202, 203]));
  });

  it('never reaches outside the engine subtree', async () => {
    expect(await collect(TABLE, ENV, never)).not.toContain(999);
  });

  it('collects a process whose ExecutablePath is unreadable', async () => {
    // Win32_Process.ExecutablePath is privilege-qualified and can come back
    // empty. Unknown must mean "kill", never "spare": an unkillable unknown is
    // an orphan escape (#139), which is worse than losing a chart.
    expect(await collect(TABLE, ENV, never)).toContain(203);
  });
});

describe('the Windows anchor set refuses forgeries the macOS regex never had to', () => {
  const forgeries = [
    ['a download', 'C:\\Users\\trader\\Downloads\\TradingView.exe'],
    ['a temp dir', 'C:\\Users\\trader\\AppData\\Local\\Temp\\TradingView\\TradingView.exe'],
    ['a sibling directory under Program Files', 'C:\\Program Files\\NotTradingView\\TradingView.exe'],
  ] as const;

  for (const [label, path] of forgeries) {
    it(`refuses ${label}`, async () => {
      const exempt = await _resolveWin32ExemptPaths([path], ENV, always);
      expect(exempt.size).toBe(0);
    });
  }

  it('matches case-insensitively, because Windows paths are', async () => {
    // Asserted so nobody "fixes" this back to the macOS regex's case-sensitivity:
    // on Windows that would make the exemption trivially evadable AND unreliable.
    const exempt = await _resolveWin32ExemptPaths([TV_MSIX.toUpperCase()], ENV, never);
    expect(exempt.size).toBe(1);
  });
});

describe('a user-writable install is exempt only with a valid signature', () => {
  it('exempts %LOCALAPPDATA% when Authenticode is Valid', async () => {
    const exempt = await _resolveWin32ExemptPaths([TV_LOCAL], ENV, always);
    expect(exempt.has(TV_LOCAL.toLowerCase())).toBe(true);
  });

  it('refuses %LOCALAPPDATA% when the signature is not valid', async () => {
    const exempt = await _resolveWin32ExemptPaths([TV_LOCAL], ENV, never);
    expect(exempt.size).toBe(0);
  });

  it('refuses %LOCALAPPDATA% when the signature check itself throws', async () => {
    const boom = async () => {
      throw new Error('powershell blocked by policy');
    };
    const exempt = await _resolveWin32ExemptPaths([TV_LOCAL], ENV, boom);
    expect(exempt.size).toBe(0);
  });

  it('does NOT consult the signature for an admin-writable path', async () => {
    // Parity with macOS: under Program Files the location is the evidence, so a
    // signature call would be pure cost on every engine teardown.
    let called = 0;
    await _resolveWin32ExemptPaths([TV_MSIX], ENV, async () => {
      called += 1;
      return true;
    });
    expect(called).toBe(0);
  });
});

describe('anchors survive a stripped environment', () => {
  it('falls back to the documented Program Files locations', () => {
    // An empty anchor set would exempt nothing and silently kill the chart with
    // no error explaining why, so absent env vars must not produce one.
    const { trusted } = _windowsGuiAppAnchors({} as NodeJS.ProcessEnv);
    expect(trusted.length).toBeGreaterThan(0);
    expect(trusted.some((a) => a.startsWith('c:\\program files'))).toBe(true);
  });

  it('has no user-writable anchors when LOCALAPPDATA is absent', () => {
    expect(_windowsGuiAppAnchors({} as NodeJS.ProcessEnv).userWritable).toEqual([]);
  });
});
