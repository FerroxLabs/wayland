/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #525 — a headless/remote host can't complete the browser PKCE ChatGPT sign-in,
 * so isHeadlessEnvironment gates it and the flow returns SSH-forward guidance
 * instead of a doomed 3-minute browser wait.
 */

import { describe, it, expect } from 'vitest';
import { isHeadlessEnvironment } from '../../src/process/onboarding/chatgptOAuthCore';

describe('isHeadlessEnvironment (#525)', () => {
  it('is never headless on macOS or Windows (always a window server)', () => {
    expect(isHeadlessEnvironment('darwin', {})).toBe(false);
    expect(isHeadlessEnvironment('win32', {})).toBe(false);
    // even a Linux-style empty env doesn't make macOS/Windows headless
    expect(isHeadlessEnvironment('darwin', { DISPLAY: '', WAYLAND_DISPLAY: '' })).toBe(false);
  });

  it('is headless on Linux with no DISPLAY and no WAYLAND_DISPLAY', () => {
    expect(isHeadlessEnvironment('linux', {})).toBe(true);
    expect(isHeadlessEnvironment('linux', { DISPLAY: '', WAYLAND_DISPLAY: '' })).toBe(true);
    expect(isHeadlessEnvironment('linux', { SOMETHING_ELSE: '1' })).toBe(true);
  });

  it('is not headless on Linux with an X11 or Wayland display', () => {
    expect(isHeadlessEnvironment('linux', { DISPLAY: ':0' })).toBe(false);
    expect(isHeadlessEnvironment('linux', { WAYLAND_DISPLAY: 'wayland-0' })).toBe(false);
  });
});
