/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
// @ts-expect-error - .mjs script has no type declarations
import { lintCrossRepoRefs, CLOSING_KEYWORDS } from '../../../scripts/lint-cross-repo-refs.mjs';

/**
 * #1001 - cross-repo references between FerroxLabs/wayland and
 * FerroxLabs/wayland-core are broken in BOTH directions, and the harm is live:
 * of seven wayland issues named by a closing keyword in a merged wayland-core
 * PR, two were still open six weeks later. GitHub only auto-closes an issue in
 * the SAME repository as the PR, and it reports nothing when it ignores a
 * cross-repo closing keyword - the author reads a green merge as a close.
 *
 * Two mechanical patterns, no judgement calls:
 *   1. A bare `#N` whose N exceeds this repo's highest issue/PR number. It
 *      cannot resolve here, so it is a reference to the other repo written in
 *      the local form. Must be `owner/repo#N`.
 *   2. A closing keyword followed by a cross-repo reference. GitHub silently
 *      ignores it. Must be demoted to a plain mention plus a manual close.
 */
const OPTS = { owner: 'FerroxLabs', repo: 'wayland', maxLocalNumber: 1200 };

function rules(body: string, opts = OPTS): string[] {
  return lintCrossRepoRefs(body, opts).violations.map((v: { rule: string }) => v.rule);
}

describe('lintCrossRepoRefs - rule 1: unresolvable bare ref', () => {
  it('flags a bare #N above this repo highest number', () => {
    const result = lintCrossRepoRefs('Follows up on #4321 in the engine.', OPTS);
    expect(result.ok).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].rule).toBe('unresolvable-bare-ref');
    expect(result.violations[0].ref).toBe('#4321');
    // The message must say how to rewrite it, not merely that it is wrong.
    expect(result.violations[0].message).toContain('FerroxLabs/wayland-core#4321');
  });

  it('accepts a bare #N that resolves in this repo', () => {
    expect(rules('Fixes #1001 and relates to #928.')).toEqual([]);
    expect(rules('Edge: exactly the highest number, #1200.')).toEqual([]);
  });

  it('accepts the same reference written in qualified form', () => {
    expect(rules('Follows up on FerroxLabs/wayland-core#4321 in the engine.')).toEqual([]);
  });

  it('ignores # sequences that are not issue refs', () => {
    expect(rules('Heading\n\n# Title\n\nColour #1a2b3c, id abc#4321, C# notes.')).toEqual([]);
  });

  it('ignores refs inside fenced code blocks and inline code', () => {
    const body = ['Prose is linted.', '', '```sh', 'git log --grep "#9999"', '```', '', 'Inline `#9999` too.'].join(
      '\n'
    );
    expect(rules(body)).toEqual([]);
  });
});

describe('lintCrossRepoRefs - rule 2: cross-repo closing keyword', () => {
  it('flags every closing keyword GitHub honours', () => {
    for (const kw of CLOSING_KEYWORDS) {
      const result = lintCrossRepoRefs(`${kw} FerroxLabs/wayland-core#42`, OPTS);
      expect(result.violations.map((v: { rule: string }) => v.rule)).toEqual(['cross-repo-closing-keyword']);
    }
  });

  it('is case-insensitive and tolerates the colon form', () => {
    expect(rules('FIXES: FerroxLabs/wayland-core#42')).toEqual(['cross-repo-closing-keyword']);
    expect(rules('resolves ferroxlabs/wayland-core#42')).toEqual(['cross-repo-closing-keyword']);
  });

  it('flags the full-URL form of the same mistake', () => {
    expect(rules('Closes https://github.com/FerroxLabs/wayland-core/issues/42')).toEqual([
      'cross-repo-closing-keyword',
    ]);
  });

  it('tells the author exactly how to rewrite it', () => {
    const [violation] = lintCrossRepoRefs('Closes FerroxLabs/wayland-core#42', OPTS).violations;
    expect(violation.message).toContain('FerroxLabs/wayland-core#42');
    expect(violation.message.toLowerCase()).toContain('close');
  });

  it('accepts a closing keyword on a SAME-repo reference in either form', () => {
    expect(rules('Fixes #928')).toEqual([]);
    expect(rules('Fixes FerroxLabs/wayland#928')).toEqual([]);
    expect(rules('Fixes https://github.com/FerroxLabs/wayland/issues/928')).toEqual([]);
  });

  it('accepts a cross-repo reference with no closing keyword', () => {
    expect(rules('Depends on FerroxLabs/wayland-core#42.')).toEqual([]);
    expect(rules('See FerroxLabs/wayland-core#42 for the engine half.')).toEqual([]);
  });

  it('ignores a closing keyword inside a fenced code block', () => {
    expect(rules(['```', 'Closes FerroxLabs/wayland-core#42', '```'].join('\n'))).toEqual([]);
  });
});

describe('lintCrossRepoRefs - input handling', () => {
  it('treats an empty or absent body as clean', () => {
    expect(lintCrossRepoRefs('', OPTS).ok).toBe(true);
    expect(lintCrossRepoRefs(null, OPTS).ok).toBe(true);
    expect(lintCrossRepoRefs(undefined, OPTS).ok).toBe(true);
  });

  it('reports both rules when a body trips both', () => {
    const body = 'Closes FerroxLabs/wayland-core#42\nAlso see #4321.';
    expect(rules(body).sort()).toEqual(['cross-repo-closing-keyword', 'unresolvable-bare-ref']);
  });

  it('reports the 1-based line number of each violation', () => {
    const body = 'line one\nline two\nCloses FerroxLabs/wayland-core#42';
    expect(lintCrossRepoRefs(body, OPTS).violations[0].line).toBe(3);
  });

  it('refuses to evaluate rule 1 without a usable maxLocalNumber (fail closed)', () => {
    // A missing highest-number lookup must not silently downgrade to "clean".
    expect(() => lintCrossRepoRefs('#4321', { owner: 'FerroxLabs', repo: 'wayland' })).toThrow(/maxLocalNumber/);
  });
});
