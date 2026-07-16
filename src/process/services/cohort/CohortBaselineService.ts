/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { aggregateM0BBaseline } from './CohortBaselineAggregator';
import { validateM0BCohortEvent } from './privacy';
import type { M0BBaselineConfig, M0BBaselineReport, M0BCohortEvent, M0BValidationErrorCode } from './types';

export interface M0BCohortEventRepository {
  append(event: M0BCohortEvent): Promise<void>;
  findWindow(startMs: number, endMs: number): Promise<M0BCohortEvent[]>;
}

export type M0BRecordingConsent = {
  enabled: boolean;
  acceptedAtMs: number | null;
};

export type M0BRecordResult =
  | { status: 'recorded' }
  | { status: 'disabled' }
  | { status: 'outside_observation_window' }
  | { status: 'rejected'; code: M0BValidationErrorCode; field?: string }
  | { status: 'storage_error' };

/**
 * Consent-gated process boundary for M0B. Raw content cannot pass the closed
 * parser, and the only public export surface is an aggregate report without
 * participant, session, event, or journey-run identifiers.
 */
export class CohortBaselineService {
  constructor(
    private readonly repository: M0BCohortEventRepository,
    private readonly config: M0BBaselineConfig,
    private readonly consent: M0BRecordingConsent
  ) {}

  async record(input: unknown): Promise<M0BRecordResult> {
    if (!this.consent.enabled || this.consent.acceptedAtMs === null) {
      return { status: 'disabled' };
    }

    const validation = validateM0BCohortEvent(input);
    if (validation.ok === false) {
      return {
        status: 'rejected',
        code: validation.code,
        field: validation.field,
      };
    }
    if (
      validation.event.occurredAtMs < this.config.windowStartMs ||
      validation.event.occurredAtMs >= this.config.windowEndMs
    ) {
      return { status: 'outside_observation_window' };
    }

    try {
      await this.repository.append(validation.event);
      return { status: 'recorded' };
    } catch {
      return { status: 'storage_error' };
    }
  }

  async aggregate(asOfMs = Date.now()): Promise<M0BBaselineReport> {
    const events = await this.repository.findWindow(this.config.windowStartMs, this.config.windowEndMs);
    return aggregateM0BBaseline(events, this.config, asOfMs);
  }

  async exportAggregate(asOfMs = Date.now()): Promise<string> {
    return JSON.stringify(await this.aggregate(asOfMs), null, 2);
  }
}
