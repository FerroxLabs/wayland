/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type {
  UpdateCheckResult,
  UpdateDownloadProgressEvent,
  UpdateDownloadRequest,
  UpdateDownloadResult,
  UpdateReleaseInfo,
  GitHubReleaseAsset,
} from '@/common/update/updateTypes';
import { uuid } from '@/common/utils';
import { app } from 'electron';
import * as crypto from 'node:crypto';
import * as fs from 'fs';
import * as path from 'path';
import yaml from 'js-yaml';
import semver from 'semver';
import { autoUpdaterService } from '../services/autoUpdaterService';

/** Lazily loads i18n to avoid pulling in initStorage chain at module load time */
let _i18nCache: Promise<typeof import('../services/i18n')> | null = null;
const getI18n = async () => {
  if (!_i18nCache) {
    _i18nCache = import('../services/i18n');
  }
  const m = await _i18nCache;
  return m.default;
};

type GitHubReleaseApiAsset = {
  name: string;
  browser_download_url: string;
  size: number;
  content_type?: string;
};

type GitHubReleaseApi = {
  tag_name: string;
  name?: string;
  body?: string;
  html_url: string;
  published_at?: string;
  prerelease: boolean;
  draft: boolean;
  assets?: GitHubReleaseApiAsset[];
};

/** Parameters for auto-update check via electron-updater */
interface AutoUpdateCheckParams {
  /** Whether to include prerelease/dev builds in update check */
  includePrerelease?: boolean;
}

const DEFAULT_REPO = 'FerroxLabs/wayland';
const DEFAULT_USER_AGENT = 'Wayland';
const ALLOWED_ASSET_EXTS = new Set(['.exe', '.msi', '.dmg', '.zip', '.deb', '.rpm']);
const ALLOWED_DOWNLOAD_HOSTS = new Set<string>([
  'github.com',
  'objects.githubusercontent.com',
  'github-releases.githubusercontent.com',
  'release-assets.githubusercontent.com',
]);
const MAX_REDIRECTS = 8;

const isAllowedAssetName = (name: string) => {
  const ext = path.extname(name);
  return ALLOWED_ASSET_EXTS.has(ext);
};

const normalizeTagToSemver = (tag: string): string | null => {
  const trimmed = tag.trim();
  const withoutV = trimmed.startsWith('v') ? trimmed.slice(1) : trimmed;
  // Ensure it looks like a semver prefix at least.
  if (!/^\d+\.\d+\.\d+/.test(withoutV)) return null;
  return semver.valid(withoutV);
};

const mapAsset = (asset: GitHubReleaseApiAsset): GitHubReleaseAsset => ({
  name: asset.name,
  url: asset.browser_download_url,
  fallbackUrl: asset.browser_download_url,
  size: asset.size,
  contentType: asset.content_type,
});

type RuntimePlatformInfo = {
  platform: NodeJS.Platform;
  arch: string;
};

type CanonicalArch = 'x64' | 'arm64' | 'ia32';

const normalizeArch = (arch: string): CanonicalArch => {
  if (arch === 'arm64') return 'arm64';
  if (arch === 'ia32' || arch === 'x32') return 'ia32';
  return 'x64';
};

const detectAssetArchs = (nameLower: string): Set<CanonicalArch> => {
  const detected = new Set<CanonicalArch>();

  if (/\b(arm64|aarch64)\b/.test(nameLower)) detected.add('arm64');
  if (/\b(x64|x86_64|amd64)\b/.test(nameLower)) detected.add('x64');

  const hasX86Token = /\bx86\b/.test(nameLower) && !/\bx86[_-]?64\b/.test(nameLower);
  if (/\b(ia32|x32|32bit)\b/.test(nameLower) || hasX86Token) detected.add('ia32');

  return detected;
};

const getPlatformHints = (runtime: RuntimePlatformInfo = { platform: process.platform, arch: process.arch }) => {
  const platform = runtime.platform;
  const arch = runtime.arch;
  const normalizedArch = normalizeArch(arch);

  const archHints =
    normalizedArch === 'arm64'
      ? ['arm64', 'aarch64']
      : normalizedArch === 'ia32'
        ? ['ia32', 'x86', 'x32', '32bit']
        : ['x64', 'x86_64', 'amd64'];

  // electron-builder artifact names often include one of these
  const platformHints =
    platform === 'win32' ? ['win', 'win32', 'windows'] : platform === 'darwin' ? ['mac', 'darwin', 'osx'] : ['linux'];

  return { platform, arch, normalizedArch, archHints, platformHints };
};

const scoreAsset = (asset: GitHubReleaseAsset, runtime?: RuntimePlatformInfo): number => {
  const { platform, normalizedArch, archHints, platformHints } = getPlatformHints(runtime);
  const nameLower = asset.name.toLowerCase();
  const ext = path.extname(asset.name);

  const detectedArchs = detectAssetArchs(nameLower);
  if (detectedArchs.size > 0 && !detectedArchs.has(normalizedArch)) {
    return -1;
  }

  let score = 0;

  // Platform match
  if (platformHints.some((hint) => nameLower.includes(hint))) score += 20;

  // Arch match
  if (archHints.some((hint) => nameLower.includes(hint))) score += 10;
  if (detectedArchs.has(normalizedArch)) score += 15;

  // Prefer installer formats per platform
  if (platform === 'win32') {
    if (ext === '.exe') score += 100;
    if (ext === '.msi') score += 90;
    if (ext === '.zip') score += 50;
  } else if (platform === 'darwin') {
    if (ext === '.dmg') score += 100;
    if (ext === '.zip') score += 70;
  } else {
    if (ext === '.deb') score += 100;
    if (ext === '.rpm') score += 80;
    if (ext === '.zip') score += 40;
  }

  return score;
};

export const pickRecommendedAsset = (
  assets: GitHubReleaseAsset[],
  runtime?: RuntimePlatformInfo
): GitHubReleaseAsset | undefined => {
  if (!assets.length) return undefined;

  const scored = assets
    .map((asset) => ({ asset, score: scoreAsset(asset, runtime) }))
    .filter((item) => item.score >= 0)
    .toSorted((a, b) => b.score - a.score);

  return scored[0]?.asset;
};

/**
 * RT-B6-04: The repo that supplies update metadata + integrity-verification
 * hashes MUST be a build-time constant. A renderer-supplied `repo` (or the
 * `WAYLAND_GITHUB_REPO` env var in a packaged build) would let an attacker
 * redirect the VERIFICATION SOURCE at `attacker/fake-wayland` and serve a
 * matching SHA-512, defeating the integrity check entirely. So the renderer
 * override is ignored outright, and the env override is honored ONLY in
 * unpackaged (dev) builds to support forks/staging. Packaged production builds
 * always update from the canonical repo.
 */
const resolveRepo = (): string => {
  if (!app.isPackaged) {
    const envRepo = process.env.WAYLAND_GITHUB_REPO?.trim();
    if (envRepo) return envRepo;
  }
  return DEFAULT_REPO;
};

const assertAllowedUrl = async (rawUrl: string) => {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error((await getI18n()).t('update.errors.invalidUrl'));
  }

  if (parsed.protocol !== 'https:') {
    throw new Error((await getI18n()).t('update.errors.httpsOnly'));
  }
  if (!ALLOWED_DOWNLOAD_HOSTS.has(parsed.hostname)) {
    throw new Error((await getI18n()).t('update.errors.hostNotAllowed', { host: parsed.hostname }));
  }
};

const fetchWithAllowlistedRedirects = async (rawUrl: string, signal: AbortSignal): Promise<Response> => {
  let current = rawUrl;

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    await assertAllowedUrl(current);

    const res = await fetch(current, {
      signal,
      redirect: 'manual',
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
      },
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) {
        throw new Error((await getI18n()).t('update.errors.redirectNoLocation'));
      }
      current = new URL(location, current).toString();
      continue;
    }

    return res;
  }

  throw new Error((await getI18n()).t('update.errors.tooManyRedirects'));
};

const fetchGitHubReleases = async (repo: string): Promise<GitHubReleaseApi[]> => {
  const url = `https://api.github.com/repos/${repo}/releases`;

  // Add timeout to prevent infinite wait on network issues
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': DEFAULT_USER_AGENT,
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error((await getI18n()).t('update.errors.githubApiFailed', { status: res.status }));
    }

    const json = (await res.json()) as unknown;
    if (!Array.isArray(json)) {
      throw new Error((await getI18n()).t('update.errors.githubApiNotArray'));
    }
    return json as GitHubReleaseApi[];
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error((await getI18n()).t('update.errors.githubApiTimeout'), { cause: err });
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};

// ── UPD-02: artifact integrity verification ──────────────────────────────────
// The signed electron-updater metadata (`latest*.yml`, published as GitHub
// release assets) carries a base64-encoded SHA-512 for every installer. We fetch
// it directly from the GitHub release (the trusted source - NOT the CDN), parse
// the expected hash for the asset we downloaded, and refuse to mark the download
// "completed" (the only state from which the renderer can open/run the file)
// unless the bytes on disk match. This closes the path where a hijacked CDN
// serves a trojaned installer that the user is then prompted to run.

/** Shape of a single file entry inside an electron-updater `latest*.yml`. */
type UpdaterYmlFile = {
  url?: string;
  sha512?: string;
  size?: number;
};

type UpdaterYml = {
  path?: string;
  sha512?: string;
  files?: UpdaterYmlFile[];
};

/** Candidate `latest*.yml` names electron-builder publishes per platform. */
const updaterMetadataNames = (): string[] => {
  if (process.platform === 'win32') return ['latest.yml'];
  if (process.platform === 'darwin') return ['latest-mac.yml'];
  // Linux publishes arch-specific channel files; try arm64 first on arm hosts.
  const arch = normalizeArch(process.arch);
  return arch === 'arm64' ? ['latest-linux-arm64.yml', 'latest-linux.yml'] : ['latest-linux.yml'];
};

/** Fetch a single GitHub release by tag and return its raw API payload. */
const fetchReleaseByTag = async (repo: string, tag: string): Promise<GitHubReleaseApi> => {
  const url = `https://api.github.com/repos/${repo}/releases/tags/${encodeURIComponent(tag)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': DEFAULT_USER_AGENT,
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error((await getI18n()).t('update.errors.githubApiFailed', { status: res.status }));
    }
    return (await res.json()) as GitHubReleaseApi;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error((await getI18n()).t('update.errors.githubApiTimeout'), { cause: err });
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Resolve the expected base64-encoded SHA-512 for `assetName` from the signed
 * electron-updater metadata on the GitHub release for `tag`. Throws on any
 * failure (no metadata, asset absent from metadata, parse error) so callers
 * fail closed rather than skip verification.
 */
const fetchExpectedSha512 = async (repo: string, tag: string, assetName: string): Promise<string> => {
  const release = await fetchReleaseByTag(repo, tag);
  const releaseAssets = release.assets || [];

  const wantedYmlNames = updaterMetadataNames();
  // Match by exact name first; fall back to any `latest*.yml` on the release so
  // arch/channel naming drift does not silently disable verification.
  const ymlAssets = releaseAssets.filter((a) => {
    const lower = a.name.toLowerCase();
    return wantedYmlNames.includes(lower) || (lower.startsWith('latest') && lower.endsWith('.yml'));
  });

  if (ymlAssets.length === 0) {
    throw new Error((await getI18n()).t('update.errors.metadataMissing'));
  }

  for (const ymlAsset of ymlAssets) {
    // The metadata itself must come from GitHub (the trusted, signed source).
    await assertAllowedUrl(ymlAsset.browser_download_url);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    let text: string;
    try {
      const res = await fetchWithAllowlistedRedirects(ymlAsset.browser_download_url, controller.signal);
      if (!res.ok) continue;
      text = await res.text();
    } catch {
      continue;
    } finally {
      clearTimeout(timeoutId);
    }

    let parsed: UpdaterYml;
    try {
      parsed = (yaml.load(text) as UpdaterYml) ?? {};
    } catch {
      continue;
    }

    const fromFiles = (parsed.files || []).find((f) => f.url === assetName)?.sha512;
    const fromTop = parsed.path === assetName ? parsed.sha512 : undefined;
    const sha = fromFiles || fromTop;
    if (sha) return sha;
  }

  throw new Error((await getI18n()).t('update.errors.assetNotInMetadata', { name: assetName }));
};

/** Compute the base64-encoded SHA-512 of a file by streaming it. */
const computeFileSha512 = (filePath: string): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const hash = crypto.createHash('sha512');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('base64')));
  });

/**
 * Verify the file at `filePath` matches `expectedBase64` (a base64 SHA-512).
 * Uses a constant-time comparison. Returns true only on an exact match.
 */
const verifyFileSha512 = async (filePath: string, expectedBase64: string): Promise<boolean> => {
  const actual = await computeFileSha512(filePath);
  const a = Buffer.from(actual, 'base64');
  const b = Buffer.from(expectedBase64, 'base64');
  if (a.length !== b.length || a.length === 0) return false;
  return crypto.timingSafeEqual(a, b);
};

const mapRelease = (rel: GitHubReleaseApi): UpdateReleaseInfo | null => {
  const version = normalizeTagToSemver(rel.tag_name);
  if (!version) return null;

  const assets = (rel.assets || [])
    .filter((asset) => asset && asset.name && asset.browser_download_url)
    .filter((asset) => isAllowedAssetName(asset.name))
    .map((asset) => mapAsset(asset));

  return {
    tagName: rel.tag_name,
    version,
    name: rel.name,
    body: rel.body,
    htmlUrl: rel.html_url,
    publishedAt: rel.published_at,
    prerelease: Boolean(rel.prerelease),
    draft: Boolean(rel.draft),
    assets,
    recommendedAsset: pickRecommendedAsset(assets),
  };
};

type DownloadState = {
  abortController: AbortController;
  filePath: string;
};

const downloads = new Map<string, DownloadState>();

const sanitizeFileName = (name: string): string => {
  // Keep only base name and trim weird whitespace.
  const base = path.basename(name).trim();
  // Avoid empty names.
  return base || `Wayland-update-${Date.now()}`;
};

const ensureUniquePath = (target: string): string => {
  if (!fs.existsSync(target)) return target;
  const dir = path.dirname(target);
  const ext = path.extname(target);
  const base = path.basename(target, ext);
  for (let i = 1; i < 1000; i++) {
    const next = path.join(dir, `${base} (${i})${ext}`);
    if (!fs.existsSync(next)) return next;
  }
  return path.join(dir, `${base}-${Date.now()}${ext}`);
};

const emitProgress = (evt: UpdateDownloadProgressEvent) => {
  ipcBridge.update.downloadProgress.emit(evt);
};

type DownloadAttempt = {
  ok: boolean;
  isAbort: boolean;
  message: string;
  receivedBytes: number;
  totalBytes?: number;
};

/**
 * Attempt to download from a single URL into `filePath`.
 * Emits `starting`/`downloading` progress events but NOT the terminal
 * completed/error/cancelled events - the caller decides whether to retry
 * or surface the final state.
 */
const attemptDownload = async (
  downloadId: string,
  url: string,
  filePath: string,
  abortController: AbortController
): Promise<DownloadAttempt> => {
  let receivedBytes = 0;
  let totalBytes: number | undefined;

  const startedAt = Date.now();
  let lastEmitAt = 0;

  const emitThrottled = (status: UpdateDownloadProgressEvent['status']) => {
    const now = Date.now();
    const shouldEmit = now - lastEmitAt >= 250 || status !== 'downloading';
    if (!shouldEmit) return;

    const elapsedSec = Math.max(0.001, (now - startedAt) / 1000);
    const bytesPerSecond = receivedBytes / elapsedSec;
    const percent = totalBytes ? Math.min(100, (receivedBytes / totalBytes) * 100) : undefined;

    lastEmitAt = now;
    emitProgress({
      downloadId,
      status,
      receivedBytes,
      totalBytes,
      percent,
      bytesPerSecond,
    });
  };

  emitThrottled('starting');

  let stream: fs.WriteStream | null = null;
  try {
    const res = await fetchWithAllowlistedRedirects(url, abortController.signal);

    if (!res.ok) {
      throw new Error((await getI18n()).t('update.errors.downloadFailed', { status: res.status }));
    }

    const contentLengthHeader = res.headers.get('content-length');
    if (contentLengthHeader) {
      const parsed = parseInt(contentLengthHeader, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        totalBytes = parsed;
      }
    }

    if (!res.body) {
      throw new Error((await getI18n()).t('update.errors.downloadNoBody'));
    }

    stream = fs.createWriteStream(filePath);
    const reader = res.body.getReader();

    let doneReading = false;
    while (!doneReading) {
      const { done, value } = await reader.read();
      doneReading = done;
      if (doneReading) break;
      if (!value) continue;

      receivedBytes += value.byteLength;

      const buf = Buffer.from(value);
      if (!stream.write(buf)) {
        await new Promise<void>((resolve) => stream?.once('drain', () => resolve()));
      }

      emitThrottled('downloading');
    }

    await new Promise<void>((resolve, reject) => {
      if (!stream) {
        resolve();
        return;
      }
      stream.end(() => resolve());
      stream.on('error', reject);
    });

    return { ok: true, isAbort: false, message: '', receivedBytes, totalBytes };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isAbort = abortController.signal.aborted || message.toLowerCase().includes('aborted');

    try {
      stream?.close();
    } catch {
      // ignore
    }

    // Remove partial file before retrying or reporting failure.
    try {
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { force: true });
      }
    } catch {
      // ignore
    }

    return { ok: false, isAbort, message, receivedBytes, totalBytes };
  }
};

type IntegrityContext = {
  repo: string;
  tagName: string;
  assetName: string;
};

const startDownloadInBackground = async (
  downloadId: string,
  url: string,
  filePath: string,
  abortController: AbortController,
  integrity: IntegrityContext,
  fallbackUrl?: string
) => {
  const runWithFallback = async (): Promise<DownloadAttempt> => {
    const primary = await attemptDownload(downloadId, url, filePath, abortController);
    if (primary.ok) return primary;
    if (primary.isAbort) return primary;
    if (!fallbackUrl || fallbackUrl === url) return primary;

    try {
      await assertAllowedUrl(fallbackUrl);
    } catch (err) {
      // Fallback URL itself is invalid - keep the primary failure result.
      console.warn('[updateBridge] Fallback URL rejected by allowlist:', err);
      return primary;
    }

    console.warn(`[updateBridge] Primary download failed (${primary.message}). Retrying with fallback URL.`);
    return attemptDownload(downloadId, fallbackUrl, filePath, abortController);
  };

  const finalResult = await runWithFallback();

  try {
    if (!finalResult.ok) {
      emitProgress({
        downloadId,
        status: finalResult.isAbort ? 'cancelled' : 'error',
        receivedBytes: finalResult.receivedBytes,
        totalBytes: finalResult.totalBytes,
        error: finalResult.message,
      });
      return;
    }

    // UPD-02: the bytes are on disk but UNTRUSTED - they may have come from the
    // CDN. Verify the sha512 against the signed GitHub-hosted metadata BEFORE
    // emitting `completed` (the only state from which the UI exposes "Open").
    // Any failure (mismatch, missing metadata, fetch/parse error) deletes the
    // file and surfaces an error: fail closed, never open an unverified binary.
    let verified = false;
    let verifyError = '';
    try {
      const expected = await fetchExpectedSha512(integrity.repo, integrity.tagName, integrity.assetName);
      verified = await verifyFileSha512(filePath, expected);
      if (!verified) {
        verifyError = (await getI18n()).t('update.errors.checksumMismatch');
      }
    } catch (err: unknown) {
      verifyError = err instanceof Error ? err.message : String(err);
    }

    if (!verified) {
      try {
        if (fs.existsSync(filePath)) fs.rmSync(filePath, { force: true });
      } catch {
        // ignore cleanup failure
      }
      console.error('[updateBridge] Integrity verification failed; refusing to open artifact:', verifyError);
      emitProgress({
        downloadId,
        status: 'error',
        receivedBytes: finalResult.receivedBytes,
        totalBytes: finalResult.totalBytes,
        error: verifyError || (await getI18n()).t('update.errors.checksumMismatch'),
      });
      return;
    }

    emitProgress({
      downloadId,
      status: 'completed',
      receivedBytes: finalResult.receivedBytes,
      totalBytes: finalResult.totalBytes,
      percent: finalResult.totalBytes
        ? Math.min(100, (finalResult.receivedBytes / finalResult.totalBytes) * 100)
        : undefined,
      filePath,
    });
  } finally {
    downloads.delete(downloadId);
  }
};

/**
 * Create a status broadcast callback that sends updates via ipcBridge.autoUpdate.status.emit.
 * This is a pure emitter: it does not bind to any specific window.
 * The ipcBridge channel broadcasts to all renderer listeners, so no window guard is needed here.
 */
export function createAutoUpdateStatusBroadcast(): (
  status: import('../services/autoUpdaterService').AutoUpdateStatus
) => void {
  return (status) => {
    ipcBridge.autoUpdate.status.emit(status);
  };
}

export function initUpdateBridge(): void {
  ipcBridge.update.check.provider(
    async (params): Promise<{ success: boolean; data?: UpdateCheckResult; msg?: string }> => {
      try {
        const repo = resolveRepo();
        const includePrerelease = Boolean(params?.includePrerelease);
        const currentVersion = app.getVersion();

        // EN: Versioning note
        // Update comparisons are pure semver: `app.getVersion()` (packaged app version) vs release `tag_name`.
        // If you want dev/prerelease updates to work reliably, CI must inject a prerelease semver into
        // `package.json#version` for dev builds (e.g. `1.7.2-dev.1234+sha.abcdef0`) so semver ordering holds.
        // We intentionally avoid heuristics based on tag strings when the app version is a stable semver.

        const releases = await fetchGitHubReleases(repo);
        const candidates = releases
          .filter((r) => r && !r.draft)
          .filter((r) => (includePrerelease ? true : !r.prerelease))
          .map(mapRelease)
          .filter((r): r is UpdateReleaseInfo => Boolean(r));

        const currentSemver = semver.valid(currentVersion) || semver.coerce(currentVersion)?.version;
        if (!currentSemver) {
          return { success: true, data: { currentVersion, updateAvailable: false } };
        }

        const latest = candidates
          .filter((r) => semver.valid(r.version))
          .toSorted((a, b) => semver.rcompare(a.version, b.version))[0];

        if (!latest) {
          return { success: true, data: { currentVersion, updateAvailable: false } };
        }

        const updateAvailable = semver.gt(latest.version, currentSemver);
        return {
          success: true,
          data: {
            currentVersion,
            updateAvailable,
            latest,
          },
        };
      } catch (err: unknown) {
        return { success: false, msg: err instanceof Error ? err.message : String(err) };
      }
    }
  );

  ipcBridge.update.download.provider(
    async (params: UpdateDownloadRequest): Promise<{ success: boolean; data?: UpdateDownloadResult; msg?: string }> => {
      try {
        if (!params?.url) {
          return { success: false, msg: (await getI18n()).t('update.errors.missingUrl') };
        }

        // Defense-in-depth: do not allow arbitrary downloads from renderer.
        // EN: Only allowlisted hosts (CDN + GitHub release hosts) are permitted;
        // each redirect hop is re-validated against the allowlist.
        await assertAllowedUrl(params.url);
        if (params.fallbackUrl) {
          await assertAllowedUrl(params.fallbackUrl);
        }

        const downloadId = uuid();
        const abortController = new AbortController();

        const downloadsDir = app.getPath('downloads');
        const urlObj = new URL(params.url);
        const urlName = path.basename(urlObj.pathname);
        const baseName = sanitizeFileName(params.fileName || urlName);

        // UPD-02: the integrity context locates the signed electron-updater
        // metadata (`latest*.yml`) on the GitHub release so the downloaded bytes
        // can be sha512-verified before they are openable. `tagName` is required:
        // without it there is no trusted hash to check against, so we refuse the
        // download outright rather than open an unverified installer.
        if (!params.tagName) {
          return { success: false, msg: (await getI18n()).t('update.errors.missingTag') };
        }
        // `assetName` must match the metadata's file entry - that is the asset's
        // real release filename, NOT the (possibly de-duplicated) on-disk name.
        const assetName = params.fileName || urlName;
        const integrity: IntegrityContext = {
          repo: resolveRepo(),
          tagName: params.tagName,
          assetName,
        };

        const targetPath = ensureUniquePath(path.join(downloadsDir, baseName));
        downloads.set(downloadId, { abortController, filePath: targetPath });

        // Start background download, but return immediately so the UI stays responsive.
        void startDownloadInBackground(
          downloadId,
          params.url,
          targetPath,
          abortController,
          integrity,
          params.fallbackUrl
        );

        return Promise.resolve({ success: true, data: { downloadId, filePath: targetPath } });
      } catch (err: unknown) {
        return Promise.resolve({ success: false, msg: err instanceof Error ? err.message : String(err) });
      }
    }
  );

  // Auto-updater IPC handlers (electron-updater)
  ipcBridge.autoUpdate.check.provider(
    async (
      params: AutoUpdateCheckParams
    ): Promise<{
      success: boolean;
      data?: { updateInfo?: { version: string; releaseDate?: string; releaseNotes?: string } };
      msg?: string;
    }> => {
      try {
        // Set prerelease preference before checking
        const includePrerelease = Boolean(params?.includePrerelease);
        autoUpdaterService.setAllowPrerelease(includePrerelease);

        const result = await autoUpdaterService.checkForUpdates();
        if (result.success && result.updateInfo) {
          // autoUpdaterService.checkForUpdates() only returns updateInfo when
          // electron-updater confirms isUpdateAvailable, so we can trust it directly.
          return {
            success: true,
            data: {
              updateInfo: {
                version: result.updateInfo.version,
                releaseDate: result.updateInfo.releaseDate,
                releaseNotes:
                  typeof result.updateInfo.releaseNotes === 'string' ? result.updateInfo.releaseNotes : undefined,
              },
            },
          };
        }
        return { success: result.success, msg: result.error };
      } catch (err: unknown) {
        return { success: false, msg: err instanceof Error ? err.message : String(err) };
      }
    }
  );

  ipcBridge.autoUpdate.download.provider(async (): Promise<{ success: boolean; msg?: string }> => {
    try {
      const result = await autoUpdaterService.downloadUpdate();
      return { success: result.success, msg: result.error };
    } catch (err: unknown) {
      return { success: false, msg: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcBridge.autoUpdate.quitAndInstall.provider(async (): Promise<void> => {
    try {
      autoUpdaterService.quitAndInstall();
    } catch (err: unknown) {
      console.error('quitAndInstall failed:', err);
    }
  });

  // L17 (AUDIT-05 F16): expose auto-updater bootstrap status so renderer System tab
  // can warn when auto-updates are disabled for this session. Defaults to `available: true`
  // because the channel only sets the global on explicit success/failure of the import.
  ipcBridge.autoUpdate.getStatus.provider(async (): Promise<{ available: boolean; error?: string }> => {
    return globalThis.__waylandUpdateChannelStatus ?? { available: true };
  });
}
