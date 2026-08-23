/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * B13 - THE RUN TOLD THE USER A PATH THAT NO LONGER EXISTED.
 * B15 - AND ENDED ON TWO FAILED SIDE-ERRANDS INSTEAD OF ON THE BRIEF.
 *
 * B13. Both complete runs named
 * `artifacts/market/.staging/<runId>/morning-brief.html`. Follow it and you
 * find nothing, because the staging directory IS the run: `commitRun` publishes
 * by RENAMING it onto the dated run directory, and a run that staged nothing is
 * `abandonRun`'d, which removes the tree outright. Either way the path stops
 * existing at the instant of publication.
 *
 * AND THE MODEL CANNOT KNOW BETTER, because publication happens on the idle
 * callback AFTER the turn ends. The model writes its message before the
 * published path exists. So any instruction to "name the path" can only ever
 * name the doomed one. This is an ordering fact, not a model-obedience problem.
 *
 * TWO PLACES SAID IT, and the second is the one nobody had looked at:
 *   1. the bundled workflow body, Step 4 item 4, "Name the brief's full path";
 *   2. `buildOutputDirective` - the HOST's own `--system-prompt` clause, "When
 *      you refer to a saved deliverable in your final message, name its path
 *      inside <dir>", where <dir> IS the staging directory on a scheduled run.
 * Fixing only the body would leave the app itself still asking for it. The
 * clause is correct for a CHAT, whose deliverables directory is permanent, and
 * that case is a known positive below rather than collateral damage.
 *
 * B15. The body asked the run to "prune the Yahoo cache" and gave no command,
 * so the model reached for the GNU idiom `head -n -N`, which BSD head rejects
 * (`head: illegal line count -- -3`, confirmed on this machine). An errand with
 * no way to do it is an error in the user's morning report.
 *
 * THE HALVES OF THIS FILE ARE NOT EQUAL AND ARE LABELLED SO. The corpus halves
 * prove a string exists in a document, which is advice. The production halves
 * assert the same facts against the real `beginTaskRun` / `commitTaskRun` and
 * the real `buildOutputDirective`, and against `/bin/sh` actually executing the
 * command the body prints.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { beginTaskRun, commitTaskRun } from '@process/services/artifacts/taskRun';
import { buildOutputDirective, resolveOutputDir } from '@process/agent/wcore/envBuilder';

const BODY = path.resolve(
  __dirname,
  '../../src/process/resources/bundled-workflows/bodies/wayland-morning-report/SKILL.md'
);

function body(): string {
  return readFileSync(BODY, 'utf8');
}

/** Step 4 is the reporting step; everything this file cares about lives in it. */
function stepFour(md: string): string {
  const start = md.indexOf('**Step 4:');
  expect(start, 'the body must still have a Step 4').toBeGreaterThan(-1);
  return md.slice(start);
}

const dirs: string[] = [];
function tmp(prefix: string): string {
  const d = mkdtempSync(path.join(tmpdir(), prefix));
  dirs.push(d);
  return d;
}
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop() as string, { recursive: true, force: true });
});

describe('CORPUS: the routine body does not ask for a path that will be deleted', () => {
  it('Step 4 forbids printing the deliverables directory and names the file instead', () => {
    const s4 = stepFour(body());
    // Known positive first: this search CAN find things in this block.
    expect(s4).toContain('morning-brief.html');
    expect(s4).not.toContain('full path');
    expect(s4).toContain('Do not print the deliverables directory');
  });

  it('the Ground rules say the run instructions directory is not a durable address', () => {
    const md = body();
    const rules = md.slice(md.indexOf('## Ground rules'), md.indexOf('## Steps'));
    expect(rules).toContain('staging directory'); // known positive: the phrase is in scope
    expect(rules).toContain('deleted the moment the run publishes');
  });
});

describe('PRODUCTION: publication destroys the staging directory it published from', () => {
  it('the path the run wrote into does not exist once commitTaskRun resolves', async () => {
    const workspace = tmp('b13-ws-');
    const dataDir = tmp('b13-data-');
    const handle = await beginTaskRun({ workspace, taskId: 'job-b13', series: 'market' });

    // The run's own deliverable, written where the run was told to write it.
    writeFileSync(path.join(handle.stagingDir, 'morning-brief.html'), '<html>brief</html>', 'utf8');
    expect(existsSync(handle.stagingDir)).toBe(true); // known positive

    const outcome = await commitTaskRun(handle, {
      ledgerPath: path.join(dataDir, 'artifact-ledger.jsonl'),
      declaredBy: 'test',
    });

    expect(outcome.published).toBe(true);
    if (!outcome.published) return;

    // THE FACT THE DOCTRINE ENCODES: the address the model had is gone, and the
    // file is somewhere it never saw.
    expect(existsSync(handle.stagingDir)).toBe(false);
    expect(existsSync(path.join(outcome.publication.runDir, 'morning-brief.html'))).toBe(true);
  });
});

describe("PRODUCTION: the host's own system prompt stops asking for the doomed path", () => {
  it('a scheduled run is told NOT to name its deliverables directory', () => {
    const workspace = tmp('b13-run-');
    const staging = path.join(workspace, 'artifacts', 'market', '.staging', 'r1');
    mkdirSync(staging, { recursive: true });

    const dir = resolveOutputDir(workspace, staging, 'conv1');
    expect(dir).toBe(path.resolve(staging)); // known positive: the run's dir was accepted

    const directive = buildOutputDirective(dir, { ephemeral: true });
    expect(directive).toContain(dir); // it still tells the model where to WRITE
    expect(directive).not.toContain('name its path inside');
    expect(directive).toContain('name the file');
  });

  it('KNOWN POSITIVE: a chat is still told to name the path, because a chat directory is permanent', () => {
    const workspace = tmp('b13-chat-');
    const dir = resolveOutputDir(workspace, undefined, 'conv1');
    expect(dir).toContain(path.join('artifacts', 'chat', 'conv1'));

    const directive = buildOutputDirective(dir);
    expect(directive).toContain('name its path inside');
  });
});

describe('CORPUS + EXECUTION: the body never asks for a command this machine cannot run', () => {
  // CHARACTERISATION, and labelled as one: this assertion is GREEN today. The
  // `head -n -N` in the user's report was INVENTED by the model, not copied out
  // of the body, so there was never a literal here to go red. It is kept as a
  // regression guard - its mutation (paste `head -n -200` back in) is what
  // proves it can fail at all.
  it('contains no GNU-only shell idiom', () => {
    const md = body();
    for (const idiom of ['head -n -', 'tail -n -', '-printf', 'date -d ', 'sed -i ']) {
      expect(md, `GNU-only idiom "${idiom}" is in the body`).not.toContain(idiom);
    }
    // Known positive: this search finds shell text that IS in the body.
    expect(md).toContain('mkdir -p');
  });

  it('EXECUTED: every shell command block in the body parses under /bin/sh', () => {
    const md = body();
    const blocks = [...md.matchAll(/```(?:bash|sh|shell|zsh)\n([\s\S]*?)```/g)].map((m) => m[1]);
    expect(blocks.length).toBeGreaterThan(0); // known positive
    const dir = tmp('b13-sh-');
    for (const [i, block] of blocks.entries()) {
      const f = path.join(dir, `block${i}.sh`);
      writeFileSync(f, block, 'utf8');
      // `sh -n` is a parse, not a run: these blocks reference a workspace that
      // does not exist here. A GNU-only FLAG parses fine, which is exactly why
      // the assertion above exists as well as this one.
      execFileSync('/bin/sh', ['-n', f]);
    }
  });

  it('EXECUTED: no errand is asked for without a command that runs on this machine', () => {
    const md = body();
    // An ASK, not a prohibition: "Do not prune the cache" is the fix, not the
    // bug, so a negated line is excluded. The bug is an imperative with no
    // command behind it.
    const asks = (md.match(/^.*\bprune\b.*$/gim) ?? []).filter(
      (l) => !l.trim().startsWith('#') && !/\b(?:do not|don't|never|not)\s+\w*\s*prune\b/i.test(l)
    );
    if (asks.length === 0) return; // deleted - the recommended outcome, and what shipped

    // Kept? Then it must come with a command, and that command must run here.
    // "Prune the cache if it has grown large", with no command, is how the
    // model came to invent `head -n -N`.
    const cmd = (md.match(/```(?:bash|sh)\n([^`]*\bprune\b[^`]*)```/) ?? [])[1];
    expect(cmd, `the body asks to prune (${asks[0].trim()}) but gives no command block`).toBeTruthy();
    const dir = tmp('b13-prune-');
    for (let i = 0; i < 40; i++) writeFileSync(path.join(dir, `f${i}.json`), '[]', 'utf8');
    execFileSync('/bin/sh', ['-c', cmd as string], { cwd: dir });
  });
});
