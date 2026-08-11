/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';
import { isWindows, rendererPlatform } from '@/renderer/utils/platform';
import { resolveVoiceLeg } from '@/common/voice/voiceReadiness';

/**
 * WHAT THIS FILE PROVES: that the renderer can tell Windows from Linux, and
 * that the value it produces is the vocabulary the voice resolver reads.
 *
 * `useVoiceConversationSession` used to pass `isMacOS() ? 'darwin' : 'other'`,
 * which collapses two different operating systems onto one string. That is fine
 * while the only question is "is there a `say` binary" and wrong the moment
 * anything differs between Windows and Linux - which is exactly what
 * `packet/wl-voice-wintts` is about to make true.
 *
 * WHAT IT CANNOT PROVE: what a real Chromium on a real Windows box reports.
 * jsdom lets the user agent be set, so this pins the mapping, not the source.
 */

const setUserAgent = (value: string) => {
  Object.defineProperty(globalThis.navigator, 'userAgent', { configurable: true, value });
  Object.defineProperty(globalThis.navigator, 'platform', { configurable: true, value: '' });
  Object.defineProperty(globalThis.navigator, 'userAgentData', { configurable: true, value: undefined });
};

const AGENTS: Array<[string, 'darwin' | 'win32' | 'linux']> = [
  ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131 Safari/537.36', 'darwin'],
  ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36', 'win32'],
  ['Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36', 'linux'],
];

afterEach(() => {
  setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131 Safari/537.36');
});

describe('the renderer reports a real platform, not a macOS boolean', () => {
  it('distinguishes all three shipped platforms', () => {
    // Control: the expectations are not all the same value.
    expect(new Set(AGENTS.map(([, expected]) => expected)).size).toBe(3);

    for (const [userAgent, expected] of AGENTS) {
      setUserAgent(userAgent);
      expect(rendererPlatform()).toBe(expected);
    }
  });

  /**
   * The strings have to be the ones the resolver reads, or the plumbing is
   * correct and the answer is still wrong. `darwin` is the only value that
   * yields a speaking leg today, so the mapping is checked THROUGH the resolver
   * rather than against a hardcoded list.
   */
  it('produces strings the voice resolver actually understands', () => {
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131 Safari/537.36');
    expect(resolveVoiceLeg('out', { platform: rendererPlatform() }).status).toBe('ready');

    for (const ua of AGENTS.filter(([, expected]) => expected !== 'darwin').map(([ua]) => ua)) {
      setUserAgent(ua);
      const leg = resolveVoiceLeg('out', { platform: rendererPlatform() });
      expect(leg.status).toBe('unsupported');
      expect(leg.cause).toBe('no-local-adapter');
    }
  });

  /**
   * `win` is a substring of `darwin`.
   *
   * `isWindows` tested `/win/i` against the user agent, so any Darwin-spelled
   * agent - jsdom's included - reported Windows. `rendererPlatform` asks about
   * macOS first, so the fault never showed through it; the predicate is still
   * wrong and is exported on its own. Found and fixed by
   * `packet/wl-voice-wintts`, kept here because this file is where the platform
   * mapping is pinned.
   */
  it('does not read the "win" inside "darwin" as Windows', () => {
    setUserAgent('Mozilla/5.0 (darwin) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/26.0.0');
    expect(isWindows()).toBe(false);
    expect(rendererPlatform()).not.toBe('win32');
  });
});
