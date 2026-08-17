/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared secret scrubber for untrusted subprocess output.
 *
 * Extracted verbatim from `@process/agent/wcore/index.ts` (#984): the engine
 * stderr redactor was the only one of its kind and lived inside the wcore agent,
 * so every OTHER agent stderr path - notably `AgentStartupError` and the
 * electron-log file transport - surfaced raw child output. The patterns below
 * are unchanged from that original; this module only moves them somewhere every
 * consumer can reach.
 *
 * NOTE: `@process/webserver/routes/configWriteGuards` exports a separate,
 * narrower `redactSecrets` for HTTP response bodies. It is deliberately left
 * alone here - unifying the two is a behaviour change, not an extraction.
 *
 * Keep this module dependency-free: it is imported by `AcpError`, which is
 * pulled into bundles that must not drag storage/electron modules along.
 */

// High-confidence secret shapes to mask before untrusted subprocess output is
// surfaced into the user-facing error UI (#484 audit). Init failures shouldn't
// echo credentials, but stderr is untrusted engine output, so scrub known token
// formats defensively. Conservative on purpose: well-known prefixes and
// explicitly-labelled assignments, so real error text is preserved.
//
// K-02/K-03 cross-audit: an earlier version of this comment said the full text
// still reached the local console log for debugging. That is no longer true and
// was the defect - the raw stderr line WAS logged verbatim, putting a live
// credential on disk and into the renderer DevTools stream regardless of the
// redaction applied to the user-facing error. Every emission is now redacted.
const SECRET_PATTERNS: RegExp[] = [
  /\b(?:sk|pk|rk)-[A-Za-z0-9_-]{16,}\b/g, // OpenAI / Anthropic / Stripe style
  /\bBearer\s+[A-Za-z0-9._-]{16,}\b/gi, // Authorization: Bearer <token>
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/g, // GitHub tokens
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, // Slack tokens
  /\bAKIA[0-9A-Z]{16}\b/g, // AWS access key id
  /\bAIza[A-Za-z0-9_-]{35}\b/g, // Google API key
  // JWT: three base64url segments. The `eyJ` prefix (a `{"` header) makes this
  // specific enough not to swallow ordinary dotted identifiers.
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
  // `Authorization:` carrying a raw token with no `Bearer` scheme.
  /\bAuthorization\s*:\s*(?!Bearer\b)[A-Za-z0-9._~+/-]{16,}=*/gi,
];

/**
 * A LABELLED assignment - the label is what makes it high-confidence, so an
 * engine echoing `api_key = "<value>"` from a config line is caught even when
 * the value carries no recognizable prefix. Kept separate from
 * {@link SECRET_PATTERNS} rather than indexed inside it: an index-based special
 * case silently mis-applies itself the moment somebody inserts a pattern above
 * it, which it did on the first attempt here.
 */
const LABELLED_SECRET_ASSIGNMENT =
  /\b(api[_-]?key|auth[_-]?token|access[_-]?token|refresh[_-]?token|client[_-]?secret|password|passwd)(\s*[:=]\s*)["']?[^\s"',}]{8,}["']?/gi;

export function redactSecrets(text: string): string {
  let out = text;
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, '[redacted]');
  }
  // Label preserved, value masked, so the diagnostic still reads sensibly.
  return out.replace(
    LABELLED_SECRET_ASSIGNMENT,
    (_match, label: string, separator: string) => `${label}${separator}[redacted]`
  );
}

/**
 * Scrub the string arguments of one electron-log message payload.
 *
 * Deliberately limited to top-level strings: log arguments are arbitrary values
 * and deep-cloning every object on every line would cost more than it buys.
 * Strings are where untrusted subprocess output actually arrives (`console.log
 * ('[wcore]', line)`), so this closes the realistic disk-exposure path without
 * pretending to be a total guarantee.
 */
export function redactLogData(data: readonly unknown[]): unknown[] {
  return data.map((item) => (typeof item === 'string' ? redactSecrets(item) : item));
}
