/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Restore the pinned OfficeCLI binary inside the signed bundle.
 *
 * OfficeCLI updates itself in the background on every run unless
 * `OFFICECLI_SKIP_UPDATE=1` is set, and it does so by moving the new release
 * over its own path. Wayland's spawns always set the flag, but anything else on
 * the machine that runs the bundled copy directly (Terminal, another agent)
 * does not, and the bundle is user-writable on a drag-installed Mac. One such
 * run replaces `Contents/Resources/bundled-officecli/<target>/officecli`, which
 * breaks the app's code seal: macOS then blocks child processes and Squirrel.Mac
 * refuses every update.
 *
 * Putting the exact pinned release bytes back restores the seal (electron-builder
 * never re-signs this file, see `signIgnore`). This downloads only the pinned
 * release asset, accepts it only if its SHA-256 equals the digest compiled into
 * the capability manifest, and swaps it in with an atomic rename, so the binary
 * is either the old bytes or the verified ones - never half-written.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { OFFICECLI_CAPABILITY, findCapabilityPlatform, type CapabilityPlatform } from '@/common/capabilities';
import { digestOfficeCliEvidence } from '@process/services/capabilities/OfficeCliContractValidator';
import { writeFileAtomic } from '@process/utils/atomicWrite';

const DOWNLOAD_TIMEOUT_MS = 180_000;
const MAX_ASSET_BYTES = 256 * 1024 * 1024;

export type OfficeCliRepairFailure =
  | 'untrusted-layout'
  | 'not-writable'
  | 'download-failed'
  | 'verify-failed'
  | 'write-failed';

export type OfficeCliRepairOutcome =
  | { status: 'absent' }
  | { status: 'intact' }
  | { status: 'repaired'; url: string }
  | { status: 'failed'; reason: OfficeCliRepairFailure; detail: string };

export type OfficeCliRepairDeps = {
  fetchBytes?: (url: string) => Promise<Buffer>;
};

/** The only URL a repair may download from: the pinned release asset. */
export function pinnedOfficeCliReleaseUrl(version: string, asset: string): string {
  return `https://github.com/iOfficeAI/OfficeCLI/releases/download/${version}/${asset}`;
}

async function fetchReleaseAsset(url: string): Promise<Buffer> {
  const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const declared = Number(res.headers.get('content-length') ?? '0');
  if (declared > MAX_ASSET_BYTES) throw new Error(`asset too large (${declared} bytes)`);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > MAX_ASSET_BYTES) throw new Error(`asset too large (${bytes.length} bytes)`);
  return bytes;
}

function readDigest(filePath: string): `sha256:${string}` | null {
  try {
    const stat = fs.lstatSync(filePath);
    if (!stat.isFile()) return null;
    return digestOfficeCliEvidence(fs.readFileSync(filePath));
  } catch {
    return null;
  }
}

const failed = (reason: OfficeCliRepairFailure, detail: string): OfficeCliRepairOutcome => ({
  status: 'failed',
  reason,
  detail,
});

/**
 * Restore `<resourcesRoot>/bundled-officecli/<platform>-<arch>/officecli` to the
 * pinned bytes when it has drifted. Never throws.
 */
export async function repairBundledOfficeCli(
  resourcesRoot: string,
  platform: CapabilityPlatform['platform'],
  arch: CapabilityPlatform['arch'],
  deps: OfficeCliRepairDeps = {}
): Promise<OfficeCliRepairOutcome> {
  const target = findCapabilityPlatform(OFFICECLI_CAPABILITY, platform, arch);
  if (!target) return { status: 'absent' };
  const runtimeDir = path.join(resourcesRoot, 'bundled-officecli', `${platform}-${arch}`);
  const binaryPath = path.join(runtimeDir, platform === 'win32' ? 'officecli.exe' : 'officecli');
  const manifestPath = path.join(runtimeDir, 'manifest.json');

  let url: string;
  try {
    if (!fs.existsSync(manifestPath)) return { status: 'absent' };
    // Same containment rule as resolveBundledOfficeCliDir: never follow a link
    // out of the bundle, so a repair can only ever write inside it.
    const rootReal = fs.realpathSync(resourcesRoot);
    if (
      fs.lstatSync(runtimeDir).isSymbolicLink() ||
      fs.lstatSync(manifestPath).isSymbolicLink() ||
      !fs.realpathSync(runtimeDir).startsWith(`${rootReal}${path.sep}`)
    ) {
      return failed('untrusted-layout', 'OfficeCLI runtime directory escapes the app bundle');
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Record<string, unknown>;
    const version = `v${OFFICECLI_CAPABILITY.version}`;
    url = pinnedOfficeCliReleaseUrl(version, target.artifact);
    if (
      manifest.version !== version ||
      manifest.asset !== target.artifact ||
      manifest.sha256 !== target.binarySha256 ||
      (manifest.source !== url && manifest.source !== 'verified-cache')
    ) {
      return failed('untrusted-layout', 'OfficeCLI manifest does not name the pinned release');
    }
  } catch (error) {
    return failed('untrusted-layout', error instanceof Error ? error.message : String(error));
  }

  if (readDigest(binaryPath) === target.binarySha256) return { status: 'intact' };

  try {
    fs.accessSync(runtimeDir, fs.constants.W_OK);
  } catch {
    return failed('not-writable', `${runtimeDir} is not writable`);
  }

  let bytes: Buffer;
  try {
    bytes = await (deps.fetchBytes ?? fetchReleaseAsset)(url);
  } catch (error) {
    return failed('download-failed', error instanceof Error ? error.message : String(error));
  }
  const downloaded = digestOfficeCliEvidence(bytes);
  if (downloaded !== target.binarySha256) {
    return failed('verify-failed', `downloaded ${downloaded}, pinned ${target.binarySha256}`);
  }

  try {
    await writeFileAtomic(binaryPath, bytes, { mode: 0o755 });
    // umask can strip bits from the create mode; the binary must stay executable.
    fs.chmodSync(binaryPath, 0o755);
  } catch (error) {
    return failed('write-failed', error instanceof Error ? error.message : String(error));
  }
  if (readDigest(binaryPath) !== target.binarySha256) {
    return failed('write-failed', 'OfficeCLI bytes on disk do not match the pinned digest after the swap');
  }
  return { status: 'repaired', url };
}
