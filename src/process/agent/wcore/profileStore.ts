/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Wayland Core profile-directory store (WS-2 P3, Design B - directory isolation).
 *
 * Manages the directory-isolated engine profiles under Core's canonical
 * `<os-config>/wayland-core-profiles/<lowercase-name>/` root. Each named profile
 * is its own folder; the active profile is recorded in the `active` marker at
 * that root. The PATH resolution (sanitising, containment, native-vs-profile dir,
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

import { chmod, cp, lstat, mkdir, open, readFile, readdir, realpath, rename, rm, stat, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { parse, stringify } from 'smol-toml';
import { ipcBridge } from '@/common';
import type { IWcoreProfile } from '@/common/adapter/ipcBridge';
import { readConfig } from './configBridge';
import {
  DEFAULT_PROFILE,
  assertProfileTreeIsSelfContained,
  assertSafeProfileName,
  createExclusiveProfileDir,
  getActiveProfile,
  hasProfileLaunchLease,
  nativeConfigDir,
  profilesRoot,
  resolveExistingProfileDir,
  resolveProfileDir,
  withProfileAuthorityLock,
} from './profilePaths';

// Profile cloning is a settings/template operation, not a vault or history
// duplication. Vault passphrases are bound to the absolute profile home, so
// copying encrypted vault bytes would create an unreadable target; copying the
// plaintext fallback would duplicate live secrets. Memory is likewise user
// history, not reusable profile configuration.
const CLONE_SAFE_REUSABLE_TREES = new Set(['skills']);

const SECRET_CONFIG_KEY_NEEDLES = [
  'api_key',
  'apikey',
  'token',
  'secret',
  'password',
  'passwd',
  'credential',
  'private_key',
  'auth',
] as const;

// Provider-specific secret containers whose names are not covered by Core's
// generic needles.
const SECRET_CONFIG_EXACT_KEYS = new Set(['access_key_id', 'service_account_json']);

/**
 * Opaque launch containers are not reusable profile configuration. Arguments
 * may encode credentials positionally (for example `--token`, then the secret)
 * without any secret-bearing object key, so recursively inspecting their
 * elements cannot prove them safe.
 */
function isOpaqueSecretContainer(key: string): boolean {
  return (
    key === 'env' ||
    key === 'headers' ||
    key === 'args' ||
    key.endsWith('_args') ||
    key === 'arguments' ||
    key.endsWith('_arguments') ||
    key === 'argv'
  );
}

/** Only credential-free HTTP(S) endpoints are reusable across profiles. */
function isCloneSafeUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      url.username === '' &&
      url.password === '' &&
      url.search === '' &&
      url.hash === ''
    );
  } catch {
    return false;
  }
}

// These fields name or select credential behavior but do not contain a live
// credential when their values have the exact producer shape below. Invalid or
// ambiguous values fail closed instead of using the field name as a bypass.
function isCloneSafeSecretNameException(key: string, value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (key === 'api_key_env') return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
  if (key === 'azure_auth_mode') return value === 'api-key' || value === 'aad-bearer';
  if (key !== 'auth_fallback_base_url') return false;
  return isCloneSafeUrl(value);
}

function isSecretConfigKey(key: string, value: unknown): boolean {
  const normalized = key.toLowerCase();
  if (isOpaqueSecretContainer(normalized)) return true;
  if (isCloneSafeSecretNameException(normalized, value)) return false;
  // Provider and MCP endpoints commonly use `url`, `base_url`, or a compound
  // `*_url` key. Preserve only a demonstrably credential-free endpoint; URL
  // userinfo, query parameters, fragments, non-HTTP schemes and malformed
  // values are ambiguous secret carriers and therefore deleted.
  if (normalized.includes('url') && !isCloneSafeUrl(value)) return true;
  if (SECRET_CONFIG_EXACT_KEYS.has(normalized)) return true;
  return SECRET_CONFIG_KEY_NEEDLES.some((needle) => normalized.includes(needle));
}

/**
 * Redact credential fields from a cloned config using Core's canonical
 * case-insensitive substring predicate. This covers compound and mixed-case
 * names such as `bot_token`, `webhook_secret`, and `AuthorizationToken` while
 * the narrow exception list above preserves known non-secret behavior fields.
 * Deletion (instead of a `***` placeholder) ensures the clone falls through to
 * its own credential setup and never attempts to use a fake credential. `env`
 * and `headers` are removed as whole maps because MCP values are arbitrary
 * secret-bearing user data even when their keys are not named like credentials.
 */
function sanitizeClonedConfig(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeClonedConfig);
  if (value === null || typeof value !== 'object') return value;

  const sanitized: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (!isSecretConfigKey(key, child)) sanitized[key] = sanitizeClonedConfig(child);
  }
  return sanitized;
}

async function cloneSanitizedConfig(source: string, target: string): Promise<void> {
  const raw = await readFile(source, 'utf-8');
  const parsed = parse(raw) as Record<string, unknown>;
  const sanitized = sanitizeClonedConfig(parsed) as Record<string, unknown>;
  const handle = await open(target, 'wx', 0o600);
  try {
    await handle.writeFile(`${stringify(sanitized).trim()}\n`, 'utf-8');
    await handle.sync();
  } finally {
    await handle.close();
  }
}

function serializeProfileMutation<T>(mutation: () => Promise<T>): Promise<T> {
  return withProfileAuthorityLock(mutation);
}

function assertNamedProfile(name: string, operation: string): void {
  if (name === DEFAULT_PROFILE) throw new Error(`the default profile cannot be ${operation}`);
  assertSafeProfileName(name);
}

function profileSelectorName(selector: { kind: 'native' } | { kind: 'named'; name: string }): string {
  return selector.kind === 'native' ? DEFAULT_PROFILE : selector.name;
}

/** Stats subset of {@link IWcoreProfile} read from a profile's own config tree. */
type ProfileStats = Pick<IWcoreProfile, 'model' | 'tools' | 'skills' | 'updatedAt' | 'dir'>;

/** Atomically and durably publish the active-profile marker. */
async function writeActiveProfileMarker(name: string): Promise<void> {
  const root = profilesRoot();
  await mkdir(root, { recursive: true });
  const target = join(root, 'active');
  if (name === DEFAULT_PROFILE) {
    await unlink(target).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error;
    });
    if (process.platform !== 'win32') {
      const rootHandle = await open(root, 'r');
      try {
        await rootHandle.sync();
      } finally {
        await rootHandle.close();
      }
    }
    return;
  }
  const canonicalName = assertSafeProfileName(name).toLowerCase();
  const temp = join(root, `.active.${process.pid}.${randomUUID()}.tmp`);
  const handle = await open(temp, 'wx', 0o600);
  try {
    await handle.writeFile(`${canonicalName}\n`, 'utf-8');
    await handle.sync();
    await handle.close();
    await rename(temp, target);

    // Persist the rename ordering. Windows cannot open a directory through
    // Node without backup-semantics flags, so flush the renamed file there;
    // NTFS journals the directory mutation. The flag matters as much as the
    // path: 'r' is O_RDONLY, which Windows refuses to fsync, so this threw
    // EPERM on every profile write and left the store looking already-created.
    await syncPublicationTarget(process.platform === 'win32' ? target : root);
  } catch (error) {
    await handle.close().catch(() => {});
    await unlink(temp).catch((cleanupError: NodeJS.ErrnoException) => {
      if (cleanupError.code !== 'ENOENT') throw cleanupError;
    });
    throw error;
  }
}

async function ensureContainedTrashRoot(): Promise<string> {
  const root = profilesRoot();
  await mkdir(root, { recursive: true });
  const trashRoot = join(root, '.trash');
  try {
    await mkdir(trashRoot, { mode: 0o700 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
  }
  const entry = await lstat(trashRoot);
  if (!entry.isDirectory() || entry.isSymbolicLink()) {
    throw new Error('profile archive root must be a real directory');
  }
  const [canonicalRoot, canonicalTrash] = await Promise.all([realpath(root), realpath(trashRoot)]);
  if (canonicalTrash !== join(canonicalRoot, '.trash')) {
    throw new Error('profile archive root escapes the profiles directory');
  }
  await chmod(trashRoot, 0o700);
  return trashRoot;
}

/** Flush a directory rename boundary where Node exposes directory handles. */
async function syncDirectory(directory: string): Promise<void> {
  if (process.platform === 'win32') return;
  const handle = await open(directory, 'r');
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

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
import { syncPublicationTarget } from '@process/utils/durabilitySync';

/**
 * List every profile directory under Core's canonical root (plus Desktop's
 * explicit native-home view), marking the canonical Core pointer selection.
 */
export async function listProfiles(): Promise<IWcoreProfile[]> {
  const root = profilesRoot();
  await mkdir(root, { recursive: true });
  // A corrupt/unreadable marker must never be silently promoted to native.
  // Keep listing every recovery target with no active row so the renderer can
  // explain the broken marker and let the user explicitly repair it.
  const active = await getActiveProfile().catch((_error): null => null);
  const dirents = await readdir(root, { withFileTypes: true });
  const entries = dirents.filter((d) => d.isDirectory() && !d.name.startsWith('.')).map((d) => d.name);
  // The native home is always presented, even before its dir exists.
  const names = new Set<string>([DEFAULT_PROFILE, ...entries]);
  const ordered = Array.from(names)
    .filter((name) => {
      if (name === DEFAULT_PROFILE) return true;
      try {
        assertSafeProfileName(name);
        return true;
      } catch {
        return false;
      }
    })
    .toSorted((a, b) => (a === DEFAULT_PROFILE ? -1 : b === DEFAULT_PROFILE ? 1 : a < b ? -1 : a > b ? 1 : 0));
  // Read each profile's stats from its own config tree (best-effort, parallel).
  return Promise.all(
    ordered.map(async (name) =>
      Object.assign(
        {
          kind: name === DEFAULT_PROFILE ? ('native' as const) : ('named' as const),
          name: name === DEFAULT_PROFILE ? 'Default' : name,
          active: name === active,
        },
        await readProfileStats(name)
      )
    )
  );
}

/** Create an empty canonical Core profile; duplicate names fail closed. */
export async function createProfile(name: string): Promise<void> {
  return serializeProfileMutation(async () => {
    assertNamedProfile(name, 'created');
    await createExclusiveProfileDir(name);
  });
}

/**
 * Clone `from` into a NEW profile `to`. Both names are sanitized + contained.
 * Copies reusable template state only: a structured-credential-redacted
 * `config.toml` plus the self-contained skills tree. Skill files are copied
 * verbatim because they are executable user-authored content and cannot be
 * safely rewritten by heuristic secret scanning. Runtime history, OAuth,
 * dotenv, vaults, channels, plugins and future unknown top-level state are not
 * cloned. Throws if `to` already exists.
 */
export async function cloneProfile(from: string, to: string): Promise<void> {
  return serializeProfileMutation(async () => {
    if (from !== DEFAULT_PROFILE) assertSafeProfileName(from);
    assertNamedProfile(to, 'used as a clone target');
    const fromDir = from === DEFAULT_PROFILE ? nativeConfigDir() : await resolveExistingProfileDir(from);
    const source = await stat(fromDir);
    if (!source.isDirectory()) throw new Error(`source profile "${from}" is not a directory`);
    await assertProfileTreeIsSelfContained(fromDir);
    const toDir = await createExclusiveProfileDir(to);
    try {
      const configSource = join(fromDir, 'config.toml');
      try {
        await cloneSanitizedConfig(configSource, join(toDir, 'config.toml'));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
      const entries = await readdir(fromDir, { withFileTypes: true });
      await entries
        .filter((entry) => entry.isDirectory() && CLONE_SAFE_REUSABLE_TREES.has(entry.name))
        .reduce(
          (previous, entry) =>
            previous.then(() =>
              cp(join(fromDir, entry.name), join(toDir, entry.name), {
                recursive: true,
                force: false,
                errorOnExist: true,
              })
            ),
          Promise.resolve()
        );
      await assertProfileTreeIsSelfContained(toDir);
    } catch (error) {
      await rm(toDir, { recursive: true, force: true });
      throw error;
    }
  });
}

/**
 * Mark an existing named profile, or the native home, as active. A missing
 * named profile fails instead of creating state implicitly.
 *
 * The marker is the single source of truth read by `resolveActiveConfigDir()`
 * (profilePaths). Every subsequent engine spawn resolves `WAYLAND_HOME` through
 * it, so a NEW conversation immediately uses this profile's isolated config +
 * memory. Engines already running keep the profile they spawned under until
 * they restart - we intentionally never hot-yank a live engine's config dir
 * mid-turn (the engine caches process-global policy/passthrough state).
 */
export async function activateProfile(name: string): Promise<void> {
  return serializeProfileMutation(async () => {
    if (name !== DEFAULT_PROFILE) assertSafeProfileName(name);
    if (name !== DEFAULT_PROFILE) {
      const dir = await resolveExistingProfileDir(name);
      await assertProfileTreeIsSelfContained(dir);
    }
    await writeActiveProfileMarker(name);
  });
}

/**
 * Soft-delete a profile: move it into a `.trash/<name>-<ts>` sibling under the
 * root rather than removing it irrecoverably. The native home is never deletable.
 */
export async function removeProfile(name: string): Promise<void> {
  return serializeProfileMutation(async () => {
    assertNamedProfile(name, 'deleted');
    const dir = await resolveExistingProfileDir(name);
    if (hasProfileLaunchLease(dir)) {
      throw new Error(`profile "${name}" is in use by a running Wayland Core conversation`);
    }
    const trashRoot = await ensureContainedTrashRoot();
    const canonicalName = name.toLowerCase();
    const dest = join(trashRoot, `${canonicalName}-${Date.now()}`);
    const wasActive = (await getActiveProfile()) === canonicalName;
    if (wasActive) await writeActiveProfileMarker(DEFAULT_PROFILE);
    let moved = false;
    try {
      await rename(dir, dest);
      moved = true;
      // A successful archive receipt means the rename itself is durable, not
      // merely visible in this process's page cache.
      await syncDirectory(profilesRoot());
      await syncDirectory(trashRoot);
    } catch (error) {
      if (moved) {
        try {
          await rename(dest, dir);
          await syncDirectory(profilesRoot());
          await syncDirectory(trashRoot);
        } catch (rollbackError) {
          const archiveMessage = error instanceof Error ? error.message : String(error);
          throw new Error(
            `profile "${canonicalName}" moved into the local archive, but archive durability failed (${archiveMessage}) and the move could not be rolled back`,
            { cause: rollbackError }
          );
        }
      }
      if (wasActive) {
        try {
          await writeActiveProfileMarker(canonicalName);
        } catch (rollbackError) {
          const archiveMessage = error instanceof Error ? error.message : String(error);
          throw new Error(
            `failed to archive active profile "${canonicalName}" (${archiveMessage}) and failed to restore its active marker`,
            { cause: rollbackError }
          );
        }
      }
      throw error;
    }
  });
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
      return { ok: true, profiles: await listProfiles() };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
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
      await cloneProfile(profileSelectorName(from), to);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  });
  ipcBridge.wcoreProfiles.activate.provider(async ({ selector }) => {
    try {
      await activateProfile(profileSelectorName(selector));
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
