import { describe, it, expect, beforeEach } from 'vitest';
import { migrateSkillsPreferences } from '../../../src/common/config/skillsMigration';
import type { IConfigStorageRefer } from '../../../src/common/config/storage';

// Minimal in-memory config store for testing - same shape as ConfigStore in configMigration.ts
type StoreData = Partial<IConfigStorageRefer>;

const makeStore = (initial: StoreData = {}) => {
  const data: StoreData = { ...initial };
  return {
    async get<K extends keyof IConfigStorageRefer>(key: K): Promise<IConfigStorageRefer[K]> {
      return data[key] as IConfigStorageRefer[K];
    },
    async set<K extends keyof IConfigStorageRefer>(key: K, value: IConfigStorageRefer[K]): Promise<IConfigStorageRefer[K]> {
      data[key] = value;
      return value;
    },
    /** Test-only: read raw data without async */
    _raw(): StoreData {
      return data;
    },
  };
};

describe('migrateSkillsPreferences', () => {
  describe('first-run seeding', () => {
    it('seeds pinned from the union of all assistant and custom-agent enabledSkills', async () => {
      const store = makeStore({
        assistants: [
          { id: 'a1', name: 'A1', enabled: true, isPreset: true, enabledSkills: ['skill-alpha', 'skill-beta'] },
          { id: 'a2', name: 'A2', enabled: true, isPreset: true, enabledSkills: ['skill-beta', 'skill-gamma'] },
        ],
        'acp.customAgents': [
          { id: 'c1', name: 'C1', enabled: true, enabledSkills: ['skill-delta'] },
        ],
      });

      await migrateSkillsPreferences(store);

      const prefs = (store._raw())['skills.preferences'];
      expect(prefs).toBeDefined();
      // Union of skill-alpha, skill-beta, skill-gamma (from assistants) + skill-delta (from custom agent)
      expect(new Set(prefs!.pinned)).toEqual(new Set(['skill-alpha', 'skill-beta', 'skill-gamma', 'skill-delta']));
    });

    it('produces an empty pinned array when no assistants have enabledSkills', async () => {
      const store = makeStore({
        assistants: [
          { id: 'a1', name: 'A1', enabled: true, isPreset: true },
        ],
      });

      await migrateSkillsPreferences(store);

      const prefs = (store._raw())['skills.preferences'];
      expect(prefs).toBeDefined();
      expect(prefs!.pinned).toEqual([]);
    });

    it('handles missing assistants and acp.customAgents gracefully', async () => {
      const store = makeStore({});

      await migrateSkillsPreferences(store);

      const prefs = (store._raw())['skills.preferences'];
      expect(prefs).toBeDefined();
      expect(prefs!.pinned).toEqual([]);
      expect(prefs!.disabled).toEqual([]);
    });

    it('sets disabled to empty array on first run', async () => {
      const store = makeStore({
        assistants: [{ id: 'a1', name: 'A1', enabled: true, isPreset: true, enabledSkills: ['skill-x'] }],
      });

      await migrateSkillsPreferences(store);

      const prefs = (store._raw())['skills.preferences'];
      expect(prefs!.disabled).toEqual([]);
    });

    it('sets revision to 1 on first run', async () => {
      const store = makeStore({});

      await migrateSkillsPreferences(store);

      const prefs = (store._raw())['skills.preferences'];
      expect(prefs!.revision).toBe(1);
    });

    it('migrates legacy skillsMarket.enabled = true into skills.preferences (no effect on disabled)', async () => {
      // skillsMarket.enabled = true means the skill was enabled - does NOT add to disabled
      const store = makeStore({ 'skillsMarket.enabled': true });

      await migrateSkillsPreferences(store);

      const prefs = (store._raw())['skills.preferences'];
      expect(prefs!.disabled).toEqual([]);
    });

    it('migrates legacy skillsMarket.enabled = false into skills.preferences (adds wayland-skills to disabled)', async () => {
      // skillsMarket.enabled = false means the user explicitly disabled wayland-skills
      const store = makeStore({ 'skillsMarket.enabled': false });

      await migrateSkillsPreferences(store);

      const prefs = (store._raw())['skills.preferences'];
      expect(prefs!.disabled).toContain('wayland-skills');
    });
  });

  describe('idempotency - migration flag prevents second run', () => {
    it('does not overwrite skills.preferences when migration flag is already set', async () => {
      const existingPrefs: IConfigStorageRefer['skills.preferences'] = {
        pinned: ['skill-already-pinned'],
        disabled: ['skill-already-disabled'],
        revision: 1,
      };
      const store = makeStore({
        'migration.skillsPreferences_v1': true,
        'skills.preferences': existingPrefs,
        assistants: [
          { id: 'a1', name: 'A1', enabled: true, isPreset: true, enabledSkills: ['skill-new'] },
        ],
      });

      await migrateSkillsPreferences(store);

      const prefs = (store._raw())['skills.preferences'];
      // Must be unchanged - second run is a no-op
      expect(prefs!.pinned).toEqual(['skill-already-pinned']);
      expect(prefs!.disabled).toEqual(['skill-already-disabled']);
    });

    it('sets the migration flag after first run', async () => {
      const store = makeStore({});

      await migrateSkillsPreferences(store);

      expect((store._raw())['migration.skillsPreferences_v1']).toBe(true);
    });

    it('running twice produces identical output', async () => {
      const store = makeStore({
        assistants: [
          { id: 'a1', name: 'A1', enabled: true, isPreset: true, enabledSkills: ['skill-x', 'skill-y'] },
        ],
      });

      await migrateSkillsPreferences(store);
      const after1 = JSON.stringify((store._raw())['skills.preferences']);

      await migrateSkillsPreferences(store);
      const after2 = JSON.stringify((store._raw())['skills.preferences']);

      expect(after1).toBe(after2);
    });
  });

  describe('precedence - global disabled beats per-assistant enable', () => {
    it('resolveSkillsPrecedence: global disabled overrides per-assistant enabledSkills', async () => {
      // Import the precedence helper directly
      const { resolveSkillsPrecedence } = await import('../../../src/common/config/skillsMigration');

      const result = resolveSkillsPrecedence(
        ['skill-a', 'skill-b', 'skill-c'],   // per-assistant enabledSkills
        { pinned: ['skill-a'], disabled: ['skill-b'], revision: 1 }   // global prefs
      );

      // skill-b is globally disabled → must be excluded even though per-assistant enables it
      expect(result).not.toContain('skill-b');
      // skill-a is globally pinned and per-assistant enabled → included
      expect(result).toContain('skill-a');
      // skill-c is per-assistant enabled, not globally disabled → included
      expect(result).toContain('skill-c');
    });

    it('resolveSkillsPrecedence: skill in pinned but also in disabled → disabled wins', async () => {
      const { resolveSkillsPrecedence } = await import('../../../src/common/config/skillsMigration');

      const result = resolveSkillsPrecedence(
        ['skill-conflict'],
        { pinned: ['skill-conflict'], disabled: ['skill-conflict'], revision: 1 }
      );

      expect(result).not.toContain('skill-conflict');
    });

    it('resolveSkillsPrecedence: null prefs → per-assistant list is returned as-is', async () => {
      const { resolveSkillsPrecedence } = await import('../../../src/common/config/skillsMigration');

      const result = resolveSkillsPrecedence(['skill-x', 'skill-y'], null);
      expect(result).toEqual(['skill-x', 'skill-y']);
    });
  });
});
