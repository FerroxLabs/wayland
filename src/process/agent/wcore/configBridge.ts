/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { mkdir, open, readFile, rename, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { parse, stringify } from 'smol-toml';
import { nativeConfigDir, resolveActiveConfigPath, withProfileAuthorityLock } from './profilePaths';
import { syncPublicationTarget } from '@process/utils/durabilitySync';

/**
 * Main-process bridge for the engine's USER `config.toml` (Wayland-Core
 * runtime config: tool allow-lists, security policy, memory, profiles, ...).
 *
 * Design invariants (security-load-bearing - the engine reads this file live):
 *  - Atomic writes: serialize to a sibling temp file, fsync, then `rename()`
 *    over the target. We never truncate-in-place, because a partial write would
 *    corrupt the config the engine is concurrently reading.
 *  - Single-flight lock: a module-level promise-chain mutex serializes every
 *    `setSection` so concurrent calls cannot interleave read-modify-write and
 *    lose an update.
 *  - Lossless: the WHOLE file is parsed into a plain object, only the targeted
 *    section is mutated, and the WHOLE object is re-stringified. Unknown
 *    sections/keys (including future engine config we don't model) survive.
 *
 * This bridge owns ONLY the user `config.toml`. The per-spawn project-local
 * `.wayland-core.toml` provider-override file written by `WCoreAgent` is a different
 * path and is NOT managed here.
 */

/** The `[tools]` section WS-2 edits first. Extra keys are preserved verbatim. */
export type WcoreToolsSection = {
  auto_approve?: boolean;
  allow_list?: string[];
  skills?: string[];
  [key: string]: unknown;
};

/** The `[security]` section. Modeled loosely; unknown keys are preserved. */
export type WcoreSecuritySection = Record<string, unknown>;

/** The `[memory]` section. Modeled loosely; unknown keys are preserved. */
export type WcoreMemorySection = Record<string, unknown>;

/** The `[profiles]` section. Modeled loosely; unknown keys are preserved. */
export type WcoreProfilesSection = Record<string, unknown>;

/**
 * Resolve the absolute path to the engine's NATIVE (`default`-profile) USER
 * `config.toml`, mirroring the engine's `wayland_config_dir()` precedence via
 * {@link nativeConfigDir}:
 *   1. `$WAYLAND_HOME`              -> `<WAYLAND_HOME>/config.toml`
 *   2. `$XDG_DATA_HOME`            -> `<XDG_DATA_HOME>/wayland-core/config.toml`
 *   3. `dirs::config_dir()`        -> `<config_dir>/wayland-core/config.toml`
 *
 * Reads `process.env` but is otherwise side-effect-free. This is the `default`
 * profile's location; named profiles relocate via {@link resolveActiveConfigPath}.
 */
export function resolveUserConfigPath(): string {
  return join(nativeConfigDir(), 'config.toml');
}

/**
 * Read and parse the ENTIRE user `config.toml` into a plain object. A missing
 * file resolves to `{}` (a fresh install has no config yet). Any other read or
 * parse error propagates - callers must not silently overwrite a config they
 * could not read.
 *
 * @param path Optional override (tests / non-default homes). Defaults to the
 *   ACTIVE profile's `config.toml` via `resolveActiveConfigPath()`.
 */
export async function readConfig(path?: string): Promise<Record<string, unknown>> {
  const target = path ?? (await resolveActiveConfigPath());
  let raw: string;
  try {
    raw = await readFile(target, 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    throw err;
  }
  return parse(raw) as Record<string, unknown>;
}

/**
 * Read a single top-level section. Returns `undefined` when the section is
 * absent. The generic `T` is a convenience cast only - it is not validated.
 */
export async function getSection<T = Record<string, unknown>>(section: string, path?: string): Promise<T | undefined> {
  const config = await readConfig(path);
  const value = config[section];
  return value === undefined ? undefined : (value as T);
}

// ── Single-flight write lock ──────────────────────────────────────────────
// A module-level promise chain. Every `setSection` appends its read-modify-
// write to the tail, so writes run strictly one at a time across the whole
// process - even concurrent calls targeting different sections - which is what
// keeps the read-modify-write atomic against lost updates. The chain swallows
// errors so one failed write does not poison subsequent ones.
let writeLock: Promise<unknown> = Promise.resolve();

function withWriteLock<T>(task: () => Promise<T>): Promise<T> {
  const run = writeLock.then(task, task);
  writeLock = run.then(
    (): undefined => undefined,
    (): undefined => undefined
  );
  return run;
}

/**
 * Atomically serialize `config` to `target`: write a sibling temp file, fsync
 * it to durable storage, then `rename()` over the target. `rename` within a
 * directory is atomic on POSIX and Windows, so a reader (the live engine) sees
 * either the old file or the fully-written new one - never a partial write.
 */
async function atomicWriteToml(target: string, config: Record<string, unknown>): Promise<void> {
  const dir = dirname(target);
  await mkdir(dir, { recursive: true });

  const body = `${stringify(config).trim()}\n`;
  // Temp file must live in the SAME directory so `rename` stays on one
  // filesystem (a cross-device rename is not atomic). PID + UUID avoids
  // collisions between concurrent processes sharing the directory.
  const tempPath = join(dir, `.config.toml.${process.pid}.${randomUUID()}.tmp`);

  const handle = await open(tempPath, 'wx', 0o600);
  try {
    await handle.writeFile(body, 'utf-8');
    await handle.sync();
    await handle.close();
    await rename(tempPath, target);
    // 'r' is O_RDONLY, which Windows refuses to fsync; route through the shared
    // platform rule so the win32 file-fallback actually works.
    await syncPublicationTarget(process.platform === 'win32' ? target : dir);
  } catch (error) {
    await handle.close().catch(() => {});
    await unlink(tempPath).catch((cleanupError: NodeJS.ErrnoException) => {
      if (cleanupError.code !== 'ENOENT') throw cleanupError;
    });
    throw error;
  }
}

export type ConfigMutation<T> = { value: T; changed: boolean };

/**
 * Run a whole-file mutation under the one process-wide config lock and publish
 * it atomically. Every writer of the active profile's config.toml must use this
 * seam; separate per-feature locks still permit lost updates.
 */
export function mutateConfig<T>(
  mutator: (config: Record<string, unknown>) => ConfigMutation<T> | Promise<ConfigMutation<T>>,
  path?: string
): Promise<T> {
  const mutate = () =>
    withWriteLock(async () => {
      const target = path ?? (await resolveActiveConfigPath());
      const config = await readConfig(target);
      const mutation = await mutator(config);
      if (mutation.changed) await atomicWriteToml(target, config);
      return mutation.value;
    });
  return path === undefined ? withProfileAuthorityLock(mutate) : mutate();
}

/**
 * Replace a single top-level section, preserving every other section/key.
 *
 * Lossless + atomic + serialized: parses the whole file, mutates only
 * `config[section]`, re-stringifies the whole object, and writes it through the
 * atomic temp-file+rename path under the single-flight lock. Concurrent calls
 * (including to different sections) are serialized so none is lost.
 *
 * @param section Top-level table name, e.g. `'tools'`, `'security'`.
 * @param value   The new section body. Replaces the section wholesale.
 * @param path    Optional override (tests / non-default homes).
 */
export function setSection(section: string, value: Record<string, unknown>, path?: string): Promise<void> {
  return mutateConfig((config) => {
    config[section] = value;
    return { value: undefined, changed: true };
  }, path);
}

// ── Typed section convenience accessors (used by WS-2) ────────────────────
// Thin wrappers over the generic get/set so callers get section types without
// repeating the section name string at every call site.

/** Read the `[tools]` section. */
export function getToolsSection(path?: string): Promise<WcoreToolsSection | undefined> {
  return getSection<WcoreToolsSection>('tools', path);
}

/** Replace the `[tools]` section. */
export function setToolsSection(value: WcoreToolsSection, path?: string): Promise<void> {
  return setSection('tools', value, path);
}

/** Read the `[security]` section. */
export function getSecuritySection(path?: string): Promise<WcoreSecuritySection | undefined> {
  return getSection<WcoreSecuritySection>('security', path);
}

/** Replace the `[security]` section. */
export function setSecuritySection(value: WcoreSecuritySection, path?: string): Promise<void> {
  return setSection('security', value, path);
}

/** Read the `[memory]` section. */
export function getMemorySection(path?: string): Promise<WcoreMemorySection | undefined> {
  return getSection<WcoreMemorySection>('memory', path);
}

/** Replace the `[memory]` section. */
export function setMemorySection(value: WcoreMemorySection, path?: string): Promise<void> {
  return setSection('memory', value, path);
}

/** Read the `[profiles]` section. */
export function getProfilesSection(path?: string): Promise<WcoreProfilesSection | undefined> {
  return getSection<WcoreProfilesSection>('profiles', path);
}

/** Replace the `[profiles]` section. */
export function setProfilesSection(value: WcoreProfilesSection, path?: string): Promise<void> {
  return setSection('profiles', value, path);
}

// NOTE: the human-only `wcoreConfig.*` IPC is wired in `bridge/wcoreConfigBridge.ts`,
// which routes through the typed `ipcBridge` adapter (remote-denied + security-sanitised).
// A previous raw `ipcMain.handle` registrar here bypassed both layers and was removed.
