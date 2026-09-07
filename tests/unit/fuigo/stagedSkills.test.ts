import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';

// Real digests and filesystem operations exercise containment and byte identity.
const patch = vi.hoisted(() => ({
  files: [] as Array<{
    path: string;
    sourceSha256: string;
    resultSha256: string;
    edits: Array<{ start: number; deleteCount: number; lines: string[] }>;
  }>,
}));
vi.mock('@process/resources/skills/tvcontrol-setup/tideCompatibility.json', () => ({ default: patch }));
vi.mock('@process/utils/initStorage', () => ({
  getSkillsDir: () => '/unused/skills',
  getBuiltinSkillsCopyDir: () => '/unused/builtin',
  getAutoSkillsDir: () => '/unused/auto',
  getSystemDir: () => '/unused/system',
  ProcessConfig: { get: async () => null },
}));
import { repairStagedTideSkill } from '@process/utils/initAgent';
const roots: string[] = [];
const digest = (text: string) => createHash('sha256').update(text).digest('hex');
afterEach(async () => {
  for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true });
});
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tide-stage-'));
  roots.push(root);
  const skill = path.join(root, '.wayland', 'skills', 'tide-morning-brief');
  await fs.mkdir(path.join(skill, 'report'), { recursive: true });
  patch.files = ['report/collect.mjs', 'SKILL.md'].map((name) => ({
    path: name,
    sourceSha256: digest('original\n'),
    resultSha256: digest('repaired\n'),
    edits: [{ start: 0, deleteCount: 1, lines: ['repaired'] }],
  }));
  for (const item of patch.files) await fs.writeFile(path.join(skill, item.path), 'original\n');
  return { root, skill };
}
describe('stock skill workspace compatibility', () => {
  it('repairs exact stock copies idempotently', async () => {
    const { root, skill } = await fixture();
    await repairStagedTideSkill(root, skill);
    await repairStagedTideSkill(root, skill);
    for (const item of patch.files) expect(await fs.readFile(path.join(skill, item.path), 'utf8')).toBe('repaired\n');
  });
  it('preserves the entire pack when a customer customized either file', async () => {
    const { root, skill } = await fixture();
    await fs.writeFile(path.join(skill, 'SKILL.md'), 'custom');
    await repairStagedTideSkill(root, skill);
    expect(await fs.readFile(path.join(skill, 'report/collect.mjs'), 'utf8')).toBe('original\n');
    expect(await fs.readFile(path.join(skill, 'SKILL.md'), 'utf8')).toBe('custom');
  });
  it('refuses a bad replacement digest before writing either file', async () => {
    const { root, skill } = await fixture();
    patch.files[1].resultSha256 = digest('wrong');
    await expect(repairStagedTideSkill(root, skill)).rejects.toThrow('integrity mismatch');
    expect(await fs.readFile(path.join(skill, 'report/collect.mjs'), 'utf8')).toBe('original\n');
  });
  it('preserves source files behind a symlinked report directory', async () => {
    const { root, skill } = await fixture();
    const original = path.join(root, 'original-report');
    await fs.rename(path.join(skill, 'report'), original);
    await fs.symlink(original, path.join(skill, 'report'), 'junction');
    await repairStagedTideSkill(root, skill);
    expect(await fs.readFile(path.join(original, 'collect.mjs'), 'utf8')).toBe('original\n');
  });
  it('does not mutate skills outside the workspace', async () => {
    const { root, skill } = await fixture();
    const other = path.join(root, 'other-workspace');
    await fs.mkdir(other);
    await repairStagedTideSkill(other, skill);
    expect(await fs.readFile(path.join(skill, 'report/collect.mjs'), 'utf8')).toBe('original\n');
  });
});
