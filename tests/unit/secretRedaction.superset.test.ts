/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { redactSecrets } from '@process/utils/secretRedaction';
import { legacyMaskedRuns, legacyWebserverRedactSecrets } from '../fixtures/legacyWebserverRedaction';

/**
 * #992 moved the ~10 remote-facing config-write routes off their own scrubber
 * and onto the shared one. That is only safe if the shared set masks a SUPERSET
 * of what the deleted set masked. The first attempt asserted exactly that in a
 * code comment and was wrong on two shapes:
 *
 *  - a `{8,}` floor on the Bearer pattern where the deleted one had `+`, so
 *    `Authorization: Bearer x` reached the remote client verbatim;
 *  - a trailing `\b` on the `xox`/`xai` patterns. The `xox` class excludes `_`,
 *    so a token followed by `_` could not satisfy the boundary, backtracking
 *    exhausted the `{8,}` floor, and the token survived ENTIRELY.
 *
 * A comment cannot fail CI. This does.
 */

/** Every run the legacy scrubber masked must be gone from the new output. */
function assertSuperset(text: string): void {
  const runs = legacyMaskedRuns(text);
  if (runs.length === 0) return;
  const out = redactSecrets(text);
  for (const run of runs) {
    expect(
      out,
      `legacy scrubber masked ${JSON.stringify(run)} in ${JSON.stringify(text)}; shared scrubber left it in ${JSON.stringify(out)}`
    ).not.toContain(run);
  }
}

describe('shared scrubber masks a superset of the deleted webserver scrubber', () => {
  // The exact strings from the adversarial audit. Each one FULLY survived the
  // shared scrubber while the deleted one masked it.
  const AUDIT_REGRESSIONS = [
    'Authorization: Bearer x',
    'Authorization: Bearer abc1234',
    'authorization: bearer abcdef',
    'xoxb-xyzxai-5_',
    'xoxp-AKIAKaccess_token-',
    'xai-AKIAxai-=49',
    // A full-length real-shaped Slack token with an underscore suffix: the
    // trailing-boundary bug leaked this one whole, not merely its tail.
    'xoxb-ABCDEFGHIJKLMNOPQRSTUVWX_tail',
  ];

  it.each(AUDIT_REGRESSIONS)('masks %j at least as well as the legacy scrubber', (text) => {
    expect(legacyWebserverRedactSecrets(text)).not.toBe(text); // fixture sanity: legacy DID mask it
    assertSuperset(text);
  });

  /**
   * Positional sweep. The two defects were both about what sits IMMEDIATELY
   * after a token, which is exactly what a hand-written corpus misses - so the
   * suffix is enumerated rather than chosen. Deterministic, not random, so a
   * failure is reproducible from the test name alone.
   */
  const TOKEN_BODIES = [
    'xoxb-ABCDEFGHIJKLMNOPQRSTUVWX',
    'xoxp-AKIAKaccess',
    'xoxa-abcdefghij',
    'xai-ABCDEFGH12345678',
    'xai-AKIAxai',
    'sk-live-ABCDEFGH12345678',
    'sk-ABCDEFGH',
    // Exactly 7 usable characters: the length at which a trailing word boundary
    // forces backtracking under the {8,} floor and the token escapes entirely.
    // `sk-svcacct-` is the real-world instance, found by a literal sweep of src/.
    'sk-ABCDEFG',
    'sk-svcacct',
    'Bearer abcDEF123.tok-en_value',
    'Bearer x',
    'Bearer abc1234',
  ];
  // Word chars, non-word chars, class members and class non-members alike: `_`
  // is the one that broke it, but pinning only `_` would pin the symptom.
  const SUFFIXES = ['', '_', '-', '=', '.', '/', '+', ' ', ',', ')', '"', 'Z', '9', '_tail', '-tail', '::'];
  const PREFIXES = ['', 'error: ', 'upstream said ', '"', '('];

  const sweep: string[] = [];
  for (const prefix of PREFIXES) {
    for (const body of TOKEN_BODIES) {
      for (const suffix of SUFFIXES) sweep.push(`${prefix}${body}${suffix}`);
    }
  }

  it(`masks a superset across ${sweep.length} prefix/token/suffix combinations`, () => {
    const leaks: string[] = [];
    for (const text of sweep) {
      const runs = legacyMaskedRuns(text);
      if (runs.length === 0) continue;
      const out = redactSecrets(text);
      for (const run of runs) {
        if (out.includes(run))
          leaks.push(`${JSON.stringify(text)} -> ${JSON.stringify(out)} still contains ${JSON.stringify(run)}`);
      }
    }
    expect(leaks).toEqual([]);
  });

  it('the sweep actually exercises the legacy scrubber (guards against a vacuous pass)', () => {
    const exercised = sweep.filter((text) => legacyMaskedRuns(text).length > 0);
    expect(exercised.length).toBeGreaterThan(sweep.length / 2);
  });
});
