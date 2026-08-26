/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1062 + #1041, half one: the shared reader and the `ProcessAcpClient` site.
 * `tests/unit/acpConnectionStderrRedaction.test.ts` pins the other site - the two
 * are two rewrites of the same function and are fixed together.
 *
 * #1062 - `ProcessAcpClient.setupStderrCapture` console.error'd the RAW chunk. The
 * file transport's hook (`configureConsoleLog`) scrubs what lands on disk, but it is
 * handed a CHUNK: a credential split across two writes has its anchor masked in one
 * and its body left whole in the next, and the console/DevTools transport is not
 * scrubbed at all. Fixed by scrubbing WHOLE LINES at the source.
 *
 * #1041 - every chunk went to console.error, so a bridge's routine notices were
 * tagged `[error]` and a bug report read as a wall of failures. Fixed with an
 * ACP-specific classifier that defaults to INFO. The default is the point:
 * `wcoreStderrLevel` defaults to `warn` because the engine self-labels every line,
 * but ACP bridges are ordinary Node programs that label nothing, so a warn default
 * re-tags every benign notice AND destroys the property this pins - that a real
 * failure STANDS OUT next to the ordinary line beside it.
 *
 * Driven through a REAL child process writing to REAL stderr.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { ProcessAcpClient } from '@process/acp/infra/ProcessAcpClient';
import { isProcessAlive } from '@process/acp/infra/processUtils';
import { acpStderrLevel, createAcpStderrReader, type AcpStderrLevel } from '@process/acp/acpStderrLog';

/** A bare 32-hex value. NO rule matches it alone, so only its label can save it. */
const HEX = 'f0e9d8c7b6a5948372615041302f1e0d';

// ─── 1. The classifier ────────────────────────────────────────

describe('acpStderrLevel', () => {
  it('defaults an unlabelled line to info, NOT warn', () => {
    expect(acpStderrLevel('Listening on stdio')).toBe('info');
    expect(acpStderrLevel('resolved claude-code-acp@0.4.1')).toBe('info');
    expect(acpStderrLevel('')).toBe('info');
  });

  it('raises to error only on evidence the line carries itself', () => {
    expect(acpStderrLevel('Error: connect ECONNREFUSED 127.0.0.1:9')).toBe('error');
    expect(acpStderrLevel('TypeError: x is not a function')).toBe('error');
    expect(acpStderrLevel('    at Module._compile (node:internal/modules/cjs/loader:1105:14)')).toBe('error');
    expect(acpStderrLevel('npm ERR! code E404')).toBe('error');
    expect(acpStderrLevel('[ERROR] bridge failed to start')).toBe('error');
  });

  it('recognises warnings without promoting them to errors', () => {
    expect(acpStderrLevel('npm WARN deprecated foo@1.0.0')).toBe('warn');
    expect(acpStderrLevel('(node:123) ExperimentalWarning: --experimental-loader')).toBe('warn');
    expect(acpStderrLevel('[warn] falling back to stdio')).toBe('warn');
  });

  it('does not treat a level word mid-message as a label', () => {
    expect(acpStderrLevel('the user asked about an error in the config')).toBe('info');
  });
});

// ─── 2. The shared reader ─────────────────────────────────────

function collect(chunks: string[], flush = true): Array<[string, AcpStderrLevel]> {
  const out: Array<[string, AcpStderrLevel]> = [];
  const reader = createAcpStderrReader((line, level) => out.push([line, level]));
  for (const chunk of chunks) reader.push(chunk);
  if (flush) reader.flush();
  return out;
}

describe('createAcpStderrReader', () => {
  it('scrubs a credential that arrives split across two chunks', () => {
    // The shape a chunk-level scrub gets WRONG: masking the first half replaces
    // the anchor, and the continuation is then anchorless forever.
    const text = collect([`api_key = ${HEX.slice(0, 12)}`, `${HEX.slice(12)}\n`])
      .map(([line]) => line)
      .join('\n');
    expect(text).not.toContain(HEX);
    expect(text).not.toContain(HEX.slice(12));
    expect(text).toContain('[redacted]');
  });

  it('emits a final line that has no trailing newline', () => {
    expect(collect(['bridge ready'])).toEqual([['bridge ready', 'info']]);
  });

  it('treats a bare CR as a record boundary', () => {
    expect(collect(['one\rtwo\r']).map(([line]) => line)).toEqual(['one', 'two']);
  });

  it('holds a PEM block that spans lines instead of leaking its body', () => {
    const body = 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQ';
    const text = collect([
      `-----BEGIN PRIVATE KEY-----\n${body}\n${body}\n-----END PRIVATE KEY-----\n`,
      'bridge ready\n',
    ])
      .map(([line]) => line)
      .join('\n');
    expect(text).not.toContain(body);
    expect(text).toContain('bridge ready');
  });

  it('discards an unterminated line past the cap and resyncs at the next boundary', () => {
    const text = collect(['x'.repeat(40000), `junk\napi_key = ${HEX}\n`])
      .map(([line]) => line)
      .join('\n');
    expect(text).not.toContain(HEX);
    expect(text).toContain('discarded');
    // Resync drops the fragment up to the first boundary, then normal logging
    // resumes - so the credential line after it is still SEEN, and scrubbed.
    expect(text).toContain('[redacted]');
  });
});

// ─── 3. ProcessAcpClient, through a real child ────────────────

const spawned: ChildProcess[] = [];

afterEach(() => {
  for (const child of spawned.splice(0)) {
    if (child.pid && isProcessAlive(child.pid)) {
      try {
        process.kill(child.pid, 'SIGKILL');
      } catch {
        /* already gone */
      }
    }
  }
});

type ConsoleCapture = { all(): string; at(level: AcpStderrLevel): string; restore(): void };

function captureConsole(): ConsoleCapture {
  const buckets: Record<AcpStderrLevel, string[]> = { debug: [], info: [], warn: [], error: [] };
  const record = (level: AcpStderrLevel) => (...args: unknown[]) => {
    buckets[level].push(args.map((arg) => (typeof arg === 'string' ? arg : String(arg))).join(' '));
  };
  const spies = [
    vi.spyOn(console, 'debug').mockImplementation(record('debug')),
    vi.spyOn(console, 'info').mockImplementation(record('info')),
    vi.spyOn(console, 'warn').mockImplementation(record('warn')),
    vi.spyOn(console, 'error').mockImplementation(record('error')),
    // `console.log` is electron-log's `info` in the app; bucket it as info.
    vi.spyOn(console, 'log').mockImplementation(record('info')),
  ];
  return {
    all: () => (['debug', 'info', 'warn', 'error'] as const).map((level) => buckets[level].join('\n')).join('\n'),
    at: (level) => buckets[level].join('\n'),
    restore: () => spies.forEach((spy) => spy.mockRestore()),
  };
}

function probeClient(args: string[], env: NodeJS.ProcessEnv): ProcessAcpClient {
  return new ProcessAcpClient(
    async () => {
      const child = spawn(process.execPath, args, { stdio: 'pipe', env: { ...process.env, ...env } });
      spawned.push(child);
      return child;
    },
    { backend: 'probe', handlers: {} as never }
  );
}

async function driveChildStderr(payload: string): Promise<{ ring: string; console: ConsoleCapture }> {
  const capture = captureConsole();
  try {
    const client = probeClient(['-e', 'process.stderr.write(process.env.ACP_PAYLOAD ?? "");'], {
      ACP_PAYLOAD: payload,
    });
    await client.start().catch(() => undefined);
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { ring: (client as unknown as { stderrBuffer: string }).stderrBuffer, console: capture };
  } finally {
    capture.restore();
  }
}

describe('ProcessAcpClient stderr logging', () => {
  it('never writes a raw credential to the console (#1062)', async () => {
    const { console: captured } = await driveChildStderr(`api_key = ${HEX}\nbridge ready\n`);
    expect(captured.all()).not.toContain(HEX);
    expect(captured.all()).toContain('[redacted]');
    // Not vacuous: the surrounding diagnostic still reached the log.
    expect(captured.all()).toContain('bridge ready');
  });

  it('scrubs a credential split across two real stderr writes (#1062)', async () => {
    const capture = captureConsole();
    try {
      const client = probeClient(
        ['-e', 'process.stderr.write(process.env.ACP_A);setTimeout(() => process.stderr.write(process.env.ACP_B), 120);'],
        { ACP_A: `api_key = ${HEX.slice(0, 12)}`, ACP_B: `${HEX.slice(12)}\n` }
      );
      await client.start().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 700));
      expect(capture.all()).not.toContain(HEX);
      expect(capture.all()).not.toContain(HEX.slice(12));
    } finally {
      capture.restore();
    }
  });

  it('does not tag a benign bridge notice as an error (#1041)', async () => {
    const { console: captured } = await driveChildStderr('Listening on stdio\nresolved bridge@0.4.1\n');
    expect(captured.at('error')).not.toContain('Listening on stdio');
    expect(captured.at('warn')).not.toContain('Listening on stdio');
    expect(captured.at('info')).toContain('Listening on stdio');
  });

  it('still makes a real failure stand out (#1041)', async () => {
    const { console: captured } = await driveChildStderr('Listening on stdio\nError: connect ECONNREFUSED 127.0.0.1:9\n');
    expect(captured.at('error')).toContain('ECONNREFUSED');
    expect(captured.at('info')).not.toContain('ECONNREFUSED');
  });

  it('leaves the stderr RING raw and unscrubbed', async () => {
    // HARD CONSTRAINT. The ring is raw-at-collection / redacted-at-read BY DESIGN -
    // its doc comment records two measured HIGH regressions from the last attempt
    // to scrub at the collection site. The log path is a SEPARATE buffer; if this
    // assertion ever inverts, the ring has been re-scrubbed at collection and
    // #1023's partial-credential regressions are back.
    const { ring, console: captured } = await driveChildStderr(`api_key = ${HEX}\n`);
    expect(ring).toContain(`api_key = ${HEX}`);
    expect(captured.all()).not.toContain(HEX);
  });
});
