/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CAMEL_SECRET_LABELS,
  LABELLED_SECRET_LABELS,
  PASSPHRASE_SECRET_LABELS,
  redactSecrets,
} from '@process/utils/secretRedaction';
import { CLEAN_CORPUS, SECRET_CORPUS } from '../fixtures/secretCorpus';

describe('redactSecrets (canonical)', () => {
  it.each(SECRET_CORPUS.map((entry) => [entry.label, entry] as const))('masks %s', (_label, entry) => {
    const out = redactSecrets(entry.text);
    expect(out).not.toContain(entry.secret);
    expect(out).toContain('[redacted]');
  });

  it.each(CLEAN_CORPUS)('leaves %j untouched', (line) => {
    expect(redactSecrets(line)).toBe(line);
  });

  it('tolerates empty input', () => {
    expect(redactSecrets('')).toBe('');
  });

  it('keeps the label of a masked assignment so the diagnostic still reads', () => {
    expect(redactSecrets('api_key = "hunter2hunter2"')).toContain('api_key');
  });

  /**
   * The oracle above - `not.toContain(secret)` plus `toContain('[redacted]')` -
   * is satisfied by a PARTIAL replacement, and a partial replacement is exactly
   * how a credential leaks. That blind spot is not hypothetical: it is why this
   * suite was green while a webhook URL was reaching the output with one of its
   * three path segments intact.
   *
   * So: no short window of any corpus secret may survive. A window, not the whole
   * string, is what makes this able to see a partial mask at all.
   *
   * The window length is the oracle's FLOOR, so it is measured, not picked. With
   * a tail-leak mutation injected into the masker, 24 of these tests fail when
   * the surviving tail is at least WINDOW characters and only the 3 whole-string
   * `toBe` tests below fail when it is shorter - so at WINDOW = 8 a 7-character
   * survival of a corpus secret passed green, and the two shortest corpus secrets
   * are 10 and 11 characters. 4 is the tightest value that still leaves this
   * suite green: at 3, `cre` and `npm` collide with ordinary words in the
   * surrounding log text and the oracle starts reporting leaks that are not
   * there.
   */
  const WINDOW = 4;

  it('every corpus secret is long enough for the window oracle to bite', () => {
    const tooShort = SECRET_CORPUS.filter((entry) => entry.secret.length < WINDOW).map((entry) => entry.label);
    expect(tooShort).toEqual([]);
  });

  it.each(SECRET_CORPUS.map((entry) => [entry.label, entry] as const))(
    'leaves no %s fragment behind, not just the whole run',
    (_label, entry) => {
      const out = redactSecrets(entry.text);
      const windows = Array.from({ length: entry.secret.length - WINDOW + 1 }, (_unused, at) =>
        entry.secret.slice(at, at + WINDOW)
      );
      expect(windows.filter((window) => out.includes(window))).toEqual([]);
    }
  );
});

/**
 * Composition, which no per-pattern test can see. A narrow rule that fires first
 * injects the `[` and `]` of the marker; those characters sit outside the wider
 * rules' character classes, so the wider match aborts and the remainder of the
 * credential survives. Each container below is a credential IN WHOLE - a webhook
 * URL, a JWT, an `Authorization:` header - so the only correct output is the
 * marker and nothing else. `toBe`, deliberately: `not.toContain` is the oracle
 * that missed this.
 */
describe('a narrow pattern inside a wider one does not split the wider match', () => {
  // Synthetic, and shaped to reach the `{20,}` floor without being a real token.
  const INNER = `npm_${'A'.repeat(24)}`;
  const THIRD_SEGMENT = 'C'.repeat(24);
  const JWT_SIGNATURE = 'dBjftJeZ4CVPmB92K27uhbUJU1p1r_wW1gFWFOEjXk';

  const CONTAINERS: ReadonlyArray<readonly [string, string]> = [
    [
      'Slack incoming-webhook URL whose middle path segment is a vendor token',
      ['https://hooks.slack.com', 'services', 'T00000000', INNER, THIRD_SEGMENT].join('/'),
    ],
    ['JWT whose payload segment is a vendor token', `eyJhbGciOiJIUzI1NiJ9.${INNER}.${JWT_SIGNATURE}`],
    ['Authorization header carrying a vendor token with no scheme', `Authorization: ${INNER}`],
  ];

  it.each(CONTAINERS)('masks the whole %s', (_label, text) => {
    expect(redactSecrets(text)).toBe('[redacted]');
  });

  it('the containers really are whole-credential (control against a vacuous toBe)', () => {
    // Each container must carry BOTH the inner token and something outside it,
    // or `toBe('[redacted]')` would prove nothing about the composition.
    for (const [label, text] of CONTAINERS) {
      expect(text, label).toContain(INNER);
      expect(text.length, label).toBeGreaterThan(INNER.length + 10);
    }
  });
});

/**
 * The two places single-pass span merging does NOT help, pinned so neither is
 * carried as a claim again. The doc comment on `maskPatternMatches` used to say
 * there were zero weakenings; there are two shapes, both recorded here.
 *
 * Neither is merge-blocking and neither is a regression against the sequential
 * masking that shipped before it. They are pinned because the module's comment is
 * load-bearing security documentation, and an unpinned comment is how #1004 and
 * #1026 both shipped.
 */
describe('the limits of single-pass span merging, pinned rather than claimed', () => {
  const AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE';
  const JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dBjftJeZ4CVPmB92K27uhbUJU1p1r_wW1gFWFOEjXk';

  /**
   * INVERTED by #1048, exactly as this test demanded: "if anyone closes this - by
   * looping to a fixed point, or by fixing the anchors - this test fails and the
   * doc comment has to be brought with it". The anchors were the mechanism, not
   * the merging. Sequential masking caught this JWT by ACCIDENT - it injected
   * `[redacted]`, `]` is a non-word character, and the JWT's leading `\b` matched
   * a boundary the pristine string does not contain. With no leading `\b` on any
   * rule, the JWT matches the glued shape on the pristine text and both spans
   * merge into one marker. The `maskPatternMatches` doc comment was rewritten in
   * the same commit.
   *
   * `toBe` on the exact string, still deliberately: `not.toContain` is the oracle
   * that cannot tell a whole mask from a partial one.
   */
  it('a credential glued to an AWS key id with NO separator is masked too (#1048)', () => {
    const out = redactSecrets(`err ${AWS_ACCESS_KEY_ID}${JWT} done`);
    expect(out, 'the AWS key id itself must still be masked').not.toContain(AWS_ACCESS_KEY_ID);
    expect(out).toBe('err [redacted] done');
    // Control, and the reason this is one marker and not two: the spans touch,
    // so they merge. Separated by anything at all they stay two markers - that is
    // the case below, and it must not have changed.
    expect(out).not.toContain(JWT.slice(0, 8));
  });

  it('the same two credentials separated by a single space are BOTH masked (the shape that actually occurs)', () => {
    // The control that makes the test above a narrow boundary rather than a hole:
    // any separator at all, and there is no loss.
    expect(redactSecrets(`err ${AWS_ACCESS_KEY_ID} ${JWT} done`)).toBe('err [redacted] [redacted] done');
  });

  /**
   * An accepted READABILITY cost, not a leak. The `Authorization:` rule eats its
   * own header name whenever no narrower rule pre-empts it - true on `main` too,
   * for a header carrying a value with no vendor prefix - and merging makes that
   * fire in one more case, where a narrower vendor rule also matched. The over-
   * match corpus had no Authorization-header-carrying-a-vendor-token line, so it
   * reported no change here. This is that line.
   */
  it('masking an Authorization header carrying a vendor token also consumes the header name', () => {
    const token = `ghp_${'A'.repeat(36)}`;
    expect(redactSecrets(`Authorization: ${token} failed for repo owner/name`)).toBe(
      '[redacted] failed for repo owner/name'
    );
    // The `Bearer` form keeps the header name, because the Bearer rule starts
    // after the colon. Most real headers are this shape.
    expect(redactSecrets(`Authorization: Bearer ${token} failed`)).toBe('Authorization: [redacted] failed');
  });

  it('the two pass-2 rules still run sequentially, so a swallowed scheme still costs a DSN password', () => {
    // `1//` is greedy over letters, so it eats the `postgres` scheme that
    // URL_USERINFO_PASSWORD anchors on. Sequential masking lost this too.
    const out = redactSecrets(`1//${'abcdefghijklmnop'}postgres://user:s3cr3tp4ss@host`);
    expect(out).toBe('[redacted]://user:s3cr3tp4ss@host');
  });
});

/**
 * The coverage CLASS that was missing, and the reason #1026 shipped: the suite
 * above tests labelled assignments in their BARE form (`api_key=`, `client_secret=`),
 * which is the one form the broken leading `\b` could still match. Every prefixed
 * form - the form an environment variable actually takes - went untested and
 * unmasked.
 *
 * So this does not spot-check a few prefixes. It enumerates the module's own
 * label list, expands each label into every spelling the pattern accepts, and
 * asserts the prefixed assignment is masked in all of them. A label added to
 * `LABELLED_SECRET_LABELS` later is covered here without anyone remembering to
 * come back.
 */
describe('every labelled secret is masked in its PREFIXED form (#1026)', () => {
  /** Unrecognizable on its own: no vendor prefix, so ONLY the label can catch it. */
  const VALUE = 'not-a-real-value-0123456789';

  /**
   * Expand one label fragment into the concrete spellings it accepts. `[_-]?` is
   * the only regex construct the label list uses; a fragment this cannot read
   * FAILS rather than being silently skipped, because a label the expander does
   * not understand is a label this suite is not actually covering.
   */
  function spellings(fragment: string): string[] {
    expect(
      fragment.replaceAll('[_-]?', ''),
      `label ${fragment} uses regex syntax this test cannot expand - extend spellings()`
    ).toMatch(/^[a-z]+$/);
    return fragment
      .split('[_-]?')
      .slice(1)
      .reduce<string[]>(
        (acc, part) => acc.flatMap((sofar) => ['_', '-', ''].map((joiner) => `${sofar}${joiner}${part}`)),
        [fragment.split('[_-]?')[0]]
      );
  }

  // Real provider prefixes, a user-invented one, and the separators that occur
  // in practice. `''` keeps the bare form covered too.
  const PREFIXES = ['', 'ANTHROPIC_', 'AZURE_OPENAI_', 'my_', 'x-', 'wayland.'];

  const cases = LABELLED_SECRET_LABELS.flatMap((fragment) =>
    spellings(fragment).flatMap((spelling) =>
      [spelling, spelling.toUpperCase()].flatMap((cased) =>
        PREFIXES.map((prefix) => ({
          name: `${prefix}${cased}`,
          text: `child exited 1: ${prefix}${cased}=${VALUE}`,
        }))
      )
    )
  );

  it(`covers all ${LABELLED_SECRET_LABELS.length} labels as ${cases.length} prefixed assignments`, () => {
    expect(LABELLED_SECRET_LABELS.length).toBeGreaterThanOrEqual(8);
    const survived = cases.filter(({ text }) => redactSecrets(text).includes(VALUE)).map(({ text }) => text);
    expect(survived).toEqual([]);
  });

  // #1042 put a backup passphrase on the IPC payload and this array is its only
  // backstop, so pin the label explicitly. The generated cases above cover it
  // only for as long as it stays in the array; this fails if someone takes it
  // out, which the generated suite cannot notice by construction.
  it('masks a passphrase label in every separator spelling (#1042 backstop)', () => {
    const shapes = [
      `restore failed: passphrase=${VALUE}`,
      `restore failed: pass_phrase: ${VALUE}`,
      `restore failed: pass-phrase=${VALUE}`,
      `restore failed: PASSPHRASE=${VALUE}`,
      `restore failed: BACKUP_PASSPHRASE=${VALUE}`,
    ];
    expect(LABELLED_SECRET_LABELS).toContain('pass[_-]?phrase');
    for (const text of shapes) {
      expect(redactSecrets(text)).not.toContain(VALUE);
    }
    // Control: the value really is present and long enough to be maskable, and
    // ordinary prose using the word is not mangled.
    expect(shapes.every((t) => t.includes(VALUE))).toBe(true);
    expect(redactSecrets('the user typed a passphrase and it was wrong')).toBe(
      'the user typed a passphrase and it was wrong'
    );
  });

  it('every case really carries the value, and the mask really fires (control)', () => {
    // A "no secret found" result means nothing unless the input demonstrably
    // contained one and the redactor demonstrably acted on it.
    const wrong = cases
      .filter(({ text }) => !text.includes(VALUE) || !redactSecrets(text).includes('[redacted]'))
      .map(({ text }) => text);
    expect(wrong).toEqual([]);
  });

  it('the harness is not vacuous: an unlabelled variable of the same shape survives', () => {
    // If this ever starts being masked, the sweep above stops proving anything
    // about labels and the module has started masking on shape alone.
    const line = `child exited 1: ANTHROPIC_HOSTNAME=${VALUE}`;
    expect(redactSecrets(line)).toBe(line);
  });

  it('keeps the prefix and the label so the diagnostic still names the variable', () => {
    const out = redactSecrets(`child exited 1: ANTHROPIC_API_KEY=${VALUE}`);
    expect(out).toBe('child exited 1: ANTHROPIC_API_KEY=[redacted]');
  });

  it('does not treat a label buried inside a longer alphanumeric run as a label', () => {
    // The lookbehind still refuses `[A-Za-z0-9]` before the label, so this is
    // NOT an assignment of anything called a key.
    const line = `notmyapikey=${VALUE}`;
    expect(redactSecrets(line)).toBe(line);
  });
});

/**
 * #1051 and #1037. The #1026 block above enumerates every label in its PREFIXED
 * form; these two defects were the same class in the two remaining directions,
 * and both were live on a surface with a "Copy report" button.
 *
 *  - #1051: the separator had to sit IMMEDIATELY after the label, and in JSON it
 *    does not - the label's closing `"` sits there. So a JSON body leaked its
 *    secret for EVERY label in the list.
 *  - #1037: a SUFFIX after the label broke the same requirement from the other
 *    side (`API_KEY_PROD=`), and two label CORES were missing outright
 *    (`SECRET_KEY`, and any vendor-prefixed `*_TOKEN`).
 *
 * Enumerated over `LABELLED_SECRET_LABELS` rather than spot-checked, for the
 * same reason the #1026 block is: both defects were properties of the shared
 * pattern, so a label added later must inherit the coverage without anyone
 * remembering to come back here.
 */
describe('a labelled secret is masked in JSON and in suffixed form (#1051, #1037)', () => {
  /** No vendor prefix, so ONLY the label can catch it. */
  const VALUE = 'not-a-real-value-0123456789';

  /** Same expander contract as the #1026 block: an unreadable fragment FAILS. */
  function spellings(fragment: string): string[] {
    expect(
      fragment.replaceAll('[_-]?', ''),
      `label ${fragment} uses regex syntax this test cannot expand - extend spellings()`
    ).toMatch(/^[a-z]+$/);
    return fragment
      .split('[_-]?')
      .slice(1)
      .reduce<string[]>(
        (acc, part) => acc.flatMap((sofar) => ['_', '-', ''].map((joiner) => `${sofar}${joiner}${part}`)),
        [fragment.split('[_-]?')[0]]
      );
  }

  const labels = LABELLED_SECRET_LABELS.flatMap((fragment) =>
    spellings(fragment).flatMap((spelling) => [spelling, spelling.toUpperCase()])
  );

  /**
   * The shapes #1051 and #1037 name, plus the syntaxes that share the defect.
   * `%s` is the label; each entry builds a line around it.
   */
  const SHAPES: ReadonlyArray<readonly [string, (label: string) => string]> = [
    ['JSON object field', (label) => `upstream 400: {"${label}":"${VALUE}"}`],
    ['JSON with spaces around the colon', (label) => `upstream 400: { "${label}" : "${VALUE}" }`],
    ['JSON field among other fields', (label) => `{"model":"x","${label}":"${VALUE}","max_tokens":4096}`],
    ['single-quoted JSON-ish field', (label) => `{'${label}':'${VALUE}'}`],
    ['suffixed assignment', (label) => `env dump: ${label}_PROD=${VALUE}`],
    ['doubly suffixed assignment', (label) => `env dump: ${label}_PROD_V2=${VALUE}`],
    ['hyphen-suffixed assignment', (label) => `env dump: ${label}-prod=${VALUE}`],
    ['prefixed AND suffixed assignment', (label) => `env dump: ANTHROPIC_${label}_PROD=${VALUE}`],
    ['suffixed JSON field', (label) => `{"${label}_prod":"${VALUE}"}`],
    ['YAML quoted value', (label) => `${label}: "${VALUE}"`],
    ['TOML quoted value', (label) => `${label} = "${VALUE}"`],
  ];

  const cases = SHAPES.flatMap(([shape, build]) =>
    labels.map((label) => ({ name: `${shape} / ${label}`, text: build(label) }))
  );

  it(`masks all ${LABELLED_SECRET_LABELS.length} labels across ${cases.length} JSON and suffixed shapes`, () => {
    const survived = cases.filter(({ text }) => redactSecrets(text).includes(VALUE)).map(({ name }) => name);
    expect(survived).toEqual([]);
  });

  it('every case really carries the value and the mask really fires (control)', () => {
    // A sweep that reports no leaks proves nothing unless each input demonstrably
    // contained the value and the redactor demonstrably acted on it.
    const wrong = cases
      .filter(({ text }) => !text.includes(VALUE) || !redactSecrets(text).includes('[redacted]'))
      .map(({ name }) => name);
    expect(wrong).toEqual([]);
  });

  /**
   * The two cores #1037 named. Pinned explicitly, because the generated sweep
   * above covers them only for as long as they stay in the array and cannot
   * notice their removal by construction - the same reason #1042's passphrase
   * label is pinned above.
   */
  it('masks SECRET_KEY and a vendor-prefixed *_TOKEN (#1037 label cores)', () => {
    expect(LABELLED_SECRET_LABELS).toContain('secret[_-]?key');
    expect(LABELLED_SECRET_LABELS).toContain('token');
    for (const name of ['SECRET_KEY', 'SECRET_KEY_BASE', 'GITHUB_TOKEN', 'SLACK_TOKEN', 'NPM_TOKEN', 'token']) {
      expect(redactSecrets(`env dump: ${name}=${VALUE}`), name).toBe(`env dump: ${name}=[redacted]`);
    }
  });

  /**
   * The compound `*_token` cores are NOT redundant now that a bare `token` core
   * exists: the lookbehind refuses to reach into a longer alphanumeric run, so
   * only the compound core can see an unseparated spelling.
   */
  it('keeps the unseparated token spellings that the bare core cannot reach', () => {
    for (const name of ['authtoken', 'accesstoken', 'refreshtoken']) {
      expect(redactSecrets(`${name}=${VALUE}`), name).toBe(`${name}=[redacted]`);
    }
  });

  /**
   * The output of masking a JSON body must still BE JSON. The quotes around the
   * value are consumed by the pattern, so they have to be re-emitted; dropping
   * them (which is what the pattern did before #1051) yields
   * `{"api_key":[redacted]}`, and a diagnostic the user copies out of the app
   * and pastes into a parser is then broken by the security control.
   */
  it('leaves the masked JSON body parseable', () => {
    const body = `{"model":"x","api_key":"${VALUE}","max_tokens":4096}`;
    const out = redactSecrets(body);
    expect(out).toBe('{"model":"x","api_key":"[redacted]","max_tokens":4096}');
    expect(JSON.parse(out)).toEqual({ model: 'x', api_key: '[redacted]', max_tokens: 4096 });
  });

  it('re-emits only the quotes that were there, so an unquoted value is unchanged in shape', () => {
    // The quote re-emission must not INVENT quotes: a bare env assignment had
    // none and must not grow any.
    expect(redactSecrets(`API_KEY=${VALUE}`)).toBe('API_KEY=[redacted]');
    expect(redactSecrets(`API_KEY="${VALUE}"`)).toBe('API_KEY="[redacted]"');
    expect(redactSecrets(`API_KEY='${VALUE}'`)).toBe("API_KEY='[redacted]'");
  });

  it('leaves a SHORT quoted value alone, so the 8-character floor still holds', () => {
    // The floor is what keeps ordinary configuration and ordinary counters
    // readable. If the JSON widening had lowered it, this would mask.
    for (const line of ['{"a":"x"}', '{"api_key":"x"}', '{"password":"short"}', 'api_key=""']) {
      expect(redactSecrets(line), line).toBe(line);
    }
  });

  /**
   * The false-positive TRADE, asserted rather than asserted-in-a-comment.
   *
   * The suffix widening masks metadata ABOUT a credential as well as the
   * credential (`api_key_length=`, `secret_key_id=`, `token_count=`). That was
   * chosen deliberately - over-masking a diagnostic is far cheaper than handing
   * out a live key - and the thing that makes it cheap is the 8-character value
   * floor, which keeps the LLM counters this app actually prints readable.
   *
   * Both halves are pinned. The first half fails if someone "tightens" the
   * suffix back out and re-opens `API_KEY_PROD=`; the second fails if someone
   * drops the floor and starts eating every token count in the log.
   */
  it('accepts masking credential METADATA as the price of the suffix widening', () => {
    const overMasked = [
      'api_key_length=12345678',
      'api_key_id=abcdefgh1234',
      'secret_key_id=ABCDEFGH12',
      'secret_key_ref=my-configmap-ref',
      'access_token_expires_in=3600000000',
      'token_count=12345678',
    ];
    for (const line of overMasked) expect(redactSecrets(line), line).toContain('[redacted]');
  });

  it('but the 8-character floor keeps the LLM counters this app prints readable', () => {
    const readable = [
      'token_count=4096',
      'token_count=128000',
      'token_limit=1000000',
      'max_tokens=12345678',
      'input_tokens=12345678',
      'total_tokens: 1234567890',
      'tokens_used=12345678',
      'token_type=Bearer',
    ];
    for (const line of readable) expect(redactSecrets(line), line).toBe(line);
  });

  it('the label lookbehind still holds against the suffix widening', () => {
    // A suffix must not become a way in through the front: the label still may
    // not sit inside a longer alphanumeric run.
    for (const line of [`notmyapikey_prod=${VALUE}`, `ANTHROPIC_HOSTNAME=${VALUE}`, `{"hostname":"${VALUE}"}`]) {
      expect(redactSecrets(line), line).toBe(line);
    }
  });
});

/**
 * The shapes in this family that STILL leak, pinned rather than claimed - same
 * discipline as the span-merging limits above. #1051 and #1037 are about the
 * label and the separator; each of these needs the VALUE matcher or the
 * separator class widened, which is a different decision with a different blast
 * radius, so they are recorded and left for their own change.
 *
 * If you close one of these, this test fails and the KNOWN GAPS list in
 * `secretRedaction.ts` has to be brought with it. That is the point.
 */
describe('the labelled-assignment shapes that still leak, pinned rather than claimed', () => {
  const VALUE = 'not-a-real-value-0123456789';

  it('an XML element body leaks: the separator is `>`, not `:` or `=`', () => {
    const line = `<api_key>${VALUE}</api_key>`;
    expect(redactSecrets(line)).toBe(line);
  });

  it('a JSON value containing a space or a `}` leaks: both are outside the value class', () => {
    // The run before the excluded character is 3 characters, under the floor, so
    // nothing matches at all.
    for (const line of ['{"api_key":"abc def 12345678"}', '{"api_key":"abc}def12345678"}']) {
      expect(redactSecrets(line), line).toBe(line);
    }
    // Control: the same field with a value that has neither IS masked, so this
    // is a value-class limit and not a claim that JSON is unmasked.
    expect(redactSecrets(`{"api_key":"${VALUE}"}`)).toBe('{"api_key":"[redacted]"}');
  });

  /**
   * PREMISE CORRECTION. The case above is the BENIGN half of that gap and was
   * the only half pinned, so the suite recorded "nothing matches" as the whole
   * behaviour. It is not. "Nothing matches" holds only while the FIRST run is
   * under the 8-character floor; once it reaches the floor the rule fires and
   * stops at the excluded character, and a PARTIAL mask that presents as a
   * complete one is the worse of the two outcomes - the reviewer of a feedback
   * bundle sees a marker and stops reading while most of the value ships.
   *
   * Pinned here so the real shape is on the record. Closing it for every label
   * needs the wide value matcher that `PASSPHRASE_ASSIGNMENT` takes only for the
   * password cores.
   */
  it('a JSON value whose FIRST run reaches the floor is masked only up to the space or `}`', () => {
    expect(redactSecrets('{"api_key":"SUPERSECRETPART1 SUPERSECRETPART2"}')).toBe(
      '{"api_key":"[redacted] SUPERSECRETPART2"}'
    );
    expect(redactSecrets('{"api_key":"SUPERSECRETPART1}SUPERSECRETPART2"}')).toBe(
      '{"api_key":"[redacted]}SUPERSECRETPART2"}'
    );
    // Control, and the reason this is a LABEL-scoped gap rather than a value-class
    // one: the identical shape under a password core is masked end to end.
    expect(redactSecrets('{"password":"SUPERSECRETPART1 SUPERSECRETPART2"}')).toBe('{"password":"[redacted]"}');
  });

  /**
   * FINDING 3, recorded rather than fixed. The re-emitted quotes keep the masked
   * JSON parseable only when the VALUE was quoted. An unquoted one has no quotes
   * to re-emit and the object stops parsing, and the "only a count above
   * 10,000,000 is masked" mitigation does not reach a timestamp: epoch-seconds is
   * 10 digits, epoch-millis is 13.
   */
  it('an UNQUOTED value is masked into invalid JSON, and epoch stamps are over the floor', () => {
    for (const [line, masked] of [
      ['{"token_expires_at":1755424800}', '{"token_expires_at":[redacted]}'],
      ['{"password_updated_at":1755424800,"user":"sean"}', '{"password_updated_at":[redacted],"user":"sean"}'],
      ['{"token_created_at":1755424800123}', '{"token_created_at":[redacted]}'],
    ] as const) {
      expect(redactSecrets(line), line).toBe(masked);
      expect(() => JSON.parse(line)).not.toThrow();
      expect(() => JSON.parse(redactSecrets(line)), `${line} stays parseable`).toThrow();
    }
    // Control: the QUOTED form does keep parsing, which is the property the
    // quote re-emission actually buys.
    expect(() => JSON.parse(redactSecrets(`{"api_key":"${VALUE}"}`))).not.toThrow();
  });

  /**
   * FINDING 4. Two fields this app reads BY NAME are destroyed. Both are listed
   * in the module's accepted-false-positive inventory rather than excluded: this
   * module's input is untrusted subprocess output, so a field-name exception is
   * a name the producer of the line chooses, and `api_key_env`'s safe shape is
   * also the shape of an unprefixed credential.
   */
  it('over-masks `token_endpoint` and `api_key_env`, which are documented, not excluded', () => {
    expect(redactSecrets('{"token_endpoint":"https://api.x.ai/oauth2/token","jwks_uri":"https://api.x.ai/jwks"}')).toBe(
      '{"token_endpoint":"[redacted]","jwks_uri":"https://api.x.ai/jwks"}'
    );
    expect(redactSecrets('{"api_key_env":"XAI_API_KEY"}')).toBe('{"api_key_env":"[redacted]"}');
    // The same suffix trade, stated exactly: these three mask once the value
    // reaches the floor and are NOT exceptions, contrary to a claim that they
    // were already safe.
    for (const name of ['token_family', 'token_blacklist', 'total_token_usage']) {
      expect(redactSecrets(`${name}=abcdefghij`), name).toBe(`${name}=[redacted]`);
    }
    // These three ARE safe at any value: the plural `s` is not `[_-]`, so the
    // suffix cannot start and the separator cannot match a letter.
    const counters = 'max_tokens=100000000 input_tokens=123456789 total_tokens=987654321';
    expect(redactSecrets(counters)).toBe(counters);
  });

  /**
   * INVERTED by #1037, under the rule this describe block states: closing one of
   * these gaps must fail here and bring the module's KNOWN GAPS list with it. It
   * did, and it has - the `secret[_-]?key` comment and the KNOWN GAPS entry in
   * `secretRedaction.ts` were rewritten in the same commit as this inversion.
   *
   * The refusal that stood here was argued on `secret_name=`/`secretRef=` in a
   * Kubernetes or Vault diagnostic. Measured, half of that is false and the
   * other half is a cost already accepted elsewhere in the same rule, so the
   * `secretRef=` control below is kept as an assertion rather than deleted: it is
   * the half of the old argument that is TRUE, and it must stay true.
   */
  it('a bare `*_SECRET` with no `key` is masked (#1037), and `secretRef=` still is not', () => {
    for (const name of ['JWT_SECRET', 'APP_SECRET', 'WEBHOOK_SECRET', 'SESSION_SECRET', 'COOKIE_SECRET']) {
      expect(redactSecrets(`${name}=${VALUE}`), name).toBe(`${name}=[redacted]`);
    }
    // The bare core ends at `secret` and the separator cannot match a letter, so
    // the camel-spelled Kubernetes/Vault metadata names are untouched.
    for (const name of ['secretRef', 'secretName']) {
      expect(redactSecrets(`${name}=${VALUE}`), name).toBe(`${name}=${VALUE}`);
    }
    // Control: the two `secret` cores that predate it still fire.
    expect(redactSecrets(`CLIENT_SECRET=${VALUE}`)).toBe('CLIENT_SECRET=[redacted]');
    expect(redactSecrets(`SECRET_KEY=${VALUE}`)).toBe('SECRET_KEY=[redacted]');
  });

  it('a URL query value is masked but swallows the following parameters (over-mask, not a leak)', () => {
    // `&` is not excluded from the value class. Recorded because the marker
    // eating `&x=1` is surprising when reading a masked URL, not because
    // anything escapes.
    expect(redactSecrets(`https://x.test/a?api_key=${VALUE}&x=1`)).toBe('https://x.test/a?api_key=[redacted]');
  });
});

/**
 * FINDING 1 (HIGH). A real user passphrase reached the log file and the feedback
 * bundle unmasked, because `LABELLED_SECRET_ASSIGNMENT`'s value class
 * `[^\s"',}]{8,}` stops at the first space and a passphrase is prose.
 *
 * Reachable, not hypothetical: #1042 routed `pass[_-]?phrase` into
 * `LABELLED_SECRET_LABELS` because that array is its only backstop, and the
 * product's own sync passphrase input requires 16 characters while restricting
 * no character, so a four-word phrase is the expected shape and not an edge
 * case. Measured on the released rule:
 *
 *   {"passphrase":"correct horse battery staple"}     -> UNCHANGED
 *   passphrase=correct horse battery staple           -> UNCHANGED
 *   {"passphrase":"watermelon sugar high tonight"}    -> "[redacted] sugar high tonight"
 *   BACKUP_PASSPHRASE="watermelon sugar high tonight" -> "[redacted] sugar high tonight"
 *
 * The partial pair is the worse half: it looks redacted.
 */
describe('a multi-word passphrase is masked end to end (#1042 follow-up)', () => {
  const PHRASE = 'correct horse battery staple';

  it('masks the whole phrase in every container the product actually produces', () => {
    const shapes = [
      `{"passphrase":"${PHRASE}"}`,
      `{"password":"${PHRASE}"}`,
      `{ "pass_phrase" : "${PHRASE}" }`,
      `{ password: '${PHRASE}', user: 'sean' }`,
      `passphrase=${PHRASE}`,
      `pass-phrase: ${PHRASE}`,
      `BACKUP_PASSPHRASE="${PHRASE}"`,
      `SYNC_PASSWD='${PHRASE}'`,
      `[2026-08-18 10:22:01] [error] restore failed: passphrase=${PHRASE}`,
    ];
    for (const text of shapes) {
      const out = redactSecrets(text);
      expect(out, text).toContain('[redacted]');
      // Not just "the whole value is gone" - no WORD of it may survive, which is
      // what the partial mask used to leave behind.
      for (const word of PHRASE.split(' ')) expect(out, `${text} leaked "${word}"`).not.toContain(word);
    }
    // Control: every case really carried the phrase, so a clean result means
    // something.
    expect(shapes.every((t) => t.includes(PHRASE))).toBe(true);
  });

  it('stops at the closing quote and never runs into the rest of the object', () => {
    expect(redactSecrets(`{"passphrase":"${PHRASE}","user":"sean","port":5432}`)).toBe(
      '{"passphrase":"[redacted]","user":"sean","port":5432}'
    );
    expect(redactSecrets(`{"password":"abcdefghij","api_url":"https://x.test/a"}`)).toBe(
      '{"password":"[redacted]","api_url":"https://x.test/a"}'
    );
    expect(redactSecrets(`{ password: '${PHRASE}', user: 'sean' }`)).toBe("{ password: '[redacted]', user: 'sean' }");
    // Still valid JSON, which is the whole reason the quotes are re-emitted.
    expect(() => JSON.parse(redactSecrets(`{"passphrase":"${PHRASE}","user":"sean"}`))).not.toThrow();
  });

  /**
   * The OVER-REDACTION half, which matters as much as the leak: a value matcher
   * that runs past whitespace is exactly the shape that eats a diagnostic. Each
   * of these is a real log line shape and each one has to survive.
   */
  it('does not eat the rest of the line, the object, or the connection string', () => {
    const kept = [
      // A key=value connection line: the siblings after the password survive.
      ['psql: connecting password=hunter2xx user=sean host=db01 port=5432', 'user=sean host=db01 port=5432'],
      ['psql: connecting host=db01 password=hunter2xx user=sean', 'host=db01'],
      // util.inspect output with a non-secret value.
      ["{ password: undefined, user: 'sean' }", "user: 'sean'"],
    ] as const;
    for (const [line, survivor] of kept) {
      expect(redactSecrets(line), line).toContain(survivor);
      expect(redactSecrets(line), line).toContain('[redacted]');
    }

    // Untouched entirely: no assignment, a value under the floor, or a JSON
    // literal that is not a credential.
    const untouched = [
      'the user typed a passphrase and it was wrong',
      'FATAL: password authentication failed for user "sean"',
      "Password for 'https://sean@github.com':",
      'Enter passphrase:',
      '{"password":"short"}',
      "{ password: null, user: 'sean', host: 'db01' }",
      '{"password":null,"api_url":"https://x.test","user":"sean"}',
      '{"password":false,"retries":3}',
    ];
    for (const line of untouched) expect(redactSecrets(line), line).toBe(line);
  });

  it('does not cross a newline: one masked line leaves the rest of the log alone', () => {
    const log = ['host=db01', `passphrase=${PHRASE}`, 'user=sean', 'port=5432'].join('\n');
    expect(redactSecrets(log)).toBe(['host=db01', 'passphrase=[redacted]', 'user=sean', 'port=5432'].join('\n'));

    // The same guard on the QUOTED branch, which is the one that could do real
    // damage: this runs over whole log FILES at feedback-collection time, so an
    // unterminated quote must fail at end of line rather than run to the next
    // quote forty lines down and mask everything between.
    const unterminated = ['password="abc', 'user="sean"', 'host="db01"'].join('\n');
    expect(redactSecrets(unterminated)).toBe(unterminated);
  });

  it('is idempotent, so the feedback bundle re-scrub cannot mangle an already-masked line', () => {
    for (const text of [`{"passphrase":"${PHRASE}"}`, `passphrase=${PHRASE}`, `PASSWD="${PHRASE}"`]) {
      const once = redactSecrets(text);
      expect(redactSecrets(once), text).toBe(once);
    }
  });

  it('applies to the password cores ONLY, and every one of them is a real label', () => {
    // A wide value matcher on `token`/`api_key` would eat ordinary log lines, so
    // the widening is scoped. This fails if somebody adds a core to the wide list
    // that the narrow list does not have, or drops one from the wide list.
    expect(PASSPHRASE_SECRET_LABELS).toEqual(['password', 'passwd', 'pass[_-]?phrase']);
    for (const core of PASSPHRASE_SECRET_LABELS) expect(LABELLED_SECRET_LABELS).toContain(core);
    // The scoping, asserted: the same phrase under a NON-password core still
    // stops at the space. That is the pinned gap two describes up, restated here
    // so the boundary of this fix is on the record next to the fix.
    expect(redactSecrets(`{"api_key":"SUPERSECRETPART1 ${PHRASE}"}`)).toContain('battery');
  });

  /**
   * The shapes this rule does NOT close, pinned rather than claimed - same
   * discipline as the gap list above.
   */
  it('still leaks an unterminated quote and a value cut short by a `,`', () => {
    // Branch 1 needs the closing quote and branch 3 refuses a leading one, so an
    // unterminated quote falls through to the narrow rule and gets whatever that
    // rule gets. Which of its two outcomes depends on the first word: under the
    // floor it is a total leak, over it a partial mask. Both are pinned because
    // the partial one is the shape that presents as complete.
    expect(redactSecrets(`password="${PHRASE}`)).toBe(`password="${PHRASE}`);
    expect(redactSecrets('password="unterminated phrase here')).toBe('password="[redacted] phrase here');
    // `,` terminates the unquoted branch, which is what protects the rest of a
    // JSON object and an inspect dump. Still an improvement on the narrow rule,
    // which left this one wholly unmasked.
    expect(redactSecrets('passphrase=correct horse, battery staple')).toBe('passphrase=[redacted], battery staple');
  });
});

/**
 * #992 asked for a test asserting there is exactly ONE redaction implementation.
 * That premise turned out to be false, and the first version of this test
 * encoded the false premise: it matched only the NAME `redactSecrets`, so it
 * reported "exactly one" while the repo actually contained FOUR token-shape
 * scrubbers and two token-shape detection tables.
 *
 * So this is a REGISTRY, not a uniqueness claim. Every module carrying a bank of
 * token-shape patterns is listed below with the reason it is allowed to exist
 * and its masking contract. A new bank fails CI until someone adds it here and
 * states why it cannot use the shared module - which is the decision that
 * actually needed forcing, since two divergent copies is how the weaker scrubber
 * ended up on the remote-facing surface.
 */
describe('token-shape pattern banks are registered, not accidental', () => {
  const srcRoot = resolve(process.cwd(), 'src');
  const canonical = 'src/process/utils/secretRedaction.ts';

  /**
   * Every module allowed to carry its own bank, and WHY. The reason is the
   * point: each of these has a masking contract the shared module cannot serve.
   */
  const REGISTERED_BANKS: Record<string, string> = {
    [canonical]:
      'THE canonical scrubber. Error bodies, agent stderr, the feedback log bundle. Masks the whole run as [redacted].',
    'src/process/resources/builtinMcp/conciergeDiagServer.ts':
      'Diagnostics dump. Separate esbuild subprocess bundle (out/main/builtin-mcp-concierge-diag.js), and masks to the last 4 characters so a Doctor report stays diagnosable. Also carries entropy rules (bare 24+ runs, 32+ hex) that would mask commit SHAs and binary digests if applied to error text.',
    'src/common/utils/redactCommandSecrets.ts':
      'Shell command RENDER for the activity timeline. Masks to fixed bullets and is deliberately narrower: masking every long run would hide the paths and flags that are the whole point of showing the real command.',
    'src/common/chat/capability/capabilityProjection.ts':
      'Capability-reason projection. Masks to shape-naming placeholders ([redacted-jwt], [redacted-aws-access-key]) because the reason string is read to understand WHICH credential class was involved.',
    'src/process/providers/detection/providerKeyPatterns.ts':
      'DETECTION, not redaction: maps a pasted key to its provider. Never masks anything.',
    'src/renderer/pages/settings/ModelsSettings/providerCatalog.ts':
      'DETECTION, not redaction: renderer-side provider catalog with example key shapes. Never masks anything.',
  };

  function sourceFiles(directory: string): string[] {
    const found: string[] = [];
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const full = resolve(directory, entry.name);
      if (entry.isDirectory()) found.push(...sourceFiles(full));
      else if (/\.tsx?$/.test(entry.name)) found.push(full);
    }
    return found;
  }

  const rel = (file: string) => relative(process.cwd(), file).split(sep).join('/');

  it('declares redactSecrets in exactly one module', () => {
    // Name-scoped ON PURPOSE, and that is a real limit: it catches a fork of
    // THIS function, not a differently-named scrubber. The structural check
    // below is what covers the rest. Object-literal and class-method forms are
    // matched too, so `{ redactSecrets(text) {} }` cannot slip past.
    const declaration =
      /(?:function\s+redactSecrets\b|(?:const|let|var)\s+redactSecrets\s*[:=]|^\s*(?:public\s+|private\s+|protected\s+|static\s+|async\s+)*redactSecrets\s*\()/m;

    const declaring = sourceFiles(srcRoot)
      .filter((file) => declaration.test(readFileSync(file, 'utf-8')))
      .map(rel);

    expect(declaring).toEqual([canonical]);
  });

  /**
   * Structural sweep: a module naming six or more distinct credential prefixes
   * is carrying a pattern bank, whatever it calls its function. This is the
   * check that would have surfaced conciergeDiagServer, redactCommandSecrets and
   * capabilityProjection, all of which the name-scoped rule above is blind to.
   */
  const PREFIX_MARKERS = [
    'sk-',
    'xox',
    'ghp_',
    'gh[posru]_',
    'github_pat_',
    'glpat-',
    'gsk_',
    'xai-',
    'r8_',
    'dop_v1_',
    'ya29',
    'AKIA',
    'ASIA',
    'AIza',
    'eyJ',
    'Bearer',
  ];
  const BANK_THRESHOLD = 6;

  it(`registers every module naming ${BANK_THRESHOLD}+ credential prefixes`, () => {
    const banks = sourceFiles(srcRoot)
      .map((file) => {
        const body = readFileSync(file, 'utf-8');
        return { file: rel(file), markers: PREFIX_MARKERS.filter((m) => body.includes(m)).length };
      })
      .filter((entry) => entry.markers >= BANK_THRESHOLD)
      .map((entry) => entry.file)
      .toSorted();

    expect(banks).toEqual(Object.keys(REGISTERED_BANKS).toSorted());
  });

  it('every registered bank still exists and carries a stated reason', () => {
    for (const [file, reason] of Object.entries(REGISTERED_BANKS)) {
      expect(existsSync(resolve(process.cwd(), file)), `${file} is registered but missing`).toBe(true);
      expect(reason.length, `${file} needs a real reason, not a placeholder`).toBeGreaterThan(40);
    }
  });
});

/**
 * #1037: the camel label list is an EXACT MIRROR of the snake one, asserted by
 * execution rather than by the comment that says so.
 *
 * Two directions, and both matter. A snake core with no camel spelling leaks
 * `myNewSecret=` while masking `NEW_SECRET=`; a camel label with no snake core
 * masks `myPrivateKey=` while leaking `PRIVATE_KEY=`. Either way the bank covers
 * a name in one spelling and not the other, which reads as covered when it is
 * not - the precise shape of every defect this module has shipped.
 */
describe('the camelCase label list mirrors the snake one exactly', () => {
  /** `secret[_-]?access[_-]?key` -> `SecretAccessKey`. */
  const camelize = (core: string): string =>
    core
      .split('[_-]?')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  /** `secret[_-]?access[_-]?key` -> `secretaccesskey`, the separator-free run. */
  const flatten = (core: string): string => core.replaceAll('[_-]?', '');

  it('the helpers produce real spellings (control against a vacuous comparison)', () => {
    expect(camelize('secret[_-]?access[_-]?key')).toBe('SecretAccessKey');
    expect(camelize('token')).toBe('Token');
    expect(flatten('pass[_-]?phrase')).toBe('passphrase');
  });

  it('every snake core has a camel spelling', () => {
    const missing = LABELLED_SECRET_LABELS.filter((core) => !CAMEL_SECRET_LABELS.includes(camelize(core)));
    expect(missing).toEqual([]);
  });

  it('every camel label is the spelling of a snake core, and nothing else', () => {
    const cores = new Set(LABELLED_SECRET_LABELS.map((core) => flatten(core).toLowerCase()));
    const orphans = CAMEL_SECRET_LABELS.filter((label) => !cores.has(label.toLowerCase()));
    expect(orphans).toEqual([]);
  });

  it('both lists are non-empty, so neither assertion above can pass vacuously', () => {
    expect(LABELLED_SECRET_LABELS.length).toBeGreaterThan(5);
    expect(CAMEL_SECRET_LABELS.length).toBeGreaterThan(5);
  });
});

/**
 * #1065's drift guard, and the reason it is worth a test of its own.
 *
 * The PEM rule is the ONLY multi-line rule in the bank, and every consumer that
 * scrubs a single line at a time is therefore blind to it - which is precisely
 * how a private key reached the log file and the feedback bundle. That defect was
 * fixed in the wcore stderr READER, by holding a block whole, and NOT in this
 * array. A second multi-line rule added here would re-open the same hole for
 * whatever shape it matches, silently, because no line-at-a-time caller would
 * change and no existing test would fail.
 *
 * So the count is pinned. A new multi-line rule must fail here and be forced to
 * answer the question: which caller assembles a whole block for it?
 */
describe('PEM is the only multi-line rule, so line-at-a-time callers stay safe (#1065)', () => {
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

  it('exactly one rule can match across a newline', () => {
    // `[\s\S]` and the `m`/`s` flags are the three ways a rule reaches past a
    // line. Any of them is the question this guard exists to force.
    // Flags are parsed rather than sliced at the last `/`: several rules carry a
    // trailing comment that contains one.
    const flagsOf = (literal: string): string => /^\/.*\/([a-z]*),/.exec(literal)?.[1] ?? '';
    const multiline = literals.filter((literal) => literal.includes('[\\s\\S]') || /[ms]/.test(flagsOf(literal)));
    expect(multiline).toHaveLength(1);
    expect(multiline[0]).toContain('PRIVATE KEY');
  });

  it('the PEM rule still needs its BEGIN anchor, which is what keeps a truncated fragment invisible', () => {
    // Not an accident and not a gap: `acpStderrRingTruncationLeak.test.ts` pins
    // that a PEM body which has lost its BEGIN line is invisible here, because a
    // rule that could match the tail alone would mask arbitrary text after any
    // stray `-----END` line. The fix for #1065 is in the reader for that reason.
    const body = 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj';
    const whole = `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----`;
    expect(redactSecrets(whole)).not.toContain(body);
    expect(redactSecrets(`${body}\n-----END PRIVATE KEY-----`)).toContain(body);
  });
});
