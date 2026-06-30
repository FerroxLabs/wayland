/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #466 Electron IO adapter for the Computer-Use permission service.
 *
 * Wires the pure status logic in `cuaPermissions.ts` to Electron's
 * `systemPreferences` / `shell`. Crucially it uses ONLY non-prompting query
 * APIs - `getMediaAccessStatus('screen')` and `isTrustedAccessibilityClient(false)`
 * (false = do not prompt) - so checking status never triggers an OS dialog. The
 * engine (wayland-core #114) owns the actual prompt.
 */

import { shell, systemPreferences } from 'electron';
import type { CuaPermissionIO } from './cuaPermissions';

export const electronCuaPermissionIO: CuaPermissionIO = {
  platform: () => process.platform,
  getScreenStatus: () =>
    process.platform === 'darwin' ? systemPreferences.getMediaAccessStatus('screen') : 'unsupported',
  isAccessibilityTrusted: () =>
    process.platform === 'darwin' ? systemPreferences.isTrustedAccessibilityClient(false) : false,
  openExternal: (url) => shell.openExternal(url),
};
