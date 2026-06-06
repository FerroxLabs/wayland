/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * install-signal-cli.mjs - postinstall / on-demand helper.
 *
 * Downloads the latest signal-cli native binary from GitHub Releases and
 * extracts it into src/process/channels/signal-cli-runtime/bin/.
 *
 * Usage:
 *   node scripts/install-signal-cli.mjs
 *
 * On platforms without a native GraalVM release (macOS arm64, Linux arm),
 * the script exits with a clear message pointing at the Homebrew fallback.
 * electron-builder will then bundle whatever ends up in signal-cli-runtime/bin/.
 */

import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import { request } from 'node:https';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INSTALL_DIR = path.resolve(__dirname, '../src/process/channels/signal-cli-runtime/bin');
const API_URL = 'https://api.github.com/repos/AsamK/signal-cli/releases/latest';

function looksLikeArchive(name) {
  const lower = name.toLowerCase();
  return lower.endsWith('.tar.gz') || lower.endsWith('.tgz') || lower.endsWith('.zip');
}

function pickAsset(assets, platform, arch) {
  const archives = assets.filter(
    (a) => a.name && a.browser_download_url && looksLikeArchive(a.name),
  );
  const byName = (pattern) =>
    archives.find((a) => pattern.test(a.name.toLowerCase()));

  if (platform === 'linux') {
    if (arch === 'x64') return byName(/linux-native/) ?? byName(/linux/) ?? archives[0];
    return undefined; // no native build for arm - caller falls back to brew
  }
  if (platform === 'darwin') return byName(/macos|osx|darwin/) ?? archives[0];
  if (platform === 'win32') return byName(/windows|win/) ?? archives[0];
  return archives[0];
}

async function downloadFile(url, dest, maxRedirects = 5) {
  await new Promise((resolve, reject) => {
    const req = request(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400) {
        const location = res.headers.location;
        if (!location || maxRedirects <= 0) {
          reject(new Error('Redirect loop'));
          return;
        }
        resolve(downloadFile(new URL(location, url).href, dest, maxRedirects - 1));
        return;
      }
      if (res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const out = createWriteStream(dest);
      pipeline(res, out).then(resolve).catch(reject);
    });
    req.on('error', reject);
    req.end();
  });
}

async function extractArchive(archivePath, destDir) {
  await fs.mkdir(destDir, { recursive: true });
  const lower = archivePath.toLowerCase();
  if (lower.endsWith('.tar.gz') || lower.endsWith('.tgz')) {
    await execFileAsync('tar', ['-xzf', archivePath, '-C', destDir]);
  } else if (lower.endsWith('.zip')) {
    await execFileAsync('unzip', ['-o', archivePath, '-d', destDir]);
  } else {
    throw new Error(`Unsupported archive format: ${archivePath}`);
  }
}

async function findBinary(root) {
  const enqueue = async (dir, depth) => {
    if (depth > 4) return null;
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = await enqueue(full, depth + 1);
        if (found) return found;
      } else if (entry.isFile() && entry.name === 'signal-cli') {
        return full;
      }
    }
    return null;
  };
  return enqueue(root, 0);
}

async function main() {
  const platform = process.platform;
  const arch = process.arch;

  console.log(`[install-signal-cli] platform=${platform} arch=${arch}`);

  if (platform === 'win32') {
    console.warn('[install-signal-cli] Windows: auto-install not supported. Install signal-cli manually.');
    process.exit(0);
  }

  // Fetch release metadata.
  const response = await fetch(API_URL, {
    headers: { 'User-Agent': 'wayland-installer', Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) {
    console.error(`[install-signal-cli] GitHub API error: HTTP ${response.status}`);
    process.exit(1);
  }

  const payload = await response.json();
  const version = (payload.tag_name ?? 'unknown').replace(/^v/, '');
  const assets = payload.assets ?? [];
  const asset = pickAsset(assets, platform, arch);

  if (!asset) {
    console.warn(
      `[install-signal-cli] No native release asset for ${platform}/${arch}.\n` +
        'Install signal-cli manually:\n' +
        '  brew install signal-cli         # macOS (any arch)\n' +
        '  sudo apt-get install signal-cli # Debian/Ubuntu\n' +
        'Then set the cliPath in Wayland Signal settings.',
    );
    process.exit(0);
  }

  const tmpDir = await fs.mkdtemp(path.join(INSTALL_DIR, '..', 'tmp-'));
  const archivePath = path.join(tmpDir, asset.name);

  console.log(`[install-signal-cli] Downloading signal-cli ${version} (${asset.name})…`);
  await downloadFile(asset.browser_download_url, archivePath);

  const extractDir = path.join(tmpDir, 'extracted');
  console.log('[install-signal-cli] Extracting…');
  await extractArchive(archivePath, extractDir);

  const binaryPath = await findBinary(extractDir);
  if (!binaryPath) {
    console.error('[install-signal-cli] Binary not found after extraction.');
    process.exit(1);
  }

  await fs.mkdir(INSTALL_DIR, { recursive: true });
  const dest = path.join(INSTALL_DIR, 'signal-cli');
  await fs.copyFile(binaryPath, dest);
  await fs.chmod(dest, 0o755);

  // Cleanup temp dir.
  await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});

  console.log(`[install-signal-cli] Installed signal-cli ${version} to ${dest}`);
}

main().catch((err) => {
  console.error('[install-signal-cli] Fatal:', err.message ?? err);
  process.exit(1);
});
