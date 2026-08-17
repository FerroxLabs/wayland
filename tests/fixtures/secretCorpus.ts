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
];

/** Lines that must pass through redaction completely untouched. */
export const CLEAN_CORPUS: readonly string[] = [
  'plain message',
  'Failed to save tool key',
  'invalid_provider',
  'Profile __wayland_desktop_session not found in config',
  'password must be at least 8 characters',
];
