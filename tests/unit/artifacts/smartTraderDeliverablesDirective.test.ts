/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * C-2. THE CROSS-LANE HANDOFF NEITHER LANE COULD MAKE.
 *
 * The morning-report lane proved that a bundled document which COMPUTES its own
 * deliverables destination files the user's report where nothing collects it,
 * and it fixed that for the scheduled `wayland-morning-report` workflow: the
 * document now takes the absolute directory its run instructions name, and it
 * refuses `WAYLAND_OUTPUT_DIR` out loud (the engine runs Bash tool calls through
 * a 19-name env allowlist that excludes it, so every `${WAYLAND_OUTPUT_DIR:-…}`
 * silently took its fallback).
 *
 * `smart-trader.md` carried the SAME defect in a DIFFERENT namespace and was
 * owned by the other lane, so neither lane could close it. In an interactive
 * chat there is no run, so `buildEngineSpawnEnv` selects the CHAT namespace -
 * `<workspace>/artifacts/chat/<conversationId>` - and `buildOutputDirective`
 * names exactly that directory on `--system-prompt`. The persona's own command
 * block pinned `OUT="$PWD/artifacts/market"`, which resolves to
 * `<workspace>/artifacts/market`: a real, correctly-anchored, WORKSPACE-visible
 * directory that the chat this brief was produced in never collects from. The
 * brief is written, it is not hidden, and no artifact card ever appears.
 *
 * NOTHING HERE IS SPELLED BY THE TEST. The destination is read off the REAL
 * `buildEngineSpawnEnv` for a real temp workspace, the candidate is read off the
 * SHIPPED markdown, and the shipped `OUT=` line is EXECUTED by bash with
 * `cwd: workspace` - the same cwd `WCoreAgent` spawns the engine with - rather
 * than pattern-matched. A document that takes the directory it is handed
 * computes nothing at all, and that is the passing state.
 */

import { execFileSync } from 'child_process';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'fs';
import os from 'os';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildEngineSpawnEnv, buildOutputDirective } from '../../../src/process/agent/wcore/envBuilder';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const SMART_TRADER = path.join(REPO_ROOT, 'src/process/resources/assistant/smart-trader/smart-trader.md');
const CONVERSATION = 'conv-c2-fixture';

/** The placeholder a document uses for "the absolute directory you were handed". */
const DELIVERABLES_PLACEHOLDER = '<deliverables_dir>';

/** The line that shipped, kept verbatim as the known-positive control. */
const SHIPPED_DEFECT_LINE = 'OUT="$PWD/artifacts/market"; mkdir -p "$OUT"';

const SHELL_FENCE = /^(bash|sh|shell|zsh|console|terminal)$/i;

function shellFenceLines(markdown: string): string[] {
  const out: string[] = [];
  let inShell = false;
  for (const raw of markdown.split('\n')) {
    const fence = raw.match(/^\s*```(\S*)/);
    if (fence) {
      inShell = inShell ? false : SHELL_FENCE.test(fence[1]);
      continue;
    }
    if (inShell) out.push(raw);
  }
  return out;
}

/**
 * The POSIX shell that will actually run the shipped line. On Windows there is
 * no `/bin/bash`, so an absolute POSIX path makes this guard un-runnable there -
 * and a guard that cannot execute is a guard that silently does not guard.
 * It THROWS rather than skipping: this control is the only thing in the file
 * that exercises the shell at all, so skipping it would leave the suite green
 * while measuring nothing.
 */
function posixBash(): string {
  if (process.platform !== 'win32') return '/bin/bash';
  const candidates = ['C:\\Program Files\\Git\\bin\\bash.exe', 'C:\\Program Files (x86)\\Git\\bin\\bash.exe'];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    'No POSIX bash found to evaluate the shipped SKILL.md command line. ' +
      'This guard cannot be skipped silently - install Git for Windows.'
  );
}

/**
 * What the line ACTUALLY resolves to, by running it. `null` means the document
 * computed nothing - it is taking the absolute directory it was handed, which
 * is the only shape that cannot resolve somewhere the host does not collect.
 *
 * Executed with `cwd: workspace` because that is where the engine child starts
 * (`src/process/agent/wcore/index.ts` spawns with `cwd: workspace`), which is
 * what makes `$PWD` on the first line the workspace root.
 */
function resolvedDestination(outLine: string, workspace: string): string | null {
  if (outLine.includes(DELIVERABLES_PLACEHOLDER)) return null;
  // `$PWD` is asked for alongside `$OUT` because a POSIX shell on Windows is
  // Git Bash, which reports its own MSYS mount (`/tmp/...`) rather than the
  // Windows spelling Node built the workspace path with. Same directory, two
  // spellings. Re-anchoring on the shell's OWN idea of cwd makes the comparison
  // spelling-independent without weakening it: a destination that resolves
  // OUTSIDE the workspace is still returned verbatim, so it cannot accidentally
  // equal an expected in-workspace path and must fail loudly.
  const script = `${outLine.replace(/mkdir[^;]*/g, 'true')}\nprintf '%s\\n%s' "$OUT" "$PWD"`;
  const [out, pwd] = execFileSync(posixBash(), ['-c', script], {
    cwd: workspace,
    encoding: 'utf-8',
  }).split('\n');
  if (out === pwd) return workspace;
  if (!out.startsWith(`${pwd}/`)) return out;
  return path.join(workspace, out.slice(pwd.length + 1));
}

describe('C-2: the Smart Trader persona files its brief where the CHAT collects from', () => {
  let workspace: string;

  beforeAll(() => {
    // Realpath'd: a non-raw spawn runs under `withWCoreProjectConfigLease`,
    // which hands `start()` the canonical workspace, so `/var/...` becomes
    // `/private/var/...` on macOS and the lexical spelling would compare unequal
    // to a working spawn.
    workspace = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'wl-c2-ws-')));
  });

  afterAll(() => {
    rmSync(workspace, { recursive: true, force: true });
  });

  it('KNOWN-POSITIVE CONTROL: the predicate bites on the line that shipped', () => {
    const chatDir = buildEngineSpawnEnv({
      providerEnv: {},
      workspace,
      conversationId: CONVERSATION,
    }).WAYLAND_OUTPUT_DIR;
    // The control resolves to a real, workspace-visible, correctly-anchored
    // directory - and it is still the WRONG one, which is the whole point.
    const resolved = resolvedDestination(SHIPPED_DEFECT_LINE, workspace);
    expect(resolved).toBe(path.join(workspace, 'artifacts', 'market'));
    expect(resolved).not.toBe(chatDir);
  });

  it('the chat namespace really is where a chat deliverable is collected', () => {
    // Read off the production env builder, then off the production directive.
    // Neither half is rebuilt by this test; the assertion is that they AGREE.
    const chatDir = buildEngineSpawnEnv({
      providerEnv: {},
      workspace,
      conversationId: CONVERSATION,
    }).WAYLAND_OUTPUT_DIR;
    expect(chatDir).toBe(path.join(workspace, 'artifacts', 'chat', CONVERSATION));
    expect(buildOutputDirective(chatDir)).toContain(chatDir);
  });

  it('the shipped persona computes no destination of its own', () => {
    const markdown = readFileSync(SMART_TRADER, 'utf-8');
    const anchors = shellFenceLines(markdown).filter((line) => /\bOUT=/.test(line));
    // Guard against a silent zero: if the block is ever renamed away, this test
    // must fail rather than quietly assert nothing.
    expect(anchors.length).toBeGreaterThanOrEqual(1);

    const chatDir = buildEngineSpawnEnv({
      providerEnv: {},
      workspace,
      conversationId: CONVERSATION,
    }).WAYLAND_OUTPUT_DIR;

    const offenders: string[] = [];
    for (const anchor of anchors) {
      const resolved = resolvedDestination(anchor, workspace);
      if (resolved !== null && resolved !== chatDir) {
        offenders.push(`"${anchor.trim()}" resolves to ${resolved}, which a chat never collects from`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('refuses WAYLAND_OUTPUT_DIR by name, the way the morning-report workflow does', () => {
    const markdown = readFileSync(SMART_TRADER, 'utf-8');
    // The prose must REFUSE it, so a model carrying the old habit is corrected
    // rather than left with an unchallenged prior.
    expect(markdown).toMatch(/Do not read `WAYLAND_OUTPUT_DIR`/);
    expect(markdown).toMatch(/absolute deliverables directory/i);
    // And the EXECUTED text must not mention it at all.
    expect(shellFenceLines(markdown).join('\n')).not.toContain('WAYLAND_OUTPUT_DIR');
  });
});
