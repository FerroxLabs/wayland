/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcMain } from 'electron';
import { ipcBridge } from '@/common';
import { connectFlux } from '@process/onboarding/connectFlux';
import { connectPastedKey } from '@process/onboarding/connectPastedKey';
import { fetchFluxMetrics, runOnboardingDetection } from '@process/onboarding/detect';

/**
 * Register the onboarding IPC handlers. Called once from initAllBridges.
 *
 * The two detection handlers use raw `ipcMain.handle` (same as
 * `constitutionBridge` / `webui-direct-*`): both are zero-argument, read-only,
 * and return no sensitive data, so the typed allowlist buys nothing there.
 *
 * `connectFlux` goes through the typed `ipcBridge` adapter - it mints + persists
 * a credential, so it belongs on the allowlisted, strongly-typed surface the
 * renderer invokes via `ipcBridge.onboarding.connectFlux.invoke()`.
 */
export function initOnboardingBridge(): void {
  ipcMain.handle('onboarding:detect', () => runOnboardingDetection());
  ipcMain.handle('onboarding:fluxMetrics', () => fetchFluxMetrics());
  ipcBridge.onboarding.connectFlux.provider(() => connectFlux());
  ipcBridge.onboarding.connectPastedKey.provider((p) => connectPastedKey(p.key));
  // Lazy: the focus inferer (and its model-bridge dependency) must stay out of
  // the boot module graph - it only runs when the user finishes onboarding.
  ipcBridge.onboarding.inferFocus.provider(async (p) => {
    const { inferFocusFromText } = await import('@process/onboarding/inferFocus');
    return inferFocusFromText(p.work);
  });
}
