/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Mask the common secret shapes that can appear inline in a shell command so the
 * activity timeline - which renders the REAL command since #520/#604 - never
 * displays a live credential (#610).
 *
 * Deliberately TARGETED. The diagnostics redactor in conciergeDiagServer masks
 * any long token because over-redaction is safe for a machine-read dump; a
 * command shown to the user is different - masking every 24-char run would hide
 * legitimate paths, flags and long args and defeat the whole point of showing
 * the real command. So this only masks recognizable secret shapes:
 *   - Bearer / Basic auth values (`Authorization: Bearer sk-...`),
 *   - prefixed provider API keys (`sk-`, `sk-ant-`, `ghp_`, `xoxb-`, `glpat-`,
 *     `AKIA`, `AIza`, Stripe `sk_live_`, ...),
 *   - secret-named `key=value` / `key: value` / `--key value` pairs,
 *   - URL userinfo passwords (`scheme://user:PASSWORD@host`).
 *
 * This is the command/args RENDER side on desktop; tool OUTPUT redaction is
 * handled separately at the engine emit choke point (wayland-core #584).
 */

/** What a masked secret renders as. Fixed bullets - no last-4, this is a UI display. */
const MASK = '••••••';

// `Authorization: Bearer <token>` or a bare `Bearer <token>`.
const BEARER_REGEX = /\bbearer\s+[A-Za-z0-9._~+/=-]{6,}/gi;

// `Authorization: Basic <base64>`. Require a base64-SHAPED value (>=16 chars and
// containing a digit or +/=/) so the common English word "basic" followed by an
// ordinary word - `git commit -m "basic refactor"` - is never masked.
const BASIC_REGEX = /\bbasic\s+([A-Za-z0-9+/]{16,}={0,2})/gi;

// Prefixed provider API keys. Boundaried so an ordinary word is never masked.
const PREFIXED_KEY_REGEX =
  /\b(?:sk-ant-|sk-|sk_live_|sk_test_|rk_live_|rk_test_|pk_live_|pk_test_|xox[abprs]-|gh[posru]_|github_pat_|glpat-|AKIA|ASIA|AIza|gsk_|xai-|r8_|dop_v1_)[A-Za-z0-9_./-]{6,}/g;

// Secret-NAMED key followed by its value. Preserves the key name + separator and
// masks only the value, so `--api-key sk-x`, `TOKEN=abc123` and the JSON form
// `"password":"p@ss"` all mask the value while `path=/tmp/x` (non-secret name)
// stays untouched. The optional quote BEFORE the separator lets it catch the
// JSON args shape (the timeline stringifies rawInput). `authorization` is
// omitted here - Bearer/Basic handle it. NOTE: for the bare-whitespace separator
// (no `:`/`=`) the value is masked only when it LOOKS like a credential - see the
// replace callback - so prose like `git log --grep secret main` stays intact.
//
// Leading boundary is `(?<![A-Za-z0-9])` rather than `\b`: `\w` counts `_` as a
// word char, so `\b` MISSES an underscore-glued name like `ANTHROPIC_API_KEY=...`
// (the `_` before `API` is not a `\b`). Excluding only `[A-Za-z0-9]` treats the
// `_` (and any separator, and start-of-string) as a boundary, so UPPER_SNAKE and
// snake_case key names match (#610 Overwatch).
//
// The TRAILING side has the same `\b` trap in reverse: the recognized keyword
// must be the LAST segment before the delimiter, so a name that GLUES more
// segments after it - `AWS_SECRET_ACCESS_KEY=...`, `SECRET_KEY=...`,
// `CLIENT_SECRET_ID=...`, `REFRESH_TOKEN_EXPIRY=...` - failed the old `\b`
// (`SECRET` is followed by the `_` of `_ACCESS_KEY`, both word chars) and leaked
// the value in full. Fix: consume any trailing `[_-]segment` runs and end on a
// `(?![A-Za-z0-9])` lookahead (also fires against digits/punctuation, unlike
// `\b`). The keyword AND its trailing segments are captured together so the whole
// name is preserved in the masked render, not just the keyword (#610 Overwatch).
const KEY_VALUE_REGEX =
  /(?<![A-Za-z0-9])((?:api[_-]?key|apikey|access[_-]?token|refresh[_-]?token|auth[_-]?token|client[_-]?secret|secret|password|passwd|token)(?:[_-][a-z0-9]+)*)(?![A-Za-z0-9])(["']?\s*[:=]\s*|\s+)(["']?)([^\s"']{4,})/gi;

// camelCase key names (`openaiApiKey`, `clientSecret`, `accessToken`) glue the
// key to a lowercase prefix, so neither `\b` nor the separator boundary above
// fires - the boundary is the lower->upper seam. This is case-SENSITIVE (no `i`
// flag) on purpose: under `i` the `[a-z]`/`[A-Z]` classes collapse and the seam
// is lost (#610 Overwatch). Names are the Capitalized compound forms.
const CAMEL_KEY_VALUE_REGEX =
  /(?<=[a-z])(ApiKey|ApiToken|ApiSecret|AccessToken|RefreshToken|AuthToken|AccessKey|SecretKey|PrivateKey|ClientSecret|Secret|Password|Passwd|Token)\b(["']?\s*[:=]\s*|\s+)(["']?)([^\s"']{4,})/g;

// `scheme://user:PASSWORD@host` - mask only the password segment.
const URL_USERINFO_REGEX = /(\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/]+:)([^\s@/]+)(@)/gi;

/**
 * Return `command` with recognizable inline secrets masked. Safe on any string
 * (returns it unchanged when there is nothing to mask); never throws.
 */
export function redactCommandSecrets(command: string): string {
  if (!command) return command;
  let out = command;
  out = out.replace(URL_USERINFO_REGEX, (_m, prefix: string, _secret: string, at: string) => `${prefix}${MASK}${at}`);
  out = out.replace(BEARER_REGEX, `Bearer ${MASK}`);
  out = out.replace(BASIC_REGEX, (m: string, tok: string) => (/[0-9+/=]/.test(tok) ? `Basic ${MASK}` : m));
  out = out.replace(PREFIXED_KEY_REGEX, MASK);
  // Shared key=value masker for both the snake/separator and camelCase forms.
  const maskKeyValue = (m: string, key: string, sep: string, quote: string, value: string) => {
    // With an explicit `:`/`=` the pair is unambiguous - always mask. With a bare
    // whitespace separator, only mask a value that actually looks like a secret
    // (has an uppercase/digit/symbol, or is long) so a secret-NAMED English word
    // followed by a plain word - "grep secret main", "password field required" -
    // is not clobbered.
    const hasDelim = /[:=]/.test(sep);
    const looksSecret = /[^a-z]/.test(value) || value.length >= 16;
    if (!hasDelim && !looksSecret) return m;
    return `${key}${sep}${quote}${MASK}`;
  };
  out = out.replace(KEY_VALUE_REGEX, maskKeyValue);
  out = out.replace(CAMEL_KEY_VALUE_REGEX, maskKeyValue);
  return out;
}
