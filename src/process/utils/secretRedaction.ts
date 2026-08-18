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
  // npm automation/publish token and Hugging Face user access token. Both carry
  // an underscore INSIDE the prefix, and the `{20,}` floor over a class that
  // omits `_` is what keeps them off ordinary npm env vars: `npm_config_cache`
  // and `npm_lifecycle_script` have no 20-character unbroken alphanumeric run,
  // so they cannot reach the floor. No trailing `\b`, per the rule above.
  /\bnpm_[A-Za-z0-9]{20,}/g, // npm access token
  /\bhf_[A-Za-z0-9]{20,}/g, // Hugging Face access token
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
 *
 * The labels are a list rather than an inline alternation, and exported, so the
 * suite can ENUMERATE them instead of spot-checking a few. #1026 survived
 * because the tests covered the bare form of two labels; a new label added here
 * is now automatically held to the prefixed form too.
 */
export const LABELLED_SECRET_LABELS: readonly string[] = [
  'api[_-]?key',
  'auth[_-]?token',
  'access[_-]?token',
  'refresh[_-]?token',
  // A BARE `token` core (#1037). `GITHUB_TOKEN`, `SLACK_TOKEN`, `NPM_TOKEN`,
  // `HF_TOKEN` and a plain `token=` all leaked: the three compound cores above
  // require the words `auth`/`access`/`refresh` immediately before `token`, and
  // a provider name is not one of them. The lookbehind already permits an
  // arbitrary `_`-separated prefix, so one core covers every vendor.
  //
  // The compound cores stay: they catch the UNSEPARATED spellings
  // (`authtoken=`, `accesstoken=`) that the lookbehind refuses to reach through,
  // and matching starts at the leftmost position so `AUTH_TOKEN` still reports
  // its whole label in the diagnostic rather than just `TOKEN`.
  'token',
  // `AWS_SECRET_ACCESS_KEY` (#1026). Its 40-character value has no prefix and no
  // shape worth keying on - 40 characters of the base64 alphabet is also every
  // git SHA and every sha1 digest in a build log - so the label is the ONLY
  // high-confidence signal, and until #1026 the label could not be reached.
  // Listed before `access[_-]?token` would matter only for a shared prefix; it
  // does not share one, and alternation backtracks through every branch anyway.
  'secret[_-]?access[_-]?key',
  // `SECRET_KEY` / `SECRET_KEY_BASE` (#1037). `secret[_-]?access[_-]?key` does
  // NOT match it - `access` sits between the two words - and no other label
  // core does either, so the whole assignment survived. Kept as its own core
  // rather than widening to a bare `secret`, which would also swallow
  // `secret_name=`/`secretRef=` in a Kubernetes or Vault diagnostic. That
  // narrowness is a KNOWN gap, not an oversight: `JWT_SECRET=`,
  // `APP_SECRET=` and `WEBHOOK_SECRET=` are still unmasked. See the trade
  // note on LABELLED_SECRET_ASSIGNMENT.
  'secret[_-]?key',
  'client[_-]?secret',
  'password',
  'passwd',
  // #1042 routed this here rather than editing its own branch, because that PR
  // newly puts a backup passphrase on the IPC payload and this array is the only
  // backstop for it. `password` and `passwd` already matched; `passphrase` did
  // not, so `passphrase=`, `pass_phrase:` and a JSON `"passphrase"` all survived
  // verbatim. Verified by execution with `password=` as the known positive.
  'pass[_-]?phrase',
];

/**
 * #1026: the leading anchor is a NEGATIVE LOOKBEHIND, not `\b`.
 *
 * `\b` here was unreachable for the common case and that was a live leak. There
 * is no word boundary between `_` and a letter because both are word characters,
 * so `ANTHROPIC_API_KEY=...`, `AZURE_OPENAI_API_KEY=...` and `my_api_key=...` all
 * failed to match while the bare `API_KEY=...` matched. Environment variables are
 * conventionally PREFIXED, so the shape that escaped was the shape that actually
 * appears in agent stderr and error text.
 *
 * This is the mirror image of the four escapes fixed in #1004: there a TRAILING
 * boundary could not match because the character class omitted a word character;
 * here a LEADING boundary could not match because the preceding character was a
 * word character.
 *
 * Not a novel construct here: `@common/utils/redactCommandSecrets` already used
 * `(?<![A-Za-z0-9])` for this exact reason, with a comment saying so. The sibling
 * bank had the rule right and the canonical one did not.
 *
 * `(?<![A-Za-z0-9])` still refuses to match inside a longer alphanumeric run, so
 * `notmyapikey=` is not a label, while permitting the `_`, `-` and `.` that
 * actually separate a prefix from a label. It is a strict WIDENING: every
 * position where `\b` succeeded had a non-word character before it, and a
 * non-word character is also a non-alphanumeric one, so nothing that was masked
 * before can stop being masked. Single-character, fixed-width and outside the
 * quantified section, so it adds no backtracking.
 *
 * ---------------------------------------------------------------------------
 * #1051 and #1037: the three things after the label, and the FALSE POSITIVES
 * each one buys. Read this before tightening or widening any of them.
 * ---------------------------------------------------------------------------
 *
 * 1. `["']?` BEFORE the separator (#1051). The separator used to have to sit
 *    IMMEDIATELY after the label, and in JSON it does not - a closing `"` sits
 *    there instead. So `{"api_key":"<v>"}`, `{"password":"<v>"}`,
 *    `{"passphrase":"<v>"}` and `{ "client_secret" : "<v>" }` all reached the
 *    output verbatim, for EVERY label in the list. Fixed once here rather than
 *    per label. JSON is not an exotic shape on this surface: agent stderr,
 *    upstream HTTP error bodies and the feedback log bundle are full of it.
 *    Costs no false positives worth the name - a quote plus `:`/`=` after a
 *    secret label is an assignment in every syntax that produces it.
 *
 * 2. The suffix `(?:[_-][A-Za-z0-9]+)*` (#1037a). A SUFFIX broke the same
 *    immediate-separator requirement from the other side: `API_KEY_PROD=`,
 *    `API_KEY_STAGING=`, `SECRET_KEY_BASE=`. The lookbehind already handled
 *    arbitrary PREFIXES; this is its mirror image.
 *
 *    This one DOES buy false positives, and they are accepted deliberately.
 *    What newly masks and is not a secret:
 *      - `token_count=<8+ chars>`, `token_limit=`, `token_usage=` - LLM
 *        bookkeeping, and this is an LLM app, so the shape is common. Mitigated
 *        by the 8-character value floor, which real counts rarely reach: 4096,
 *        128000 and 1000000 all stay readable, and only a count above
 *        10,000,000 is masked. `input_tokens=`, `total_tokens=` and
 *        `max_tokens=` are untouched at any value, because the plural `s` is
 *        not `[_-]` so the suffix cannot start there and the separator cannot
 *        match a letter.
 *      - `api_key_length=`, `api_key_id=`, `secret_key_id=`,
 *        `secret_key_ref=`, `access_token_expires_in=` - metadata ABOUT a
 *        credential rather than the credential.
 *    The trade taken: mask them. An over-masked field name in a diagnostic
 *    costs one round trip of "what was that number"; an under-masked
 *    `API_KEY_PROD=` hands a live credential to whatever the user pastes the
 *    Copy-report output into. The floor keeps the common LLM counters readable,
 *    which is what makes the trade cheap rather than merely correct.
 *
 * 3. The value's quotes are CAPTURED AND RE-EMITTED, not swallowed. Both
 *    optional quotes used to be consumed and dropped, so the #1051 fix would
 *    have turned `{"api_key":"<v>"}` into `{"api_key":[redacted]}` - no longer
 *    parseable, on a surface whose whole job is to hand a machine-readable
 *    diagnostic to a human who will paste it somewhere. Re-emitting exactly the
 *    characters that were consumed yields `{"api_key":"[redacted]"}`, which
 *    still parses. A quote is a delimiter, never credential material, so
 *    putting it back cannot put any secret back.
 *
 * The suffix is `(?:[_-][A-Za-z0-9]+)*` and not `(?:[A-Za-z0-9_-]*)`: the two
 * classes are DISJOINT, so each iteration must consume exactly one `[_-]`, the
 * partition of any input is unique, and there is no ambiguity for the engine to
 * backtrack through. A `(?:[A-Za-z0-9_-]+)*` spelling would be the classic
 * nested-quantifier blowup.
 *
 * KNOWN GAPS, reported rather than closed here, because widening the value
 * matcher is a different decision with a different blast radius:
 *   - XML `<api_key>v</api_key>` - the separator is `>`, not `[:=]`.
 *   - a JSON value containing a space or a `}` - excluded from the value class,
 *     so the run falls under the 8-character floor.
 *   - `JWT_SECRET=` / `APP_SECRET=` / `WEBHOOK_SECRET=` - no bare `secret` core.
 *   - a URL query `?api_key=<v>&x=1` IS masked, but `&` is not excluded from the
 *     value class so `&x=1` is swallowed into the marker. Over-mask, not a leak.
 */
const LABELLED_SECRET_ASSIGNMENT = new RegExp(
  `(?<![A-Za-z0-9])((?:${LABELLED_SECRET_LABELS.join('|')})(?:[_-][A-Za-z0-9]+)*)` +
    `(["']?\\s*[:=]\\s*)(["']?)[^\\s"',}]{8,}(["']?)`,
  'gi'
);

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

/**
 * Mask every {@link SECRET_PATTERNS} match as ONE pass over the ORIGINAL text.
 *
 * It used to be a sequential `replace` per pattern, and that made the result
 * order-dependent in a way that leaked. A narrow rule firing first injects the
 * `[` and `]` of the marker, those characters are outside the wider rules'
 * character classes, so the wider match aborts and the REST of the credential
 * survives. Reproduced on a webhook URL whose middle path segment is an npm
 * token: the narrow `npm_` rule masked the segment, the Slack-webhook rule then
 * could not match the mangled URL, and the third path segment - which is part of
 * the credential - reached the output. Same for a JWT whose payload segment
 * carries a vendor prefix.
 *
 * This is a whole CLASS, not one bug: ten pattern pairs on `main` had it
 * (`ghp_`/`gho_`/`ghu_`/`ghs_`/`ghr_`, `github_pat_`, `glpat-`, `gsk_`, `r8_`,
 * `dop_v1_` all sit before the JWT, `Authorization:` and webhook rules), and
 * reordering the array only moves which pairs are affected. Collecting spans
 * against the pristine text and merging them removes the ordering question for
 * {@link SECRET_PATTERNS}, so a pattern added to THAT array later cannot re-open
 * it.
 *
 * It does not close the question for the two rules that run AFTER this function,
 * over its output. Those are still sequential, and still lose an anchor:
 * `1//<refresh-token>` immediately followed by `postgres://user:pw@host` still
 * leaks `pw`, because the greedy `1//` span swallows the `postgres` scheme that
 * {@link URL_USERINFO_PASSWORD} needs to anchor on. Sequential masking leaked it
 * too, so this is not a regression, but the ordering claim above stops at the
 * end of this function. #1037 owns the anchor rules.
 *
 * Measured on 506 container/token combinations carrying 682 sensitive segments:
 * sequential masking leaked 142 of them, this leaks 10, and all 10 are the
 * generator's own bookkeeping (a public JWT header, and `ya29.`/`1//` values that
 * cannot form a real webhook path) which sequential masking also left.
 *
 * On weakenings, stated exactly, because an earlier version of this comment
 * claimed zero and that was FALSE. Where two credentials are SEPARATED by
 * anything at all - space, comma, quote, ampersand, newline, pipe, semicolon -
 * there are zero: 447216 segment checks over every ordered triple of the pattern
 * set under seven separators found none, against both sequential masking and
 * `main`, and the 4200-case labelled-assignment corpus is likewise unchanged.
 *
 * Two credentials concatenated with NO separator between them are the exception,
 * and there sequential masking had coverage this loses. It had it by ACCIDENT:
 * injecting `[redacted]` put a non-word character into the text, and a later
 * `\b`-anchored rule then matched at a boundary that does not exist in the
 * pristine string. Only the two FIXED-LENGTH rules can stop mid-run and hand a
 * following rule that boundary (`AKIA`/`ASIA`, `AIza`); every other class is
 * greedy over `[A-Za-z0-9]` and eats the following letters instead. The rules
 * that lose out are the later `\b`-anchored ones: `AIza`, the JWT, the
 * `Authorization:` header and the Slack webhook. Nine ordered pairs and 295
 * ordered triples of the pattern set behave this way, against 1442 triples this
 * masks and sequential masking leaked, so even the no-separator shape is a large
 * net improvement. `AKIAIOSFODNN7EXAMPLE` immediately followed by a JWT is
 * pinned in the suite so the boundary is recorded rather than assumed, and two
 * distinct high-entropy credentials glued together with no delimiter is not a
 * shape subprocess stderr produces.
 *
 * Every pattern must carry `/g`. That was already required - a non-global
 * pattern under the old `replace` would have masked only the FIRST occurrence
 * per line - but `matchAll` turns the mistake into a loud throw rather than a
 * silent under-mask.
 */
function maskPatternMatches(text: string): string {
  const spans: Array<[number, number]> = [];
  for (const pattern of SECRET_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      if (match[0].length > 0) spans.push([match.index, match.index + match[0].length]);
    }
  }
  if (spans.length === 0) return text;
  spans.sort((left, right) => left[0] - right[0] || left[1] - right[1]);
  const merged: Array<[number, number]> = [];
  for (const span of spans) {
    const last = merged.at(-1);
    // `<=`, not `<`: an overlapping OR touching span is one credential, so
    // `Bearer npm_...` produces a single marker rather than two adjacent ones.
    if (last && span[0] <= last[1]) last[1] = Math.max(last[1], span[1]);
    else merged.push([span[0], span[1]]);
  }
  let built = '';
  let cursor = 0;
  for (const [start, end] of merged) {
    built += text.slice(cursor, start) + '[redacted]';
    cursor = end;
  }
  return built + text.slice(cursor);
}

export function redactSecrets(text: string): string {
  if (!text) return text;
  let out = maskPatternMatches(text);
  // Label preserved, value masked, so the diagnostic still reads sensibly.
  out = out.replace(
    LABELLED_SECRET_ASSIGNMENT,
    (_match, label: string, separator: string, openQuote: string, closeQuote: string) =>
      `${label}${separator}${openQuote}[redacted]${closeQuote}`
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
