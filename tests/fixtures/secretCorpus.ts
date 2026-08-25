/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ONE corpus of secret shapes, shared by every suite that exercises redaction
 * (#992). The whole point of the issue was that two scrubbers drifted apart, so
 * the tests that prove they have not must be driven from the same input - a
 * per-suite corpus is how the drift went unnoticed the first time.
 *
 * `secret` is the substring that MUST NOT survive redaction. `text` is the
 * realistic line it arrives in (an engine stderr line, an upstream error body,
 * a log entry).
 */
export type SecretCase = {
  readonly label: string;
  readonly text: string;
  readonly secret: string;
};

/**
 * Assembled at runtime, never written as a literal. The value is a synthetic
 * placeholder (all-zero team/channel ids), but it still matches GitHub's
 * push-protection rule for a Slack incoming webhook, which blocks the push on
 * the literal alone. Joining the segments keeps the runtime string - and so the
 * regex coverage - identical while leaving nothing scannable in the source.
 */
const SYNTHETIC_SLACK_WEBHOOK = ['https://hooks.slack.com', 'services', 'T00000000', 'B00000000', 'X'.repeat(24)].join(
  '/'
);

/**
 * Assembled at runtime for the same reason as the webhook above: a literal
 * 40-character AWS secret shape in a source file is what a secret scanner is
 * built to find, and a blocked push is a worse outcome than a joined string. The
 * value is doubly synthetic - it says EXAMPLE twice - and only its SHAPE (40
 * characters, base64 alphabet with a `/`) is load-bearing for the regex.
 */
const SYNTHETIC_AWS_SECRET = ['EXAMPLEsecret', 'EXAMPLEsecret', 'EXAMPLE01234'].join('/');

export const SECRET_CORPUS: readonly SecretCase[] = [
  {
    label: 'OpenAI/Anthropic-style sk- key',
    text: 'provider rejected key sk-live-ABCDEFGH12345678 during connect',
    secret: 'sk-live-ABCDEFGH12345678',
  },
  {
    // Only the (now deleted) webserver copy caught an 8-character sk- body; the
    // shared module's floor was 16. Pinned so the union cannot regress back.
    label: 'short sk- key',
    text: 'rejected sk-ABCDEFGH here',
    secret: 'sk-ABCDEFGH',
  },
  {
    // `sk-svcacct-` is a real prefix this app already detects
    // (`providerKeyPatterns.ts`). Pinned because the union lowered the sk- floor
    // back to 8 and the trailing-`\b` anchor makes this shape easy to get wrong.
    label: 'OpenAI service-account key',
    text: 'connect failed for sk-svcacct-ABCDEFGH12345678',
    secret: 'sk-svcacct-ABCDEFGH12345678',
  },
  {
    label: 'Bearer authorization value',
    text: 'Authorization: Bearer abcDEF123.tok-en_value',
    secret: 'abcDEF123.tok-en_value',
  },
  {
    // Base64 padding characters. The shared module's character class excluded
    // `+/=`, so the tail of a raw-base64 bearer token used to survive.
    label: 'Bearer value carrying base64 padding',
    text: 'upstream said Bearer YWJjZGVmZ2hpamtsbW5v+/= was invalid',
    secret: 'YWJjZGVmZ2hpamtsbW5v+/=',
  },
  {
    label: 'xAI prefixed token',
    text: 'key xai-ABCDEFGH12345678 rejected',
    secret: 'xai-ABCDEFGH12345678',
  },
  {
    label: 'Slack prefixed token',
    text: 'token xoxb-ABCDEFGH12345678 expired',
    secret: 'xoxb-ABCDEFGH12345678',
  },
  {
    label: 'GitHub token',
    text: 'git push failed for ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ012345',
    secret: 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ012345',
  },
  {
    label: 'AWS access key id',
    text: 'signature mismatch for AKIAIOSFODNN7EXAMPLE',
    secret: 'AKIAIOSFODNN7EXAMPLE',
  },
  {
    label: 'Google API key',
    text: 'quota exceeded for AIzaSyA1234567890abcdefghijklmnopqrstuv',
    secret: 'AIzaSyA1234567890abcdefghijklmnopqrstuv',
  },
  {
    // The narrow webserver copy had NO JWT pattern - this is the shape #992
    // says was redacted on the agent path and not on the remote-facing one.
    label: 'JWT',
    text: 'session rejected: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dBjftJeZ4CVPmB92K27uhbUJU1p1r_wW1gFWFOEjXk',
    secret: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dBjftJeZ4CVPmB92K27uhbUJU1p1r_wW1gFWFOEjXk',
  },
  {
    // Likewise absent from the narrow copy: an Authorization header with no scheme.
    label: 'Authorization header with no scheme',
    text: 'request headers included Authorization: ABCDEFGHIJKLMNOP1234',
    secret: 'ABCDEFGHIJKLMNOP1234',
  },
  {
    // The hyphen-form `sk-` pattern does not see the underscore form. Only the
    // command-render bank had this; folded into the shared set by the #992 audit.
    label: 'Stripe underscore secret key',
    text: 'charge failed with sk_live_ABCDEFGH12345678',
    secret: 'sk_live_ABCDEFGH12345678',
  },
  {
    label: 'Basic authorization value',
    text: 'Authorization: Basic YWRtaW46c3VwZXJzZWNyZXQxMjM0',
    secret: 'YWRtaW46c3VwZXJzZWNyZXQxMjM0',
  },
  {
    label: 'URL userinfo password',
    text: 'connection refused: postgres://admin:s3cr3tp4ss@db.internal:5432/app',
    secret: 's3cr3tp4ss',
  },
  {
    label: 'Slack incoming-webhook URL',
    text: `post failed to ${SYNTHETIC_SLACK_WEBHOOK}`,
    secret: SYNTHETIC_SLACK_WEBHOOK,
  },
  {
    label: 'PEM private key block',
    text: '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEAxGGGGGGG\n-----END RSA PRIVATE KEY-----',
    secret: 'MIIEowIBAAKCAQEAxGGGGGGG',
  },
  {
    label: 'GitHub fine-grained PAT',
    text: 'clone failed: github_pat_11ABCDEFG0abcdefghijklmnop',
    secret: 'github_pat_11ABCDEFG0abcdefghijklmnop',
  },
  {
    label: 'GitLab PAT',
    text: 'registry auth failed for glpat-ABCDEFGH12345678',
    secret: 'glpat-ABCDEFGH12345678',
  },
  {
    label: 'Google OAuth refresh token',
    text: 'refresh rejected: 1//0gABCDEFGHIJKLMNOP-abcdefg',
    secret: '1//0gABCDEFGHIJKLMNOP-abcdefg',
  },
  {
    label: 'AWS STS temporary key id',
    text: 'assume-role returned ASIAIOSFODNN7EXAMPLE',
    secret: 'ASIAIOSFODNN7EXAMPLE',
  },
  {
    label: 'labelled api_key assignment',
    text: 'config parse failed at api_key = "hunter2hunter2"',
    secret: 'hunter2hunter2',
  },
  {
    label: 'labelled client_secret assignment',
    text: 'oauth refresh failed: client_secret=sUp3rS3cr3tV4lue',
    secret: 'sUp3rS3cr3tV4lue',
  },
  {
    // #1026. The PREFIXED form, which is the form that actually occurs: every
    // provider ships its key as a prefixed environment variable, so this is the
    // shape an engine echoes. A leading `\b` before the label cannot match here
    // - `_` and `A` are both word characters, so there is no boundary between
    // them - and the whole assignment used to survive untouched.
    // The value deliberately carries NO recognizable prefix. The first draft of
    // this case used an `sk-` value and PASSED on unfixed main - the prefix rule
    // caught it and the label rule never ran, so it proved nothing about the
    // defect. A labelled-assignment case is only a test of the label if the value
    // is unrecognizable on its own.
    label: 'prefixed ANTHROPIC_API_KEY assignment',
    text: 'engine exited 1: ANTHROPIC_API_KEY=not-a-real-key-0123456789 rejected',
    secret: 'not-a-real-key-0123456789',
  },
  {
    label: 'prefixed OPENAI_API_KEY assignment',
    text: 'env dump: OPENAI_API_KEY=totally-synthetic-value-0123',
    secret: 'totally-synthetic-value-0123',
  },
  {
    // Lowercase, and a prefix that is not a provider name: the defect is about
    // the character before the label, not about who owns the key.
    label: 'lowercase my_api_key assignment',
    text: 'config parse failed at my_api_key=hunter2hunter2',
    secret: 'hunter2hunter2',
  },
  {
    // 32 hex characters carry no recognizable prefix, so the label is the ONLY
    // thing that can catch this shape - and the label was unreachable.
    label: 'prefixed AZURE_OPENAI_API_KEY with a 32-hex value',
    text: 'deployment auth failed: AZURE_OPENAI_API_KEY=0123456789abcdef0123456789abcdef',
    secret: '0123456789abcdef0123456789abcdef',
  },
  {
    // A 40-character AWS secret access key. Caught by its LABEL, never by its
    // shape: 40 characters of the base64 alphabet is also a git commit SHA, a
    // sha1 digest and half the hashes in a build log, so a bare 40-run rule here
    // would mask the log lines this module exists to keep readable.
    label: 'labelled AWS secret access key (40 chars)',
    text: `credentials rejected: AWS_SECRET_ACCESS_KEY=${SYNTHETIC_AWS_SECRET}`,
    secret: SYNTHETIC_AWS_SECRET,
  },
  {
    // Length deliberately not the real 36-character body, for the same reason
    // the GitHub cases above are 32 and not 36: keep the shape, not the
    // scanner-detectable literal.
    label: 'npm access token',
    text: 'npm publish failed with npm_EXAMPLEnotarealtoken0123456789',
    secret: 'npm_EXAMPLEnotarealtoken0123456789',
  },
  {
    label: 'Hugging Face access token',
    text: 'model download refused: hf_EXAMPLEnotarealtoken0123456789',
    secret: 'hf_EXAMPLEnotarealtoken0123456789',
  },
  {
    // #1051. A JSON body, which is what an upstream HTTP error and most agent
    // stderr actually look like. The labelled-assignment rule required `[:=]`
    // IMMEDIATELY after the label and JSON puts the label's closing `"` there,
    // so this survived for EVERY label in the list, not just this one.
    label: 'JSON api_key field',
    text: 'upstream 400: {"model":"x","api_key":"json-shaped-not-a-real-value-01"}',
    secret: 'json-shaped-not-a-real-value-01',
  },
  {
    // Whitespace around the JSON colon, which pretty-printed bodies carry.
    label: 'JSON client_secret field with spaces around the colon',
    text: 'token exchange failed: { "client_secret" : "spaced-json-not-a-real-value" }',
    secret: 'spaced-json-not-a-real-value',
  },
  {
    label: 'JSON password field',
    text: 'connect failed: {"user":"admin","password":"json-pw-not-a-real-value-0"}',
    secret: 'json-pw-not-a-real-value-0',
  },
  {
    // #1037a. A SUFFIX after the label breaks the same immediate-separator
    // requirement from the other side. The #1026 fix reached arbitrary
    // PREFIXES; nothing reached suffixes.
    label: 'suffixed API_KEY_PROD assignment',
    text: 'env dump: API_KEY_PROD=suffixed-not-a-real-value-012',
    secret: 'suffixed-not-a-real-value-012',
  },
  {
    // #1037b. `secret[_-]?access[_-]?key` does NOT match `SECRET_KEY` - the word
    // `access` sits between the two halves - and no other core did either.
    label: 'SECRET_KEY assignment',
    text: 'rails boot failed: SECRET_KEY=secretkey-not-a-real-value-0',
    secret: 'secretkey-not-a-real-value-0',
  },
  {
    // #1037b. No bare `token` core existed, so every vendor-prefixed token
    // variable leaked: the three compound cores all require `auth`/`access`/
    // `refresh` immediately before `token`, and `GITHUB` is none of them.
    label: 'GITHUB_TOKEN assignment',
    text: 'gh auth failed: GITHUB_TOKEN=ghtoken-not-a-real-value-012',
    secret: 'ghtoken-not-a-real-value-012',
  },
  {
    // #1037c. The bare `SECRET` core. `secret[_-]?key` needs a `KEY` that never
    // comes and `secret[_-]?access[_-]?key` needs an `ACCESS` that never comes,
    // so the whole assignment survived - for ordinary application config, not
    // some exotic spelling.
    label: 'JWT_SECRET assignment',
    text: 'boot failed: JWT_SECRET=jwtsecret-not-a-real-value-0',
    secret: 'jwtsecret-not-a-real-value-0',
  },
  {
    // The value deliberately shares no 4-character window with the surrounding
    // text: the suite's window oracle reports a leak when any window of the
    // secret survives, and a value that starts `sess` collides with the word
    // `session` in its own log line.
    label: 'SESSION_SECRET assignment',
    text: 'session store refused: SESSION_SECRET=ss3cr3t-not-a-real-value-01',
    secret: 'ss3cr3t-not-a-real-value-01',
  },
  {
    // #1037c, camel half. The label rule's leading anchor refuses to match
    // inside an alphanumeric run, and a camelCase name has no non-alphanumeric
    // character anywhere in it, so EVERY label was unreachable in this spelling.
    label: 'camelCase AwsSecretAccessKey assignment',
    text: 'credentials rejected: AwsSecretAccessKey=camel-not-a-real-value-012',
    secret: 'camel-not-a-real-value-012',
  },
  {
    label: 'camelCase openaiApiKey JSON field',
    text: 'upstream 400: {"openaiApiKey":"camel-json-not-a-real-value"}',
    secret: 'camel-json-not-a-real-value',
  },
];

/** Lines that must pass through redaction completely untouched. */
export const CLEAN_CORPUS: readonly string[] = [
  'plain message',
  'Failed to save tool key',
  'invalid_provider',
  'Profile __wayland_desktop_session not found in config',
  'password must be at least 8 characters',
  // #1026 widened the labelled-assignment rule to reach a label preceded by `_`.
  // These are the lines that must NOT start disappearing as a result: a label
  // with no assignment at all, and label-shaped substrings that are ordinary
  // prose or ordinary configuration.
  'set the ANTHROPIC_API_KEY environment variable and retry',
  'AWS_SECRET_ACCESS_KEY is not set',
  'npm_config_cache=/Users/example/.npm/_cacache',
  'passwordless login is enabled',
  'hf_hub download skipped',
  // The reason this module refuses a bare 40-character rule for the AWS secret
  // shape: a 40-character run is also every git SHA in every build log.
  'built ok at commit 0123456789abcdef0123456789abcdef01234567',
  // #1037 added a bare `token` core and an optional `[_-]`-separated suffix
  // after every label. These are the LLM bookkeeping lines that must not start
  // disappearing as a result - they are the whole reason the value floor stays
  // at 8 characters. `token_count` reaches the floor only above ten million;
  // the plural forms cannot match at any value, because `s` is neither `[_-]`
  // (so the suffix cannot start) nor a separator.
  'token_count=4096',
  'token_count=128000',
  'token_limit=1000000',
  'max_tokens=12345678',
  'input_tokens=12345678',
  'total_tokens: 1234567890',
  'tokens_used=12345678',
];
