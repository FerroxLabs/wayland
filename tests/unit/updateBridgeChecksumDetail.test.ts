/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #853 - a failed app update must say WHY, without leaking a credential.
 *
 * `verifyFileSha512` returned a bare boolean, discarding the digest it had just
 * computed, so the caller could only ever emit "checksum mismatch". A user
 * staring at that could not tell a truncated download from a wrong asset from a
 * tampered CDN copy, and had nothing to compare against the Releases page.
 *
 * The surfaced string is now routed through `redactCommandSecrets` - the same
 * scrubber the landed half of #853 uses on surfaced engine failures
 * (WCoreManager) - because the failure text carries renderer-supplied names.
 *
 * Drives the real `update.download` provider over a stubbed `fetch` and reads
 * the terminal progress event the UI actually renders. i18n is served from the
 * real en-US bundle through a minimal interpolator: the process i18n module
 * pulls the storage/ACP init chain, which has nothing to do with this contract.
 */

import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import updateLocale from '@renderer/services/i18n/locales/en-US/update.json';

const REPO = 'FerroxLabs/wayland';
const TAG = 'v1.9.22';
const ASSET = 'Wayland-1.9.22-mac-arm64.dmg';
const ASSET_URL = `https://github.com/${REPO}/releases/download/${TAG}/${ASSET}`;
const YML_URL = `https://github.com/${REPO}/releases/download/${TAG}/latest-mac.yml`;

const ARCHIVE_BYTES = Buffer.from('installer bytes that will not match the signed metadata');
const ACTUAL_SHA512 = createHash('sha512').update(ARCHIVE_BYTES).digest('base64');
/** Well-formed, same length, wrong value - what a swapped or corrupted asset looks like. */
const PUBLISHED_SHA512 = Buffer.alloc(64, 7).toString('base64');

let downloadsDir = '';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('electron', () => ({
  app: {
    getVersion: vi.fn(() => '1.0.0'),
    getPath: vi.fn(() => downloadsDir),
    isPackaged: true,
  },
}));

vi.mock('electron-updater', () => ({
  autoUpdater: {
    logger: null,
    autoDownload: false,
    autoInstallOnAppQuit: true,
    allowPrerelease: false,
    allowDowngrade: false,
    on: vi.fn(),
    removeListener: vi.fn(),
    checkForUpdates: vi.fn(),
    downloadUpdate: vi.fn(),
    quitAndInstall: vi.fn(),
    checkForUpdatesAndNotify: vi.fn(),
  },
}));

vi.mock('electron-log', () => ({
  default: { transports: { file: { level: 'info' } }, info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('@process/services/autoUpdaterService', () => ({
  autoUpdaterService: {
    setAllowPrerelease: vi.fn(),
    checkForUpdates: vi.fn(),
    downloadUpdate: vi.fn(),
    quitAndInstall: vi.fn(),
  },
}));

vi.mock('@process/services/ijfwSystemService', () => ({
  ijfwSystemService: {
    detectLocalInstall: vi.fn(async () => ({ installed: false })),
    getLatestPublished: vi.fn(async () => null),
  },
}));

/**
 * Real en-US strings, `{{placeholder}}` substitution only. Key coverage is
 * already guarded by updateBridgeErrorKeys.test.ts, which scans the bridge
 * source; this only has to compose the message the way i18next would.
 */
vi.mock('@process/services/i18n', () => {
  const table = updateLocale as unknown as Record<string, unknown>;
  const lookup = (key: string): string => {
    const parts = key.replace(/^update\./, '').split('.');
    let node: unknown = table;
    for (const part of parts) {
      if (typeof node !== 'object' || node === null) return key;
      node = (node as Record<string, unknown>)[part];
    }
    return typeof node === 'string' ? node : key;
  };
  return {
    default: {
      t: (key: string, params?: Record<string, unknown>) =>
        lookup(key).replace(/{{(\w+)}}/g, (m, name: string) => (params && name in params ? String(params[name]) : m)),
    },
  };
});

vi.mock('@office-ai/platform', () => {
  const makeProvider = () => ({ provider: vi.fn(), invoke: vi.fn() });
  const makeEmitter = () => ({ emit: vi.fn(), on: vi.fn(() => () => {}), off: vi.fn() });
  return {
    bridge: { buildProvider: vi.fn(makeProvider), buildEmitter: vi.fn(makeEmitter) },
    storage: {
      buildStorage: () => ({
        getSync: () => undefined,
        setSync: () => {},
        get: () => Promise.resolve(undefined),
        set: () => Promise.resolve(),
        remove: () => Promise.resolve(),
        clear: () => Promise.resolve(),
      }),
    },
  };
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

type ProgressEvent = { status: string; error?: string };

/** Release payload naming the installer plus the signed updater metadata. */
const releaseByTag = () => ({
  tag_name: TAG,
  name: TAG,
  html_url: `https://github.com/${REPO}/releases/tag/${TAG}`,
  assets: [
    { name: ASSET, browser_download_url: ASSET_URL, size: ARCHIVE_BYTES.length },
    { name: 'latest-mac.yml', browser_download_url: YML_URL, size: 200 },
  ],
});

/**
 * Serve the GitHub API, the signed `latest-mac.yml` and the installer bytes.
 * The metadata publishes a digest the bytes do not have.
 */
function stubUpdateFetch(metadataAssetName: string): void {
  const yml = ['version: 1.9.22', 'files:', `  - url: ${metadataAssetName}`, `    sha512: ${PUBLISHED_SHA512}`].join(
    '\n'
  );

  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url.startsWith('https://api.github.com/')) {
        return { ok: true, status: 200, json: async () => releaseByTag() };
      }
      if (url === YML_URL) {
        return { ok: true, status: 200, text: async () => yml };
      }
      if (url === ASSET_URL) {
        let sent = false;
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-length': String(ARCHIVE_BYTES.length) }),
          body: {
            getReader: () => ({
              read: async () => {
                if (sent) return { done: true, value: undefined };
                sent = true;
                return { done: false, value: new Uint8Array(ARCHIVE_BYTES) };
              },
            }),
          },
        };
      }
      return { ok: false, status: 404, text: async () => 'not found' };
    })
  );
}

type DownloadHandler = (p: Record<string, unknown>) => Promise<{ success: boolean; msg?: string }>;

let download: DownloadHandler;
let progress: { mock: { calls: unknown[][] } };

beforeAll(async () => {
  const { initUpdateBridge } = await import('@process/bridge/updateBridge');
  const { ipcBridge } = await import('@/common');

  initUpdateBridge();

  const call = vi.mocked(ipcBridge.update.download.provider).mock.calls.at(-1);
  if (!call) throw new Error('update.download handler not registered');
  download = call[0] as DownloadHandler;
  progress = vi.mocked(ipcBridge.update.downloadProgress.emit) as unknown as typeof progress;
});

/** Wait for the terminal `error` event the download emits when verification fails. */
async function awaitErrorEvent(): Promise<string> {
  return vi.waitFor(
    () => {
      const events = progress.mock.calls.map((c) => c[0] as ProgressEvent);
      const failure = events.find((e) => e?.status === 'error');
      if (!failure) throw new Error(`no error event yet: [${events.map((e) => e?.status).join(',')}]`);
      return failure.error ?? '';
    },
    { timeout: 8000, interval: 25 }
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('#853 update download surfaces the real integrity failure', () => {
  beforeEach(() => {
    downloadsDir = mkdtempSync(join(tmpdir(), 'wayland-update-test-'));
    progress.mock.calls.length = 0;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (downloadsDir) rmSync(downloadsDir, { recursive: true, force: true });
  });

  it('reports the published digest and the one the bytes actually have', async () => {
    stubUpdateFetch(ASSET);

    const started = await download({ url: ASSET_URL, fileName: ASSET, tagName: TAG, repo: REPO });
    expect(started.success).toBe(true);

    const error = await awaitErrorEvent();

    expect(error).toContain(PUBLISHED_SHA512);
    expect(error).toContain(ACTUAL_SHA512);
    // The generic advice survives - the digests are added to it, not instead of it.
    expect(error).toContain('checksum mismatch');
  });

  it('redacts a credential carried in the asset name it echoes back', async () => {
    // The metadata lists a different asset, so the bridge throws
    // `assetNotInMetadata`, which echoes the renderer-supplied name verbatim.
    stubUpdateFetch('some-other-asset.dmg');

    const leakyName = 'Wayland-1.9.22-ghp_abcdefghijklmnopqrst.dmg';
    const started = await download({ url: ASSET_URL, fileName: leakyName, tagName: TAG, repo: REPO });
    expect(started.success).toBe(true);

    const error = await awaitErrorEvent();

    expect(error).not.toContain('ghp_abcdefghijklmnopqrst');
    expect(error).toContain('••••••');
  });

  it('keeps both digest placeholders in the shipped en-US string', () => {
    const errors = (updateLocale as unknown as { errors: Record<string, string> }).errors;
    expect(errors.checksumDigests).toContain('{{expected}}');
    expect(errors.checksumDigests).toContain('{{actual}}');
  });
});
