/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1037, second pass: the spellings that STILL leaked after the label rule grew
 * a lookbehind (#1026), a `[_-]`-separated suffix and a bare `token` core.
 *
 * Two families, with two different causes:
 *
 *  1. A secret named with a bare `SECRET` core - `JWT_SECRET=`, `SESSION_SECRET=`,
 *     `COOKIE_SECRET=`, `SIGNING_SECRET=`. `secret[_-]?key` does not reach them
 *     (`KEY` never follows) and `secret[_-]?access[_-]?key` does not either. The
 *     module CARRIED these as a documented deliberate gap; the doc comment is
 *     rewritten in the same commit as this test, because a stale comment saying
 *     a closed gap is open is how two previous fixes shipped wrong.
 *
 *  2. A label glued to a lowercase CAMEL prefix - `AwsSecretAccessKey=`,
 *     `openaiApiKey=`. The snake rule's `(?<![A-Za-z0-9])` anchor refuses to match
 *     inside an alphanumeric run and the camel seam IS inside one, and that rule
 *     cannot be taught the seam because it carries `i` (which case-folds
 *     `[a-z]`/`[A-Z]` into each other and degrades the anchor to nothing).
 *
 * ENUMERATED, not spot-checked. Every case below is a matrix over a name list
 * and a spelling list, and every assertion block carries a known-positive
 * control in it: a redaction test proves what it asserts and nothing about what
 * it omits, and this suite has already been green over a live leak twice.
 */
import { describe, expect, it } from 'vitest';
import { LABELLED_SECRET_LABELS, redactSecrets } from '@process/utils/secretRedaction';

/**
 * Deliberately carries NO recognizable prefix and no vendor shape. A labelled
 * assignment is only a test of the LABEL if the value cannot be caught on its
 * own - the first draft of #1026's fixture used an `sk-` value, passed on
 * unfixed main, and proved nothing.
 */
const VALUE = 'not-a-real-value-0123456789';

/** The control every block below repeats: a label that has always worked. */
const KNOWN_POSITIVE = `api_key=${VALUE}`;

function assertMasked(text: string, why: string): void {
  const out = redactSecrets(text);
  expect(out, `${why}: ${JSON.stringify(text)} -> ${JSON.stringify(out)}`).not.toContain(VALUE);
  expect(out, why).toContain('[redacted]');
  // In the SAME assertion block: the harness can see a value it is supposed to
  // see, and the value alone is invisible - so a pass above is the label doing
  // the work, not the value shape or a broken oracle.
  expect(redactSecrets(KNOWN_POSITIVE), `${why} (known positive)`).not.toContain(VALUE);
  expect(redactSecrets(`engine said ${VALUE} was rejected`), `${why} (value alone is unrecognizable)`).toContain(VALUE);
}

/**
 * The four named in #1037 plus the two the module's own comment listed as
 * still-open. All six are ordinary application config, not exotic spellings.
 */
const BARE_SECRET_NAMES = [
  'JWT_SECRET',
  'SESSION_SECRET',
  'COOKIE_SECRET',
  'SIGNING_SECRET',
  'APP_SECRET',
  'WEBHOOK_SECRET',
] as const;

/**
 * The shapes an engine, an upstream error body and a config dump actually
 * produce. `=`, spaced `=`, JSON and a bare `:` are four different paths through
 * the rule (the optional quote before the separator, the whitespace, the value
 * quotes), so a name that masks in one can leak in another.
 */
const SPELLINGS: ReadonlyArray<readonly [string, (name: string) => string]> = [
  ['UPPER_SNAKE=', (name) => `env dump: ${name}=${VALUE}`],
  ['spaced =', (name) => `config parse failed at ${name} = "${VALUE}"`],
  ['lowercase :', (name) => `boot failed: ${name.toLowerCase()}: ${VALUE}`],
  ['JSON field', (name) => `upstream 400: {"${name.toLowerCase()}":"${VALUE}"}`],
];

describe('#1037 a bare SECRET core is a label, in every spelling', () => {
  const cases = BARE_SECRET_NAMES.flatMap((name) =>
    SPELLINGS.map(([spelling, render]) => [`${name} as ${spelling}`, render(name)] as const)
  );

  it.each(cases)('masks %s', (why, text) => {
    assertMasked(text, why);
  });

  it(`the matrix is the product of both lists, not a subset (${cases.length} cases)`, () => {
    expect(cases).toHaveLength(BARE_SECRET_NAMES.length * SPELLINGS.length);
  });
});

/**
 * The camel seam. Enumerated over the camel spelling of every label core rather
 * than the one name #1037 measured, because a per-name fix is whack-a-mole and
 * because the seam is a property of the ANCHOR, not of any one label.
 */
const CAMEL_LABELS = [
  'SecretAccessKey',
  'SecretKey',
  'ClientSecret',
  'AccessToken',
  'RefreshToken',
  'AuthToken',
  'ApiKey',
  'Passphrase',
  'PassPhrase',
  'Password',
  'Passwd',
  'Secret',
  'Token',
] as const;

/** The lowercase run the label is glued to - letters and a digit both count. */
const CAMEL_PREFIXES = ['aws', 'my', 'openai', 'azure', 'v2'] as const;

describe('#1037 a label glued to a lowercase camel prefix is still a label', () => {
  const cases = CAMEL_PREFIXES.flatMap((prefix) =>
    CAMEL_LABELS.map((label) => [`${prefix}${label}=`, `env dump: ${prefix}${label}=${VALUE}`] as const)
  );

  it.each(cases)('masks %s', (why, text) => {
    assertMasked(text, why);
  });

  it('masks the exact spelling #1037 measured leaking, in a JSON body too', () => {
    assertMasked(`credentials rejected: AwsSecretAccessKey=${VALUE}`, 'AwsSecretAccessKey=');
    assertMasked(`upstream 400: {"awsSecretAccessKey":"${VALUE}"}`, 'JSON awsSecretAccessKey');
  });
});

/**
 * The other half of every widening: what must NOT start disappearing. A scrubber
 * that eats the diagnostic gets turned off, so these are as load-bearing as the
 * masking cases above.
 */
describe('#1037 the widened label set does not eat ordinary diagnostics', () => {
  const UNTOUCHED = [
    // The bypass the leading anchor exists to refuse: a label INSIDE a longer
    // alphanumeric run is not a label.
    'notmyapikey=abcdefghijkl',
    // The camel rule must not fire without the lower->upper seam either.
    'notmysecret=abcdefghijkl',
    // `secretRef=` was named in the module's own comment as the cost of a bare
    // `secret` core. It is not: the suffix cannot start on `R` and the separator
    // cannot match a letter, so the label ends at `secret` and nothing matches.
    'secretRef=my-vault-entry-name',
    'secretName=my-vault-entry-name',
    // LLM bookkeeping. The plural `s` is neither a separator nor the start of a
    // camel suffix, so these cannot match at any value.
    'maxTokens=12345678',
    'inputTokens: 12345678',
    'total_tokens: 1234567890',
    // A label with no assignment at all.
    'AWS_SECRET_ACCESS_KEY is not set',
    'set the JWT_SECRET environment variable and retry',
    'passwordless login is enabled',
    // A 40-character run is also every git SHA in every build log.
    'built ok at commit 0123456789abcdef0123456789abcdef01234567',
  ] as const;

  it.each(UNTOUCHED)('leaves %j byte-identical', (line) => {
    expect(redactSecrets(line)).toBe(line);
    // Known positive in the same block: the scrubber is not simply inert here.
    expect(redactSecrets(KNOWN_POSITIVE)).not.toContain(VALUE);
  });
});

/**
 * The enumeration that makes this file survive its own authors: every label in
 * the exported array is held to all four spellings, prefixed and suffixed. A
 * core added later is automatically covered, which is the property #1026's fix
 * added to this module and the reason the array is exported at all.
 */
describe('every exported label core masks in every spelling', () => {
  /** `api[_-]?key` -> `api_key`, the concrete spelling of a regex fragment. */
  const spell = (core: string): string => core.replaceAll('[_-]?', '_');

  it('the speller produces a real label (control against a vacuous sweep)', () => {
    expect(spell('secret[_-]?access[_-]?key')).toBe('secret_access_key');
    expect(spell('token')).toBe('token');
  });

  const cases = LABELLED_SECRET_LABELS.flatMap((core) => {
    const name = spell(core);
    return [
      [`${name} bare`, `env dump: ${name}=${VALUE}`],
      [`${name} prefixed`, `env dump: MYAPP_${name.toUpperCase()}=${VALUE}`],
      [`${name} suffixed`, `env dump: ${name.toUpperCase()}_PROD=${VALUE}`],
      [`${name} JSON`, `upstream 400: {"${name}":"${VALUE}"}`],
    ] as const;
  });

  it.each(cases)('masks %s', (why, text) => {
    assertMasked(text, why);
  });
});
