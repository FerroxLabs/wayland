/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import { COCKPIT_RETURN_REASONS, type CockpitReturnReason } from '@/common/types/cohortRollout';
import type { CohortProductionAPI } from '@process/services/cohort/ProductionCohortController';

export type CohortBridgeSenderAuthority = (event: IpcMainInvokeEvent) => boolean;

export function initCohortBridge(
  runtimeReady: PromiseLike<CohortProductionAPI>,
  isAuthorizedSender: CohortBridgeSenderAuthority
): void {
  ipcMain.handle('cohort:cockpit-rollout-status', async (event) => {
    assertSender(event, isAuthorizedSender);
    return (await runtimeReady).rolloutStatus();
  });

  ipcMain.handle('cohort:shell-returned-to-classic', async (event, value: unknown) => {
    assertSender(event, isAuthorizedSender);
    if (typeof value !== 'string' || !COCKPIT_RETURN_REASONS.includes(value as CockpitReturnReason)) {
      throw new Error('COHORT_RETURN_REASON_INVALID');
    }
    return (await runtimeReady).recordShellReturn(value as CockpitReturnReason);
  });

  ipcMain.handle('cohort:consent-status', async (event) => {
    assertSender(event, isAuthorizedSender);
    return (await runtimeReady).consentStatus();
  });

  ipcMain.handle('cohort:set-consent', async (event, enabled: unknown) => {
    assertSender(event, isAuthorizedSender);
    if (typeof enabled !== 'boolean') throw new Error('COHORT_CONSENT_VALUE_INVALID');
    return (await runtimeReady).setConsent(enabled);
  });
}

function assertSender(event: IpcMainInvokeEvent, isAuthorizedSender: CohortBridgeSenderAuthority): void {
  if (event.senderFrame !== event.sender.mainFrame || !isAuthorizedSender(event)) {
    throw new Error('COHORT_SENDER_UNAUTHORIZED');
  }
}
