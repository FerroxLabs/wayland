/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/openclaw/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * install-signal-cli.mjs - postinstall / on-demand helper.
 *
 * Downloads the source-pinned signal-cli native binary from GitHub Releases
 * and atomically publishes it into src/process/channels/signal-cli-runtime/bin/.
 *
 * Usage:
 *   node scripts/install-signal-cli.mjs --platform linux --arch x64
 *
 * The pinned upstream release currently proves only Linux x64. Unsupported
 * targets return unavailable after removing stale runtime bytes; packaging treats
 * Signal as an explicit optional warning.
 */

import { createReadStream, createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import { request } from 'node:https';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUNTIME_ROOT = path.resolve(__dirname, '../src/process/channels/signal-cli-runtime');
const require = createRequire(import.meta.url);
const { inspectExecutable } = require('./verify-packaged-resources.js');
const pinnedRelease = require('./signal-cli-pinned-release.json');
const API_URL = `https://api.github.com/repos/AsamK/signal-cli/releases/tags/${pinnedRelease.releaseTag}`;

function looksLikeArchive(name) {
  const lower = name.toLowerCase();
  return lower.endsWith('.tar.gz') || lower.endsWith('.tgz') || lower.endsWith('.zip');
}

const ALLOWED_DOWNLOAD_HOSTS = new Set([
  'github.com',
  'objects.githubusercontent.com',
  'release-assets.githubusercontent.com',
]);

export function assertAllowedDownloadUrl(value) {
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:' || !ALLOWED_DOWNLOAD_HOSTS.has(parsed.hostname)) {
    throw new Error(`Untrusted Signal download URL: ${parsed.protocol}//${parsed.hostname}`);
  }
  return parsed.href;
}

export function pickAsset(assets, platform, arch, authority = pinnedRelease) {
  if (platform !== authority.platform || arch !== authority.arch) return undefined;
  const matches = assets.filter(
    (asset) =>
      asset.name === authority.asset &&
      asset.id === authority.assetId &&
      asset.browser_download_url === authority.url &&
      looksLikeArchive(asset.name)
  );
  return matches.length === 1 ? matches[0] : undefined;
}

async function downloadFile(url, dest, maxRedirects = 5) {
  const trustedUrl = assertAllowedDownloadUrl(url);
  await new Promise((resolve, reject) => {
    const req = request(trustedUrl, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400) {
        const location = res.headers.location;
        if (!location || maxRedirects <= 0) {
          reject(new Error('Redirect loop'));
          return;
        }
        resolve(downloadFile(new URL(location, trustedUrl).href, dest, maxRedirects - 1));
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

export async function findExactBinary(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  if (entries.length !== 1 || !entries[0].isFile() || entries[0].name !== 'signal-cli') return null;
  return path.join(root, 'signal-cli');
}

function parseTarget(argv) {
  const read = (flag) => {
    const index = argv.indexOf(flag);
    if (index === -1 || !argv[index + 1]) throw new Error(`${flag} is required`);
    if (argv.lastIndexOf(flag) !== index) throw new Error(`${flag} must be declared exactly once`);
    return argv[index + 1];
  };
  const platform = read('--platform');
  const arch = read('--arch');
  if (!['darwin', 'linux', 'win32'].includes(platform) || !['x64', 'arm64'].includes(arch)) {
    throw new Error(`Unsupported Signal target: ${platform}-${arch}`);
  }
  return { platform, arch };
}

async function sha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

export async function cleanRuntimeRoot(runtimeRoot = RUNTIME_ROOT) {
  await fs.mkdir(runtimeRoot, { recursive: true });
  for (const entry of await fs.readdir(runtimeRoot, { withFileTypes: true })) {
    if (entry.name === 'README.md') continue;
    await fs.rm(path.join(runtimeRoot, entry.name), { recursive: true, force: true });
  }
}

export async function publishBundle(stagedBin, runtimeRoot) {
  const publishDir = path.join(runtimeRoot, `.publish-${process.pid}-${Date.now()}`);
  const finalBin = path.join(runtimeRoot, 'bin');
  try {
    await fs.cp(stagedBin, publishDir, { recursive: true });
    await fs.rm(finalBin, { recursive: true, force: true });
    await fs.rename(publishDir, finalBin);
  } finally {
    await fs.rm(publishDir, { recursive: true, force: true });
  }
}

export async function installSignalCli(options = {}) {
  const { platform, arch } = options.platform ? options : parseTarget(process.argv.slice(2));
  const runtimeRoot = options.runtimeRoot || RUNTIME_ROOT;
  const fetchImpl = options.fetchImpl || fetch;
  const downloadFileImpl = options.downloadFileImpl || downloadFile;
  const extractArchiveImpl = options.extractArchiveImpl || extractArchive;
  // Seam for the liveness probe below, alongside the fetch/download/extract
  // seams. The probe only fires when the target equals the host, so a fixture
  // that stubs extraction with a synthetic binary could never satisfy it on a
  // matching host: on ubuntu the exec of a 64-byte fake ELF fails, while on
  // macOS and Windows the probe is skipped and the assertion is never made.
  // The digest pin above remains the gate; this probe is defence in depth.
  const execFileImpl = options.execFileImpl || execFileAsync;
  // The probe can only run where the host can execute the target, so the host
  // identity is injectable purely so tests can reach that branch on any runner.
  const hostPlatform = options.hostPlatform || process.platform;
  const hostArch = options.hostArch || process.arch;
  const authority = options.authority || pinnedRelease;
  let published = false;

  console.log(`[install-signal-cli] platform=${platform} arch=${arch}`);
  await cleanRuntimeRoot(runtimeRoot);
  if (platform !== authority.platform || arch !== authority.arch) {
    const reason = `No pinned native Signal runtime for ${platform}/${arch}`;
    console.warn(`[install-signal-cli] unavailable: ${reason}`);
    return { available: false, platform, arch, reason };
  }
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-signal-cli-'));
  try {
    const response = await fetchImpl(API_URL, {
      headers: { 'User-Agent': 'wayland-installer', Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) throw new Error(`GitHub API error: HTTP ${response.status}`);
    const payload = await response.json();
    const releaseTag = payload.tag_name;
    if (releaseTag !== authority.releaseTag || payload.id !== authority.releaseId) {
      throw new Error('Pinned Signal release identity mismatch');
    }
    const asset = pickAsset(payload.assets ?? [], platform, arch, authority);
    if (!asset) throw new Error(`No unique native release asset for ${platform}/${arch}`);
    const upstreamArchiveSha = String(asset.digest || '')
      .replace(/^sha256:/i, '')
      .toLowerCase();
    const expectedArchiveSha = authority.archiveSha256;
    if (upstreamArchiveSha !== expectedArchiveSha) {
      throw new Error(`Pinned Signal archive digest disagrees with GitHub release metadata`);
    }
    const archivePath = path.join(tmpDir, asset.name);
    console.log(`[install-signal-cli] Downloading signal-cli ${releaseTag} (${asset.name})…`);
    await downloadFileImpl(asset.browser_download_url, archivePath);
    const actualArchiveSha = await sha256(archivePath);
    if (actualArchiveSha !== expectedArchiveSha) throw new Error(`Archive checksum mismatch for ${asset.name}`);
    const extractDir = path.join(tmpDir, 'extracted');
    console.log('[install-signal-cli] Extracting…');
    await extractArchiveImpl(archivePath, extractDir);
    const binaryPath = await findExactBinary(extractDir);
    if (!binaryPath) throw new Error('Archive does not contain exactly one root signal-cli executable');
    const identity = inspectExecutable(binaryPath);
    if (identity?.platform !== platform || identity?.arch !== arch) {
      throw new Error(`Signal executable architecture mismatch for ${platform}-${arch}`);
    }
    if ((await sha256(binaryPath)) !== authority.binarySha256) {
      throw new Error('Signal executable checksum does not match the pinned native binary');
    }
    await fs.chmod(binaryPath, 0o755);
    let versionOutput = null;
    let versionVerified = false;
    if (platform === hostPlatform && arch === hostArch) {
      const result = await execFileImpl(binaryPath, ['--version'], { timeout: 15000 });
      versionOutput = `${result.stdout || ''}${result.stderr || ''}`.trim();
      const version = releaseTag.replace(/^v/, '');
      // Anchored on word boundaries, not `includes`. A substring test accepts
      // '0.14.60' and '10.14.6' for a pinned '0.14.6', so it would have passed a
      // neighbouring release - the opposite of what a version assertion is for.
      const escaped = version.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(versionOutput)) {
        throw new Error('Signal executable version does not match release tag');
      }
      versionVerified = true;
    }
    const stagedBin = path.join(tmpDir, 'bundle-bin');
    await fs.mkdir(stagedBin, { recursive: true });
    const binaryName = platform === 'win32' ? 'signal-cli.exe' : 'signal-cli';
    const stagedBinary = path.join(stagedBin, binaryName);
    await fs.copyFile(binaryPath, stagedBinary);
    await fs.chmod(stagedBinary, 0o755);
    const binarySha = await sha256(stagedBinary);
    const manifest = {
      contract: 'wayland-signal-cli-bundle/1.0',
      platform,
      arch,
      releaseTag,
      verified: true,
      versionVerified,
      versionOutput,
      source: {
        owner: 'AsamK',
        repository: 'signal-cli',
        releaseId: payload.id,
        assetId: asset.id,
        asset: asset.name,
        url: asset.browser_download_url,
        assetDigest: `sha256:${expectedArchiveSha}`,
        archiveSha256: `sha256:${actualArchiveSha}`,
      },
      binary: { name: binaryName, sha256: `sha256:${binarySha}` },
    };
    await fs.writeFile(path.join(stagedBin, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    await publishBundle(stagedBin, runtimeRoot);
    published = true;
    console.log(`[install-signal-cli] Installed signal-cli ${releaseTag} to ${path.join(runtimeRoot, 'bin')}`);
    return manifest;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
    if (!published) await cleanRuntimeRoot(runtimeRoot);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  installSignalCli().catch((err) => {
    console.error('[install-signal-cli] Fatal:', err.message ?? err);
    process.exit(1);
  });
}
