/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * macOS microphone permission (TCC) helpers for voice input (speech-to-text).
 *
 * Unlike the Computer-Use screen/accessibility flow (which deliberately never
 * prompts - the engine owns that dialog), the mic grant is ours to request:
 * `requestAccess` calls `systemPreferences.askForMediaAccess('microphone')`,
 * which shows the OS consent dialog on a fresh install and resolves immediately
 * (no dialog) once the user has decided. Pairs with the
 * `com.apple.security.device.audio-input` entitlement + `NSMicrophoneUsageDescription`
 * so `getUserMedia({ audio: true })` actually captures on a hardened, signed build.
 *
 * Both helpers are no-ops off macOS (report `'unsupported'`) so callers stay
 * platform-agnostic.
 */

import { systemPreferences } from 'electron';

export type MicPermissionStatus =
  | 'granted'
  | 'denied'
  | 'restricted'
  | 'not-determined'
  | 'unknown'
  | 'unsupported';

/** Current microphone TCC status WITHOUT prompting. */
export function getMicrophoneStatus(): MicPermissionStatus {
  if (process.platform !== 'darwin') return 'unsupported';
  return systemPreferences.getMediaAccessStatus('microphone') as MicPermissionStatus;
}

/**
 * Ensure the microphone TCC grant, prompting once when the decision has not yet
 * been made. Returns the resulting status so the renderer can surface a hard
 * denial ("enable in System Settings") instead of a silent flat level meter.
 */
export async function requestMicrophoneAccess(): Promise<MicPermissionStatus> {
  if (process.platform !== 'darwin') return 'unsupported';
  const current = getMicrophoneStatus();
  // Already decided: askForMediaAccess would resolve without a dialog anyway,
  // so short-circuit a granted mic and report a prior denial as-is.
  if (current === 'granted' || current === 'denied' || current === 'restricted') {
    return current;
  }
  try {
    const granted = await systemPreferences.askForMediaAccess('microphone');
    return granted ? 'granted' : getMicrophoneStatus();
  } catch {
    return getMicrophoneStatus();
  }
}
