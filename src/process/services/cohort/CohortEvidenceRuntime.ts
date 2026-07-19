/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, randomUUID } from 'node:crypto';

import {
  type CockpitReturnReason,
  type CockpitReturnRecordResult,
  type CockpitRolloutStatus,
} from '@/common/types/cohortRollout';
import type { CohortBaselineService, M0BRecordResult } from './CohortBaselineService';
import { M0B_SCHEMA_VERSION, type M0BCohort } from './types';

export interface CockpitRolloutStatusProvider {
  status(): Promise<CockpitRolloutStatus>;
}

export type CohortEvidenceRuntimeInput = Readonly<{
  service: CohortBaselineService;
  rollout: CockpitRolloutStatusProvider;
  installIdentity: string;
  cohort: M0BCohort;
  now?: () => number;
  createId?: () => string;
}>;

/**
 * Process-owned, content-free observation session. Renderer callers can submit
 * a closed reason category, but cannot choose event/session/participant IDs or
 * manufacture rollout eligibility.
 */
export class CohortEvidenceRuntime {
  private readonly participantIdHash: string;
  private readonly sessionId: string;
  private readonly now: () => number;
  private readonly createId: () => string;
  private sessionStarted = false;

  constructor(private readonly input: CohortEvidenceRuntimeInput) {
    this.now = input.now ?? Date.now;
    this.createId = input.createId ?? (() => randomUUID().replaceAll('-', ''));
    this.sessionId = this.createId();
    this.participantIdHash = createHash('sha256')
      .update(`wayland-m0b-participant/1\0${input.installIdentity}`)
      .digest('hex');
  }

  rolloutStatus(): Promise<CockpitRolloutStatus> {
    return this.input.rollout.status();
  }

  async recordShellReturn(reason: CockpitReturnReason): Promise<CockpitReturnRecordResult> {
    const started = await this.ensureSessionStarted();
    if (started.status !== 'recorded') return mapRecordResult(started);

    const recorded = await this.input.service.record({
      ...this.baseEvent('shell_returned_to_classic'),
      reason,
    });
    if (recorded.status !== 'recorded') return mapRecordResult(recorded);

    // The observed Cockpit session ends when the user returns to Classic.
    await this.input.service.record(this.baseEvent('session_ended'));
    return { status: 'recorded' };
  }

  private async ensureSessionStarted(): Promise<M0BRecordResult> {
    if (this.sessionStarted) return { status: 'recorded' };
    const result = await this.input.service.record(this.baseEvent('session_started'));
    if (result.status === 'recorded') this.sessionStarted = true;
    return result;
  }

  private baseEvent(kind: 'session_started' | 'session_ended' | 'shell_returned_to_classic') {
    return {
      schemaVersion: M0B_SCHEMA_VERSION,
      eventId: this.createId(),
      participantIdHash: this.participantIdHash,
      sessionId: this.sessionId,
      occurredAtMs: this.now(),
      cohort: this.input.cohort,
      shell: 'cockpit' as const,
      kind,
    };
  }
}

function mapRecordResult(result: M0BRecordResult): CockpitReturnRecordResult {
  switch (result.status) {
    case 'recorded':
      return { status: 'recorded' };
    case 'disabled':
      return { status: 'consent-disabled' };
    case 'outside_observation_window':
      return { status: 'outside-window' };
    case 'storage_error':
      return { status: 'storage-error' };
    case 'rejected':
      return { status: 'session-unavailable' };
  }
}
