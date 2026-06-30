/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #466 Computer-Use macOS permission onboarding - IPC bridge.
 *
 * Exposes a non-prompting status read and a deep-link opener to the renderer
 * onboarding card. Detection here stays silent; the engine (wayland-core #114)
 * owns the actual OS permission prompt, so the two never double-fire.
 */

import { ipcBridge } from '@/common';
import { electronCuaPermissionIO } from '@process/services/macPermissions/cuaPermissionIO';
import { openPrivacyPane, readCuaPermissionStatus } from '@process/services/macPermissions/cuaPermissions';

export function initCuaPermissionBridge(): void {
  ipcBridge.cua.getStatus.provider(async () => readCuaPermissionStatus(electronCuaPermissionIO));
  ipcBridge.cua.openSettings.provider(async ({ pane }) => {
    await openPrivacyPane(electronCuaPermissionIO, pane);
  });
}
