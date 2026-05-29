/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcMain } from 'electron';
import { fetchFluxMetrics, runOnboardingDetection } from '@process/onboarding/detect';

/**
 * Register the onboarding IPC handlers. Called once from initAllBridges.
 */
export function initOnboardingBridge(): void {
  ipcMain.handle('onboarding:detect', () => runOnboardingDetection());
  ipcMain.handle('onboarding:fluxMetrics', () => fetchFluxMetrics());
}
