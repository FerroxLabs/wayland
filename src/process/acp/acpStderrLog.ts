/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// ACP bridge stderr -> host log level + redaction (#1041, #1062).
//
// Two defects, one function, because they are two rewrites of the same handler:
//
//  - #1062: both ACP stderr handlers wrote the RAW chunk. `ProcessAcpClient`
//    console.error'd it (log file + renderer DevTools stream), and
//    `AcpConnection` sliced it into `stderrHead`/`stderrTail` which
//    `buildStartupErrorMessage` puts in the user-facing startup error with no
//    redaction of any kind. A bridge that echoes `Authorization: Bearer <key>`
//    before failing therefore put a live credential on disk AND on screen.
//
//  - #1041: every chunk went to console.error, so routine bridge chatter
//    ("Listening on stdio", npm notices) was tagged `[error]` in the log,
//    drowning real errors and making bug reports read as a wall of failures.
//
// Both are fixed HERE rather than at either call site so the two handlers cannot
// drift apart again.

import { createPemBlockHold, PEM_HELD_UNTERMINATED_MARKER, stripAnsi } from '@process/agent/wcore/stderrLog';
import { redactSecrets } from '@process/utils/secretRedaction';

export type AcpStderrLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Node's own process-warning shape, `(node:12345) [DEP0040] DeprecationWarning: ...`.
 * Without it the `Warning:` rule anchors on a line start the warning never occupies
 * and every deprecation and experimental-flag notice falls through to the info
 * default.
 */
const NODE_WARNING_RE = /^\s*(?:\(node:\d+\)\s*)?(?:\[[^\]]*\]\s*)?(?:[A-Z][A-Za-z0-9_]*)?Warning:/;

/**
 * Classify one ACP bridge stderr line.
 *
 * THE DEFAULT IS `info`, and that is the whole reason this is not
 * `wcoreStderrLevel` (which defaults to `warn`). The wcore engine self-labels
 * every line in the Rust `tracing` format, so an UNLABELLED line there is an
 * anomaly - a panic or a raw print - and `warn` is the right floor for it. ACP
 * bridges are ordinary Node programs that label nothing: `Listening on stdio`,
 * a bunx resolution notice and a bridge's own progress output all arrive bare.
 * Defaulting those to `warn` re-tags every benign notice, which is #1041 with a
 * different severity word, and it also destroys the property #1041 actually
 * asks for - that a real failure STANDS OUT. It can only stand out if the
 * ordinary line next to it is quieter than it is.
 *
 * So severity is only raised on evidence the line carries itself.
 */
export function acpStderrLevel(line: string): AcpStderrLevel {
  const text = stripAnsi(line);

  // Node's own failure shapes, plus the bracketed/leading level words bridges
  // and their loggers emit. `<Word>Error:` covers `Error:`, `TypeError:`,
  // `AbortError:`; the stack frames that follow one are part of that diagnostic.
  if (
    /^\s*[[(]?\s*(?:ERR|ERROR|FATAL|PANIC|CRITICAL)\b/i.test(text) ||
    /^\s*npm ERR!/.test(text) ||
    /^\s*(?:Uncaught\s+)?(?:[A-Z][A-Za-z0-9_]*)?Error:/.test(text) ||
    /^\s*at\s+\S/.test(text) ||
    /\bUnhandledPromiseRejection\b/.test(text) ||
    /^\s*throw\b/.test(text)
  ) {
    return 'error';
  }

  if (/^\s*[[(]?\s*(?:WARN|WARNING)\b/i.test(text) || /^\s*npm WARN/.test(text) || NODE_WARNING_RE.test(text)) {
    return 'warn';
  }

  if (/^\s*[[(]?\s*(?:TRACE|DEBUG|VERBOSE)\b/i.test(text)) return 'debug';

  return 'info';
}

/**
 * Hard ceiling on ONE unterminated line before the reader gives up on it.
 *
 * Deliberately the SAME number as `STDERR_PENDING_MAX` in `ProcessAcpClient` and
 * deliberately NOT the same variable: the ring's ceiling freezes the fragment as a
 * record and keeps it, because the ring is a diagnostic that must survive. This one
 * DISCARDS, because the log path has already written every earlier line and losing
 * one absurd line costs nothing.
 */
export const ACP_STDERR_LINE_MAX = 32768;

/** Emitted in place of a line that ran past {@link ACP_STDERR_LINE_MAX}. */
export const ACP_STDERR_LINE_DISCARDED = `[acp stderr: line exceeded ${ACP_STDERR_LINE_MAX} characters and was discarded]`;

export type AcpStderrReader = {
  /** Feed one raw stderr chunk. */
  push(chunk: string): void;
  /** Emit the held remainder. Call when the stream ends; idempotent. */
  flush(): void;
};

/**
 * Assemble raw ACP stderr chunks into WHOLE LINES, scrub each one, classify it, and
 * hand it to `sink`. The sink never sees raw bridge output.
 *
 * Line assembly is not cosmetic, it is what makes the scrub sound. `redactSecrets`
 * only matches a WHOLE credential, so scrubbing a raw CHUNK is unsafe in both
 * directions: a chunk can end mid-token (the anchor is masked, the continuation in
 * the next chunk is anchorless and invisible to every later scrub) and a chunk can
 * begin mid-token (no anchor at all). A LINE cannot be either: a chunk boundary
 * falls wherever the pipe happened to flush, while every credential shape in the
 * bank sits inside a single line, so a whole line is always whole credentials.
 *
 * Except one. The PEM rule is the bank's only multi-line rule, and handed a single
 * line it matches nothing but `-----BEGIN` and masks that header to end of line,
 * destroying the anchor while the key body is still arriving (#1065). So the same
 * `createPemBlockHold` the wcore reader uses holds the block here too. Its own
 * severities are discarded and re-derived with {@link acpStderrLevel}, because that
 * hold classifies with `wcoreStderrLevel` and its `warn` default is exactly what
 * this reader must not inherit - with the ONE exception of its unterminated marker,
 * which stays `warn` because a key block that never closed is a genuine anomaly.
 *
 * NOTHING here touches the caller's diagnostic buffers. `ProcessAcpClient`'s ring is
 * raw-at-collection / redacted-at-read BY DESIGN (its doc comment records two
 * measured HIGH regressions from scrubbing at the collection site) and this reader
 * runs alongside it, not inside it.
 */
export function createAcpStderrReader(sink: (line: string, level: AcpStderrLevel) => void): AcpStderrReader {
  const hold = createPemBlockHold();
  let pending = '';
  // After a discarded over-long line, resume only at the next real boundary:
  // resuming anywhere else could resume INSIDE a credential whose anchor was
  // discarded with the fragment.
  let resyncing = false;

  const emit = (rawLine: string): void => {
    for (const emission of hold.push(stripAnsi(rawLine))) {
      if (!emission.text.trim()) continue;
      const level = emission.text === PEM_HELD_UNTERMINATED_MARKER ? 'warn' : acpStderrLevel(emission.text);
      sink(redactSecrets(emission.text), level);
    }
  };

  return {
    push(chunk: string): void {
      let text = chunk;
      if (resyncing) {
        const boundary = text.search(/[\r\n]/);
        if (boundary < 0) return;
        text = text.slice(boundary + 1);
        resyncing = false;
      }

      pending += text;

      // `\r` is a boundary as well as `\n`: bare-CR output (progress bars) has real
      // line boundaries with no `\n` anywhere, and treating it as one endless line
      // would hold a bridge's entire progress output out of the log.
      const lastBoundary = Math.max(pending.lastIndexOf('\n'), pending.lastIndexOf('\r'));
      if (lastBoundary >= 0) {
        const complete = pending.slice(0, lastBoundary + 1);
        pending = pending.slice(lastBoundary + 1);
        for (const line of complete.split(/\r\n|[\r\n]/)) {
          if (line !== '') emit(line);
        }
      }

      if (pending.length > ACP_STDERR_LINE_MAX) {
        pending = '';
        resyncing = true;
        sink(ACP_STDERR_LINE_DISCARDED, 'warn');
      }
    },

    flush(): void {
      // A bridge that writes its last line without a trailing newline and exits.
      // Before line assembly that line was logged (as part of its chunk); it still
      // has to be.
      if (resyncing || pending === '') return;
      const last = pending;
      pending = '';
      emit(last);
    },
  };
}
