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
    try {
      await execFile('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true, timeout: 5000 });
    } catch (forceError) {
      throw new Error(`ACP process-tree shutdown failed for PID ${pid}: ${decodeWindowsError(forceError)}`, {
        cause: forceError,
      });
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
 * SCOPE. POSIX only. The Windows path is `taskkill /PID <pid> /T /F`, which
 * cannot express an exclusion, so the tree is still killed unconditionally there
 * (the durable fix is a Job Object the app is launched outside of).
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
const EXTERNAL_GUI_APP_BINARIES = [/^\/Applications\/TradingView\.app\/Contents\/MacOS\/TradingView( Helper( \(.*\))?)?$/];

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
      if (isExternalGuiApp(commandOf.get(child) ?? '')) {
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

/** Test seam: the exemption predicate and its closed-world list. */
export const __killChildTesting = { isExternalGuiApp, EXTERNAL_GUI_APP_BINARIES };

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
