/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Engine stderr → host log level mapping (#717).
//
// The wcore engine self-labels its stderr lines in the Rust `tracing` format
// (`2026-07-05T13:55:04.233881Z  INFO message`, usually ANSI-coloured). The
// host used to blanket-log all engine stderr via console.error, so routine
// INFO startup chatter was re-tagged `[error]` in the desktop log (with raw
// escape codes), drowning real errors and breaking error-rate monitoring.

export type WCoreStderrLevel = 'debug' | 'info' | 'warn' | 'error';

// CSI escape sequences (colour/formatting) the engine emits for terminals.
// Stripped so the severity token parses cleanly and the log file stays plain
// text.
// eslint-disable-next-line no-control-regex
const ANSI_CSI_RE = /\u001b\[[0-9;?]*[A-Za-z]/g;

export function stripAnsi(text: string): string {
  return text.replace(ANSI_CSI_RE, '');
}

// `tracing` severities → host levels. TRACE and DEBUG both map to host debug
// (the file transport is info-level, so they stay console-only).
const LEVEL_MAP: Record<string, WCoreStderrLevel> = {
  TRACE: 'debug',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

/**
 * Parse the engine's own severity token from an ANSI-stripped stderr line.
 *
 * Matches the `tracing` shape: an optional leading timestamp token (starts
 * with a digit) followed by the level keyword, or the level keyword first.
 * Unlabelled lines (panics, raw prints) default to `warn`: prominent in the
 * log file without being counted as host errors. A level word appearing
 * mid-message does not count as a label.
 */
export function wcoreStderrLevel(line: string): WCoreStderrLevel {
  const match = /^\s*(?:\d\S*\s+)?(TRACE|DEBUG|INFO|WARN|ERROR)\b/.exec(line);
  return match ? LEVEL_MAP[match[1]] : 'warn';
}

/**
 * A PEM private-key block held whole, so the multi-line rule in
 * `@process/utils/secretRedaction` is never handed half of one (#1065).
 *
 * The engine's stderr is read a LINE at a time, and every consumer scrubs what
 * it is given. That is fatal for the only multi-line rule in the bank: handed a
 * single line, it can match nothing but the `-----BEGIN` header, and its
 * end-of-input alternative then masks that header to end of line - which DESTROYS
 * the anchor. Every body line after it is anchorless, invisible to that scrub and
 * to the whole-file scrub the feedback bundle runs later, so the key body reached
 * the log file and the feedback bundle in full.
 *
 * The repair belongs HERE and not in the regex. The tempting fix - anchor the
 * rule on the `-----END` line too, since that line is still in the buffer - makes
 * an anchorless PEM fragment matchable, and `tests/unit/acpStderrRingTruncationLeak.test.ts`
 * pins that exact invisibility as the property that makes a truncated ring safe.
 * A rule cannot be both.
 *
 * So the reader holds the block instead: from `-----BEGIN` to `-----END` nothing
 * is emitted, and the whole block becomes ONE marker. Two properties are
 * load-bearing:
 *
 *  - SEVERITY IS PRESERVED. The marker is emitted at the level of the line that
 *    opened the block, and every other line is classified exactly as before.
 *    #717 exists because routine INFO chatter re-tagged as host errors drowned
 *    real errors, and a fix that blanket-tags a marker `error` re-opens it.
 *  - THE HOLD IS CAPPED. An engine that prints `-----BEGIN PRIVATE KEY-----` and
 *    never terminates it must not swallow the rest of the log: at the cap the
 *    hold ends, a second marker records that it was never terminated, and normal
 *    per-line logging resumes. Stated exactly, because it is a real cost: after
 *    the cap, further body lines ARE logged. The alternative is a hold that never
 *    ends, where one `-----BEGIN` line mutes the log for the rest of the session
 *    and a real error becomes invisible - a worse failure than a bounded leak
 *    from an engine that is already emitting a key it never terminates. The cap
 *    is ten times a 4096-bit RSA key, so no terminated block can reach it.
 *
 * Text BEFORE the header on the same line is kept (a `tracing` line carries its
 * timestamp and level there); the header itself is dropped, so nothing downstream
 * sees a bare anchor to mask a diagnostic against.
 */
const PEM_BEGIN_RE = /-----BEGIN (?:[A-Z0-9]+ )?PRIVATE KEY-----/;
const PEM_END_RE = /-----END (?:[A-Z0-9]+ )?PRIVATE KEY-----/;

/** What replaces a held block. Carries no `-----` anchor of its own, by design. */
export const PEM_HELD_MARKER = '[redacted private key block]';
/** What replaces a block that never terminated, so the truncation is visible. */
export const PEM_HELD_UNTERMINATED_MARKER = '[redacted private key block: never terminated, log resumed]';

/**
 * Generous enough for any real key (a 4096-bit RSA private key is ~50 lines of
 * 64 characters) and small enough that an unterminated block costs a bounded
 * amount of log. Both limits apply: a single enormous line cannot pass the line
 * count.
 */
export const PEM_HOLD_MAX_LINES = 512;
export const PEM_HOLD_MAX_CHARS = 65536;

export type WCoreStderrEmission = { readonly text: string; readonly level: WCoreStderrLevel };

export type PemBlockHold = {
  /** The zero, one or two lines this input line should produce. */
  push(line: string): WCoreStderrEmission[];
  /** True while a block is being suppressed. Exposed for assertions, not control flow. */
  holding(): boolean;
};

export function createPemBlockHold(): PemBlockHold {
  let held: { level: WCoreStderrLevel; lines: number; chars: number } | null = null;

  return {
    holding: () => held !== null,
    push(line: string): WCoreStderrEmission[] {
      if (held) {
        held.lines += 1;
        held.chars += line.length;
        // The block closed cleanly: the marker was emitted when it opened, so
        // this line and the whole body simply disappear.
        if (PEM_END_RE.test(line)) {
          held = null;
          return [];
        }
        if (held.lines >= PEM_HOLD_MAX_LINES || held.chars >= PEM_HOLD_MAX_CHARS) {
          held = null;
          return [{ text: PEM_HELD_UNTERMINATED_MARKER, level: 'warn' }];
        }
        return [];
      }
      const begin = PEM_BEGIN_RE.exec(line);
      if (!begin) return [{ text: line, level: wcoreStderrLevel(line) }];
      held = { level: wcoreStderrLevel(line), lines: 0, chars: 0 };
      return [{ text: `${line.slice(0, begin.index)}${PEM_HELD_MARKER}`, level: held.level }];
    },
  };
}
