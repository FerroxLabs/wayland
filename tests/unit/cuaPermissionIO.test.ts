/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #466 Electron IO adapter - locks the non-prompting contract: detection must
 * call `isTrustedAccessibilityClient(false)` (false = do NOT prompt) so it never
 * double-fires with the engine's own permission prompt (#114).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getMediaAccessStatus, isTrustedAccessibilityClient, openExternal } = vi.hoisted(() => ({
  getMediaAccessStatus: vi.fn(() => 'granted'),
  isTrustedAccessibilityClient: vi.fn(() => true),
  openExternal: vi.fn(() => Promise.resolve()),
}));

vi.mock('electron', () => ({
  systemPreferences: { getMediaAccessStatus, isTrustedAccessibilityClient },
  shell: { openExternal },
}));

import { electronCuaPermissionIO } from '@/process/services/macPermissions/cuaPermissionIO';

beforeEach(() => vi.clearAllMocks());

describe('electronCuaPermissionIO (#466)', () => {
  it('reports the real process platform', () => {
    expect(electronCuaPermissionIO.platform()).toBe(process.platform);
  });

  it('queries accessibility WITHOUT prompting (false), so the engine owns the prompt', () => {
    electronCuaPermissionIO.isAccessibilityTrusted();
    if (process.platform === 'darwin') {
      expect(isTrustedAccessibilityClient).toHaveBeenCalledWith(false);
    } else {
      // Off macOS the adapter short-circuits and never touches the API.
      expect(isTrustedAccessibilityClient).not.toHaveBeenCalled();
    }
  });

  it('reads the screen grant via getMediaAccessStatus("screen") on macOS', () => {
    electronCuaPermissionIO.getScreenStatus();
    if (process.platform === 'darwin') {
      expect(getMediaAccessStatus).toHaveBeenCalledWith('screen');
    } else {
      expect(getMediaAccessStatus).not.toHaveBeenCalled();
    }
  });

  it('delegates deep-links to shell.openExternal', async () => {
    await electronCuaPermissionIO.openExternal('x-apple.systempreferences:foo');
    expect(openExternal).toHaveBeenCalledWith('x-apple.systempreferences:foo');
  });
});
