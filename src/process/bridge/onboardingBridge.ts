/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcMain } from 'electron';
import { fetchFluxMetrics, runOnboardingDetection } from '@process/onboarding/detect';

/**
 * Register the onboarding IPC handlers. Called once from initAllBridges.
 *
 * These intentionally use raw `ipcMain.handle` rather than the typed `ipcBridge`
 * adapter (same as `constitutionBridge` / `webui-direct-*`): both handlers are
 * zero-argument, read-only, and return no sensitive data, so the typed
 * allowlist buys nothing material here.
 */
export function initOnboardingBridge(): void {
  ipcMain.handle('onboarding:detect', () => runOnboardingDetection());
  ipcMain.handle('onboarding:fluxMetrics', () => fetchFluxMetrics());
}
