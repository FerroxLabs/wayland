/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import type { ChildProcess } from 'child_process';
import { execFile as execFileCb } from 'child_process';
import type { AcpModelInfo } from '@/common/types/acpTypes';
import { promisify } from 'util';
import * as fs from 'fs';
import { promises as fsAsync } from 'fs';
import * as os from 'os';
import * as path from 'path';

const execFile = promisify(execFileCb);

// ── Process utilities ───────────────────────────────────────────────

/** Check whether a process with the given PID is still running. */
export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Poll until a process exits or the timeout expires. */
export async function waitForProcessExit(pid: number, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (!isProcessAlive(pid)) {
      return;
    }
    // oxlint-disable-next-line no-await-in-loop -- bounded polling must observe process exit sequentially
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/**
 * Kill a child process with platform-specific handling.
 * Windows: taskkill tree kill. POSIX: collect descendants → SIGTERM → SIGKILL escalation.
 *
 * `sigtermGraceMs` is how long to wait for a graceful SIGTERM exit before
 * escalating to SIGKILL (default 3s). It is parameterised so tests that spawn a
 * real SIGTERM-ignoring process can use a short grace instead of paying the full
 * 3s real-time wait (#358).
 */
export async function killChild(child: ChildProcess, isDetached: boolean, sigtermGraceMs = 3000): Promise<void> {
  const pid = child.pid;
  if (process.platform === 'win32' && pid) {
    // Enumerate BEFORE killing anything, same reason as the POSIX path below.
    let plan: Win32KillPlan | null = null;
    try {
      plan = await collectWin32KillPlan(pid);
    } catch {
      // DELIBERATE ASYMMETRY WITH POSIX, WHICH FAILS CLOSED HERE.
      // On POSIX, enumeration failure aborts because the group kill is
      // imprecise anyway. On Windows the fallback IS the previous shipped
      // behaviour, so failing closed would regress #139 (orphaned trees) on any
      // host where PowerShell is unavailable or blocked by policy. Falling back
      // costs the chart, never correctness.
      plan = null;
    }

    if (plan === null) {
      try {
        await execFile('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true, timeout: 5000 });
      } catch (forceError) {
        throw new Error(`ACP process-tree shutdown failed for PID ${pid}: ${decodeWindowsError(forceError)}`, {
          cause: forceError,
        });
      }
    } else {
      // The tree walk is ours, so an exempt subtree is never handed to taskkill.
      // But the walk is a SNAPSHOT, so anything spawned after it is in no list -
      // `/T` is what kills those, and it is safe on any subtree proven
      // exempt-free. Nodes on the path down to an exempt process get a bare
      // `/F`, because `/T` there would take the chart with them.
      const runTaskkill = async (args: string[]): Promise<void> => {
        try {
          await execFile('taskkill', args, { windowsHide: true, timeout: 5000 });
        } catch (forceError) {
          // taskkill exits non-zero when ANY listed pid has already gone, which
          // is routine during teardown. Liveness below is the proof, not exit
          // status.
          if (isProcessAlive(pid)) {
            throw new Error(`ACP process-tree shutdown failed for PID ${pid}: ${decodeWindowsError(forceError)}`, {
              cause: forceError,
            });
          }
        }
      };

      if (plan.treeKill.length > 0) {
        await runTaskkill(['/F', '/T', ...plan.treeKill.flatMap((p) => ['/PID', String(p)])]);
      }
      // Deepest-first, root last.
      const rest = [...plan.single].reverse();
      rest.push(pid);
      await runTaskkill(['/F', ...rest.flatMap((p) => ['/PID', String(p)])]);

      for (const dpid of plan.pruned) {
        await waitForProcessExit(dpid, 2000);
        if (isProcessAlive(dpid)) {
          throw new Error(`ACP descendant process ${dpid} is still alive after SIGKILL escalation`);
        }
      }
    }

    await waitForProcessExit(pid, 2000);
    if (isProcessAlive(pid)) {
      throw new Error(`ACP process ${pid} is still alive after taskkill`);
    }
    return;
  }

  // POSIX: collect all descendant PIDs BEFORE killing the parent,
  // because once the parent dies, orphans get reparented to PID 1
  // and we can no longer discover them via ppid.
  const descendantPids = pid ? await collectDescendantPids(pid) : [];

  if (isDetached && pid) {
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      child.kill('SIGTERM');
    }
  } else {
    child.kill('SIGTERM');
  }

  if (pid) {
    await waitForProcessExit(pid, sigtermGraceMs);

    // Escalate to SIGKILL if the process ignored SIGTERM
    if (isProcessAlive(pid)) {
      console.warn(`[ACP] Process ${pid} did not exit after SIGTERM, escalating to SIGKILL`);
      try {
        if (isDetached) {
          process.kill(-pid, 'SIGKILL');
        } else {
          process.kill(pid, 'SIGKILL');
        }
      } catch {
        // Process may have exited between the check and the kill
      }
      await waitForProcessExit(pid, 2000);
    }
    if (isProcessAlive(pid)) {
      throw new Error(`ACP process ${pid} is still alive after SIGKILL escalation`);
    }
  }

  // Force-kill any descendants that survived (escaped the process group)
  await Promise.all(
    descendantPids.map(async (dpid) => {
      try {
        if (isProcessAlive(dpid)) {
          process.kill(dpid, 'SIGKILL');
        }
      } catch {
        // Already exited
      }
      await waitForProcessExit(dpid, 2000);
      if (isProcessAlive(dpid)) {
        throw new Error(`ACP descendant process ${dpid} is still alive after SIGKILL escalation`);
      }
    })
  );
}

/**
 * Applications a connector may launch ON THE USER'S BEHALF, which outlive the
 * engine that started them.
 *
 * WHY THIS EXISTS. The engine is disposable: `WorkerTaskManager` reaps an idle
 * one five minutes after the user hits send (WorkerTaskManager.ts:20, and the
 * clock is `sendMessage`, not the reply - WCoreManager.ts:1106). Tearing it down
 * runs the descendant sweep below, and a chart application launched by an MCP
 * connector is a GRANDCHILD of that engine, so it was being SIGKILLed between
 * turns. Measured twice: the app died 5.3 and 5.5 minutes after a turn, with
 * nothing touching it. The user set up a chart, read the guide for five minutes,
 * asked their next question, and their work was gone.
 *
 * Nothing was misbehaving - the reaper frees memory as designed and the sweep
 * satisfies #139 as designed. The defect is that a USER-FACING application was
 * ever a descendant of a disposable process.
 *
 * CLOSED WORLD, ON PURPOSE. This is an exact-match list of application binaries,
 * not a connector-supplied allowlist: a connector that could nominate its own
 * exemptions would be an untracked persistence escape for any MCP server. Adding
 * an entry here is a deliberate, reviewable act.
 *
 * SCOPE. macOS only - NOT "POSIX", which is what this said before and was wrong.
 * The regex needs an absolute path, and only macOS's `ps -eo comm=` prints one.
 * On Linux the same field prints a bare process name, truncated to 15 chars
 * (TASK_COMM_LEN) - verified on Ubuntu 24.04, where a binary at
 * /Applications/TradingView.app/Contents/MacOS/TradingView reports simply
 * `TradingView`. So this pattern can never match on Linux and the exemption is
 * inert there: a Linux chart is still killed with the engine, exactly as before
 * the fix. That is a known gap, not a regression, and there is a test asserting
 * it so CI is not blind to it. The correct Linux identity is
 * `readlink /proc/<pid>/exe` - NOT `ps -eo args=`, which is argv-spoofable and
 * would defeat the reason `comm` was chosen here.
 * Windows has its own implementation below.
 *
 * IDENTITY IS BY ABSOLUTE PATH, AND THAT IS A TRANSITIONAL CHECK. The pattern is
 * anchored at `^/Applications/` so a binary in a user-writable directory cannot
 * dress itself up as an exempt app - an unanchored suffix match would let
 * anything under `/tmp/TradingView.app/...` claim the exemption. A path still
 * identifies a CLASS of application rather than one process; binding to the
 * code-signing identity belongs with the supervisor that replaces this.
 * Consequence, accepted: a non-standard install (e.g. ~/Applications) is simply
 * not exempt, which is exactly today's behaviour rather than a regression.
 */
const EXTERNAL_GUI_APP_BINARIES = [
  /^\/Applications\/TradingView\.app\/Contents\/MacOS\/TradingView( Helper( \(.*\))?)?$/,
];

function isExternalGuiApp(command: string): boolean {
  return EXTERNAL_GUI_APP_BINARIES.some((re) => re.test(command));
}

/**
 * The BFS and the prune, split out from process enumeration so it can be tested
 * against a synthetic `ps` table. A real fixture is impossible here: macOS
 * Gatekeeper SIGKILLs any hand-made `.app` bundle whose signature identifier
 * does not match, and Linux CI has no bundles at all.
 */
export function _collectDescendantPidsFromPsTable(psStdout: string, rootPid: number): number[] {
  return _collectDescendantPidsFromProcTable(psStdout, rootPid, isExternalGuiApp);
}

/**
 * The BFS and the prune, parameterised by the exemption predicate so macOS and
 * Windows share one traversal. The row shape is identical on both platforms by
 * construction - `pid ppid path`, path last - which is why the Windows
 * enumeration below is shaped to match `ps -eo pid=,ppid=,comm=` rather than
 * emitting CSV that would need a second parser.
 */
export function _collectDescendantPidsFromProcTable(
  psStdout: string,
  rootPid: number,
  isExempt: (command: string) => boolean
): number[] {
  const childMap = new Map<number, number[]>();
  const commandOf = new Map<number, string>();
  for (const line of psStdout.trim().split('\n')) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) continue;
    const pid = parseInt(parts[0], 10);
    const ppid = parseInt(parts[1], 10);
    if (isNaN(pid) || isNaN(ppid)) continue;
    commandOf.set(pid, parts.slice(2).join(' '));
    if (!childMap.has(ppid)) childMap.set(ppid, []);
    childMap.get(ppid)!.push(pid);
  }

  const result: number[] = [];
  const queue = [rootPid];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const child of childMap.get(current) || []) {
      if (isExempt(commandOf.get(child) ?? '')) {
        // Leave it, and its helpers, running for the user. Do NOT enqueue.
        continue;
      }
      result.push(child);
      queue.push(child);
    }
  }
  return result;
}

/**
 * What to hand taskkill, split by whether `/T` is safe.
 *
 * WHY THIS EXISTS. Dropping `/T` in favour of an explicit PID list made the kill
 * a POINT-IN-TIME SNAPSHOT: anything spawned between `win32ProcessTable()` and
 * the taskkill is in no list and nothing sweeps the tree, so it SURVIVES. The
 * snapshot is shared with a 1s TTL (WIN32_TABLE_TTL_MS), so that window is up to
 * a second wide. It shipped as "packaged app left descendant processes alive" on
 * two Windows arches in the v0.12.6 release; v0.12.5 was clean.
 *
 * `/T` is what closes the window, and it is safe exactly where no exempt process
 * sits beneath the target - taskkill's own tree walk cannot be told to skip one.
 * So: `/T` every subtree that is exempt-free, and fall back to a bare `/F` for
 * the few nodes on the path DOWN to an exempt process. With no chart running the
 * exempt set is empty, nothing is tainted, and this is a plain tree-kill again.
 */
export interface Win32KillPlan {
  /** Subtree roots proven exempt-free - `/T` here, so late spawns die too. */
  treeKill: number[];
  /** Ancestors of an exempt process - killed alone, or `/T` takes the chart. */
  single: number[];
  /** Every pid expected dead afterwards; the liveness proof still covers all. */
  pruned: number[];
}

export function _win32KillPlanFromProcTable(
  psStdout: string,
  rootPid: number,
  isExempt: (command: string) => boolean
): Win32KillPlan {
  const childMap = new Map<number, number[]>();
  const commandOf = new Map<number, string>();
  for (const line of psStdout.trim().split('\n')) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) continue;
    const pid = parseInt(parts[0], 10);
    const ppid = parseInt(parts[1], 10);
    if (isNaN(pid) || isNaN(ppid)) continue;
    commandOf.set(pid, parts.slice(2).join(' '));
    if (!childMap.has(ppid)) childMap.set(ppid, []);
    childMap.get(ppid)!.push(pid);
  }

  const exemptPid = (pid: number): boolean => isExempt(commandOf.get(pid) ?? '');

  // Memoised: a process table has hundreds of rows and this is asked once per
  // node, so the naive form is quadratic on the teardown path.
  const taintCache = new Map<number, boolean>();
  const hasExemptBelow = (pid: number): boolean => {
    const cached = taintCache.get(pid);
    if (cached !== undefined) return cached;
    let tainted = false;
    for (const child of childMap.get(pid) || []) {
      if (exemptPid(child) || hasExemptBelow(child)) {
        tainted = true;
        break;
      }
    }
    taintCache.set(pid, tainted);
    return tainted;
  };

  const treeKill: number[] = [];
  const single: number[] = [];
  const pruned: number[] = [];

  // Under a `/T` root everything dies with it, but the liveness proof still
  // names each pid, so `pruned` stays exactly the old BFS result.
  const collectSubtree = (pid: number): void => {
    for (const child of childMap.get(pid) || []) {
      if (exemptPid(child)) continue;
      pruned.push(child);
      collectSubtree(child);
    }
  };

  const walk = (pid: number): void => {
    for (const child of childMap.get(pid) || []) {
      if (exemptPid(child)) continue; // spared, with its whole subtree
      pruned.push(child);
      if (hasExemptBelow(child)) {
        single.push(child);
        walk(child);
      } else {
        treeKill.push(child);
        collectSubtree(child);
      }
    }
  };
  walk(rootPid);

  return { treeKill, single, pruned };
}

/**
 * Recursively collect all descendant PIDs of a process, PRUNING any subtree
 * rooted at a recognised external GUI application.
 *
 * The prune is subtree-wide, not per-process: such an app spawns its own helper
 * children (renderers, GPU), and killing those breaks it exactly as thoroughly
 * as killing the parent. Because an exempted process is never collected, it also
 * never reaches the "still alive after SIGKILL" throw - the tree proof keeps its
 * meaning for every process the engine actually owns.
 */
async function collectDescendantPids(rootPid: number): Promise<number[]> {
  try {
    // `comm` is the executable path with no arguments, so a process cannot dress
    // itself up as an exempt app by choosing its argv. It can contain spaces, so
    // the first two fields are parsed positionally and the REST is the command.
    const { stdout } = await execFile('ps', ['-eo', 'pid=,ppid=,comm='], { timeout: 3000 });
    return _collectDescendantPidsFromPsTable(stdout, rootPid);
  } catch (error) {
    throw new Error(`Unable to enumerate ACP process tree for PID ${rootPid}`, { cause: error });
  }
}

/**
 * WINDOWS. The same guarantee as the macOS prune above, but the security
 * argument does NOT transfer, so the mechanism differs in one deliberate way.
 *
 * On macOS `/Applications` is admin-writable, so an anchored path is itself
 * evidence. On Windows the two most likely TradingView locations are
 * `%LOCALAPPDATA%\TradingView\TradingView.exe` (a per-user Electron install)
 * and the connector's own MSIX fallback copy under `%LOCALAPPDATA%\tvcontrol\`
 * - both inside the user's own profile, which is exactly the
 * `/tmp/TradingView.app` forgery the macOS anchor exists to refuse. Refusing
 * them outright would leave the bug live for most Windows users; accepting them
 * on path alone would be a silent weakening.
 *
 * So the anchor set is split by WHO CAN WRITE THE DIRECTORY:
 *   - admin-writable (`%PROGRAMFILES%`, `WindowsApps`) - path alone, parity with macOS.
 *   - user-writable (`%LOCALAPPDATA%`) - path AND a valid Authenticode signature.
 * If the signature cannot be established, the process is NOT exempt and is
 * killed, which is exactly today's behaviour rather than a regression.
 *
 * Paths are compared case-insensitively (Windows semantics; the macOS regex's
 * case-sensitivity is not a property that can be preserved) and any 8.3 short
 * form (`C:\PROGRA~1\...`) is refused outright rather than expanded, so it
 * cannot launder a path past a long-form anchor.
 */
export function _windowsGuiAppAnchors(env: NodeJS.ProcessEnv = process.env): {
  trusted: string[];
  userWritable: string[];
} {
  const norm = (d: string) => d.replace(/[\\/]+$/, '').toLowerCase();
  const trusted: string[] = [];
  // Defaults matter: these variables can be absent from a stripped environment,
  // and an empty anchor set silently exempts nothing - i.e. kills the chart with
  // no error to explain why. The literals are the documented Windows locations.
  const programDirs = [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.PROGRAMW6432].filter(Boolean);
  if (programDirs.length === 0) programDirs.push('C:\\Program Files', 'C:\\Program Files (x86)');
  for (const dir of programDirs) {
    if (!dir) continue;
    trusted.push(`${norm(dir)}\\tradingview\\tradingview.exe`);
    // MSIX package directories are versioned, so this one is a prefix.
    trusted.push(`${norm(dir)}\\windowsapps\\`);
  }
  const userWritable: string[] = [];
  if (env.LOCALAPPDATA) {
    userWritable.push(`${norm(env.LOCALAPPDATA)}\\tradingview\\tradingview.exe`);
    userWritable.push(`${norm(env.LOCALAPPDATA)}\\tvcontrol\\desktop-cache\\`);
  }
  return { trusted, userWritable };
}

/**
 * Normalize for comparison, or null when there is no path to compare.
 *
 * NOTE ON 8.3 SHORT NAMES. An earlier draft refused any path containing `~`
 * (`C:\PROGRA~1\...`) on the theory that it could launder a path past an
 * anchor. Mutation testing showed that guard was dead: shortening can never
 * turn a non-anchored path INTO an anchored one, and every anchor here is
 * long-form, so an 8.3 path simply fails to match and is killed either way.
 * Removed rather than kept as reassurance, along with the test that passed
 * with and without it.
 */
export function _normalizeWindowsPath(command: string): string | null {
  const raw = command.trim();
  if (!raw) return null;
  return raw.replace(/\//g, '\\').toLowerCase();
}

function matchesAnchor(normalized: string, anchor: string): boolean {
  return anchor.endsWith('\\') ? normalized.startsWith(anchor) : normalized === anchor;
}

/**
 * Which distinct executable paths in a Windows process table are exempt.
 * Signature checks are resolved ONCE per path here, before the traversal, so the
 * BFS itself stays synchronous and identical to the POSIX one.
 */
export async function _resolveWin32ExemptPaths(
  commands: Iterable<string>,
  env: NodeJS.ProcessEnv,
  verifySignature: (absPath: string) => Promise<boolean>
): Promise<Set<string>> {
  const { trusted, userWritable } = _windowsGuiAppAnchors(env);
  const exempt = new Set<string>();
  const needsSignature = new Map<string, string>();
  for (const command of commands) {
    const normalized = _normalizeWindowsPath(command);
    if (!normalized) continue;
    if (trusted.some((a) => matchesAnchor(normalized, a))) {
      exempt.add(normalized);
    } else if (userWritable.some((a) => matchesAnchor(normalized, a))) {
      needsSignature.set(normalized, command.trim());
    }
  }
  for (const [normalized, absPath] of needsSignature) {
    let ok = false;
    try {
      ok = await verifySignature(absPath);
    } catch {
      ok = false; // Unverifiable is not exempt.
    }
    if (ok) exempt.add(normalized);
  }
  return exempt;
}

/** Parse `pid ppid path` rows into the distinct command strings they carry. */
export function _win32TableCommands(stdout: string): string[] {
  const out: string[] = [];
  for (const line of stdout.trim().split('\n')) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) continue;
    out.push(parts.slice(2).join(' '));
  }
  return out;
}

/**
 * Windows process-tree enumeration with the GUI-app prune applied.
 *
 * `wmic` was REMOVED from Windows 11 24H2 and is no longer available even as a
 * Feature on Demand, and `tasklist` reports neither a parent pid nor an
 * executable path, so PowerShell + `Get-CimInstance Win32_Process` is the only
 * in-box way to build this table. The projection emits `pid ppid path` with the
 * path LAST so the row shape matches `ps -eo pid=,ppid=,comm=` exactly and one
 * parser serves both platforms.
 *
 * The UTF-8 console encoding is load-bearing rather than cosmetic: the
 * connector's MSIX fallback path embeds the username, and a non-ASCII username
 * mangled through the OEM codepage would miss the anchor and kill the chart.
 */
/**
 * BUDGET. `killAllAgentChildren` is the FINAL before-quit step and runs under a
 * 2s per-step budget (agentChildRegistry.ts:16), and it calls killChild once per
 * live child. A cold `powershell.exe` costs several hundred ms, so enumerating
 * per child could eat the whole budget and orphan the very children the reaper
 * exists to kill - reintroducing #139 in the name of sparing a chart.
 *
 * Two bounds keep that from happening. The snapshot is shared for a short TTL,
 * so a teardown killing N children pays for ONE PowerShell; and the timeout is
 * well inside the budget, so a slow or policy-blocked host falls back to the
 * old `taskkill /T` promptly instead of stalling. Losing the chart is the
 * acceptable failure here; orphaning the engine is not.
 */
const WIN32_TABLE_TTL_MS = 1_000;
const WIN32_ENUM_TIMEOUT_MS = 1_500;
let win32TableCache: { at: number; stdout: string } | null = null;

async function win32ProcessTable(now: number = Date.now()): Promise<string> {
  if (win32TableCache && now - win32TableCache.at < WIN32_TABLE_TTL_MS) {
    return win32TableCache.stdout;
  }
  const stdout = await rawWin32ProcessTable();
  win32TableCache = { at: now, stdout };
  return stdout;
}

async function collectWin32KillPlan(rootPid: number): Promise<Win32KillPlan> {
  const stdout = await win32ProcessTable();
  const exempt = await _resolveWin32ExemptPaths(_win32TableCommands(stdout), process.env, verifyAuthenticode);
  return _win32KillPlanFromProcTable(stdout, rootPid, (command) => {
    const normalized = _normalizeWindowsPath(command);
    return normalized !== null && exempt.has(normalized);
  });
}

async function rawWin32ProcessTable(): Promise<string> {
  const { stdout } = await execFile(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      '[Console]::OutputEncoding=[Text.Encoding]::UTF8; Get-CimInstance Win32_Process | ' +
        'ForEach-Object { "$($_.ProcessId) $($_.ParentProcessId) $($_.ExecutablePath)" }',
    ],
    { windowsHide: true, timeout: WIN32_ENUM_TIMEOUT_MS, maxBuffer: 8 * 1024 * 1024 }
  );
  return stdout;
}

const authenticodeCache = new Map<string, boolean>();

/** Valid Authenticode signature? Anything else - unsigned, tampered, error - is false. */
async function verifyAuthenticode(absPath: string): Promise<boolean> {
  const cached = authenticodeCache.get(absPath);
  if (cached !== undefined) return cached;
  let ok = false;
  try {
    const { stdout } = await execFile(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        '(Get-AuthenticodeSignature -LiteralPath $args[0]).Status',
        '-Args',
        absPath,
      ],
      { windowsHide: true, timeout: 5000 }
    );
    ok = stdout.trim() === 'Valid';
  } catch {
    ok = false;
  }
  authenticodeCache.set(absPath, ok);
  return ok;
}

/** Test seam: the exemption predicate and its closed-world list. */
export const __killChildTesting = { isExternalGuiApp, EXTERNAL_GUI_APP_BINARIES, verifyAuthenticode };

/**
 * Decode a Windows command error for readable logging.
 * Windows commands like `taskkill` output in the system's native encoding (e.g. GBK for Chinese),
 * which gets garbled when Node.js interprets it as UTF-8. This re-decodes stderr as GBK if available.
 */
export function decodeWindowsError(error: unknown): string {
  const err = error as { stderr?: string | Buffer; code?: number; message?: string };
  if (err?.stderr) {
    const stderr = err.stderr;
    if (Buffer.isBuffer(stderr)) {
      try {
        return new TextDecoder('gbk').decode(stderr);
      } catch {
        return stderr.toString('utf-8');
      }
    }
    // stderr is a string - check if it looks garbled (contains replacement chars)
    if (typeof stderr === 'string' && stderr.includes('\ufffd')) {
      // Already garbled, fall back to exit code
      return `exit code ${err.code ?? 'unknown'}`;
    }
    return stderr;
  }
  return err?.message ?? String(error);
}

// ── File I/O utilities ──────────────────────────────────────────────

/** Read a text file from the filesystem. */
export async function readTextFile(filePath: string): Promise<{ content: string }> {
  try {
    const content = await fsAsync.readFile(filePath, 'utf-8');
    return { content };
  } catch (error) {
    throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
}

/** Write a text file and emit a file-stream update to the preview panel. */
export async function writeTextFile(filePath: string, content: string): Promise<null> {
  try {
    await fsAsync.mkdir(path.dirname(filePath), { recursive: true });
    await fsAsync.writeFile(filePath, content, 'utf-8');

    // Send streaming content update to preview panel (for real-time updates)
    try {
      const { ipcBridge } = await import('@/common');
      const pathSegments = filePath.split(path.sep);
      const fileName = pathSegments[pathSegments.length - 1];
      const workspace = pathSegments.slice(0, -1).join(path.sep);

      ipcBridge.fileStream.contentUpdate.emit({
        filePath,
        content,
        workspace,
        relativePath: fileName,
        operation: 'write' as const,
      });
    } catch (emitError) {
      console.error('[ACP] Failed to emit file stream update:', emitError);
    }

    return null;
  } catch (error) {
    throw new Error(`Failed to write file: ${error instanceof Error ? error.message : String(error)}`, {
      cause: error,
    });
  }
}

// ── JSON-RPC I/O ────────────────────────────────────────────────────

/** Write a JSON-RPC message to a child process stdin. */
export function writeJsonRpcMessage(child: ChildProcess, message: object): void {
  if (child.stdin) {
    const lineEnding = process.platform === 'win32' ? '\r\n' : '\n';
    child.stdin.write(JSON.stringify(message) + lineEnding);
  }
}

// ── Agent settings ──────────────────────────────────────────────────

export interface ClaudeSettings {
  env?: {
    ANTHROPIC_MODEL?: string;
    [key: string]: string | undefined;
  };
  model?: string;
}

/**
 * Get Claude settings file path (cross-platform)
 * - macOS/Linux: ~/.claude/settings.json
 * - Windows: %USERPROFILE%\.claude\settings.json
 */
export function getClaudeSettingsPath(): string {
  return path.join(os.homedir(), '.claude', 'settings.json');
}

/**
 * Read Claude settings from settings.json
 */
export function readClaudeSettings(): ClaudeSettings | null {
  try {
    const settingsPath = getClaudeSettingsPath();
    if (!fs.existsSync(settingsPath)) {
      return null;
    }
    const content = fs.readFileSync(settingsPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Get ANTHROPIC_MODEL from Claude settings (under env object)
 */
export function getClaudeModel(): string | null {
  const settings = readClaudeSettings();
  return settings?.env?.ANTHROPIC_MODEL ?? null;
}

export function getClaudeModelSlot(): 'default' | 'opus' | 'haiku' | null {
  const settings = readClaudeSettings();
  const model = settings?.model?.trim().toLowerCase();
  if (model === 'sonnet') return 'default';
  return model === 'default' || model === 'opus' || model === 'haiku' ? model : null;
}

/**
 * The Claude Code model slots Wayland exposes when the ACP bridge returns no
 * model list of its own. The claude-agent-acp bridge enumerates models from the
 * Claude Agent SDK init result, but that list comes back EMPTY for some auth
 * modes (notably Claude subscription / OAuth), leaving the in-chat picker stuck
 * on a dead "Select Model" (issue #184). Each id here is a valid `--model` /
 * `ANTHROPIC_MODEL` alias (verified live against the claude CLI: `--model opus`
 * and `ANTHROPIC_MODEL=opus` both resolve to claude-opus-4-8), so the pick
 * applies via the bridge `set_model` and is honored on a (re)spawn + `--resume`.
 */
export const CLAUDE_SLOT_MODELS: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'sonnet', label: 'Sonnet' },
  { id: 'opus', label: 'Opus' },
  { id: 'haiku', label: 'Haiku' },
];

/**
 * Normalize any Claude model id to its Claude Code slot (`sonnet`/`opus`/`haiku`),
 * or `undefined` if it is not a Claude model.
 *
 * The in-chat picker offers the registry catalog ids (`claude-opus-4-8`,
 * `claude-sonnet-4-6`, ...), but Claude Code's ACP backend has no
 * `session/set_model` and only honors the three slot aliases via
 * `ANTHROPIC_MODEL`. So a registry pick MUST be mapped to its slot before it can
 * take effect — without this the pick falls through to an in-place `set_model`
 * the CLI rejects with -32601 and the switch silently no-ops (#184).
 *
 * Accepts a bare slot id (returned as-is) or a catalog id whose name contains
 * the slot keyword.
 */
export function claudeSlotForModelId(modelId?: string | null): string | undefined {
  if (!modelId) return undefined;
  if (CLAUDE_SLOT_MODELS.some((m) => m.id === modelId)) return modelId;
  const lower = modelId.toLowerCase();
  for (const { id } of CLAUDE_SLOT_MODELS) {
    if (lower.includes(id)) return id;
  }
  return undefined;
}

/**
 * Build the static Claude slot model catalog (Sonnet / Opus / Haiku) used as a
 * fallback when the bridge advertises no models. `currentModelId` reflects the
 * user's pick; unknown/absent values default to Sonnet. A registry catalog id
 * (`claude-opus-4-8`) is normalized to its slot so the picker's pick resolves to
 * a real slot label instead of falling back to Sonnet (#184).
 */
export function buildClaudeSlotModelInfo(currentModelId?: string | null): AcpModelInfo {
  const current = claudeSlotForModelId(currentModelId) ?? 'sonnet';
  const label = CLAUDE_SLOT_MODELS.find((m) => m.id === current)?.label ?? current;
  return {
    currentModelId: current,
    currentModelLabel: label,
    availableModels: CLAUDE_SLOT_MODELS.map((m) => ({ id: m.id, label: m.label })),
    canSwitch: true,
    source: 'models',
    sourceDetail: 'claude-slots',
  };
}

// --- CodeBuddy settings support ---
// Note: CodeBuddy settings (~/.codebuddy/settings.json) contains sandbox/trust config,
// NOT model preferences. Model selection is handled by the CLI itself.
// MCP servers are configured in ~/.codebuddy/mcp.json
