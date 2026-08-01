/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Workspace access store — the single source of truth for the per-workspace
 * trusted-edits axis (#671, desktop half of #657).
 *
 * A workspace (identified by its session cwd) is either `ask` (gated) or
 * `trusted-edits` (auto-approve read/edit, still prompt exec/network). The
 * value is:
 *   - persisted in ProcessConfig (`workspace.trustLevel`), so it survives an app
 *     restart, mirroring the #672 `ApprovalPersistence` pattern; and
 *   - mirrored in a process-global in-memory Map so the SYNCHRONOUS approval
 *     gates (AcpAgentManager / GeminiAgentManager / WCoreManager /
 *     OpenClawAgentManager, all main-process) can read the current level without
 *     awaiting a disk read on every tool call.
 *
 * Coherence: the managers and this store all run in the MAIN process (the task
 * managers are constructed by the main-process `workerTaskManagerSingleton`), so
 * a `setWorkspaceAccess` write is immediately visible to every live gate. An
 * un-hydrated or absent key reads as `ask`, never as trusted.
 *
 * Main-process only. Any future explicit local access control must drive it
 * exclusively through the `workspaceTrust` IPC (never renderer ConfigStorage),
 * so this cache cannot go stale behind a direct config write. Assistant/preset
 * selection must never call this store.
 */

import path from 'node:path';

import { ProcessConfig } from '@process/utils/initStorage';
import { mainError } from '@process/utils/mainLogger';
import {
  coerceWorkspaceAccessLevel,
  DEFAULT_WORKSPACE_ACCESS_LEVEL,
  type WorkspaceAccessInput,
  type WorkspaceAccessLevel,
} from '@/common/security/workspaceTrust';

const CONFIG_KEY = 'workspace.trustLevel' as const;

/** workspace cwd (normalized) → canonical access level. */
type WorkspaceAccessMap = Record<string, WorkspaceAccessLevel>;

/** Process-global in-memory mirror; seeded once by `hydrateWorkspaceTrust`. */
const cache = new Map<string, WorkspaceAccessLevel>();
/** Memoized one-shot hydration; every caller awaits the SAME real load. */
let hydration: Promise<void> | undefined;
/** Serializes persist writes so concurrent sets can't lose a sibling's update. */
let writeChain: Promise<void> = Promise.resolve();

/**
 * Normalize a workspace cwd into a stable key. `path.resolve` collapses
 * trailing-slash and `.`/`..` segments so the same directory maps to one key.
 *
 * We deliberately do NOT case-fold: on the common case-insensitive macOS/Windows
 * volume a different-case spelling of the SAME directory would merely re-prompt
 * (harmless), whereas case-folding on a case-SENSITIVE volume (APFS case-sensitive,
 * Linux) would collapse two GENUINELY DIFFERENT directories to one key and
 * over-trust — the wrong direction for a security grant. We also do NOT realpath()
 * (it hits the fs and throws on a not-yet-created dir). In practice the live gate
 * and the toggle both use the identical session cwd string, so resolve() alone is
 * exact for that path; normalization only affects cross-restart re-matching.
 */
function normalizeWorkspaceKey(workspace: string): string {
  return path.resolve(workspace);
}

async function readAll(): Promise<WorkspaceAccessMap> {
  const stored = await ProcessConfig.get(CONFIG_KEY).catch((): undefined => undefined);
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return {};

  const normalized: WorkspaceAccessMap = {};
  for (const [workspace, value] of Object.entries(stored)) {
    normalized[workspace] = coerceWorkspaceAccessLevel(value);
  }
  return normalized;
}

/**
 * Seed the in-memory cache from ProcessConfig exactly once at startup. Idempotent
 * and error-swallowing: a failed load leaves the cache empty, so every workspace
 * reads as `ask` until a value is set — the fail-safe direction.
 *
 * The in-flight promise is memoized so every caller awaits the SAME real load,
 * never a boolean flipped before the async read completes — otherwise a `get`
 * that raced startup could resolve to `ask` while the gate later reads trusted
 * (a security-posture display lie). Mirrors PermissionResolver.ensureHydrated.
 */
export function hydrateWorkspaceTrust(): Promise<void> {
  if (!hydration) {
    hydration = readAll()
      .then((all) => {
        for (const [workspace, level] of Object.entries(all)) {
          cache.set(normalizeWorkspaceKey(workspace), coerceWorkspaceAccessLevel(level));
        }
      })
      .catch((err) => {
        mainError('[WorkspaceTrust]', 'hydrate failed', err instanceof Error ? err.message : String(err));
      });
  }
  return hydration;
}

/**
 * Synchronous access lookup for the approval gates. Returns `ask` for an unknown
 * or empty workspace, or before hydration completes — the failure direction is
 * always "prompt", never "auto-approve".
 */
export function getWorkspaceAccessSync(workspace: string | undefined | null): WorkspaceAccessLevel {
  if (!workspace) return DEFAULT_WORKSPACE_ACCESS_LEVEL;
  return cache.get(normalizeWorkspaceKey(workspace)) ?? DEFAULT_WORKSPACE_ACCESS_LEVEL;
}

/** Convenience predicate used by every local approval gate. */
export function isWorkspaceTrusted(workspace: string | undefined | null): boolean {
  return getWorkspaceAccessSync(workspace) === 'trusted-edits';
}

/**
 * Set (and persist) the access level for a workspace. Updates the in-memory cache
 * FIRST (so live gates see it immediately even if the disk write lags), then
 * write-through to ProcessConfig under the normalized key. A persist failure is
 * logged, not thrown: the cache still reflects the user's choice for this
 * session; only cross-restart durability is lost.
 */
export async function setWorkspaceAccess(
  workspace: string | undefined | null,
  input: WorkspaceAccessInput
): Promise<void> {
  if (!workspace) return;
  const level = coerceWorkspaceAccessLevel(input);
  const key = normalizeWorkspaceKey(workspace);
  cache.set(key, level);
  // Serialize the read-modify-write: two concurrent sets for DIFFERENT workspaces
  // must not both read the same base map and clobber each other's persisted key
  // (a lost update would silently drop one workspace's grant across a restart).
  // The in-memory cache above is already correct for this session regardless.
  const run = writeChain.then(async () => {
    try {
      // readAll canonicalizes every legacy value, so the next user-initiated
      // access write migrates the full map without a startup rewrite racing a
      // live action.
      const all = await readAll();
      // Always write the canonical map. Even an equivalent user choice may be
      // the first post-upgrade access write, and must replace legacy serialized
      // `chat` / `cowork` values across the map.
      await ProcessConfig.set(CONFIG_KEY, { ...all, [key]: level });
    } catch (err) {
      mainError('[WorkspaceTrust]', 'setWorkspaceAccess failed', err instanceof Error ? err.message : String(err));
    }
  });
  // Keep the chain alive even if this link rejected (it can't — caught above).
  writeChain = run.catch((): void => undefined);
  return run;
}

/** Read the persisted level for a workspace (async; for the IPC get handler). */
export async function getWorkspaceAccess(workspace: string | undefined | null): Promise<WorkspaceAccessLevel> {
  await hydrateWorkspaceTrust();
  return getWorkspaceAccessSync(workspace);
}
