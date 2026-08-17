/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The secret scrubber that `@process/webserver/routes/configWriteGuards` carried
 * before #992 folded it into `@process/utils/secretRedaction`, preserved
 * VERBATIM as a test fixture.
 *
 * It is kept alive deliberately. #992 claimed the shared module masks a superset
 * of what this masked, and the first attempt at the change asserted that in a
 * code comment while being wrong on two shapes - a `{8,}` Bearer floor where
 * this has `+`, and a trailing `\b` on the `xox`/`xai` patterns that this does
 * not have. A prose claim cannot fail CI; this fixture can, via
 * `tests/unit/secretRedaction.superset.test.ts`.
 *
 * DO NOT "modernise" this to match the current implementation. Its only job is
 * to be the historical baseline. If a pattern here is genuinely wrong, that is a
 * finding about the shared module, not a reason to edit this file.
 */
export function legacyWebserverRedactSecrets(text: string): string {
  if (!text) return text;
  return (
    text
      // Bearer <token>  -> Bearer [redacted]
      .replace(/\bBearer\s+[A-Za-z0-9._\-+/=]+/gi, 'Bearer [redacted]')
      // sk-... / sk-live-... / sk-proj-... (OpenAI/Anthropic-style)
      .replace(/\bsk-[A-Za-z0-9-]{8,}/g, 'sk-[redacted]')
      // xai- (xAI) and xoxb-/xoxp- (Slack) style prefixed tokens
      .replace(/\bxai-[A-Za-z0-9-]{8,}/g, 'xai-[redacted]')
      .replace(/\bxox[baprs]-[A-Za-z0-9-]{8,}/g, 'xox-[redacted]')
  );
}

/**
 * Every substring the legacy scrubber would have masked in `text`, in source
 * order. The superset check needs the matched RUNS, not the masked output:
 * "did the new scrubber also remove this exact run" is the question, and the
 * two implementations use different placeholder text.
 */
export function legacyMaskedRuns(text: string): string[] {
  const patterns = [
    /\bBearer\s+[A-Za-z0-9._\-+/=]+/gi,
    /\bsk-[A-Za-z0-9-]{8,}/g,
    /\bxai-[A-Za-z0-9-]{8,}/g,
    /\bxox[baprs]-[A-Za-z0-9-]{8,}/g,
  ];
  const runs: string[] = [];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) runs.push(match[0]);
  }
  return runs;
}
