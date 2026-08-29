/**
 * A zip-bomb cap that runs after decompression describes an explosion; it does
 * not prevent one.
 *
 * `SkillImport` carried `MAX_ZIP_ENTRY_BYTES` and `MAX_ZIP_TOTAL_BYTES`, and
 * both were checked in `_importZip` - one loop AFTER `io.unzip` had already
 * expanded every entry into memory. Measured on that shape with the fixture
 * below: a 409,502-byte archive materialised 480.9 MB of buffers and 582.6 MB
 * RSS before the first cap was consulted. Enforced during decompression the
 * same archive peaks at 40.5 MB / 104.2 MB.
 *
 * There was also no entry-count cap at all, so an archive of empty files cost
 * nothing to decompress and still exhausted the process.
 *
 * These tests drive the REAL `defaultSkillImportIo.unzip` against real archives,
 * because the whole defect was that the caps lived in the caller rather than in
 * the thing that allocates.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { defaultSkillImportIo } from '@process/services/skills/SkillImport';

const MiB = 1024 * 1024;

let dir: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-zipcap-'));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

/** Write a zip of `count` entries each `bytes` long. Zeroes compress to ~nothing. */
async function bomb(name: string, count: number, bytes: number): Promise<string> {
  const zip = new JSZip();
  const chunk = Buffer.alloc(bytes, 0);
  for (let i = 0; i < count; i++) zip.file(`f${i}.md`, chunk);
  const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
  const p = path.join(dir, name);
  await fs.writeFile(p, buf);
  return p;
}

describe('defaultSkillImportIo.unzip enforces its caps while decompressing', () => {
  it('rejects a single over-cap entry', async () => {
    // 20 MiB in one entry, against a 16 MiB per-entry cap.
    const p = await bomb('one-big.zip', 1, 20 * MiB);
    await expect(defaultSkillImportIo.unzip(p, dir)).rejects.toThrow(/entry exceeds size cap/);
  });

  it('rejects an archive whose entries sum past the total cap', async () => {
    // 20 entries x 8 MiB = 160 MiB expanded, each entry individually legal.
    // This is the case the per-entry cap alone cannot catch.
    const p = await bomb('many-medium.zip', 20, 8 * MiB);
    await expect(defaultSkillImportIo.unzip(p, dir)).rejects.toThrow(/total decompressed size exceeds cap/);
  });

  it('rejects an archive holding implausibly many files, before expanding any', async () => {
    // Empty entries: zero decompression cost, so no byte cap can ever fire.
    const zip = new JSZip();
    for (let i = 0; i < 2_001; i++) zip.file(`f${i}.md`, '');
    const p = path.join(dir, 'many-empty.zip');
    await fs.writeFile(p, await zip.generateAsync({ type: 'nodebuffer' }));
    await expect(defaultSkillImportIo.unzip(p, dir)).rejects.toThrow(/too many files/);
  });

  it('holds far less than the payload, measured against the shape it replaced', async () => {
    // The measurement the caps exist for, done as a COMPARISON rather than an
    // absolute. `process.memoryUsage().arrayBuffers` is per-worker, so a fixed
    // ceiling is only meaningful when this file runs alone - it passed in
    // isolation and failed beside its siblings. Running both shapes back to
    // back in the same worker makes the shared noise cancel.
    const p = await bomb('big.zip', 40, 8 * MiB); // 320 MiB expanded
    const zip = await JSZip.loadAsync(await fs.readFile(p));
    const files = Object.entries(zip.files).filter(([, e]) => !e.dir);

    // The old shape: expand everything, THEN consult the cap.
    const beforeOld = process.memoryUsage().arrayBuffers;
    const all: Buffer[] = [];
    for (const [, entry] of files) all.push(Buffer.from(await entry.async('arraybuffer')));
    const oldPeak = process.memoryUsage().arrayBuffers - beforeOld;
    all.length = 0;

    // The shipped shape: refuse partway, holding only what was allowed.
    const beforeNew = process.memoryUsage().arrayBuffers;
    let peak = beforeNew;
    const tick = setInterval(() => {
      peak = Math.max(peak, process.memoryUsage().arrayBuffers);
    }, 5);
    try {
      await expect(defaultSkillImportIo.unzip(p, dir)).rejects.toThrow(/total decompressed size exceeds cap/);
      peak = Math.max(peak, process.memoryUsage().arrayBuffers);
    } finally {
      clearInterval(tick);
    }
    const newPeak = peak - beforeNew;

    // Measured on this fixture: ~376 MB before, ~104 MB after. Asserting a
    // ratio rather than either number, with room to spare.
    expect(newPeak).toBeLessThan(oldPeak * 0.6);
  });

  it('still returns a normal skill archive untouched', async () => {
    const zip = new JSZip();
    zip.file('SKILL.md', '---\nname: ok\n---\nbody');
    zip.file('watchlists/list.csv', 'a,b\n1,2\n');
    const p = path.join(dir, 'ok.zip');
    await fs.writeFile(p, await zip.generateAsync({ type: 'nodebuffer' }));

    const entries = await defaultSkillImportIo.unzip(p, dir);
    expect(entries.map((e) => e.path).sort()).toEqual(['SKILL.md', 'watchlists/list.csv']);
    expect(entries.find((e) => e.path === 'SKILL.md')?.data.toString()).toContain('name: ok');
  });
});
