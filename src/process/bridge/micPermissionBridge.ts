/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Microphone permission IPC bridge (voice input / speech-to-text).
 *
 * `requestAccess` triggers the macOS mic TCC prompt on demand (when the user
 * starts the mic test or dictation); `getStatus` reads the current grant
 * without prompting. Quiet on non-macOS (both report `'unsupported'`).
 */

import { ipcBridge } from '@/common';
import { getMicrophoneStatus, requestMicrophoneAccess } from '@process/services/macPermissions/micPermission';

export function initMicPermissionBridge(): void {
  ipcBridge.mic.getStatus.provider(async () => getMicrophoneStatus());
  ipcBridge.mic.requestAccess.provider(async () => requestMicrophoneAccess());
}
