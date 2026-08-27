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
import {
  PEM_HELD_MARKER,
  PEM_HELD_UNTERMINATED_MARKER,
  PEM_HOLD_MAX_CHARS,
  PEM_HOLD_MAX_LINES,
  createPemBlockHold,
  stripAnsi,
  wcoreStderrLevel,
} from '../../src/process/agent/wcore/stderrLog';

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

/**
 * #1065. The block hold, tested as a state machine rather than by one happy
 * path: what a line produces depends on what came before it, and every defect in
 * this family has been a state the author did not enumerate.
 *
 * Every block below carries a known-positive control - an ordinary line still
 * passes through, at its own level - because a hold that suppressed EVERYTHING
 * would satisfy "the key body does not appear" perfectly.
 */
describe('createPemBlockHold', () => {
  const BODY = 'MIIEowIBAAKCAQEAx7Vv9QsQ2mJmZ0kZ0aVQq3zJmQ8k1nZ2bXcVvQwErTyUiOpAs';
  const texts = (emissions: ReadonlyArray<{ text: string }>): string[] => emissions.map((e) => e.text);
  /** Drive a whole transcript through one hold, as the reader does. */
  const drive = (lines: readonly string[]): Array<{ text: string; level: string }> => {
    const hold = createPemBlockHold();
    return lines.flatMap((line) => hold.push(line).map((e) => ({ text: e.text, level: e.level })));
  };

  it('passes an ordinary line through unchanged, at the engine’s own level', () => {
    expect(drive(['2026-07-05T13:55:04.249285Z  INFO postgres_schema: tool hidden'])).toEqual([
      { text: '2026-07-05T13:55:04.249285Z  INFO postgres_schema: tool hidden', level: 'info' },
    ]);
  });

  /**
   * The four PEM header spellings the rule accepts, enumerated: a bare block and
   * the three algorithm-tagged ones. A hold that recognised only `RSA` would look
   * identical on the one shape somebody tested.
   */
  const KINDS = ['', 'RSA ', 'EC ', 'DSA ', 'OPENSSH '] as const;

  it.each(KINDS)('suppresses a whole %j PRIVATE KEY block and emits one marker', (kind) => {
    const out = drive([
      'ERROR failed to load signing material:',
      `-----BEGIN ${kind}PRIVATE KEY-----`,
      BODY,
      BODY,
      `-----END ${kind}PRIVATE KEY-----`,
      'ERROR giving up REAL-DIAGNOSTIC',
    ]);
    expect(texts(out)).toEqual([
      'ERROR failed to load signing material:',
      PEM_HELD_MARKER,
      'ERROR giving up REAL-DIAGNOSTIC',
    ]);
    // Controls in the same block: the lines around the block survive with their
    // own levels, so this is a hold and not a mute.
    expect(out.map((e) => e.level)).toEqual(['error', 'warn', 'error']);
  });

  it('keeps the text BEFORE the header on the same line, and drops the anchor', () => {
    const out = drive(['2026-08-25T10:00:01.000000Z ERROR key was: -----BEGIN PRIVATE KEY-----', BODY]);
    expect(out).toEqual([{ text: `2026-08-25T10:00:01.000000Z ERROR key was: ${PEM_HELD_MARKER}`, level: 'error' }]);
    // The marker carries no `-----` of its own: a downstream scrub must not find
    // an anchor here, or it would mask the diagnostic prefix that was kept.
    expect(PEM_HELD_MARKER).not.toContain('-----');
  });

  /**
   * The cap, and exactly what it costs. Once the hold ends, everything after it
   * is ordinary text again - INCLUDING more body lines, if the engine is still
   * printing them. That is the deliberate direction: a hold that never ended
   * would let one `-----BEGIN` line mute the log for the rest of the session,
   * and a muted log is how a real error becomes invisible. 512 lines is about
   * ten times a 4096-bit RSA key, so no terminated block can reach it.
   */
  it('a block that never terminates is capped, and the log resumes after it', () => {
    const out = drive([
      '-----BEGIN PRIVATE KEY-----',
      ...Array.from({ length: PEM_HOLD_MAX_LINES }, () => BODY),
      'the cap has ended the hold, so this is ordinary text again',
      'ERROR giving up REAL-DIAGNOSTIC',
    ]);
    expect(texts(out)).toEqual([
      PEM_HELD_MARKER,
      PEM_HELD_UNTERMINATED_MARKER,
      'the cap has ended the hold, so this is ordinary text again',
      'ERROR giving up REAL-DIAGNOSTIC',
    ]);
    expect(out.at(-1)?.level).toBe('error');
  });

  it('a single enormous unterminated line is capped by characters, not only by count', () => {
    const out = drive(['-----BEGIN PRIVATE KEY-----', 'A'.repeat(PEM_HOLD_MAX_CHARS + 1), 'ERROR REAL-DIAGNOSTIC']);
    expect(texts(out)).toEqual([PEM_HELD_MARKER, PEM_HELD_UNTERMINATED_MARKER, 'ERROR REAL-DIAGNOSTIC']);
  });

  it('two blocks in one stream are held independently', () => {
    const out = drive([
      '-----BEGIN PRIVATE KEY-----',
      BODY,
      '-----END PRIVATE KEY-----',
      'INFO between',
      '-----BEGIN EC PRIVATE KEY-----',
      BODY,
      '-----END EC PRIVATE KEY-----',
      'INFO after',
    ]);
    expect(texts(out)).toEqual([PEM_HELD_MARKER, 'INFO between', PEM_HELD_MARKER, 'INFO after']);
  });

  it('an END line with no BEGIN is ordinary text (nothing is retroactively held)', () => {
    // The other half of the anchor decision: this reader must NOT treat a lone
    // END as a reason to suppress, because a truncated block's tail carries no
    // credential material of its own and suppressing on it would let a hostile
    // engine mute the log with one line.
    const hold = createPemBlockHold();
    expect(hold.holding()).toBe(false);
    expect(texts(hold.push('-----END PRIVATE KEY-----'))).toEqual(['-----END PRIVATE KEY-----']);
    expect(hold.holding()).toBe(false);
  });

  it('a line that merely mentions the words is not a block', () => {
    const lines = [
      'ERROR could not read PRIVATE KEY from /etc/keys/id_rsa',
      'INFO -----BEGIN CERTIFICATE----- follows',
      'WARN begin private key parse failed',
    ];
    expect(texts(drive(lines))).toEqual(lines);
  });
});
