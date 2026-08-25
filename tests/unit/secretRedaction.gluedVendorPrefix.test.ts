/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1048: a credential GLUED to preceding word characters was never redacted.
 *
 * Every vendor-prefix rule in `secretRedaction.ts` opened with `\b`, which
 * requires a word/non-word transition immediately before the prefix. There is no
 * such transition after a letter, a digit or an underscore, so
 * `TOKENsk-ant-api03-...`, `9AKIAIOSFODNN7EXAMPLE` and `_ghp_...` passed through
 * whole while the same token at a clean boundary masked correctly.
 *
 * Reachable, not theoretical: agent stderr is not delimiter-clean. A minified
 * JSON blob, a URL fragment, an env dump concatenated by a logger or a stack
 * frame abutting a token all put a word character immediately before the value,
 * and #1023 newly routes a stderr ring into the chat transcript.
 *
 * THE MATRIX IS THE TEST. A spot check of one family proves nothing here: the
 * anchor is a property of every rule in the array, so this enumerates every
 * family against every preceding character, and keeps the five SAFE delimiters
 * in the same run as controls. Without those controls a harness that redacts
 * nothing at all would look identical to a fix.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { redactSecrets } from '@process/utils/secretRedaction';

/**
 * One row per rule in `SECRET_PATTERNS`. `secret` is the substring that must not
 * survive - for the header shapes that is the VALUE, not the scheme word, since
 * masking `Bearer` while shipping the token would satisfy a `toContain` oracle
 * and leak the credential.
 *
 * Every value is synthetic and shaped, never a real token: only the SHAPE is
 * load-bearing, and a literal of the real shape is what a push-protection
 * scanner is built to block.
 */
const FAMILIES: ReadonlyArray<{ label: string; token: string; secret?: string }> = [
  { label: 'openai/anthropic sk- key', token: 'sk-ant-api03-AbCdEfGhIjKlMnOpQrStUvWxYz0123456789' },
  { label: 'stripe pk- key', token: 'pk-live-ABCDEFGH12345678' },
  { label: 'revocable rk- key', token: 'rk-ABCDEFGH12345678' },
  { label: 'Bearer value', token: 'Bearer abcDEF123.tok-en_value', secret: 'abcDEF123.tok-en_value' },
  { label: 'stripe underscore key', token: 'sk_live_ABCDEFGH12345678' },
  { label: 'Basic value', token: 'Basic YWRtaW46c3VwZXJzZWNyZXQxMjM0', secret: 'YWRtaW46c3VwZXJzZWNyZXQxMjM0' },
  { label: 'github token', token: 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ012345' },
  { label: 'github fine-grained PAT', token: 'github_pat_11ABCDEFG0abcdefghijklmnop' },
  { label: 'gitlab PAT', token: 'glpat-ABCDEFGH12345678' },
  { label: 'groq key', token: 'gsk_ABCDEFGHIJKLMNOPQRSTUVWX' },
  { label: 'npm token', token: 'npm_EXAMPLEnotarealtoken0123456789' },
  { label: 'hugging face token', token: 'hf_EXAMPLEnotarealtoken0123456789' },
  { label: 'replicate token', token: 'r8_ABCDEFGHIJKLMNOPQRSTUVWX' },
  { label: 'digitalocean token', token: 'dop_v1_ABCDEFGHIJKLMNOPQRSTUVWX' },
  { label: 'google oauth access token', token: 'ya29.ABCDEFGH12345678' },
  { label: 'google oauth refresh token', token: '1//0gABCDEFGHIJKLMNOP-abcdefg' },
  { label: 'slack token', token: 'xoxb-ABCDEFGH12345678' },
  { label: 'xai token', token: 'xai-ABCDEFGH12345678' },
  { label: 'aws access key id', token: 'AKIAIOSFODNN7EXAMPLE' },
  { label: 'aws sts temporary key id', token: 'ASIAIOSFODNN7EXAMPLE' },
  { label: 'google api key', token: 'AIzaSyA1234567890abcdefghijklmnopqrstuv' },
  {
    label: 'jwt',
    token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dBjftJeZ4CVPmB92K27uhbUJU1p1r_wW1gFWFOEjXk',
  },
  {
    label: 'authorization header with no scheme',
    token: 'Authorization: ABCDEFGHIJKLMNOP1234',
    secret: 'ABCDEFGHIJKLMNOP1234',
  },
  {
    label: 'slack incoming-webhook url',
    // Joined at runtime: the literal alone trips GitHub push protection.
    token: ['https://hooks.slack.com', 'services', 'T00000000', 'B00000000', 'X'.repeat(24)].join('/'),
  },
];

/** Delimiters that ALWAYS worked. Controls, run in the same block as the defect. */
const SAFE_PREFIXES: ReadonlyArray<readonly [string, string]> = [
  ['bare', ''],
  ['space', ' '],
  ['newline', '\n'],
  ['double quote', '"'],
  ['colon', ':'],
];

/** The three word characters. All three leaked, for all but one family. */
const GLUED_PREFIXES: ReadonlyArray<readonly [string, string]> = [
  ['letters', 'TOKEN'],
  ['digit', '9'],
  ['underscore', '_'],
];

const secretOf = (family: (typeof FAMILIES)[number]): string => family.secret ?? family.token;

describe('#1048 a credential glued to a word character is still a credential', () => {
  const cases = FAMILIES.flatMap((family) =>
    GLUED_PREFIXES.map(
      ([why, prefix]) => [`${family.label} preceded by ${why}`, `${prefix}${family.token}`, secretOf(family)] as const
    )
  );

  it.each(cases)('masks %s', (label, text, secret) => {
    const out = redactSecrets(text);
    expect(out, `${label}: ${JSON.stringify(text)} -> ${JSON.stringify(out)}`).not.toContain(secret);
  });

  it(`enumerates every family against every word character (${cases.length} cases)`, () => {
    expect(cases).toHaveLength(FAMILIES.length * GLUED_PREFIXES.length);
  });
});

describe('#1048 the safe delimiters keep working (the control half of the matrix)', () => {
  const cases = FAMILIES.flatMap((family) =>
    SAFE_PREFIXES.map(
      ([why, prefix]) => [`${family.label} preceded by ${why}`, `${prefix}${family.token}`, secretOf(family)] as const
    )
  );

  it.each(cases)('still masks %s', (label, text, secret) => {
    const out = redactSecrets(text);
    expect(out, `${label}: ${JSON.stringify(text)} -> ${JSON.stringify(out)}`).not.toContain(secret);
    expect(out, label).toContain('[redacted]');
  });

  it('the corpus is not vacuous: every secret is long enough to be seen', () => {
    for (const family of FAMILIES) {
      expect(secretOf(family).length, family.label).toBeGreaterThan(8);
      expect(family.token, family.label).toContain(secretOf(family));
    }
  });
});

/**
 * The other half. Dropping a leading anchor is a WIDENING, and the whole cost of
 * this change lands on the `sk|pk|rk-` family: two letters and a hyphen is also
 * the tail of ordinary hyphenated English. These lines are what the two-rule
 * split exists to protect, and they are what a single anchorless rule with the
 * 8-character floor destroys.
 */
describe('#1048 ordinary hyphenated English is not a credential', () => {
  const UNTOUCHED = [
    'network-interface-eth0 is down',
    'risk-assessment-2024-q3 completed',
    'disk-usage-report generated',
    'work-in-progress marker left behind',
    'park-and-retry scheduled',
    'desk-check passed',
    'mask-layer rendered',
    'fork-join pool exhausted',
    'mark-sweep gc ran',
    'failed loading /Users/someone/Library/Application Support/wayland-core/config.toml',
    // Words that CONTAIN a scheme keyword. `Bearer` and `Basic` lose their
    // anchors too, so these are the shapes that would newly disappear.
    'the request was unbearable, retrying',
    'forbearers of this protocol used a different framing',
    'ultraBasic rendering mode enabled',
  ] as const;

  it.each(UNTOUCHED)('leaves %j byte-identical', (line) => {
    expect(redactSecrets(line)).toBe(line);
    // Known positive in the same block: the scrubber is not inert here.
    expect(redactSecrets(`key ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ012345 rejected`)).toContain('[redacted]');
  });
});

/**
 * The structural guard. The matrix above pins the families that exist TODAY; a
 * rule added next year with a leading `\b` re-opens #1048 for its own family and
 * no behavioural test would notice, because nobody would think to add a row.
 *
 * So this reads the rule array as SOURCE and refuses a leading `\b` outright.
 * The one permitted leading anchor is the negative lookbehind on the
 * `sk|pk|rk-` clean-boundary rule, which exists because that family is the sole
 * source of the false positives above; its glued twin sits beside it.
 */
describe('#1048 no rule may carry a leading word-boundary anchor', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/process/utils/secretRedaction.ts'), 'utf-8');
  const arrayStart = source.indexOf('const SECRET_PATTERNS');
  const block = source.slice(arrayStart, source.indexOf('];', arrayStart));
  const literals = block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('/') && !line.startsWith('//'));

  it('found the rule array at all (control against a silently empty scan)', () => {
    expect(literals.length).toBeGreaterThan(15);
  });

  it('no rule opens with `\\b`', () => {
    expect(literals.filter((literal) => literal.startsWith('/\\b'))).toEqual([]);
  });

  it('exactly one rule opens with a negative lookbehind, and its glued twin follows it', () => {
    const anchored = literals.filter((literal) => literal.startsWith('/(?<!'));
    expect(anchored).toHaveLength(1);
    expect(anchored[0]).toContain('sk|pk|rk');
    expect(literals[literals.indexOf(anchored[0]) + 1]).toContain('sk|pk|rk');
  });
});

/**
 * What this change does NOT close, pinned rather than claimed - the discipline
 * the rest of this module's suite already follows.
 *
 * An 8-character `sk-` body glued to a word character stays visible. Closing it
 * needs the anchorless rule to accept an 8-character run, and that is exactly
 * the rule that masked `risk-assessment-2024-q3` and four other ordinary lines
 * in the block above. The trade is stated where it is made: the 8-character
 * floor survives at a real boundary, and only there.
 */
describe('#1048 the glued shape that is still not masked, on the record', () => {
  it('an 8-character sk- body glued to letters or a digit survives', () => {
    for (const prefix of ['TOKEN', '9']) {
      expect(redactSecrets(`${prefix}sk-ABCDEFGH`)).toBe(`${prefix}sk-ABCDEFGH`);
    }
    // Both controls that make this a LENGTH limit and not a claim that the
    // family is unmasked: the same body at a boundary masks, and glued to an
    // underscore it masks too (the clean-boundary rule's lookbehind permits `_`).
    expect(redactSecrets('rejected sk-ABCDEFGH here')).toBe('rejected [redacted] here');
    expect(redactSecrets('_sk-ABCDEFGH')).toBe('_[redacted]');
    // And a 16-character body IS masked when glued, which is the rule this
    // limit belongs to.
    expect(redactSecrets('TOKENsk-ABCDEFGH12345678')).toBe('TOKEN[redacted]');
  });
});

/**
 * What the glued rule COSTS, pinned for the same reason. The module claims two
 * false positives over an innocuous corpus of 37 lines and both are here, so the
 * claim fails if it stops being true in either direction.
 */
describe('#1048 the two over-masks the glued rule buys, on the record', () => {
  it('masks a hyphenated word followed by a 16-character id', () => {
    expect(redactSecrets('task-4f2b8c1e9a7d6e5f started')).toBe('ta[redacted] started');
    expect(redactSecrets('disk-2b7c9e1f4a6d8b0c mounted')).toBe('di[redacted] mounted');
    // Controls: one character shorter and the same shape is untouched, so this
    // is the 16-run rule firing and not some broader over-reach.
    expect(redactSecrets('task-4f2b8c1e9a7d6e5 started')).toBe('task-4f2b8c1e9a7d6e5 started');
    expect(redactSecrets('workspace-1a2b3c4d5e6f7890 registered')).toBe('workspace-1a2b3c4d5e6f7890 registered');
  });
});
