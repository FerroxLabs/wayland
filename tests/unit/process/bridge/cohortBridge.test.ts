/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const handle = vi.hoisted(() => vi.fn());
vi.mock('electron', () => ({ ipcMain: { handle } }));

import { initCohortBridge } from '@process/bridge/cohortBridge';
import type { CohortEvidenceRuntime } from '@process/services/cohort/CohortEvidenceRuntime';

describe('cohortBridge', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers closed main-frame handlers and rejects arbitrary reason content', async () => {
    const runtime = {
      rolloutStatus: vi.fn(async () => ({ eligible: false, stage: null, source: 'none', reason: 'authority-missing' })),
      recordShellReturn: vi.fn(async () => ({ status: 'recorded' })),
    } as unknown as CohortEvidenceRuntime;
    initCohortBridge(Promise.resolve(runtime), () => true);

    const handlers = new Map(handle.mock.calls.map(([channel, handler]) => [channel, handler]));
    const sender = {};
    const mainFrame = {};
    const event = { sender: { mainFrame }, senderFrame: mainFrame };
    await expect(handlers.get('cohort:cockpit-rollout-status')(event)).resolves.toMatchObject({ eligible: false });
    await expect(handlers.get('cohort:shell-returned-to-classic')(event, 'private freeform text')).rejects.toThrow(
      'COHORT_RETURN_REASON_INVALID'
    );
    await expect(handlers.get('cohort:shell-returned-to-classic')(event, 'reliability')).resolves.toEqual({
      status: 'recorded',
    });
    expect(runtime.recordShellReturn).toHaveBeenCalledWith('reliability');

    await expect(
      handlers.get('cohort:cockpit-rollout-status')({ sender: { mainFrame }, senderFrame: sender })
    ).rejects.toThrow('COHORT_SENDER_UNAUTHORIZED');
  });
});
