import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

/**
 * The morning-report skill is the one bundled skill that ships real executable
 * scripts, and nothing else in the suite touches it. That combination is how a
 * rename silently breaks it: the skill keeps its tests green, the assistant
 * keeps confidently printing a `node scripts/...` line, and the command only
 * fails on a user's machine.
 *
 * Two failure modes are covered here, both found by running the skill rather
 * than reading it:
 *
 *  1. A DOCUMENT naming a script that does not exist. Three separate files tell
 *     the agent what to run — the skill's own SKILL.md, the Smart Trader
 *     persona, and the scheduled workflow body — and each was written by hand.
 *
 *  2. A sibling IMPORT pointing at a filename that no longer exists. These
 *     scripts are ES modules with the `.mjs` extension, which is what tells
 *     Node the module type without a package.json. Renaming one and missing an
 *     importer throws at load, so the report never starts.
 */
const REPO_ROOT = path.resolve(__dirname, '../..');
const SKILL_DIR = path.join(REPO_ROOT, 'src/process/resources/skills/market-open-report');
const SCRIPTS_DIR = path.join(SKILL_DIR, 'scripts');

/** Every `node scripts/<name>` invocation a document tells the agent to run. */
const scriptCommandsIn = (markdown: string): string[] =>
  [...markdown.matchAll(/node\s+(?:[\w./-]*\/)?scripts\/([\w.-]+)/g)].map((m) => m[1]);

/** Documents that instruct an agent to run this skill's scripts. */
const DOCS_NAMING_SCRIPTS = [
  'src/process/resources/skills/market-open-report/SKILL.md',
  'src/process/resources/assistant/smart-trader/smart-trader.md',
  'src/process/resources/bundled-workflows/bodies/wayland-morning-report/SKILL.md',
] as const;

describe('market-open-report script references', () => {
  it('ships the scripts directory', () => {
    expect(existsSync(SCRIPTS_DIR)).toBe(true);
  });

  /**
   * A `.js` file here would be read as CommonJS, because the repo's package.json
   * declares no module type. Newer Node rescues it by sniffing the syntax; older
   * Node throws a SyntaxError at the first import and the report never runs.
   * The extension is what removes the guesswork.
   */
  it('every script is a .mjs module, so Node never has to guess the module type', () => {
    const stray = readdirSync(SCRIPTS_DIR).filter((f) => f.endsWith('.js'));
    expect(stray).toEqual([]);
  });

  it.each(DOCS_NAMING_SCRIPTS)('every script named in %s exists', (relativeDoc) => {
    const markdown = readFileSync(path.join(REPO_ROOT, relativeDoc), 'utf-8');
    const named = scriptCommandsIn(markdown);
    // A document that names no script would pass vacuously, which would quietly
    // retire the guard the day someone reformats the instructions.
    expect(named.length).toBeGreaterThan(0);
    const missing = named.filter((name) => !existsSync(path.join(SCRIPTS_DIR, name)));
    expect(missing).toEqual([]);
  });

  /**
   * The skill shipped ten scripts and NO data, while the code defaulted to a
   * watchlist path that only ever existed in a private checkout. On a fresh
   * install the report therefore had nothing to scan - and this is the first
   * thing a new user is shown, so it failing is the whole first impression.
   */
  it('ships the default watchlist and positions file the scripts fall back to', async () => {
    const { DEFAULT_LIST, DEFAULT_POSITIONS } = await import(path.join(SCRIPTS_DIR, 'report.mjs'));
    expect(existsSync(DEFAULT_LIST)).toBe(true);
    expect(existsSync(DEFAULT_POSITIONS)).toBe(true);

    // A header plus real rows: an empty file would resolve and still scan nothing.
    const rows = readFileSync(DEFAULT_LIST, 'utf-8').trim().split('\n');
    expect(rows[0]).toContain('symbol');
    expect(rows.length).toBeGreaterThan(10);
  });

  it('every sibling import inside the scripts resolves to a real file', () => {
    const broken: string[] = [];
    for (const file of readdirSync(SCRIPTS_DIR).filter((f) => f.endsWith('.mjs'))) {
      const source = readFileSync(path.join(SCRIPTS_DIR, file), 'utf-8');
      for (const match of source.matchAll(/from\s+'(\.\/[^']+)'/g)) {
        const specifier = match[1];
        if (!existsSync(path.join(SCRIPTS_DIR, specifier))) broken.push(`${file} -> ${specifier}`);
      }
    }
    expect(broken).toEqual([]);
  });
});
