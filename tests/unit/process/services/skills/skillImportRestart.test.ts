import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { SkillImport, defaultSkillImportIo } from '@process/services/skills/SkillImport';
import { SkillLibrary } from '@process/services/skills/SkillLibrary';
import { SkillGuard } from '@process/services/skills/SkillGuard';
import type { CompletedSkillImport } from '@process/services/skills/skillImportRegistration';
import type { SkillSecurityReport } from '@/common/types/skillTypes';

const storage = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn(), set: vi.fn() }));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: storage,
  getSkillsDir: vi.fn(),
  getBuiltinSkillsCopyDir: vi.fn(),
  getAutoSkillsDir: vi.fn(),
  getAssistantsDir: vi.fn(),
  getCronSkillsDir: vi.fn(),
}));
let root: string;
let installed: string;
let source: string;
let receipts: Record<string, CompletedSkillImport>;
const body =
  '---\nname: tide-morning-brief\ndescription: TC-TIDE report\ntype: skill\nmetadata:\n  tags: finance chart\n  category: finance\n---\nRead the current chart.\n';
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
function report(text = body, verdict: SkillSecurityReport['verdict'] = 'clean'): SkillSecurityReport {
  return { verdict, findings: [], scannedAt: 1, scannerVersion: 1, llmScanned: false, contentHash: hash(text) };
}
function freshLibrary() {
  SkillLibrary.resetInstance();
  return SkillLibrary.getInstance({
    resourceDir: path.join(root, 'library'),
    bundledWorkflowsDir: path.join(root, 'workflows'),
    installedSkillsDir: installed,
    readFile: async (file) => (file.endsWith('index.json') ? '[]' : fs.readFile(file, 'utf8')),
  });
}
function importer() {
  return new SkillImport(defaultSkillImportIo, undefined, undefined, () => installed);
}
beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'skill-restart-'));
  installed = path.join(root, 'config/skills');
  source = path.join(root, 'source/tide-morning-brief');
  await fs.mkdir(source, { recursive: true });
  await fs.writeFile(path.join(source, 'SKILL.md'), body);
  receipts = {};
  storage.get.mockImplementation(async (key) => (key === 'skills.completedImports' ? receipts : undefined));
  storage.update.mockImplementation(async (key, mutate) => {
    if (key === 'skills.completedImports') receipts = await mutate(receipts);
  });
  freshLibrary();
  vi.spyOn(SkillGuard, 'scan').mockImplementation(async (inputs) => inputs.map((input) => report(input.body)));
});
afterEach(async () => {
  vi.restoreAllMocks();
  SkillLibrary.resetInstance();
  await fs.rm(root, { recursive: true, force: true });
});

describe('completed import startup hydration', () => {
  it('restores a completed import into list/picker data with current metadata/guard and unchanged content', async () => {
    const result = await importer().importFolder(source);
    expect(result.imported[0].registered).toBe(true);
    expect(receipts['tide-morning-brief'].consent).toBe('not-required');
    const lib = freshLibrary();
    const entries = await lib.list({ source: 'imported' });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      name: 'tide-morning-brief',
      description: 'TC-TIDE report',
      source: 'imported',
      metadata: { tags: ['finance', 'chart'], category: 'finance' },
      security: { verdict: 'clean', llmScanned: false },
    });
    expect(await lib.loadBody('tide-morning-brief')).toBe(body);
    expect(await fs.readFile(path.join(installed, 'tide-morning-brief/SKILL.md'), 'utf8')).toBe(body);
    expect(SkillGuard.scan).toHaveBeenLastCalledWith(expect.any(Array), { llm: false });
  });
  it.each(['scripts', 'review'] as const)(
    'does not restore a %s-held import until normal confirmation',
    async (held) => {
      if (held === 'scripts') await fs.writeFile(path.join(source, 'collect.mjs'), 'export const collect = 1;');
      else
        vi.mocked(SkillGuard.scan).mockImplementation(async (inputs) =>
          inputs.map((input) => report(input.body, 'review'))
        );
      const instance = importer();
      const result = await instance.importFolder(source);
      expect(result.imported[0].registered).toBe(false);
      expect(Object.keys(receipts)).toHaveLength(0);
      expect(await freshLibrary().list({ source: 'imported' })).toEqual([]);
      expect(
        await instance.confirmImport({
          name: 'tide-morning-brief',
          destPath: path.join(installed, 'tide-morning-brief'),
          contentHash: hash(body),
        })
      ).toEqual({ ok: true });
      expect(receipts['tide-morning-brief'].consent).toBe('confirmed');
      expect(await freshLibrary().loadBody('tide-morning-brief')).toBe(body);
    }
  );
  it('allows an identical legacy pack through existing script consent without overwriting it; refuses different duplicates', async () => {
    await fs.writeFile(path.join(source, 'collect.mjs'), 'export const collect = 1;');
    const dest = path.join(installed, 'tide-morning-brief');
    await fs.cp(source, dest, { recursive: true });
    const before = await fs.stat(path.join(dest, 'SKILL.md'));
    const result = await importer().importFolder(source);
    expect(result.imported[0]).toMatchObject({ registered: false, heldFor: 'scripts' });
    expect(await freshLibrary().list({ source: 'imported' })).toEqual([]);
    expect((await fs.stat(path.join(dest, 'SKILL.md'))).mtimeMs).toBe(before.mtimeMs);
    await fs.writeFile(path.join(source, 'SKILL.md'), body + 'different');
    await expect(importer().importFolder(source)).rejects.toThrow('already installed');
    expect(await fs.readFile(path.join(dest, 'SKILL.md'), 'utf8')).toBe(body);
  });
  it('rejects changed approved inputs while ignoring unrelated generated output', async () => {
    await importer().importFolder(source);
    const dest = path.join(installed, 'tide-morning-brief');
    await fs.writeFile(path.join(dest, 'generated-report.html'), 'generated output');
    expect(await freshLibrary().loadBody('tide-morning-brief')).toBe(body);
    await fs.writeFile(path.join(dest, 'SKILL.md'), body + 'changed');
    expect(await freshLibrary().get('tide-morning-brief')).toBeNull();
  });
  it('does not authorize newly added consent-bearing scripts', async () => {
    await importer().importFolder(source);
    await fs.writeFile(path.join(installed, 'tide-morning-brief/new.mjs'), 'new executable input');
    expect(await freshLibrary().get('tide-morning-brief')).toBeNull();
  });
  it('does not claim a blocked identical existing pack was quarantined or move its files', async () => {
    const dest = path.join(installed, 'tide-morning-brief');
    await fs.cp(source, dest, { recursive: true });
    vi.mocked(SkillGuard.scan).mockImplementation(async (inputs) =>
      inputs.map((input) => report(input.body, 'blocked'))
    );
    await expect(importer().importFolder(source)).rejects.toThrow('existing files were preserved');
    expect(await fs.readFile(path.join(dest, 'SKILL.md'), 'utf8')).toBe(body);
    expect(Object.keys(receipts)).toHaveLength(0);
  });
  it('preserves a fresh blocked verdict and refuses its body', async () => {
    await importer().importFolder(source);
    vi.mocked(SkillGuard.scan).mockImplementation(async (inputs) =>
      inputs.map((input) => report(input.body, 'blocked'))
    );
    const lib = freshLibrary();
    expect((await lib.get('tide-morning-brief'))?.security?.verdict).toBe('blocked');
    expect(await lib.loadBody('tide-morning-brief')).toBeNull();
  });
  it('does not replace a custom registration with an installed import', async () => {
    await importer().importFolder(source);
    const lib = freshLibrary();
    lib.registerSource([
      {
        name: 'tide-morning-brief',
        description: 'custom',
        source: 'user',
        type: 'skill',
        path: '/custom/SKILL.md',
        metadata: { tags: [] },
      },
    ]);
    expect((await lib.get('tide-morning-brief'))?.source).toBe('user');
  });
});
