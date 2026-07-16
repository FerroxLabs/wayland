/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { app } from 'electron';
import path from 'node:path';
import { getDevAppName, getDevProfileDir } from '@/common/platform';
import { getPackagedReleaseIdentity, getReleaseTrack } from '@/common/releaseTrack';

// This is the only stateful setup allowed before startup compatibility
// preflight. It selects the correct isolated userData root; it does not create,
// migrate, seed, or modify files. E2E may provide an explicit temporary root so
// packaged and dev fixtures never inspect or mutate a developer profile.
export function resolveE2EUserDataPath(env: NodeJS.ProcessEnv): string | null {
  if (env.WAYLAND_E2E_TEST !== '1') return null;
  const candidate = env.WAYLAND_E2E_USER_DATA_DIR?.trim();
  return candidate && path.isAbsolute(candidate) ? candidate : null;
}

const e2eUserDataPath = resolveE2EUserDataPath(process.env);
if (e2eUserDataPath) {
  app.setPath('userData', e2eUserDataPath);
} else if (!app.isPackaged) {
  const devAppName = getDevAppName();
  app.setName(devAppName);
  const appSupportDir = path.dirname(app.getPath('userData'));
  app.setPath('userData', path.join(appSupportDir, getDevProfileDir()));
} else {
  const identity = getPackagedReleaseIdentity(getReleaseTrack());
  if (identity.appName !== 'Wayland') {
    const appSupportDir = path.dirname(app.getPath('userData'));
    app.setName(identity.appName);
    app.setPath('userData', path.join(appSupportDir, identity.userDataDirectoryName));
  }
}
