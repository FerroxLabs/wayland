/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { validateM0BCohortEvent } from './privacy';
import {
  M0B_COHORTS,
  M0B_DAY_MS,
  M0B_OBSERVATION_WINDOW_DAYS,
  M0B_PRIMARY_JOURNEYS,
  M0B_RETURN_REASONS,
  M0B_SCHEMA_VERSION,
  M0B_ZERO_TOLERANCE_REASONS,
  type M0BBaselineConfig,
  type M0BBaselineReport,
  type M0BCohort,
  type M0BCohortEvent,
  type M0BContractErrorCode,
  type M0BMetricSlice,
  type M0BZeroToleranceReason,
} from './types';

type SessionState = {
  start: Extract<M0BCohortEvent, { kind: 'session_started' }>;
  terminal?: Extract<M0BCohortEvent, { kind: 'session_ended' | 'session_crashed' }>;
};

type JourneyState = {
  start: Extract<M0BCohortEvent, { kind: 'journey_started' }>;
  terminal?: Extract<M0BCohortEvent, { kind: 'journey_completed' | 'journey_failed' }>;
};

const EVENT_PRIORITY: Record<M0BCohortEvent['kind'], number> = {
  session_started: 0,
  journey_started: 1,
  accessibility_violation: 2,
  support_contact: 2,
  shell_returned_to_classic: 2,
  zero_tolerance_stop: 2,
  journey_completed: 3,
  journey_failed: 3,
  session_ended: 4,
  session_crashed: 4,
};

function assertConfig(config: M0BBaselineConfig): void {
  if (config.schemaVersion !== M0B_SCHEMA_VERSION) throw new Error('M0B_CONFIG_SCHEMA_INVALID');
  if (!Number.isSafeInteger(config.windowStartMs) || !Number.isSafeInteger(config.windowEndMs)) {
    throw new Error('M0B_CONFIG_WINDOW_INVALID');
  }
  if (config.windowEndMs - config.windowStartMs !== M0B_OBSERVATION_WINDOW_DAYS * M0B_DAY_MS) {
    throw new Error('M0B_CONFIG_WINDOW_MUST_BE_14_DAYS');
  }
  if (!config.appVersion || !config.decisionOwner) throw new Error('M0B_CONFIG_AUTHORITY_MISSING');
  for (const value of Object.values(config.minimums)) {
    if (!Number.isSafeInteger(value) || value < 1) throw new Error('M0B_CONFIG_MINIMUM_INVALID');
  }
}

function percentile(values: number[], quantile: number): number | null {
  if (values.length === 0) return null;
  const sorted = values.toSorted((a, b) => a - b);
  return sorted[Math.ceil(quantile * sorted.length) - 1] ?? null;
}

function blankReturnReasons(): M0BMetricSlice['returnToClassicByReason'] {
  return Object.fromEntries(
    M0B_RETURN_REASONS.map((reason) => [reason, 0])
  ) as M0BMetricSlice['returnToClassicByReason'];
}

function blankZeroToleranceReasons(): M0BMetricSlice['zeroToleranceStopsByReason'] {
  return Object.fromEntries(M0B_ZERO_TOLERANCE_REASONS.map((reason) => [reason, 0])) as Record<
    M0BZeroToleranceReason,
    number
  >;
}

function metricSlice(sessions: SessionState[], journeys: JourneyState[], events: M0BCohortEvent[]): M0BMetricSlice {
  const terminalJourneys = journeys.filter((journey) => journey.terminal);
  const latencies = terminalJourneys.map((journey) => journey.terminal!.occurredAtMs - journey.start.occurredAtMs);
  const completed = terminalJourneys.filter((journey) => journey.terminal!.kind === 'journey_completed').length;
  const failed = terminalJourneys.filter((journey) => journey.terminal!.kind === 'journey_failed').length;
  const explicitTerminals = sessions.filter((session) => session.terminal);
  const ended = explicitTerminals.filter((session) => session.terminal!.kind === 'session_ended').length;
  const crashed = explicitTerminals.filter((session) => session.terminal!.kind === 'session_crashed').length;
  const returnReasons = blankReturnReasons();
  const stopReasons = blankZeroToleranceReasons();
  for (const event of events) {
    if (event.kind === 'shell_returned_to_classic') returnReasons[event.reason] += 1;
    if (event.kind === 'zero_tolerance_stop') stopReasons[event.reason] += 1;
  }
  const participantCount = new Set(sessions.map((session) => session.start.participantIdHash)).size;
  const cockpitSessionCount = sessions.filter((session) => session.start.shell === 'cockpit').length;
  const accessibilityViolationCount = events.filter((event) => event.kind === 'accessibility_violation').length;
  const supportContactCount = events.filter((event) => event.kind === 'support_contact').length;
  const returnToClassicCount = events.filter((event) => event.kind === 'shell_returned_to_classic').length;
  const zeroToleranceStopCount = events.filter((event) => event.kind === 'zero_tolerance_stop').length;

  return {
    participantCount,
    sessionStartedCount: sessions.length,
    sessionEndedCount: ended,
    sessionCrashedCount: crashed,
    sessionIncompleteCount: sessions.length - explicitTerminals.length,
    crashFreeSessionRate: explicitTerminals.length > 0 ? ended / explicitTerminals.length : null,
    journeyStartedCount: journeys.length,
    journeyCompletedCount: completed,
    journeyFailedCount: failed,
    journeyUnresolvedCount: journeys.length - terminalJourneys.length,
    journeySuccessRate: journeys.length > 0 ? completed / journeys.length : null,
    journeyFailureRate: journeys.length > 0 ? failed / journeys.length : null,
    latencyMs: {
      p50: percentile(latencies, 0.5),
      p95: percentile(latencies, 0.95),
    },
    accessibilityViolationCount,
    accessibilityViolationsPerSession: sessions.length > 0 ? accessibilityViolationCount / sessions.length : null,
    supportContactCount,
    supportContactsPerParticipant: participantCount > 0 ? supportContactCount / participantCount : null,
    returnToClassicCount,
    returnToClassicRate: cockpitSessionCount > 0 ? returnToClassicCount / cockpitSessionCount : null,
    returnToClassicByReason: returnReasons,
    zeroToleranceStopCount,
    zeroToleranceStopsByReason: stopReasons,
  };
}

function sameIdentity(event: M0BCohortEvent, start: M0BCohortEvent): boolean {
  return (
    event.participantIdHash === start.participantIdHash &&
    event.sessionId === start.sessionId &&
    event.cohort === start.cohort &&
    event.shell === start.shell
  );
}

export function aggregateM0BBaseline(
  inputs: readonly unknown[],
  config: M0BBaselineConfig,
  asOfMs = Date.now()
): M0BBaselineReport {
  assertConfig(config);

  const privacyRejections: M0BBaselineReport['quality']['privacyRejections'] = [];
  const contractErrors: M0BBaselineReport['quality']['contractErrors'] = [];
  const uniqueEvents = new Map<string, M0BCohortEvent>();
  let duplicateEventCount = 0;

  inputs.forEach((input, index) => {
    const validation = validateM0BCohortEvent(input);
    if (validation.ok === false) {
      privacyRejections.push({ index, code: validation.code, field: validation.field });
      return;
    }
    const event = validation.event;
    if (event.occurredAtMs < config.windowStartMs || event.occurredAtMs >= config.windowEndMs) return;
    const existing = uniqueEvents.get(event.eventId);
    if (!existing) {
      uniqueEvents.set(event.eventId, event);
    } else if (JSON.stringify(existing) === JSON.stringify(event)) {
      duplicateEventCount += 1;
    } else {
      contractErrors.push({ eventId: event.eventId, code: 'conflicting_event_id' });
    }
  });

  const orderedEvents = [...uniqueEvents.values()].toSorted(
    (left, right) =>
      left.occurredAtMs - right.occurredAtMs ||
      EVENT_PRIORITY[left.kind] - EVENT_PRIORITY[right.kind] ||
      left.eventId.localeCompare(right.eventId)
  );
  const sessions = new Map<string, SessionState>();
  const journeys = new Map<string, JourneyState>();
  const participantCohorts = new Map<string, M0BCohort>();
  const acceptedEvents: M0BCohortEvent[] = [];

  const reject = (event: M0BCohortEvent, code: M0BContractErrorCode): void => {
    contractErrors.push({ eventId: event.eventId, code });
  };

  for (const event of orderedEvents) {
    if (event.kind === 'session_started') {
      const priorCohort = participantCohorts.get(event.participantIdHash);
      if (priorCohort !== undefined && priorCohort !== event.cohort) {
        reject(event, 'participant_cohort_mismatch');
      } else if (sessions.has(event.sessionId)) {
        reject(event, 'duplicate_session_start');
      } else {
        participantCohorts.set(event.participantIdHash, event.cohort);
        sessions.set(event.sessionId, { start: event });
        acceptedEvents.push(event);
      }
      continue;
    }

    const session = sessions.get(event.sessionId);
    if (!session) {
      reject(event, 'missing_session_start');
      continue;
    }
    if (!sameIdentity(event, session.start)) {
      reject(event, 'identity_mismatch');
      continue;
    }
    if (session.terminal) {
      reject(event, 'event_after_session_terminal');
      continue;
    }

    if (event.kind === 'session_ended' || event.kind === 'session_crashed') {
      session.terminal = event;
      acceptedEvents.push(event);
      continue;
    }
    if (event.kind === 'journey_started') {
      if (journeys.has(event.journeyRunId)) {
        reject(event, 'duplicate_journey_start');
      } else {
        journeys.set(event.journeyRunId, { start: event });
        acceptedEvents.push(event);
      }
      continue;
    }
    if (event.kind === 'journey_completed' || event.kind === 'journey_failed') {
      const journey = journeys.get(event.journeyRunId);
      if (!journey) {
        reject(event, 'missing_journey_start');
      } else if (!sameIdentity(event, journey.start) || event.journeyId !== journey.start.journeyId) {
        reject(event, 'journey_identity_mismatch');
      } else if (journey.terminal) {
        reject(event, 'duplicate_journey_terminal');
      } else if (event.occurredAtMs < journey.start.occurredAtMs) {
        reject(event, 'terminal_before_start');
      } else {
        journey.terminal = event;
        acceptedEvents.push(event);
      }
      continue;
    }
    acceptedEvents.push(event);
  }

  const sessionStates = [...sessions.values()];
  const journeyStates = [...journeys.values()];
  const byCohort = Object.fromEntries(
    M0B_COHORTS.map((cohort) => [
      cohort,
      metricSlice(
        sessionStates.filter((session) => session.start.cohort === cohort),
        journeyStates.filter((journey) => journey.start.cohort === cohort),
        acceptedEvents.filter((event) => event.cohort === cohort)
      ),
    ])
  ) as Record<M0BCohort, M0BMetricSlice>;

  const byPrimaryJourney = Object.fromEntries(
    M0B_PRIMARY_JOURNEYS.map((journeyId) => {
      const slice = metricSlice(
        [],
        journeyStates.filter((journey) => journey.start.journeyId === journeyId),
        []
      );
      return [
        journeyId,
        {
          journeyStartedCount: slice.journeyStartedCount,
          journeyCompletedCount: slice.journeyCompletedCount,
          journeyFailedCount: slice.journeyFailedCount,
          journeyUnresolvedCount: slice.journeyUnresolvedCount,
          journeySuccessRate: slice.journeySuccessRate,
          journeyFailureRate: slice.journeyFailureRate,
          latencyMs: slice.latencyMs,
        },
      ];
    })
  ) as M0BBaselineReport['byPrimaryJourney'];

  const totals = metricSlice(sessionStates, journeyStates, acceptedEvents);
  const windowComplete = asOfMs >= config.windowEndMs;
  const minimumTotalParticipantsMet = totals.participantCount >= config.minimums.participantsTotal;
  const minimumParticipantsPerCohortMet = M0B_COHORTS.every(
    (cohort) => byCohort[cohort].participantCount >= config.minimums.participantsPerCohort
  );
  const minimumStartsPerPrimaryJourneyMet = M0B_PRIMARY_JOURNEYS.every(
    (journey) => byPrimaryJourney[journey].journeyStartedCount >= config.minimums.startsPerPrimaryJourney
  );
  const dataQualityPass = privacyRejections.length === 0 && contractErrors.length === 0;
  const automaticStopTriggered = totals.zeroToleranceStopCount > 0;
  const readyForDecision =
    windowComplete &&
    minimumTotalParticipantsMet &&
    minimumParticipantsPerCohortMet &&
    minimumStartsPerPrimaryJourneyMet &&
    dataQualityPass &&
    !automaticStopTriggered;
  const signatureIsValid =
    config.decisionSignedAtMs !== null &&
    config.decisionSignedAtMs >= config.windowEndMs &&
    config.decisionSignedAtMs <= asOfMs;

  return {
    schemaVersion: M0B_SCHEMA_VERSION,
    appVersion: config.appVersion,
    observationWindow: {
      startMs: config.windowStartMs,
      endMs: config.windowEndMs,
      days: M0B_OBSERVATION_WINDOW_DAYS,
      complete: windowComplete,
    },
    privacyMode: config.privacyMode,
    decision: {
      owner: config.decisionOwner,
      signedAtMs: config.decisionSignedAtMs,
      invitedAlphaEnabled: config.invitedAlphaEnabled,
      readyForDecision,
      authorizedForInvitedAlpha: readyForDecision && signatureIsValid && config.invitedAlphaEnabled,
    },
    totals,
    byCohort,
    byPrimaryJourney,
    quality: {
      inputEventCount: inputs.length,
      acceptedEventCount: acceptedEvents.length,
      duplicateEventCount,
      privacyRejectedEventCount: privacyRejections.length,
      contractRejectedEventCount: contractErrors.length,
      privacyRejections,
      contractErrors,
    },
    gates: {
      windowComplete,
      minimumTotalParticipantsMet,
      minimumParticipantsPerCohortMet,
      minimumStartsPerPrimaryJourneyMet,
      dataQualityPass,
      automaticStopTriggered,
    },
    minimums: config.minimums,
    comparisonThresholds: config.comparisonThresholds,
  };
}
