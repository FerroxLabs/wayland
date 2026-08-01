/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
// @ts-expect-error - .mjs script has no type declarations
import { classifyChangedFiles, isDocsPath } from '../../../scripts/docs-only-changes.mjs';

/**
 * Guards the fix for the #925 required-checks bypass.
 *
 * `main` requires `Code Quality` + `Unit Tests (<os>)`. A deleted
 * pr-checks-docs.yml used to publish those names as echo jobs whenever ANY
 * changed file matched `paths: ['**\/*.md', ...]` — which on a mixed PR meant the
 * required checks went green while the real shards were failing.
 *
 * This classifier is now the single authority on that decision, so the mixed-PR
 * case below is the regression test for the bypass itself.
 */
describe('classifyChangedFiles', () => {
  it('refuses docs-only for a mixed PR (the #925 bypass)', () => {
    const result = classifyChangedFiles(['README.md', 'src/process/services/AuthService.ts']);
    expect(result.docsOnly).toBe(false);
    expect(result.codeFiles).toEqual(['src/process/services/AuthService.ts']);
  });

  it('accepts a genuinely docs-only PR', () => {
    const result = classifyChangedFiles(['README.md', 'docs/guide.md', '.planning/HANDOFF.md']);
    expect(result.docsOnly).toBe(true);
    expect(result.codeFiles).toEqual([]);
  });

  it('treats an empty diff as NOT docs-only (fail closed)', () => {
    expect(classifyChangedFiles([]).docsOnly).toBe(false);
    expect(classifyChangedFiles(['', '  ']).docsOnly).toBe(false);
    expect(classifyChangedFiles(undefined).docsOnly).toBe(false);
  });

  it('never classifies a single code file as docs-only', () => {
    expect(classifyChangedFiles(['package.json']).docsOnly).toBe(false);
    expect(classifyChangedFiles(['scripts/docs-only-changes.mjs']).docsOnly).toBe(false);
  });
});

describe('isDocsPath', () => {
  it('requires the full suite for CI changes — a workflow edit is not docs', () => {
    // The PR most able to break the gate must never be able to skip it.
    expect(isDocsPath('.github/workflows/pr-checks.yml')).toBe(false);
    expect(isDocsPath('.github/actions/checkout-pr/action.yml')).toBe(false);
    expect(classifyChangedFiles(['.github/workflows/pr-checks.yml']).docsOnly).toBe(false);
  });

  it('classifies markdown anywhere as docs, case-insensitively', () => {
    expect(isDocsPath('README.md')).toBe(true);
    expect(isDocsPath('src/deeply/nested/NOTES.MD')).toBe(true);
  });

  it('classifies the non-shipped directories as docs', () => {
    expect(isDocsPath('docs/architecture.png')).toBe(true);
    expect(isDocsPath('design-mockups/cockpit.fig')).toBe(true);
    expect(isDocsPath('.planning/phases/plan.json')).toBe(true);
    expect(isDocsPath('.blackboard/notes.txt')).toBe(true);
    expect(isDocsPath('.vscode/settings.json')).toBe(true);
    expect(isDocsPath('.github/ISSUE_TEMPLATE/bug.yml')).toBe(true);
  });

  it('does not match a directory prefix partially', () => {
    expect(isDocsPath('docsx/evil.ts')).toBe(false);
    expect(isDocsPath('src/docs/helper.ts')).toBe(false);
    expect(isDocsPath('mdformat.ts')).toBe(false);
  });

  it('normalizes Windows separators', () => {
    expect(isDocsPath('docs\\guide\\intro.md')).toBe(true);
    expect(isDocsPath('.vscode\\settings.json')).toBe(true);
  });

  it('rejects non-string and empty input', () => {
    expect(isDocsPath('')).toBe(false);
    expect(isDocsPath(undefined)).toBe(false);
    expect(isDocsPath(null)).toBe(false);
  });
});
