import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { extractPack, findDisallowedFile, installExtractedPack } from '@process/services/skills/installSkillPack';

describe('the REAL shipped pack survives the tightened policy', () => {
  it('extracts, passes the allowlist, and installs with the exact expected tree', async () => {
    const bytes = new Uint8Array(await fs.readFile('/Users/seandonahoe/dev/tc-tide-masterclass/RELEASE/tc-tide-morning-brief-1.0.0.zip'));
    const stage = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-real-'));
    const skills = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-skills-'));
    try {
      expect((await extractPack(bytes, stage)).ok).toBe(true);
      expect(await findDisallowedFile(stage), 'the real pack must contain no disallowed file type').toBeNull();
      const r = await installExtractedPack(stage, 'tide-morning-brief', { skillsDir: skills });
      expect(r.ok, JSON.stringify(r)).toBe(true);
      const walk = async (d: string, p = ''): Promise<string[]> => {
        const out: string[] = [];
        for (const e of await fs.readdir(d, { withFileTypes: true })) {
          const rel = p ? `${p}/${e.name}` : e.name;
          if (e.isDirectory()) out.push(...(await walk(path.join(d, e.name), rel)));
          else out.push(rel);
        }
        return out.sort();
      };
      expect(await walk(path.join(skills, 'tide-morning-brief'))).toEqual([
        'SETUP-TC-TIDE.md',
        'SKILL.md',
        'watchlists/CRYPTO-WATCHLIST.txt',
        'watchlists/README.txt',
        'watchlists/TC-MASTER-WATCHLIST.txt',
      ]);
    } finally {
      await fs.rm(stage, { recursive: true, force: true });
      await fs.rm(skills, { recursive: true, force: true });
    }
  });
});
