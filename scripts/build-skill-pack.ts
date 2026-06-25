/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #309 build step: pack the vendored skill + workflow bodies into a single
 * opaque blob + offset index per library, and stage a SHIPPABLE resource dir
 * that contains NO loose `SKILL.md`. Run before electron-builder so the packaged
 * app ships the pack (via extraResources from the staged dir) instead of ~2,100
 * individually-scannable markdown files that trip AV content heuristics.
 *
 * Usage:
 *   bunx tsx scripts/build-skill-pack.ts [--out <dir>]
 * Default --out is `out/main` (mirrors the bundled-extensions ship-from-out/main
 * pattern; electron-builder's extraResources copies out/main/<name> -> Resources).
 *
 * Source bodies stay untouched in src/process/resources/<name>/bodies/ - devs
 * keep editing loose files; only the BUILD output is packed.
 */

import path from 'path';
import { promises as fs, existsSync } from 'fs';
import { buildSkillPack } from '../src/process/services/skills/SkillPack';

const REPO_ROOT = process.cwd();
const SRC_ROOT = path.join(REPO_ROOT, 'src/process/resources');
const LIBRARIES = ['skills-library', 'bundled-workflows'] as const;

// Top-level sidecars to carry over verbatim (metadata, not scannable bodies).
// Everything else at the top level (and the whole bodies/ tree) is excluded.
const KEEP_SIDECARS = new Set(['index.json', 'routines.json']);
// Unused at runtime (search reads only index.json); a large fixture we needn't ship.
const DROP_FILES = new Set(['discovery-queries.json']);

function parseOutDir(): string {
  const i = process.argv.indexOf('--out');
  const out = i >= 0 ? process.argv[i + 1] : 'out/main';
  return path.isAbsolute(out) ? out : path.join(REPO_ROOT, out);
}

async function stageLibrary(name: string, outRoot: string): Promise<void> {
  const srcDir = path.join(SRC_ROOT, name);
  if (!existsSync(path.join(srcDir, 'index.json'))) {
    console.log(`[skill-pack] ${name}: no index.json, skipping`);
    return;
  }
  const outDir = path.join(outRoot, name);
  await fs.mkdir(outDir, { recursive: true });

  // Carry over non-body sidecars; never copy bodies/ or dropped fixtures.
  for (const ent of await fs.readdir(srcDir, { withFileTypes: true })) {
    if (ent.isDirectory()) continue; // skip bodies/ (and any other subdir)
    if (DROP_FILES.has(ent.name)) continue;
    if (!KEEP_SIDECARS.has(ent.name)) continue;
    await fs.copyFile(path.join(srcDir, ent.name), path.join(outDir, ent.name));
  }

  const result = await buildSkillPack(srcDir, outDir);
  if (result.missing.length > 0) {
    console.warn(
      `[skill-pack] ${name}: ${result.missing.length} index entries had no body on disk (first 5):`,
      result.missing.slice(0, 5)
    );
  }
  console.log(
    `[skill-pack] ${name}: packed ${result.count} bodies into ${(result.bytes / 1024 / 1024).toFixed(2)} MB ` +
      `(${path.relative(REPO_ROOT, result.blobPath)}) - no loose .md staged`
  );
}

async function main(): Promise<void> {
  const outRoot = parseOutDir();
  console.log(`[skill-pack] staging packed libraries into ${path.relative(REPO_ROOT, outRoot) || outRoot}`);
  for (const name of LIBRARIES) {
    await stageLibrary(name, outRoot);
  }
}

main().catch((err) => {
  console.error('[skill-pack] FAILED:', err);
  process.exit(1);
});
