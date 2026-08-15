/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Local Ollama runtime control.
 *
 * `ollama-local` is keyless, so an unreachable daemon is not a credential
 * failure. Settings needs two facts only the main process can supply - is
 * Ollama installed on THIS machine, and is its daemon up - so it can name the
 * real situation and never offer a "start it" button on a machine with nothing
 * to start.
 */

import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockExistsSync, mockAccessSync, mockSpawn } = vi.hoisted(() => ({
  mockExistsSync: vi.fn<(p: string) => boolean>(),
  mockAccessSync: vi.fn<(p: string) => void>(),
  mockSpawn: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: (p: string) => mockExistsSync(p),
  accessSync: (p: string) => mockAccessSync(p),
  constants: { X_OK: 1 },
}));

vi.mock('node:child_process', () => ({ spawn: (...a: unknown[]) => mockSpawn(...a) }));

// The PATH walk uses the shell-repaired environment; a GUI-launched Electron
// app has a minimal PATH of its own.
vi.mock('@process/utils/shellEnv', () => ({ getEnhancedEnv: () => ({ PATH: '/opt/custom/bin' }) }));

import { findOllamaBinary, getOllamaRuntimeStatus, startOllamaDaemon } from '@process/providers/local/ollamaRuntime';

/** A spawned child that never emits - the detached daemon case. */
function fakeChild() {
  return { on: vi.fn(), unref: vi.fn() };
}

const MAC_APP_BINARY = '/Applications/Ollama.app/Contents/Resources/ollama';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
  mockExistsSync.mockReset().mockReturnValue(false);
  mockAccessSync.mockReset().mockImplementation(() => {});
  mockSpawn.mockReset().mockImplementation(() => fakeChild());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('findOllamaBinary', () => {
  it('finds the macOS app bundle binary without spawning anything', () => {
    // Known positive: without this the "returns null" case below would be
    // indistinguishable from a probe that can never find anything.
    if (process.platform !== 'darwin') return;
    mockExistsSync.mockImplementation((p) => p === MAC_APP_BINARY);

    expect(findOllamaBinary()).toBe(MAC_APP_BINARY);
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('falls back to the shell-repaired PATH', () => {
    // Build it exactly as findOllamaBinary does. `path.join` rewrites EVERY
    // separator on Windows, so the hand-written '/opt/custom/bin\\ollama.exe'
    // could never match the '\\opt\\custom\\bin\\ollama.exe' it actually returns.
    const onPath = path.join('/opt/custom/bin', process.platform === 'win32' ? 'ollama.exe' : 'ollama');
    mockExistsSync.mockImplementation((p) => p === onPath);

    expect(findOllamaBinary()).toBe(onPath);
  });

  it('returns null when nothing on this machine is executable', () => {
    // Present but not executable must NOT count as installed.
    mockExistsSync.mockReturnValue(true);
    mockAccessSync.mockImplementation(() => {
      throw new Error('EACCES');
    });

    expect(findOllamaBinary()).toBeNull();
  });
});

describe('getOllamaRuntimeStatus', () => {
  it('reports installed-but-down when the binary exists and the daemon refuses', async () => {
    mockExistsSync.mockImplementation((p) => p === MAC_APP_BINARY);

    const status = await getOllamaRuntimeStatus();

    expect(status.installed).toBe(process.platform === 'darwin');
    expect(status.running).toBe(false);
  });

  it('reports running when the daemon answers /api/tags', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

    expect((await getOllamaRuntimeStatus()).running).toBe(true);
  });

  it('reports not-running for a non-2xx answer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    expect((await getOllamaRuntimeStatus()).running).toBe(false);
  });
});

describe('startOllamaDaemon', () => {
  it('never spawns anything when Ollama is not installed', async () => {
    expect(await startOllamaDaemon()).toEqual({ ok: false, reason: 'not-installed' });
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('is a no-op success when the daemon is already up', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

    expect(await startOllamaDaemon()).toEqual({ ok: true });
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('spawns `serve` detached and reports ok only once the daemon answers', async () => {
    if (process.platform !== 'darwin') return;
    mockExistsSync.mockImplementation((p) => p === MAC_APP_BINARY);
    // Refuse once (the pre-spawn check), then answer.
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('ECONNREFUSED')).mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    const child = fakeChild();
    mockSpawn.mockReturnValue(child);

    expect(await startOllamaDaemon()).toEqual({ ok: true });

    expect(mockSpawn).toHaveBeenCalledWith(MAC_APP_BINARY, ['serve'], expect.objectContaining({ detached: true }));
    // The daemon must outlive this app, and an async spawn failure must not
    // crash the main process on an unhandled 'error' event.
    expect(child.unref).toHaveBeenCalled();
    expect(child.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('reports timeout, NOT success, when the spawned daemon never answers', async () => {
    // A spawn that returns a pid proves nothing. Success must mean the daemon
    // is reachable, or the UI reports "started" for a provider still dead.
    if (process.platform !== 'darwin') return;
    mockExistsSync.mockImplementation((p) => p === MAC_APP_BINARY);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
    vi.useFakeTimers();
    try {
      const pending = startOllamaDaemon();
      // Past the whole start budget with the daemon still refusing.
      await vi.advanceTimersByTimeAsync(20_000);
      expect(await pending).toEqual({ ok: false, reason: 'timeout' });
    } finally {
      vi.useRealTimers();
    }
    expect(mockSpawn).toHaveBeenCalledTimes(1);
  });

  it('reports spawn-failed rather than throwing when spawn rejects outright', async () => {
    if (process.platform !== 'darwin') return;
    mockExistsSync.mockImplementation((p) => p === MAC_APP_BINARY);
    mockSpawn.mockImplementation(() => {
      throw new Error('EACCES');
    });

    expect(await startOllamaDaemon()).toEqual({ ok: false, reason: 'spawn-failed' });
  });
});
