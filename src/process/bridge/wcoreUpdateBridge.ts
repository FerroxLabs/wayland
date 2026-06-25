/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * IPC bridge for the in-app Wayland Core engine updater. Wires the typed
 * `ipcBridge.wcoreUpdate` surface to the main-process {@link checkForWCoreUpdate}
 * / {@link installWCoreUpdate} helpers and streams install progress back to the
 * renderer.
 *
 * SECURITY: `wcoreUpdate.check` + `wcoreUpdate.install` are HUMAN-only and
 * remote-denied (`bridgeAllowlist`). Install downloads and stages a native
 * binary; the SHA-256 verification against the signed release is the trust
 * anchor, enforced in `wcoreUpdater`.
 */

import { checkForWCoreUpdate, installWCoreUpdate } from '@process/agent/wcore/wcoreUpdater';
import { ipcBridge } from '@/common';

/** Initialise the Wayland Core update IPC handlers. */
export function initWcoreUpdateBridge(): void {
  ipcBridge.wcoreUpdate.check.provider(async () => {
    return checkForWCoreUpdate();
  });

  ipcBridge.wcoreUpdate.install.provider(async ({ tag }) => {
    return installWCoreUpdate(tag, (progress) => {
      ipcBridge.wcoreUpdate.progress.emit(progress);
    });
  });
}
