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
