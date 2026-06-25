/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pop-out chat window bridge (#27 phase 2).
 *
 * Wires the renderer-facing `conversation.popout` / `conversation.dockBack`
 * providers to the pop-out window manager. The `popoutClosed` emitter is fired
 * from the window manager's `closed` handler, not here.
 */

import { ipcBridge } from '@/common';
import { closePopoutWindow, openPopoutWindow } from '@process/utils/popoutWindowManager';

let initialized = false;

export function initPopoutBridge(): void {
  // Idempotent: bridge init may be reached more than once across boot paths.
  if (initialized) return;
  initialized = true;

  ipcBridge.conversation.popout.provider(async ({ conversation_id }) => {
    return openPopoutWindow(conversation_id);
  });

  ipcBridge.conversation.dockBack.provider(async ({ conversation_id }) => {
    return closePopoutWindow(conversation_id);
  });
}
