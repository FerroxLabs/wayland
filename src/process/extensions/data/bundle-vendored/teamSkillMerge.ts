/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Team skill load (2026-05-21, step #3 of the four-source split).
 *
 * Vendored FoundrySkills covers the 1,965 `type: 'skill'` Wayland-library
 * skills. The Wayland Teams bundle ships its own curated 88 skills
 * (`research-*`, `copy-*`, `sales-*`, `forge-*`, `mira-*`, `beacon-*`,
 * `humanizer-*`, etc.) at `~/dev/waylandteams/contributes/skills.json` for
 * dev or `~/Library/Application Support/<Wayland>/wayland/extensions/
 * waylandteams/contributes/skills.json` for production installs.
 *
 * The Skills page filter rail wants four sources: Wayland library / Team /
 * User-imported / CLI-discovered. This overlay loads the team bundle and
 * registers each entry on the live `SkillLibrary` singleton tagged
 * `source: 'team'`, with an absolute `path` pointing at the bundle's
 * SKILL.md. `SkillLibrary.loadBody` honors absolute paths since
 * `SkillLibrary.ts` was updated alongside this file.
 *
 * Idempotent (cached after first run). Degrades cleanly - when the bundle
 * is missing (e.g. a packaged build with no team bundle installed) the
 * call is a no-op with a debug log.
 */

import path from 'path';
import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import type { SkillIndexEntry } from '@/common/types/skillTypes';
import { SkillLibrary } from '@process/services/skills/SkillLibrary';

const TAG = '[TeamSkillMerge]';

type RawTeamSkill = {
  name?: unknown;
  description?: unknown;
  file?: unknown;
};

let loaded = false;

/**
 * Resolve the waylandteams bundle root.
 *
 * Dev: `~/dev/waylandteams/` - Sean's canonical source-of-truth checkout.
 *
 * Production: any `~/Library/Application Support/Wayland*` install that has
 * the bundle symlinked under `wayland/extensions/waylandteams/`. We probe
 * the three known variants (Wayland, Wayland-Dev, Wayland-Beta) instead of
 * shelling out to a glob.
 *
 * Returns the FIRST candidate whose `contributes/skills.json` is present.
 */
function resolveTeamBundleRoot(): string | null {
  const home = homedir();
  const candidates = [
    path.join(home, 'dev', 'waylandteams'),
    path.join(home, 'Library', 'Application Support', 'Wayland', 'wayland', 'extensions', 'waylandteams'),
    path.join(home, 'Library', 'Application Support', 'Wayland-Dev', 'wayland', 'extensions', 'waylandteams'),
    path.join(home, 'Library', 'Application Support', 'Wayland-Beta', 'wayland', 'extensions', 'waylandteams'),
  ];
  for (const c of candidates) {
    if (existsSync(path.join(c, 'contributes', 'skills.json'))) return c;
  }
  return null;
}

/**
 * Derive a category slug from a team-skill name. Team skills follow the
 * convention `<cluster>-<verb>-<noun>` (e.g. `beacon-channel-strategy`),
 * where the first hyphen-segment names the agent cluster that authored the
 * skill. Surfacing that as the category gives the filter rail a useful
 * grouping (Research/Copy/Sales/Forge/Mira/Beacon/Humanizer) instead of one
 * flat "Team" bucket.
 *
 * Names without a hyphen fall back to a flat `team` category.
 */
function deriveCategory(name: string): string {
  const dash = name.indexOf('-');
  if (dash <= 0) return 'team';
  return name.slice(0, dash);
}

/**
 * Build the 88-entry overlay. Cached after first invocation. Returns []
 * on any I/O / shape failure so the call site can no-op cleanly.
 *
 * `explicitRoot` is a test affordance - when set, the candidate probe is
 * skipped and the supplied directory is used as the bundle root.
 */
function buildEntries(explicitRoot?: string): SkillIndexEntry[] {
  const root = explicitRoot ?? resolveTeamBundleRoot();
  if (!root) {
    console.log(`${TAG} Team bundle not found on disk; skipping team-skill load.`);
    return [];
  }

  const manifestPath = path.join(root, 'contributes', 'skills.json');
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  } catch (err) {
    console.warn(`${TAG} Failed to read ${manifestPath}: ${String(err)}`);
    return [];
  }

  if (!Array.isArray(parsed)) {
    console.warn(`${TAG} ${manifestPath} is not an array; skipping.`);
    return [];
  }

  const out: SkillIndexEntry[] = [];
  const seen = new Set<string>();
  for (const raw of parsed) {
    if (!raw || typeof raw !== 'object') continue;
    const entry = raw as RawTeamSkill;
    if (typeof entry.name !== 'string' || entry.name.length === 0) continue;
    if (typeof entry.description !== 'string') continue;
    if (typeof entry.file !== 'string' || entry.file.length === 0) continue;
    if (seen.has(entry.name)) continue;
    seen.add(entry.name);

    out.push({
      name: entry.name,
      description: entry.description,
      type: 'skill',
      source: 'team',
      sourceLabel: 'Wayland Teams',
      metadata: {
        tags: [],
        category: deriveCategory(entry.name),
      },
      path: path.join(root, entry.file),
    });
  }
  return out;
}

type LoadTeamSkillsOptions = {
  /**
   * Override the bundle root. Test-only - production callers pass nothing
   * and the resolver probes the standard dev / app-support candidates.
   */
  bundleRoot?: string;
};

/**
 * Register the team-bundle skills on the `SkillLibrary` singleton.
 *
 * Idempotent - subsequent calls return immediately. Safe to wire into any
 * boot path that runs before the first `list({ type: 'skill' })` consumer
 * (currently `initSkillsBridge`).
 */
export function loadTeamSkills(opts: LoadTeamSkillsOptions = {}): void {
  if (loaded) return;
  loaded = true;

  const entries = buildEntries(opts.bundleRoot);
  if (entries.length === 0) return;

  SkillLibrary.getInstance().registerSource(entries);
  console.log(`${TAG} Registered ${entries.length} team skill(s).`);
}

/** Test-only: drop the loaded latch so a fresh registration runs. */
export function __resetTeamSkillMergeForTests(): void {
  loaded = false;
}
