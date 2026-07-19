/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';

import { CohortEvidenceRuntime } from '@process/services/cohort/CohortEvidenceRuntime';
import type { CohortBaselineService } from '@process/services/cohort/CohortBaselineService';

function runtime(record = vi.fn(async () => ({ status: 'recorded' as const }))) {
  let id = 0;
  const service = { record } as unknown as CohortBaselineService;
  return {
    record,
    subject: new CohortEvidenceRuntime({
      service,
      rollout: {
        status: async () => ({
          eligible: true,
          stage: 'invited-alpha',
          source: 'signed-authority',
          reason: 'authorized',
        }),
      },
      installIdentity: 'install-identity-never-exported',
      cohort: 'knowledge-work',
      now: () => 1234,
      createId: () => `opaqueid${String(++id).padStart(8, '0')}`,
    }),
  };
}

describe('CohortEvidenceRuntime', () => {
  it('owns identifiers and records only a closed reason before ending the Cockpit session', async () => {
    const { subject, record } = runtime();
    await expect(subject.recordShellReturn('confusing-navigation')).resolves.toEqual({ status: 'recorded' });

    expect(record).toHaveBeenCalledTimes(3);
    const [started, returned, ended] = record.mock.calls.map(([event]) => event);
    expect(started).toMatchObject({ kind: 'session_started', shell: 'cockpit' });
    expect(returned).toMatchObject({
      kind: 'shell_returned_to_classic',
      reason: 'confusing-navigation',
      sessionId: started.sessionId,
      participantIdHash: started.participantIdHash,
    });
    expect(ended).toMatchObject({ kind: 'session_ended', sessionId: started.sessionId });
    expect(JSON.stringify(record.mock.calls)).not.toContain('install-identity-never-exported');
  });

  it.each([
    ['disabled', 'consent-disabled'],
    ['outside_observation_window', 'outside-window'],
    ['storage_error', 'storage-error'],
    ['rejected', 'session-unavailable'],
  ] as const)('fails closed when session start is %s', async (serviceStatus, expected) => {
    const record = vi.fn(async () =>
      serviceStatus === 'rejected'
        ? ({ status: 'rejected', code: 'invalid_field' as const } as const)
        : ({ status: serviceStatus } as const)
    );
    const { subject } = runtime(record);

    await expect(subject.recordShellReturn('reliability')).resolves.toEqual({ status: expected });
    expect(record).toHaveBeenCalledTimes(1);
  });

  it('returns process authority status without deriving eligibility from renderer input', async () => {
    const { subject } = runtime();
    await expect(subject.rolloutStatus()).resolves.toMatchObject({
      eligible: true,
      source: 'signed-authority',
      stage: 'invited-alpha',
    });
  });
});
