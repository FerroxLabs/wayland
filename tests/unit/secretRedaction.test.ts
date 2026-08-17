/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LABELLED_SECRET_LABELS, redactSecrets } from '@process/utils/secretRedaction';
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
   * So: no 8-character window of any corpus secret may survive. A window, not the
   * whole string, is what makes this able to see a partial mask at all.
   */
  const WINDOW = 8;

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
   * Sequential masking caught this JWT, and it did so by ACCIDENT: it injected
   * `[redacted]`, `]` is a non-word character, and the JWT's leading `\b` then
   * matched a boundary the pristine string does not contain. Only the two
   * FIXED-LENGTH rules can stop mid-run and supply that boundary, so this is the
   * whole shape, not a sample of a large class.
   *
   * `toBe` on the exact string, deliberately. If anyone closes this - by looping
   * to a fixed point, or by fixing the anchors in #1037 - this test fails and the
   * doc comment has to be brought with it, which is the point.
   */
  it('a credential glued to an AWS key id with NO separator keeps its own coverage only if it has an anchor', () => {
    const out = redactSecrets(`err ${AWS_ACCESS_KEY_ID}${JWT} done`);
    expect(out, 'the AWS key id itself must still be masked').not.toContain(AWS_ACCESS_KEY_ID);
    expect(out).toBe(`err [redacted]${JWT} done`);
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
