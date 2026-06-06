/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * First-run smart defaults.
 *
 * Applied exactly once per install (gated by `system.firstRunDefaultsApplied`):
 *   - close-to-tray ON  - only if user hasn't already set a value
 *   - start-on-boot ON  - only if packaged + platform supports it (mac / win / linux)
 *
 * Users who later toggle either OFF keep it OFF forever; the flag prevents
 * the defaults from being re-applied.
 */

import { app } from 'electron';
import { ProcessConfig } from './initStorage';
import { setStartOnBootEnabled } from '@process/bridge/applicationBridge';

export async function applyFirstRunDefaults(): Promise<void> {
  try {
    const applied = await ProcessConfig.get('system.firstRunDefaultsApplied');
    if (applied === true) return;

    // close-to-tray: only set if user has never expressed a preference.
    const existingCloseToTray = await ProcessConfig.get('system.closeToTray');
    if (existingCloseToTray === undefined) {
      await ProcessConfig.set('system.closeToTray', true);
    }

    // start-on-boot: only attempt on packaged builds. setStartOnBootEnabled
    // is a no-op on unsupported platforms / dev mode.
    if (app.isPackaged) {
      try {
        const status = setStartOnBootEnabled(true);
        if (!status.supported) {
          console.log(
            `[firstRunDefaults] Start-on-boot not supported on ${status.platform} (packaged=${status.isPackaged})`
          );
        }
      } catch (err) {
        console.warn('[firstRunDefaults] Failed to enable start-on-boot:', err);
      }
    }

    await ProcessConfig.set('system.firstRunDefaultsApplied', true);
  } catch (err) {
    console.warn('[firstRunDefaults] Failed to apply defaults:', err);
  }
}
