/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Wayland Core profile-directory store (WS-2 P3, Design B - directory isolation).
 *
 * Manages the directory-isolated engine profiles under
 * `~/.wayland/profiles/<name>/`. Each named profile is its own folder; the
 * active profile is recorded in a small `.active` marker file at the profiles
 * root. The PATH resolution (sanitising, containment, native-vs-profile dir,
 * `WAYLAND_HOME` target) lives in the dependency-light {@link ./profilePaths}
 * module so the config bridge and the engine spawn share one source of truth.
 *
 * SECURITY (SEC-4) - this module does PATH-DERIVING FILESYSTEM MUTATION from a
 * renderer-supplied `name`. Every name is sanitised by `assertSafeProfileName`
 * and contained under the profiles root by `resolveProfileDir` (realpath-of-
 * parent check) before any fs op - see `profilePaths.ts`.
 *
 * HUMAN/RENDERER ONLY: the IPC handlers here are remote-denied in
 * `bridgeAllowlist.ts` and must never reach the agent/engine tool surface.
 *
 * PROFILE ACTIVATION (was SEC-3): the engine resolves its whole config tree
 * (config.toml, memory.db, skills) through `WAYLAND_HOME`, which the spawn now
 * sets to the active profile's dir (see `envBuilder.buildEngineSpawnEnv` +
 * `WCoreAgent.start`). So `activate()` need only persist the marker: every NEW
 * engine spawn picks the active profile up automatically. Already-running
 * conversations keep the profile they spawned under until they restart (we do
 * NOT hot-yank a live engine's config mid-turn).
 */

import { cp, mkdir, readdir, rename, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ipcBridge } from '@/common';
import type { IWcoreProfile } from '@/common/adapter/ipcBridge';
import { readConfig } from './configBridge';
import {
  DEFAULT_PROFILE,
  PROFILE_NAME_RE,
  activeMarkerPath,
  assertSafeProfileName,
  getActiveProfile,
  nativeConfigDir,
  profilesRoot,
  resolveProfileDir,
} from './profilePaths';

/** Stats subset of {@link IWcoreProfile} read from a profile's own config tree. */
type ProfileStats = Pick<IWcoreProfile, 'model' | 'tools' | 'skills' | 'updatedAt' | 'dir'>;

/**
 * Best-effort per-profile stats from the profile's OWN config tree
 * (`config.toml` + `skills/`). Each field is OMITTED when absent - we never
 * fabricate a 0/placeholder, so a brand-new profile simply renders no chips.
 * Reads only; any error on a field drops that field, never the whole list.
 */
async function readProfileStats(name: string): Promise<ProfileStats> {
  let dir: string;
  try {
    dir = name === DEFAULT_PROFILE ? nativeConfigDir() : await resolveProfileDir(name);
  } catch {
    return {};
  }
  const out: ProfileStats = { dir };
  // config.toml: model (engine's `[default].model`) + tool allow-list size.
  try {
    const cfg = await readConfig(join(dir, 'config.toml'));
    const def = cfg.default as { model?: unknown } | undefined;
    const model =
      typeof def?.model === 'string' && def.model
        ? def.model
        : typeof cfg.model === 'string' && cfg.model
          ? cfg.model
          : undefined;
    if (model) out.model = model;
    const tools = cfg.tools as { allow_list?: unknown } | undefined;
    if (Array.isArray(tools?.allow_list)) out.tools = tools.allow_list.length;
  } catch {
    // unreadable/corrupt config => omit config-derived stats
  }
  // skills/: count installed skill entries (hidden files excluded).
  try {
    const entries = await readdir(join(dir, 'skills'), { withFileTypes: true });
    const n = entries.filter((d) => !d.name.startsWith('.')).length;
    if (n > 0) out.skills = n;
  } catch {
    // no skills dir => omit
  }
  // updatedAt: config.toml mtime.
  try {
    const st = await stat(join(dir, 'config.toml'));
    out.updatedAt = st.mtimeMs;
  } catch {
    // no config yet => omit
  }
  return out;
}

// Re-export the pure path layer so existing `profileStore` importers keep
// working and callers have one import site for the profile surface.
export {
  DEFAULT_PROFILE,
  assertSafeProfileName,
  getActiveProfile,
  profilesRoot,
  resolveProfileDir,
} from './profilePaths';

/**
 * List every profile directory under the root (plus the implicit `default`),
 * marking which one is active. Hidden entries (`.active`, `.trash`) are skipped.
 */
export async function listProfiles(): Promise<IWcoreProfile[]> {
  const root = profilesRoot();
  await mkdir(root, { recursive: true });
  const active = await getActiveProfile();
  let entries: string[] = [];
  try {
    const dirents = await readdir(root, { withFileTypes: true });
    entries = dirents.filter((d) => d.isDirectory() && !d.name.startsWith('.')).map((d) => d.name);
  } catch {
    entries = [];
  }
  // The default profile is always presented, even before its dir exists.
  const names = new Set<string>([DEFAULT_PROFILE, ...entries]);
  const ordered = Array.from(names)
    .filter((n) => PROFILE_NAME_RE.test(n))
    .toSorted((a, b) => (a === DEFAULT_PROFILE ? -1 : b === DEFAULT_PROFILE ? 1 : a.localeCompare(b)));
  // Read each profile's stats from its own config tree (best-effort, parallel).
  return Promise.all(
    ordered.map(async (name) => (Object.assign({name,active:name===active}, await readProfileStats(name))))
  );
}

/** Create an empty profile directory. No-op-safe if it already exists. */
export async function createProfile(name: string): Promise<void> {
  const dir = await resolveProfileDir(name);
  await mkdir(dir, { recursive: true });
}

/**
 * Clone `from` into a NEW profile `to`. Both names are sanitized + contained.
 * Copies the source directory recursively; throws if `to` already exists.
 */
export async function cloneProfile(from: string, to: string): Promise<void> {
  const fromDir = await resolveProfileDir(from);
  const toDir = await resolveProfileDir(to);
  await mkdir(fromDir, { recursive: true });
  // `force: false` makes the copy fail rather than silently overwrite an
  // existing profile of the same name.
  await cp(fromDir, toDir, { recursive: true, force: false, errorOnExist: true });
}

/**
 * Mark `name` as the active profile. Creates the directory if missing so the
 * marker never points at a nonexistent profile.
 *
 * The marker is the single source of truth read by `resolveActiveConfigDir()`
 * (profilePaths). Every subsequent engine spawn resolves `WAYLAND_HOME` through
 * it, so a NEW conversation immediately uses this profile's isolated config +
 * memory. Engines already running keep the profile they spawned under until
 * they restart - we intentionally never hot-yank a live engine's config dir
 * mid-turn (the engine caches process-global policy/passthrough state).
 */
export async function activateProfile(name: string): Promise<void> {
  const dir = await resolveProfileDir(name);
  await mkdir(dir, { recursive: true });
  await writeFile(activeMarkerPath(), `${name}\n`, 'utf-8');
}

/**
 * Soft-delete a profile: move it into a `.trash/<name>-<ts>` sibling under the
 * root rather than removing it irrecoverably. The `default` profile is never
 * deletable.
 */
export async function removeProfile(name: string): Promise<void> {
  assertSafeProfileName(name);
  if (name === DEFAULT_PROFILE) {
    throw new Error('the default profile cannot be deleted');
  }
  const dir = await resolveProfileDir(name);
  const trashRoot = join(profilesRoot(), '.trash');
  await mkdir(trashRoot, { recursive: true });
  const dest = join(trashRoot, `${name}-${Date.now()}`);
  await rename(dir, dest);
  // If the deleted profile was active, fall back to default.
  if ((await getActiveProfile()) === name) {
    await writeFile(activeMarkerPath(), `${DEFAULT_PROFILE}\n`, 'utf-8');
  }
}

/**
 * Wire the human-only `wcoreProfiles.*` IPC handlers over the real profiles
 * root. Mutating handlers are remote-denied (see `bridgeAllowlist.ts`) and must
 * never reach the agent tool surface (SEC-4). Errors are returned as
 * `{ ok: false, error }` rather than thrown so the renderer can surface them.
 */
export function initWcoreProfileIpc(): void {
  ipcBridge.wcoreProfiles.list.provider(async () => {
    try {
      return await listProfiles();
    } catch {
      return [{ name: DEFAULT_PROFILE, active: true }];
    }
  });
  ipcBridge.wcoreProfiles.create.provider(async ({ name }) => {
    try {
      await createProfile(name);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  });
  ipcBridge.wcoreProfiles.clone.provider(async ({ from, to }) => {
    try {
      await cloneProfile(from, to);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  });
  ipcBridge.wcoreProfiles.activate.provider(async ({ name }) => {
    try {
      await activateProfile(name);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  });
  ipcBridge.wcoreProfiles.remove.provider(async ({ name }) => {
    try {
      await removeProfile(name);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  });
}
