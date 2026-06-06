/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Parses `## Step N: <title>` markdown headers out of a workflow body and
 * returns the steps in author order. Used by the Workflow Launch Surface to
 * derive {@link StepState} for the right rail (see SPEC §4.2, §11.1).
 *
 * Conventions enforced:
 *  - Header must use `##` (level 2). `###` or deeper is ignored.
 *  - The `Step` keyword is matched case-insensitively.
 *  - Leading whitespace before `##` is tolerated.
 *  - Title is everything after the colon, trimmed. May be empty.
 *  - Author-declared numbering is preserved (no auto-renumber).
 *  - `body_excerpt` runs from end-of-header-line to the start of the next
 *    matching `## Step` header (or EOF), capped at 8KB UTF-8.
 *  - Output is capped at MAX_STEPS (30); excess entries are dropped
 *    and `truncated` becomes `true`.
 */

const MAX_STEPS = 30;
const MAX_EXCERPT_BYTES = 8192;

// Matches a step header line in two supported formats:
//   1. Markdown header form:  `## Step N: <title>`
//   2. Bold-line form:        `**Step N: <title>**` (optionally followed by
//      trailing text like ` (uses: skill-name)`)
// Both are case-insensitive on the `Step` keyword. Captures the step number
// and the title (trailing parenthetical metadata is stripped from the title).
// The bundled workflows under `src/process/resources/skills-library/bodies/
// workflows/` use the bold-line form; legacy/user-authored workflows may use
// the markdown header form.
const STEP_HEADER_HEADING_RE = /^[ \t]*##[ \t]+step[ \t]+(\d+)[ \t]*:[ \t]*(.*?)[ \t]*$/i;
const STEP_HEADER_BOLD_RE = /^[ \t]*\*\*step[ \t]+(\d+)[ \t]*:[ \t]*([^*]*?)\*\*[ \t]*(?:\(.*\))?[ \t]*$/i;

function matchStepHeader(line: string): { n: number; title: string } | null {
  const heading = STEP_HEADER_HEADING_RE.exec(line);
  if (heading !== null) {
    return { n: Number.parseInt(heading[1], 10), title: heading[2].trim() };
  }
  const bold = STEP_HEADER_BOLD_RE.exec(line);
  if (bold !== null) {
    return { n: Number.parseInt(bold[1], 10), title: bold[2].trim() };
  }
  return null;
}

export type ParsedStep = {
  n: number;
  title: string;
  body_excerpt: string;
};

type StepMatch = {
  n: number;
  title: string;
  headerEndOffset: number; // byte offset just after the trailing newline
  headerStartOffset: number; // byte offset of the line's first character
};

/**
 * Truncate a string so its UTF-8 byte length does not exceed `maxBytes`.
 * Avoids splitting in the middle of a multi-byte code point.
 */
function truncateUtf8(input: string, maxBytes: number): string {
  if (Buffer.byteLength(input, 'utf8') <= maxBytes) return input;
  const buf = Buffer.from(input, 'utf8');
  let end = maxBytes;
  // Walk back until we land on a UTF-8 start byte (top bits != 10).
  while (end > 0 && (buf[end] & 0b1100_0000) === 0b1000_0000) {
    end -= 1;
  }
  return buf.subarray(0, end).toString('utf8');
}

export function parseSteps(body: string): {
  steps: ParsedStep[];
  truncated: boolean;
} {
  if (body.length === 0) return { steps: [], truncated: false };

  const matches: StepMatch[] = [];

  // Iterate line by line, tracking byte offsets so the body excerpt slice
  // is exact regardless of mixed CRLF / LF line endings.
  let cursor = 0;
  while (cursor < body.length) {
    const newlineIdx = body.indexOf('\n', cursor);
    const lineEnd = newlineIdx === -1 ? body.length : newlineIdx;
    const line = body.slice(cursor, lineEnd);
    const headerMatch = matchStepHeader(line);
    if (headerMatch !== null) {
      matches.push({
        n: headerMatch.n,
        title: headerMatch.title,
        headerStartOffset: cursor,
        headerEndOffset: newlineIdx === -1 ? body.length : newlineIdx + 1,
      });
    }
    cursor = newlineIdx === -1 ? body.length : newlineIdx + 1;
  }

  if (matches.length === 0) return { steps: [], truncated: false };

  const truncated = matches.length > MAX_STEPS;
  const kept = truncated ? matches.slice(0, MAX_STEPS) : matches;

  const steps: ParsedStep[] = kept.map((match, idx) => {
    // Body excerpt ends at the start of the next recognized step header
    // (even if that header was dropped by the 30-cap, we still do not want
    // the dropped header text to leak into the previous step's excerpt).
    const nextStart = idx + 1 < matches.length ? matches[idx + 1].headerStartOffset : body.length;
    const rawExcerpt = body.slice(match.headerEndOffset, nextStart);
    return {
      n: match.n,
      title: match.title,
      body_excerpt: truncateUtf8(rawExcerpt, MAX_EXCERPT_BYTES),
    };
  });

  return { steps, truncated };
}
