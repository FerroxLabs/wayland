/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  type CockpitReturnReason,
  type CockpitReturnRecordResult,
  type CockpitRolloutStatus,
} from '@/common/types/cohortRollout';
import type { CohortBaselineService, M0BRecordResult } from './CohortBaselineService';
import { CohortJourneyObserver } from './instrumentation/CohortJourneyObserver';
import type { M0BCohort } from './types';

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
  private readonly observer: CohortJourneyObserver;
  private shellReturnRecorded = false;

  constructor(private readonly input: CohortEvidenceRuntimeInput) {
    this.observer = new CohortJourneyObserver({
      service: input.service,
      installIdentity: input.installIdentity,
      cohort: input.cohort,
      shell: 'cockpit',
      now: input.now,
      createId: input.createId,
    });
  }

  rolloutStatus(): Promise<CockpitRolloutStatus> {
    return this.input.rollout.status();
  }

  async recordShellReturn(reason: CockpitReturnReason): Promise<CockpitReturnRecordResult> {
    const started = await this.observer.startSession();
    if (started.status !== 'recorded') return mapRecordResult(started);

    if (!this.shellReturnRecorded) {
      const recorded = await this.observer.recordShellReturn(reason);
      if (recorded.status !== 'recorded') return mapRecordResult(recorded);
      this.shellReturnRecorded = true;
    }

    // The observed Cockpit session ends when the user returns to Classic.
    return mapRecordResult(await this.observer.endSession());
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
