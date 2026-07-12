/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unit tests for `ijfwMcpClient` - covers wire-protocol multiplexing, timeout
 * rejection, garbage-line tolerance vs resource-abuse kill (#721),
 * stdin-write-error → null process, crash detection → degraded mode, and
 * shutdown delegating to killChild (#139).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import * as os from 'node:os';
import * as path from 'node:path';

import { MAX_LINE_BYTES } from '@process/services/ijfw/mcpWireProtocol';
import { MAX_CONSECUTIVE_GARBAGE_LINES } from '@process/services/ijfw/ijfwMcpClient';

let tmpHome: string;
vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return { ...actual, homedir: () => tmpHome };
});

vi.mock('electron', () => ({
  app: { getPath: (key: string) => `/tmp/wayland-test-${key}` },
}));

// #706: spawnChild now resolves a JS runtime via getPlatformServices().paths.
// Unpackaged here → the resolver returns electron-node (process.execPath +
// ELECTRON_RUN_AS_NODE), i.e. the exact behaviour these tests already assert.
// getDataDir feeds resolveSafeSpawnCwd; point it at the test home so the spawn
// cwd stays deterministic and bundle-external.
vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: { isPackaged: () => false, getDataDir: () => tmpHome },
  }),
}));

vi.mock('@process/services/ijfw/entryResolver', () => ({
  resolveEntry: vi.fn(async () => '/tmp/fake-ijfw-entry.js'),
}));

// #721 review: dropped-sample / stderr log lines persist raw child output into
// the shareable electron-log file, so they must be redacted. Spy on the logger
// to assert what actually gets written.
const logWarnSpy = vi.fn();
const logDebugSpy = vi.fn();
vi.mock('electron-log', () => ({
  default: {
    debug: (...args: unknown[]) => logDebugSpy(...args),
    info: vi.fn(),
    warn: (...args: unknown[]) => logWarnSpy(...args),
    error: vi.fn(),
  },
}));

// #139: shutdown delegates child-tree teardown to the cross-platform killChild
// helper (covered in depth by acpKillChild.test.ts). Mock it here so we assert
// delegation without re-running its real ps/taskkill/process.kill logic.
const killChildSpy = vi.fn(async () => {});
vi.mock('@process/agent/acp/utils', () => ({
  killChild: (...args: unknown[]) => killChildSpy(...args),
}));

// Build a fake ChildProcess we can drive from inside each test. Tracks all
// writes via `writeSpy` and exposes signal capture via `killSignals[]`.
type FakeChild = EventEmitter & {
  stdout: EventEmitter;
  stderr: EventEmitter;
  stdin: {
    write: (data: Buffer | string, cb?: (err?: Error | null) => void) => boolean;
  };
  kill: (signal?: string) => boolean;
  killSignals: string[];
  writes: Buffer[];
  pid: number;
  killed: boolean;
};

let currentChild: FakeChild | null = null;
let writeShouldError = false;

function makeFakeChild(): FakeChild {
  const child = new EventEmitter() as FakeChild;
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.writes = [];
  child.killSignals = [];
  child.pid = 12345;
  child.killed = false;
  child.stdin = {
    write: (data, cb) => {
      child.writes.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
      if (writeShouldError) {
        setImmediate(() => cb?.(new Error('write EPIPE')));
        return false;
      }
      setImmediate(() => cb?.(null));
      return true;
    },
  };
  child.kill = (signal?: string) => {
    child.killSignals.push(signal ?? 'SIGTERM');
    child.killed = true;
    return true;
  };
  return child;
}

const spawnSpy = vi.fn(() => {
  currentChild = makeFakeChild();
  return currentChild;
});

vi.mock('node:child_process', async () => {
  const actual = await vi.importActual<typeof import('node:child_process')>('node:child_process');
  return { ...actual, spawn: (...args: unknown[]) => spawnSpy(...args) };
});

beforeEach(() => {
  vi.resetModules();
  tmpHome = path.join(os.tmpdir(), `ijfw-mcp-client-test-${Date.now()}`);
  spawnSpy.mockClear();
  killChildSpy.mockClear();
  logWarnSpy.mockClear();
  logDebugSpy.mockClear();
  writeShouldError = false;
  currentChild = null;
});

afterEach(() => {
  vi.useRealTimers();
});

async function loadClient() {
  // Fresh module each test so module-level state (process handle, pending map)
  // is isolated.
  const mod = await import('@process/services/ijfw/ijfwMcpClient');
  // Reset for safety in case a previous test left state.
  mod.__resetForTests();
  return mod;
}

function encodeNewline(obj: unknown): string {
  return `${JSON.stringify(obj)}\n`;
}

/**
 * Codex B2: wrap a payload in the real MCP envelope shape so tests exercise the
 * unwrap path. The IJFW MCP server returns
 * `{content: [{type: 'text', text: '<JSON string>'}], isError: false}`.
 */
function mcpEnvelope(data: unknown, opts: { isError?: boolean } = {}): unknown {
  return {
    content: [{ type: 'text', text: JSON.stringify(data) }],
    isError: opts.isError ?? false,
  };
}

describe('ijfwMcpClient', () => {
  it('spawns on first invoke and routes the response back to the caller', async () => {
    const { ijfwMcpClient } = await loadClient();
    const promise = ijfwMcpClient.invoke('memory_recall', { query: 'hello' });

    await new Promise((r) => setImmediate(r));
    expect(spawnSpy).toHaveBeenCalledTimes(1);

    // Find the id of the request we just made.
    const written = currentChild!.writes[0]!.toString('utf-8');
    const parsed = JSON.parse(written.trim());
    expect(parsed.method).toBe('tools/call');
    // Codex B1: renderer verb 'memory_recall' is now mapped to the real MCP
    // tool name 'ijfw_memory_recall' before being put on the wire.
    expect(parsed.params).toEqual({
      name: 'ijfw_memory_recall',
      arguments: { query: 'hello' },
    });

    // Reply with the real MCP envelope shape (Codex B2).
    currentChild!.stdout.emit(
      'data',
      Buffer.from(
        encodeNewline({
          jsonrpc: '2.0',
          id: parsed.id,
          result: mcpEnvelope({ hits: [] }),
        })
      )
    );

    const result = await promise;
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ hits: [] });
  });

  it('#755: spawns with an explicit bundle-external cwd and matching IJFW_PROJECT_DIR', async () => {
    const { ijfwMcpClient } = await loadClient();
    const promise = ijfwMcpClient.invoke('memory_recall', {}, { timeoutMs: 25 });
    await new Promise((r) => setImmediate(r));

    expect(spawnSpy).toHaveBeenCalledTimes(1);
    const opts = spawnSpy.mock.calls[0]![2] as { cwd?: string; env?: Record<string, string> };

    // An explicit cwd MUST be set - inheriting the parent cwd is the #755 bug
    // (in packaged builds a forked worker's cwd is app.asar.unpacked, and the
    // ijfw server's safeProjectDir() then writes into the signed bundle).
    expect(opts.cwd).toBeTruthy();
    expect(opts.cwd).not.toMatch(/app\.asar/);
    expect(opts.cwd).not.toMatch(/\.app[/\\]Contents/);
    // IJFW_PROJECT_DIR pins the server's project root to the same safe dir so
    // it never has to fall back to cwd heuristics at all.
    expect(opts.env?.IJFW_PROJECT_DIR).toBe(opts.cwd);

    await promise; // let the 25ms timeout settle before teardown
  });

  it('rejects with errorReason "timeout" when no response arrives', async () => {
    const { ijfwMcpClient } = await loadClient();
    // Use a small real timeout - quicker than swapping in fake timers across an
    // async spawn (childPromise + resolveEntry both microtask-await).
    const result = await ijfwMcpClient.invoke('memory_recall', {}, { timeoutMs: 25 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorReason).toBe('timeout');
  });

  it('#721: garbage line interleaved with valid NDJSON is skipped - child survives, responses resolve', async () => {
    const { ijfwMcpClient } = await loadClient();
    const p1 = ijfwMcpClient.invoke('memory_recall', { q: 1 });
    const p2 = ijfwMcpClient.invoke('memory_recall', { q: 2 });
    for (let i = 0; i < 6; i++) await new Promise((r) => setImmediate(r));

    const first = JSON.parse(currentChild!.writes[0]!.toString().trim());
    const second = JSON.parse(currentChild!.writes[1]!.toString().trim());

    // Customer-observed shape (#721): the child console.logs a plaintext
    // build.* progress line to stdout between two valid JSON-RPC responses.
    currentChild!.stdout.emit(
      'data',
      Buffer.from(
        encodeNewline({ jsonrpc: '2.0', id: first.id, result: mcpEnvelope('A') }) +
          'build.building wayland-desktop 42%\n' +
          encodeNewline({ jsonrpc: '2.0', id: second.id, result: mcpEnvelope('B') })
      )
    );

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1.ok && r1.data).toBe('A');
    expect(r2.ok && r2.data).toBe('B');

    // The child must NOT have been killed and the client stays healthy.
    expect(currentChild!.killed).toBe(false);
    expect(currentChild!.killSignals).toEqual([]);
    expect(ijfwMcpClient.getMode()).toBe('full');
  });

  it('#721: oversize line (resource abuse) still kills child; respawns on next invoke', async () => {
    const { ijfwMcpClient } = await loadClient();
    const promise = ijfwMcpClient.invoke('memory_recall', {});
    await new Promise((r) => setImmediate(r));
    const firstChild = currentChild!;

    // A terminated line beyond MAX_LINE_BYTES is a genuine DecodeError → kill.
    firstChild.stdout.emit('data', Buffer.concat([Buffer.alloc(MAX_LINE_BYTES + 100, 0x41), Buffer.from('\n')]));
    await new Promise((r) => setImmediate(r));

    expect(firstChild.killed).toBe(true);

    // First call should reject (the child was killed before response landed).
    firstChild.emit('exit', 1, null);
    const result = await promise;
    expect(result.ok).toBe(false);

    // Next invoke spawns a fresh child.
    void ijfwMcpClient.invoke('memory_recall', {});
    await new Promise((r) => setImmediate(r));
    expect(spawnSpy).toHaveBeenCalledTimes(2);
  });

  it('#721: an all-garbage stream is quarantined after MAX_CONSECUTIVE_GARBAGE_LINES', async () => {
    const { ijfwMcpClient } = await loadClient();
    void ijfwMcpClient.invoke('memory_recall', {});
    await new Promise((r) => setImmediate(r));
    const child = currentChild!;

    for (let i = 0; i < MAX_CONSECUTIVE_GARBAGE_LINES - 1; i++) {
      child.stdout.emit('data', Buffer.from(`garbage line ${i}\n`));
    }
    expect(child.killed).toBe(false);

    child.stdout.emit('data', Buffer.from('garbage final\n'));
    expect(child.killed).toBe(true);
    expect(ijfwMcpClient.getMode()).toBe('degraded');
  });

  it('#721: a valid message resets the consecutive-garbage counter', async () => {
    const { ijfwMcpClient } = await loadClient();
    const promise = ijfwMcpClient.invoke('memory_recall', {});
    await new Promise((r) => setImmediate(r));
    const child = currentChild!;
    const sent = JSON.parse(child.writes[0]!.toString().trim());

    for (let i = 0; i < MAX_CONSECUTIVE_GARBAGE_LINES - 1; i++) {
      child.stdout.emit('data', Buffer.from(`garbage line ${i}\n`));
    }
    // Valid response arrives - counter resets, request resolves.
    child.stdout.emit('data', Buffer.from(encodeNewline({ jsonrpc: '2.0', id: sent.id, result: mcpEnvelope('ok') })));
    const result = await promise;
    expect(result.ok && result.data).toBe('ok');

    // More garbage after the reset does not hit the threshold immediately.
    for (let i = 0; i < MAX_CONSECUTIVE_GARBAGE_LINES - 1; i++) {
      child.stdout.emit('data', Buffer.from(`more garbage ${i}\n`));
    }
    expect(child.killed).toBe(false);
  });

  it('#721 review: secrets in dropped-line samples are redacted before logging (#714 class)', async () => {
    const { ijfwMcpClient } = await loadClient();
    const promise = ijfwMcpClient.invoke('memory_recall', {});
    await new Promise((r) => setImmediate(r));
    const child = currentChild!;
    const sent = JSON.parse(child.writes[0]!.toString().trim());

    // Garbage line carrying a live-looking provider key, interleaved with a
    // valid response - the sample must reach the log file redacted.
    child.stdout.emit(
      'data',
      Buffer.from(
        'auth retry with key sk-abc123def456ghi789\n' +
          encodeNewline({ jsonrpc: '2.0', id: sent.id, result: mcpEnvelope('ok') })
      )
    );
    const result = await promise;
    expect(result.ok && result.data).toBe('ok');

    const warnCall = logWarnSpy.mock.calls.find((c) => c[0] === '[ijfw-mcp] skipped non-JSON stdout line(s)');
    expect(warnCall).toBeDefined();
    const { samples } = warnCall![1] as { samples: string[] };
    expect(samples.length).toBe(1);
    expect(samples[0]).not.toContain('sk-abc123def456ghi789');
    expect(samples[0]).toContain('••••••');
    expect(samples[0]).toContain('auth retry with key');
  });

  it('#721 review: secrets in child stderr are redacted before logging', async () => {
    const { ijfwMcpClient } = await loadClient();
    void ijfwMcpClient.invoke('memory_recall', {});
    await new Promise((r) => setImmediate(r));

    currentChild!.stderr.emit('data', Buffer.from('warn: request failed, token sk-abc123def456ghi789\n'));

    const debugCall = logDebugSpy.mock.calls.find((c) => c[0] === '[ijfw-mcp][stderr]');
    expect(debugCall).toBeDefined();
    expect(String(debugCall![1])).not.toContain('sk-abc123def456ghi789');
    expect(String(debugCall![1])).toContain('••••••');
  });

  it('on stdin write error nulls process and rejects in-flight request', async () => {
    writeShouldError = true;
    const { ijfwMcpClient } = await loadClient();
    const result = await ijfwMcpClient.invoke('memory_recall', {});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorReason).toBe('mcp_crashed');
  });

  it('serializes writes - second invoke does not start until first stdin write resolves', async () => {
    const { ijfwMcpClient } = await loadClient();
    const p1 = ijfwMcpClient.invoke('memory_recall', { q: 1 });
    const p2 = ijfwMcpClient.invoke('memory_recall', { q: 2 });

    // Drain spawn + both write callbacks + queue serializer (each `drainQueue`
    // step schedules the next via `setImmediate`).
    for (let i = 0; i < 6; i++) await new Promise((r) => setImmediate(r));

    expect(currentChild!.writes.length).toBe(2);
    const first = JSON.parse(currentChild!.writes[0]!.toString().trim());
    const second = JSON.parse(currentChild!.writes[1]!.toString().trim());
    expect(first.id).not.toBe(second.id);

    // Resolve both. Use the real MCP envelope shape (Codex B2 unwrap).
    currentChild!.stdout.emit(
      'data',
      Buffer.from(encodeNewline({ jsonrpc: '2.0', id: first.id, result: mcpEnvelope('A') }))
    );
    currentChild!.stdout.emit(
      'data',
      Buffer.from(encodeNewline({ jsonrpc: '2.0', id: second.id, result: mcpEnvelope('B') }))
    );

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1.ok && r1.data).toBe('A');
    expect(r2.ok && r2.data).toBe('B');
  });

  it('child crash flips mode to degraded and rejects pending requests', async () => {
    const { ijfwMcpClient } = await loadClient();
    // Checkpoint B B1: initial mode is `full` (optimistic) - only flips to
    // `degraded` after a real failure.
    expect(ijfwMcpClient.getMode()).toBe('full');

    const promise = ijfwMcpClient.invoke('memory_recall', {});
    await new Promise((r) => setImmediate(r));
    expect(ijfwMcpClient.getMode()).toBe('full');

    currentChild!.emit('exit', 137, 'SIGKILL');
    await new Promise((r) => setImmediate(r));

    const result = await promise;
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorReason).toBe('mcp_crashed');
    expect(ijfwMcpClient.getMode()).toBe('degraded');
  });

  it('initial mode is `full` so brain.invoke is not dead-on-arrival (Checkpoint B B1)', async () => {
    // Regression test for the B1 BLOCKER: prior behavior initialized mode to
    // `degraded`, causing the bridge gate to short-circuit every first call
    // before ensureSpawned() ran. Initial state must now be `full` so the
    // gate does not block fresh installs.
    const { ijfwMcpClient } = await loadClient();
    expect(ijfwMcpClient.getMode()).toBe('full');

    // And after a successful invoke, it remains `full`.
    const promise = ijfwMcpClient.invoke('memory_recall', { q: 'hi' });
    await new Promise((r) => setImmediate(r));
    const written = JSON.parse(currentChild!.writes[0]!.toString().trim());
    currentChild!.stdout.emit(
      'data',
      Buffer.from(
        encodeNewline({
          jsonrpc: '2.0',
          id: written.id,
          result: mcpEnvelope({ ok: true }),
        })
      )
    );
    const result = await promise;
    expect(result.ok).toBe(true);
    expect(ijfwMcpClient.getMode()).toBe('full');
  });

  it('Codex B1: maps direct verbs to ijfw_* tool names', async () => {
    const { ijfwMcpClient } = await loadClient();
    const promise = ijfwMcpClient.invoke('memory_facts', { any: true });
    await new Promise((r) => setImmediate(r));
    const sent = JSON.parse(currentChild!.writes[0]!.toString().trim());
    expect(sent.method).toBe('tools/call');
    expect(sent.params.name).toBe('ijfw_memory_facts');
    expect(sent.params.arguments).toEqual({ any: true });
    currentChild!.stdout.emit(
      'data',
      Buffer.from(
        encodeNewline({
          jsonrpc: '2.0',
          id: sent.id,
          result: mcpEnvelope({ facts: [] }),
        })
      )
    );
    const result = await promise;
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ facts: [] });
  });

  it('Codex B1: brain-family verbs are wrapped in ijfw_brain {verb, args}', async () => {
    const { ijfwMcpClient } = await loadClient();
    const promise = ijfwMcpClient.invoke('wiki.get', {});
    await new Promise((r) => setImmediate(r));
    const sent = JSON.parse(currentChild!.writes[0]!.toString().trim());
    expect(sent.params.name).toBe('ijfw_brain');
    expect(sent.params.arguments).toEqual({ verb: 'wiki.get', args: {} });
    currentChild!.stdout.emit(
      'data',
      Buffer.from(
        encodeNewline({
          jsonrpc: '2.0',
          id: sent.id,
          result: mcpEnvelope({ entries: [] }),
        })
      )
    );
    const result = await promise;
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ entries: [] });
  });

  it('Codex B1: unknown verbs are rejected with validation_failed before spawn', async () => {
    const { ijfwMcpClient } = await loadClient();
    const result = await ijfwMcpClient.invoke('not.a.real.verb', {});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorReason).toBe('validation_failed');
    expect(spawnSpy).not.toHaveBeenCalled();
  });

  it('Codex B2: MCP envelope with isError=true surfaces as ok:false / mcp_error', async () => {
    const { ijfwMcpClient } = await loadClient();
    const promise = ijfwMcpClient.invoke('memory_recall', { query: 'x' });
    await new Promise((r) => setImmediate(r));
    const sent = JSON.parse(currentChild!.writes[0]!.toString().trim());
    currentChild!.stdout.emit(
      'data',
      Buffer.from(
        encodeNewline({
          jsonrpc: '2.0',
          id: sent.id,
          result: {
            content: [{ type: 'text', text: 'server crashed in tool handler' }],
            isError: true,
          },
        })
      )
    );
    const result = await promise;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorReason).toBe('mcp_error');
      expect(result.error).toMatch(/server crashed/);
    }
  });

  it('Codex B2: non-JSON envelope text falls back to raw string data', async () => {
    const { ijfwMcpClient } = await loadClient();
    const promise = ijfwMcpClient.invoke('memory_recall', { query: 'x' });
    await new Promise((r) => setImmediate(r));
    const sent = JSON.parse(currentChild!.writes[0]!.toString().trim());
    currentChild!.stdout.emit(
      'data',
      Buffer.from(
        encodeNewline({
          jsonrpc: '2.0',
          id: sent.id,
          result: {
            content: [{ type: 'text', text: 'not-json-payload' }],
            isError: false,
          },
        })
      )
    );
    const result = await promise;
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toBe('not-json-payload');
  });

  it('shutdown delegates child-tree teardown to killChild and nulls the child', async () => {
    const { ijfwMcpClient } = await loadClient();
    void ijfwMcpClient.invoke('memory_recall', {});
    await new Promise((r) => setImmediate(r));

    const child = currentChild!;
    await ijfwMcpClient.shutdown();

    // #139: kill the whole tree cross-platform (taskkill /T /F on win32, POSIX
    // descendant sweep) instead of a bare SIGTERM that orphans children.
    expect(killChildSpy).toHaveBeenCalledTimes(1);
    expect(killChildSpy).toHaveBeenCalledWith(child, false);

    // Child handle is dropped so the next invoke respawns.
    void ijfwMcpClient.invoke('memory_recall', {});
    await new Promise((r) => setImmediate(r));
    expect(spawnSpy).toHaveBeenCalledTimes(2);
  });

  it('shutdown when no child running is a no-op', async () => {
    const { ijfwMcpClient } = await loadClient();
    await expect(ijfwMcpClient.shutdown()).resolves.toBeUndefined();
    expect(killChildSpy).not.toHaveBeenCalled();
  });

  it('waitForExit resolves true when child has exited', async () => {
    const { ijfwMcpClient } = await loadClient();
    expect(await ijfwMcpClient.waitForExit(50)).toBe(true);
  });

  it('Checkpoint B H3: returns validation_failed for oversize payload, does not throw', async () => {
    // Build args that JSON-stringify well past MAX_LINE_BYTES (10 MiB). A
    // 12 MiB string is unambiguous.
    const big = 'a'.repeat(12 * 1024 * 1024);
    const { ijfwMcpClient } = await loadClient();
    const result = await ijfwMcpClient.invoke('memory_recall', { blob: big });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorReason).toBe('validation_failed');
      expect(result.error).toMatch(/MAX_LINE_BYTES/);
    }
    // No child should have been written to.
    if (currentChild) {
      expect(currentChild.writes.length).toBe(0);
    }
  });

  it('returns mcp_error when JSON-RPC envelope contains error', async () => {
    const { ijfwMcpClient } = await loadClient();
    const promise = ijfwMcpClient.invoke('memory_recall', {});
    await new Promise((r) => setImmediate(r));

    const written = JSON.parse(currentChild!.writes[0]!.toString().trim());
    currentChild!.stdout.emit(
      'data',
      Buffer.from(
        encodeNewline({
          jsonrpc: '2.0',
          id: written.id,
          error: { code: -32601, message: 'method not found' },
        })
      )
    );

    const result = await promise;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorReason).toBe('mcp_error');
      expect(result.error).toMatch(/method not found/);
    }
  });
});
