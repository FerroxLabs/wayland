// src/process/acp/infra/processUtils.ts
import { type ChildProcess } from 'node:child_process';
import { killChild } from '@process/agent/acp/utils';

export function splitCommandLine(cmd: string): string[] {
  const parts: string[] = [];
  let current = '';
  let quote: "'" | '"' | null = null;
  let escaping = false;

  for (const char of cmd) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }
    if (char === '\\' && quote !== "'") {
      escaping = true;
      continue;
    }
    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }
    if (/\s/.test(char)) {
      if (current.length > 0) {
        parts.push(current);
        current = '';
      }
      continue;
    }
    current += char;
  }

  if (escaping) current += '\\';
  if (quote) throw new Error('splitCommandLine: unterminated quote');
  if (current.length > 0) parts.push(current);
  if (parts.length === 0) throw new Error('splitCommandLine: empty command');
  return parts;
}

export function waitForSpawn(child: ChildProcess): Promise<void> {
  // Async spawn factories may finish custody/cleanup work after Node has
  // already emitted `spawn`. A populated pid is Node's durable success signal.
  const exited = () => child.exitCode !== null || child.signalCode !== null;
  const exitedError = () => new Error('Child process exited before spawn readiness was observed');
  if (exited()) return Promise.reject(exitedError());
  if (child.pid !== undefined) {
    return Promise.resolve().then(() => {
      if (exited()) throw exitedError();
    });
  }
  return new Promise((resolve, reject) => {
    const onSpawn = () => {
      child.off('error', onError);
      resolve();
    };
    const onError = (err: Error) => {
      child.off('spawn', onSpawn);
      reject(err);
    };
    child.once('spawn', onSpawn);
    child.once('error', onError);
    queueMicrotask(() => {
      if (exited()) onError(exitedError());
      else if (child.pid !== undefined) onSpawn();
    });
  });
}

export function waitForExit(child: ChildProcess, timeoutMs: number): Promise<number | null> {
  if (child.exitCode !== null) return Promise.resolve(child.exitCode);

  return new Promise((resolve) => {
    let settled = false;

    const finish = (value: number | null) => {
      if (settled) return;
      settled = true;
      child.off('exit', onExit);
      child.off('close', onExit);
      clearTimeout(timer);
      resolve(value);
    };

    const onExit = (code: number | null) => finish(code);

    const timer = setTimeout(() => finish(null), timeoutMs);

    child.once('exit', onExit);
    child.once('close', onExit);
  });
}

export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** How a shutdown ended: the engine left on stdin EOF, or its tree was killed (`descendants` null = not listed). */
export type ShutdownResult = { exitedOnEof: true } | { exitedOnEof: false; descendants: number[] | null };

export async function gracefulShutdown(child: ChildProcess, gracePeriodMs = 100): Promise<ShutdownResult> {
  if (child.stdin && !child.stdin.destroyed) {
    child.stdin.end();
  }
  const code1 = await waitForExit(child, gracePeriodMs);
  if (code1 !== null) return { exitedOnEof: true };

  // Still running: take the whole tree while the engine is alive to anchor it.
  // Fuigo runs each MCP server as its own child, and signalling only the engine
  // left those servers running after an idle reap or a model switch. killChild
  // walks the descendants first (POSIX) or tree-kills with taskkill /T (Windows),
  // and spares an external GUI app a connector launched. The engine is a group
  // leader on POSIX (spawnGenericBackend spawns it detached there).
  try {
    const descendants = await killChild(child, process.platform !== 'win32', 1500);
    return { exitedOnEof: false, descendants };
  } finally {
    child.unref();
  }
}

export function prepareCleanEnv(
  customEnv?: Record<string, string>,
  baseEnv: Record<string, string | undefined> = process.env as Record<string, string | undefined>
): Record<string, string> {
  const clean: Record<string, string> = {};
  for (const [key, value] of Object.entries(baseEnv)) {
    if (value !== undefined && !key.startsWith('ELECTRON_')) {
      clean[key] = value;
    }
  }
  if (customEnv) Object.assign(clean, customEnv);
  return clean;
}
