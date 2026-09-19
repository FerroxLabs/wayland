/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * One-shot: bring skills stranded in the legacy `~/.wayland/skills` tree into
 * the one directory the app actually reads (#1190).
 *
 * The Skill builder wrote there until this release, and the importer before
 * it - see `LEGACY_IMPORTED_DIR`, "retained only so an older install can still
 * be found and migrated". That is the DATA root; `getSkillsDir()` hangs off the
 * CONFIG root. `SkillLibrary.registerSource` is an in-memory array, so a skill
 * left in the old tree is not merely un-enableable: after the next launch
 * nothing in the process knows it exists at all. Without this, upgrading does
 * not fix the skill the user already made - it only stops the NEXT one breaking.
 *
 * COPY, NEVER MOVE. The legacy copy is deliberately left exactly where it is,
 * so a user who downgrades still finds their skills where the old build looks
 * for them. Nothing here deletes or renames anything under the legacy root.
 *
 * SKIP, NEVER OVERWRITE. A name that already exists under `getSkillsDir()` is
 * left alone on BOTH sides and logged. The installed copy is the newer one by
 * construction (the legacy path has not been written since this release), and
 * a migration that clobbers it would destroy the user's current work to restore
 * their old work.
 *
 * DOT-DIRECTORIES ARE REFUSED, and that is a security rule rather than tidiness:
 * `SkillQuarantine.QUARANTINE_DIR` is `~/.wayland/skills/.quarantine`, so the
 * legacy root is exactly where BLOCKED bodies were put. Sweeping the tree
 * naively would promote quarantined content into the live skills directory,
 * where `initAgent` stages it into the workspace the agent runs shell in.
 *
 * SYMLINKS. `~/.wayland` is a symlink to Application Support on real machines,
 * so the root is resolved with `realpath` and the sweep runs against the
 * resolved path - a symlinked root migrates normally. Inside the tree the rule
 * inverts: a symlinked entry is admitted only when it resolves back UNDER the
 * resolved legacy root, and symlinks encountered while copying a skill's files
 * are skipped outright. A link is never followed out of the tree, and none is
 * ever recreated in the destination.
 *
 * Idempotent twice over: gated on `migration.legacySkillsDirCopied`, and even
 * with the flag cleared a second run copies nothing, because every name it
 * would write now exists and hits the skip-never-overwrite rule.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { homedir } from 'node:os';
import type { IConfigStorageRefer } from '@/common/config/storage';
import { withSkillFrontmatter } from '@process/services/skills/withSkillFrontmatter';
import { getSkillsDir } from '@process/utils/initStorage';

export const LEGACY_SKILLS_DIR_MIGRATION_KEY = 'migration.legacySkillsDirCopied';

/** The tree the builder and the old importer wrote to. */
export const LEGACY_SKILLS_ROOT = path.join(homedir(), '.wayland', 'skills');

/** Deepest nesting copied out of one skill folder. Mirrors `SkillImport._copyTree`. */
const MAX_COPY_DEPTH = 8;

export type LegacySkillsDirMigrationStore = {
  get<K extends keyof IConfigStorageRefer>(key: K): Promise<IConfigStorageRefer[K] | undefined>;
  set<K extends keyof IConfigStorageRefer>(key: K, value: IConfigStorageRefer[K]): Promise<unknown>;
};

export type LegacySkillsDirMigrationResult = {
  /** Skill directory names copied into `getSkillsDir()`. */
  copied: string[];
  /** Everything passed over, with the reason, so a support log can say why. */
  skipped: Array<{ name: string; reason: string }>;
};

export type LegacySkillsDirMigrationOptions = {
  legacyRoot?: string;
  skillsDir?: string;
  log?: (message: string) => void;
};

const EMPTY: LegacySkillsDirMigrationResult = { copied: [], skipped: [] };

/** True when `child` is `root` itself or sits underneath it. Both must be real paths. */
function isWithin(root: string, child: string): boolean {
  return child === root || child.startsWith(root + path.sep);
}

/**
 * Copy a skill folder's FILES into `dest`. Symlinks are skipped rather than
 * recreated or followed, so nothing in the destination can point outside it.
 */
async function copyTreeWithoutSymlinks(
  src: string,
  dest: string,
  skipped: LegacySkillsDirMigrationResult['skipped'],
  label: string,
  depth = 0
): Promise<void> {
  if (depth > MAX_COPY_DEPTH) {
    skipped.push({ name: label, reason: 'nested too deeply' });
    return;
  }

  await fs.mkdir(dest, { recursive: true });

  for (const entry of await fs.readdir(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);

    if (entry.isSymbolicLink()) {
      skipped.push({ name: `${label}/${entry.name}`, reason: 'symlink inside the skill folder' });
      continue;
    }
    if (entry.isDirectory()) {
      // oxlint-disable-next-line no-await-in-loop
      await copyTreeWithoutSymlinks(from, to, skipped, `${label}/${entry.name}`, depth + 1);
      continue;
    }
    if (!entry.isFile()) continue;
    // oxlint-disable-next-line no-await-in-loop
    await fs.copyFile(from, to);
  }
}

/**
 * Repair a migrated SKILL.md that carries no usable frontmatter, the same way
 * `skills.save` now composes it.
 *
 * Repaired rather than skipped: a stranded body with no `name:` is the exact
 * skill the builder used to produce, so skipping would leave the reporter of
 * #1190 with a dead skill after a migration written for them. The name is the
 * folder name, which is what the builder slugged it to. The description falls
 * back to `Skill: <name>`, the same string `discoverSkills` already substitutes
 * when frontmatter carries none - the skill becomes loadable BY NAME, which is
 * what was asked for, and the user can write a better description in the editor.
 * `type:` is left out because a body with no frontmatter cannot say whether it
 * was a skill or a workflow.
 */
async function repairFrontmatter(destDir: string, name: string): Promise<boolean> {
  const skillMd = path.join(destDir, 'SKILL.md');
  const body = await fs.readFile(skillMd, 'utf-8');
  const repaired = withSkillFrontmatter(body, { name, description: `Skill: ${name}` });
  if (repaired === body) return false;
  await fs.writeFile(skillMd, repaired, 'utf-8');
  return true;
}

export async function runLegacySkillsDirMigration(
  store: LegacySkillsDirMigrationStore,
  opts: LegacySkillsDirMigrationOptions = {}
): Promise<LegacySkillsDirMigrationResult> {
  const log = opts.log ?? ((message: string) => console.log('[legacySkillsDirMigration]', message));

  // The cheap gate FIRST. On every boot after the first this is one config read
  // of a value already in memory, and no filesystem call at all.
  if (await store.get(LEGACY_SKILLS_DIR_MIGRATION_KEY).catch(() => false)) return EMPTY;

  const legacyRoot = opts.legacyRoot ?? LEGACY_SKILLS_ROOT;
  const skillsDir = opts.skillsDir ?? getSkillsDir();

  // Resolve the root, which is how a symlinked ~/.wayland migrates instead of
  // being passed over. A missing root is the normal case on a fresh install:
  // record the flag and never look again.
  let legacyReal: string;
  try {
    legacyReal = await fs.realpath(legacyRoot);
  } catch {
    await store.set(LEGACY_SKILLS_DIR_MIGRATION_KEY, true);
    return EMPTY;
  }

  // If the two paths are the same tree - a machine where one was symlinked to
  // the other - there is nothing to move and a sweep would copy a directory
  // into itself.
  const skillsReal = await fs.realpath(skillsDir).catch((): null => null);
  if (skillsReal && (isWithin(legacyReal, skillsReal) || isWithin(skillsReal, legacyReal))) {
    await store.set(LEGACY_SKILLS_DIR_MIGRATION_KEY, true);
    return EMPTY;
  }

  const result: LegacySkillsDirMigrationResult = { copied: [], skipped: [] };

  // The legacy root itself, then the older importer's subfolder. Top level goes
  // first, so on a name held by both the top-level copy wins and the nested one
  // skips against it - deterministic either way.
  const sweepRoots = [legacyReal, path.join(legacyReal, 'imported')];

  for (const root of sweepRoots) {
    let entries: Awaited<ReturnType<typeof fs.readdir>> | Array<{ name: string }>;
    try {
      // oxlint-disable-next-line no-await-in-loop
      entries = await fs.readdir(root, { withFileTypes: true });
    } catch {
      continue; // `imported/` simply may not exist
    }

    for (const entry of entries as Array<import('node:fs').Dirent>) {
      const name = entry.name;

      // `.quarantine` lives here and holds BLOCKED bodies. Never promote one.
      if (name.startsWith('.')) {
        result.skipped.push({ name, reason: 'dot-directory (quarantine and other internals)' });
        continue;
      }
      // Swept as its own root below/above, not as a skill.
      if (root === legacyReal && name === 'imported') continue;

      const from = path.join(root, name);

      // A symlinked entry is admitted only if it stays inside the legacy tree.
      // oxlint-disable-next-line no-await-in-loop
      const fromReal = await fs.realpath(from).catch((): null => null);
      if (!fromReal) {
        result.skipped.push({ name, reason: 'unreadable or dangling' });
        continue;
      }
      if (!isWithin(legacyReal, fromReal)) {
        result.skipped.push({ name, reason: 'symlink pointing outside the legacy skills tree' });
        continue;
      }

      // oxlint-disable-next-line no-await-in-loop
      const stat = await fs.stat(fromReal).catch((): null => null);
      if (!stat?.isDirectory()) continue;

      // oxlint-disable-next-line no-await-in-loop
      const hasSkillMd = await fs
        .stat(path.join(fromReal, 'SKILL.md'))
        .then((s): boolean => s.isFile())
        .catch((): boolean => false);
      if (!hasSkillMd) {
        result.skipped.push({ name, reason: 'no SKILL.md at its root' });
        continue;
      }

      const dest = path.join(skillsDir, name);
      // oxlint-disable-next-line no-await-in-loop
      const taken = await fs
        .stat(dest)
        .then((): boolean => true)
        .catch((): boolean => false);
      if (taken) {
        result.skipped.push({ name, reason: 'a skill of that name is already installed' });
        continue;
      }

      try {
        // oxlint-disable-next-line no-await-in-loop
        await copyTreeWithoutSymlinks(fromReal, dest, result.skipped, name);
        // oxlint-disable-next-line no-await-in-loop
        if (await repairFrontmatter(dest, name)) {
          log(`repaired missing frontmatter on '${name}'`);
        }
        result.copied.push(name);
      } catch (error) {
        result.skipped.push({ name, reason: 'copy failed' });
        log(`failed to copy '${name}': ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  if (result.copied.length > 0) {
    log(`copied ${result.copied.length} skill(s) out of ${legacyReal}: ${result.copied.join(', ')}`);
  }
  for (const { name, reason } of result.skipped) {
    log(`skipped '${name}': ${reason}`);
  }

  await store.set(LEGACY_SKILLS_DIR_MIGRATION_KEY, true);
  return result;
}
