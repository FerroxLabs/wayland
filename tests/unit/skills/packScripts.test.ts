import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile, symlink } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import {
  ALLOWED_PACK_SCRIPT_EXTENSIONS,
  findDisallowedFile,
  findPackScripts,
} from '@/process/services/skills/installSkillPack';
import { REFUSED_IMPORT_EXTENSIONS, DISCLOSED_SCRIPT_EXTENSIONS } from '@/process/services/skills/SkillImport';

async function pack(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'packscripts-'));
  for (const [rel, body] of Object.entries(files)) {
    const full = path.join(dir, rel);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, body);
  }
  return dir;
}

describe('a pack may carry disclosed scripts, and only those', () => {
  it('accepts .py and .mjs beside the docs', async () => {
    const dir = await pack({
      'SKILL.md': '---\nname: x\n---\nbody',
      'report/collect.mjs': 'export {};',
      'report/brief_html.py': 'print(1)',
      'watchlists/list.csv': 'a,b',
    });
    expect(await findDisallowedFile(dir)).toBeNull();
  });

  it('still refuses a shell script - the case the guard exists for', async () => {
    const dir = await pack({ 'SKILL.md': 'x', 'helper.sh': '#!/bin/sh\necho hi' });
    expect(await findDisallowedFile(dir)).toBe('helper.sh');
  });

  it('still refuses a binary', async () => {
    const dir = await pack({ 'SKILL.md': 'x', 'bin/tool.exe': 'MZ' });
    expect(await findDisallowedFile(dir)).toBe('bin/tool.exe');
  });

  it('still refuses a symlink', async () => {
    const dir = await pack({ 'SKILL.md': 'x' });
    await symlink('/etc/passwd', path.join(dir, 'link.md'));
    expect(await findDisallowedFile(dir)).toBe('link.md');
  });

  it('names every script it carries, nested and sorted, so the caller can disclose them', async () => {
    const dir = await pack({
      'SKILL.md': 'x',
      'report/collect.mjs': 'a',
      'report/assemble.py': 'b',
      'notes.md': 'c',
    });
    expect(await findPackScripts(dir)).toEqual(['report/assemble.py', 'report/collect.mjs']);
  });

  it('reports no scripts for a docs-only pack, so disclosure stays truthful', async () => {
    const dir = await pack({ 'SKILL.md': 'x', 'watchlists/a.txt': 'y' });
    expect(await findPackScripts(dir)).toEqual([]);
  });

  it('keeps the two install paths in step - what one allows the other must not refuse', () => {
    expect([...ALLOWED_PACK_SCRIPT_EXTENSIONS].sort()).toEqual([...DISCLOSED_SCRIPT_EXTENSIONS].sort());
    for (const ext of ALLOWED_PACK_SCRIPT_EXTENSIONS) {
      expect(REFUSED_IMPORT_EXTENSIONS).not.toContain(ext);
    }
  });

  it('keeps shell and binary types refused on the zip path', () => {
    for (const ext of ['.sh', '.bash', '.ps1', '.exe', '.dylib', '.js', '.ts']) {
      expect(REFUSED_IMPORT_EXTENSIONS).toContain(ext);
    }
  });
});
