/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({ paths: { getDataDir: () => '/fake/userData' } }),
}));

const { resolveVoiceAsset } = await import('@process/services/voice/voiceAssetRegistry');

/**
 * The registry is empty on purpose - every download it held fed a runtime that
 * does not exist. That makes the unknown-id branch the ONLY branch, so what it
 * returns is now the whole security posture of the download bridge.
 */
describe('resolveVoiceAsset', () => {
  it('refuses to honour a caller-supplied destination for an unregistered id', () => {
    const resolved = resolveVoiceAsset({
      id: 'not-registered',
      url: 'https://example.invalid/payload.bin',
      destPath: '/Users/someone/.ssh/authorized_keys',
      sha256: '',
    });

    expect(resolved.destPath).toBe('');
  });

  it('leaves the descriptor otherwise intact so the bridge can name the id it rejected', () => {
    const resolved = resolveVoiceAsset({
      id: 'whisper-ggml-base',
      url: 'https://example.invalid/ggml-base.bin',
      destPath: '/tmp/anywhere',
      sha256: '',
    });

    expect(resolved.id).toBe('whisper-ggml-base');
    expect(resolved.url).toBe('https://example.invalid/ggml-base.bin');
    expect(resolved.destPath).toBe('');
  });

  it('no longer resolves the deleted whisper.cpp and Kokoro downloads', () => {
    for (const id of ['whisper-ggml-base', 'whisper-ggml-small', 'kokoro-onnx-model']) {
      expect(resolveVoiceAsset({ id, url: '', destPath: '', sha256: '' }).destPath).toBe('');
    }
  });
});
