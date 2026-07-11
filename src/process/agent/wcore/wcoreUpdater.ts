/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * In-app updater for the bundled Wayland Core engine binary.
 *
 * The engine ships as a bundled native binary (see {@link resolveWCoreBinary}).
 * This module lets the app pull a newer signed release WITHOUT a full app
 * update: it checks the engine's GitHub releases, downloads the platform
 * archive, SHA-256 verifies it against the release's `checksums.txt`, extracts
 * it, and installs it into the user-data override dir that the resolver checks
 * first. The next engine spawn picks up the new binary.
 *
 * SECURITY: the install path downloads + executes a native binary, so the IPC
 * channels that drive it are HUMAN-only (remote-denied in `bridgeAllowlist`).
 * The SHA-256 verification against the signed-release checksum is the trust
 * anchor - an archive whose hash does not match is discarded, never installed.
 */

import { createHash } from 'node:crypto';
import { chmodSync, createReadStream, createWriteStream, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { chmod, copyFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type {
  WCoreInstallResult,
  WCoreUpdateCheck,
  WCoreUpdateProgress,
} from '@/common/update/wcoreUpdateTypes';
import { WCORE_OVERRIDE_SUBDIR, detectWCore } from './binaryResolver';

export type { WCoreInstallResult, WCoreUpdateCheck, WCoreUpdateProgress };

/** The engine release repo. */
const REPO = 'FerroxLabs/wayland-core';
const RELEASES_API = `https://api.github.com/repos/${REPO}/releases/latest`;
const DOWNLOAD_BASE = `https://github.com/${REPO}/releases/download`;
const CHECKSUMS_ASSET = 'wayland-core-checksums.txt';
const PRIMARY_BINARY = 'wayland-core';

/** GitHub requires a User-Agent on every API request. */
const UA = 'Wayland-Desktop';

// ---- Pure helpers (unit-tested; no Electron / network) ----------------------

const ARCH_MAP: Record<string, string> = { x64: 'x86_64', arm64: 'aarch64' };
const PLATFORM_MAP: Record<string, { triple: string; ext: 'tar.gz' | 'zip' }> = {
  darwin: { triple: 'apple-darwin', ext: 'tar.gz' },
  linux: { triple: 'unknown-linux-gnu', ext: 'tar.gz' },
  win32: { triple: 'pc-windows-msvc', ext: 'zip' },
};

/** `<platform>-<arch>` runtime key, matching the bundled-binary dir layout. */
export function runtimeKey(platform: string = process.platform, arch: string = process.arch): string {
  return `${platform}-${arch}`;
}

/**
 * The release asset filename for a tag on a platform/arch, e.g.
 * `wayland-core-v0.12.2-aarch64-apple-darwin.tar.gz`. Returns `null` for an
 * unsupported platform/arch.
 */
export function assetNameFor(tag: string, platform: string = process.platform, arch: string = process.arch): string | null {
  const a = ARCH_MAP[arch];
  const p = PLATFORM_MAP[platform];
  if (!a || !p) return null;
  return `wayland-core-${tag}-${a}-${p.triple}.${p.ext}`;
}

/**
 * A well-formed engine release tag (`v0.12.2`, `0.12.3`, `v0.13.0-rc.1`). The
 * tag flows into temp paths and (on Windows) a PowerShell `-Command` string, so
 * it is validated against this strict allowlist BEFORE any use - a tag carrying
 * shell metacharacters (e.g. a single quote) is rejected outright.
 */
const RELEASE_TAG_RE = /^v?\d+\.\d+\.\d+(-[A-Za-z0-9.]+)?$/;

/** True when `tag` is a safe, well-formed release tag. */
export function isValidReleaseTag(tag: string): boolean {
  return RELEASE_TAG_RE.test(tag);
}

/** Strip a leading `v` and any prerelease/build suffix to `major.minor.patch`. */
function semverTriple(v: string): [number, number, number] {
  const m = v.replace(/^v/, '').match(/(\d+)\.(\d+)\.(\d+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0];
}

/** True when `latest` is a strictly-higher stable version than `current`. */
export function isNewerVersion(latest: string, current: string): boolean {
  const a = semverTriple(latest);
  const b = semverTriple(current);
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}

/**
 * Parse a `checksums.txt` body (`<sha256>  <filename>` per line) and return the
 * lowercase hex digest for `assetName`, or `null` if absent.
 */
export function parseChecksum(body: string, assetName: string): string | null {
  for (const line of body.split('\n')) {
    const m = line.trim().match(/^([a-f0-9]{64})\s+(.+)$/i);
    if (m && m[2].trim() === assetName) return m[1].toLowerCase();
  }
  return null;
}

/** Extract the `major.minor.patch` from a `wayland-core --version` string. */
function normalizeVersion(raw: string | undefined): string | null {
  if (!raw) return null;
  const m = raw.match(/(\d+\.\d+\.\d+)/);
  return m ? m[1] : null;
}

// ---- Electron / fs / network (lazy electron; not loaded under unit tests) ---

/** `<userData>/wayland-core-overrides`, or throws if Electron is unavailable. */
function overrideDir(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  const electron = require('electron') as { app?: { getPath?: (n: string) => string } };
  const userData = electron.app?.getPath?.('userData');
  if (!userData) throw new Error('userData path unavailable');
  return join(userData, WCORE_OVERRIDE_SUBDIR);
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/vnd.github+json' } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.text();
}

/** Check the latest engine release against the installed binary. */
export async function checkForWCoreUpdate(): Promise<WCoreUpdateCheck> {
  const current = normalizeVersion(detectWCore().version);
  try {
    const body = await fetchText(RELEASES_API);
    const release = JSON.parse(body) as { tag_name?: string; html_url?: string };
    const tag = typeof release.tag_name === 'string' ? release.tag_name : null;
    const latest = normalizeVersion(tag ?? undefined);
    return {
      current,
      latest,
      tag,
      htmlUrl: release.html_url ?? null,
      updateAvailable: !!(latest && current && isNewerVersion(latest, current)),
    };
  } catch (err) {
    return {
      current,
      latest: null,
      tag: null,
      htmlUrl: null,
      updateAvailable: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Stream a URL to a file, reporting download percent when a length is known. */
async function download(url: string, dest: string, onProgress?: (percent: number) => void): Promise<void> {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok || !res.body) throw new Error(`GET ${url} -> ${res.status}`);
  const total = Number(res.headers.get('content-length')) || 0;
  let received = 0;
  const source = Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]);
  if (total && onProgress) {
    source.on('data', (chunk: Buffer) => {
      received += chunk.length;
      onProgress(Math.min(100, Math.round((received / total) * 100)));
    });
  }
  await pipeline(source, createWriteStream(dest));
}

/** Compute a file's lowercase SHA-256 hex digest by streaming it. */
function sha256File(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(path);
    stream.on('data', (c) => hash.update(c));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/** Escape a path for a PowerShell single-quoted literal (double any quote). */
function psQuote(p: string): string {
  return p.replace(/'/g, "''");
}

/** Extract a `.tar.gz` / `.zip` archive into `outDir` using the OS tool. */
function extractArchive(archivePath: string, outDir: string): void {
  mkdirSync(outDir, { recursive: true });
  if (archivePath.endsWith('.zip')) {
    if (process.platform === 'win32') {
      // Defence-in-depth (the tag is already allowlist-validated): PowerShell
      // single-quoted strings escape an embedded quote by doubling it, so a
      // quirky tmpdir/path can never break out of the literal.
      execFileSync(
        'powershell',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          `Expand-Archive -LiteralPath '${psQuote(archivePath)}' -DestinationPath '${psQuote(outDir)}' -Force`,
        ],
        { timeout: 120_000 }
      );
    } else {
      execFileSync('unzip', ['-o', archivePath, '-d', outDir], { timeout: 120_000 });
    }
  } else {
    execFileSync('tar', ['-xzf', archivePath, '-C', outDir], { timeout: 120_000 });
  }
}

/** Recursively find a binary by name within an extracted dir. */
async function findBinary(dir: string, name: string): Promise<string | null> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isFile() && entry.name === name) return full;
    if (entry.isDirectory()) {
      // Sequential by design - a recursive directory walk, depth-first.
      // oxlint-disable-next-line no-await-in-loop
      const found = await findBinary(full, name);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Download, verify, and install the engine release `tag` into the override dir.
 * Every failure mode (unsupported platform, network, checksum mismatch, missing
 * binary) returns `{ ok: false }` and leaves the existing engine untouched.
 */
export async function installWCoreUpdate(
  tag: string,
  onProgress?: (p: WCoreUpdateProgress) => void
): Promise<WCoreInstallResult> {
  // Reject any tag carrying shell/path metacharacters before it reaches a temp
  // path or (on Windows) a PowerShell command string.
  if (!isValidReleaseTag(tag)) return { ok: false, error: `invalid release tag: ${tag}` };

  const assetName = assetNameFor(tag);
  const binaryName = process.platform === 'win32' ? `${PRIMARY_BINARY}.exe` : PRIMARY_BINARY;
  if (!assetName) return { ok: false, error: `unsupported platform ${runtimeKey()}` };

  const work = join(tmpdir(), `wcore-update-${tag}-${process.pid}`);
  const archivePath = join(work, assetName);
  const extractDir = join(work, 'extract');

  try {
    mkdirSync(work, { recursive: true });

    // 1. Download the archive + the release checksums.
    onProgress?.({ phase: 'downloading', percent: 0 });
    await download(`${DOWNLOAD_BASE}/${tag}/${assetName}`, archivePath, (percent) =>
      onProgress?.({ phase: 'downloading', percent })
    );
    const checksums = await fetchText(`${DOWNLOAD_BASE}/${tag}/${CHECKSUMS_ASSET}`);

    // 2. Verify SHA-256 against the signed-release checksum (trust anchor).
    onProgress?.({ phase: 'verifying' });
    const expected = parseChecksum(checksums, assetName);
    if (!expected) return { ok: false, error: `no checksum for ${assetName}` };
    const actual = await sha256File(archivePath);
    if (actual !== expected) return { ok: false, error: 'checksum mismatch' };

    // 3. Extract + locate the binary.
    onProgress?.({ phase: 'extracting' });
    extractArchive(archivePath, extractDir);
    const extracted = await findBinary(extractDir, binaryName);
    if (!extracted) return { ok: false, error: `binary ${binaryName} not found in archive` };

    // 4. Install atomically into <override>/<runtimeKey>/ (copy to a temp name in
    //    the SAME dir, chmod, then rename over the final path).
    onProgress?.({ phase: 'installing' });
    const destDir = join(overrideDir(), runtimeKey());
    mkdirSync(destDir, { recursive: true });
    const finalPath = join(destDir, binaryName);
    const stagePath = join(destDir, `.${binaryName}.staging`);
    await copyFile(extracted, stagePath);
    if (process.platform !== 'win32') await chmod(stagePath, 0o755);
    try {
      renameSync(stagePath, finalPath);
    } catch (err) {
      // On Windows a currently-running wayland-core.exe is locked, so replacing
      // it in place fails (EBUSY/EPERM/EACCES). Surface an actionable message
      // instead of the raw errno, and drop the orphaned staging copy.
      const code = (err as NodeJS.ErrnoException).code;
      if (process.platform === 'win32' && (code === 'EBUSY' || code === 'EPERM' || code === 'EACCES')) {
        // The live engine binary is locked while the embedded engine runs, so it
        // cannot be replaced in place. Stage it as `<binary>.pending` and swap it
        // in at the next app startup (applyPendingWCoreUpdate), before any engine
        // spawns and re-locks it. A retry-after-restart of the in-place path can
        // never succeed on Windows because the engine respawns on boot and
        // re-locks the binary first — which is exactly why the old "restart, then
        // update" flow looped forever.
        const pendingPath = `${finalPath}.pending`;
        try {
          rmSync(pendingPath, { force: true });
          renameSync(stagePath, pendingPath);
        } catch (stageErr) {
          try {
            rmSync(stagePath, { force: true });
          } catch {
            // best-effort staging cleanup
          }
          const message = `Could not stage the engine update: ${
            stageErr instanceof Error ? stageErr.message : String(stageErr)
          }`;
          onProgress?.({ phase: 'error', message });
          return { ok: false, error: message };
        }
        const installed = normalizeVersion(tag) ?? tag;
        onProgress?.({ phase: 'done', message: installed });
        return { ok: true, version: installed, staged: true };
      }
      throw err;
    }

    const installed = normalizeVersion(tag) ?? tag;
    onProgress?.({ phase: 'done', message: installed });
    return { ok: true, version: installed };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    onProgress?.({ phase: 'error', message });
    return { ok: false, error: message };
  } finally {
    try {
      rmSync(work, { recursive: true, force: true });
    } catch {
      // best-effort temp cleanup
    }
  }
}

/**
 * Activate a staged engine update from a previous session. On Windows the live
 * engine binary is locked while the embedded engine runs, so an in-app update is
 * staged as `<binary>.pending` (see installWCoreUpdate) rather than replacing the
 * running binary. This swaps the staged binary into place at app startup — which
 * MUST run before any engine is spawned (and would re-lock the binary). Called
 * from the main-process bootstrap ahead of `initializeProcess()`.
 *
 * Synchronous + best-effort: no pending file is a no-op; a failed swap leaves the
 * pending file for the next boot and never blocks startup.
 */
export function applyPendingWCoreUpdate(): { applied: boolean } {
  let finalPath: string;
  try {
    const binaryName = process.platform === 'win32' ? `${PRIMARY_BINARY}.exe` : PRIMARY_BINARY;
    finalPath = join(overrideDir(), runtimeKey(), binaryName);
  } catch {
    // Electron/userData unavailable this early or off — best-effort no-op.
    return { applied: false };
  }
  return applyPendingSwap(finalPath);
}

/**
 * Swap `<finalPath>.pending` into `finalPath`, keeping a `.prev` rollback anchor.
 * Extracted from applyPendingWCoreUpdate so the swap/backup logic is unit-testable
 * without resolving the Electron userData path. Best-effort: a missing pending
 * file is a no-op; any failure returns `{ applied: false }` and leaves the pending
 * file for the next boot.
 */
export function applyPendingSwap(finalPath: string): { applied: boolean } {
  const pendingPath = `${finalPath}.pending`;
  if (!existsSync(pendingPath)) return { applied: false };
  try {
    // Windows rename() will not overwrite an existing target, so clear the live
    // binary first. Safe when called before any engine spawn — nothing holds the
    // file open. Keep a `.prev` copy as a best-effort rollback anchor.
    if (existsSync(finalPath)) {
      const prevPath = `${finalPath}.prev`;
      try {
        rmSync(prevPath, { force: true });
        renameSync(finalPath, prevPath);
      } catch {
        rmSync(finalPath, { force: true });
      }
    }
    renameSync(pendingPath, finalPath);
    if (process.platform !== 'win32') {
      try {
        chmodSync(finalPath, 0o755);
      } catch {
        // best-effort; non-fatal
      }
    }
    return { applied: true };
  } catch {
    // Leave the pending file for the next boot; never brick startup.
    return { applied: false };
  }
}
