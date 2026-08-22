/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The preset rule copier rewrites `skills/` to the absolute user skills directory so a
 * model can run the scripts a rule file names. The rewrite was unanchored and duplicated
 * at both copy sites in initStorage.ts, and it corrupted the ONE preset whose `skills/`
 * occurrences are not at the start of a path.
 *
 * `smart-trader.md` says `cd .wayland-core/skills/market-open-report`. The unanchored
 * rewrite seeded `cd .wayland-core//Users/<user>/.wayland-config/skills/market-open-report`
 * onto real machines. The same file then tells the model that a failed `cd` means the
 * skill is not enabled, so Smart Trader's flagship opener reports the morning report as
 * missing instead of running it.
 *
 * SCOPE OF THE FIXTURE, stated rather than implied. The transform under test is the real
 * exported `absolutizeSkillPaths`. Its INPUT is the real bundled resource bytes on disk,
 * enumerated by the real `ASSISTANT_PRESETS` through the real `planPresetLocaleFileCopies`
 * - the same two production values initStorage.ts:683-760 iterates. Nothing here is a
 * hand-written rule file, and nothing asserts a shape production cannot emit. The fs copy
 * itself is not re-executed; the last assertion covers that half by pinning both call
 * sites to the helper, so a reintroduced inline regex fails here rather than on a user's
 * machine.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, it, expect } from 'vitest';

import { ASSISTANT_PRESETS } from '@/common/config/presets/assistantPresets';
import { planPresetLocaleFileCopies } from '@process/utils/presetLocaleFiles';
import { absolutizeSkillPaths } from '@process/utils/presetRulePaths';

const REPO_ROOT = path.resolve(__dirname, '../../..');

/** Stand-in for the real `getSkillsDir()`; absolute, as production's always is. */
const USER_SKILLS_DIR = '/private/tmp/wl-user-skills';

type Seeded = { presetId: string; file: string; before: string; after: string };

/**
 * Reproduce what initStorage's copy loop feeds the rewrite: for every preset, resolve its
 * resourceDir, plan the locale file copies exactly as production does, read the real file,
 * and run the real transform.
 */
function seedPresetCorpus(): Seeded[] {
  const out: Seeded[] = [];
  for (const preset of ASSISTANT_PRESETS) {
    if (!preset.resourceDir) continue;
    const dir = path.join(REPO_ROOT, preset.resourceDir);
    for (const map of [preset.ruleFiles, preset.skillFiles]) {
      if (!map || Object.keys(map).length === 0) continue;
      const plan = planPresetLocaleFileCopies(map, (file) => existsSync(path.join(dir, file)));
      for (const { file } of plan.copies) {
        const before = readFileSync(path.join(dir, file), 'utf-8');
        out.push({ presetId: preset.id, file, before, after: absolutizeSkillPaths(before, USER_SKILLS_DIR) });
      }
    }
  }
  return out;
}

const corpus = seedPresetCorpus();
const smartTrader = corpus.find((c) => c.presetId === 'smart-trader');
const starOffice = corpus.find((c) => c.presetId === 'star-office-helper');

describe('preset rule seeding rewrites only LEADING skills/ segments', () => {
  it('resolved a real preset corpus at all', () => {
    // A corpus of zero would make every assertion below pass vacuously.
    expect(corpus.length).toBeGreaterThanOrEqual(10);
    expect(smartTrader, 'smart-trader rule file must resolve on disk').toBeTruthy();
    expect(starOffice, 'star-office-helper rule file must resolve on disk').toBeTruthy();
  });

  it('leaves smart-trader`s workspace-relative .wayland-core/skills path intact', () => {
    // Precondition on the INPUT, so a resource edit cannot make this pass vacuously.
    expect(smartTrader!.before).toContain('.wayland-core/skills/market-open-report');
    expect(smartTrader!.before).not.toContain('//');

    expect(smartTrader!.after).toContain('.wayland-core/skills/market-open-report');
    // The exact shape that shipped: an absolute path spliced into the middle of a
    // relative one, which is always recognisable by the doubled separator.
    expect(smartTrader!.after).not.toContain('//');
    expect(smartTrader!.after).not.toContain(`.wayland-core/${USER_SKILLS_DIR}`);
    // Every `cd` in the seeded file must still be a relative path.
    for (const line of smartTrader!.after.split('\n').filter((l) => l.trimStart().startsWith('cd '))) {
      expect(line, `seeded cd line must stay workspace-relative: ${line}`).not.toContain(USER_SKILLS_DIR);
    }
  });

  it('KNOWN-POSITIVE CONTROL: star-office-helper still gets every leading skills/ absolutized', () => {
    // If this control is not green the test is not exercising the rewrite at all and the
    // assertion above means nothing.
    const beforeHits = starOffice!.before.match(/(^|[\s`'"(])skills\//g) ?? [];
    expect(beforeHits.length).toBeGreaterThanOrEqual(5);
    expect(starOffice!.after).toContain(`${USER_SKILLS_DIR}/star-office-helper/SKILL.md`);
    // No leading `skills/` survives untouched.
    expect(starOffice!.after.match(/(^|[\s`'"(])skills\//g) ?? []).toEqual([]);
  });

  it('ANTI-SHRINK FLOOR: the corpus-wide rewrite count cannot silently drop to zero', () => {
    // A helper that rewrites nothing would satisfy the smart-trader assertion perfectly.
    const rewrites = corpus.reduce(
      (n, c) => n + ((c.after.match(new RegExp(USER_SKILLS_DIR.replace(/\//g, '\\/'), 'g')) ?? []).length),
      0
    );
    expect(rewrites).toBeGreaterThanOrEqual(3);
    const filesChanged = corpus.filter((c) => c.after !== c.before);
    expect(filesChanged.length).toBeGreaterThanOrEqual(2);
  });

  it('BOTH copy sites go through the shared helper, not an inline regex', () => {
    // The rule-file site and the skill-file site had byte-identical unanchored rewrites.
    // Fixing one and leaving the other leaves the trap armed for the next preset.
    const src = readFileSync(path.join(REPO_ROOT, 'src/process/utils/initStorage.ts'), 'utf-8');
    expect(src).not.toMatch(/content\.replace\(\/skills\\\/\/g/);
    expect((src.match(/absolutizeSkillPaths\(content, userSkillsDir\)/g) ?? []).length).toBe(2);
  });
});
