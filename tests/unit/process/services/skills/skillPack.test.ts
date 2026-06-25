/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import { buildSkillPack, openSkillPack, PACK_BLOB_NAME, PACK_OFFSETS_NAME } from '@process/services/skills/SkillPack';

// #309: the pack replaces ~2,100 loose SKILL.md with one opaque blob + offset
// index so no individually-scannable markdown ships. These tests use real temp
// dirs (not mocks) so byte-exact round-trip and seek-reads are genuinely
// exercised.

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'skillpack-'));
});
afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

async function writeIndex(dir: string, entries: Array<{ name: string; path: string }>): Promise<void> {
  await fs.writeFile(path.join(dir, 'index.json'), JSON.stringify(entries));
}
async function writeBody(dir: string, rel: string, content: string): Promise<void> {
  const full = path.join(dir, 'bodies', rel);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, 'utf-8');
}

describe('buildSkillPack', () => {
  it('packs every body and round-trips each byte-exact through openSkillPack', async () => {
    const src = path.join(tmp, 'lib');
    await fs.mkdir(src, { recursive: true });
    await writeIndex(src, [
      { name: 'a', path: 'skills/a/SKILL.md' },
      { name: 'b', path: 'skills/b/SKILL.md' },
    ]);
    await writeBody(src, 'skills/a/SKILL.md', '# A\nbody with — unicode ✓ and `code`');
    await writeBody(src, 'skills/b/SKILL.md', 'second body\nline two');

    const out = path.join(tmp, 'out');
    const result = await buildSkillPack(src, out);

    expect(result.count).toBe(2);
    expect(result.missing).toEqual([]);

    const pack = await openSkillPack(out);
    expect(pack).not.toBeNull();
    expect(await pack!.read('skills/a/SKILL.md')).toBe('# A\nbody with — unicode ✓ and `code`');
    expect(await pack!.read('skills/b/SKILL.md')).toBe('second body\nline two');
  });

  it('skips externally-rooted (absolute) entries - they are not vendored', async () => {
    const src = path.join(tmp, 'lib');
    await fs.mkdir(src, { recursive: true });
    await writeIndex(src, [
      { name: 'vendored', path: 'skills/v/SKILL.md' },
      { name: 'external', path: '/abs/elsewhere/SKILL.md' },
    ]);
    await writeBody(src, 'skills/v/SKILL.md', 'vendored');

    const result = await buildSkillPack(src, path.join(tmp, 'out'));

    expect(result.count).toBe(1);
    const pack = await openSkillPack(path.join(tmp, 'out'));
    expect(pack!.has('/abs/elsewhere/SKILL.md')).toBe(false);
    expect(pack!.has('skills/v/SKILL.md')).toBe(true);
  });

  it('records index entries whose body is missing on disk instead of throwing', async () => {
    const src = path.join(tmp, 'lib');
    await fs.mkdir(src, { recursive: true });
    await writeIndex(src, [
      { name: 'present', path: 'skills/p/SKILL.md' },
      { name: 'gone', path: 'skills/missing/SKILL.md' },
    ]);
    await writeBody(src, 'skills/p/SKILL.md', 'here');

    const result = await buildSkillPack(src, path.join(tmp, 'out'));

    expect(result.count).toBe(1);
    expect(result.missing).toEqual(['skills/missing/SKILL.md']);
  });

  it('produces a plain-text blob (low entropy - no gzip/base64)', async () => {
    const src = path.join(tmp, 'lib');
    await fs.mkdir(src, { recursive: true });
    await writeIndex(src, [{ name: 'a', path: 'skills/a/SKILL.md' }]);
    await writeBody(src, 'skills/a/SKILL.md', 'plain english prose '.repeat(200));

    const out = path.join(tmp, 'out');
    await buildSkillPack(src, out);
    const blob = await fs.readFile(path.join(out, PACK_BLOB_NAME));

    // Byte histogram entropy of natural-language UTF-8 stays well below the
    // ~7 bits/byte packer threshold.
    const counts = Array.from({ length: 256 }, () => 0);
    for (const byte of blob) counts[byte]++;
    let h = 0;
    for (const c of counts) {
      if (c) {
        const p = c / blob.length;
        h -= p * Math.log2(p);
      }
    }
    expect(h).toBeLessThan(6.5);
  });
});

describe('openSkillPack', () => {
  it('returns null when no pack files are present (dev tree / loose layout)', async () => {
    const dir = path.join(tmp, 'empty');
    await fs.mkdir(dir, { recursive: true });
    expect(await openSkillPack(dir)).toBeNull();
  });

  it('returns null on a corrupt offset index (degrades to loose fallback, not a crash)', async () => {
    const dir = path.join(tmp, 'corrupt');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, PACK_BLOB_NAME), 'data');
    await fs.writeFile(path.join(dir, PACK_OFFSETS_NAME), '{ this is not json');
    expect(await openSkillPack(dir)).toBeNull();
  });

  it('read() returns null for a path not in the index', async () => {
    const src = path.join(tmp, 'lib');
    await fs.mkdir(src, { recursive: true });
    await writeIndex(src, [{ name: 'a', path: 'skills/a/SKILL.md' }]);
    await writeBody(src, 'skills/a/SKILL.md', 'a');
    const out = path.join(tmp, 'out');
    await buildSkillPack(src, out);

    const pack = await openSkillPack(out);
    expect(await pack!.read('skills/nope/SKILL.md')).toBeNull();
  });

  it('reads an empty body as the empty string (not null)', async () => {
    const src = path.join(tmp, 'lib');
    await fs.mkdir(src, { recursive: true });
    await writeIndex(src, [{ name: 'empty', path: 'skills/e/SKILL.md' }]);
    await writeBody(src, 'skills/e/SKILL.md', '');
    const out = path.join(tmp, 'out');
    await buildSkillPack(src, out);

    const pack = await openSkillPack(out);
    expect(await pack!.read('skills/e/SKILL.md')).toBe('');
  });
});
