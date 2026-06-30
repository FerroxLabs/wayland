/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #466 Computer-Use macOS permission onboarding (desktop side).
 *
 * Computer-Use needs two macOS grants: Screen Recording (for screenshots) and
 * Accessibility (to move the cursor / synthesize input). This module DETECTS
 * those grants and deep-links the exact System Settings panes - it deliberately
 * uses the NON-prompting query APIs so it never triggers an OS permission
 * dialog. The engine (wayland-core #114) owns the actual prompt
 * (CGRequestScreenCaptureAccess / AXIsProcessTrustedWithOptions), so detect-here
 * + prompt-there never double-fires.
 *
 * Pure logic with injected IO so it is unit-testable without Electron.
 */

export type PermissionState = 'granted' | 'denied' | 'not-determined' | 'unsupported';

export type CuaPermissionStatus = {
  platform: NodeJS.Platform;
  /** True only on macOS - the only OS with these TCC grants. */
  supported: boolean;
  screenRecording: PermissionState;
  accessibility: PermissionState;
  /** True when no action is needed (all required grants present, or unsupported OS). */
  allGranted: boolean;
};

export type PrivacyPane = 'screen' | 'accessibility';

/**
 * IO seam over Electron `systemPreferences` / `shell`. The real adapter wires
 * these to `systemPreferences.getMediaAccessStatus('screen')`,
 * `systemPreferences.isTrustedAccessibilityClient(false)` (false = do NOT
 * prompt), and `shell.openExternal`.
 */
export type CuaPermissionIO = {
  platform: () => NodeJS.Platform;
  getScreenStatus: () => string;
  isAccessibilityTrusted: () => boolean;
  openExternal: (url: string) => Promise<void>;
};

const PANE_URLS: Record<PrivacyPane, string> = {
  screen: 'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture',
  accessibility: 'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility',
};

/** Normalize Electron's `getMediaAccessStatus` result to our state union. */
export function normalizeScreenStatus(raw: string): PermissionState {
  switch (raw) {
    case 'granted':
      return 'granted';
    case 'denied':
    case 'restricted':
      return 'denied';
    case 'not-determined':
      return 'not-determined';
    default:
      // 'unknown' or anything unexpected: treat as not-yet-decided so we guide
      // the user rather than claim a hard denial.
      return 'not-determined';
  }
}

/** Read the current Computer-Use permission grants WITHOUT prompting. */
export function readCuaPermissionStatus(io: CuaPermissionIO): CuaPermissionStatus {
  const platform = io.platform();
  if (platform !== 'darwin') {
    return {
      platform,
      supported: false,
      screenRecording: 'unsupported',
      accessibility: 'unsupported',
      allGranted: true,
    };
  }
  const screenRecording = normalizeScreenStatus(io.getScreenStatus());
  const accessibility: PermissionState = io.isAccessibilityTrusted() ? 'granted' : 'denied';
  return {
    platform,
    supported: true,
    screenRecording,
    accessibility,
    allGranted: screenRecording === 'granted' && accessibility === 'granted',
  };
}

/** Deep-link the exact System Settings privacy pane (no-op off macOS). */
export async function openPrivacyPane(io: CuaPermissionIO, pane: PrivacyPane): Promise<void> {
  if (io.platform() !== 'darwin') return;
  await io.openExternal(PANE_URLS[pane]);
}
