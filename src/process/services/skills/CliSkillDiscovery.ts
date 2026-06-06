/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CLI-tool skill discovery (2026-05-21, step #4 of the four-source split).
 *
 * Scans the user's installed CLI tools - Claude Code, Codex, Gemini CLI -
 * for SKILL.md files under `~/.claude/skills/`, `~/.codex/skills/`,
 * `~/.gemini/skills/`. Each discovered skill surfaces on the Skills page
 * with `source: 'cli-discovered'` and a `sourceLabel` naming the tool that
 * shipped it, so the filter rail can sub-group by CLI.
 *
 * Default-off via the `skills.cliDiscovery.enabled` config flag. This is
 * an opt-in mirror - we don't want to surface third-party slash-command
 * files (which can include arbitrary instructions) without the user
 * explicitly asking. Acts as a credibility flex once enabled: "Wayland
 * sees the rest of your tooling," not "Wayland runs them."
 *
 * Requires app restart to take effect (no live config watcher yet). The
 * Settings → Skills toggle includes copy noting the restart requirement.
 *
 * Per-CLI failure modes (missing root dir, malformed SKILL.md, missing
 * frontmatter) degrade silently - the discovery never blocks boot.
 */

import path from 'path';
import { readdir, readFile, stat } from 'fs/promises';
import { homedir } from 'os';
import type { SkillIndexEntry } from '@/common/types/skillTypes';
import { SkillLibrary } from '@process/services/skills/SkillLibrary';
import { parseFrontmatter } from '@process/task/AcpSkillManager';

const TAG = '[CliSkillDiscovery]';

type CliRoot = {
  /** Absolute path to the CLI's skills directory. */
  path: string;
  /** Human-readable label shown on the Skills page badge. */
  sourceLabel: 'Claude Code' | 'Codex' | 'Gemini CLI';
};

function defaultRoots(): CliRoot[] {
  const home = homedir();
  return [
    { path: path.join(home, '.claude', 'skills'), sourceLabel: 'Claude Code' },
    { path: path.join(home, '.codex', 'skills'), sourceLabel: 'Codex' },
    { path: path.join(home, '.gemini', 'skills'), sourceLabel: 'Gemini CLI' },
  ];
}

/**
 * Walk a single CLI root, building one `SkillIndexEntry` per `<dir>/SKILL.md`
 * pair. Skips:
 *   - Non-directory children (loose files at the root).
 *   - Directories with no SKILL.md.
 *   - SKILL.md files whose frontmatter is missing or unparseable (logged
 *     once per skipped entry - these are usually transitional or partially
 *     authored skills).
 */
async function discoverInRoot(root: CliRoot): Promise<SkillIndexEntry[]> {
  let dirs: string[];
  try {
    dirs = await readdir(root.path);
  } catch {
    // Root missing - user doesn't have this CLI installed. Silent skip.
    return [];
  }

  const out: SkillIndexEntry[] = [];
  for (const dirName of dirs) {
    const dirPath = path.join(root.path, dirName);

    let statResult;
    try {
      statResult = await stat(dirPath);
    } catch {
      continue;
    }
    if (!statResult.isDirectory()) continue;

    const skillMdPath = path.join(dirPath, 'SKILL.md');
    let body: string;
    try {
      body = await readFile(skillMdPath, 'utf-8');
    } catch {
      // No SKILL.md in this child - e.g., a CLI command file that lives
      // outside the SKILL.md convention.
      continue;
    }

    const parsed = parseFrontmatter(body);
    if (!parsed) {
      console.warn(`${TAG} Skipping ${skillMdPath} - frontmatter missing or invalid.`);
      continue;
    }

    out.push({
      name: parsed.name,
      description: parsed.description ?? '',
      type: parsed.type ?? 'skill',
      source: 'cli-discovered',
      sourceLabel: root.sourceLabel,
      metadata: parsed.metadata,
      path: skillMdPath,
    });
  }
  return out;
}

let loaded = false;

type LoadCliSkillsOptions = {
  /**
   * Bypass the feature-flag check. Test-only - production callers respect
   * the user's opt-in.
   */
  force?: boolean;
  /**
   * Override the default CLI root list. Test-only - production callers
   * scan the three standard tool directories.
   */
  rootsOverride?: CliRoot[];
};

/**
 * Discover and register CLI-tool skills on the `SkillLibrary` singleton.
 *
 * Async because each root requires fs I/O. Idempotent - second call is a
 * no-op (the loaded latch flips on entry, even when the flag is off,
 * so flipping the flag and re-calling without a restart won't double-fire).
 *
 * Returns the total number of entries registered (0 when the flag is off
 * or no CLIs are installed).
 */
export async function loadCliSkills(opts: LoadCliSkillsOptions = {}): Promise<number> {
  if (loaded) return 0;
  loaded = true;

  // Feature-flag gate. Tests bypass with `force: true`.
  if (!opts.force) {
    try {
      const { ProcessConfig } = await import('@process/utils/initStorage');
      const enabled = await ProcessConfig.get('skills.cliDiscovery.enabled');
      if (!enabled) {
        console.log(`${TAG} Disabled by config; skipping CLI skill discovery.`);
        return 0;
      }
    } catch {
      // Storage unavailable (subprocess MCP bundle, test harness without
      // initStorage). Fail safe - don't discover.
      return 0;
    }
  }

  const roots = opts.rootsOverride ?? defaultRoots();
  const lib = SkillLibrary.getInstance();
  let total = 0;
  for (const root of roots) {
    const entries = await discoverInRoot(root);
    if (entries.length === 0) continue;
    lib.registerSource(entries);
    console.log(`${TAG} Registered ${entries.length} skill(s) from ${root.sourceLabel}.`);
    total += entries.length;
  }
  if (total > 0) {
    console.log(`${TAG} Total ${total} CLI-discovered skill(s) registered.`);
  }
  return total;
}

/** Test-only: drop the loaded latch so a fresh discovery runs. */
export function __resetCliSkillDiscoveryForTests(): void {
  loaded = false;
}
