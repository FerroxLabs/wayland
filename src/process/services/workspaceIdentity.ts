/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Workspace identity marker (`.wayland-workspace.json`).
 *
 * A durable workspace lives in the user's Documents folder. They can rename it,
 * move it, delete it, or drop an unrelated folder at the same path - so a
 * PATHNAME is not identity. This marker is: written once at allocation time, it
 * carries a stable id, the owner kind (`task` | `project`), a display name and a
 * schema version.
 *
 * Two things depend on it:
 *   - a run can ask "is the folder at this path still MY workspace" and refuse
 *     to write into a stranger's folder (P2-10), and
 *   - a rename is free, because the id never moves with the folder name. The id
 *     is identity; the folder name is display.
 *
 * Deliberately NOT the encrypted provenance ledger (`managedWorkspaceProvenance`).
 * That one is app-private state about `*-temp-*` dirs under the app work root.
 * This one lives IN the user's folder, in plaintext, precisely so it travels with
 * the folder when the user moves it in Finder.
 */

import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { writeFileAtomic } from '@process/utils/atomicWrite';

export const WORKSPACE_MARKER_FILE = '.wayland-workspace.json';

/** Refuse to parse anything larger; a marker is a few hundred bytes. */
const MAX_MARKER_BYTES = 64 * 1024;

export type WorkspaceOwnerKind = 'task' | 'project';

export type WorkspaceMarker = Readonly<{
  schemaVersion: 1;
  /** Stable identity. Never derived from the path, never changes on rename. */
  workspaceId: string;
  ownerKind: WorkspaceOwnerKind;
  /** Cron job id / project id. `null` when the owner does not exist yet. */
  ownerId: string | null;
  /** What to call this workspace in the UI. Presentation only. */
  displayName: string;
  createdAtMs: number;
}>;

export function buildWorkspaceMarker(input: {
  ownerKind: WorkspaceOwnerKind;
  ownerId: string | null;
  displayName: string;
  createdAtMs?: number;
}): WorkspaceMarker {
  return {
    schemaVersion: 1,
    workspaceId: randomUUID(),
    ownerKind: input.ownerKind,
    ownerId: input.ownerId ?? null,
    displayName: input.displayName,
    createdAtMs: input.createdAtMs ?? Date.now(),
  };
}

/** Validate an untrusted value as a marker. Returns null rather than throwing. */
export function parseWorkspaceMarker(value: unknown): WorkspaceMarker | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (v.schemaVersion !== 1) return null;
  if (typeof v.workspaceId !== 'string' || !v.workspaceId) return null;
  if (v.ownerKind !== 'task' && v.ownerKind !== 'project') return null;
  if (v.ownerId !== null && typeof v.ownerId !== 'string') return null;
  if (typeof v.displayName !== 'string') return null;
  if (!Number.isSafeInteger(v.createdAtMs) || (v.createdAtMs as number) < 0) return null;
  return {
    schemaVersion: 1,
    workspaceId: v.workspaceId,
    ownerKind: v.ownerKind,
    ownerId: (v.ownerId as string | null) ?? null,
    displayName: v.displayName,
    createdAtMs: v.createdAtMs as number,
  };
}

export const workspaceMarkerPath = (workspaceDir: string): string => path.join(workspaceDir, WORKSPACE_MARKER_FILE);

/**
 * Write the marker atomically. Callers treat a failure as non-fatal: a workspace
 * without a marker still works, it just cannot prove its identity later.
 */
export async function writeWorkspaceMarker(workspaceDir: string, marker: WorkspaceMarker): Promise<void> {
  await writeFileAtomic(workspaceMarkerPath(workspaceDir), `${JSON.stringify(marker, null, 2)}\n`, 'utf8');
}

/** Read the marker, or null when it is absent, unreadable, oversized or malformed. */
export async function readWorkspaceMarker(workspaceDir: string): Promise<WorkspaceMarker | null> {
  try {
    const file = workspaceMarkerPath(workspaceDir);
    const stat = await fs.lstat(file);
    if (!stat.isFile() || stat.size > MAX_MARKER_BYTES) return null;
    return parseWorkspaceMarker(JSON.parse(await fs.readFile(file, 'utf8')));
  } catch {
    return null;
  }
}

/**
 * `ok`        - safe to use.
 * `missing`   - the directory is gone (or is not a directory).
 * `unmarked`  - the directory exists but carries no marker, and we EXPECTED one:
 *               the folder we allocated was replaced by something else.
 * `mismatch`  - the directory carries a DIFFERENT workspace's marker.
 *
 * With `expectedWorkspaceId === null` (a workspace allocated before markers
 * existed, or one the user picked themselves) only `missing` can be reported -
 * we have nothing to compare against and must not invent a failure.
 */
export type WorkspaceIdentityStatus = 'ok' | 'missing' | 'unmarked' | 'mismatch';

export type WorkspaceIdentityCheck = Readonly<{
  status: WorkspaceIdentityStatus;
  marker: WorkspaceMarker | null;
}>;

export async function checkWorkspaceIdentity(
  workspaceDir: string,
  expectedWorkspaceId: string | null
): Promise<WorkspaceIdentityCheck> {
  let isDir = false;
  try {
    isDir = (await fs.stat(workspaceDir)).isDirectory();
  } catch {
    isDir = false;
  }
  if (!isDir) return { status: 'missing', marker: null };

  const marker = await readWorkspaceMarker(workspaceDir);
  if (!expectedWorkspaceId) return { status: 'ok', marker };
  if (!marker) return { status: 'unmarked', marker: null };
  if (marker.workspaceId !== expectedWorkspaceId) return { status: 'mismatch', marker };
  return { status: 'ok', marker };
}
