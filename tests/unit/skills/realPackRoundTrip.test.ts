import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { extractPack, findDisallowedFile, installExtractedPack } from '@process/services/skills/installSkillPack';

describe('the REAL shipped pack survives the tightened policy', () => {
  it('extracts, passes the allowlist, and installs with the exact expected tree', async () => {
    const bytes = new Uint8Array(
      await fs.readFile('/Users/seandonahoe/dev/tc-tide-masterclass/RELEASE/tc-tide-morning-brief-1.0.0.zip')
    );
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
      const tree = await walk(path.join(skills, 'tide-morning-brief'));
      // The tree this used to expect was FIVE files, and that was the bug: the
      // shipped 1.0.0 zip had no report/ directory and no CSV watchlist, so the
      // pipeline that actually produces the brief was missing and a buyer could
      // not have run it. The expectation matched the broken artifact, so the
      // test stayed green over it.
      expect(tree).toEqual([
        'BUILD.txt',
        'SETUP-TC-TIDE.md',
        'SKILL.md',
        'START-HERE.md',
        'report/assemble.py',
        'report/brief_charts.py',
        'report/brief_css.py',
        'report/brief_html.py',
        'report/collect.mjs',
        'watchlists/CRYPTO-WATCHLIST.txt',
        'watchlists/README.txt',
        'watchlists/TC-MASTER-WATCHLIST.csv',
        'watchlists/TC-MASTER-WATCHLIST.txt',
      ]);
      // Stated separately from the exact tree so the intent survives a future
      // file being added: the pack is worthless without the collector, and the
      // CSV is the watchlist collect.mjs actually reads.
      expect(tree, 'the pack must ship the collector').toContain('report/collect.mjs');
      expect(tree, 'collect.mjs reads the CSV, not the .txt').toContain('watchlists/TC-MASTER-WATCHLIST.csv');
    } finally {
      await fs.rm(stage, { recursive: true, force: true });
      await fs.rm(skills, { recursive: true, force: true });
    }
  });
});
