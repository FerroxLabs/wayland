/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #645 Task 4 — terminalBridge behavior + guards. Verifies the backend
 * feature-flag refusal, the resolve/spawn/stream happy path, and that
 * input/resize/close drive the registered PTY.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => {
  const handlers: Record<string, (p: unknown) => unknown> = {};
  return {
    handlers,
    outputEmit: vi.fn(),
    exitEmit: vi.fn(),
    spawn: vi.fn(),
    getConversation: vi.fn(),
    isEnabled: vi.fn(),
    resolveCmd: vi.fn(),
    resolvePath: vi.fn(),
    reg: {
      registerPty: vi.fn(),
      killPty: vi.fn(),
      forgetPty: vi.fn(),
      getPty: vi.fn(),
      hasPty: vi.fn(() => false),
      livePtyCount: vi.fn(() => 0),
    },
  };
});

vi.mock('@/common', () => ({
  ipcBridge: {
    terminal: {
      open: { provider: (fn: (p: unknown) => unknown) => (m.handlers.open = fn) },
      input: { provider: (fn: (p: unknown) => unknown) => (m.handlers.input = fn) },
      resize: { provider: (fn: (p: unknown) => unknown) => (m.handlers.resize = fn) },
      close: { provider: (fn: (p: unknown) => unknown) => (m.handlers.close = fn) },
      output: { emit: m.outputEmit },
      exit: { emit: m.exitEmit },
    },
  },
}));
vi.mock('@lydell/node-pty', () => ({ spawn: m.spawn }));
vi.mock('@process/services/database/SqliteConversationRepository', () => ({
  SqliteConversationRepository: class {
    getConversation = m.getConversation;
  },
}));
vi.mock('@process/utils/shellEnv', () => ({ getEnhancedEnv: () => ({ PATH: '/usr/bin' }) }));
vi.mock('@process/terminal/terminalConfig', () => ({
  isTerminalModeEnabled: m.isEnabled,
  TERMINAL_ENABLED_KEY: 'terminal.enabled',
}));
vi.mock('@process/terminal/terminalCommand', () => ({ resolveTerminalCommand: m.resolveCmd }));
vi.mock('@process/terminal/terminalPath', () => ({ resolveCommandPath: m.resolvePath }));
vi.mock('@process/terminal/terminalRegistry', () => m.reg);

import { initTerminalBridge } from '@process/terminal/terminalBridge';

function makeFakePty() {
  const cbs: { data?: (d: string) => void; exit?: (e: { exitCode: number }) => void } = {};
  return {
    pid: 4242,
    onData: (cb: (d: string) => void) => (cbs.data = cb),
    onExit: (cb: (e: { exitCode: number }) => void) => (cbs.exit = cb),
    write: vi.fn(),
    resize: vi.fn(),
    kill: vi.fn(),
    _cbs: cbs,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  m.reg.hasPty.mockReturnValue(false);
  m.reg.livePtyCount.mockReturnValue(0);
  m.isEnabled.mockResolvedValue(true);
  m.getConversation.mockResolvedValue({ type: 'acp', extra: { backend: 'claude', workspace: process.cwd() } });
  m.resolveCmd.mockReturnValue({ command: 'claude', args: [], cwd: process.cwd() });
  m.resolvePath.mockReturnValue('/usr/local/bin/claude');
  initTerminalBridge();
});

const open = (p: object) =>
  m.handlers.open({ terminalId: 't1', sessionId: 's1', ...p }) as Promise<{ ok: boolean; reason?: string }>;

describe('terminalBridge open guards (#645)', () => {
  it('refuses with reason "disabled" when the feature flag is off (backend guard)', async () => {
    m.isEnabled.mockResolvedValue(false);
    const res = await open({});
    expect(res).toEqual({ ok: false, reason: 'disabled' });
    expect(m.spawn).not.toHaveBeenCalled();
  });

  it('refuses "not-found" when the session id does not resolve', async () => {
    m.getConversation.mockResolvedValue(undefined);
    expect(await open({})).toEqual({ ok: false, reason: 'not-found' });
    expect(m.spawn).not.toHaveBeenCalled();
  });

  it('refuses "unsupported" when the agent has no TUI mapping', async () => {
    m.resolveCmd.mockReturnValue(null);
    expect(await open({})).toEqual({ ok: false, reason: 'unsupported' });
    expect(m.spawn).not.toHaveBeenCalled();
  });

  it('refuses "missing-cli" when the mapped command is not on PATH', async () => {
    m.resolvePath.mockReturnValue(null);
    expect(await open({})).toEqual({ ok: false, reason: 'missing-cli' });
    expect(m.spawn).not.toHaveBeenCalled();
  });

  it('refuses "at-capacity" at the concurrent-PTY cap', async () => {
    m.reg.livePtyCount.mockReturnValue(8);
    expect(await open({})).toEqual({ ok: false, reason: 'at-capacity' });
    expect(m.spawn).not.toHaveBeenCalled();
  });
});

describe('terminalBridge open happy path (#645)', () => {
  it('spawns the resolved command, registers it, and streams output + exit', async () => {
    const pty = makeFakePty();
    m.spawn.mockReturnValue(pty);

    const res = await open({ cols: 120, rows: 40 });
    expect(res).toEqual({ ok: true });

    // Spawns the PATH-resolved absolute command with the resolved env + size.
    expect(m.spawn).toHaveBeenCalledWith(
      '/usr/local/bin/claude',
      [],
      expect.objectContaining({ cols: 120, rows: 40, cwd: process.cwd() })
    );
    expect(m.reg.registerPty).toHaveBeenCalledWith('t1', pty);

    // PTY output streams to the renderer, keyed by terminalId.
    pty._cbs.data?.('hello');
    expect(m.outputEmit).toHaveBeenCalledWith({ terminalId: 't1', data: 'hello' });

    // On exit the PTY is deregistered and an exit event fires.
    pty._cbs.exit?.({ exitCode: 0 });
    expect(m.reg.forgetPty).toHaveBeenCalledWith('t1');
    expect(m.exitEmit).toHaveBeenCalledWith({ terminalId: 't1', exitCode: 0 });
  });

  it('is idempotent — re-opening a live terminal does not double-spawn', async () => {
    m.reg.hasPty.mockReturnValue(true);
    expect(await open({})).toEqual({ ok: true });
    expect(m.spawn).not.toHaveBeenCalled();
  });
});

describe('terminalBridge input/resize/close (#645)', () => {
  it('writes input to the live PTY', async () => {
    const pty = makeFakePty();
    m.reg.getPty.mockReturnValue(pty);
    await m.handlers.input({ terminalId: 't1', data: 'ls\r' });
    expect(pty.write).toHaveBeenCalledWith('ls\r');
  });

  it('resizes the live PTY (ignores non-positive dims)', async () => {
    const pty = makeFakePty();
    m.reg.getPty.mockReturnValue(pty);
    await m.handlers.resize({ terminalId: 't1', cols: 100, rows: 30 });
    expect(pty.resize).toHaveBeenCalledWith(100, 30);
    await m.handlers.resize({ terminalId: 't1', cols: 0, rows: 0 });
    expect(pty.resize).toHaveBeenCalledTimes(1);
  });

  it('close kills the PTY via the registry', async () => {
    await m.handlers.close({ terminalId: 't1' });
    expect(m.reg.killPty).toHaveBeenCalledWith('t1');
  });
});
