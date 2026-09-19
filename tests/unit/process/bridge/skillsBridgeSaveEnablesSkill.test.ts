/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A skill the user BUILDS must reach the next chat turn (#1190).
 *
 * Reported live: a skill created in the Skill builder showed up in the Skill
 * Manager and nowhere else - starring it changed nothing, and the engine
 * answered `[Skill error] Skill 'project-materials-organizer' not found`.
 *
 * Three separate reasons, all on the `skills.save` provider:
 *   - it wrote to `~/.wayland/skills`, the LEGACY tree, while every reader
 *     scans `getSkillsDir()` (which hangs off the CONFIG root);
 *   - it wrote the body verbatim, so a builder-authored skill had no
 *     frontmatter and `parseFrontmatter` dropped it from every disk scan;
 *   - nothing appended it to any assistant's `enabledSkills`, which
 *     `enableSkillForAssistant` documents: "nothing in MAIN mutates
 *     `enabledSkills` today".
 */

import path from 'node:path';

import fs from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
  const providers = new Map<string, (req?: unknown) => unknown>();
  // Minimal ipcBridge stand-in: any `<ns>.<name>.provider(cb)` registers cb
  // under its dotted key path. Mirrors skillsBridge.scanProgress.test.ts.
  const nodeFor = (keyPath: string): unknown =>
    new Proxy(
      {},
      {
        get(_target, prop) {
          if (typeof prop !== 'string') return undefined;
          if (prop === 'provider') {
            return (cb: (req?: unknown) => unknown) => providers.set(keyPath, cb);
          }
          if (prop === 'emit') return () => {};
          if (prop === 'on') return () => () => {};
          return nodeFor(keyPath ? `${keyPath}.${prop}` : prop);
        },
      }
    );

  // Built without `path`/`os`: vi.hoisted runs before the file's own imports.
  const skillsDir = `${process.env.TMPDIR ?? '/tmp'}/wayland-save-skills-${process.pid}`;
  const store: Record<string, unknown> = {};
  const ProcessConfig = {
    get: vi.fn(async (key: string) => store[key]),
    set: vi.fn(async (key: string, value: unknown) => {
      store[key] = value;
    }),
    update: vi.fn(async (key: string, mutator: (current: unknown) => Promise<unknown>) => {
      store[key] = await mutator(store[key]);
    }),
  };
  const registerSource = vi.fn(() => [] as string[]);
  return { providers, ipcBridge: nodeFor(''), skillsDir, store, ProcessConfig, registerSource };
});

const cleanReport = {
  verdict: 'clean' as const,
  findings: [],
  scannedAt: 0,
  scannerVersion: 1,
  llmScanned: false,
  contentHash: 'hash',
};

vi.mock('@/common', () => ({ ipcBridge: h.ipcBridge }));
vi.mock('electron', () => ({ app: { getVersion: () => '0.13.1' }, dialog: {} }));
vi.mock('@process/services/skills/SkillLibrary', () => ({
  SkillLibrary: {
    getInstance: () => ({ rescanStale: async () => ({ rescanned: 0 }), registerSource: h.registerSource }),
  },
}));
vi.mock('@process/services/skills/SkillGuard', () => ({ SkillGuard: { scan: vi.fn(async () => [cleanReport]) } }));
vi.mock('@process/services/skills/SkillImport', () => ({ SkillImport: class {} }));
vi.mock('@process/services/skills/SkillQuarantine', () => ({
  SkillQuarantine: { quarantineFromMemory: vi.fn(async () => '/fake/quarantine') },
}));
vi.mock('@process/services/skills/agentProfileImport', () => ({ importAgentProfile: vi.fn() }));
// NOT mocked away: `withSkillFrontmatter` decides "is this body already usable"
// by calling the REAL `parseFrontmatter`, which is the whole point - a stub
// would let this test pass while the readers still refused the file. Only the
// extension registry is stubbed, the one heavy import AcpSkillManager pulls in
// that the mocked initStorage does not already cover.
vi.mock('@process/extensions', () => ({
  ExtensionRegistry: { getInstance: () => ({ getSkills: () => [] }) },
}));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: h.ProcessConfig,
  getAssistantsDir: vi.fn(() => '/fake/assistants'),
  getSkillsDir: vi.fn(() => h.skillsDir),
  getBuiltinSkillsCopyDir: vi.fn(() => `${h.skillsDir}-builtin`),
  getAutoSkillsDir: vi.fn(() => `${h.skillsDir}-builtin/_builtin`),
}));
vi.mock('@process/extensions/data/bundle-vendored/teamSkillMerge', () => ({ loadTeamSkills: vi.fn() }));
vi.mock('@process/services/skills/CliSkillDiscovery', () => ({ loadCliSkills: vi.fn(async () => {}) }));
vi.mock('@process/services/database', () => ({ getDatabase: vi.fn() }));

import { initSkillsBridge } from '@process/bridge/skillsBridge';

initSkillsBridge();

const save = (args: Record<string, unknown>) =>
  h.providers.get('skills.save')!({
    name: 'Project Materials Organizer',
    description: 'Sorts project materials into folders',
    category: '',
    tags: [],
    body: '# my-skill\n\n## Instructions\n\nSort the files.\n',
    ...args,
  }) as Promise<{ name: string; verdict: string }>;

const enabledFor = (assistantId: string): string[] => {
  const assistants = (h.store['assistants'] ?? []) as Array<{ id: string; enabledSkills?: string[] }>;
  return assistants.find((a) => a.id === assistantId)?.enabledSkills ?? [];
};

beforeEach(() => {
  for (const key of Object.keys(h.store)) delete h.store[key];
  h.store['assistants'] = [
    { id: 'builtin-concierge', name: 'Concierge', enabledSkills: ['already-on'] },
    { id: 'builtin-smart-trader', name: 'Smart Trader', enabledSkills: [] },
  ];
  fs.rmSync(h.skillsDir, { recursive: true, force: true });
  fs.mkdirSync(h.skillsDir, { recursive: true });
});

describe('skills.save - a built skill lands where the engine looks', () => {
  it('writes SKILL.md under getSkillsDir(), not the legacy ~/.wayland/skills tree', async () => {
    const result = await save({});

    expect(result.name).toBe('project-materials-organizer');
    const destFile = path.join(h.skillsDir, 'project-materials-organizer', 'SKILL.md');
    expect(fs.existsSync(destFile)).toBe(true);
    expect(h.registerSource).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'project-materials-organizer', path: destFile }),
    ]);
  });

  it('gives a builder-authored body the frontmatter every disk scan requires', async () => {
    await save({});

    const written = fs.readFileSync(path.join(h.skillsDir, 'project-materials-organizer', 'SKILL.md'), 'utf-8');
    expect(written.startsWith('---\n')).toBe(true);
    expect(written).toContain('name: project-materials-organizer');
    expect(written).toContain('description: Sorts project materials into folders');
    expect(written).toContain('## Instructions');
  });

  it('leaves a body that already declares its own frontmatter untouched', async () => {
    const body = '---\nname: Hand Written\ndescription: mine\n---\n\n# body\n';
    await save({ body });

    const written = fs.readFileSync(path.join(h.skillsDir, 'project-materials-organizer', 'SKILL.md'), 'utf-8');
    expect(written).toBe(body);
  });
});

describe('skills.save - a built skill is switched on for the assistant that built it', () => {
  it('appends the new skill to the current assistant enabledSkills', async () => {
    await save({});

    expect(enabledFor('builtin-concierge')).toEqual(['already-on', 'project-materials-organizer']);
  });

  it('touches no other assistant', async () => {
    await save({});

    expect(enabledFor('builtin-smart-trader')).toEqual([]);
  });

  it('is idempotent - saving twice never duplicates the entry', async () => {
    await save({});
    await save({});

    expect(enabledFor('builtin-concierge')).toEqual(['already-on', 'project-materials-organizer']);
  });

  it('enables for the SAVED assistant when one is selected', async () => {
    h.store['guid.lastSelectedAgent'] = 'custom:builtin-smart-trader';

    await save({});

    expect(enabledFor('builtin-smart-trader')).toEqual(['project-materials-organizer']);
    expect(enabledFor('builtin-concierge')).toEqual(['already-on']);
  });

  it('does not enable a WORKFLOW - an assistant does not carry one in enabledSkills', async () => {
    await save({ type: 'workflow' });

    expect(enabledFor('builtin-concierge')).toEqual(['already-on']);
  });

  it('a blocked skill is quarantined and enabled for nobody', async () => {
    const { SkillGuard } = await import('@process/services/skills/SkillGuard');
    vi.mocked(SkillGuard.scan).mockResolvedValueOnce([{ ...cleanReport, verdict: 'blocked' }] as never);

    const result = await save({});

    expect(result.verdict).toBe('blocked');
    expect(fs.existsSync(path.join(h.skillsDir, 'project-materials-organizer'))).toBe(false);
    expect(enabledFor('builtin-concierge')).toEqual(['already-on']);
  });
});
