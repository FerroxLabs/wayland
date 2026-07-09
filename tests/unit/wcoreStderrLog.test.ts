/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Engine stderr → host log level mapping (#717). The wcore engine self-labels
 * its stderr lines (Rust `tracing` format); the host must honour that label
 * instead of re-tagging every line `[error]`, and must strip ANSI colour
 * codes before the text reaches the log file.
 */
import { describe, expect, it } from 'vitest';
import { stripAnsi, wcoreStderrLevel } from '../../src/process/agent/wcore/stderrLog';

const ESC = '\u001b';

describe('stripAnsi', () => {
  it('removes CSI colour sequences, keeping the text', () => {
    const raw = `${ESC}[2m2026-07-05T13:55:04.233881Z${ESC}[0m ${ESC}[32m INFO${ESC}[0m egress security ENFORCING`;
    expect(stripAnsi(raw)).toBe('2026-07-05T13:55:04.233881Z  INFO egress security ENFORCING');
  });

  it('leaves plain text untouched, including bracketed tags', () => {
    expect(stripAnsi('[wcore] plain message')).toBe('[wcore] plain message');
  });
});

describe('wcoreStderrLevel', () => {
  it('maps a timestamped tracing INFO line to info', () => {
    expect(
      wcoreStderrLevel('2026-07-05T13:55:04.249285Z  INFO postgres_schema: no DATABASE_URL set — tool hidden')
    ).toBe('info');
  });

  it('maps WARN and ERROR to matching host levels', () => {
    expect(wcoreStderrLevel('2026-07-05T13:55:04.100000Z  WARN provider retry scheduled')).toBe('warn');
    expect(wcoreStderrLevel('2026-07-05T13:55:04.100000Z ERROR provider request failed')).toBe('error');
  });

  it('maps TRACE and DEBUG to host debug', () => {
    expect(wcoreStderrLevel('2026-07-05T13:55:04.100000Z TRACE poll tick')).toBe('debug');
    expect(wcoreStderrLevel('2026-07-05T13:55:04.100000Z DEBUG config resolved')).toBe('debug');
  });

  it('parses a level-first line without a timestamp', () => {
    expect(wcoreStderrLevel('INFO starting engine')).toBe('info');
  });

  it('defaults unlabelled lines (panics, raw prints) to warn', () => {
    expect(wcoreStderrLevel("thread 'main' panicked at src/lib.rs:42")).toBe('warn');
    expect(wcoreStderrLevel('some raw diagnostic output')).toBe('warn');
  });

  it('ignores a level word appearing mid-message', () => {
    expect(wcoreStderrLevel('note: see INFO docs for details')).toBe('warn');
  });

  it('parses the level after ANSI stripping of a real engine line', () => {
    const raw = `${ESC}[2m2026-07-05T13:55:04.233881Z${ESC}[0m ${ESC}[32m INFO${ESC}[0m egress security ENFORCING — exfil-shaped traffic blocked allowlisted=37`;
    expect(wcoreStderrLevel(stripAnsi(raw))).toBe('info');
  });
});
