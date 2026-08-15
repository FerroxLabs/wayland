/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Local Ollama runtime control (main process).
 *
 * `ollama-local` is the one keyless, machine-local provider in the registry. An
 * unreachable daemon is not a credential problem - the daemon is simply not
 * running - so Settings needs two facts the renderer cannot obtain: whether
 * Ollama is INSTALLED on this machine, and whether its daemon is UP. When it is
 * installed but down, we can start it.
 *
 * Every function here is defensive and never throws: a machine without Ollama,
 * a binary that will not execute, or a daemon that never comes up all resolve
 * to an honest negative rather than an error the UI has to interpret.
 */

import { accessSync, constants, existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

import { getEnhancedEnv } from '@process/utils/shellEnv';

/** The daemon's model-listing endpoint - the same probe the registry uses. */
const OLLAMA_TAGS_URL = 'http://127.0.0.1:11434/api/tags';

/** How long a single daemon liveness probe may take. */
const PROBE_TIMEOUT_MS = 2_000;

/** How long to wait for a just-spawned daemon to answer, and how often to ask. */
const START_TIMEOUT_MS = 15_000;
const START_POLL_INTERVAL_MS = 500;

/** Whether the local Ollama install is present, and whether its daemon is up. */
export type OllamaRuntimeStatus = {
  /** An executable `ollama` binary was found on this machine. */
  installed: boolean;
  /** The daemon answered `/api/tags`. */
  running: boolean;
};

/** Why a start attempt could not deliver a running daemon. */
export type OllamaStartFailure = 'not-installed' | 'spawn-failed' | 'timeout';

/**
 * Install locations to check BEFORE walking PATH.
 *
 * A GUI-launched Electron app inherits a minimal PATH, so PATH alone misses a
 * perfectly normal install (on macOS the Homebrew/`/usr/local` entries are
 * symlinks into `Ollama.app`, and neither directory is on the default GUI PATH).
 * `getEnhancedEnv()` repairs PATH for the walk below, but the well-known paths
 * make the common case a pure filesystem check with no shell involved.
 */
function wellKnownPaths(): string[] {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? '';
  switch (process.platform) {
    case 'darwin':
      return [
        '/Applications/Ollama.app/Contents/Resources/ollama',
        '/usr/local/bin/ollama',
        '/opt/homebrew/bin/ollama',
      ];
    case 'win32': {
      const localAppData = process.env.LOCALAPPDATA ?? (home ? path.join(home, 'AppData', 'Local') : '');
      const programFiles = process.env.ProgramFiles ?? 'C:\\Program Files';
      return [
        ...(localAppData ? [path.join(localAppData, 'Programs', 'Ollama', 'ollama.exe')] : []),
        path.join(programFiles, 'Ollama', 'ollama.exe'),
      ];
    }
    default:
      return [
        '/usr/local/bin/ollama',
        '/usr/bin/ollama',
        ...(home ? [path.join(home, '.local', 'bin', 'ollama')] : []),
      ];
  }
}

/** True when `candidate` exists and is executable by this process. */
function isExecutableFile(candidate: string): boolean {
  try {
    if (!existsSync(candidate)) return false;
    accessSync(candidate, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Absolute path to the `ollama` executable, or `null` when Ollama is not
 * installed on this machine. Well-known install locations win; otherwise the
 * shell-repaired PATH is walked. Never spawns anything - a machine WITHOUT
 * Ollama must not pay a process spawn to learn that.
 */
export function findOllamaBinary(): string | null {
  for (const candidate of wellKnownPaths()) {
    if (isExecutableFile(candidate)) return candidate;
  }

  const exeName = process.platform === 'win32' ? 'ollama.exe' : 'ollama';
  let searchPath = '';
  try {
    searchPath = getEnhancedEnv().PATH ?? '';
  } catch {
    searchPath = process.env.PATH ?? '';
  }
  for (const dir of searchPath.split(path.delimiter)) {
    if (!dir) continue;
    const candidate = path.join(dir, exeName);
    if (isExecutableFile(candidate)) return candidate;
  }
  return null;
}

/** True when the local daemon answers `/api/tags`. Never throws. */
export async function isOllamaDaemonRunning(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(OLLAMA_TAGS_URL, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Whether Ollama is installed here and whether its daemon is up - the two facts
 * Settings needs to decide between offering "Start Ollama" and telling the user
 * where to get it. Never offers an action that cannot work.
 */
export async function getOllamaRuntimeStatus(): Promise<OllamaRuntimeStatus> {
  const installed = findOllamaBinary() !== null;
  const running = await isOllamaDaemonRunning();
  return { installed, running };
}

/**
 * Start the local Ollama daemon (`ollama serve`) and wait until it answers.
 *
 * Detached + `unref`'d so the daemon outlives this app, with stdio discarded -
 * we own no pipe to drain. Resolves `{ ok: true }` only once `/api/tags`
 * actually answers, so the caller never reports success for a daemon that
 * failed to come up. Already-running is a success, not an error.
 */
export async function startOllamaDaemon(): Promise<{ ok: true } | { ok: false; reason: OllamaStartFailure }> {
  if (await isOllamaDaemonRunning()) return { ok: true };

  const binary = findOllamaBinary();
  if (!binary) return { ok: false, reason: 'not-installed' };

  try {
    // The binary path comes from our own well-known list or from a PATH walk -
    // never from the renderer - and is passed as argv[0] with no shell, so
    // there is no injection surface here.
    const child = spawn(binary, ['serve'], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    // A spawn that fails asynchronously (ENOENT/EACCES) emits 'error' on a
    // child nobody is listening to, which would crash the main process.
    child.on('error', () => {});
    child.unref();
  } catch {
    return { ok: false, reason: 'spawn-failed' };
  }

  const deadline = Date.now() + START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, START_POLL_INTERVAL_MS));
    if (await isOllamaDaemonRunning()) return { ok: true };
  }
  return { ok: false, reason: 'timeout' };
}
