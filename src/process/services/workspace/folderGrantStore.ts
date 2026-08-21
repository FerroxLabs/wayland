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
 * ── Revalidation on read ───────────────────────────────────────────────────
 * What is persisted is a canonical STRING, and a string does not stay attached
 * to the directory it named. A safe `/Volumes/reports` can be renamed and
 * replaced by a symlink, junction or mount pointing at Wayland's own config
 * tree, and the recorded root still spells the folder the user agreed to. Core
 * cannot save us: its refusals cover `/`, `$HOME`-or-an-ancestor and a
 * credential list, but NOT Wayland's user-data directory, which is a host-only
 * concept holding provider config and `safeStorage` material.
 *
 * So every read re-decides, through `classifyFolderGrantRoot` - the same
 * production classifier the write path uses, called and never re-implemented.
 * `list` and `listAll` return `{ grants, withheld }`: certified entries, and
 * entries this read refused to certify with the reason why. Withheld entries
 * are left on disk and stay removable. Neither silent trust nor silent
 * deletion is on the menu.
 *
 * `load` is private and there is no other accessor, so a revalidating read is
 * the only way roots leave this module - and what leaves is `LiveFolderGrant`,
 * which nothing outside this file can mint. A future replay that reads the
 * JSON itself, or accepts a bare `FolderGrant`, does not typecheck.
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
  FolderGrantWithheldReason,
  LiveFolderGrant,
  WithheldFolderGrant,
  WorkspaceFolderGrants,
} from '@/common/workspace/folderGrants';
import { classifyFolderGrantRoot, isWithin, pathsEqual, type FolderGrantRootContext } from './folderGrantRoots';

export const FOLDER_GRANTS_FILE = 'workspace-folder-grants.json';

/**
 * Must equal Core's `MAX_SESSION_READ_GRANTS`
 * (`crates/wcore-tools/src/workspace_policy.rs:33` on wayland-core `main`).
 * A larger value here would persist entries the engine silently drops.
 */
export const MAX_FOLDER_GRANTS_PER_WORKSPACE = 64;

export type FolderGrantAddition = Readonly<{
  /**
   * The live grant for this root - newly created, or the one that covered it.
   * Certified either way: a new entry was just classified against the live
   * filesystem, and a covering entry was re-validated before it was matched.
   */
  grant: LiveFolderGrant;
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

/**
 * The key namespaces this store will file an entry under.
 *
 * The prefixes were until now "a call-site convention": every writer happened
 * to use them and nothing checked. A convention nothing enforces is not a
 * boundary, and an unprefixed key is a key nothing derives - so it is refused.
 *
 * `path:` must carry an absolute path, because a relative one would be resolved
 * against whatever the process cwd happened to be by whoever read it next.
 *
 * `marker:` is LEGACY. `resolveFolderGrantWorkspaceId` no longer derives it -
 * the key is the canonical path and the workspace marker survives only as a
 * display label - so nothing new can be filed under one. Buckets written before
 * that change are still on disk, and they stay recognised here on purpose: a
 * key this function rejects is a bucket every read reports as withheld, which
 * is right for a hand-edited key and wrong for a decision the user actually
 * made under the previous scheme. They remain listed, remain removable, and are
 * never silently dropped.
 */
const MARKER_KEY_PREFIX = 'marker:';
const PATH_KEY_PREFIX = 'path:';

export function isFolderGrantWorkspaceKey(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.includes('\0')) return false;
  if (value.startsWith(MARKER_KEY_PREFIX)) return value.length > MARKER_KEY_PREFIX.length;
  if (value.startsWith(PATH_KEY_PREFIX)) return path.isAbsolute(value.slice(PATH_KEY_PREFIX.length));
  return false;
}

/**
 * Mint a {@link LiveFolderGrant}. The ONE place in the codebase that may, and
 * it is unexported: everything else has to go through a revalidating read.
 */
const certify = (grant: FolderGrant): LiveFolderGrant => grant as LiveFolderGrant;

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

  /**
   * Re-decide one workspace's recorded entries against the filesystem AS IT IS
   * NOW, through the same production classifier the write path uses.
   *
   * WHY A READ RE-DECIDES AT ALL. What is persisted is a canonical STRING, and
   * a string does not stay attached to the directory it named. Rename the
   * granted folder and put a symlink, junction or mount in its place - pointed
   * at Wayland's config tree, at a credential store, at anything - and the
   * recorded root still spells the folder the user agreed to. Every later
   * reader would believe it. This is not "replay is not built yet": the moment
   * an entry is written, the next thing to consume it is entitled to a root
   * that was checked, and the entire purpose of this store is that something
   * will consume it.
   *
   * The classifier is CALLED, never re-implemented. A second copy of the rules
   * here would be a copy that drifts, and the drift would be silent.
   *
   * An entry that no longer validates is WITHHELD: reported with its reason,
   * left on disk, still removable, and never certified. Not silently trusted -
   * that hands out authority nobody re-checked. Not silently deleted either -
   * that erases a decision the user made with no trace and nothing to explain
   * the gap next time they look.
   */
  private async revalidate(
    workspaceId: string,
    recorded: readonly FolderGrant[],
    context: FolderGrantRootContext | null
  ): Promise<WorkspaceFolderGrants> {
    const withheld: WithheldFolderGrant[] = [];
    const withhold = (grant: FolderGrant, reason: FolderGrantWithheldReason): void => {
      withheld.push({ grant, reason });
    };

    // A key nothing derives is a key nothing may replay. Still listed, with
    // every entry named, so a tampered file is VISIBLE rather than quietly
    // dropped - and `remove` stays permissive about the key so the user can
    // clear it.
    if (!isFolderGrantWorkspaceKey(workspaceId)) {
      for (const grant of recorded) withhold(grant, 'unrecognised_workspace_key');
      return { workspaceId, grants: [], withheld };
    }

    // Fail CLOSED, exactly as `add` does: without Wayland's own storage roots
    // we cannot show an entry is not part of it, so nothing is certified.
    if (context === null) {
      for (const grant of recorded) withhold(grant, 'wayland_private');
      return { workspaceId, grants: [], withheld };
    }

    const live: LiveFolderGrant[] = [];
    for (const grant of recorded) {
      const rechecked = await this.recheck(grant, context);
      if (rechecked.live === null) {
        withhold(grant, rechecked.reason);
        continue;
      }
      // Core stops accepting at MAX_SESSION_READ_GRANTS and reports the
      // overflow as an untyped string, so entries past the cap in a hand-edited
      // file would take no effect while looking exactly like the ones that do.
      if (live.length >= MAX_FOLDER_GRANTS_PER_WORKSPACE) {
        withhold(grant, 'grant_cap_reached');
        continue;
      }
      live.push(rechecked.live);
    }

    return { workspaceId, grants: live, withheld };
  }

  /**
   * Re-check ONE recorded entry against the filesystem as it is now.
   *
   * Split out so `add` can re-check only the handful of entries its containment
   * decision actually depends on. Re-checking the whole list there would be
   * O(n) filesystem work per add on a list capped at 64, which is O(n²) to fill
   * one and showed up as a test timing out rather than as a slow app.
   */
  private async recheck(
    grant: FolderGrant,
    context: FolderGrantRootContext
  ): Promise<{ live: LiveFolderGrant; reason: null } | { live: null; reason: FolderGrantWithheldReason }> {
    const check = await classifyFolderGrantRoot(grant.root, context);
    // `=== false`, not `!check.ok`: no `strictNullChecks` in this project.
    if (check.ok === false) return { live: null, reason: check.refusal };
    // The classifier accepted the path, but a path is only the same authority
    // if it still canonicalises to ITSELF. When it does not, this root now
    // names a different directory than the one the user consented to - even
    // when that directory happens to be a permitted one.
    if (!pathsEqual(check.root, grant.root)) return { live: null, reason: 'root_changed' };
    return { live: certify(grant), reason: null };
  }

  /** The entries of `candidates` that still re-check, in their recorded order. */
  private async stillLive(
    candidates: readonly FolderGrant[],
    context: FolderGrantRootContext
  ): Promise<LiveFolderGrant[]> {
    const live: LiveFolderGrant[] = [];
    for (const grant of candidates) {
      const rechecked = await this.recheck(grant, context);
      if (rechecked.live !== null) live.push(rechecked.live);
    }
    return live;
  }

  /** Resolve the root context, or null when it cannot be enumerated. */
  private async contextOrNull(): Promise<FolderGrantRootContext | null> {
    try {
      return await this.resolveContext();
    } catch {
      return null;
    }
  }

  async list(workspaceId: string): Promise<WorkspaceFolderGrants> {
    const file = await this.load();
    return this.revalidate(workspaceId, file.workspaces[workspaceId] ?? [], await this.contextOrNull());
  }

  /**
   * Every workspace that holds at least one recorded entry, each re-validated.
   *
   * Keyed by id and NOT cross-checked against what exists on disk, because the
   * entries a user most needs to see are the ones whose workspace they can no
   * longer find. Filtering those out would hide standing authority behind a
   * missing folder. For the same reason a workspace whose entries were ALL
   * withheld is still reported: an entry that stopped validating is the one a
   * user most needs to be shown.
   *
   * ONE context object is resolved for the whole sweep, so the ~30 protected
   * roots are canonicalised once rather than once per entry.
   */
  async listAll(): Promise<readonly WorkspaceFolderGrants[]> {
    const file = await this.load();
    const context = await this.contextOrNull();
    const records: WorkspaceFolderGrants[] = [];
    for (const [workspaceId, grants] of Object.entries(file.workspaces)) {
      if (grants.length === 0) continue;
      records.push(await this.revalidate(workspaceId, grants, context));
    }
    return records;
  }

  async add(input: { workspaceId: string; root: string; origin: FolderGrantOrigin }): Promise<FolderGrantAddResult> {
    // A caller bug, not a user decision - there is no honest refusal code for
    // it, and a key outside the two derived namespaces would create a bucket
    // nothing can read back and nothing should ever replay. Enforced here and
    // not merely conventional at the call sites: the disjointness of `marker:`
    // and `path:` is what stops an agent-written marker file from naming
    // another workspace's grant list, and a convention nothing checks is not a
    // boundary.
    if (!isFolderGrantWorkspaceKey(input.workspaceId)) {
      throw new TypeError('a folder grant needs a marker: or path: workspace id');
    }

    let context: FolderGrantRootContext;
    try {
      context = await this.resolveContext();
    } catch {
      // Fail CLOSED. We could not enumerate Wayland's own storage, so we cannot
      // show this root is not part of it.
      return { ok: false, refusal: 'wayland_private' };
    }

    const check = await classifyFolderGrantRoot(input.root, context);
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
      //
      // Containment is decided against entries that still validate TODAY. An
      // entry whose root has been re-pointed since it was written must never be
      // handed back as "this already covers you": that would answer a request
      // for a safe folder with a stale grant nobody re-checked, and hand the
      // caller a CERTIFIED grant for it.
      //
      // A LEXICAL prefilter decides whether any of this is worth doing. Almost
      // every add has no covering candidate at all, and re-checking a 64-entry
      // list on each of 64 adds is O(n²) filesystem work to fill one workspace.
      // When there IS a candidate the full re-validation runs, because "is this
      // entry live" includes "is it within the engine's cap", and that is a
      // property of the entries BEFORE it rather than of the entry itself.
      const covering = existing.some((grant) => isWithin(root, grant.root))
        ? (await this.revalidate(input.workspaceId, existing, context)).grants.find((grant) =>
            isWithin(root, grant.root)
          )
        : undefined;
      if (covering) {
        return {
          result: { ok: true, addition: { grant: covering, created: false, superseded: [] } } as FolderGrantAddResult,
          persist: false,
        };
      }

      const superseded = await this.stillLive(
        existing.filter((grant) => isWithin(grant.root, root)),
        context
      );
      // Filtered out of the RECORDED list, not out of the live one: a withheld
      // entry stays exactly where it is on disk. It is the user's decision to
      // delete, not this write's side effect.
      const kept = existing.filter((grant) => !superseded.some((gone) => gone.grantId === grant.grantId));

      // Checked AFTER the covered test, exactly as `grant_capacity` does, so a
      // redundant re-grant still succeeds against a full list. Counted over
      // what is RECORDED rather than what currently validates, because a
      // withheld entry can start validating again and the file must never hold
      // more than the engine will accept.
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
        // `certify` is honest here and only here on the write path: `root` came
        // out of `classifyFolderGrantRoot` a few lines above, against the
        // filesystem as it is right now.
        result: { ok: true, addition: { grant: certify(grant), created: true, superseded } } as FolderGrantAddResult,
        persist: true,
      };
    });
  }

  /**
   * Remove one grant. Returns the removed entry so the caller can revoke it.
   *
   * Deliberately PERMISSIVE about `workspaceId` where `add` is strict. A key
   * that `add` would now refuse can still be sitting in a file written before
   * this check existed, or hand-edited into one; those entries are reported by
   * `list` / `listAll` as withheld precisely so a human can clear them, and a
   * strict key check here would show the user a Remove button that does
   * nothing. The returned entry is a plain `FolderGrant`, never certified: it
   * is a revoke handle, not an authority to read anything.
   */
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
