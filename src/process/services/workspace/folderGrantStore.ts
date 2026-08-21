/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The durable per-workspace folder-grant list - Wayland's boundary axis.
 *
 * WHY IT IS APP-PRIVATE AND NOT IN THE WORKSPACE. The agent has write access to
 * its own workspace. A grant list kept there would be a list the agent can
 * edit, which is self-escalation with extra steps. So the record lives in
 * Wayland's config dir (`userData/config`), beside the promotion journal, keyed
 * by workspace id - never by path, because a folder can be renamed or moved.
 *
 * WHY THE HOST HOLDS IT AT ALL. Core's grants are session-scoped by
 * construction and nothing survives the process, so the host is the only place
 * a "this folder is fine" decision can outlive a restart. The host replays the
 * list at spawn; the engine holds no authority the host did not just hand it.
 *
 * WHAT THIS MODULE DELIBERATELY DOES NOT DO: it never talks to the engine and
 * never renders anything. `add` returns what the caller must act on - the new
 * grant, or the pre-existing grant that already covered the request, or the
 * entries this one superseded and whose `grantId`s should be handed to
 * `revoke_path`.
 *
 * ── Containment, mirrored from Core ────────────────────────────────────────
 * Core's `grant_capacity` returns `Ok(true)` when `dir.starts_with(existing.root)`
 * for any live grant, and `grant_session_read_root_full` then returns the
 * directory WITHOUT recording a second grant. So granting a folder already
 * covered is a successful no-op there, and it is a successful no-op here: the
 * covering entry comes back with its ORIGINAL `grantId`, because that id is the
 * revoke handle and regenerating it would strand whatever the engine holds.
 *
 * The reverse direction - granting a PARENT of existing entries - is where this
 * store goes one step further than the engine, deliberately. Core would push
 * the parent and leave the children in place; but on the next replay its own
 * `starts_with` check collapses every one of those children into a no-op, so as
 * durable records they hold no authority at all. Keeping them would show the
 * user entries that do nothing and would burn slots out of a hard 64-slot
 * budget. They are removed and reported as `superseded`. This can only ever
 * shrink the recorded authority, never widen it.
 *
 * ── The cap ────────────────────────────────────────────────────────────────
 * Core caps a session at `MAX_SESSION_READ_GRANTS = 64` and reports the
 * overflow the same untyped way it reports every other refusal. A durable list
 * that grew past 64 would therefore mean later entries silently stopped taking
 * effect on replay while still being listed in Settings. The cap is enforced
 * here instead, at add time, and - exactly as in `grant_capacity` - it is
 * checked AFTER the already-covered test, so a redundant re-grant still
 * succeeds when the list is full.
 */

import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { app } from 'electron';
import { writeFileAtomic } from '@process/utils/atomicWrite';
import { getConfigPath, getDataPath } from '@process/utils';
import {
  nativeConfigDir,
  profilesRoot,
  resolveActiveConfigDir,
  standaloneConfigDir,
} from '@process/agent/wcore/profilePaths';
import type {
  FolderGrant,
  FolderGrantOrigin,
  FolderGrantRefusal,
  WorkspaceFolderGrants,
} from '@/common/workspace/folderGrants';
import { isWithin, type FolderGrantRootContext } from './folderGrantRoots';
import { vetFolderGrantRoot } from './folderGrantAuthority';

export const FOLDER_GRANTS_FILE = 'workspace-folder-grants.json';

/**
 * Must equal Core's `MAX_SESSION_READ_GRANTS`
 * (`crates/wcore-tools/src/workspace_policy.rs:33` on wayland-core `main`).
 * A larger value here would persist entries the engine silently drops.
 */
export const MAX_FOLDER_GRANTS_PER_WORKSPACE = 64;

export type FolderGrantAddition = Readonly<{
  /** The live grant for this root - newly created, or the one that covered it. */
  grant: FolderGrant;
  /** False when an existing grant already covered the request. */
  created: boolean;
  /** Entries this grant subsumed and that were removed. Revoke each by `grantId`. */
  superseded: readonly FolderGrant[];
}>;

/**
 * NOTE FOR CONSUMERS: narrow with `result.ok === true` / `result.ok === false`,
 * never with `if (!result.ok)`. This project does not enable
 * `strictNullChecks`, and without it TypeScript refuses to narrow a
 * boolean-literal discriminant through a truthiness test - `result.refusal`
 * then fails to compile with a misleading "does not exist" error. The tests do
 * not catch this, because `tests/**` is not typechecked.
 */
export type FolderGrantAddResult =
  | Readonly<{ ok: true; addition: FolderGrantAddition }>
  | Readonly<{ ok: false; refusal: FolderGrantRefusal }>;

type GrantsFile = { schemaVersion: 1; workspaces: Record<string, FolderGrant[]> };

/**
 * Wayland's own private roots plus the engine's config tree.
 *
 * `resolveActiveConfigDir` THROWS `ProfileIsolationError` when a named profile
 * is active and broken. That is not recoverable here: without it we cannot show
 * that a candidate is not the engine's own config dir, so the caller fails
 * closed rather than persisting an entry it could not vet.
 */
export async function defaultFolderGrantRootContext(): Promise<FolderGrantRootContext> {
  return {
    homeDir: os.homedir(),
    waylandPrivateRoots: [
      app.getPath('userData'),
      getConfigPath(),
      getDataPath(),
      nativeConfigDir(),
      standaloneConfigDir(),
      profilesRoot(),
      await resolveActiveConfigDir(),
    ],
  };
}

/** Validate one untrusted entry from the file. Returns null rather than throwing. */
function parseGrant(value: unknown): FolderGrant | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.grantId !== 'string' || v.grantId.length === 0) return null;
  if (typeof v.root !== 'string' || v.root.length === 0) return null;
  if (v.access !== 'read') return null;
  if (!Number.isSafeInteger(v.grantedAtMs) || (v.grantedAtMs as number) < 0) return null;
  if (v.origin !== 'consent_card' && v.origin !== 'settings') return null;
  return {
    grantId: v.grantId,
    root: v.root,
    access: 'read',
    grantedAtMs: v.grantedAtMs as number,
    origin: v.origin as FolderGrantOrigin,
  };
}

const EMPTY_FILE = (): GrantsFile => ({
  schemaVersion: 1,
  workspaces: Object.create(null) as Record<string, FolderGrant[]>,
});

export class WorkspaceFolderGrantStore {
  private tail: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly file: string,
    private readonly resolveContext: () => Promise<FolderGrantRootContext> = defaultFolderGrantRootContext
  ) {}

  private async load(): Promise<GrantsFile> {
    const empty = EMPTY_FILE();
    let parsed: unknown;
    try {
      parsed = JSON.parse(await fs.readFile(this.file, 'utf8'));
    } catch {
      // Absent or corrupt. An unreadable list must not block the app; it means
      // the user has no prior consent on record, which is the safe direction.
      return empty;
    }
    if (!parsed || typeof parsed !== 'object') return empty;
    const workspaces = (parsed as GrantsFile).workspaces;
    if (!workspaces || typeof workspaces !== 'object') return empty;
    for (const [workspaceId, entries] of Object.entries(workspaces)) {
      if (!Array.isArray(entries)) continue;
      const grants = entries.map(parseGrant).filter((grant): grant is FolderGrant => grant !== null);
      // `Object.create(null)`, so a `__proto__` key in a hand-edited file
      // becomes an ordinary own property instead of reassigning a prototype.
      empty.workspaces[workspaceId] = grants;
    }
    return empty;
  }

  /**
   * Run `operation` against the loaded file with every other mutation held off,
   * and persist only when it says the file actually changed. Serialized through
   * one tail promise so two concurrent adds cannot lose each other's entry.
   */
  private transact<T>(operation: (file: GrantsFile) => Promise<{ result: T; persist: boolean }>): Promise<T> {
    const run = this.tail.then(async () => {
      const file = await this.load();
      const { result, persist } = await operation(file);
      if (persist) {
        await fs.mkdir(path.dirname(this.file), { recursive: true });
        await writeFileAtomic(this.file, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
      }
      return result;
    });
    this.tail = run.catch((): undefined => undefined);
    return run;
  }

  async list(workspaceId: string): Promise<WorkspaceFolderGrants> {
    const file = await this.load();
    return { workspaceId, grants: file.workspaces[workspaceId] ?? [] };
  }

  /**
   * Every workspace that holds at least one grant.
   *
   * Keyed by id and NOT cross-checked against what exists on disk, because the
   * entries a user most needs to see are the ones whose workspace they can no
   * longer find. Filtering those out would hide standing authority behind a
   * missing folder.
   */
  async listAll(): Promise<readonly WorkspaceFolderGrants[]> {
    const file = await this.load();
    return Object.entries(file.workspaces)
      .filter(([, grants]) => grants.length > 0)
      .map(([workspaceId, grants]) => ({ workspaceId, grants }));
  }

  async add(input: { workspaceId: string; root: string; origin: FolderGrantOrigin }): Promise<FolderGrantAddResult> {
    // A caller bug, not a user decision - there is no honest refusal code for
    // it, and an empty key would silently create a bucket no workspace can read.
    if (typeof input.workspaceId !== 'string' || input.workspaceId.length === 0) {
      throw new TypeError('a folder grant needs a workspace id');
    }

    // The SAME gate the live consent path uses. Shared as one function on
    // purpose: "a root Wayland refuses to persist must also be a root Wayland
    // refuses to grant" is a property held by construction here, not by two
    // call sites agreeing to stay in step. It fails CLOSED when Wayland's own
    // storage cannot be enumerated, because then we cannot show this root is
    // not part of it.
    const check = await vetFolderGrantRoot(input.root, () => this.resolveContext());
    // `=== false`, not `!check.ok`: this project does not enable
    // `strictNullChecks`, and without it TypeScript will not narrow a
    // boolean-literal discriminant through a truthiness test. Consumers of
    // `FolderGrantAddResult` need the same spelling.
    if (check.ok === false) return { ok: false, refusal: check.refusal };
    const root = check.root;

    return this.transact(async (file) => {
      const existing = file.workspaces[input.workspaceId] ?? [];

      // Core's `grant_capacity` -> `Ok(true)`: already covered, so this is a
      // successful no-op and the original grantId survives.
      const covering = existing.find((grant) => isWithin(root, grant.root));
      if (covering) {
        return {
          result: { ok: true, addition: { grant: covering, created: false, superseded: [] } } as FolderGrantAddResult,
          persist: false,
        };
      }

      const superseded = existing.filter((grant) => isWithin(grant.root, root));
      const kept = existing.filter((grant) => !superseded.includes(grant));

      // Checked AFTER the covered test, exactly as `grant_capacity` does, so a
      // redundant re-grant still succeeds against a full list.
      if (kept.length >= MAX_FOLDER_GRANTS_PER_WORKSPACE) {
        return { result: { ok: false, refusal: 'grant_cap_reached' } as FolderGrantAddResult, persist: false };
      }

      const grant: FolderGrant = {
        grantId: randomUUID(),
        root,
        access: 'read',
        grantedAtMs: Date.now(),
        origin: input.origin,
      };
      file.workspaces[input.workspaceId] = [...kept, grant];
      return {
        result: { ok: true, addition: { grant, created: true, superseded } } as FolderGrantAddResult,
        persist: true,
      };
    });
  }

  /** Remove one grant. Returns the removed entry so the caller can revoke it. */
  async remove(workspaceId: string, grantId: string): Promise<FolderGrant | null> {
    return this.transact(async (file) => {
      const existing = file.workspaces[workspaceId];
      if (!existing) return { result: null, persist: false };
      const removed = existing.find((grant) => grant.grantId === grantId);
      if (!removed) return { result: null, persist: false };
      file.workspaces[workspaceId] = existing.filter((grant) => grant.grantId !== grantId);
      return { result: removed, persist: true };
    });
  }
}

let shared: WorkspaceFolderGrantStore | null = null;

/** The process-wide store. Lazy so the module stays loadable without Electron. */
export function defaultWorkspaceFolderGrantStore(): WorkspaceFolderGrantStore {
  if (!shared) shared = new WorkspaceFolderGrantStore(path.join(getConfigPath(), FOLDER_GRANTS_FILE));
  return shared;
}
