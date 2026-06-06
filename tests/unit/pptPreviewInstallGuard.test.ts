/**
 * Tests for pptPreviewBridge install failure guard.
 *
 * When officecli is not installed, startWatch delegates to the consent-gated,
 * pinned, checksum-verified installer (officecliInstaller.installOfficecli). The
 * installer owns the per-session "already failed, do not retry" latch (so that
 * multiple office files triggering preview simultaneously do not each kick off a
 * fresh install). These tests assert the bridge:
 *   - confines the renderer-supplied path to an authorized root before spawning
 *     (SEC-IPC-07);
 *   - attempts the install on the first ENOENT and surfaces an 'installing'
 *     status;
 *   - does not re-attempt the install once the installer has latched a failure.
 */
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mock helpers ────────────────────────────────────────────────────────────

// Fixtures must live under an authorized confinement root (the OS temp dir) so
// the path-confinement accepts them; arbitrary paths are refused.
const ROOT = os.tmpdir();
const F = (name: string) => path.join(ROOT, name);

let startHandler: (args: { filePath: string }) => Promise<{ url: string; error?: string }>;
let statusEmits: Array<{ state: string }>;
let installSpy: ReturnType<typeof vi.fn>;
// Mirrors the installer's per-session failure latch: once an install fails, the
// installer returns false WITHOUT re-emitting 'installing'.
let installerLatched: boolean;

function setupMocks() {
  statusEmits = [];
  installerLatched = false;
  installSpy = vi.fn(async (emitStatus?: (p: { state: string }) => void) => {
    if (installerLatched) return false;
    installerLatched = true;
    emitStatus?.({ state: 'installing' });
    emitStatus?.({ state: 'error' });
    return false; // install fails (e.g. no pinned checksum / consent declined)
  });

  // ipcBridge mock - capture the provider handler so we can call it directly
  vi.doMock('@/common', () => ({
    ipcBridge: {
      pptPreview: {
        status: {
          emit: (evt: { state: string }) => {
            statusEmits.push(evt);
          },
        },
        start: {
          provider: (handler: typeof startHandler) => {
            startHandler = handler;
          },
        },
        stop: { provider: vi.fn() },
      },
    },
  }));

  // pathConfinement reads its authorized roots from these path getters; point
  // them at the OS temp dir so the in-root fixtures are accepted.
  vi.doMock('@process/utils', () => ({
    getTempPath: () => os.tmpdir(),
    getConfigPath: () => path.join(os.tmpdir(), 'wayland-config'),
    getDataPath: () => path.join(os.tmpdir(), 'wayland-data'),
  }));

  // confinePath falls back to DB-discovered workspace roots on a miss; stub an
  // empty conversation set so discovery is a no-op.
  vi.doMock('@process/services/database', () => ({
    getDatabase: vi.fn(async () => ({
      getUserConversations: () => ({ data: [], hasMore: false }),
    })),
  }));

  vi.doMock('@process/utils/shellEnv', () => ({
    getEnhancedEnv: () => ({}),
  }));

  // The installer is unit-tested separately; mock it so the bridge's ENOENT
  // delegation + the installer's no-retry latch can be driven deterministically.
  vi.doMock('../../src/process/bridge/officecliInstaller', () => ({
    installOfficecli: (...args: unknown[]) => installSpy(...args),
  }));

  // Mock node:net - findFreePort needs createServer().listen() to resolve a port
  vi.doMock('node:net', () => {
    const { EventEmitter } = require('node:events');

    function createServer() {
      const server = new EventEmitter();
      server.listen = (_port: number, _host: string, cb: () => void) => {
        // Simulate binding to a free port
        server.address = () => ({ port: 9999 });
        cb();
      };
      server.close = (cb?: () => void) => cb?.();
      server.address = () => ({ port: 9999 });
      return server;
    }

    return {
      default: { createServer, connect: vi.fn() },
      createServer,
      connect: vi.fn(),
    };
  });

  // Mock child_process - spawn emits ENOENT so the install path is exercised.
  vi.doMock('node:child_process', () => {
    const { EventEmitter } = require('node:events');

    return {
      spawn: (_cmd: string) => {
        const child = new EventEmitter();
        child.stdout = new EventEmitter();
        child.stderr = new EventEmitter();
        child.exitCode = null;
        child.kill = vi.fn();

        // Emit ENOENT error asynchronously (officecli not found)
        process.nextTick(() => {
          const err = new Error('spawn officecli ENOENT') as NodeJS.ErrnoException;
          err.code = 'ENOENT';
          child.emit('error', err);
        });

        return child;
      },
    };
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('pptPreviewBridge install guard', () => {
  beforeEach(() => {
    vi.resetModules();
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function loadAndInit() {
    const mod = await import('../../src/process/bridge/pptPreviewBridge');
    mod.initPptPreviewBridge();
    return mod;
  }

  it('refuses to preview a file outside the authorized roots (SEC-IPC-07)', async () => {
    await loadAndInit();

    const result = await startHandler({ filePath: '/etc/passwd' });

    // Confinement rejects before any spawn/install is attempted.
    expect(installSpy).not.toHaveBeenCalled();
    expect(result.error).toBe('Refused to preview a file outside the allowed directories');
  });

  it('should attempt install on first ENOENT spawn error', async () => {
    await loadAndInit();

    // Trigger a startWatch call via the captured handler
    const result = await startHandler({ filePath: F('test.pptx') });

    // Install was attempted (delegated to the installer)
    expect(installSpy).toHaveBeenCalled();
    // Should have emitted 'installing' status
    expect(statusEmits.some((e) => e.state === 'installing')).toBe(true);
    // Result should indicate failure
    expect(result.error).toBeTruthy();
  });

  it('should NOT retry install after first failure', async () => {
    await loadAndInit();

    // First call - install attempted and fails (installer latches the failure)
    await startHandler({ filePath: F('file1.pptx') });
    const firstCallCount = installSpy.mock.calls.length;
    expect(firstCallCount).toBeGreaterThan(0);

    // Reset status tracking
    statusEmits.length = 0;

    // Second call - install latch means no fresh 'installing' status
    await startHandler({ filePath: F('file2.pptx') });

    // Should NOT have emitted 'installing' status on second call
    expect(statusEmits.some((e) => e.state === 'installing')).toBe(false);
  });

  it('should skip a fresh install for the third concurrent file as well', async () => {
    await loadAndInit();

    // First call - triggers install (and latches the failure)
    await startHandler({ filePath: F('a.pptx') });
    statusEmits.length = 0;

    // Second and third calls - no new 'installing' status
    await startHandler({ filePath: F('b.pptx') });
    await startHandler({ filePath: F('c.pptx') });

    expect(statusEmits.some((e) => e.state === 'installing')).toBe(false);
  });
});
