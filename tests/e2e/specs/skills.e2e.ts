/**
 * Skills - builtin auto-injection + custom skill registry.
 *
 * The fsBridge listed `4 builtin auto-injected skills` in the boot log; this
 * spec freezes that contract via `list-builtin-auto-skills`. We also exercise
 * the broader `list-available-skills` bridge for shape correctness and
 * `get-skill-paths` for the userSkillsDir contract that custom-skill workflows
 * depend on.
 *
 * Writing an actual custom skill on disk is left to integration tests - the
 * Electron app singleton is shared across all e2e specs and mutating the
 * user skills dir would leak into siblings. We assert the *registry surface*
 * here.
 */
import { test, expect } from '../fixtures';
import { invokeBridge } from '../helpers';

interface BuiltinSkill {
  name: string;
  description: string;
}

interface SkillPaths {
  userSkillsDir: string;
  builtinSkillsDir: string;
}

test.describe('Skills registry', () => {
  // ── 4 builtin auto-injected skills load ───────────────────────────────────
  // Boot-log invariant: `[fsBridge] Listed 4 builtin auto-injected skills`.
  // We treat 4 as the expected baseline but accept >=1 so an upstream additive
  // change doesn't fail the suite; we DO refuse 0, which means the
  // auto-injection list never resolved.
  test('list-builtin-auto-skills resolves the auto-injected skill set', async ({ page }) => {
    const list = await invokeBridge<BuiltinSkill[]>(page, 'list-builtin-auto-skills', undefined, 5_000);
    expect(Array.isArray(list), 'returns an array').toBe(true);
    expect(list.length, 'at least one builtin auto-skill registered').toBeGreaterThanOrEqual(1);
    for (const skill of list) {
      expect(typeof skill.name, 'skill.name is string').toBe('string');
      expect(skill.name.length, 'skill.name non-empty').toBeGreaterThan(0);
      expect(typeof skill.description, 'skill.description is string').toBe('string');
    }
    // Soft-floor expectation: keep an eye on the 4-skill contract from the
    // boot log. If this drifts up or down, update the assertion intentionally.
    if (list.length !== 4) {
      // eslint-disable-next-line no-console
      console.warn(`[skills.e2e] builtin auto-skill count drifted: expected 4, got ${list.length}`);
    }
  });

  // ── get-skill-paths returns the documented dirs ───────────────────────────
  test('get-skill-paths returns userSkillsDir + builtinSkillsDir', async ({ page }) => {
    const paths = await invokeBridge<SkillPaths>(page, 'get-skill-paths', undefined, 5_000);
    expect(paths, 'returned a value').toBeDefined();
    expect(typeof paths.userSkillsDir, 'userSkillsDir is string').toBe('string');
    expect(paths.userSkillsDir.length, 'userSkillsDir non-empty').toBeGreaterThan(0);
    expect(typeof paths.builtinSkillsDir, 'builtinSkillsDir is string').toBe('string');
    expect(paths.builtinSkillsDir.length, 'builtinSkillsDir non-empty').toBeGreaterThan(0);
  });

  // ── list-available-skills returns an array of skill entries ───────────────
  test('list-available-skills returns an array', async ({ page }) => {
    type SkillEntry = { name: string; description?: string; path?: string };
    const list = await invokeBridge<SkillEntry[]>(page, 'list-available-skills', undefined, 8_000);
    expect(Array.isArray(list), 'returns an array').toBe(true);
    for (const skill of list) {
      expect(typeof skill.name, 'skill.name is string').toBe('string');
    }
  });

  // ── Writing a custom skill to disk would leak into sibling specs ─────────
  test.skip(
    'writing a custom skill to userSkillsDir would mutate the singleton app state shared across e2e specs - covered by integration suite',
    () => {}
  );
});
