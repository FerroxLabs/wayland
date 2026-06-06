import type { IConfigStorageRefer } from './storage';

/** Skill name used by the legacy skillsMarket.enabled flag. */
const SKILLS_MARKET_SKILL_NAME = 'wayland-skills';

/** Shape of the global skills preferences object. */
type SkillsPreferences = NonNullable<IConfigStorageRefer['skills.preferences']>;

/**
 * Minimal config-store interface - same pattern as ConfigStore in configMigration.ts.
 * Accepted by migrateSkillsPreferences so it can be tested without real filesystem deps.
 */
export type SkillsMigrationStore = {
  get<K extends keyof IConfigStorageRefer>(key: K): Promise<IConfigStorageRefer[K]>;
  set<K extends keyof IConfigStorageRefer>(key: K, value: IConfigStorageRefer[K]): Promise<IConfigStorageRefer[K]>;
};

/**
 * One-shot migration: seed `skills.preferences` from existing assistant and
 * custom-agent data so that current users keep their today's behavior after upgrade.
 *
 * What it does (runs exactly once, guarded by `migration.skillsPreferences_v1`):
 *   - Collects the UNION of every assistant's and custom-agent's `enabledSkills`.
 *   - Stores that union as `skills.preferences.pinned` (always-on global layer).
 *   - Reads the legacy `skillsMarket.enabled` flag: if it was explicitly `false`,
 *     adds `wayland-skills` to `skills.preferences.disabled`.
 *   - Sets `migration.skillsPreferences_v1 = true` to prevent re-running.
 */
export async function migrateSkillsPreferences(store: SkillsMigrationStore): Promise<void> {
  // Guard: already migrated - skip.
  const alreadyMigrated = await store.get('migration.skillsPreferences_v1').catch((): undefined => undefined);
  if (alreadyMigrated) return;

  // Collect enabledSkills from all assistants and custom agents.
  const assistants = (await store.get('assistants').catch((): undefined => undefined)) ?? [];
  const customAgents = (await store.get('acp.customAgents').catch((): undefined => undefined)) ?? [];

  const pinnedSet = new Set<string>();
  for (const agent of [...assistants, ...customAgents]) {
    for (const skill of agent.enabledSkills ?? []) {
      pinnedSet.add(skill);
    }
  }

  // Migrate legacy skillsMarket.enabled: explicit false → add wayland-skills to disabled.
  const skillsMarketEnabled = await store.get('skillsMarket.enabled').catch((): undefined => undefined);
  const disabled: string[] = skillsMarketEnabled === false ? [SKILLS_MARKET_SKILL_NAME] : [];

  const prefs: SkillsPreferences = {
    pinned: Array.from(pinnedSet),
    disabled,
    revision: 1,
  };

  await store.set('skills.preferences', prefs);
  await store.set('migration.skillsPreferences_v1', true);
}

/**
 * Apply the global skills preference layer to a per-assistant skill list.
 *
 * Precedence (documented in storage.ts):
 *   1. Global `disabled` wins - a skill here is NEVER loaded, even if the
 *      per-assistant `enabledSkills` would include it.
 *   2. Everything else in `perAssistantSkills` passes through.
 *
 * When `globalPrefs` is null/undefined (not yet migrated), the original list
 * is returned unchanged so existing behaviour is preserved.
 *
 * @param perAssistantSkills  - `enabledSkills` from the individual assistant/agent config.
 * @param globalPrefs         - current value of `skills.preferences` from config store.
 * @returns                   - filtered skill list with global disabled removed.
 */
export function resolveSkillsPrecedence(
  perAssistantSkills: string[],
  globalPrefs: SkillsPreferences | null | undefined
): string[] {
  if (!globalPrefs) return perAssistantSkills;

  const disabledSet = new Set(globalPrefs.disabled);
  return perAssistantSkills.filter((skill) => !disabledSet.has(skill));
}
