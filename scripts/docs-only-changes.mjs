#!/usr/bin/env node
/**
 * docs-only-changes.mjs — the single authority on "is this PR docs-only?".
 *
 * WHY THIS EXISTS (read before changing the pattern list):
 *
 * `main`'s required checks are `Code Quality` and `Unit Tests (<os>)` x3. Those
 * names used to be published by TWO workflows: the real `pr-checks.yml` and a
 * `pr-checks-docs.yml` whose unit-test jobs were literal
 * `echo "Docs-only PR, skipping unit tests."` steps.
 *
 * The docs workflow triggered on `paths: ['**\/*.md', ...]`, and GitHub `paths:`
 * fires when ANY changed file matches — it does NOT mean "only these changed".
 * So a mixed PR (code + one markdown file) ran both workflows and the stub
 * reported green under the required names. Proven live on PR #925: 7 of 8 unit
 * shards FAILING while all three required `Unit Tests (...)` checks said PASS.
 *
 * The obvious fix — gate the stub jobs on an `if:` — does not work, because
 * GitHub counts a SKIPPED required check as a PASS (see the load-bearing
 * `always()` comment on the aggregator jobs in pr-checks.yml). A skipped stub is
 * still a green stub.
 *
 * So the required check names now have exactly ONE owner: `pr-checks.yml`. It
 * runs on every PR (no `paths-ignore`), asks this script whether the PR is
 * docs-only, and skips only the EXPENSIVE work when it is. The aggregators
 * always run and always stamp a real verdict.
 *
 * That also means this file is the only copy of the docs-path list in the repo.
 * There is no second list to drift out of sync with, which is what caused the
 * bug in the first place.
 *
 * Fail-closed by design: anything not provably docs runs the full suite. An
 * empty diff is NOT docs-only.
 *
 * Usage:
 *   node scripts/docs-only-changes.mjs --base <sha> --head <sha>
 *   node scripts/docs-only-changes.mjs --files <newline-separated-file>
 *
 * Writes `docs_only=true|false` to $GITHUB_OUTPUT when that env var is set.
 */

import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';

/**
 * Paths that cannot change what the application does when it runs.
 *
 * Deliberately NOT here: `.github/workflows/**`. A PR that only edits CI must
 * run the full suite — that is exactly the PR most able to break the gate.
 */
export const DOCS_SUFFIXES = ['.md'];
export const DOCS_PREFIXES = [
  'docs/',
  'design-mockups/',
  '.planning/',
  '.blackboard/',
  '.vscode/',
  '.github/ISSUE_TEMPLATE/',
];

/** True when a single changed path cannot affect built/run behaviour. */
export function isDocsPath(file) {
  if (typeof file !== 'string' || file.length === 0) return false;
  const path = file.replace(/\\/g, '/');
  if (DOCS_SUFFIXES.some((suffix) => path.toLowerCase().endsWith(suffix))) return true;
  return DOCS_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/**
 * @param {string[]} files changed paths, relative to the repo root
 * @returns {{ docsOnly: boolean, docsFiles: string[], codeFiles: string[] }}
 */
export function classifyChangedFiles(files) {
  const changed = (files ?? []).map((f) => f.trim()).filter((f) => f.length > 0);
  const docsFiles = changed.filter((f) => isDocsPath(f));
  const codeFiles = changed.filter((f) => !isDocsPath(f));
  // An empty diff is not a licence to skip the suite.
  return { docsOnly: changed.length > 0 && codeFiles.length === 0, docsFiles, codeFiles };
}

function changedFilesFromGit(base, head) {
  const mergeBase = execFileSync('git', ['merge-base', base, head], { encoding: 'utf8' }).trim();
  const out = execFileSync('git', ['diff', '--name-only', `${mergeBase}..${head}`], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.split('\n');
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    if (key) args[key] = argv[i + 1];
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = args.files ? readFileSync(args.files, 'utf8').split('\n') : changedFilesFromGit(args.base, args.head);

  const { docsOnly, docsFiles, codeFiles } = classifyChangedFiles(files);

  console.log(`changed files: ${docsFiles.length + codeFiles.length}`);
  console.log(`docs paths:    ${docsFiles.length}`);
  console.log(`code paths:    ${codeFiles.length}`);
  if (codeFiles.length > 0) {
    console.log('\nnon-docs paths that require the full suite (first 20):');
    for (const f of codeFiles.slice(0, 20)) console.log(`  ${f}`);
  }
  console.log(`\ndocs_only=${docsOnly}`);

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `docs_only=${docsOnly}\n`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
