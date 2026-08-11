/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { LOCAL_TTS_PROVIDERS, isLocalTtsProvider, resolveLocalTtsProvider } from '@/common/types/ttsTypes';
import { rendererPlatform } from '@/renderer/utils/platform';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * The picker offers exactly one OS-bundled voice: the one this OS has. That
 * decision is `resolveLocalTtsProvider(rendererPlatform())`, so both halves are
 * pinned here - a macOS user must never be shown the Windows voice, a Windows
 * user must be shown one at all (the bug: they were shown macOS `say`, which
 * throws), and Linux must resolve to nothing so the readiness layer can say so
 * by name rather than let a session enter and fail mid-turn.
 */

const originalUserAgent = navigator.userAgent;

const setUserAgent = (value: string) => {
  Object.defineProperty(navigator, 'userAgent', { value, configurable: true });
  // `rendererPlatform` prefers userAgentData/platform when present; jsdom
  // exposes neither by default, so userAgent is the live signal here.
  Object.defineProperty(navigator, 'platform', { value: '', configurable: true });
};

afterEach(() => {
  Object.defineProperty(navigator, 'userAgent', { value: originalUserAgent, configurable: true });
});

describe('resolveLocalTtsProvider', () => {
  it('gives macOS its say-backed voice', () => {
    expect(resolveLocalTtsProvider('darwin')).toBe('system-native');
  });

  it('gives Windows the System.Speech voice instead of nothing', () => {
    expect(resolveLocalTtsProvider('win32')).toBe('windows-native');
  });

  it('gives Linux null, because it genuinely has none in this build', () => {
    expect(resolveLocalTtsProvider('linux')).toBeNull();
    expect(resolveLocalTtsProvider('freebsd')).toBeNull();
  });

  it('never returns a hosted provider as the local floor', () => {
    for (const platform of ['darwin', 'win32', 'linux']) {
      const resolved = resolveLocalTtsProvider(platform);
      if (resolved) expect(isLocalTtsProvider(resolved)).toBe(true);
    }
    expect(LOCAL_TTS_PROVIDERS).not.toContain('openai');
  });
});

describe('rendererPlatform', () => {
  it('reads Windows out of the user agent so the picker can offer the Windows voice', () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36');
    expect(rendererPlatform()).toBe('win32');
    expect(resolveLocalTtsProvider(rendererPlatform())).toBe('windows-native');
  });

  it('reads macOS out of the user agent', () => {
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140 Safari/537.36');
    expect(rendererPlatform()).toBe('darwin');
    expect(resolveLocalTtsProvider(rendererPlatform())).toBe('system-native');
  });

  it('falls through to linux, which is the honest answer and not a Windows guess', () => {
    setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36');
    expect(rendererPlatform()).toBe('linux');
    expect(resolveLocalTtsProvider(rendererPlatform())).toBeNull();
  });
});
