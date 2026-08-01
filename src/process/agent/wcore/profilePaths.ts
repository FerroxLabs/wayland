/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Wayland Core profile PATH layer (WS-2 P3, Design B - directory isolation).
 *
 * This is the pure, dependency-light resolution layer shared by:
 *  - `profileStore.ts`   (profile mutations + human-only IPC),
 *  - `configBridge.ts`   (reads/writes the ACTIVE profile's `config.toml`),
 *  - `envBuilder.ts`     (sets `WAYLAND_HOME` on the engine spawn).
 *
 * It deliberately imports NOTHING from `@/common` (no `ipcBridge`) so that the
 * security-load-bearing config/spawn paths never pull the IPC graph in and no
 * import cycle can form.
 *
 * ── The isolation model ────────────────────────────────────────────────────
 * Each named profile is a self-contained config tree under Core's canonical
 * `<os-config>/wayland-core-profiles/<lowercase-name>/` control plane.
 * The engine reads its ENTIRE state (config.toml, memory.db, skills) relative to
 * `wayland_config_dir()`, which honours `$WAYLAND_HOME` first
 * (`crates/wcore-config/src/config.rs` - `WAYLAND_HOME` is the literal config
 * dir, NOT `<WAYLAND_HOME>/wayland-core`). So pointing `WAYLAND_HOME` at a
 * profile dir gives that profile its own model, tools, security, and memory -
 * exactly the "directory-isolated, no cross-contamination" contract.
 *
 * An internal Core-invalid `@native` selector maps to the NATIVE config dir
 * (`dirs::config_dir()/wayland-core`). A real named profile called `default`
 * remains distinct at `wayland-core-profiles/default/`, exactly matching Core's
 * producer-owned profile grammar. Only the internal selector bypasses the root.
 *
 * SECURITY (SEC-4): every renderer-supplied `name` is sanitised by
 * {@link assertSafeProfileName} and each profile entry is rejected when
 * symlinked before any fs op. The root may itself be Desktop's intentional
 * macOS CLI-compatibility symlink.
 */

import { lstat, mkdir, readFile, readdir, realpath } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve, sep } from 'node:path';

/** Core v0.12.25 profile-name grammar before semantic/reserved-name checks. */
export const PROFILE_NAME_RE = /^[A-Za-z0-9._-]{1,64}$/;

/** Windows-reserved device base names (case-insensitive), never valid as dirs. */
const WINDOWS_RESERVED = new Set([
  'CON',
  'PRN',
  'AUX',
  'NUL',
  ...Array.from({ length: 10 }, (_, i) => `COM${i}`),
  ...Array.from({ length: 10 }, (_, i) => `LPT${i}`),
]);

/** Internal, deliberately Core-invalid identity for the legacy native home. */
export const DEFAULT_PROFILE = '@native';

/** Filename of the active-profile marker stored at the profiles root. */
const ACTIVE_MARKER = 'active';

/**
 * Throw if `name` is not a safe single-segment profile name. Returns the name
 * unchanged when valid. PURE validator - no fs access - so it can be unit-tested
 * directly and reused by every mutating op.
 */
export function assertSafeProfileName(name: unknown): string {
  if (typeof name !== 'string') {
    throw new Error('profile name must be a string');
  }
  if (name === '.' || name === '..') {
    throw new Error('profile name must not be a relative path segment');
  }
  if (name.includes('/') || name.includes('\\') || name.includes(sep)) {
    throw new Error('profile name must not contain a path separator');
  }
  if (!PROFILE_NAME_RE.test(name)) {
    throw new Error("profile name must use only ASCII letters, digits, '.', '_', '-' and be 1-64 bytes");
  }
  if (name.startsWith('.') || name.startsWith('-') || name.endsWith('.') || /^\.+$/.test(name)) {
    throw new Error("profile name must not start with '.' or '-', end with '.', or consist only of dots");
  }
  const windowsStem = name.split('.')[0]?.toUpperCase() ?? '';
  if (WINDOWS_RESERVED.has(windowsStem)) {
    throw new Error('profile name must not be a reserved device name');
  }
  if (name.toLowerCase() === ACTIVE_MARKER) {
    throw new Error('profile name is reserved for the profiles control plane');
  }
  return name;
}

/** Absolute path to Core's canonical named-profile control-plane root. */
export function profilesRoot(): string {
  const override = process.env.WAYLAND_PROFILES_ROOT;
  const hasControlCharacter =
    override?.split('').some((character) => {
      const code = character.charCodeAt(0);
      return code <= 0x1f || code === 0x7f;
    }) ?? false;
  if (override && resolve(override) === override && !hasControlCharacter) return override;
  return join(platformConfigBase(), 'wayland-core-profiles');
}

/**
 * Resolve a profile directory path from a name, asserting (via realpath of the
 * parent) that it sits DIRECTLY under the profiles root. Defeats symlink and
 * `..` escapes even though the name regex already forbids separators.
 *
 * @returns the absolute, contained profile directory path.
 */
export async function resolveProfileDir(name: string): Promise<string> {
  assertSafeProfileName(name);
  const canonicalName = name.toLowerCase();
  const root = profilesRoot();
  await mkdir(root, { recursive: true });
  const realRoot = await realpath(root);
  const candidate = resolve(realRoot, canonicalName);
  // Parent of the candidate must BE the real root, and the candidate must be a
  // direct child (basename equals the validated name). A symlinked root or a
  // crafted name cannot satisfy both.
  if (dirname(candidate) !== realRoot || basename(candidate) !== canonicalName) {
    throw new Error('profile path escapes the profiles root');
  }
  try {
    const entry = await lstat(candidate);
    if (entry.isSymbolicLink() || !entry.isDirectory()) {
      throw new Error('profile path must be a real directory, not a link or file');
    }
    const realCandidate = await realpath(candidate);
    if (dirname(realCandidate) !== realRoot || basename(realCandidate) !== canonicalName) {
      throw new Error('profile path escapes the profiles root');
    }
    return realCandidate;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return candidate;
    throw error;
  }
}

/**
 * Resolve and atomically create a missing profile directory without following a
 * link that appears between resolution and creation. Existing entries are
 * revalidated after the `mkdir` race; links and non-directories fail closed.
 */
export async function ensureProfileDir(name: string): Promise<string> {
  const candidate = await resolveProfileDir(name);
  try {
    await mkdir(candidate, { recursive: false, mode: 0o700 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
  }
  return resolveProfileDir(name);
}

/** Resolve an existing contained profile without creating missing state. */
export async function resolveExistingProfileDir(name: string): Promise<string> {
  const candidate = await resolveProfileDir(name);
  const entry = await lstat(candidate);
  if (entry.isSymbolicLink() || !entry.isDirectory()) {
    throw new Error('profile path must be a real directory, not a link or file');
  }
  return candidate;
}

const MAX_PROFILE_TREE_ENTRIES = 10_000;
const MAX_PROFILE_TREE_DEPTH = 64;

let profileAuthorityQueue: Promise<void> = Promise.resolve();
const profileLaunchLeases = new Map<string, number>();
const releaseNoopProfileLease = async (): Promise<void> => {};

/** Serialize profile marker/tree mutations and launch-lease acquisition. */
export function withProfileAuthorityLock<T>(operation: () => Promise<T>): Promise<T> {
  const result = profileAuthorityQueue.then(operation);
  profileAuthorityQueue = result.then((): void => {}).catch((): void => {});
  return result;
}

/** Whether a running Core process still owns the named profile directory. */
export function hasProfileLaunchLease(directory: string): boolean {
  return (profileLaunchLeases.get(directory) ?? 0) > 0;
}

function retainResolvedProfile(identity: ActiveConfigIdentity): () => Promise<void> {
  if (identity.profile === DEFAULT_PROFILE) return async (): Promise<void> => {};
  profileLaunchLeases.set(identity.dir, (profileLaunchLeases.get(identity.dir) ?? 0) + 1);
  let released = false;
  return async (): Promise<void> => {
    if (released) return;
    released = true;
    await withProfileAuthorityLock(async () => {
      const remaining = (profileLaunchLeases.get(identity.dir) ?? 1) - 1;
      if (remaining > 0) profileLaunchLeases.set(identity.dir, remaining);
      else profileLaunchLeases.delete(identity.dir);
    });
  };
}

export type RuntimeLaunchAuthoritySnapshot =
  | { raw: true; identity: null; release: () => Promise<void> }
  | { raw: false; identity: ActiveConfigIdentity; release: () => Promise<void> };

/**
 * Atomically snapshot the persisted raw/managed choice and, for managed mode,
 * resolve and retain the exact active profile. The injected preference reader
 * keeps this path layer dependency-light while placing both authority reads in
 * one non-reentrant transaction. A corrupt managed profile cannot block a
 * launch explicitly committed to standalone raw mode.
 */
export function acquireRuntimeLaunchAuthority(
  readRawMode: () => Promise<boolean>
): Promise<RuntimeLaunchAuthoritySnapshot> {
  return withProfileAuthorityLock(async () => {
    const raw = await readRawMode();
    if (raw) {
      const snapshot: RuntimeLaunchAuthoritySnapshot = {
        raw: true,
        identity: null,
        release: releaseNoopProfileLease,
      };
      return snapshot;
    }
    const identity = await resolveActiveConfigIdentity();
    const snapshot: RuntimeLaunchAuthoritySnapshot = {
      raw: false,
      identity,
      release: retainResolvedProfile(identity),
    };
    return snapshot;
  });
}

/**
 * Atomically bind a previously resolved launch directory to the still-current
 * active profile, then retain it until the engine process exits. The CAS check
 * closes the resolve->publish/spawn race with activation or removal.
 */
export function acquireProfileLaunchLease(expectedDirectory: string): Promise<() => Promise<void>> {
  return withProfileAuthorityLock(async () => {
    const identity = await resolveActiveConfigIdentity();
    if (identity.dir !== expectedDirectory) {
      throw new ProfileIsolationError(identity.profile, 'active profile changed before launch lease acquisition');
    }
    return retainResolvedProfile(identity);
  });
}

/**
 * Reject links anywhere in an isolated named profile before Desktop reads,
 * clones, or launches Core against the tree. Links would otherwise let
 * config.toml, memory.db, skills, or future state escape the profile boundary.
 */
export async function assertProfileTreeIsSelfContained(root: string): Promise<void> {
  const canonicalRoot = await realpath(root);
  let visited = 0;

  const scan = async (directory: string, depth: number): Promise<void> => {
    if (depth > MAX_PROFILE_TREE_DEPTH) throw new Error('profile tree exceeds the maximum depth');
    const entries = await readdir(directory, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        visited += 1;
        if (visited > MAX_PROFILE_TREE_ENTRIES) throw new Error('profile tree exceeds the maximum entry count');
        const entryPath = join(directory, entry.name);
        const metadata = await lstat(entryPath);
        if (metadata.isSymbolicLink()) throw new Error(`profile tree contains a symbolic link: ${entry.name}`);
        if (!metadata.isDirectory() && !metadata.isFile()) {
          throw new Error(`profile tree contains an unsupported special file: ${entry.name}`);
        }
        if (metadata.isFile() && metadata.nlink !== 1) {
          throw new Error(`profile tree contains a hard-linked file: ${entry.name}`);
        }
        const canonical = await realpath(entryPath);
        if (canonical !== entryPath && !canonical.startsWith(`${canonicalRoot}${sep}`)) {
          throw new Error(`profile tree entry escapes the profile root: ${entry.name}`);
        }
        if (metadata.isDirectory()) await scan(entryPath, depth + 1);
      })
    );
  };

  await scan(canonicalRoot, 0);
}

/** Atomically reserve a brand-new contained profile directory. */
export async function createExclusiveProfileDir(name: string): Promise<string> {
  const candidate = await resolveProfileDir(name);
  try {
    await mkdir(candidate, { recursive: false, mode: 0o700 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new Error(`profile "${name}" already exists`, { cause: error });
    }
    throw error;
  }
  return resolveProfileDir(name);
}

/** Path to the active-profile marker file. */
export function activeMarkerPath(): string {
  return join(profilesRoot(), ACTIVE_MARKER);
}

/** Read the active profile name. Only an absent marker selects the native home. */
export async function getActiveProfile(): Promise<string> {
  try {
    const raw = (await readFile(activeMarkerPath(), 'utf-8')).trim();
    try {
      assertSafeProfileName(raw);
    } catch {
      throw new ProfileIsolationError(raw || '<empty-marker>', 'active-profile marker is invalid');
    }
    return raw.toLowerCase();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return DEFAULT_PROFILE;
    if (error instanceof ProfileIsolationError) throw error;
    throw new ProfileIsolationError('<unreadable-marker>', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Platform-native config base, mirroring the engine's `dirs::config_dir()`:
 *  - macOS:   `~/Library/Application Support`
 *  - Windows: `%APPDATA%` (roaming)
 *  - Linux:   `$XDG_CONFIG_HOME` or `~/.config`
 */
function platformConfigBase(): string {
  const home = homedir();
  switch (process.platform) {
    case 'darwin':
      return join(home, 'Library', 'Application Support');
    case 'win32':
      return process.env.APPDATA ?? join(home, 'AppData', 'Roaming');
    default: {
      const xdgConfig = process.env.XDG_CONFIG_HOME;
      return xdgConfig && xdgConfig.length > 0 ? xdgConfig : join(home, '.config');
    }
  }
}

/**
 * Config directory a standalone Core process resolves when Desktop deliberately
 * does not inject `WAYLAND_HOME` (raw-engine mode).
 *
 * Desktop's spawn environment does not forward the parent's `WAYLAND_HOME`,
 * `XDG_DATA_HOME`, or `XDG_CONFIG_HOME`; carrying any of them into this
 * projection would display a path the child cannot actually see. This therefore
 * mirrors the child process's platform fallback, not {@link nativeConfigDir}'s
 * Desktop-managed override precedence. `%APPDATA%` is forwarded on Windows.
 */
export function standaloneConfigDir(): string {
  const home = homedir();
  switch (process.platform) {
    case 'darwin':
      return join(home, 'Library', 'Application Support', 'wayland-core');
    case 'win32':
      return join(process.env.APPDATA ?? join(home, 'AppData', 'Roaming'), 'wayland-core');
    default:
      return join(home, '.config', 'wayland-core');
  }
}

/**
 * The NATIVE engine config dir for Desktop's internal `@native` selector, mirroring the engine's
 * `wayland_config_dir()` precedence EXACTLY (config.rs):
 *   1. `$WAYLAND_HOME`              -> `<WAYLAND_HOME>`               (literal dir)
 *   2. `$XDG_DATA_HOME`            -> `<XDG_DATA_HOME>/wayland-core`
 *   3. `dirs::config_dir()`        -> `<config_base>/wayland-core`
 *
 * Reads `process.env` but is otherwise side-effect-free. This is what the engine
 * resolves to when no named-profile `WAYLAND_HOME` is forced, preserving
 * existing standalone installs without conflating them with named `default`.
 */
export function nativeConfigDir(): string {
  const waylandHome = process.env.WAYLAND_HOME;
  if (waylandHome && waylandHome.length > 0) {
    return waylandHome;
  }
  const xdgDataHome = process.env.XDG_DATA_HOME;
  if (xdgDataHome && xdgDataHome.length > 0) {
    return join(xdgDataHome, 'wayland-core');
  }
  return join(platformConfigBase(), 'wayland-core');
}

/**
 * Thrown when a NAMED profile is active but its config dir cannot be resolved.
 *
 * Callers must treat this as fatal for whatever they were about to do (#278).
 * See the invariant on {@link resolveActiveConfigDir}: this condition is
 * unreachable for the native selector, so "fall back to native" is never a
 * safe recovery for a broken named profile - it is precisely cross-account bleed.
 */
export class ProfileIsolationError extends Error {
  readonly code = 'PROFILE_ISOLATION' as const;
  constructor(
    readonly profile: string,
    detail: string
  ) {
    super(
      `Cannot resolve the config directory for the active profile "${profile}" (${detail}). ` +
        `Refusing to continue against the default profile's data.`
    );
    this.name = 'ProfileIsolationError';
  }
}

/**
 * Resolve the config DIRECTORY for the currently-active profile:
 *  - `default` (or unset)  -> {@link nativeConfigDir} (backward-compatible).
 *  - a named profile       -> `~/.wayland/profiles/<name>/` (isolated tree).
 *
 * This is the single source of truth that BOTH the config bridge (what file the
 * panes edit) and the engine spawn (`WAYLAND_HOME`) resolve through, so they can
 * never disagree about which profile is live.
 *
 * FAILURE CONTRACT (#278) - load-bearing, do not "soften" this. Failures come in
 * TWO kinds and callers must NOT treat them alike:
 *
 *   1. {@link ProfileIsolationError} - a NAMED profile is active and its dir could
 *      not be resolved. Thrown only from the named-profile branch. A caller that
 *      catches this and falls back to the native (default-profile) dir has written
 *      code that can ONLY ever execute while a named profile is live, silently
 *      binding that profile to the DEFAULT profile's config.toml / memory.db /
 *      credentials. Such a fallback is not "best-effort", it is a guaranteed
 *      cross-account bleed. FAIL CLOSED on this one.
 *
 *   2. Anything else - a fault on the `default` branch. {@link nativeConfigDir}
 *      reaches `os.homedir()` unguarded, and that throws ERR_SYSTEM_ERROR when
 *      uv_os_homedir fails, so the default path is NOT throw-free. (An earlier
 *      draft of this contract claimed it was; that was wrong, and fail-closing on
 *      it would have bricked ordinary default-profile users - i.e. everyone today,
 *      since no profile UI ships yet - over an unrelated fault.)
 *
 * So: narrow on `instanceof ProfileIsolationError` before refusing to proceed.
 */
export type ActiveConfigIdentity = {
  profile: string;
  dir: string;
};

/** Resolve the active profile name and directory from one marker read. */
export async function resolveActiveConfigIdentity(): Promise<ActiveConfigIdentity> {
  const active = await getActiveProfile();
  if (active && active !== DEFAULT_PROFILE) {
    try {
      const dir = await resolveExistingProfileDir(active);
      await assertProfileTreeIsSelfContained(dir);
      return { profile: active, dir };
    } catch (err) {
      // Fail CLOSED, and do it with a CLASSIFIABLE error. The raw failure here is
      // an fs error, and at least one caller (WCoreMcpAgent.readConfig) treats a
      // bare ENOENT as "no config yet" and returns {} - which would silently
      // downgrade "this profile is broken" into "this profile is empty", then
      // write the result to the wrong file. ProfileIsolationError can never be
      // mistaken for a missing-file condition.
      throw new ProfileIsolationError(active, err instanceof Error ? err.message : String(err));
    }
  }
  return { profile: DEFAULT_PROFILE, dir: nativeConfigDir() };
}

export async function resolveActiveConfigDir(): Promise<string> {
  return (await resolveActiveConfigIdentity()).dir;
}

/** Resolve the active profile's `config.toml` path. */
export async function resolveActiveConfigPath(): Promise<string> {
  return join(await resolveActiveConfigDir(), 'config.toml');
}
