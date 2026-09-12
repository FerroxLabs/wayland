/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// CSI escape sequences (colour/formatting) an engine emits for terminals.
// Stripped so the severity token parses cleanly and the log file stays plain
// text.
// eslint-disable-next-line no-control-regex
const ANSI_CSI_RE = /\u001b\[[0-9;?]*[A-Za-z]/g;

export function stripAnsi(text: string): string {
  return text.replace(ANSI_CSI_RE, '');
}

/**
 * A PEM private-key block held whole, so the multi-line rule in
 * `@process/utils/secretRedaction` is never handed half of one (#1065).
 *
 * Engine stderr is read a LINE at a time, and every consumer scrubs what it is
 * given. That is fatal for the only multi-line rule in the bank: handed a
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
 * is emitted, and the whole block becomes ONE marker. THE HOLD IS CAPPED: an
 * engine that prints `-----BEGIN PRIVATE KEY-----` and never terminates it must
 * not swallow the rest of the log. At the cap the hold ends, a second marker
 * records that it was never terminated, and normal per-line logging resumes.
 * After the cap, further body lines ARE logged; the alternative is a hold that
 * never ends, where one `-----BEGIN` line mutes the log for the rest of the
 * session. The cap is ten times a 4096-bit RSA key, so no terminated block can
 * reach it.
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

export type PemBlockHold = {
  /** The zero or one line this input line should produce. */
  push(line: string): string[];
  /** True while a block is being suppressed. Exposed for assertions, not control flow. */
  holding(): boolean;
};

export function createPemBlockHold(): PemBlockHold {
  let held: { lines: number; chars: number } | null = null;

  return {
    holding: () => held !== null,
    push(line: string): string[] {
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
          return [PEM_HELD_UNTERMINATED_MARKER];
        }
        return [];
      }
      const begin = PEM_BEGIN_RE.exec(line);
      if (!begin) return [line];
      held = { lines: 0, chars: 0 };
      return [`${line.slice(0, begin.index)}${PEM_HELD_MARKER}`];
    },
  };
}
