/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WHERE THE BUNDLED SKILL ACTUALLY WRITES, BY RUNNING ITS OWN COMMANDS.
 *
 * The skill used to compute its destination as
 * `OUT="${WAYLAND_OUTPUT_DIR:-$PWD/<output_dir>}"`. `WAYLAND_OUTPUT_DIR` is set
 * on the ENGINE process and the engine does not forward it to Bash tool calls -
 * proven by executing `wayland-core sandbox exec` on both the shipped v0.13.3
 * and the pinned v0.13.4, which printed an empty value for it while
 * `WAYLAND_HOME` came back populated as the known-positive control. So the
 * `$PWD` fallback ALWAYS won, the brief landed outside the run's staging
 * directory, `collectStagedPaths` found nothing, and the run settled
 * `no-output`.
 *
 * The destination now arrives as TEXT (the `--system-prompt` deliverables
 * directive), so the block takes an absolute path the agent substitutes. This
 * file proves that by EXECUTING the block verbatim out of the shipped SKILL.md,
 * against a fake scanner tree at the exact workspace-relative path the skill
 * names. The `cd` in the middle of that block is the whole hazard: a relative
 * output path resolved after it lands inside `.wayland-core/`.
 *
 * The env var is now asserted to be IRRELEVANT rather than absent - each case
 * runs with a decoy `WAYLAND_OUTPUT_DIR` pointing somewhere else, so a block
 * that quietly started reading it again fails here.
 */

import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const SKILL = path.join(REPO_ROOT, 'src/process/resources/bundled-workflows/bodies/wayland-morning-report/SKILL.md');

/** Workspace-relative home of the bundled scanner, as the skill names it. */
const SCANNER_REL = '.wayland-core/skills/market-open-report';

/** The fenced shell block that runs the scan, verbatim. */
function scanCommandBlock(): string {
  const markdown = readFileSync(SKILL, 'utf-8');
  const blocks = [...markdown.matchAll(/```(?:bash|sh|shell|zsh)\n([\s\S]*?)```/g)].map((m) => m[1]);
  const block = blocks.find((b) => b.includes('morning-report.mjs'));
  if (!block) throw new Error('No shell block running the scanner was found in the morning-report SKILL.md');
  return block;
}

/**
 * Substitute the one placeholder the agent substitutes: the absolute
 * deliverables directory its run instructions name.
 */
function resolvePlaceholders(block: string, deliverablesDir: string): string {
  const out = block.split('<deliverables_dir>').join(deliverablesDir);
  const left = out.match(/<[a-z_]+>/);
  if (left) throw new Error(`Unsubstituted placeholder ${left[0]} - the skill names an input nothing supplies`);
  return out;
}

/**
 * A stand-in for the two bundled node scripts, at the workspace-relative path
 * the skill `cd`s into. Each writes the file the skill told it to write, so
 * WHERE the file lands is decided by the skill's own `OUT=` line and nothing
 * else.
 */
function installFakeScanner(workspace: string): void {
  const scripts = path.join(workspace, SCANNER_REL, 'scripts');
  mkdirSync(scripts, { recursive: true });
  writeFileSync(
    path.join(scripts, 'morning-report.mjs'),
    [
      "import { writeFileSync } from 'fs';",
      "const i = process.argv.indexOf('--json');",
      "if (i < 0) { console.error('no --json'); process.exit(2); }",
      'writeFileSync(process.argv[i + 1], \'{"symbols":[]}\');',
      "console.log('20 names scanned');",
    ].join('\n'),
    'utf-8'
  );
  writeFileSync(
    path.join(scripts, 'briefHtml.mjs'),
    [
      "import { writeFileSync } from 'fs';",
      'writeFileSync(process.argv[3], "<html>TC-TIDE MORNING REPORT</html>");',
    ].join('\n'),
    'utf-8'
  );
}

/**
 * Run the skill's block from the workspace root, as the engine spawns it.
 *
 * `WAYLAND_OUTPUT_DIR` is set to a DECOY on every run. The product does not
 * forward it, and the block must not read it - pointing it somewhere the brief
 * must never appear turns "does not read it" into something the filesystem can
 * answer.
 */
function runBlock(block: string, workspace: string, decoy: string): void {
  execFileSync('bash', ['-c', block], {
    cwd: workspace,
    env: { ...process.env, WAYLAND_OUTPUT_DIR: decoy } as NodeJS.ProcessEnv,
    stdio: 'pipe',
  });
}

/** Every file under `dir`, relative and POSIX-separated. */
async function tree(dir: string, prefix = ''): Promise<string[]> {
  const out: string[] = [];
  const entries = await fsp.readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...(await tree(path.join(dir, entry.name), rel)));
    else out.push(rel);
  }
  return out;
}

describe('the bundled morning-report skill writes where the run can publish from', () => {
  let workspace: string;
  let decoy: string;

  beforeEach(async () => {
    workspace = await fsp.mkdtemp(path.join(os.tmpdir(), 'wl-mr-skill-'));
    decoy = await fsp.mkdtemp(path.join(os.tmpdir(), 'wl-mr-decoy-'));
    installFakeScanner(workspace);
  });

  afterEach(async () => {
    await fsp.rm(workspace, { recursive: true, force: true });
    await fsp.rm(decoy, { recursive: true, force: true });
  });

  it("lands the brief in this run's staging directory when the directive names one", async () => {
    // Exactly the shape `beginTaskRun` hands the spawn: an absolute path at
    // `<workspace>/artifacts/<series>/.staging/<run-id>`.
    const staging = path.join(workspace, 'artifacts', 'market', '.staging', 'r-test-run');
    await fsp.mkdir(staging, { recursive: true });

    runBlock(resolvePlaceholders(scanCommandBlock(), staging), workspace, decoy);

    expect((await tree(staging)).toSorted()).toEqual(['morning-brief.html', 'mr.json']);
    // And nowhere else: not in the hidden engine tree, not in the series root
    // the user reads (only a PUBLISHED run may put a file there), and above all
    // not wherever the ignored environment variable pointed.
    expect(await tree(path.join(workspace, SCANNER_REL))).toEqual([
      'scripts/briefHtml.mjs',
      'scripts/morning-report.mjs',
    ]);
    expect(existsSync(path.join(workspace, 'artifacts', 'market', 'morning-brief.html'))).toBe(false);
    expect(await tree(decoy)).toEqual([]);
  });

  it('creates the directory when it does not exist yet', async () => {
    const staging = path.join(workspace, 'artifacts', 'market', '.staging', 'not-there-yet');
    expect(existsSync(staging)).toBe(false);

    runBlock(resolvePlaceholders(scanCommandBlock(), staging), workspace, decoy);

    expect((await tree(staging)).toSorted()).toEqual(['morning-brief.html', 'mr.json']);
    expect(await tree(decoy)).toEqual([]);
  });

  it('resolves the destination BEFORE the cd, so nothing lands under .wayland-core', async () => {
    // The block ends up inside `.wayland-core/skills/market-open-report`. A
    // destination resolved after that `cd` puts the brief in a hidden engine
    // directory the Workbench never lists - the report exists and the user
    // never sees it.
    const block = scanCommandBlock();
    const outLine = block.split('\n').findIndex((l) => l.includes('OUT='));
    const cdLine = block.split('\n').findIndex((l) => l.trimStart().startsWith('cd '));
    expect(outLine).toBeGreaterThanOrEqual(0);
    expect(cdLine).toBeGreaterThan(outLine);
  });

  it('quotes mastheads the shipped scripts actually emit', () => {
    // A model told to look for a line that does not exist either floods the
    // thread with a hunt or invents the date. Both mastheads the skill quotes
    // are checked against the template in the shipped script that prints them.
    const markdown = readFileSync(SKILL, 'utf-8');
    const scanner = readFileSync(
      path.join(REPO_ROOT, 'src/process/resources/skills/market-open-report/scripts/report.mjs'),
      'utf-8'
    );
    const html = readFileSync(
      path.join(REPO_ROOT, 'src/process/resources/skills/market-open-report/scripts/briefHtml.mjs'),
      'utf-8'
    );

    expect(markdown).toContain('TC-TIDE MORNING REPORT   Tier 1   bar YYYY-MM-DD');
    expect(scanner).toContain('TC-TIDE MORNING REPORT   Tier ${tier}   bar ${bar}');

    // The HTML brief carries its own, differently worded header - and it is the
    // one that states FRESHNESS, which is the whole reason the skill has to
    // name it: a stale close reads exactly like a live quote.
    expect(markdown).toContain('closes through');
    expect(markdown).toContain('generated');
    expect(html).toContain('closes through ');
    expect(html).toContain(', generated ');

    // KNOWN-POSITIVE CONTROL: these files are the real ones and the predicate
    // bites - a masthead the scripts do NOT emit is not found.
    expect(scanner).not.toContain('TC-TIDE EVENING REPORT');
    expect(scanner.length).toBeGreaterThan(1000);
    expect(html.length).toBeGreaterThan(1000);
  });

  it('no longer reads WAYLAND_OUTPUT_DIR and has no $PWD fallback', () => {
    const block = scanCommandBlock();
    expect(block).not.toContain('WAYLAND_OUTPUT_DIR');
    expect(block).not.toContain('$PWD');
    // KNOWN-POSITIVE CONTROL: the predicates bite on the shape that shipped.
    const shipped = 'OUT="${WAYLAND_OUTPUT_DIR:-$PWD/artifacts/market}"';
    expect(shipped).toContain('WAYLAND_OUTPUT_DIR');
    expect(shipped).toContain('$PWD');
  });
});
