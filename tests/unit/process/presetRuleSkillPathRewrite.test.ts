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
 * `smart-trader.md` carries workspace-relative paths like
 * `.wayland-core/skills/tvcontrol-setup/SKILL.md`. The unanchored rewrite seeded
 * `.wayland-core//Users/<user>/.wayland-config/skills/...` onto real machines. The same file
 * then tells the model that a failed lookup means the skill is not in the workspace, so
 * Smart Trader reports its own bundled skills as missing instead of reading them.
 *
 * The anchor moved from `tide-morning-brief` to `tvcontrol-setup` when the strategy brief
 * became an importable packet rather than a bundled skill. The transform, the corpus and the
 * assertions are unchanged - only the name of the surviving bundled skill the fixture pins to.
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
    //
    // REPOINTED from `.wayland-core/skills/tvcontrol-setup` to the generic form.
    // The persona no longer names a per-skill READ path: on wayland-core v0.13.9
    // the engine's reader is absolute-only and refuses a workspace-relative one,
    // and that refusal reads as a missing file. Skills are now loaded by name
    // with the `Skill` tool. The workspace-relative form still ships for the
    // SHELL - `cd .wayland-core/skills/<skill>` - which is exactly the string
    // this transform must leave alone, so the invariant under test is unchanged.
    expect(smartTrader!.before).toContain('.wayland-core/skills/<skill>');
    expect(smartTrader!.before).not.toContain('//');

    expect(smartTrader!.after).toContain('.wayland-core/skills/<skill>');
    // The exact shape that shipped: an absolute path spliced into the middle of a
    // relative one, which is always recognisable by the doubled separator.
    expect(smartTrader!.after).not.toContain('//');
    expect(smartTrader!.after).not.toContain(`.wayland-core/${USER_SKILLS_DIR}`);
    // STRENGTHENED, not relaxed. This used to iterate lines starting with `cd `, which the
    // file no longer contains now that the opener ships no scripts - so the loop would have
    // passed over zero lines and asserted nothing. It now iterates the thing the transform
    // actually operates on, every `.wayland-core/skills/` occurrence, with a count guard so it
    // can never go vacuous again.
    const workspaceSkillRefs = smartTrader!.after
      .split('\n')
      .filter((l) => l.includes('.wayland-core/skills/'));
    expect(workspaceSkillRefs.length, 'fixture must still exercise the mid-string case').toBeGreaterThan(0);
    for (const line of workspaceSkillRefs) {
      expect(line, `workspace-relative skill path must stay relative: ${line}`).not.toContain(USER_SKILLS_DIR);
    }
  });

  /**
   * REWRITTEN, AND THE REWRITE IS THE POINT - see B6 in the readiness report.
   *
   * This assertion used to require the seeded text to say "Settings → Skills &
   * Tools". That remedy was invented: the page it names states, in the product,
   * "You don't switch skills on and off", and a skill missing from a workspace
   * is a fact about that workspace, not a toggle. The user followed the
   * instruction and arrived somewhere that could not help them.
   *
   * The claim this test makes is unchanged - a failed `cd` must not leave the
   * user at a dead end - and it is still checked in the same paragraph, with the
   * same anti-vacuous guard on the anchor. What changed is that the honest
   * answer to "the skill is not here" is "say so and stop", so the assertion is
   * now that the paragraph SAYS there is nowhere to send them, and that no
   * Settings path survives anywhere in the seeded file.
   */
  it('names the remedy when the cd fails, instead of just declaring the skill missing', () => {
    const seeded = smartTrader!.after;
    const idx = seeded.indexOf('not in this workspace');
    expect(idx, 'the failure instruction must still exist').toBeGreaterThan(-1);
    // Same paragraph, so the remedy is read together with the diagnosis.
    const paragraph = seeded.slice(0, idx).split('\n\n').pop()! + seeded.slice(idx).split('\n\n')[0];
    expect(paragraph).toMatch(/not in this workspace/);
    expect(paragraph.replace(/\s+/g, ' ')).toMatch(/no page anywhere in the app that adds it/i);
    // And the invented affordance is gone from the whole seeded document.
    expect(seeded).not.toMatch(/Settings\s*(?:→|->)/);
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
      (n, c) => n + (c.after.match(new RegExp(USER_SKILLS_DIR.replace(/\//g, '\\/'), 'g')) ?? []).length,
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
