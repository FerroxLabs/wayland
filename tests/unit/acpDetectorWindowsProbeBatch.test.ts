/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Windows start-up probe storm (0.13.1).
 *
 * Start-up asks "which of these ~20 agent CLIs exist?". The pre-0.13.1 shape
 * answered that with `where <cli>` AND a separate `powershell -Command
 * Get-Command <cli>` PER CLI, fired together. PowerShell start-up is slow, so
 * on a loaded Windows box every one of those spawns sat until its own 5s
 * timeout expired: window creation missed the smoke harness's readiness window
 * ("Electron renderer did not become ready"), and the probes outlived quit
 * ("packaged app did not shut down cleanly", 63 descendants). Five release-run
 * legs died on it across win32-arm64, win32-x64 and darwin-x64.
 *
 * The fix keeps the cheap `where` pass and collapses the PowerShell fallback
 * into ONE process for every CLI `where` missed. These tests pin the process
 * count, not the timing, so they fail if the per-CLI shape ever returns.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const safeExecFileMock = vi.fn();
const safeExecMock = vi.fn();
vi.mock('@process/utils/safeExec', () => ({
  safeExec: (...args: unknown[]) => safeExecMock(...args),
  safeExecFile: (...args: unknown[]) => safeExecFileMock(...args),
}));

const execSyncMock = vi.fn();
vi.mock('child_process', () => ({ execSync: (...args: unknown[]) => execSyncMock(...args) }));

vi.mock('@process/utils/shellEnv', () => ({ getEnhancedEnv: () => ({ PATH: 'C:\\Windows\\System32' }) }));
vi.mock('@process/extensions', () => ({
  ExtensionRegistry: { getInstance: () => ({ getAcpAdapters: () => [] }) },
}));
vi.mock('@process/utils/initStorage', () => ({ ProcessConfig: { get: async () => undefined } }));

const CLIS = ['claude', 'codex', 'goose', 'hermes', 'kimi', 'cursor', 'aider', 'snow'];
vi.mock('@/common/types/acpTypes', () => ({
  POTENTIAL_ACP_CLIS: [
    { cmd: 'claude', args: ['--acp'], name: 'Claude Code', backendId: 'claude' },
    { cmd: 'codex', args: ['--acp'], name: 'Codex', backendId: 'codex' },
    { cmd: 'goose', args: ['--acp'], name: 'Goose', backendId: 'goose' },
    { cmd: 'hermes', args: ['--acp'], name: 'Hermes', backendId: 'hermes' },
    { cmd: 'kimi', args: ['--acp'], name: 'Kimi', backendId: 'kimi' },
    { cmd: 'cursor', args: ['--acp'], name: 'Cursor', backendId: 'cursor' },
    { cmd: 'aider', args: ['--acp'], name: 'Aider', backendId: 'aider' },
    { cmd: 'snow', args: ['--acp'], name: 'Snow', backendId: 'snow' },
  ],
}));

const originalPlatform = process.platform;

async function freshDetector() {
  vi.resetModules();
  const mod = await import('@process/agent/acp/AcpDetector');
  return mod.acpDetector;
}

/** No CLI is on the Windows PATH; PowerShell resolves whatever `psFinds` lists. */
function nothingOnPath(psFinds: string[] = []) {
  return (file: string, args: string[]): Promise<{ stdout: string; stderr: string }> => {
    if (file === 'where') return Promise.reject(new Error(`'where' could not find ${args[0]}`));
    if (file === 'powershell') return Promise.resolve({ stdout: psFinds.join('\n') + '\n', stderr: '' });
    if (file === 'wsl.exe') return Promise.reject(new Error('no distro'));
    return Promise.reject(new Error(`unexpected exec: ${file}`));
  };
}

describe('AcpDetector Windows probe batching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(process, 'platform', { value: 'win32' });
    // No WSL distro, so the WSL fallback never spawns.
    execSyncMock.mockImplementation(() => {
      throw new Error('wsl.exe: no installed distributions');
    });
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('spawns exactly ONE PowerShell for every CLI that `where` missed', async () => {
    safeExecFileMock.mockImplementation(nothingOnPath());

    const detector = await freshDetector();
    await detector.detectBuiltinAgents();

    const psCalls = safeExecFileMock.mock.calls.filter((c) => c[0] === 'powershell');
    expect(psCalls).toHaveLength(1);

    // One `where` per CLI is fine - those are cheap - but PowerShell is not.
    const whereCalls = safeExecFileMock.mock.calls.filter((c) => c[0] === 'where');
    expect(whereCalls).toHaveLength(CLIS.length);

    // The single call must actually carry every missed CLI, not just the first.
    const script = String(psCalls[0][1][3]);
    for (const cli of CLIS) expect(script).toContain(`'${cli}'`);
  });

  it('reports CLIs that only PowerShell can resolve', async () => {
    safeExecFileMock.mockImplementation(nothingOnPath(['goose', 'kimi']));

    const detector = await freshDetector();
    const backends = (await detector.detectBuiltinAgents()).map((a) => a.backend);

    expect(backends).toContain('goose');
    expect(backends).toContain('kimi');
    expect(backends).not.toContain('claude');
  });

  it('ignores output lines that were not asked about', async () => {
    // A localized PowerShell banner or stray line must not become an agent.
    safeExecFileMock.mockImplementation(nothingOnPath(['goose', 'Windows PowerShell', 'notrequested']));

    const detector = await freshDetector();
    const backends = (await detector.detectBuiltinAgents()).map((a) => a.backend);

    expect(backends).toContain('goose');
    expect(backends).not.toContain('notrequested');
  });

  it('survives a PowerShell probe that fails outright', async () => {
    safeExecFileMock.mockImplementation((file: string) => {
      if (file === 'where') return Promise.reject(new Error('not found'));
      if (file === 'powershell') return Promise.reject(new Error('timed out'));
      return Promise.reject(new Error('no distro'));
    });

    const detector = await freshDetector();
    await expect(detector.detectBuiltinAgents()).resolves.toBeDefined();
  });

  // isCliAvailable() only ever asks about one CLI, so this pins the sync path's
  // SHAPE (where -> at most one PowerShell -> WSL), not the batching itself.
  it('sync one-off check spawns at most one PowerShell', async () => {
    const seen: string[] = [];
    execSyncMock.mockImplementation((cmd: string) => {
      seen.push(cmd);
      if (cmd.startsWith('where ')) throw new Error('not found');
      if (cmd.startsWith('powershell ')) return 'goose\n';
      throw new Error('wsl.exe: no installed distributions');
    });

    const detector = await freshDetector();
    // isCliAvailable() is the one-off sync entry point used during start-up.
    expect(detector.isCliAvailable('goose')).toBe(true);

    const psCalls = seen.filter((c) => c.startsWith('powershell '));
    expect(psCalls).toHaveLength(1);
  });

  // Measured on nine win32-arm64 release legs: the batched probe hit its 15s
  // ceiling and resolved NOTHING on every one, while detection still reported
  // the same two agents. Two serialized rounds cost ~30s of start-up for zero
  // detections, so the ceiling has to stay small enough to fail fast.
  it('keeps the async PowerShell ceiling small enough to fail fast', async () => {
    const options: Array<Record<string, unknown>> = [];
    safeExecFileMock.mockImplementation((file: string, _args: string[], opts: Record<string, unknown>) => {
      if (file === 'where') return Promise.reject(new Error('not found'));
      if (file === 'powershell') {
        options.push(opts);
        return Promise.resolve({ stdout: '', stderr: '' });
      }
      return Promise.reject(new Error('no distro'));
    });

    const detector = await freshDetector();
    await detector.detectBuiltinAgents();

    expect(options).toHaveLength(1);
    // A start-up probe that has not answered in this long will not answer usefully.
    expect(options[0].timeout).toBeLessThanOrEqual(5000);
  });

  // #1410: the sync path runs execSync on the Electron main thread, so its
  // ceiling IS the UI freeze. It inherited the async path's 15s budget, and a
  // single missing CLI held win-arm64's main thread for the full 15s twice in a
  // row, stalling the CDP endpoint and failing the packaged smoke both times.
  it('caps the sync PowerShell probe well below the async ceiling', async () => {
    const options: Array<Record<string, unknown>> = [];
    execSyncMock.mockImplementation((cmd: string, opts: Record<string, unknown>) => {
      if (cmd.startsWith('powershell ')) {
        options.push(opts);
        return 'goose\n';
      }
      if (cmd.startsWith('where ')) throw new Error('not found');
      throw new Error('wsl.exe: no installed distributions');
    });

    const detector = await freshDetector();
    detector.isCliAvailable('goose');

    expect(options).toHaveLength(1);
    // Anything at or above the async 15s ceiling is a UI freeze of that length.
    expect(options[0].timeout).toBeLessThanOrEqual(3000);
  });
});
