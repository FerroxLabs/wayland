/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Thin HTTP client for a locally-running Tank server (the autonomous
 * "autopilot" queue runner). Wayland and Tank stay separate processes talking
 * over HTTP — this is arm's-length coupling, no shared code, no license
 * entanglement. The whole feature is dormant unless a tank token is configured
 * (see {@link tankEnabled}), so it never activates on an upstream build.
 *
 * Tank API surface used here:
 *   POST /projects                       → register/create a project by path
 *   GET  /projects                       → list (used to resolve an already-registered path)
 *   POST /projects/{id}/queue            → enqueue work items
 *   GET  /projects/{id}/queue            → poll run + item status/results
 */

/** Item status values Tank reports. Terminal = the runner is done with it. */
export type TankItemStatus =
  | 'pending'
  | 'running'
  | 'awaiting_input'
  | 'done'
  | 'blocked'
  | 'failed'
  | 'error'
  | 'pending_release';

export type TankQueueItem = {
  id: string;
  seq: number;
  title: string;
  status: TankItemStatus;
  result?: string | null;
};

export type TankRun = {
  status: string; // 'running' | 'idle' | 'done' | ...
  branch?: string;
  worktree_path?: string;
};

export type TankQueueSnapshot = {
  run: TankRun | null;
  items: TankQueueItem[];
};

type TankConfig = { baseUrl: string; token: string };

/** Read config from the environment. Defaults to the standard local Tank port. */
export function tankConfig(): TankConfig {
  const baseUrl = (process.env.WAYLAND_TANK_URL || 'http://127.0.0.1:7879').replace(/\/+$/, '');
  const token = process.env.WAYLAND_TANK_TOKEN || '';
  return { baseUrl, token };
}

/** The feature is off unless a token is present — nothing to leak, nothing to break. */
export function tankEnabled(): boolean {
  return !!tankConfig().token;
}

/**
 * Is Tank on this machine, or remote? When remote, local filesystem paths are
 * meaningless on the other side — we identify projects by git remote and move
 * the work by git, not by path. See AutopilotService.
 */
export function isLocalTank(): boolean {
  try {
    const host = new URL(tankConfig().baseUrl).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return false;
  }
}

async function tankFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { baseUrl, token } = tankConfig();
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    // 409 from POST /projects means "path already registered" — the caller
    // handles it by resolving the existing id, so surface the status.
    const err = new Error(`tank ${init?.method || 'GET'} ${path} → ${res.status} ${body}`) as Error & {
      status?: number;
    };
    err.status = res.status;
    throw err;
  }
  return (await res.json()) as T;
}

/**
 * Register (or resolve) a Tank project and return its id.
 * - Local Tank: identify by `path` (Tank registers the dir in place).
 * - Remote Tank: identify by `gitRemote` (Tank clones it — the local path
 *   doesn't exist on the remote's disk).
 * Tank returns 409 if it already owns the project; we then list and match by
 * the same key (path locally, git remote name remotely) to recover the id.
 */
export async function ensureProject(name: string, opts: { path?: string; gitRemote?: string }): Promise<string> {
  const body = opts.gitRemote ? { name, git_remote: opts.gitRemote } : { name, path: opts.path };
  try {
    const row = await tankFetch<{ id: string }>('/projects', { method: 'POST', body: JSON.stringify(body) });
    return row.id;
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status !== 409) throw e;
    const projects = await tankFetch<Array<{ id: string; name: string; path: string }>>('/projects');
    const match = opts.gitRemote
      ? projects.find((p) => p.name === name)
      : projects.find((p) => samePath(p.path, opts.path || ''));
    if (!match) throw e;
    return match.id;
  }
}

/** Enqueue a single prompt as one queue item. Title = first line, detail = full prompt. */
export async function enqueue(projectId: string, prompt: string): Promise<TankQueueSnapshot> {
  const title = firstLine(prompt);
  return tankFetch<TankQueueSnapshot>(`/projects/${projectId}/queue`, {
    method: 'POST',
    body: JSON.stringify({ items: [{ title, detail: prompt }] }),
  });
}

export async function getQueue(projectId: string): Promise<TankQueueSnapshot> {
  return tankFetch<TankQueueSnapshot>(`/projects/${projectId}/queue`);
}

// ---------------------------------------------------------------- pure helpers

const ACTIVE_STATUSES: ReadonlySet<TankItemStatus> = new Set(['pending', 'running', 'awaiting_input']);

/** The run is finished when no item is still pending/running/awaiting input. */
export function isQueueFinished(items: TankQueueItem[]): boolean {
  if (items.length === 0) return false;
  return items.every((it) => !ACTIVE_STATUSES.has(it.status));
}

/** True only if every item reached 'done' (vs failed/blocked/error). */
export function allItemsOk(items: TankQueueItem[]): boolean {
  return items.length > 0 && items.every((it) => it.status === 'done');
}

export function firstLine(text: string): string {
  const line = (text || '').trim().split('\n', 1)[0].trim();
  return line.slice(0, 120) || 'Autopilot task';
}

function samePath(a: string, b: string): boolean {
  const norm = (p: string) => p.replace(/\/+$/, '');
  return norm(a) === norm(b);
}
