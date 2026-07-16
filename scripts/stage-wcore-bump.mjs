#!/usr/bin/env node
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Stage a bundled wayland-core engine version bump.
 *
 * Bumping the bundled engine is three coupled edits that MUST move in lockstep:
 *   1. DEFAULT_WCORE_VERSION in scripts/prepareWaylandCore.js (Electron bundle)
 *   2. a per-tag archive + extracted-binary SHA-256 block in
 *      scripts/bundled-wcore-shasums.json (independent authority for both
 *      download preparation and post-package replay).
 *   3. WCORE_VERSION in installer/scripts/postinstall.mjs (the getwayland
 *      headless self-host installer's OWN engine pin). Missing this is why it
 *      silently drifted to a 2-minor-stale v0.10.0 engine (#451).
 *
 * Hand-transcribing six checksums is the error surface. This helper pulls the
 * authoritative `wayland-core-checksums.txt` asset published alongside the
 * signed FerroxLabs/wayland-core release, parses the six platform archives, and
 * downloads each archive, rechecks its published digest, extracts it without
 * executing it, and pins the executable bytes as a second independent digest.
 *
 * Usage:
 *   node scripts/stage-wcore-bump.mjs v0.12.5            # dry run - prints the diff
 *   node scripts/stage-wcore-bump.mjs v0.12.5 --write    # apply both edits
 *
 * After --write, verify end-to-end (downloads + checks all six archives):
 *   WCORE_REQUIRE_VERIFIED=1 WCORE_FORCE_DOWNLOAD=1 node scripts/prepareWaylandCore.js
 */

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHASUMS_FILE = path.join(__dirname, 'bundled-wcore-shasums.json');
const PREPARE_FILE = path.join(__dirname, 'prepareWaylandCore.js');
const POSTINSTALL_FILE = path.join(__dirname, '..', 'installer', 'scripts', 'postinstall.mjs');
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

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function findBinary(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isFile() && (entry.name === 'wayland-core' || entry.name === 'wayland-core.exe')) return full;
    if (entry.isDirectory()) {
      const found = findBinary(full);
      if (found) return found;
    }
  }
  return null;
}

const rawTag = process.argv[2];
const write = process.argv.includes('--write');
if (!rawTag || rawTag.startsWith('--')) {
  fail('missing release tag, e.g. `node scripts/stage-wcore-bump.mjs v0.12.5`');
}
const tag = rawTag.startsWith('v') ? rawTag : `v${rawTag}`;
if (!/^v\d+\.\d+\.\d+$/.test(tag)) {
  fail(`invalid release tag "${rawTag}"; expected an exact vMAJOR.MINOR.PATCH tag`);
}

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

const missing = REQUIRED_ARCHIVES.filter((suffix) => !Object.keys(block).some((file) => file.endsWith(`-${suffix}`)));
if (missing.length) {
  fail(`checksums for ${tag} are missing ${missing.length} archive(s): ${missing.join(', ')}`);
}
// Sort keys to match the existing file's platform ordering (darwin, linux, windows).
const order = REQUIRED_ARCHIVES.map((suffix) => `wayland-core-${tag}-${suffix}`);
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), `stage-wcore-${tag}-`));
const provenanceBlock = {};
try {
  for (const asset of order) {
    execFileSync(
      'gh',
      ['release', 'download', tag, '--repo', REPO, '--pattern', asset, '--dir', tempRoot, '--clobber'],
      { timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'] }
    );
    const archive = path.join(tempRoot, asset);
    const archiveSha256 = sha256(archive);
    const expectedArchiveSha256 = block[asset].replace(/^sha256:/i, '');
    if (archiveSha256 !== expectedArchiveSha256) {
      fail(`archive digest drift for ${asset}: expected ${expectedArchiveSha256}, got ${archiveSha256}`);
    }
    const extractDir = path.join(tempRoot, `${asset}.extracted`);
    fs.mkdirSync(extractDir, { recursive: true });
    if (asset.endsWith('.zip')) {
      if (process.platform === 'win32') {
        execFileSync('powershell', [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          `Expand-Archive -LiteralPath '${archive.replace(/'/g, "''")}' -DestinationPath '${extractDir.replace(/'/g, "''")}' -Force`,
        ]);
      } else {
        execFileSync('unzip', ['-q', archive, '-d', extractDir]);
      }
    } else {
      execFileSync('tar', ['-xzf', archive, '-C', extractDir]);
    }
    const binary = findBinary(extractDir);
    if (!binary) fail(`extracted archive ${asset} did not contain wayland-core executable`);
    provenanceBlock[asset] = {
      archiveSha256: block[asset],
      binarySha256: `sha256:${sha256(binary)}`,
    };
  }
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
const orderedBlock = Object.fromEntries(order.map((k) => [k, provenanceBlock[k]]));

const shasums = JSON.parse(fs.readFileSync(SHASUMS_FILE, 'utf-8'));
const alreadyPinned = Boolean(shasums[tag]);
const prepareSrc = fs.readFileSync(PREPARE_FILE, 'utf-8');
const versionMatch = prepareSrc.match(/const DEFAULT_WCORE_VERSION = '([^']+)';/);
if (!versionMatch) fail('could not find DEFAULT_WCORE_VERSION in prepareWaylandCore.js');
const currentVersion = versionMatch[1];

const postinstallSrc = fs.readFileSync(POSTINSTALL_FILE, 'utf-8');
const postinstallMatch = postinstallSrc.match(/const WCORE_VERSION = '([^']+)';/);
if (!postinstallMatch) fail('could not find WCORE_VERSION in installer/scripts/postinstall.mjs');
const postinstallVersion = postinstallMatch[1];

console.log(`\nStage bundled wayland-core bump: ${currentVersion} -> ${tag}\n`);
if (postinstallVersion !== currentVersion) {
  console.log(
    `  (headless installer pin was out of lockstep at ${postinstallVersion} - it will be realigned to ${tag})\n`
  );
}
console.log('Resolved archive and extracted-binary checksums:');
for (const [file, proof] of Object.entries(orderedBlock)) {
  console.log(`  ${file}\n    archive ${proof.archiveSha256}\n    binary  ${proof.binarySha256}`);
}
if (alreadyPinned)
  console.log(`\nNote: ${tag} already has a block in bundled-wcore-shasums.json - it will be overwritten.`);

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
  prepareSrc.replace(/const DEFAULT_WCORE_VERSION = '[^']+';/, `const DEFAULT_WCORE_VERSION = '${tag}';`),
  'utf-8'
);
fs.writeFileSync(
  POSTINSTALL_FILE,
  postinstallSrc.replace(/const WCORE_VERSION = '[^']+';/, `const WCORE_VERSION = '${tag}';`),
  'utf-8'
);

console.log('\nApplied:');
console.log(`  scripts/prepareWaylandCore.js   DEFAULT_WCORE_VERSION -> '${tag}'`);
console.log(`  scripts/bundled-wcore-shasums.json   added ${tag} block (6 archives)`);
console.log(`  installer/scripts/postinstall.mjs   WCORE_VERSION -> '${tag}'`);
console.log('\nNow verify end-to-end (downloads + checks all six archives):');
console.log('  WCORE_REQUIRE_VERIFIED=1 WCORE_FORCE_DOWNLOAD=1 node scripts/prepareWaylandCore.js\n');
