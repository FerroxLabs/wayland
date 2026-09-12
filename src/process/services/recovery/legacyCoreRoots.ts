/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

/**
 * On-disk roots of the retired Wayland Core engine's config state. The engine
 * is gone from Desktop, but the recovery/transfer inventory still classifies
 * these trees as the `core.default-profile` / `core.named-profiles` state
 * authorities so a machine that ran an older Desktop is inventoried honestly.
 */

function platformConfigBase(): string {
  const home = homedir();
  switch (process.platform) {
    case 'darwin':
      return join(home, 'Library', 'Application Support');
    case 'win32':
      return process.env.APPDATA ?? join(home, 'AppData', 'Roaming');
    default: {
      const xdgConfig = process.env.XDG_CONFIG_HOME;
      return xdgConfig && xdgConfig.length > 0 ? xdgConfig : join(home, '.config');
    }
  }
}

export function legacyCoreNamedProfilesRoot(): string {
  const override = process.env.WAYLAND_PROFILES_ROOT;
  const hasControlCharacter =
    override?.split('').some((character) => {
      const code = character.charCodeAt(0);
      return code <= 0x1f || code === 0x7f;
    }) ?? false;
  if (override && resolve(override) === override && !hasControlCharacter) return override;
  return join(platformConfigBase(), 'wayland-core-profiles');
}

export function legacyCoreDefaultProfileRoot(): string {
  const waylandHome = process.env.WAYLAND_HOME;
  if (waylandHome && waylandHome.length > 0) {
    return waylandHome;
  }
  const xdgDataHome = process.env.XDG_DATA_HOME;
  if (xdgDataHome && xdgDataHome.length > 0) {
    return join(xdgDataHome, 'wayland-core');
  }
  return join(platformConfigBase(), 'wayland-core');
}
