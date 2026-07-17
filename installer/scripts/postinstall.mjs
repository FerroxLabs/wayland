#!/usr/bin/env node
/**
 * Best-effort fetch of the Wayland Core (aionrs) engine binary for this platform.
 *
 * Placed where the server's resolver looks (cwd/resources/bundled-wayland-core/
 * <platform>-<arch>/wayland-core), so `wayland start` (cwd=payload) finds it.
 *
 * NON-FATAL: if the download fails (offline, unsupported arch), we warn and move
 * on - the Flux / OpenAI-compatible path runs fine without the wcore binary.
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  downloadTrustedArchive,
  publishEngineAtomically,
  selectWcoreAsset,
  verifyAndExtractEngine,
} from './wcore-security.mjs';

// Kept in lockstep with scripts/prepareWaylandCore.js DEFAULT_WCORE_VERSION by
// scripts/stage-wcore-bump.mjs. Do not hand-edit; run that tool so both move.
const WCORE_VERSION = 'v0.12.24';
const HERE = dirname(fileURLToPath(import.meta.url));
const PAYLOAD = resolve(HERE, '..', 'payload');
const SHASUMS_FILE = join(HERE, 'wcore-shasums.json');

// Skip during local dev installs (no payload yet) - only runs for published installs.
if (!existsSync(PAYLOAD)) process.exit(0);

const TRIPLES = {
  'linux-x64': 'x86_64-unknown-linux-gnu',
  'linux-arm64': 'aarch64-unknown-linux-gnu',
  'darwin-x64': 'x86_64-apple-darwin',
  'darwin-arm64': 'aarch64-apple-darwin',
};
const runtimeKey = `${process.platform}-${process.arch}`;
const triple = TRIPLES[runtimeKey];

function warn(msg) {
  console.log(
    `\n  [wayland] ${msg}\n  The Flux / API-key path works without it; the Wayland Core agent will be unavailable until then.\n`
  );
}

if (!triple) {
  warn(`No prebuilt Wayland Core engine for ${runtimeKey} (skipping).`);
  process.exit(0);
}

const asset = `wayland-core-${WCORE_VERSION}-${triple}.tar.gz`;
const url = `https://github.com/FerroxLabs/wayland-core/releases/download/${WCORE_VERSION}/${asset}`;
const destDir = join(PAYLOAD, 'resources', 'bundled-wayland-core', runtimeKey);
const destBin = join(destDir, 'wayland-core');

try {
  const manifest = JSON.parse(readFileSync(SHASUMS_FILE, 'utf8'));
  if (manifest.version !== WCORE_VERSION) {
    throw new Error(`checksum manifest version ${manifest.version ?? '(missing)'} does not match ${WCORE_VERSION}`);
  }
  const pinned = selectWcoreAsset(process.platform, process.arch, manifest);
  if (pinned.filename !== asset) throw new Error(`checksum manifest asset does not match ${asset}`);

  mkdirSync(destDir, { recursive: true });
  console.log(`  [wayland] fetching Wayland Core engine (${triple})…`);
  const archive = await downloadTrustedArchive(url);
  const engine = verifyAndExtractEngine(archive, pinned.sha256);
  publishEngineAtomically(engine, destBin);
  console.log(`  [wayland] ✓ Wayland Core engine ready (${runtimeKey})`);
} catch (e) {
  warn(`Could not fetch the Wayland Core engine (${e instanceof Error ? e.message : String(e)}).`);
  process.exit(0); // non-fatal
}
