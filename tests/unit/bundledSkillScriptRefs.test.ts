import { existsSync, readFileSync, readdirSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

/**
 * A bundled skill that tells the agent to run a script it does not ship fails
 * in the worst possible way: the SKILL.md reads perfectly, the agent runs the
 * line with complete confidence, and the shell answers "No such file or
 * directory" on a user's machine. Nothing in CI ever sees it, because nothing
 * in CI runs the skill.
 *
 * This is not hypothetical. TVControl's `pine-develop` skill ships inside the
 * connector's npm package, where `scripts/pine_pull.js` and
 * `scripts/pine_push.js` sit beside it. Bundled into Wayland, the SKILL.md
 * came across and the scripts did not - they depend on `chrome-remote-interface`,
 * which Wayland does not carry - so every `node scripts/pine_push.js` in it was
 * dead on arrival.
 *
 * `marketOpenReportScriptRefs.test.ts` already guards this for ONE skill,
 * against a hand-maintained list of three documents. A skill added later is not
 * on that list and is therefore unguarded, which is exactly how pine-develop
 * would have shipped. This sweeps the whole bundled corpus instead, so the
 * guard covers a skill the day it lands rather than the day someone remembers
 * to add it.
 */
const RESOURCES = path.resolve(__dirname, '../../src/process/resources');
const SKILLS = path.join(RESOURCES, 'skills');

/** Fence languages whose contents are commands an agent will actually run. */
const SHELL_FENCE = /^(bash|sh|shell|zsh|console|terminal)$/i;

/** Extensions that mean "this token is a script file", not a flag or a symbol. */
const SCRIPT_EXT = /\.(mjs|cjs|js|ts|sh|py)$/;

/** Interpreter invocations: `node x.mjs`, `bash x.sh`, `python3 x.py`, ... */
const INVOCATION = /(?:^|[\s;&|(])(?:node|bun|bash|sh|zsh|python3?)\s+(?:"([^"]+)"|'([^']+)'|([^\s"'`;)|&]+))/g;

/**
 * Shell-ish text in a markdown doc: fenced shell blocks plus inline `code`
 * spans that read as a command. Both are real: `story-roleplay` puts its
 * invocations in fences, `star-office-helper` puts some in inline spans.
 */
function shellCandidates(markdown: string): Array<{ line: number; text: string }> {
  const out: Array<{ line: number; text: string }> = [];
  let inShell = false;
  markdown.split('\n').forEach((raw, i) => {
    const fence = raw.match(/^\s*```(\S*)/);
    if (fence) {
      inShell = inShell ? false : SHELL_FENCE.test(fence[1]);
      return;
    }
    if (inShell) out.push({ line: i + 1, text: raw });
  });
  markdown.split('\n').forEach((raw, i) => {
    for (const m of raw.matchAll(/`([^`]+)`/g)) {
      if (/(^|[;&|]\s*)(node|bun|bash|sh|zsh|python3?)\s/.test(m[1])) out.push({ line: i + 1, text: m[1] });
    }
  });
  return out;
}

interface Reference {
  skill: string;
  doc: string;
  line: number;
  token: string;
}

function collectMarkdown(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.md')) out.push(full);
    }
  };
  walk(root);
  return out;
}

function collectReferences(): Reference[] {
  const refs: Reference[] = [];
  for (const file of collectMarkdown(SKILLS)) {
    const skill = path.relative(SKILLS, file).split(path.sep)[0];
    for (const { line, text } of shellCandidates(readFileSync(file, 'utf-8'))) {
      for (const m of text.matchAll(INVOCATION)) {
        const token = m[1] ?? m[2] ?? m[3];
        if (!token || !SCRIPT_EXT.test(token)) continue;
        // A variable-expanded or home-relative path is not statically checkable.
        if (/[$~*]/.test(token)) continue;
        refs.push({ skill, doc: path.relative(RESOURCES, file).replace(/\\/g, '/'), line, token });
      }
    }
  }
  return refs;
}

/**
 * Where a documented script path resolves. Two anchors are real, both in use:
 *
 *  - `skills/<name>/...` is written from the RESOURCES root, because
 *    `initStorage.ts` rewrites the `skills/` prefix to the seeded user skills
 *    directory when it copies preset rule and skill files.
 *  - anything else is relative to the skill's own directory, which is the cwd
 *    the SKILL.md tells the agent to `cd` into.
 */
/** The engine stages every enabled skill under `<workspace>/.wayland-core/skills/<id>/`. */
const WORKSPACE_SKILLS_PREFIX = '.wayland-core/skills/';

function resolveReference(ref: Reference): string {
  if (ref.token.startsWith('skills/')) return path.join(RESOURCES, ref.token);
  // A CROSS-SKILL reference: one skill running a script that ships inside
  // another, named by the path the engine actually stages it at. Resolved
  // against the skills root rather than the naming skill's own directory,
  // which is why this is not an exemption - it checks a reference the old
  // resolver could only ever have reported as missing.
  if (ref.token.startsWith(WORKSPACE_SKILLS_PREFIX)) {
    return path.join(SKILLS, ref.token.slice(WORKSPACE_SKILLS_PREFIX.length));
  }
  return path.join(SKILLS, ref.skill, ref.token);
}

/**
 * Scripts the agent CREATES before running, keyed `<skill>::<token>` with the
 * reason. These are not shipped and must not be: the document generates them.
 * Keyed per-skill so a NEW unshipped script in an already-listed skill still
 * fails.
 */
const AGENT_AUTHORED = new Map<string, string>([
  [
    'officecli-xlsx::gen_batch.py',
    'the python fence immediately above the invocation is the script; the agent writes it, then runs it',
  ],
  [
    'story-roleplay::parse-character-card.js',
    'the parser is obtained in an earlier step of the same skill; "Step 3: Execute Parser" runs what step 2 produced',
  ],
]);

describe('every script a bundled skill tells the agent to run is actually shipped', () => {
  const references = collectReferences();

  it('the sweep reaches the corpus, so a green result is not an empty one', () => {
    // Guard against a silent SHRINK, not just a silent zero: a regex change
    // that stopped matching fenced blocks would drop most of these and still
    // report success. Measured on this tree: 23 references across 7 skills.
    expect(references.length).toBeGreaterThan(15);
    expect(new Set(references.map((r) => r.skill)).size).toBeGreaterThan(4);
  });

  it('names no script that does not exist on disk', () => {
    const missing = references
      .filter((ref) => !AGENT_AUTHORED.has(`${ref.skill}::${ref.token}`))
      .filter((ref) => !existsSync(resolveReference(ref)))
      .map((ref) => `${ref.doc}:${ref.line}: names ${ref.token}, which is not shipped`);
    expect(missing).toEqual([]);
  });

  /**
   * An allowlist entry that no longer matches anything is worse than no entry:
   * it is a standing exemption for a path nobody checks. If a skill stops
   * naming its agent-authored script, the entry has to go with it.
   */
  it('carries no stale exemption', () => {
    const seen = new Set(references.map((ref) => `${ref.skill}::${ref.token}`));
    const stale = [...AGENT_AUTHORED.keys()].filter((key) => !seen.has(key));
    expect(stale).toEqual([]);
  });

  /**
   * POSITIVE CONTROL, in the same test as the refusal above. `existsSync` on a
   * path built the wrong way returns false for everything, which would make the
   * refusal test pass by never being able to find anything. This proves the
   * resolver locates a script that IS shipped, through the same code path.
   */
  it('resolves a script that IS shipped, so the check can tell the two apart', () => {
    const shipped = references.filter((ref) => existsSync(resolveReference(ref)));
    expect(shipped.length).toBeGreaterThan(10);
    // Both anchors, exercised: skill-relative and RESOURCES-relative.
    expect(shipped.some((ref) => ref.token.startsWith('scripts/'))).toBe(true);
    expect(shipped.some((ref) => ref.token.startsWith('skills/'))).toBe(true);
  });
});
