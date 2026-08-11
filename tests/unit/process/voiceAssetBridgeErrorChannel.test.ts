/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * The voice-asset download channel had the hole its two siblings already fixed.
 *
 * Proven by executing the real transport: `buildProvider(...).provider(fn)`
 * chains `fn(data).then(emit)` with NO `.catch`, and `invoke` is a
 * `new Promise(resolve)` with no reject and no timeout. A provider that rejects
 * therefore never settles its invoke - measured against a known-positive
 * control (a resolving provider settles normally, a rejecting one timed out).
 *
 * For this channel that meant a 404, an offline host or a hash mismatch pinned
 * the Settings download bar at "downloading" forever: no error, no retry, no
 * way back but a window reload. Acquisition of any local voice component runs
 * through here, so nothing can be installed reliably until it reports failure
 * as data.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@process/utils/mainLogger', () => ({
  mainLog: vi.fn(),
  mainWarn: vi.fn(),
  mainError: vi.fn(),
}));

const download = vi.fn();
vi.mock('@process/services/voice/VoiceAssetManager', () => ({
  VoiceAssetManager: {
    download: (...args: unknown[]) => download(...args),
    cancel: vi.fn(() => false),
  },
}));

const resolveVoiceAsset = vi.fn();
vi.mock('@process/services/voice/voiceAssetRegistry', () => ({
  resolveVoiceAsset: (asset: unknown) => resolveVoiceAsset(asset),
}));

vi.mock('@process/extensions/constants', () => ({ getVoiceModelsDir: () => '/models' }));
vi.mock('@process/extensions/protocol/assetProtocol', () => ({ toAssetUrl: (p: string) => `wayland-asset://${p}` }));

const providers = new Map<string, (payload: unknown) => Promise<unknown>>();
vi.mock('@/common', () => ({
  ipcBridge: {
    voiceAsset: {
      download: { provider: (fn: never) => providers.set('download', fn) },
      cancel: { provider: (fn: never) => providers.set('cancel', fn) },
      exists: { provider: (fn: never) => providers.set('exists', fn) },
      localModelBase: { provider: (fn: never) => providers.set('localModelBase', fn) },
      downloadProgress: { emit: vi.fn() },
    },
  },
}));

import { initVoiceAssetBridge } from '@process/bridge/voiceAssetBridge';

const ASSET = { id: 'whisper-ggml-base', url: 'https://example.test/m.bin', destPath: '/d/m.bin', sha256: '' };

const invokeDownload = (asset: unknown = ASSET) =>
  providers.get('download')!(asset) as Promise<{ ok: boolean; errorCode?: string; detail?: string; result?: unknown }>;

describe('voiceAsset.download reports failure as data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    providers.clear();
    resolveVoiceAsset.mockImplementation((a) => a);
    initVoiceAssetBridge();
  });

  it('KNOWN POSITIVE: a successful download still resolves with its result', async () => {
    download.mockResolvedValue({ assetId: ASSET.id, destPath: '/d/m.bin', cached: false, bytesWritten: 10, sha256: 'a' });
    const outcome = await invokeDownload();
    expect(outcome.ok).toBe(true);
    expect(outcome.result).toMatchObject({ assetId: 'whisper-ggml-base', bytesWritten: 10 });
  });

  it('a fetch failure settles as a coded failure instead of hanging', async () => {
    download.mockRejectedValue(new Error('VOICE_ASSET_FETCH_FAILED: 404 Not Found'));
    const outcome = await invokeDownload();
    expect(outcome.ok).toBe(false);
    expect(outcome.errorCode).toBe('VOICE_ASSET_FETCH_FAILED');
    expect(outcome.detail).toContain('404');
  });

  it('an offline host is named, not swallowed', async () => {
    download.mockRejectedValue(new Error('VOICE_ASSET_OFFLINE: getaddrinfo ENOTFOUND'));
    const outcome = await invokeDownload();
    expect(outcome).toMatchObject({ ok: false, errorCode: 'VOICE_ASSET_OFFLINE' });
  });

  it('an unrecognised throw is narrowed, never leaked verbatim as a code', async () => {
    download.mockRejectedValue(new Error('/Users/someone/secret/path exploded'));
    const outcome = await invokeDownload();
    expect(outcome).toMatchObject({ ok: false, errorCode: 'VOICE_ASSET_FAILED' });
  });

  it('a component with no registered download says so instead of attempting one', async () => {
    resolveVoiceAsset.mockReturnValue({ id: 'kokoro-runtime', url: '', destPath: '', sha256: '' });
    const outcome = await invokeDownload({ id: 'kokoro-runtime', url: '', destPath: '', sha256: '' });
    expect(outcome).toMatchObject({ ok: false, errorCode: 'VOICE_ASSET_UNAVAILABLE' });
    expect(download).not.toHaveBeenCalled();
  });

  it('never rejects, for any failure the manager can produce', async () => {
    for (const thrown of [
      new Error('VOICE_ASSET_HASH_MISMATCH: expected a, got b'),
      new Error('VOICE_ASSET_CANCELLED: download cancelled'),
      'a bare string',
    ]) {
      download.mockRejectedValue(thrown);
      await expect(invokeDownload()).resolves.toMatchObject({ ok: false });
    }
  });
});
