/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { CockpitRolloutStatus } from '@/common/types/cohortRollout';

export type CockpitPreviewSenderAuthority = (event: IpcMainInvokeEvent) => boolean;

/**
 * The Adaptive Cockpit is an open opt-in preview. The former cohort/M0B rollout
 * gate (signed-authority + 14-day observation) is retired, so eligibility is
 * unconditional. The renderer reads only `.eligible` (see useShellExperience),
 * so this tiny standalone handler replaces the entire cohort controller for the
 * one channel that still feeds a live feature. The channel name is preserved so
 * the preload bridge and renderer are untouched.
 */
const COCKPIT_PREVIEW_STATUS: CockpitRolloutStatus = {
  eligible: true,
  stage: 'opt-in-beta',
  source: 'product-default',
  reason: 'preview-open',
};

export function initCockpitPreviewBridge(isAuthorizedSender: CockpitPreviewSenderAuthority): void {
  ipcMain.handle('cohort:cockpit-rollout-status', (event) => {
    if (event.senderFrame !== event.sender.mainFrame || !isAuthorizedSender(event)) {
      throw new Error('COCKPIT_ROLLOUT_SENDER_UNAUTHORIZED');
    }
    return COCKPIT_PREVIEW_STATUS;
  });
}
