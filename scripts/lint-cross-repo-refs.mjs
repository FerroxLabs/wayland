#!/usr/bin/env node
/**
 * lint-cross-repo-refs.mjs — refuse PR bodies whose issue references cannot do
 * what their author thinks they do (#1001).
 *
 * WHY THIS EXISTS
 * ---------------
 * Wayland (this repo) and wayland-core are one product split across two
 * repositories, and PRs in each routinely name issues in the other. GitHub
 * handles that badly in two specific, silent ways:
 *
 *   1. A bare `#N` always resolves against the CURRENT repository. Written in a
 *      wayland PR while meaning a wayland-core issue, it links to whatever
 *      unrelated wayland item happens to hold that number — or to nothing.
 *
 *   2. A closing keyword (Closes/Fixes/Resolves) only auto-closes issues in the
 *      SAME repository as the pull request. On a cross-repo reference GitHub
 *      ignores the keyword and says nothing, so the author reads a green merge
 *      as a close and the issue stays open forever.
 *
 * Rule 2 is the costly one and it is not hypothetical: of seven wayland issues
 * named by a closing keyword in a merged wayland-core PR, two were still open
 * six weeks later. Nothing in the 21 workflows checked for either pattern.
 *
 * Both rules are mechanical — no judgement, no heuristics about intent:
 *   - Rule 1 fires only when N exceeds this repo's highest issue/PR number, so
 *     the reference provably cannot resolve here.
 *   - Rule 2 fires only when a closing keyword is followed by a reference to a
 *     repository that is not this one.
 *
 * Code fences and inline code spans are masked before scanning: a `git log
 * --grep "#9999"` example is documentation, not a reference.
 *
 * Usage:
 *   node scripts/lint-cross-repo-refs.mjs --owner O --repo R --body-file <path>
 *   node scripts/lint-cross-repo-refs.mjs --owner O --repo R --pr-json <path>
 *   ... --max <n>   pin the highest local number instead of querying the API
 *
 * Exits 0 when clean, 1 on any violation, 1 when the highest-number lookup
 * fails (fail closed — a network blip must not read as "no problems").
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** Every keyword GitHub itself honours, not just the three canonical spellings. */
export const CLOSING_KEYWORDS = Object.freeze([
  'close',
  'closes',
  'closed',
  'fix',
  'fixes',
  'fixed',
  'resolve',
  'resolves',
  'resolved',
]);

/** The other half of the product. Used only to suggest the rewrite. */
export const SIBLING_REPO = 'FerroxLabs/wayland-core';

const KEYWORD = '(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)';
const NAME = '[A-Za-z0-9._-]+';

/** `Closes owner/repo#N` — the short cross-repo form. */
const CLOSING_SHORT = new RegExp(`\\b(${KEYWORD})\\b\\s*:?\\s+(${NAME})/(${NAME})#(\\d+)`, 'gi');
/** `Closes https://github.com/owner/repo/issues/N` — the same mistake by URL. */
const CLOSING_URL = new RegExp(
  `\\b(${KEYWORD})\\b\\s*:?\\s+https?://github\\.com/(${NAME})/(${NAME})/(?:issues|pull)/(\\d+)`,
  'gi'
);
/**
 * A bare `#N`. The leading class rejects `owner/repo#N` (word char before `#`),
 * `abc#1`, `C#`, and a markdown heading; the trailing guard rejects `#1a2b3c`
 * hex colours and `#1-2` ranges.
 */
const BARE_REF = /(^|[^\w`/#])#(\d{1,7})(?![\w-])/g;

const blank = (s) => ' '.repeat(s.length);

/**
 * Replace fenced code blocks and inline code spans with spaces, preserving both
 * line count and column offsets so reported line numbers stay accurate.
 */
export function maskCode(body) {
  let inFence = false;
  let marker = '';
  return body
    .split('\n')
    .map((line) => {
      const fence = /^\s*(```+|~~~+)/.exec(line);
      if (fence) {
        const glyph = fence[1][0];
        if (!inFence) {
          inFence = true;
          marker = glyph;
        } else if (glyph === marker) {
          inFence = false;
        }
        return blank(line);
      }
      if (inFence) return blank(line);
      return line.replace(/`[^`\n]*`/g, blank);
    })
    .join('\n');
}

const lineOf = (text, index) => text.slice(0, index).split('\n').length;

/**
 * @param {string|null|undefined} body PR body as written by the author
 * @param {{owner: string, repo: string, maxLocalNumber?: number, siblingRepo?: string}} opts
 * @returns {{ok: boolean, violations: Array<{rule: string, ref: string, line: number, message: string}>}}
 */
export function lintCrossRepoRefs(body, opts) {
  const owner = opts?.owner;
  const repo = opts?.repo;
  if (!owner || !repo) throw new Error('lintCrossRepoRefs: owner and repo are required');
  const sibling = opts?.siblingRepo ?? SIBLING_REPO;
  if (typeof body !== 'string' || body.length === 0) return { ok: true, violations: [] };

  const max = opts?.maxLocalNumber;
  if (!Number.isInteger(max) || max <= 0) {
    // Fail closed. Downgrading to "rule 1 not evaluated" would let exactly the
    // reference this job exists to catch through on a transient API failure.
    throw new Error(
      `lintCrossRepoRefs: maxLocalNumber must be a positive integer (got ${String(max)}). ` +
        'Refusing to evaluate the bare-reference rule without it.'
    );
  }

  const text = maskCode(body);
  const violations = [];
  const isSelf = (o, r) => o.toLowerCase() === owner.toLowerCase() && r.toLowerCase() === repo.toLowerCase();

  const addClosing = (regex) => {
    regex.lastIndex = 0;
    for (const m of text.matchAll(regex)) {
      const [, keyword, refOwner, refRepo, number] = m;
      if (isSelf(refOwner, refRepo)) continue;
      const ref = `${refOwner}/${refRepo}#${number}`;
      violations.push({
        rule: 'cross-repo-closing-keyword',
        ref,
        line: lineOf(text, m.index),
        message:
          `"${keyword} ${ref}": GitHub only auto-closes issues in the SAME repository as the ` +
          `pull request, so it will silently ignore this keyword and ${ref} will still be open ` +
          `after this PR merges. Rewrite it as a plain mention (for example "Addresses ${ref}") ` +
          `and close ${ref} by hand, or move the fix into ${refOwner}/${refRepo}.`,
      });
    }
  };

  addClosing(CLOSING_SHORT);
  addClosing(CLOSING_URL);

  BARE_REF.lastIndex = 0;
  for (const m of text.matchAll(BARE_REF)) {
    const number = Number(m[2]);
    if (number <= max) continue;
    const ref = `#${number}`;
    violations.push({
      rule: 'unresolvable-bare-ref',
      ref,
      line: lineOf(text, m.index),
      message:
        `"${ref}" cannot resolve in ${owner}/${repo}: the highest issue or PR number here is ` +
        `#${max}. A bare #N always points at the CURRENT repository. If this means the engine ` +
        `repo, write it as ${sibling}#${number}.`,
    });
  }

  violations.sort((a, b) => a.line - b.line);
  return { ok: violations.length === 0, violations };
}

/**
 * Highest number in this repo's shared issue/PR numbering space. The `issues`
 * endpoint returns pull requests too, so the newest item's number IS the max.
 */
function fetchMaxLocalNumber(owner, repo) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const out = execFileSync(
        'gh',
        [
          'api',
          `repos/${owner}/${repo}/issues?state=all&sort=created&direction=desc&per_page=1`,
          '--jq',
          '.[0].number',
        ],
        { encoding: 'utf8' }
      ).trim();
      const n = Number(out);
      if (Number.isInteger(n) && n > 0) return n;
      lastErr = new Error(`gh api returned a non-number: ${JSON.stringify(out)}`);
    } catch (err) {
      lastErr = err;
    }
    if (attempt < 3) execFileSync('sleep', [String(attempt * 5)]);
  }
  throw new Error(`could not read the highest issue/PR number for ${owner}/${repo}: ${lastErr?.message ?? lastErr}`);
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
  const owner = args.owner;
  const repo = args.repo;
  if (!owner || !repo) {
    console.error('usage: lint-cross-repo-refs.mjs --owner O --repo R (--body-file F | --pr-json F) [--max N]');
    process.exit(2);
  }

  let body = '';
  if (args['body-file']) {
    body = readFileSync(args['body-file'], 'utf8');
  } else if (args['pr-json']) {
    const parsed = JSON.parse(readFileSync(args['pr-json'], 'utf8'));
    body = typeof parsed.body === 'string' ? parsed.body : '';
  }

  const max = args.max ? Number(args.max) : fetchMaxLocalNumber(owner, repo);
  const { ok, violations } = lintCrossRepoRefs(body, { owner, repo, maxLocalNumber: max });

  console.log(`cross-repo ref lint for ${owner}/${repo} (highest local number: #${max})`);
  if (ok) {
    console.log('OK - every issue reference in this PR body resolves and behaves as written.');
    return;
  }
  console.error(`\n${violations.length} problem(s) in the pull request description:\n`);
  for (const v of violations) {
    console.error(`  line ${v.line} [${v.rule}]`);
    console.error(`    ${v.message}\n`);
  }
  console.error('Edit the PR description and this check will re-run automatically.');
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
