/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WHERE THE BUNDLED SKILL ACTUALLY WRITES, BY RUNNING ITS OWN COMMANDS.
 *
 * `WAYLAND_OUTPUT_DIR` is exported into every engine spawn and, on a scheduled
 * run, points at that run's STAGING directory - the only place a deliverable
 * can be published from. Every other test of it asserts the env var is built;
 * none asserted that anything READS it, and nothing did: the bundled skill text
 * named `$PWD/<output_dir>` instead, so a scheduled run staged nothing, the run
 * was abandoned as empty, and "tomorrow show me both days" had one day forever.
 *
 * A grep for the variable name would pass on a mention in prose. So this
 * EXECUTES the skill's own Step 2 command block, verbatim out of the shipped
 * SKILL.md with only the `<placeholder>` inputs substituted the way the agent
 * substitutes them, against a fake scanner tree at the exact workspace-relative
 * path the skill names. The `cd` in the middle of that block is the whole
 * hazard: a relative output path resolved after it lands inside `.wayland-core/`.
 */

import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const SKILL = path.join(
  REPO_ROOT,
  'src/process/resources/bundled-workflows/bodies/wayland-morning-report/SKILL.md'
);
const ROUTINES = path.join(REPO_ROOT, 'src/process/resources/bundled-workflows/routines.json');

/** Workspace-relative home of the bundled scanner, as the skill names it. */
const SCANNER_REL = '.wayland-core/skills/market-open-report';

type Routine = { id: string; inputs?: Record<string, string> };

function morningReportRoutine(): Routine {
  const routines = JSON.parse(readFileSync(ROUTINES, 'utf-8')) as Routine[];
  const routine = routines.find((r) => r.id === 'weekday-morning-report');
  if (!routine) throw new Error('weekday-morning-report is missing from routines.json');
  return routine;
}

/** The fenced shell block that runs the scan, verbatim. */
function scanCommandBlock(): string {
  const markdown = readFileSync(SKILL, 'utf-8');
  const blocks = [...markdown.matchAll(/```(?:bash|sh|shell|zsh)\n([\s\S]*?)```/g)].map((m) => m[1]);
  const block = blocks.find((b) => b.includes('MARKET_OPEN_REPORT_LIST'));
  if (!block) throw new Error('No shell block running the scanner was found in the morning-report SKILL.md');
  return block;
}

/** Substitute the `<name>` placeholders from the routine's own declared inputs. */
function resolvePlaceholders(block: string, inputs: Record<string, string>): string {
  let out = block;
  for (const [key, value] of Object.entries(inputs)) out = out.split(`<${key}>`).join(value);
  const left = out.match(/<[a-z_]+>/);
  if (left) throw new Error(`Unsubstituted placeholder ${left[0]} - routines.json no longer names it`);
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
      "writeFileSync(process.argv[i + 1], '{\"symbols\":[]}');",
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

/** Run the skill's block from the workspace root, as the engine spawns it (cwd: workspace). */
function runBlock(block: string, workspace: string, env: Record<string, string | undefined>): void {
  execFileSync('bash', ['-c', block], {
    cwd: workspace,
    env: { ...process.env, ...env } as NodeJS.ProcessEnv,
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

  beforeEach(async () => {
    workspace = await fsp.mkdtemp(path.join(os.tmpdir(), 'wl-mr-skill-'));
    installFakeScanner(workspace);
  });

  afterEach(async () => {
    await fsp.rm(workspace, { recursive: true, force: true });
  });

  it("lands the brief in this run's staging directory when WAYLAND_OUTPUT_DIR names one", async () => {
    // Exactly the shape `beginTaskRun` hands the spawn: an absolute path at
    // `<workspace>/artifacts/<series>/.staging/<run-id>`.
    const staging = path.join(workspace, 'artifacts', 'market', '.staging', 'r-test-run');
    await fsp.mkdir(staging, { recursive: true });

    runBlock(resolvePlaceholders(scanCommandBlock(), morningReportRoutine().inputs ?? {}), workspace, {
      WAYLAND_OUTPUT_DIR: staging,
    });

    expect((await tree(staging)).toSorted()).toEqual(['morning-brief.html', 'mr.json']);
    // And nowhere else: not in the hidden engine tree, not in the series root
    // the user reads (only a PUBLISHED run may put a file there).
    expect(await tree(path.join(workspace, SCANNER_REL))).toEqual([
      'scripts/briefHtml.mjs',
      'scripts/morning-report.mjs',
    ]);
    expect(existsSync(path.join(workspace, 'artifacts', 'market', 'morning-brief.html'))).toBe(false);
  });

  it('falls back to the routine\'s workspace-relative output_dir when the variable is absent', async () => {
    runBlock(resolvePlaceholders(scanCommandBlock(), morningReportRoutine().inputs ?? {}), workspace, {
      WAYLAND_OUTPUT_DIR: undefined,
    });

    const fallback = path.join(workspace, 'artifacts', 'market');
    expect((await tree(fallback)).toSorted()).toEqual(['morning-brief.html', 'mr.json']);
    expect(await tree(path.join(workspace, SCANNER_REL))).toEqual([
      'scripts/briefHtml.mjs',
      'scripts/morning-report.mjs',
    ]);
  });

  it('ignores an inherited WAYLAND_OUTPUT_DIR that is empty rather than writing to /', async () => {
    runBlock(resolvePlaceholders(scanCommandBlock(), morningReportRoutine().inputs ?? {}), workspace, {
      WAYLAND_OUTPUT_DIR: '',
    });

    expect((await tree(path.join(workspace, 'artifacts', 'market'))).toSorted()).toEqual([
      'morning-brief.html',
      'mr.json',
    ]);
  });
});
