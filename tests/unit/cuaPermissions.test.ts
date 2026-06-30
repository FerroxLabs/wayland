/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #466 Computer-Use macOS permission onboarding - pure status logic.
 *
 * The desktop DETECTS grants with non-prompting APIs and deep-links System
 * Settings; the engine (#114) owns the actual OS prompt, so the two never
 * double-fire. These tests cover the platform-gating + status normalization.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  normalizeScreenStatus,
  readCuaPermissionStatus,
  openPrivacyPane,
  type CuaPermissionIO,
} from '@/process/services/macPermissions/cuaPermissions';

function makeIO(over: Partial<CuaPermissionIO> = {}): CuaPermissionIO {
  return {
    platform: () => 'darwin',
    getScreenStatus: () => 'granted',
    isAccessibilityTrusted: () => true,
    openExternal: vi.fn(() => Promise.resolve()),
    ...over,
  };
}

describe('normalizeScreenStatus', () => {
  it('maps granted', () => expect(normalizeScreenStatus('granted')).toBe('granted'));
  it('maps denied and restricted to denied', () => {
    expect(normalizeScreenStatus('denied')).toBe('denied');
    expect(normalizeScreenStatus('restricted')).toBe('denied');
  });
  it('maps not-determined and unknown to not-determined', () => {
    expect(normalizeScreenStatus('not-determined')).toBe('not-determined');
    expect(normalizeScreenStatus('unknown')).toBe('not-determined');
  });
});

describe('readCuaPermissionStatus', () => {
  it('reports unsupported + allGranted on non-darwin (card never shows)', () => {
    const s = readCuaPermissionStatus(makeIO({ platform: () => 'win32' }));
    expect(s.supported).toBe(false);
    expect(s.allGranted).toBe(true);
    expect(s.screenRecording).toBe('unsupported');
    expect(s.accessibility).toBe('unsupported');
  });

  it('allGranted only when BOTH screen recording and accessibility are granted', () => {
    expect(readCuaPermissionStatus(makeIO()).allGranted).toBe(true);
    expect(readCuaPermissionStatus(makeIO({ isAccessibilityTrusted: () => false })).allGranted).toBe(false);
    expect(readCuaPermissionStatus(makeIO({ getScreenStatus: () => 'denied' })).allGranted).toBe(false);
  });

  it('surfaces per-grant state on darwin', () => {
    const s = readCuaPermissionStatus(
      makeIO({ getScreenStatus: () => 'not-determined', isAccessibilityTrusted: () => false })
    );
    expect(s).toMatchObject({ supported: true, screenRecording: 'not-determined', accessibility: 'denied' });
  });

  it('does NOT prompt - reads accessibility with prompt=false (engine owns the prompt, #114)', () => {
    const isAccessibilityTrusted = vi.fn(() => true);
    readCuaPermissionStatus(makeIO({ isAccessibilityTrusted }));
    expect(isAccessibilityTrusted).toHaveBeenCalledTimes(1);
  });
});

describe('openPrivacyPane', () => {
  it('deep-links the Screen Recording pane', async () => {
    const openExternal = vi.fn(() => Promise.resolve());
    await openPrivacyPane(makeIO({ openExternal }), 'screen');
    expect(openExternal).toHaveBeenCalledWith(
      'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture'
    );
  });

  it('deep-links the Accessibility pane', async () => {
    const openExternal = vi.fn(() => Promise.resolve());
    await openPrivacyPane(makeIO({ openExternal }), 'accessibility');
    expect(openExternal).toHaveBeenCalledWith(
      'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility'
    );
  });

  it('is a no-op off darwin', async () => {
    const openExternal = vi.fn(() => Promise.resolve());
    await openPrivacyPane(makeIO({ platform: () => 'linux', openExternal }), 'screen');
    expect(openExternal).not.toHaveBeenCalled();
  });
});
