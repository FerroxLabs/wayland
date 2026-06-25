/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unit tests for `ijfwMcpClient` - covers wire-protocol multiplexing, timeout
 * rejection, decode-error → kill, stdin-write-error → null process, crash
 * detection → degraded mode, and shutdown delegating to killChild (#139).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import * as os from 'node:os';
import * as path from 'node:path';

let tmpHome: string;
vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return { ...actual, homedir: () => tmpHome };
});

vi.mock('electron', () => ({
  app: { getPath: (key: string) => `/tmp/wayland-test-${key}` },
}));

vi.mock('@process/services/ijfw/entryResolver', () => ({
  resolveEntry: vi.fn(async () => '/tmp/fake-ijfw-entry.js'),
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
        }),
      ),
    );

    const result = await promise;
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ hits: [] });
  });

  it('rejects with errorReason "timeout" when no response arrives', async () => {
    const { ijfwMcpClient } = await loadClient();
    // Use a small real timeout - quicker than swapping in fake timers across an
    // async spawn (childPromise + resolveEntry both microtask-await).
    const result = await ijfwMcpClient.invoke('memory_recall', {}, { timeoutMs: 25 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorReason).toBe('timeout');
  });

  it('on decode-error kills child and respawns on next invoke', async () => {
    const { ijfwMcpClient } = await loadClient();
    const promise = ijfwMcpClient.invoke('memory_recall', {});
    await new Promise((r) => setImmediate(r));
    const firstChild = currentChild!;

    // Push a malformed line - triggers DecodeError → kill child.
    firstChild.stdout.emit('data', Buffer.from('{not json\n'));
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
      Buffer.from(
        encodeNewline({ jsonrpc: '2.0', id: first.id, result: mcpEnvelope('A') }),
      ),
    );
    currentChild!.stdout.emit(
      'data',
      Buffer.from(
        encodeNewline({ jsonrpc: '2.0', id: second.id, result: mcpEnvelope('B') }),
      ),
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
        }),
      ),
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
        }),
      ),
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
        }),
      ),
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
        }),
      ),
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
        }),
      ),
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
        }),
      ),
    );

    const result = await promise;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorReason).toBe('mcp_error');
      expect(result.error).toMatch(/method not found/);
    }
  });
});
