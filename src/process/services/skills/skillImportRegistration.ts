import path from 'node:path';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import type { SkillSecurityReport } from '@/common/types/skillTypes';

export type CompletedSkillImport = {
  name: string;
  contentHash: string;
  files: Record<string, string>;
  guard: SkillSecurityReport;
  consent: 'not-required' | 'confirmed';
};
export type ImportFingerprintIo = {
  lstat: (file: string) => Promise<{ isSymbolicLink(): boolean; isDirectory(): boolean }>;
  readdir: (dir: string) => Promise<string[]>;
  readFile: (file: string) => Promise<Buffer>;
};
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

/** Fingerprint installed inputs, never an authority sidecar supplied by a ZIP. */
export async function fingerprintImport(root: string, io: ImportFingerprintIo = fs): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  const walk = async (dir: string, prefix: string) => {
    const stat = await io.lstat(dir);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('Imported skill must be a real directory');
    for (const name of (await io.readdir(dir)).sort()) {
      const file = path.join(dir, name);
      const rel = prefix ? `${prefix}/${name}` : name;
      const stat = await io.lstat(file);
      if (stat.isSymbolicLink()) throw new Error('Imported skill contains a symlink');
      if (stat.isDirectory()) await walk(file, rel);
      else files[rel] = sha256(await io.readFile(file));
    }
  };
  await walk(root, '');
  return files;
}

/** Only recorded import inputs participate: later generated outputs are not imports. */
export async function matchesCompletedImport(root: string, receipt: CompletedSkillImport): Promise<boolean> {
  try {
    if (
      !receipt.name ||
      ['.', '..'].includes(receipt.name) ||
      /[\\/]/.test(receipt.name) ||
      path.basename(receipt.name) !== receipt.name ||
      !receipt.files?.['SKILL.md']
    )
      return false;
    if (
      !['confirmed', 'not-required'].includes(receipt.consent) ||
      !['clean', 'review'].includes(receipt.guard?.verdict)
    )
      return false;
    if (receipt.consent === 'not-required' && receipt.guard?.verdict !== 'clean') return false;
    if (receipt.contentHash !== receipt.files['SKILL.md']) return false;
    const rootStat = await fs.lstat(root);
    if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) return false;
    for (const [rel, expected] of Object.entries(receipt.files)) {
      if (!rel || rel.includes('\\') || path.isAbsolute(rel) || rel.split('/').some((p) => p === '..' || p === '.'))
        return false;
      let target = root;
      for (const part of rel.split('/')) {
        target = path.join(target, part);
        if ((await fs.lstat(target)).isSymbolicLink()) return false;
      }
      if (sha256(await fs.readFile(target)) !== expected) return false;
    }
    const { DISCLOSED_SCRIPT_EXTENSIONS, normalisedImportExtension } = await import('./SkillImport');
    const checkAddedScripts = async (dir: string, prefix = ''): Promise<boolean> => {
      for (const name of await fs.readdir(dir)) {
        const rel = prefix ? `${prefix}/${name}` : name;
        const stat = await fs.lstat(path.join(dir, name));
        if (stat.isSymbolicLink()) return false;
        if (stat.isDirectory()) {
          if (!(await checkAddedScripts(path.join(dir, name), rel))) return false;
        } else if (!(rel in receipt.files) && DISCLOSED_SCRIPT_EXTENSIONS.includes(normalisedImportExtension(name)))
          return false;
      }
      return true;
    };
    return await checkAddedScripts(root);
  } catch {
    return false;
  }
}

export async function saveCompletedImport(receipt: CompletedSkillImport): Promise<void> {
  const { ProcessConfig } = await import('@process/utils/initStorage');
  await ProcessConfig.update('skills.completedImports', async (current) => ({ ...current, [receipt.name]: receipt }));
}

export async function readCompletedImports(): Promise<Record<string, CompletedSkillImport>> {
  const { ProcessConfig } = await import('@process/utils/initStorage');
  return (await ProcessConfig.get('skills.completedImports')) ?? {};
}
