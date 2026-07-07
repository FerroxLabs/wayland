/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Autopilot Bridge — exposes the Tank hand-off to the renderer.
 * `autopilot.available` gates the UI button; `autopilot.run` sends the current
 * task to Tank; `autopilot.finished` (emitter, in AutopilotService) fires when
 * the run completes so the UI can open the resulting branch for review.
 */

import { ipcBridge } from '@/common';
import { tankEnabled } from '@process/services/autopilot/tankClient';
import { runAutopilot } from '@process/services/autopilot/AutopilotService';
import { prepareTankUi } from '@process/services/autopilot/tankUi';

export function initAutopilotBridge(): void {
  ipcBridge.autopilot.available.provider(async () => ({ available: tankEnabled() }));

  // Embedded Tank dashboard: set the auth cookie, hand back the URL for a webview.
  ipcBridge.autopilot.tankUi.provider(async () => prepareTankUi());

  ipcBridge.autopilot.run.provider(async (params) => {
    if (!tankEnabled()) {
      return { ok: false, error: 'Tank is not configured (set WAYLAND_TANK_TOKEN).' };
    }
    return runAutopilot(params);
  });
}
