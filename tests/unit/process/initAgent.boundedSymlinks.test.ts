/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Regression gate: setupAssistantWorkspace must NEVER place bulk library entries.
 *
 * The invariant: number of placements ≤ builtin_count + pinned.length + enabledSkills.length
 * regardless of how large the SkillLibrary is.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Normalize paths to forward slashes for cross-platform key matching
const norm = (p: string) => p.replace(/\\/g, '/');

// Use vi.hoisted() so tracking variables are initialized before vi.mock factories run
const { mkdirCalls, placementCalls, statResults, lstatResults, existsSyncResults, readdirResults, resetAll } =
  vi.hoisted(() => {
    const dirs: string[] = [];
    const links: Array<{ source: string; target: string }> = [];
    const stats: Record<string, boolean> = {};
    const lstats: Record<string, boolean> = {};
    const existsSync: Record<string, boolean> = {};
    const readdir: Record<string, string[]> = {};

    return {
      mkdirCalls: dirs,
      placementCalls: links,
      statResults: stats,
      lstatResults: lstats,
      existsSyncResults: existsSync,
      readdirResults: readdir,
      resetAll: () => {
        dirs.length = 0;
        links.length = 0;
        for (const key of Object.keys(stats)) delete stats[key];
        for (const key of Object.keys(lstats)) delete lstats[key];
        for (const key of Object.keys(existsSync)) delete existsSync[key];
        for (const key of Object.keys(readdir)) delete readdir[key];
      },
    };
  });

vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn(async (dir: string) => {
      mkdirCalls.push(norm(dir));
    }),
    stat: vi.fn(async (p: string) => {
      if (statResults[norm(p)]) return {};
      throw new Error(`ENOENT: ${p}`);
    }),
    lstat: vi.fn(async (p: string) => {
      if (lstatResults[norm(p)]) return {};
      throw new Error(`ENOENT: ${p}`);
    }),
    readdir: vi.fn(async (p: string) => readdirResults[norm(p)] ?? []),
  },
}));

// Skills are COPIED into the workspace now, not symlinked - wayland-core's
// SandboxedFs refuses a link resolving outside its root. The bound this gate
// protects matters MORE under copying, because each placement costs real bytes.
vi.mock('@process/utils/utils', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  copyDirectoryRecursively: vi.fn(async (source: string, target: string) => {
    placementCalls.push({ source: norm(source), target: norm(target) });
  }),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn((p: string) => existsSyncResults[norm(p)] ?? false),
}));

vi.mock('@process/utils/initStorage', () => ({
  getSkillsDir: vi.fn(() => '/mock/user/skills'),
  getBuiltinSkillsCopyDir: vi.fn(() => '/mock/builtin-skills'),
  getAutoSkillsDir: vi.fn(() => '/mock/auto-skills'),
  getSystemDir: vi.fn(() => '/mock/system'),
  // ProcessConfig.get not called when _skillsPreferences is injected
  ProcessConfig: { get: vi.fn() },
}));

vi.mock('@process/utils/openclawUtils', () => ({
  computeOpenClawIdentityHash: vi.fn(() => 'mock-hash'),
}));

vi.mock('@/common/utils', () => ({
  uuid: vi.fn(() => 'mock-uuid'),
}));

/** Build a fake library of n entries with clean verdict */
function makeLibrary(n: number): Array<{ name: string; security: { verdict: string } }> {
  return Array.from({ length: n }, (_, i) => ({
    name: `library-skill-${i}`,
    security: { verdict: 'clean' },
  }));
}

describe('setupAssistantWorkspace - bounded skill-placement regression gate', () => {
  let setupAssistantWorkspace: Awaited<
    ReturnType<typeof import('@process/utils/initAgent')>
  >['setupAssistantWorkspace'];

  beforeEach(async () => {
    vi.clearAllMocks();
    resetAll();
    const mod = await import('@process/utils/initAgent');
    setupAssistantWorkspace = mod.setupAssistantWorkspace;
  });

  it('placement count is bounded to builtin + pinned + enabledSkills regardless of library size', async () => {
    // 1 builtin auto-skill
    const builtinNames = ['cron'];
    readdirResults['/mock/auto-skills'] = builtinNames;
    for (const n of builtinNames) {
      statResults[`/mock/auto-skills/${n}`] = true;
    }

    // pinned: ['skill-a', 'skill-b']
    // enabledSkills: ['skill-c']
    // library: 50 entries (none should be symlinked)
    const prefs = { pinned: ['skill-a', 'skill-b'], disabled: [], revision: 1 };
    const library = makeLibrary(50);

    // Make skill-a, skill-b, skill-c exist in user skills dir
    statResults['/mock/user/skills/skill-a'] = true;
    statResults['/mock/user/skills/skill-b'] = true;
    statResults['/mock/user/skills/skill-c'] = true;

    await setupAssistantWorkspace('/tmp/workspace', {
      backend: 'claude',
      enabledSkills: ['skill-c'],
      _skillsPreferences: prefs,
      _libraryEntries: library,
    });

    // Expected: cron (builtin) + skill-a, skill-b (pinned) + skill-c (enabled) = 4
    const maxExpected = builtinNames.length + prefs.pinned.length + 1; // enabledSkills.length = 1
    expect(placementCalls.length).toBe(maxExpected);
    expect(placementCalls.length).toBeLessThanOrEqual(maxExpected);

    // Library entries must NOT appear in symlink targets
    const symlinkTargets = placementCalls.map((c) => c.target);
    for (const entry of library) {
      const hasLibraryEntry = symlinkTargets.some((t) => t.includes(entry.name));
      expect(hasLibraryEntry).toBe(false);
    }
  });

  it('library entries beyond builtin/pinned/enabled are NOT symlinked', async () => {
    readdirResults['/mock/auto-skills'] = [];
    const library = makeLibrary(50);
    // Make all library entries "exist" on disk - they still must not be symlinked
    for (const e of library) {
      statResults[`/mock/user/skills/${e.name}`] = true;
    }

    await setupAssistantWorkspace('/tmp/workspace', {
      backend: 'claude',
      enabledSkills: [],
      _skillsPreferences: { pinned: [], disabled: [], revision: 1 },
      _libraryEntries: library,
    });

    expect(placementCalls).toHaveLength(0);
  });

  it('a blocked skill is NOT placed even when it appears in enabledSkills', async () => {
    readdirResults['/mock/auto-skills'] = [];
    statResults['/mock/user/skills/blocked-skill'] = true;

    const library = [{ name: 'blocked-skill', security: { verdict: 'blocked' } }];

    await setupAssistantWorkspace('/tmp/workspace', {
      backend: 'claude',
      enabledSkills: ['blocked-skill'],
      _skillsPreferences: { pinned: ['blocked-skill'], disabled: [], revision: 1 },
      _libraryEntries: library,
    });

    // The skill exists on disk but verdict is blocked - must not be symlinked
    expect(placementCalls).toHaveLength(0);
  });

  it('a disabled skill (skills.preferences.disabled) is NOT placed even when in enabledSkills', async () => {
    readdirResults['/mock/auto-skills'] = [];
    statResults['/mock/user/skills/disabled-skill'] = true;

    await setupAssistantWorkspace('/tmp/workspace', {
      backend: 'claude',
      enabledSkills: ['disabled-skill'],
      _skillsPreferences: { pinned: [], disabled: ['disabled-skill'], revision: 1 },
      _libraryEntries: [],
    });

    expect(placementCalls).toHaveLength(0);
  });

  it('a blocked builtin skill is NOT placed', async () => {
    readdirResults['/mock/auto-skills'] = ['cron', 'evil-skill'];
    statResults['/mock/auto-skills/cron'] = true;
    statResults['/mock/auto-skills/evil-skill'] = true;

    const library = [{ name: 'evil-skill', security: { verdict: 'blocked' } }];

    await setupAssistantWorkspace('/tmp/workspace', {
      backend: 'claude',
      enabledSkills: [],
      _skillsPreferences: { pinned: [], disabled: [], revision: 1 },
      _libraryEntries: library,
    });

    // Only cron symlinked; evil-skill blocked
    expect(placementCalls).toHaveLength(1);
    expect(placementCalls[0].target).toContain('cron');
    expect(placementCalls.some((c) => c.target.includes('evil-skill'))).toBe(false);
  });

  it('pinned skills that are also in enabledSkills are not duplicated', async () => {
    readdirResults['/mock/auto-skills'] = [];
    statResults['/mock/user/skills/skill-a'] = true;

    await setupAssistantWorkspace('/tmp/workspace', {
      backend: 'claude',
      enabledSkills: ['skill-a'],
      _skillsPreferences: { pinned: ['skill-a'], disabled: [], revision: 1 },
      _libraryEntries: [],
    });

    // skill-a in both pinned and enabledSkills - should only symlink once
    expect(placementCalls).toHaveLength(1);
    expect(placementCalls[0].target).toContain('skill-a');
  });

  it('with large library (≥50 entries), symlink count never exceeds builtin+pinned+enabled bound', async () => {
    const builtinNames = ['cron'];
    readdirResults['/mock/auto-skills'] = builtinNames;
    statResults['/mock/auto-skills/cron'] = true;

    const prefs = { pinned: ['skill-a', 'skill-b'], disabled: [], revision: 1 };
    const enabledSkills = ['skill-c'];
    const library = makeLibrary(50);

    statResults['/mock/user/skills/skill-a'] = true;
    statResults['/mock/user/skills/skill-b'] = true;
    statResults['/mock/user/skills/skill-c'] = true;

    await setupAssistantWorkspace('/tmp/workspace', {
      backend: 'claude',
      enabledSkills,
      _skillsPreferences: prefs,
      _libraryEntries: library,
    });

    const bound = builtinNames.length + prefs.pinned.length + enabledSkills.length;
    expect(placementCalls.length).toBeLessThanOrEqual(bound);
    // Library entries absent
    const targets = placementCalls.map((c) => c.target);
    for (const e of library) {
      expect(targets.some((t) => t.includes(e.name))).toBe(false);
    }
  });
});
