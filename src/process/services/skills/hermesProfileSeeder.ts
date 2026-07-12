/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * hermesProfileSeeder - surfaces each Hermes profile (`~/.hermes/profiles/<name>/`)
 * as a selectable preset Assistant.
 *
 * Hermes stores per-persona profiles as sibling dirs under `<HERMES_HOME>/profiles`,
 * each with its own `SOUL.md` identity. This seeder writes one `AcpBackendConfig`
 * row per profile into the `assistants` store so the profile appears - with zero
 * new roster code - in BOTH the 1:1 conversation picker and the group-chat/Teams
 * roster (`kind:'specialist'` + `isBuiltin:false` passes `isSelectableSpecialist`),
 * and spawns `hermes acp` with `HERMES_PROFILE=<name>` so hermes loads that
 * profile's SOUL.md persona.
 *
 * The record MUST carry `defaultCliPath` + `acpArgs`, otherwise
 * `AcpAgentManager.resolveCustomAgentCliConfig` early-returns and drops `env`
 * (`HERMES_PROFILE` never reaches the spawn). The seeder writes the record
 * directly (never via `buildAssistantFromSkillMd`) so `presetAgentType:'hermes'`
 * is not downgraded by that path's untrusted-frontmatter sanitizer - the value
 * here is a trusted constant, not user input.
 *
 * Pure `reconcileProfileAssistants` carries the diff/prune logic (unit-tested);
 * `discoverHermesProfiles` is the guarded disk scan; `seedHermesProfileAssistants`
 * is the thin IO wrapper called at boot (and on rescan).
 */

import { existsSync } from 'node:fs';
import { readdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import type { AcpBackendConfig } from '@/common/types/acpTypes';
import { hermesHome } from '@process/services/import/migration/hermesSource';

/** Id prefix that uniquely tags seeder-owned rows (never collides with builtin-/custom-/ext-). */
export const HERMES_PROFILE_ID_PREFIX = 'hermes-profile-';

/**
 * A profile dir name is used verbatim as `HERMES_PROFILE` and inside the assistant
 * id, so restrict it to a safe charset: must start alphanumeric, no path
 * separators / dots-only / control chars, bounded length. A name that fails this
 * (e.g. `..`, `a/b`, a leading dot) is skipped, so discovery can never traverse
 * the filesystem or forge another agent's id.
 */
export const SAFE_PROFILE_NAME = /^[A-Za-z0-9][A-Za-z0-9 _.-]{0,63}$/;

/** Absolute path to the Hermes profiles dir, honoring `HERMES_HOME` (win32: %LOCALAPPDATA%\hermes). */
export function hermesProfilesDir(env: NodeJS.ProcessEnv = process.env): string {
  return path.join(hermesHome(env), 'profiles');
}

/**
 * Build the preset-assistant record for one profile. Thin shell: no `context`
 * (the hermes engine supplies the profile's SOUL.md persona at runtime), env
 * carries ONLY `HERMES_PROFILE` so it can never clobber caller-supplied security
 * env at spawn-merge time.
 */
export function buildProfileAssistant(name: string): AcpBackendConfig {
  return {
    id: `${HERMES_PROFILE_ID_PREFIX}${name}`,
    name: `Hermes (${name})`,
    description: `Hermes profile "${name}" — runs \`hermes acp\` with HERMES_PROFILE=${name}.`,
    avatar: 'lucide:Bot',
    kind: 'specialist',
    isPreset: true,
    isBuiltin: false,
    presetAgentType: 'hermes',
    defaultCliPath: 'hermes',
    acpArgs: ['acp'],
    env: { HERMES_PROFILE: name },
    enabled: true,
  };
}

/**
 * Enumerate valid Hermes profile names under `profilesDir`. A profile is a
 * directory (or a symlink resolving to a dir that stays UNDER `profilesDir`)
 * whose name passes `SAFE_PROFILE_NAME` and which contains a `SOUL.md`. Does one
 * readdir + one realpath + one existsSync per child; never READS a file. Returns
 * `[]` (never throws) when the dir is missing/unreadable - which doubles as the
 * "hermes not installed" fast path (no profiles dir → no work).
 */
export async function discoverHermesProfiles(profilesDir: string): Promise<string[]> {
  const rootReal = await realpath(profilesDir).catch((): null => null);
  if (!rootReal) return [];

  let entries;
  try {
    entries = await readdir(profilesDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const checked = await Promise.all(
    entries.map(async (entry): Promise<string | null> => {
      const name = entry.name;
      if (!SAFE_PROFILE_NAME.test(name)) return null;
      if (!entry.isDirectory() && !entry.isSymbolicLink()) return null;

      // Resolve the real target and reject anything that escapes the profiles root
      // (e.g. `profiles/evil -> /etc` would otherwise turn discovery into a probe).
      const childReal = await realpath(path.join(profilesDir, name)).catch((): null => null);
      if (!childReal || (childReal !== rootReal && !childReal.startsWith(rootReal + path.sep))) return null;

      if (!existsSync(path.join(childReal, 'SOUL.md'))) return null;
      return name;
    })
  );
  return checked.filter((n): n is string => n !== null).toSorted();
}

/**
 * Diff discovered profiles against the current `assistants` list. Upserts one row
 * per profile (refreshing the seeder-owned spawn fields, preserving the
 * user-controlled `enabled`), and prunes `hermes-profile-` rows whose backing
 * profile dir is gone. Only ever touches the `hermes-profile-` prefix - user
 * (`custom-`), builtin (`builtin-`), and extension (`ext-`) rows are left intact.
 */
export function reconcileProfileAssistants(
  existing: AcpBackendConfig[],
  profileNames: string[]
): { next: AcpBackendConfig[]; changed: boolean } {
  const wantedIds = new Set(profileNames.map((n) => `${HERMES_PROFILE_ID_PREFIX}${n}`));
  let changed = false;

  const kept = existing.filter((a) => {
    if (typeof a.id !== 'string' || !a.id.startsWith(HERMES_PROFILE_ID_PREFIX)) return true;
    if (wantedIds.has(a.id)) return true;
    changed = true; // a profile dir was deleted → drop its stale row
    return false;
  });

  const next = [...kept];
  for (const name of profileNames) {
    const fresh = buildProfileAssistant(name);
    const index = next.findIndex((a) => a.id === fresh.id);
    if (index < 0) {
      next.push(fresh);
      changed = true;
      continue;
    }
    // Refresh only the fields the seeder owns (the spawn contract + classification);
    // keep the user's `enabled`, custom `name`, and `avatar` if they edited them.
    const current = next[index];
    const merged: AcpBackendConfig = {
      ...current,
      presetAgentType: fresh.presetAgentType,
      defaultCliPath: fresh.defaultCliPath,
      acpArgs: fresh.acpArgs,
      env: fresh.env,
      kind: fresh.kind,
      isPreset: fresh.isPreset,
      isBuiltin: fresh.isBuiltin,
    };
    if (JSON.stringify(merged) !== JSON.stringify(current)) {
      next[index] = merged;
      changed = true;
    }
  }
  return { next, changed };
}

/** IO seam - injected with real ConfigStorage at the call site, stubbed in tests. */
export type HermesProfileSeederIo = {
  getAssistants: () => Promise<AcpBackendConfig[]>;
  setAssistants: (next: AcpBackendConfig[]) => Promise<void>;
  /** Override the disk scan in tests; defaults to scanning `hermesProfilesDir()`. */
  discover?: () => Promise<string[]>;
};

/**
 * Seed/refresh the Hermes-profile preset assistants. Idempotent: writes to the
 * `assistants` store only when the reconcile produced a change. Safe to call at
 * every boot and on rescan.
 */
export async function seedHermesProfileAssistants(
  io: HermesProfileSeederIo
): Promise<{ changed: boolean; count: number }> {
  const profileNames = io.discover ? await io.discover() : await discoverHermesProfiles(hermesProfilesDir());
  const existing = await io.getAssistants();
  const { next, changed } = reconcileProfileAssistants(existing, profileNames);
  if (changed) await io.setAssistants(next);
  return { changed, count: profileNames.length };
}
