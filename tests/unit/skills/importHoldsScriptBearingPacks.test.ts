/**
 * A pack that brings executable files is HELD until the user says yes.
 *
 * The sweep reads prompt text. It cannot vouch for a `.py` or an `.mjs`, and
 * `initAgent` COPIES the skill directory into the workspace the agent runs
 * shell in. The importer used to register the skill, switch it on for the
 * current assistant, and only THEN return the file names in `warnings` - which
 * is disclosure after the fact, not consent.
 *
 * It was worse here than it looks, because our own setup guide tells a
 * non-technical buyer to approve what they are asked. Someone told in advance
 * to say yes has not consented to something they were shown afterwards.
 *
 * The hold reuses the machinery a `review` verdict already had: the on-disk
 * copy stays so `confirmImport` can re-verify it against the hash the user saw,
 * but nothing is registered and nothing is switched on until they click.
 */
import path from 'node:path';

import { describe, it, expect, beforeEach, vi } from 'vitest';

const registerSource = vi.fn(() => [] as string[]);
const enableForCurrent = vi.fn(async () => 'builtin-smart-trader');

vi.mock('@process/services/skills/SkillLibrary', () => ({
  SkillLibrary: { getInstance: () => ({ registerSource }) },
}));
vi.mock('@process/services/skills/SkillGuard', () => ({
  SkillGuard: {
    scan: async (inputs: Array<{ name: string }>) =>
      inputs.map(() => ({ verdict: 'clean', findings: [], contentHash: 'hash-of-what-they-saw' })),
  },
}));
vi.mock('@process/services/skills/enableSkillForAssistant', () => ({
  enableSkillForCurrentAssistant: enableForCurrent,
  assistantDisplayName: async () => 'Smart Trader',
  enableSkillForAssistant: async () => true,
  SMART_TRADER_ASSISTANT_ID: 'builtin-smart-trader',
}));

import type { SkillImportIo } from '@process/services/skills/SkillImport';

const { SkillImport } = await import('@process/services/skills/SkillImport');

const SKILL_MD = '---\nname: tide-morning-brief\ntype: skill\n---\nbody';

/** A fake tree: SKILL.md plus whatever else `files` names. */
function ioWithTree(files: Record<string, string>): SkillImportIo {
  const names = Object.keys(files);
  return {
    // A path is a directory unless it ends in one of the tree's file names.
    lstat: vi.fn(
      async (p: string) =>
        ({
          isSymbolicLink: () => false,
          isDirectory: () => !names.some((n) => p.endsWith(n)),
        }) as never
    ),
    exists: vi.fn(async () => false),
    readdir: vi.fn(async () => names as never),
    readFile: vi.fn(async (p: string) => {
      const hit = names.find((n) => p.endsWith(n));
      return Buffer.from(hit ? files[hit] : '') as never;
    }),
    copyFile: vi.fn(async () => {}),
    mkdir: vi.fn(async () => {}),
    writeFile: vi.fn(async () => {}),
    gitClone: vi.fn(async () => {}),
    unzip: vi.fn(async () => []),
    mkdtemp: vi.fn(async (prefix: string) => `/tmp/${prefix}X`),
    rmdir: vi.fn(async () => {}),
  };
}

function importerFor(files: Record<string, string>) {
  return new SkillImport(
    ioWithTree(files),
    undefined,
    async () => null,
    () => '/skills'
  );
}

beforeEach(() => {
  registerSource.mockClear();
  enableForCurrent.mockClear();
});

describe('a pack carrying runnable files', () => {
  it('is NOT registered and NOT switched on', async () => {
    const result = await importerFor({
      'SKILL.md': SKILL_MD,
      'collect.mjs': '// collector',
      'brief_html.py': '# renderer',
    }).importFolder('/src/tide-morning-brief');

    expect(result.imported[0].registered).toBe(false);
    expect(registerSource).not.toHaveBeenCalled();
    expect(enableForCurrent).not.toHaveBeenCalled();
  });

  it('says WHY it is waiting, so the words can differ from a flagged sweep', async () => {
    const result = await importerFor({
      'SKILL.md': SKILL_MD,
      'collect.mjs': '// collector',
    }).importFolder('/src/tide-morning-brief');

    expect(result.imported[0].heldFor).toBe('scripts');
    expect(result.imported[0].report.verdict).toBe('clean');
  });

  it('names every runnable file it found, before anything is installed', async () => {
    const result = await importerFor({
      'SKILL.md': SKILL_MD,
      'collect.mjs': '// collector',
      'assemble.py': '# assembler',
    }).importFolder('/src/tide-morning-brief');

    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('collect.mjs'), expect.stringContaining('assemble.py')])
    );
  });

  it('keeps the on-disk copy, so confirmImport can re-verify it', async () => {
    const result = await importerFor({
      'SKILL.md': SKILL_MD,
      'collect.mjs': '// collector',
    }).importFolder('/src/tide-morning-brief');

    // path.join, not a literal: the importer joins skillsDir with the pack name,
    // so the separator follows the running platform and a hardcoded '/' reds the
    // Windows shard while asserting nothing extra on macOS.
    expect(result.imported[0].destPath).toBe(path.join('/skills', 'tide-morning-brief'));
    expect(result.quarantined).toEqual([]);
  });
});

describe('a pack of plain documentation is unaffected', () => {
  it('still installs and switches on with no extra click', async () => {
    // The gate must cost nothing to the packs that never carried code, or it
    // just trains people to click through it.
    const result = await importerFor({
      'SKILL.md': SKILL_MD,
      'reference.md': '# notes',
      'watchlist.csv': 'a,b\n1,2\n',
    }).importFolder('/src/tide-morning-brief');

    expect(result.imported[0].registered).toBe(true);
    expect(result.imported[0].heldFor).toBeNull();
    expect(registerSource).toHaveBeenCalledTimes(1);
    expect(enableForCurrent).toHaveBeenCalledTimes(1);
  });
});
