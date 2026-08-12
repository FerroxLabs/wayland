import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { ASSISTANT_PRESETS } from '../../src/common/config/presets/assistantPresets';

/**
 * A pinned skill that resolves to nothing fails SILENTLY: the name is dropped
 * with a warning, the assistant opens looking perfectly healthy, and it is
 * simply missing the expertise it was built around. Nobody finds out until the
 * answers are quietly worse.
 *
 * Two presets were already guarded by hand (ignition, cowork). Every other
 * preset that pins skills - twenty of them - had nothing checking the names at
 * all, which is exactly how a typo ships.
 *
 * A pinned name is valid if it has a SKILL.md in one of the three places skills
 * actually live. All three are real and in use, so a guard that knows about
 * fewer of them would fail on correct data:
 *
 *   1. `skills/<name>/` — the bundled skills symlinked into the agent workspace.
 *   2. `skills/_builtin/<name>/` — bundled skills kept in a subfolder
 *      (`cowork` pins `skill-creator`, which lives here).
 *   3. `skills-library/bodies/skills/<category>/<name>/` — library skills
 *      retrieved by search rather than pinned to disk (`concierge` pins its own
 *      how-to skill, which lives here).
 */
const RESOURCES = path.resolve(__dirname, '../../src/process/resources');
const BUNDLED = path.join(RESOURCES, 'skills');
const LIBRARY = path.join(RESOURCES, 'skills-library/bodies/skills');

/** The category folder is not knowable from the pin, so search across them. */
const librarySkillExists = (name: string): boolean => {
  if (!existsSync(LIBRARY)) return false;
  return readdirSync(LIBRARY, { withFileTypes: true }).some(
    (entry) => entry.isDirectory() && existsSync(path.join(LIBRARY, entry.name, name, 'SKILL.md'))
  );
};

const resolvePinnedSkill = (name: string): string | null => {
  const bundled = path.join(BUNDLED, name, 'SKILL.md');
  if (existsSync(bundled)) return bundled;
  const builtin = path.join(BUNDLED, '_builtin', name, 'SKILL.md');
  if (existsSync(builtin)) return builtin;
  return librarySkillExists(name) ? 'library' : null;
};

const PRESETS_WITH_PINS = ASSISTANT_PRESETS.filter((p) => (p.defaultEnabledSkills ?? []).length > 0);

describe('preset pinned skills resolve to a real skill', () => {
  it('there are presets pinning skills, so this guard is not vacuous', () => {
    expect(PRESETS_WITH_PINS.length).toBeGreaterThan(5);
  });

  it('every pinned skill name exists somewhere skills are actually loaded from', () => {
    const unresolved: string[] = [];
    for (const preset of PRESETS_WITH_PINS) {
      for (const skill of preset.defaultEnabledSkills ?? []) {
        if (!resolvePinnedSkill(skill)) unresolved.push(`${preset.id} pins "${skill}"`);
      }
    }
    expect(unresolved).toEqual([]);
  });

  /**
   * For the bundled cases the frontmatter `name` is what the workspace filter
   * matches on, so a directory whose SKILL.md declares a different name is
   * present on disk and still never loads.
   */
  it('bundled pinned skills declare the name they are pinned by', () => {
    const mismatched: string[] = [];
    for (const preset of PRESETS_WITH_PINS) {
      for (const skill of preset.defaultEnabledSkills ?? []) {
        const resolved = resolvePinnedSkill(skill);
        if (!resolved || resolved === 'library') continue;
        const frontmatter = readFileSync(resolved, 'utf-8').match(/^---\s*\n([\s\S]*?)\n---/);
        const declared = frontmatter?.[1].match(/^name:[ \t]*['"]?([^'"\n]+?)['"]?[ \t]*$/m)?.[1].trim();
        if (declared !== skill) mismatched.push(`${preset.id} pins "${skill}" but SKILL.md declares "${declared}"`);
      }
    }
    expect(mismatched).toEqual([]);
  });
});
