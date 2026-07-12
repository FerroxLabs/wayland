/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Backend-specific ACP connector logic and environment helpers.
 * Extracted from AcpConnection to keep the main class focused on
 * process lifecycle, messaging, and session management.
 */

import type { ChildProcess, SpawnOptions } from 'child_process';
import { execFile as execFileCb, execFileSync, spawn } from 'child_process';
import { promisify } from 'util';
import { promises as fs, readdirSync, rmSync, statSync } from 'fs';
import os from 'os';
import path from 'path';
import {
  CLAUDE_ACP_NPX_PACKAGE,
  CODEBUDDY_ACP_NPX_PACKAGE,
  CODEX_ACP_BRIDGE_VERSION,
  CODEX_ACP_NPX_PACKAGE,
} from '@/common/types/acpTypes';
import { resolveBridgePackage } from './bridgeVersionResolver';
import {
  findSuitableNodeBin,
  getEnhancedEnv,
  getWindowsShellExecutionOptions,
  loadFullShellEnvironment,
  normalizeNpxArgsForBundledBun,
  resolveNpxPath,
} from '@process/utils/shellEnv';
import { readClaudeProviderEnvFromCcSwitch } from '@process/services/ccSwitchModelSource';
import { mainWarn } from '@process/utils/mainLogger';
import { getPlatformServices } from '@/common/platform';

const execFile = promisify(execFileCb);

function normalizeWindowsCommand(command: string): string {
  const trimmed = command.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/**
 * Split a Windows cliPath into the executable and its inline arguments for a
 * direct (shell: false) spawn.
 *
 * Supports:
 *   - `"C:\Program Files\agent.exe"` → quoted path with spaces, optionally
 *     followed by unquoted args (`"C:\..\agent.exe" --flag`).
 *   - `goose acp`            → command + inline args.
 *   - `node path/to/file.js` → command + inline args.
 *
 * No shell is invoked, so embedded metacharacters in the path are inert: they
 * become literal characters in argv rather than being interpreted by cmd.exe.
 */
function parseWindowsCliPath(cliPath: string): { command: string; inlineArgs: string[] } {
  const trimmed = cliPath.trim();

  // Leading quoted executable path (may contain spaces); remainder are args.
  if (trimmed.startsWith('"')) {
    const closingQuote = trimmed.indexOf('"', 1);
    if (closingQuote !== -1) {
      const command = trimmed.slice(1, closingQuote);
      const inlineArgs = trimmed
        .slice(closingQuote + 1)
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      return { command, inlineArgs };
    }
  }

  // Unquoted: first whitespace-delimited token is the command, the rest args.
  const parts = trimmed.split(/\s+/).filter(Boolean);
  return { command: parts[0] ?? '', inlineArgs: parts.slice(1) };
}

function resolveCodexAcpPlatformPackage(): string | null {
  if (process.platform === 'win32') {
    if (process.arch === 'x64') {
      return '@zed-industries/codex-acp-win32-x64';
    }

    if (process.arch === 'arm64') {
      return '@zed-industries/codex-acp-win32-arm64';
    }
  }

  if (process.platform === 'linux') {
    if (process.arch === 'x64') {
      return '@zed-industries/codex-acp-linux-x64';
    }

    if (process.arch === 'arm64') {
      return '@zed-industries/codex-acp-linux-arm64';
    }
  }

  if (process.platform === 'darwin') {
    if (process.arch === 'x64') {
      return '@zed-industries/codex-acp-darwin-x64';
    }

    if (process.arch === 'arm64') {
      return '@zed-industries/codex-acp-darwin-arm64';
    }
  }

  return null;
}

function resolveCodexAcpPlatformPackageSpecifier(packageName: string): string {
  return `${packageName}@${CODEX_ACP_BRIDGE_VERSION}`;
}

function resolvePreferredCodexAcpPlatformPackage(): string | null {
  const packageName = resolveCodexAcpPlatformPackage();
  return packageName ? resolveCodexAcpPlatformPackageSpecifier(packageName) : null;
}

function shouldPreferDirectCodexAcpPackage(): boolean {
  return process.platform === 'win32' || process.platform === 'linux';
}

function extractCodexPlatformPackageFromError(errorMessage: string): string | null {
  const packageMatch = errorMessage.match(/Cannot find package '(@zed-industries\/codex-acp-[^']+)'/i);
  if (packageMatch) {
    return packageMatch[1];
  }

  const binaryMatch = errorMessage.match(/Failed to locate (@zed-industries\/codex-acp-[^\s]+) binary/i);
  if (binaryMatch) {
    return binaryMatch[1];
  }

  return null;
}

function isCodexMetaPackageOptionalDependencyError(errorMessage: string): boolean {
  return (
    errorMessage.includes('optional dependency was not installed') ||
    (errorMessage.includes('@zed-industries/codex-acp') &&
      /ERR_MODULE_NOT_FOUND|Cannot find package|Failed to locate .* binary/i.test(errorMessage))
  );
}

// ── Environment helpers ─────────────────────────────────────────────

/**
 * Prepare a clean environment for ACP backends.
 *
 * Merges the full user shell environment (including custom env vars like
 * API keys exported in .zshrc) with the enhanced env (PATH merging,
 * bundled tool paths). Then removes Electron-injected NODE_OPTIONS,
 * npm lifecycle vars, and other env vars that interfere with child
 * Node.js processes.
 */
export async function prepareCleanEnv(): Promise<Record<string, string | undefined>> {
  const shellEnvStart = Date.now();
  const fullShellEnv = await loadFullShellEnvironment();
  console.log(`[ACP-PERF] connect: shell env loaded ${Date.now() - shellEnvStart}ms`);
  const cleanEnv = getEnhancedEnv();

  // Merge full shell env as base, then overlay getEnhancedEnv on top
  // so that PATH merging and bundled bun injection are preserved,
  // while user-defined vars (e.g. SSS_API_KEY) from .zshrc are included.
  const merged: Record<string, string | undefined> = {
    ...fullShellEnv,
    ...cleanEnv,
  };

  delete merged.NODE_OPTIONS;
  delete merged.NODE_INSPECT;
  delete merged.NODE_DEBUG;
  // Remove CLAUDECODE env var to prevent claude-agent-sdk from detecting
  // a nested session when Wayland itself is launched from Claude Code.
  delete merged.CLAUDECODE;
  // Strip npm lifecycle vars inherited from parent `npm start` process.
  // These (npm_config_*, npm_lifecycle_*, npm_package_*) can cause npx to
  // behave as if running inside an npm script, interfering with package
  // resolution and child process startup.
  for (const key of Object.keys(merged)) {
    if (key.startsWith('npm_')) {
      delete merged[key];
    }
  }

  // Redirect bun cache AND temp directories out of the system temp folder.
  // On Windows, antivirus software (e.g. Windows Defender) actively scans
  // %TEMP%, causing EPERM (NtSetInformationFile) when bun/bunx tries to
  // rename files.  BUN_INSTALL_CACHE_DIR and BUN_TMPDIR alone are not
  // enough - bunx creates its working directory (`bunx-<uid>-<pkg>`) under
  // the OS TMP/TEMP path, so the *source* files of the move operation are
  // still locked by the antivirus scanner.  Override TMP/TEMP on Windows so
  // the entire bun file-operation chain stays inside userData.
  const userDataDir = getPlatformServices().paths.getDataDir();
  if (!merged.BUN_INSTALL_CACHE_DIR) {
    merged.BUN_INSTALL_CACHE_DIR = path.join(userDataDir, 'bun-cache');
  }
  if (!merged.BUN_TMPDIR) {
    merged.BUN_TMPDIR = path.join(userDataDir, 'bun-tmp');
  }
  if (process.platform === 'win32') {
    merged.TMP = merged.BUN_TMPDIR;
    merged.TEMP = merged.BUN_TMPDIR;
  }
  console.log(`[ACP] BUN_INSTALL_CACHE_DIR=${merged.BUN_INSTALL_CACHE_DIR}`);
  console.log(`[ACP] BUN_TMPDIR=${merged.BUN_TMPDIR}`);
  if (process.platform === 'win32') {
    console.log(`[ACP] TMP=${merged.TMP}`);
    console.log(`[ACP] TEMP=${merged.TEMP}`);
  }

  return merged;
}

/**
 * Pre-check Node.js version and auto-correct PATH if too old.
 * Requires Node >= minMajor.minMinor for ACP backends.
 * Mutates cleanEnv.PATH when auto-correction is needed.
 */
export function ensureMinNodeVersion(
  cleanEnv: Record<string, string | undefined>,
  minMajor: number,
  minMinor: number,
  backendLabel: string
): void {
  const isWindows = process.platform === 'win32';
  let versionTooOld = false;
  let detectedVersion = '';

  try {
    detectedVersion = execFileSync(isWindows ? 'node.exe' : 'node', ['--version'], {
      env: cleanEnv,
      encoding: 'utf-8',
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    const match = detectedVersion.match(/^v(\d+)\.(\d+)\./);
    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      if (major < minMajor || (major === minMajor && minor < minMinor)) {
        versionTooOld = true;
      }
    }
  } catch {
    // node not found - let spawn attempt handle it
    console.warn('[ACP] Node.js version check skipped: node not found in PATH');
  }

  if (versionTooOld) {
    const suitableBinDir = findSuitableNodeBin(minMajor, minMinor);
    if (suitableBinDir) {
      const sep = isWindows ? ';' : ':';
      cleanEnv.PATH = suitableBinDir + sep + (cleanEnv.PATH || '');

      // Verify the corrected PATH actually resolves to a good node (npx uses the same PATH)
      try {
        const correctedVersion = execFileSync(isWindows ? 'node.exe' : 'node', ['--version'], {
          env: cleanEnv,
          encoding: 'utf-8',
          timeout: 5000,
          stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();
        // Version auto-corrected silently
      } catch {
        console.warn(`[ACP] PATH corrected with ${suitableBinDir} but node verification failed - proceeding anyway`);
      }
    } else {
      throw new Error(
        `Node.js ${detectedVersion} is too old for ${backendLabel}. ` +
          `Minimum required: v${minMajor}.${minMinor}.0. ` +
          `Please upgrade Node.js: https://nodejs.org/`
      );
    }
  }
}

// ── Generic spawn config ────────────────────────────────────────────

/**
 * Creates spawn configuration for ACP CLI commands.
 * Exported for unit testing.
 *
 * @param cliPath - CLI command path (e.g., 'goose', 'npx @pkg/cli')
 * @param workingDir - Working directory for the spawned process
 * @param acpArgs - Arguments to enable ACP mode (e.g., ['acp'] for goose, ['--acp'] for auggie, ['exec','--output-format','acp'] for droid)
 * @param customEnv - Custom environment variables
 * @param prebuiltEnv - Pre-built env to use directly (skips internal getEnhancedEnv)
 */
export function createGenericSpawnConfig(
  cliPath: string,
  workingDir: string,
  acpArgs?: string[],
  customEnv?: Record<string, string>,
  prebuiltEnv?: Record<string, string>
) {
  const isWindows = process.platform === 'win32';
  // Use prebuilt env if provided (already cleaned by caller), otherwise build from shell env
  const env = prebuiltEnv ?? getEnhancedEnv(customEnv);

  // Default to --experimental-acp only if acpArgs is strictly undefined.
  // This allows passing an empty array [] to bypass default flags.
  const effectiveAcpArgs = acpArgs === undefined ? ['--experimental-acp'] : acpArgs;

  let spawnCommand: string;
  let spawnArgs: string[];

  if (cliPath.startsWith('npx ')) {
    // Route legacy npx package launchers through the bundled bun runtime.
    const parts = cliPath.split(' ').filter(Boolean);
    spawnCommand = resolveNpxPath(env);
    spawnArgs = ['x', '--bun', ...normalizeNpxArgsForBundledBun(parts.slice(1)), ...effectiveAcpArgs];
  } else if (isWindows) {
    // SEC-ACP-04: never hand a command string to cmd.exe (shell: true). cliPath
    // can be a user/extension-supplied custom-agent path; under a shell, embedded
    // metacharacters (e.g. `& calc.exe`) would be interpreted → code execution.
    //
    // Spawn the resolved executable directly (shell: false). A quoted Windows path
    // is unquoted, then any inline args after the executable are split off - the
    // same `"C:\Program Files\agent.exe"` / `goose acp` / `node path/to/file.js`
    // cases the old shell string handled, but without shell interpretation.
    const { command, inlineArgs } = parseWindowsCliPath(cliPath);
    spawnCommand = command;
    spawnArgs = [...inlineArgs, ...effectiveAcpArgs];
  } else {
    // Unix: simple command or path. If cliPath contains spaces (e.g., "goose acp"),
    // parse into command + inline args.
    const parts = cliPath.split(/\s+/);
    spawnCommand = parts[0];
    spawnArgs = [...parts.slice(1), ...effectiveAcpArgs];
  }

  const options: SpawnOptions = {
    cwd: workingDir,
    stdio: ['pipe', 'pipe', 'pipe'],
    env,
    // shell: false on all platforms - args are passed as an argv array, so no
    // shell metacharacter interpretation is possible (SEC-ACP-04).
    shell: false,
    windowsHide: true,
  };

  return {
    command: spawnCommand,
    args: spawnArgs,
    options,
  };
}

// ── Spawn result type ───────────────────────────────────────────────

export type SpawnResult = { child: ChildProcess; isDetached: boolean };

/** Return type for npx backend prepare functions (prepareClaude, prepareCodex, prepareCodebuddy). */
export type NpxPrepareResult = {
  cleanEnv: Record<string, string | undefined>;
  npxCommand: string;
  extraArgs?: string[];
};

// ── Bunx cache corruption detection & cleanup ──────────────────────

/**
 * Detect bunx cache corruption from stderr.
 * bun x may fail to install all transitive dependencies (known bun issue),
 * producing "Cannot find package" (Unix) or "Cannot find module" (Windows).
 */
export function isBunxCacheCorruption(stderr: string): boolean {
  return /Cannot find (?:package|module)/i.test(stderr);
}

/**
 * Extract the bunx cache root directory from the error path in stderr and delete it.
 *
 * Stderr from bun contains the full path to the missing module, e.g.:
 *   Unix:    /tmp/bunx-501-@zed-industries/claude-agent-acp@0.21.0/node_modules/...
 *   Windows: C:\Users\...\Temp\bunx-1743022513-@zed-industries\claude-agent-acp@0.21.0\node_modules\...
 *
 * We extract everything up to the versioned package dir (before /node_modules)
 * and remove it so the next `bun x` invocation does a fresh install.
 *
 * @returns The cache directory that was cleared, or null if extraction failed.
 */
export function clearBunxCache(stderr: string): string | null {
  const match = stderr.match(/([^\s'"]*[/\\]bunx-\d+[^\s/\\]*[/\\][^\s/\\]+@[^\s/\\]+)[/\\]node_modules/);
  if (!match) return null;

  const cacheDir = match[1];
  try {
    rmSync(cacheDir, { recursive: true, force: true });
    return cacheDir;
  } catch {
    return null;
  }
}

/** Escape a string for literal use inside a RegExp. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * #373 fallback: clear the agent's bunx WORKING dirs BY NAME when stderr has no
 * extractable cache path. A partial extraction crashes with
 * `error: Cannot find module 'zod/v4'` which prints NO bunx path (and the
 * `@scope` layout lacks the `name@version/node_modules` segment `clearBunxCache`
 * keys off), so the path-extraction self-heal returns null and the app retries
 * forever against the same corrupt cache.
 *
 * Bun names its per-run working dir `bunx-<uid>-<scope-or-name>` under the OS
 * temp dir (it does NOT honor `BUN_TMPDIR` for this on macOS/Linux - only
 * Windows redirects TMP/TEMP). We remove ONLY directories matching that exact
 * `bunx-<digits>-<pkg>` shape for THIS package, under the known temp roots, so
 * nothing outside bun's own ephemeral working dirs is ever touched. The next
 * `bun x` re-installs from scratch.
 *
 * @returns the absolute dirs removed (empty if none matched).
 */
export function clearBunxWorkingDirsForPackage(
  npxPackage: string,
  env: Record<string, string | undefined> = process.env
): string[] {
  // `@scope/name@1.2.3` -> bunx dir suffix `@scope`; `name@1.2.3` -> `name`.
  const spec = npxPackage.replace(/@[^@/]+$/, '');
  const suffix = spec.split('/')[0];
  if (!suffix) return [];
  // Case-insensitive: Windows/macOS filesystems are case-insensitive, so the
  // on-disk bunx dir may not match the package's exact casing.
  const dirRe = new RegExp(`^bunx-\\d+-${escapeRegExp(suffix)}`, 'i');

  // bunx writes its working dir under the OS temp dir (macOS/Linux) or the
  // Windows-redirected TMP/TEMP (= BUN_TMPDIR). Also scan bun's install cache
  // and home (`~/.bun`, `%LOCALAPPDATA%\\.bun` on Windows) so a corrupt extract
  // is cleared wherever bun placed it.
  const roots = [
    env.BUN_TMPDIR,
    env.TMPDIR,
    env.TMP,
    env.TEMP,
    env.BUN_INSTALL_CACHE_DIR,
    env.LOCALAPPDATA ? path.join(env.LOCALAPPDATA, '.bun') : undefined,
    path.join(os.homedir(), '.bun'),
    os.tmpdir(),
  ].filter((r): r is string => typeof r === 'string' && r.length > 0);
  const removed: string[] = [];
  const seenRoots = new Set<string>();
  const seenDirs = new Set<string>();
  for (const root of roots) {
    if (seenRoots.has(root)) continue;
    seenRoots.add(root);
    let entries: string[];
    try {
      entries = readdirSync(root);
    } catch {
      continue;
    }
    for (const name of entries) {
      if (!dirRe.test(name)) continue;
      const full = path.join(root, name);
      if (seenDirs.has(full)) continue;
      seenDirs.add(full);
      try {
        if (!statSync(full).isDirectory()) continue;
        rmSync(full, { recursive: true, force: true });
        removed.push(full);
      } catch {
        // best-effort: skip dirs we can't stat / remove
      }
    }
  }
  return removed;
}

/**
 * Detect bun "moving to cache dir" EPERM failures.
 * On Windows, antivirus (Windows Defender) locks files during scanning,
 * causing NtSetInformationFile EPERM when bun tries to rename packages
 * into the cache directory. A short delay and retry usually succeeds
 * once the scanner releases the file handle.
 */
export function isBunCacheMoveFailed(stderr: string): boolean {
  return /moving\s+"[^"]+"\s+to cache dir failed[\s\S]*EPERM/i.test(stderr);
}

// ── Backend-specific connectors ─────────────────────────────────────

/**
 * Spawn an npx-based ACP backend package.
 * Used by Claude, Codex, and CodeBuddy connectors.
 */
export function spawnNpxBackend(
  backend: string,
  npxPackage: string,
  npxCommand: string,
  cleanEnv: Record<string, string | undefined>,
  workingDir: string,
  isWindows: boolean,
  _preferOffline: boolean,
  {
    extraArgs = [],
    detached = false,
  }: {
    extraArgs?: string[];
    detached?: boolean;
  } = {}
): SpawnResult {
  const spawnArgs = ['x', '--bun', npxPackage, ...normalizeNpxArgsForBundledBun(extraArgs)];

  const spawnStart = Date.now();
  // detached: true creates a new session (setsid) so the child has no controlling terminal.
  // Required for backends (e.g. CodeBuddy) that write to /dev/tty - without it, SIGTTOU
  // would suspend the entire Electron process group and freeze the UI.
  //
  // SEC-ACP-04: spawn the resolved npx/bun path directly (shell: false) instead of
  // building a `chcp 65001 >nul && ...` cmd.exe string. npxCommand and spawnArgs are
  // passed as the executable + argv array, so no shell metacharacter interpretation
  // can occur. windowsHide keeps the console window from flashing.
  const child = spawn(normalizeWindowsCommand(npxCommand), spawnArgs, {
    cwd: workingDir,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: cleanEnv,
    shell: false,
    windowsHide: true,
    detached,
  });
  // Prevent the detached child from keeping the parent alive when the parent wants to exit normally.
  if (detached) {
    child.unref();
  }
  console.log(`[ACP-PERF] ${backend}: process spawned ${Date.now() - spawnStart}ms (bundled bun)`);

  return { child, isDetached: detached };
}

/** Prepare clean env + resolve npx for Claude ACP bridge. */
async function prepareClaude(): Promise<NpxPrepareResult> {
  const cleanEnv = await prepareCleanEnv();
  Object.assign(cleanEnv, readClaudeProviderEnvFromCcSwitch());
  return { cleanEnv, npxCommand: resolveNpxPath(cleanEnv) };
}

/** Prepare clean env + resolve npx + run diagnostics for Codex ACP bridge. */
async function prepareCodex(codexAcpPackage: string = CODEX_ACP_NPX_PACKAGE): Promise<NpxPrepareResult> {
  const cleanEnv = await prepareCleanEnv();

  const diagStart = Date.now();
  const codexCommand = process.platform === 'win32' ? 'codex.cmd' : 'codex';
  const codexExecOptions = {
    env: cleanEnv,
    timeout: 5000,
    windowsHide: true,
    ...getWindowsShellExecutionOptions(),
  };
  const diagnostics: {
    bridgeVersion: string;
    bridgePackage: string;
    codexCliVersion: string;
    loginStatus: string;
    hasCodexApiKey: boolean;
    hasOpenAiApiKey: boolean;
    hasChatGptSession: boolean;
  } = {
    bridgeVersion: CODEX_ACP_BRIDGE_VERSION,
    bridgePackage: codexAcpPackage,
    codexCliVersion: 'unknown',
    loginStatus: 'unknown',
    hasCodexApiKey: Boolean(cleanEnv.CODEX_API_KEY),
    hasOpenAiApiKey: Boolean(cleanEnv.OPENAI_API_KEY),
    hasChatGptSession: false,
  };

  try {
    const { stdout } = await execFile(codexCommand, ['--version'], codexExecOptions);
    diagnostics.codexCliVersion = stdout.trim() || diagnostics.codexCliVersion;
  } catch (error) {
    mainWarn('[ACP codex]', 'Failed to read codex CLI version', error);
  }

  try {
    const { stdout } = await execFile(codexCommand, ['login', 'status'], codexExecOptions);
    diagnostics.loginStatus = stdout.trim() || diagnostics.loginStatus;
    diagnostics.hasChatGptSession = /chatgpt/i.test(diagnostics.loginStatus);
  } catch (error) {
    mainWarn('[ACP codex]', 'Failed to read codex login status', error);
  }

  console.log(`[ACP-PERF] connect: codex diagnostics ${Date.now() - diagStart}ms`);

  return { cleanEnv, npxCommand: resolveNpxPath(cleanEnv) };
}

/** Prepare clean env + resolve npx + load MCP config for CodeBuddy. */
async function prepareCodebuddy(): Promise<NpxPrepareResult> {
  const cleanEnv = await prepareCleanEnv();

  // Load user's MCP config if available (~/.codebuddy/mcp.json)
  // CodeBuddy CLI in --acp mode does not auto-load mcp.json, so we pass it explicitly
  const mcpConfigPath = path.join(os.homedir(), '.codebuddy', 'mcp.json');
  const extraArgs: string[] = [];
  try {
    await fs.access(mcpConfigPath);
    extraArgs.push('--mcp-config', mcpConfigPath);
  } catch {
    mainWarn('[ACP]', 'No CodeBuddy MCP config found, starting without MCP servers');
  }

  return {
    cleanEnv,
    npxCommand: resolveNpxPath(cleanEnv),
    extraArgs,
  };
}

/**
 * Spawn a generic ACP backend with clean env and Node version check.
 * Many generic backends are Node.js CLIs (#!/usr/bin/env node) that break
 * when Electron's inherited env resolves to an old Node version.
 * Safe for native binaries too - they ignore NODE_OPTIONS and Node version checks.
 */
/**
 * #756: per-backend env hardening for headless stdio ACP spawns. Pure so the
 * choice is unit-testable without spawning anything.
 *
 * Hermes is a Python CLI driven over a headless stdio pipe. Two documented
 * (hermes-setup/SKILL.md) failure modes were never actually defended against in
 * the spawn path, so a Hermes session would open and then STALL INDEFINITELY —
 * disproportionately on Windows (fresh installs hit first-run hooks, and Windows
 * anonymous-pipe buffering is harsher):
 *   - a first-run interactive "hook" prompt blocks forever waiting on stdin that
 *     the JSON-RPC driver never answers  → HERMES_ACCEPT_HOOKS=1 auto-accepts it;
 *   - Python block-buffers stdout when it is not a TTY, so JSON-RPC replies can
 *     sit unflushed in the pipe buffer     → PYTHONUNBUFFERED=1 forces line flush.
 * Returned as DEFAULTS (applied before customEnv) so an explicit user/flux value
 * still wins.
 */
/** ACP CLIs installed as Python packages (pip/uv). They block-buffer stdout off
 *  a TTY, so their JSON-RPC replies stall in the pipe buffer — worst on Windows. */
const PYTHON_ACP_BACKENDS = new Set(['hermes', 'kimi']);

export function backendSpawnEnvHardening(backend: string): Record<string, string> {
  const out: Record<string, string> = {};
  // Force line-buffered stdout for every Python-based backend, not just Hermes.
  if (PYTHON_ACP_BACKENDS.has(backend)) {
    out['PYTHONUNBUFFERED'] = '1';
  }
  // Hermes-specific: auto-accept its first-run interactive hook prompt, which
  // otherwise blocks the headless spawn forever on stdin nobody answers.
  if (backend === 'hermes') {
    out['HERMES_ACCEPT_HOOKS'] = '1';
  }
  return out;
}

export async function spawnGenericBackend(
  backend: string,
  cliPath: string,
  workingDir: string,
  acpArgs?: string[],
  customEnv?: Record<string, string>
): Promise<SpawnResult> {
  try {
    await fs.mkdir(workingDir, { recursive: true });
  } catch {
    // best-effort: if mkdir fails, let spawn report the actual error
  }

  const cleanEnv = await prepareCleanEnv();
  // #756: apply backend hardening as DEFAULTS, then let customEnv override.
  Object.assign(cleanEnv, backendSpawnEnvHardening(backend));
  if (customEnv) {
    Object.assign(cleanEnv, customEnv);
  }
  ensureMinNodeVersion(cleanEnv, 18, 17, `${backend} ACP`);

  const spawnStart = Date.now();
  const detached = process.platform !== 'win32';
  const config = createGenericSpawnConfig(cliPath, workingDir, acpArgs, undefined, cleanEnv as Record<string, string>);
  const child = spawn(config.command, config.args, {
    ...config.options,
    detached,
  });
  if (detached) {
    child.unref();
  }
  console.log(`[ACP-PERF] connect: ${backend} process spawned ${Date.now() - spawnStart}ms`);

  return { child, isDetached: detached };
}

/** Callbacks for wiring a spawned child into the AcpConnection instance. */
export type NpxConnectHooks = {
  /** Wire the spawned child into the connection (e.g. attach protocol handlers). */
  setup: (result: SpawnResult) => Promise<void>;
  /** Terminate a failed Phase-1 child before retrying. */
  cleanup: () => Promise<void>;
};

/**
 * Connect to an npx-based ACP backend with Phase 1/2 retry strategy.
 * Phase 1: --prefer-offline for fast startup (~1-2s).
 * Phase 2: fresh registry lookup on failure (~3-5s).
 */
async function connectNpxBackend(config: {
  backend: string;
  npxPackage: string;
  prepareFn: () => NpxPrepareResult | Promise<NpxPrepareResult>;
  workingDir: string;
  /** Wire the spawned child into the connection (e.g. attach protocol handlers). */
  setup: (result: SpawnResult) => Promise<void>;
  /** Terminate a failed Phase-1 child before retrying. */
  cleanup: () => Promise<void>;
  extraArgs?: string[];
  detached?: boolean;
  /**
   * Per-spawn env (e.g. the Flux routing surface) merged into `cleanEnv` LAST,
   * so it overrides defaults and any provider env added inside `prepareFn`
   * (e.g. cc-switch's native ANTHROPIC_* for claude).
   */
  customEnv?: Record<string, string>;
}): Promise<void> {
  const { backend, npxPackage, prepareFn, workingDir, setup, cleanup, customEnv } = config;

  const envStart = Date.now();
  const { cleanEnv, npxCommand, extraArgs: prepExtraArgs = [] } = await prepareFn();
  if (customEnv) {
    Object.assign(cleanEnv, customEnv);
  }
  console.log(`[ACP-PERF] ${backend}: env prepared ${Date.now() - envStart}ms`);

  const isWindows = process.platform === 'win32';
  const opts = {
    extraArgs: [...(config.extraArgs ?? []), ...prepExtraArgs],
    detached: config.detached ?? false,
  };

  try {
    await setup(spawnNpxBackend(backend, npxPackage, npxCommand, cleanEnv, workingDir, isWindows, false, opts));
  } catch (error) {
    await cleanup();

    // Detect bunx cache corruption (missing transitive dependencies).
    // bun x caches packages in a temp dir but sometimes fails to install all
    // transitive deps (known bun issue). Clearing the cache and retrying once
    // forces a fresh install with complete dependencies.
    const errMsg = error instanceof Error ? error.message : '';

    // Retry 1: bunx cache corruption (missing transitive deps / partial extract)
    if (isBunxCacheCorruption(errMsg)) {
      let cleared = clearBunxCache(errMsg);
      if (!cleared) {
        // #373: the crash (`Cannot find module 'zod/v4'` from a partial zod
        // extraction) prints no extractable bunx path, so clear the agent's
        // bunx working dirs by name instead of retrying the same corrupt cache.
        const dirs = clearBunxWorkingDirsForPackage(npxPackage, cleanEnv);
        if (dirs.length > 0) cleared = dirs.join(', ');
      }
      if (cleared) {
        console.log(`[ACP ${backend}] Cleared corrupted bunx cache: ${cleared}, retrying...`);
        await setup(spawnNpxBackend(backend, npxPackage, npxCommand, cleanEnv, workingDir, isWindows, false, opts));
        return;
      }
    }

    // Retry 2: Windows Defender EPERM on cache move.
    // Antivirus releases file handles after scanning completes; a short
    // delay lets the lock clear before the second attempt.
    if (isBunCacheMoveFailed(errMsg)) {
      console.warn(`[ACP ${backend}] Bun cache move EPERM (likely antivirus), waiting 2s before retry...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        await setup(spawnNpxBackend(backend, npxPackage, npxCommand, cleanEnv, workingDir, isWindows, false, opts));
        return;
      } catch (retryError) {
        await cleanup();
        const retryMsg = retryError instanceof Error ? retryError.message : '';
        if (isBunCacheMoveFailed(retryMsg)) {
          console.error(
            `[ACP ${backend}] Bun cache move EPERM persists after retry.`,
            'User may need to add bun-cache directory to antivirus exclusions.'
          );
        }
        throw retryError;
      }
    }

    throw error;
  }
}

// ── Exported per-backend connect functions ───────────────────────────

/** Connect to Claude ACP bridge via npx. */
export function connectClaude(
  workingDir: string,
  hooks: NpxConnectHooks,
  customEnv?: Record<string, string>
): Promise<void> {
  return (async () => {
    // Resolve the LATEST published claude-agent-acp at spawn time (new models /
    // features) instead of a stale pin; falls back to CLAUDE_ACP_NPX_PACKAGE
    // offline. Cached for hours so this is a no-op after the first spawn.
    const npxPackage = await resolveBridgePackage(CLAUDE_ACP_NPX_PACKAGE);
    return connectNpxBackend({
      backend: 'claude',
      npxPackage,
      prepareFn: prepareClaude,
      workingDir,
      ...hooks,
      customEnv,
      detached: process.platform !== 'win32',
    });
  })();
}

/** Connect to Codex ACP bridge via npx. */
export function connectCodex(
  workingDir: string,
  hooks: NpxConnectHooks,
  customEnv?: Record<string, string>
): Promise<void> {
  return (async () => {
    const codexPlatformPackage = resolvePreferredCodexAcpPlatformPackage();
    // Resolve the latest published codex-acp at spawn time (fallback to the
    // pinned CODEX_ACP_NPX_PACKAGE offline).
    const codexAcpPackage = await resolveBridgePackage(CODEX_ACP_NPX_PACKAGE);
    const preferDirectPackage = codexPlatformPackage !== null && shouldPreferDirectCodexAcpPackage();
    const codexPackageCandidates = preferDirectPackage
      ? [codexPlatformPackage, codexAcpPackage]
      : [codexAcpPackage, ...(codexPlatformPackage ? [codexPlatformPackage] : [])];

    let lastError: Error | null = null;

    for (const [index, npxPackage] of codexPackageCandidates.entries()) {
      try {
        await connectNpxBackend({
          backend: 'codex',
          npxPackage,
          prepareFn: () => prepareCodex(npxPackage),
          workingDir,
          ...hooks,
          customEnv,
        });
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        const fallbackPackageName = extractCodexPlatformPackageFromError(lastError.message);
        const fallbackPackage = fallbackPackageName
          ? resolveCodexAcpPlatformPackageSpecifier(fallbackPackageName)
          : null;
        const canRetryWithPlatformPackage =
          index === 0 &&
          !preferDirectPackage &&
          codexPlatformPackage !== null &&
          npxPackage === codexAcpPackage &&
          isCodexMetaPackageOptionalDependencyError(lastError.message);
        const hasRemainingCandidates = index < codexPackageCandidates.length - 1;

        await hooks.cleanup();

        if (canRetryWithPlatformPackage) {
          if (fallbackPackage && !codexPackageCandidates.includes(fallbackPackage)) {
            codexPackageCandidates.push(fallbackPackage);
          }

          mainWarn(
            '[ACP codex]',
            `Meta bridge package failed to install its platform binary, retrying with direct package: ${codexPlatformPackage}`,
            lastError.message
          );
          continue;
        }

        if (hasRemainingCandidates) {
          mainWarn(
            '[ACP codex]',
            `Bridge package failed, retrying alternate package: ${npxPackage}`,
            lastError.message
          );
          continue;
        }

        throw lastError;
      }
    }

    throw lastError ?? new Error('Failed to start codex ACP bridge');
  })();
}

/** Connect to CodeBuddy ACP via npx. */
export function connectCodebuddy(workingDir: string, hooks: NpxConnectHooks): Promise<void> {
  return (async () => {
    const npxPackage = await resolveBridgePackage(CODEBUDDY_ACP_NPX_PACKAGE);
    return connectNpxBackend({
      backend: 'codebuddy',
      npxPackage,
      prepareFn: prepareCodebuddy,
      workingDir,
      ...hooks,
      extraArgs: ['--acp'],
      detached: process.platform !== 'win32',
    });
  })();
}
