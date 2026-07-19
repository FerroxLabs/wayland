/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { aggregateM0BBaseline } from '@process/services/cohort/CohortBaselineAggregator';
import { CohortBaselineService, type M0BCohortEventRepository } from '@process/services/cohort/CohortBaselineService';
import { createM0BClassicBaselineConfig } from '@process/services/cohort/policy';
import { validateM0BCohortEvent } from '@process/services/cohort/privacy';
import {
  M0B_DAY_MS,
  M0B_PRIMARY_JOURNEYS,
  type M0BBaselineConfig,
  type M0BCohort,
  type M0BCohortEvent,
} from '@process/services/cohort/types';

const START = 1_800_000_000_000;
const END = START + 14 * M0B_DAY_MS;

const config = (overrides: Partial<M0BBaselineConfig> = {}): M0BBaselineConfig => ({
  schemaVersion: 1,
  appVersion: '0.11.18-wave0',
  windowStartMs: START,
  windowEndMs: END,
  minimums: {
    participantsTotal: 4,
    participantsPerCohort: 1,
    startsPerPrimaryJourney: 1,
  },
  comparisonThresholds: {
    maxJourneyFailureRateDelta: 0,
    maxP95LatencyRatio: 1.15,
    minCrashFreeSessionRateDelta: -0.005,
    maxSupportContactsPerParticipantDelta: 0,
    maxAccessibilityViolationsPerSessionDelta: 0,
    maxReturnToClassicRate: 0.1,
  },
  privacyMode: 'structured-cohort-uat',
  decisionOwner: 'Sean Donahoe',
  decisionSignedAtMs: null,
  invitedAlphaEnabled: false,
  ...overrides,
});

const baseEvent = (
  sequence: number,
  cohort: M0BCohort,
  sessionId: string,
  kind: string,
  extra: Record<string, unknown> = {}
): Record<string, unknown> => ({
  schemaVersion: 1,
  eventId: 'event-' + String(sequence).padStart(6, '0'),
  participantIdHash: ('a' + sessionId.replace(/\D/g, '')).padEnd(16, '0').slice(0, 16),
  sessionId,
  occurredAtMs: START + sequence * 1_000,
  cohort,
  shell: 'classic',
  kind,
  ...extra,
});

function completeCorpus(): unknown[] {
  const cohorts: M0BCohort[] = ['novice', 'knowledge-work', 'developer', 'operator'];
  const events: unknown[] = [];
  let sequence = 1;

  cohorts.forEach((cohort, cohortIndex) => {
    const sessionId = 'session-' + String(cohortIndex).padStart(4, '0');
    const participantHash = String(cohortIndex + 1).padStart(16, 'a');
    const sessionStart = baseEvent(sequence++, cohort, sessionId, 'session_started');
    sessionStart.participantIdHash = participantHash;
    events.push(sessionStart);

    M0B_PRIMARY_JOURNEYS.forEach((journeyId, journeyIndex) => {
      if (journeyIndex % cohorts.length !== cohortIndex) return;
      const runId = 'journey-' + String(journeyIndex).padStart(4, '0');
      const started = baseEvent(sequence++, cohort, sessionId, 'journey_started', {
        journeyRunId: runId,
        journeyId,
      });
      started.participantIdHash = participantHash;
      const completed = baseEvent(sequence++, cohort, sessionId, 'journey_completed', {
        journeyRunId: runId,
        journeyId,
      });
      completed.participantIdHash = participantHash;
      events.push(started, completed);
    });

    const sessionEnd = baseEvent(sequence++, cohort, sessionId, 'session_ended');
    sessionEnd.participantIdHash = participantHash;
    events.push(sessionEnd);
  });

  return events;
}

describe('M0B privacy contract', () => {
  it('accepts only the closed content-free event shape', () => {
    const result = validateM0BCohortEvent(baseEvent(1, 'novice', 'session-0001', 'session_started'));
    expect(result.ok).toBe(true);
  });

  it.each(['prompt', 'filePath', 'url', 'toolArguments', 'metadata', 'message'])(
    'rejects forbidden content-bearing field %s',
    (field) => {
      const input = baseEvent(1, 'novice', 'session-0001', 'session_started');
      input[field] = 'must never be collected';
      expect(validateM0BCohortEvent(input)).toEqual({
        ok: false,
        code: 'forbidden_field',
        field,
      });
    }
  );

  it('rejects unknown fields instead of silently stripping them', () => {
    const input = baseEvent(1, 'novice', 'session-0001', 'session_started');
    input.experiment = 'A';
    expect(validateM0BCohortEvent(input)).toEqual({
      ok: false,
      code: 'unknown_field',
      field: 'experiment',
    });
  });

  it('rejects return-to-Classic evidence attributed to a Classic session', () => {
    expect(
      validateM0BCohortEvent(
        baseEvent(1, 'novice', 'session-0001', 'shell_returned_to_classic', { reason: 'reliability' })
      )
    ).toEqual({ ok: false, code: 'invalid_field', field: 'shell' });
  });
});

describe('aggregateM0BBaseline', () => {
  it('creates a 14-day unsigned policy that cannot authorize invited alpha', () => {
    const policy = createM0BClassicBaselineConfig({
      appVersion: '0.11.18-wave0',
      windowStartMs: START,
      privacyMode: 'local-aggregate-only',
    });
    expect(policy.windowEndMs).toBe(END);
    expect(policy.minimums).toEqual({
      participantsTotal: 20,
      participantsPerCohort: 5,
      startsPerPrimaryJourney: 10,
    });
    expect(policy.decisionOwner).toBe('Sean Donahoe');
    expect(policy.decisionSignedAtMs).toBeNull();
    expect(policy.invitedAlphaEnabled).toBe(false);
  });

  it('separates all four cohorts and uses journey starts as the denominator', () => {
    const report = aggregateM0BBaseline(completeCorpus(), config(), END);

    expect(report.gates).toEqual({
      windowComplete: true,
      minimumTotalParticipantsMet: true,
      minimumParticipantsPerCohortMet: true,
      minimumStartsPerPrimaryJourneyMet: true,
      dataQualityPass: true,
      automaticStopTriggered: false,
    });
    expect(report.totals.participantCount).toBe(4);
    expect(report.totals.journeyStartedCount).toBe(5);
    expect(report.totals.journeyCompletedCount).toBe(5);
    expect(report.totals.journeySuccessRate).toBe(1);
    expect(report.totals.crashFreeSessionRate).toBe(1);
    expect(report.byCohort.novice.participantCount).toBe(1);
    expect(report.byCohort['knowledge-work'].participantCount).toBe(1);
    expect(report.byCohort.developer.participantCount).toBe(1);
    expect(report.byCohort.operator.participantCount).toBe(1);
    expect(report.decision.readyForDecision).toBe(true);
    expect(report.decision.authorizedForInvitedAlpha).toBe(false);
  });

  it('requires an explicit post-window signature and enablement to authorize alpha', () => {
    const report = aggregateM0BBaseline(
      completeCorpus(),
      config({ decisionSignedAtMs: END, invitedAlphaEnabled: true }),
      END
    );
    expect(report.decision.readyForDecision).toBe(true);
    expect(report.decision.authorizedForInvitedAlpha).toBe(true);

    const prematurelySigned = aggregateM0BBaseline(
      completeCorpus(),
      config({ decisionSignedAtMs: END - 1, invitedAlphaEnabled: true }),
      END
    );
    expect(prematurelySigned.decision.readyForDecision).toBe(true);
    expect(prematurelySigned.decision.authorizedForInvitedAlpha).toBe(false);
  });

  it('keeps incomplete sessions and unresolved journeys visible', () => {
    const events = [
      baseEvent(1, 'novice', 'session-0001', 'session_started'),
      baseEvent(2, 'novice', 'session-0001', 'journey_started', {
        journeyRunId: 'journey-0001',
        journeyId: 'chat.first-response',
      }),
    ];
    const report = aggregateM0BBaseline(events, config(), END);
    expect(report.totals.sessionIncompleteCount).toBe(1);
    expect(report.totals.journeyUnresolvedCount).toBe(1);
    expect(report.totals.journeySuccessRate).toBe(0);
    expect(report.totals.crashFreeSessionRate).toBeNull();
  });

  it('uses the frozen denominators for support, accessibility, and Cockpit returns', () => {
    const first = baseEvent(1, 'novice', 'session-0001', 'session_started');
    const second = baseEvent(2, 'novice', 'session-0002', 'session_started');
    second.participantIdHash = first.participantIdHash;
    first.shell = 'cockpit';
    second.shell = 'cockpit';
    const events = [
      first,
      second,
      baseEvent(3, 'novice', 'session-0001', 'support_contact', { category: 'bug', shell: 'cockpit' }),
      baseEvent(4, 'novice', 'session-0002', 'support_contact', { category: 'setup', shell: 'cockpit' }),
      baseEvent(5, 'novice', 'session-0001', 'accessibility_violation', {
        severity: 'serious',
        shell: 'cockpit',
      }),
      baseEvent(6, 'novice', 'session-0001', 'shell_returned_to_classic', {
        reason: 'reliability',
        shell: 'cockpit',
      }),
    ];
    for (const event of events.slice(2)) event.participantIdHash = first.participantIdHash;

    const report = aggregateM0BBaseline(events, config(), END);
    expect(report.totals.participantCount).toBe(1);
    expect(report.totals.sessionStartedCount).toBe(2);
    expect(report.totals.supportContactsPerParticipant).toBe(2);
    expect(report.totals.accessibilityViolationsPerSession).toBe(0.5);
    expect(report.totals.returnToClassicRate).toBe(0.5);
  });

  it('returns null rather than manufacturing rates when a denominator is missing', () => {
    const report = aggregateM0BBaseline([], config(), END);
    expect(report.totals.journeyFailureRate).toBeNull();
    expect(report.totals.journeySuccessRate).toBeNull();
    expect(report.totals.crashFreeSessionRate).toBeNull();
    expect(report.totals.supportContactsPerParticipant).toBeNull();
    expect(report.totals.accessibilityViolationsPerSession).toBeNull();
    expect(report.totals.returnToClassicRate).toBeNull();
    expect(report.totals.latencyMs.p95).toBeNull();
  });

  it('counts explicit crashes without inferring crashes from silence', () => {
    const events = [
      baseEvent(1, 'novice', 'session-0001', 'session_started'),
      baseEvent(2, 'novice', 'session-0001', 'session_crashed'),
      baseEvent(3, 'novice', 'session-0002', 'session_started'),
      baseEvent(4, 'novice', 'session-0002', 'session_ended'),
      baseEvent(5, 'novice', 'session-0003', 'session_started'),
    ];
    const report = aggregateM0BBaseline(events, config(), END);
    expect(report.totals.sessionCrashedCount).toBe(1);
    expect(report.totals.sessionIncompleteCount).toBe(1);
    expect(report.totals.crashFreeSessionRate).toBe(0.5);
  });

  it('deduplicates byte-equivalent events and rejects conflicting event IDs', () => {
    const first = baseEvent(1, 'novice', 'session-0001', 'session_started');
    const duplicate = { ...first };
    const conflict = { ...first, shell: 'cockpit' };
    const report = aggregateM0BBaseline([first, duplicate, conflict], config(), END);
    expect(report.quality.duplicateEventCount).toBe(1);
    expect(report.quality.contractErrors).toEqual([{ eventId: 'event-000001', code: 'conflicting_event_id' }]);
    expect(report.gates.dataQualityPass).toBe(false);
  });

  it('rejects a participant whose frozen cohort changes between sessions', () => {
    const first = baseEvent(1, 'novice', 'session-0001', 'session_started');
    const second = baseEvent(2, 'developer', 'session-0002', 'session_started');
    second.participantIdHash = first.participantIdHash;
    const report = aggregateM0BBaseline([first, second], config(), END);
    expect(report.quality.contractErrors).toEqual([{ eventId: 'event-000002', code: 'participant_cohort_mismatch' }]);
    expect(report.totals.sessionStartedCount).toBe(1);
    expect(report.gates.dataQualityPass).toBe(false);
  });

  it('rejects terminals without starts and events after a session terminal', () => {
    const events = [
      baseEvent(1, 'novice', 'session-0001', 'journey_completed', {
        journeyRunId: 'journey-0001',
        journeyId: 'chat.first-response',
      }),
      baseEvent(2, 'novice', 'session-0002', 'session_started'),
      baseEvent(3, 'novice', 'session-0002', 'session_ended'),
      baseEvent(4, 'novice', 'session-0002', 'support_contact', { category: 'bug' }),
    ];
    const report = aggregateM0BBaseline(events, config(), END);
    expect(report.quality.contractErrors.map((error) => error.code)).toEqual([
      'missing_session_start',
      'event_after_session_terminal',
    ]);
    expect(report.totals.supportContactCount).toBe(0);
  });

  it('triggers an automatic stop for every zero-tolerance incident class', () => {
    const reasons = [
      'data-loss-or-corruption',
      'permission-widening',
      'approval-bypass',
      'cross-project-leakage',
      'receipt-forgery',
    ];
    const events: unknown[] = [baseEvent(1, 'operator', 'session-0001', 'session_started')];
    reasons.forEach((reason, index) => {
      events.push(baseEvent(index + 2, 'operator', 'session-0001', 'zero_tolerance_stop', { reason }));
    });
    events.push(baseEvent(8, 'operator', 'session-0001', 'session_ended'));

    const report = aggregateM0BBaseline(events, config(), END);
    expect(report.totals.zeroToleranceStopCount).toBe(5);
    expect(report.totals.zeroToleranceStopsByReason).toEqual({
      'data-loss-or-corruption': 1,
      'permission-widening': 1,
      'approval-bypass': 1,
      'cross-project-leakage': 1,
      'receipt-forgery': 1,
    });
    expect(report.gates.automaticStopTriggered).toBe(true);
    expect(report.decision.readyForDecision).toBe(false);
  });

  it('rejects any observation window other than exactly 14 calendar days', () => {
    expect(() => aggregateM0BBaseline([], config({ windowEndMs: END - 1 }), END)).toThrow(
      'M0B_CONFIG_WINDOW_MUST_BE_14_DAYS'
    );
  });
});

describe('CohortBaselineService', () => {
  class MemoryRepository implements M0BCohortEventRepository {
    readonly events: M0BCohortEvent[] = [];
    failAppend = false;

    async append(event: M0BCohortEvent): Promise<void> {
      if (this.failAppend) throw new Error('disk unavailable');
      this.events.push(event);
    }

    async findWindow(startMs: number, endMs: number): Promise<M0BCohortEvent[]> {
      return this.events.filter((event) => event.occurredAtMs >= startMs && event.occurredAtMs < endMs);
    }
  }

  it('records nothing until explicit consent exists', async () => {
    const repository = new MemoryRepository();
    const service = new CohortBaselineService(repository, config(), {
      enabled: false,
      acceptedAtMs: null,
    });
    expect(await service.record(baseEvent(1, 'novice', 'session-0001', 'session_started'))).toEqual({
      status: 'disabled',
    });
    expect(repository.events).toHaveLength(0);
  });

  it('rejects content-bearing input before repository access', async () => {
    const repository = new MemoryRepository();
    const service = new CohortBaselineService(repository, config(), {
      enabled: true,
      acceptedAtMs: START,
    });
    const input = baseEvent(1, 'novice', 'session-0001', 'session_started');
    input.prompt = 'private customer request';
    expect(await service.record(input)).toEqual({
      status: 'rejected',
      code: 'forbidden_field',
      field: 'prompt',
    });
    expect(repository.events).toHaveLength(0);
  });

  it('refuses events outside the configured observation window', async () => {
    const repository = new MemoryRepository();
    const service = new CohortBaselineService(repository, config(), {
      enabled: true,
      acceptedAtMs: START,
    });
    const input = baseEvent(1, 'novice', 'session-0001', 'session_started');
    input.occurredAtMs = END;
    expect(await service.record(input)).toEqual({ status: 'outside_observation_window' });
    expect(repository.events).toHaveLength(0);
  });

  it('fails closed when local persistence fails', async () => {
    const repository = new MemoryRepository();
    repository.failAppend = true;
    const service = new CohortBaselineService(repository, config(), {
      enabled: true,
      acceptedAtMs: START,
    });
    expect(await service.record(baseEvent(1, 'novice', 'session-0001', 'session_started'))).toEqual({
      status: 'storage_error',
    });
  });

  it('exports aggregates without raw participant or session identifiers', async () => {
    const repository = new MemoryRepository();
    const service = new CohortBaselineService(repository, config(), {
      enabled: true,
      acceptedAtMs: START,
    });
    const started = baseEvent(1, 'novice', 'session-0001', 'session_started');
    const participantIdHash = String(started.participantIdHash);
    expect(await service.record(started)).toEqual({ status: 'recorded' });
    expect(await service.record(baseEvent(2, 'novice', 'session-0001', 'session_ended'))).toEqual({
      status: 'recorded',
    });

    const exported = await service.exportAggregate(END);
    expect(exported).not.toContain(participantIdHash);
    expect(exported).not.toContain('session-0001');
    expect(exported).not.toContain('event-000001');
    expect(JSON.parse(exported).totals.sessionEndedCount).toBe(1);
  });
});
