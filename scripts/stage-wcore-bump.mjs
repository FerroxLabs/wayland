#!/usr/bin/env node
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Stage a bundled wayland-core engine version bump.
 *
 * Bumping the bundled engine is two coupled edits that MUST move in lockstep:
 *   1. DEFAULT_WCORE_VERSION in scripts/prepareWaylandCore.js
 *   2. a per-tag SHA-256 block in scripts/bundled-wcore-shasums.json (the
 *      manifest every download is verified against before it is trusted).
 *
 * Hand-transcribing six checksums is the error surface. This helper pulls the
 * authoritative `wayland-core-checksums.txt` asset published alongside the
 * signed FerroxLabs/wayland-core release, parses the six platform archives, and
 * applies both edits. It does NOT download or execute the engine - that stays
 * with prepareWaylandCore.js, which re-verifies against the manifest this
 * writes.
 *
 * Usage:
 *   node scripts/stage-wcore-bump.mjs v0.12.5            # dry run - prints the diff
 *   node scripts/stage-wcore-bump.mjs v0.12.5 --write    # apply both edits
 *
 * After --write, verify end-to-end (downloads + checks all six archives):
 *   WCORE_REQUIRE_VERIFIED=1 WCORE_FORCE_DOWNLOAD=1 node scripts/prepareWaylandCore.js
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHASUMS_FILE = path.join(__dirname, 'bundled-wcore-shasums.json');
const PREPARE_FILE = path.join(__dirname, 'prepareWaylandCore.js');
const REPO = 'FerroxLabs/wayland-core';

// The six platform archives a release must publish. The bump fails loudly if
// any is missing from the checksums file rather than bundling a partial set.
const REQUIRED_ARCHIVES = [
  'aarch64-apple-darwin.tar.gz',
  'x86_64-apple-darwin.tar.gz',
  'aarch64-unknown-linux-gnu.tar.gz',
  'x86_64-unknown-linux-gnu.tar.gz',
  'aarch64-pc-windows-msvc.zip',
  'x86_64-pc-windows-msvc.zip',
];

function fail(msg) {
  console.error(`stage-wcore-bump: ${msg}`);
  process.exit(1);
}

const rawTag = process.argv[2];
const write = process.argv.includes('--write');
if (!rawTag || rawTag.startsWith('--')) {
  fail('missing release tag, e.g. `node scripts/stage-wcore-bump.mjs v0.12.5`');
}
const tag = rawTag.startsWith('v') ? rawTag : `v${rawTag}`;

// Pull the published checksums file via the gh CLI (honours GH_TOKEN). `-` sends
// the asset to stdout so nothing lands on disk.
let checksumsText;
try {
  checksumsText = execFileSync(
    'gh',
    ['release', 'download', tag, '--repo', REPO, '--pattern', 'wayland-core-checksums.txt', '--output', '-'],
    { encoding: 'utf-8', timeout: 30000 }
  );
} catch (err) {
  fail(`could not download wayland-core-checksums.txt for ${tag} (is the release published?)\n  ${err.message}`);
}

// Parse `<sha256>␣␣<filename>` lines into { filename: "sha256:<hex>" }, keeping
// only this tag's six platform archives.
const block = {};
for (const line of checksumsText.split('\n')) {
  const m = line.trim().match(/^([0-9a-f]{64})\s+(\S+)$/i);
  if (!m) continue;
  const [, hex, file] = m;
  if (!file.startsWith(`wayland-core-${tag}-`)) continue;
  if (!REQUIRED_ARCHIVES.some((suffix) => file.endsWith(`-${suffix}`))) continue;
  block[file] = `sha256:${hex.toLowerCase()}`;
}

const missing = REQUIRED_ARCHIVES.filter(
  (suffix) => !Object.keys(block).some((file) => file.endsWith(`-${suffix}`))
);
if (missing.length) {
  fail(`checksums for ${tag} are missing ${missing.length} archive(s): ${missing.join(', ')}`);
}
// Sort keys to match the existing file's platform ordering (darwin, linux, windows).
const order = REQUIRED_ARCHIVES.map((suffix) => `wayland-core-${tag}-${suffix}`);
const orderedBlock = Object.fromEntries(order.map((k) => [k, block[k]]));

const shasums = JSON.parse(fs.readFileSync(SHASUMS_FILE, 'utf-8'));
const alreadyPinned = Boolean(shasums[tag]);
const prepareSrc = fs.readFileSync(PREPARE_FILE, 'utf-8');
const versionMatch = prepareSrc.match(/const DEFAULT_WCORE_VERSION = '([^']+)';/);
if (!versionMatch) fail('could not find DEFAULT_WCORE_VERSION in prepareWaylandCore.js');
const currentVersion = versionMatch[1];

console.log(`\nStage bundled wayland-core bump: ${currentVersion} -> ${tag}\n`);
console.log('Resolved checksums (from the published wayland-core-checksums.txt):');
for (const [file, sha] of Object.entries(orderedBlock)) console.log(`  ${file}\n    ${sha}`);
if (alreadyPinned) console.log(`\nNote: ${tag} already has a block in bundled-wcore-shasums.json - it will be overwritten.`);

if (!write) {
  console.log('\nDRY RUN - no files changed. Re-run with --write to apply:');
  console.log(`  node scripts/stage-wcore-bump.mjs ${tag} --write\n`);
  process.exit(0);
}

// Apply: insert the block keyed by tag (newest first), bump the constant.
const reordered = { _comment: shasums._comment, [tag]: orderedBlock };
for (const [k, v] of Object.entries(shasums)) {
  if (k === '_comment' || k === tag) continue;
  reordered[k] = v;
}
fs.writeFileSync(SHASUMS_FILE, JSON.stringify(reordered, null, 2) + '\n', 'utf-8');
fs.writeFileSync(
  PREPARE_FILE,
  prepareSrc.replace(
    /const DEFAULT_WCORE_VERSION = '[^']+';/,
    `const DEFAULT_WCORE_VERSION = '${tag}';`
  ),
  'utf-8'
);

console.log('\nApplied:');
console.log(`  scripts/prepareWaylandCore.js   DEFAULT_WCORE_VERSION -> '${tag}'`);
console.log(`  scripts/bundled-wcore-shasums.json   added ${tag} block (6 archives)`);
console.log('\nNow verify end-to-end (downloads + checks all six archives):');
console.log('  WCORE_REQUIRE_VERIFIED=1 WCORE_FORCE_DOWNLOAD=1 node scripts/prepareWaylandCore.js\n');
