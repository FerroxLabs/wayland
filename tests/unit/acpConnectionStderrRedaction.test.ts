/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1062 + #1041, half two: the `AcpConnection` site.
 * `tests/unit/acpStderrLogRedaction.test.ts` pins the shared reader and the
 * `ProcessAcpClient` site - the two are two rewrites of the same function.
 *
 * #1062 here is the WORSE of the two directions. `setupChildProcessHandlers` sliced
 * the RAW chunk into a 512-character head and a 1536-character tail and handed both
 * to `buildStartupErrorMessage`, which contains NO redaction of any kind and whose
 * output is the error the USER is shown. The TAIL is the dangerous cut: keeping the
 * last 1536 characters eats the ANCHOR (`api_key = `, `Authorization: `) and keeps
 * the VALUE, and an anchorless value is invisible to every scrub downstream. So the
 * scrub has to run BEFORE the cap, on whole lines, never after it.
 *
 * #1041: the same handler console.error'd every chunk, so routine startup chatter
 * was tagged `[error]`.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EventEmitter } from 'node:events';
import type { ChildProcess } from 'node:child_process';

vi.mock('child_process', () => ({ execFile: vi.fn(), spawn: vi.fn() }));
vi.mock('@process/utils/mainLogger', () => ({ mainLog: vi.fn(), mainWarn: vi.fn() }));
vi.mock('@process/utils/shellEnv', () => ({
  getNpxCacheDir: vi.fn(() => '/tmp/npx'),
  getWindowsShellExecutionOptions: vi.fn(() => ({})),
  resolveNpxPath: vi.fn(() => 'npx'),
}));

const mockSpawnGenericBackend = vi.fn();
vi.mock('@process/agent/acp/acpConnectors', () => ({
  spawnGenericBackend: (...args: unknown[]) => mockSpawnGenericBackend(...args),
  connectClaude: vi.fn(),
  connectCodebuddy: vi.fn(),
  connectCodex: vi.fn(),
  prepareCleanEnv: vi.fn(async () => ({})),
}));

import { AcpConnection } from '../../src/process/agent/acp/AcpConnection';

/** A bare 32-hex value. NO rule matches it alone, so only its label can save it. */
const HEX = 'f0e9d8c7b6a5948372615041302f1e0d';

/** Mirrors `STDERR_HEAD_MAX` / `STDERR_TAIL_MAX` in AcpConnection. */
const HEAD_MAX = 512;
const TAIL_MAX = 1536;

type Level = 'debug' | 'info' | 'warn' | 'error';
type ConsoleCapture = { all(): string; at(level: Level): string; restore(): void };

function captureConsole(): ConsoleCapture {
  const buckets: Record<Level, string[]> = { debug: [], info: [], warn: [], error: [] };
  const record =
    (level: Level) =>
    (...args: unknown[]) => {
      buckets[level].push(args.map((arg) => (typeof arg === 'string' ? arg : String(arg))).join(' '));
    };
  const spies = [
    vi.spyOn(console, 'debug').mockImplementation(record('debug')),
    vi.spyOn(console, 'info').mockImplementation(record('info')),
    vi.spyOn(console, 'warn').mockImplementation(record('warn')),
    vi.spyOn(console, 'error').mockImplementation(record('error')),
    vi.spyOn(console, 'log').mockImplementation(record('info')),
  ];
  return {
    all: () => (['debug', 'info', 'warn', 'error'] as const).map((level) => buckets[level].join('\n')).join('\n'),
    at: (level) => buckets[level].join('\n'),
    restore: () => spies.forEach((spy) => spy.mockRestore()),
  };
}

/** A fake child that writes `stderrOutput`, then exits non-zero during startup. */
function createFakeChild(stderrOutput: string): ChildProcess & EventEmitter {
  const emitter = new EventEmitter();
  const child = emitter as unknown as ChildProcess & EventEmitter;
  const stdoutEmitter = new EventEmitter();
  const stderrEmitter = new EventEmitter();
  Object.defineProperty(child, 'stdout', { value: stdoutEmitter, writable: true });
  Object.defineProperty(child, 'stderr', { value: stderrEmitter, writable: true });
  Object.defineProperty(child, 'stdin', { value: null, writable: true });
  Object.defineProperty(child, 'pid', { value: 12345, writable: true });
  Object.defineProperty(child, 'killed', { value: false, writable: true });
  child.kill = vi.fn(() => true);

  setImmediate(() => {
    stderrEmitter.emit('data', Buffer.from(stderrOutput));
    setTimeout(() => {
      stderrEmitter.emit('end');
      emitter.emit('exit', 1, null);
    }, 10);
  });
  return child;
}

async function startupErrorFor(stderrOutput: string): Promise<{ message: string; console: ConsoleCapture }> {
  const capture = captureConsole();
  try {
    mockSpawnGenericBackend.mockResolvedValue({ child: createFakeChild(stderrOutput), isDetached: false });
    let message = '';
    await new AcpConnection().connect('qwen', '/usr/local/bin/qwen', '/tmp/workspace').catch((err: unknown) => {
      message = err instanceof Error ? err.message : String(err);
    });
    return { message, console: capture };
  } finally {
    capture.restore();
  }
}

/**
 * A payload whose last {@link TAIL_MAX} characters begin exactly INSIDE the label
 * `api_key = `, so the raw tail slice keeps `key = <value>` - a bare 32-hex value
 * with its anchor eaten, which no rule in the bank can see. The arithmetic is
 * ASSERTED, not assumed: a payload that cut in the filler instead would pass
 * against the unfixed code and prove nothing.
 */
function tailCutPayload(): string {
  const kept = `key = ${HEX}\n`;
  const trailing = 'bridge notice line\n'.repeat(200).slice(0, TAIL_MAX - kept.length);
  const payload = `${'a'.repeat(700)}\napi_${kept}${trailing}`;
  const tail = payload.slice(-TAIL_MAX);
  if (tail !== kept + trailing) throw new Error('tail arithmetic wrong');
  if (tail.includes('api_key')) throw new Error('the tail must not retain the anchor');
  if (!tail.includes(HEX)) throw new Error('the tail must retain the value');
  if (payload.slice(0, HEAD_MAX).includes(HEX)) throw new Error('the head must not carry the value');
  return payload;
}

describe('AcpConnection startup stderr', () => {
  beforeEach(() => {
    mockSpawnGenericBackend.mockReset();
  });

  it('does not put a credential from the HEAD in the user-facing error (#1062)', async () => {
    const { message } = await startupErrorFor(`api_key = ${HEX}\nbridge failed to start\n`);
    expect(message).not.toContain(HEX);
    expect(message).toContain('[redacted]');
    expect(message).toContain('bridge failed to start');
  });

  it('does not put an anchor-cut credential from the TAIL in the user-facing error (#1062)', async () => {
    const { message } = await startupErrorFor(tailCutPayload());
    expect(message).not.toContain(HEX);
    // Not vacuous: the tail still carries the surrounding diagnostic.
    expect(message).toContain('bridge notice line');
  });

  it('does not tag benign startup chatter as an error (#1041)', async () => {
    const { console: captured } = await startupErrorFor('Listening on stdio\n');
    expect(captured.at('error')).not.toContain('Listening on stdio');
    expect(captured.at('info')).toContain('Listening on stdio');
  });

  it('still logs a real startup failure at error level (#1041)', async () => {
    const { console: captured } = await startupErrorFor('TypeError: bridge handshake failed\n');
    expect(captured.at('error')).toContain('bridge handshake failed');
  });
});
