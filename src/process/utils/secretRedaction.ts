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
 * #992 then folded in the SECOND copy: `@process/webserver/routes/configWriteGuards`
 * carried its own narrower `redactSecrets` for HTTP response bodies - no JWT, no
 * labelled assignment, no bare `Authorization:` header - and that narrower copy
 * guarded the REMOTE-FACING routes. Two divergent copies is how the weaker one
 * ended up on the more exposed surface, so they are now one.
 *
 * The pattern set below is therefore the UNION of both, not the extracted set
 * alone: the `xai-` prefix, base64 padding characters in a Bearer value, the
 * `+`-not-`{8,}` Bearer quantifier and the shorter minimum token lengths came
 * from the webserver copy. That superset property is not a claim, it is
 * asserted by execution - `tests/unit/secretRedaction.superset.test.ts` runs a
 * corpus through the deleted webserver pattern set and this one and fails if
 * anything the old set masked survives here.
 *
 * THIS IS NOT THE ONLY SCRUBBER, and #992's premise that it could be was wrong.
 * The repo carries FOUR, each with a masking contract this one cannot serve:
 * `conciergeDiagServer` (diagnostics dump; separate esbuild subprocess bundle;
 * masks to the last 4 characters so a Doctor report stays readable, and carries
 * entropy rules - bare 24+ runs, 32+ hex - that would mask commit SHAs and
 * binary digests here), `redactCommandSecrets` (shell command RENDER; fixed
 * bullets; deliberately narrow so paths and flags survive) and
 * `capabilityProjection` (shape-naming placeholders, because the reason string
 * is read to learn WHICH credential class was involved). They are registered
 * with their reasons in `tests/unit/secretRedaction.test.ts`, which fails when a
 * FIFTH bank appears unregistered.
 *
 * What those banks had and this module did not has been folded in: the
 * `ASIA`/`github_pat_`/`glpat-`/`gsk_`/`r8_`/`dop_v1_`/`ya29.`/`1//` prefixes,
 * Stripe underscore keys, `Basic` auth, PEM private-key blocks, Slack webhook
 * URLs and the URL userinfo password.
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
  // No trailing `\b`, for CONSISTENCY with the patterns below - not because this
  // one was escaping. Its class `[A-Za-z0-9_-]` already contains every word
  // character, so the match always ran through any following word chars and the
  // boundary always held; unlike `xox`/`gh*_`/`AKIA`, this pattern was never
  // defective. Dropping the anchor is harmless and keeps one rule for the whole
  // list. The floor here IS a deliberate widening: 16 -> 8, from the deleted
  // webserver copy.
  /\b(?:sk|pk|rk)-[A-Za-z0-9_-]{8,}/g, // OpenAI / Anthropic / Stripe style
  // Bearer <token>. Two properties here are load-bearing and BOTH were got wrong
  // on the first pass at #992, so do not "tidy" them:
  //  - the class carries base64 padding (`+/=`); without it the tail of a raw
  //    base64 bearer value survived the mask;
  //  - the quantifier is `{1,}`, matching the deleted webserver pattern's `+`.
  //    A `{8,}` floor left `Bearer x` and `bearer abcdef` UNMASKED on the
  //    remote-facing routes, which is a weakening, not a widening.
  /\bBearer\s+[A-Za-z0-9._\-+/=]{1,}/gi,
  // Stripe-style UNDERSCORE keys. The hyphen pattern above does not see these:
  // `sk_live_...` is a live Stripe secret key and was masked by the command
  // renderer's bank and by nothing here.
  /\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{8,}/g,
  // `Basic <base64>` carries base64(user:password). Requires a base64-SHAPED
  // value so the ordinary English word "basic" followed by a word is not masked.
  /\bBasic\s+[A-Za-z0-9+/]{16,}={0,2}/gi,
  // No trailing `\b`: class omits `_`, so `ghp_<token>_backup` escaped ENTIRELY.
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/g, // GitHub tokens
  /\bgithub_pat_[A-Za-z0-9_]{20,}/g, // GitHub fine-grained PAT
  /\bglpat-[A-Za-z0-9_-]{8,}/g, // GitLab PAT
  /\bgsk_[A-Za-z0-9]{20,}/g, // Groq
  /\br8_[A-Za-z0-9]{20,}/g, // Replicate
  /\bdop_v1_[A-Za-z0-9]{20,}/g, // DigitalOcean
  /\bya29\.[A-Za-z0-9_.-]{8,}/g, // Google OAuth access token
  /1\/\/[A-Za-z0-9_.-]{8,}/g, // Google OAuth refresh token
  // NO trailing `\b` on these two. The `xox` class excludes `_`, so a token
  // followed by `_` cannot satisfy a trailing boundary; backtracking then
  // exhausts the `{8,}` floor and the whole token goes UNMASKED
  // (`xoxb-ABCDEFGHIJKLMNOPQRSTUVWX_tail` survived intact), or matches only up
  // to an internal hyphen and leaks the tail. The deleted webserver copy had no
  // trailing boundary for exactly this reason.
  /\bxox[baprs]-[A-Za-z0-9-]{8,}/g, // Slack tokens
  /\bxai-[A-Za-z0-9_-]{8,}/g, // xAI tokens
  // No trailing `\b`: class omits `_` and lowercase, and the length is FIXED, so
  // there is not even any backtracking to fall back on - `AKIA...EXAMPLE_x`
  // escaped entirely.
  /\b(?:AKIA|ASIA)[0-9A-Z]{16}/g, // AWS access key id / STS temporary key
  /\bAIza[A-Za-z0-9_-]{35}/g, // Google API key (fixed length: same anchor trap as AKIA)
  // JWT: three base64url segments. The `eyJ` prefix (a `{"` header) makes this
  // specific enough not to swallow ordinary dotted identifiers.
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
  // `Authorization:` carrying a raw token with no `Bearer` scheme.
  /\bAuthorization\s*:\s*(?!Bearer\b)[A-Za-z0-9._~+/-]{16,}=*/gi,
  // A whole PEM private key block. Multi-line, so nothing keyed on a single
  // token run sees it - and a stack trace or a config dump in the log bundle can
  // carry one end to end. Unterminated blocks match to end-of-input on purpose.
  /-----BEGIN (?:[A-Z0-9]+ )?PRIVATE KEY-----[\s\S]*?(?:-----END (?:[A-Z0-9]+ )?PRIVATE KEY-----|$)/gi,
  // A Slack incoming-webhook URL is itself the credential.
  /\bhttps:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+/gi,
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

/**
 * `scheme://user:PASSWORD@host` - the password segment of a URL or DSN. No
 * prefix rule and no label rule sees this: the password carries no recognizable
 * shape and the delimiter before it is `:`, not a secret NAME. Connection
 * strings land in this app's logs, so the feedback bundle (#996) would carry
 * them out verbatim. Scheme, user and host are preserved; only the secret is
 * masked, which keeps the diagnostic useful.
 *
 * Borrowed from the diagnostics scrubber in
 * `@process/resources/builtinMcp/conciergeDiagServer`, which had it and this
 * module did not.
 */
const URL_USERINFO_PASSWORD = /(\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/]+:)([^\s@/]+)(@)/gi;

export function redactSecrets(text: string): string {
  if (!text) return text;
  let out = text;
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, '[redacted]');
  }
  // Label preserved, value masked, so the diagnostic still reads sensibly.
  out = out.replace(
    LABELLED_SECRET_ASSIGNMENT,
    (_match, label: string, separator: string) => `${label}${separator}[redacted]`
  );
  // Scheme/user/host preserved, password masked.
  return out.replace(
    URL_USERINFO_PASSWORD,
    (_match, prefix: string, _secret: string, at: string) => `${prefix}[redacted]${at}`
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
