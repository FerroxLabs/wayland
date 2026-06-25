/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #309 acceptance gate - verify a packed/shipped resources dir WITHOUT antivirus.
 *
 * AV behavior is non-deterministic and vendor-specific (Norton called the
 * identical Deno/Joplin false-positives "invalid"), so a scanner pass can never
 * be the acceptance criterion - a green scan today flips red on tomorrow's
 * signature update. The real, testable contract is a DETERMINISTIC structural
 * invariant we fully control: "the thing AV scans is simply gone, and search
 * still works." This script enforces exactly that:
 *
 *   1. ZERO loose scannable skill/workflow `.md` ship under the dir.
 *   2. Each library that has an index.json ships a pack (blob + offset index).
 *   3. The blob uses a neutral (non-document) extension and is plain text:
 *      byte-entropy below the packer/obfuscation threshold (guards against an
 *      accidental gzip/base64 regression that would re-trip a DIFFERENT AV
 *      heuristic).
 *   4. Round-trip integrity: every offset window decodes and (when --src given)
 *      is byte-identical to the original loose body, so search is unchanged.
 *
 * Usage:
 *   bunx tsx scripts/verify-skill-pack.ts --dir <packagedResourcesDir> [--src <srcResourcesDir>]
 * Exit code 0 = pass, 1 = fail (CI gate).
 */

import path from 'path';
import { promises as fs, existsSync } from 'fs';
import { openSkillPack, PACK_BLOB_NAME, PACK_OFFSETS_NAME } from '../src/process/services/skills/SkillPack';

const LIBRARIES = ['skills-library', 'bundled-workflows'] as const;
// Plain UTF-8 prose sits ~4.5-5.5 bits/byte; gzip/base64/encryption push toward
// ~7+ (the packer-detection threshold). 6.5 leaves margin while still catching a
// regression that compresses or encodes the blob.
const MAX_ENTROPY_BITS_PER_BYTE = 6.5;

type Failure = { lib: string; problem: string };
const failures: Failure[] = [];
const notes: string[] = [];

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function walkMarkdown(dir: string): Promise<string[]> {
  const out: string[] = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const ent of await fs.readdir(cur, { withFileTypes: true })) {
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (ent.name.toLowerCase().endsWith('.md')) out.push(full);
    }
  }
  return out;
}

function shannonEntropyBitsPerByte(buf: Buffer): number {
  if (buf.length === 0) return 0;
  const counts = Array.from({ length: 256 }, () => 0);
  for (const b of buf) counts[b]++;
  let h = 0;
  for (const c of counts) {
    if (c === 0) continue;
    const p = c / buf.length;
    h -= p * Math.log2(p);
  }
  return h;
}

async function verifyLibrary(dir: string, name: string, srcRoot?: string): Promise<void> {
  const libDir = path.join(dir, name);
  if (!existsSync(path.join(libDir, 'index.json'))) {
    notes.push(`${name}: not present in dir (skipped)`);
    return;
  }

  // 1. No loose scannable .md anywhere under the library dir.
  const md = await walkMarkdown(libDir);
  if (md.length > 0) {
    failures.push({
      lib: name,
      problem: `${md.length} loose .md files still ship (e.g. ${path.relative(dir, md[0])}). The pack did not replace bodies/.`,
    });
  }

  // 2. Pack present.
  const blobPath = path.join(libDir, PACK_BLOB_NAME);
  const offsetsPath = path.join(libDir, PACK_OFFSETS_NAME);
  if (!existsSync(blobPath) || !existsSync(offsetsPath)) {
    failures.push({ lib: name, problem: `missing pack (${PACK_BLOB_NAME} / ${PACK_OFFSETS_NAME})` });
    return;
  }

  // 3. Neutral extension + plain-text entropy.
  if (/\.(md|txt|html?|markdown)$/i.test(PACK_BLOB_NAME)) {
    failures.push({
      lib: name,
      problem: `blob extension is document-class (${PACK_BLOB_NAME}) - AV markdown classifier may fire`,
    });
  }
  const blob = await fs.readFile(blobPath);
  const entropy = shannonEntropyBitsPerByte(blob);
  if (entropy > MAX_ENTROPY_BITS_PER_BYTE) {
    failures.push({
      lib: name,
      problem: `blob entropy ${entropy.toFixed(2)} bits/byte exceeds ${MAX_ENTROPY_BITS_PER_BYTE} - looks compressed/encoded (no base64/gzip allowed)`,
    });
  }

  // 4. Round-trip integrity.
  const pack = await openSkillPack(libDir);
  if (!pack) {
    failures.push({ lib: name, problem: 'openSkillPack returned null on a present pack (corrupt offset index)' });
    return;
  }
  const offsets = JSON.parse(await fs.readFile(offsetsPath, 'utf-8')) as { entries: Record<string, [number, number]> };
  const paths = Object.keys(offsets.entries);
  let checked = 0;
  let mismatches = 0;
  for (const rel of paths) {
    const body = await pack.read(rel);
    if (body === null) {
      mismatches++;
      continue;
    }
    if (srcRoot) {
      // Full byte-equivalence vs the original loose body.
      const srcDir = path.join(srcRoot, name);
      const literal = path.join(srcDir, rel);
      const underBodies = path.join(srcDir, 'bodies', rel);
      const srcFile = existsSync(literal) ? literal : existsSync(underBodies) ? underBodies : null;
      if (srcFile) {
        const original = await fs.readFile(srcFile, 'utf-8');
        if (original !== body) mismatches++;
      }
    }
    checked++;
  }
  if (mismatches > 0) {
    failures.push({
      lib: name,
      problem: `${mismatches}/${paths.length} packed bodies failed round-trip${srcRoot ? ' byte-equivalence' : ''}`,
    });
  }
  notes.push(
    `${name}: 0 loose .md, ${paths.length} bodies packed, entropy ${entropy.toFixed(2)} bits/byte, ${checked} round-trip-checked${srcRoot ? ' (byte-exact vs source)' : ''}`
  );
}

async function main(): Promise<void> {
  const dir = arg('--dir');
  const srcRoot = arg('--src');
  if (!dir) {
    console.error('usage: verify-skill-pack.ts --dir <packagedResourcesDir> [--src <srcResourcesDir>]');
    process.exit(2);
  }
  for (const name of LIBRARIES)
    await verifyLibrary(
      path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir),
      name,
      srcRoot ? (path.isAbsolute(srcRoot) ? srcRoot : path.join(process.cwd(), srcRoot)) : undefined
    );

  for (const n of notes) console.log(`[verify-skill-pack] OK  ${n}`);
  if (failures.length) {
    for (const f of failures) console.error(`[verify-skill-pack] FAIL ${f.lib}: ${f.problem}`);
    console.error(
      `\n[verify-skill-pack] ${failures.length} failure(s) - the packaged build still exposes scannable surface or broke round-trip.`
    );
    process.exit(1);
  }
  console.log(
    '\n[verify-skill-pack] PASS - no individually-scannable skill/workflow .md ships; pack round-trips cleanly.'
  );
}

main().catch((err) => {
  console.error('[verify-skill-pack] ERROR:', err);
  process.exit(1);
});
