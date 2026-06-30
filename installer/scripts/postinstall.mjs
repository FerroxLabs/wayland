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
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { createWriteStream } from 'node:fs';
import { get } from 'node:https';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Kept in lockstep with scripts/prepareWaylandCore.js DEFAULT_WCORE_VERSION by
// scripts/stage-wcore-bump.mjs. Do not hand-edit; run that tool so both move.
const WCORE_VERSION = 'v0.12.16';
const HERE = dirname(fileURLToPath(import.meta.url));
const PAYLOAD = resolve(HERE, '..', 'payload');

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
  console.log(`\n  [wayland] ${msg}\n  The Flux / API-key path works without it; the Wayland Core agent will be unavailable until then.\n`);
}

if (!triple) { warn(`No prebuilt Wayland Core engine for ${runtimeKey} (skipping).`); process.exit(0); }

const asset = `wayland-core-${WCORE_VERSION}-${triple}.tar.gz`;
const url = `https://github.com/FerroxLabs/wayland-core/releases/download/${WCORE_VERSION}/${asset}`;
const tmp = join(PAYLOAD, '.wcore-tmp');
const tarPath = join(tmp, asset);
const destDir = join(PAYLOAD, 'resources', 'bundled-wayland-core', runtimeKey);
const destBin = join(destDir, 'wayland-core');

function download(u, dest, redirects = 0) {
  return new Promise((res, rej) => {
    if (redirects > 5) return rej(new Error('too many redirects'));
    get(u, (r) => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        r.resume();
        return res(download(r.headers.location, dest, redirects + 1));
      }
      if (r.statusCode !== 200) { r.resume(); return rej(new Error(`HTTP ${r.statusCode}`)); }
      const f = createWriteStream(dest);
      r.pipe(f);
      f.on('finish', () => f.close(() => res()));
      f.on('error', rej);
    }).on('error', rej);
  });
}

try {
  if (existsSync(destBin)) process.exit(0); // already have it
  mkdirSync(tmp, { recursive: true });
  mkdirSync(destDir, { recursive: true });
  console.log(`  [wayland] fetching Wayland Core engine (${triple})…`);
  await download(url, tarPath);
  const x = spawnSync('tar', ['-xzf', tarPath, '-C', tmp], { stdio: 'ignore' });
  if (x.status !== 0) throw new Error('tar extract failed');
  // Find the engine binary in the extracted tree (named aionrs / wayland-core / wcore).
  const found = (function find(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) { const r = find(p); if (r) return r; }
      else if (/^(aionrs|wayland-core|wcore)$/.test(e.name)) return p;
    }
    return null;
  })(tmp);
  if (!found) throw new Error('engine binary not found in archive');
  renameSync(found, destBin);
  chmodSync(destBin, 0o755);
  rmSync(tmp, { recursive: true, force: true });
  console.log(`  [wayland] ✓ Wayland Core engine ready (${runtimeKey})`);
} catch (e) {
  rmSync(tmp, { recursive: true, force: true });
  warn(`Could not fetch the Wayland Core engine (${e.message}).`);
  process.exit(0); // non-fatal
}
