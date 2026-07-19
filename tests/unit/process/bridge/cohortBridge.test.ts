/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const handle = vi.hoisted(() => vi.fn());
vi.mock('electron', () => ({ ipcMain: { handle } }));

import { initCohortBridge } from '@process/bridge/cohortBridge';
import type { CohortProductionAPI } from '@process/services/cohort/ProductionCohortController';

describe('cohortBridge', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registers closed main-frame handlers and rejects arbitrary reason content', async () => {
    const runtime = {
      rolloutStatus: vi.fn(async () => ({ eligible: false, stage: null, source: 'none', reason: 'authority-missing' })),
      recordShellReturn: vi.fn(async () => ({ status: 'recorded' })),
      assignmentStatus: vi.fn(async () => ({
        available: true,
        effectiveCohort: 'developer',
        classifiedAtMs: 1234,
        observationState: 'ready',
      })),
      requestAssignment: vi.fn(async (cohort: string) => ({
        status: 'classified',
        assignment: { available: true, effectiveCohort: cohort, classifiedAtMs: 1234, observationState: 'ready' },
      })),
      consentStatus: vi.fn(async () => ({ enabled: false, acceptedAtMs: null, observationWindow: null })),
      setConsent: vi.fn(async (enabled: boolean) => ({
        status: enabled ? 'enabled' : 'disabled',
        consent: {
          enabled,
          acceptedAtMs: enabled ? 1234 : null,
          observationWindow: enabled ? { startMs: 1234, endMs: 5678 } : null,
        },
      })),
    } as unknown as CohortProductionAPI;
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
    await expect(handlers.get('cohort:consent-status')(event)).resolves.toMatchObject({ enabled: false });
    await expect(handlers.get('cohort:assignment-status')(event)).resolves.toMatchObject({
      effectiveCohort: 'developer',
    });
    await expect(handlers.get('cohort:request-assignment')(event, 'operator')).resolves.toMatchObject({
      assignment: { effectiveCohort: 'operator' },
    });
    await expect(handlers.get('cohort:request-assignment')(event, 'forged')).rejects.toThrow(
      'COHORT_ASSIGNMENT_REQUEST_INVALID'
    );
    await expect(handlers.get('cohort:request-assignment')(event, { cohort: 'developer' })).rejects.toThrow(
      'COHORT_ASSIGNMENT_REQUEST_INVALID'
    );
    expect(runtime.requestAssignment).toHaveBeenCalledWith('operator');
    await expect(handlers.get('cohort:set-consent')(event, true)).resolves.toMatchObject({ status: 'enabled' });
    await expect(handlers.get('cohort:set-consent')(event, 'true')).rejects.toThrow('COHORT_CONSENT_VALUE_INVALID');
    expect(runtime.setConsent).toHaveBeenCalledWith(true);

    await expect(
      handlers.get('cohort:cockpit-rollout-status')({ sender: { mainFrame }, senderFrame: sender })
    ).rejects.toThrow('COHORT_SENDER_UNAUTHORIZED');
  });
});
