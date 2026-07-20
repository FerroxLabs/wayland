/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { COCKPIT_RETURN_REASONS, COHORT_ASSIGNMENTS, type CohortAssignment } from '@/common/types/cohortRollout';

export const M0B_SCHEMA_VERSION = 1 as const;
export const M0B_OBSERVATION_WINDOW_DAYS = 14 as const;
export const M0B_DAY_MS = 86_400_000;

export const M0B_COHORTS = COHORT_ASSIGNMENTS;
export type M0BCohort = CohortAssignment;

export const M0B_SHELLS = Object.freeze(['classic', 'cockpit'] as const);
export type M0BShell = (typeof M0B_SHELLS)[number];

export const M0B_PRIMARY_JOURNEYS = Object.freeze([
  'chat.first-response',
  'project.resume',
  'cowork.create-artifact',
  'developer.modify-and-verify',
  'operator.run-automation',
] as const);
export type M0BPrimaryJourney = (typeof M0B_PRIMARY_JOURNEYS)[number];

export const M0B_RETURN_REASONS = COCKPIT_RETURN_REASONS;
export type M0BReturnReason = (typeof M0B_RETURN_REASONS)[number];

export const M0B_SUPPORT_CATEGORIES = Object.freeze(['blocked', 'setup', 'bug', 'how-to'] as const);
export type M0BSupportCategory = (typeof M0B_SUPPORT_CATEGORIES)[number];

export const M0B_ACCESSIBILITY_SEVERITIES = Object.freeze(['critical', 'serious'] as const);
export type M0BAccessibilitySeverity = (typeof M0B_ACCESSIBILITY_SEVERITIES)[number];

export const M0B_ZERO_TOLERANCE_REASONS = Object.freeze([
  'data-loss-or-corruption',
  'permission-widening',
  'approval-bypass',
  'cross-project-leakage',
  'receipt-forgery',
] as const);
export type M0BZeroToleranceReason = (typeof M0B_ZERO_TOLERANCE_REASONS)[number];

type M0BBaseEvent = {
  schemaVersion: typeof M0B_SCHEMA_VERSION;
  eventId: string;
  participantIdHash: string;
  sessionId: string;
  occurredAtMs: number;
  cohort: M0BCohort;
  shell: M0BShell;
};

export type M0BCohortEvent =
  | (M0BBaseEvent & { kind: 'session_started' })
  | (M0BBaseEvent & { kind: 'session_ended' })
  | (M0BBaseEvent & { kind: 'session_crashed' })
  | (M0BBaseEvent & {
      kind: 'journey_started';
      journeyRunId: string;
      journeyId: M0BPrimaryJourney;
    })
  | (M0BBaseEvent & {
      kind: 'journey_completed';
      journeyRunId: string;
      journeyId: M0BPrimaryJourney;
    })
  | (M0BBaseEvent & {
      kind: 'journey_failed';
      journeyRunId: string;
      journeyId: M0BPrimaryJourney;
    })
  | (M0BBaseEvent & {
      kind: 'accessibility_violation';
      severity: M0BAccessibilitySeverity;
    })
  | (M0BBaseEvent & {
      kind: 'support_contact';
      category: M0BSupportCategory;
    })
  | (M0BBaseEvent & {
      kind: 'shell_returned_to_classic';
      reason: M0BReturnReason;
    })
  | (M0BBaseEvent & {
      kind: 'zero_tolerance_stop';
      reason: M0BZeroToleranceReason;
    });

export type M0BComparisonThresholds = {
  maxJourneyFailureRateDelta: number;
  maxP95LatencyRatio: number;
  minCrashFreeSessionRateDelta: number;
  maxSupportContactsPerParticipantDelta: number;
  maxAccessibilityViolationsPerSessionDelta: number;
  maxReturnToClassicRate: number;
};

export type M0BBaselineConfig = {
  schemaVersion: typeof M0B_SCHEMA_VERSION;
  appVersion: string;
  windowStartMs: number;
  windowEndMs: number;
  minimums: {
    participantsTotal: number;
    participantsPerCohort: number;
    startsPerPrimaryJourney: number;
  };
  comparisonThresholds: M0BComparisonThresholds;
  privacyMode: 'local-aggregate-only' | 'structured-cohort-uat';
  decisionOwner: string;
  decisionSignedAtMs: number | null;
  invitedAlphaEnabled: boolean;
};

export type M0BValidationErrorCode =
  | 'not_object'
  | 'unknown_event_kind'
  | 'unknown_field'
  | 'forbidden_field'
  | 'missing_field'
  | 'invalid_field';

export type M0BValidationResult =
  | { ok: true; event: M0BCohortEvent }
  | {
      ok: false;
      code: M0BValidationErrorCode;
      field?: string;
    };

export type M0BContractErrorCode =
  | 'conflicting_event_id'
  | 'duplicate_session_start'
  | 'participant_cohort_mismatch'
  | 'missing_session_start'
  | 'identity_mismatch'
  | 'event_after_session_terminal'
  | 'duplicate_journey_start'
  | 'missing_journey_start'
  | 'journey_identity_mismatch'
  | 'duplicate_journey_terminal'
  | 'terminal_before_start'
  | 'ambiguous_event_order';

export type M0BMetricSlice = {
  participantCount: number;
  sessionStartedCount: number;
  sessionEndedCount: number;
  sessionCrashedCount: number;
  sessionIncompleteCount: number;
  crashFreeSessionRate: number | null;
  journeyStartedCount: number;
  journeyCompletedCount: number;
  journeyFailedCount: number;
  journeyUnresolvedCount: number;
  journeySuccessRate: number | null;
  journeyFailureRate: number | null;
  latencyMs: {
    p50: number | null;
    p95: number | null;
  };
  accessibilityViolationCount: number;
  accessibilityViolationsPerSession: number | null;
  supportContactCount: number;
  supportContactsPerParticipant: number | null;
  returnToClassicCount: number;
  returnToClassicRate: number | null;
  returnToClassicByReason: Record<M0BReturnReason, number>;
  zeroToleranceStopCount: number;
  zeroToleranceStopsByReason: Record<M0BZeroToleranceReason, number>;
};

export type M0BBaselineReport = {
  schemaVersion: typeof M0B_SCHEMA_VERSION;
  appVersion: string;
  observationWindow: {
    startMs: number;
    endMs: number;
    days: typeof M0B_OBSERVATION_WINDOW_DAYS;
    complete: boolean;
  };
  privacyMode: M0BBaselineConfig['privacyMode'];
  decision: {
    owner: string;
    signedAtMs: number | null;
    invitedAlphaEnabled: boolean;
    readyForDecision: boolean;
    authorizedForInvitedAlpha: boolean;
  };
  totals: M0BMetricSlice;
  byCohort: Record<M0BCohort, M0BMetricSlice>;
  byPrimaryJourney: Record<
    M0BPrimaryJourney,
    Pick<
      M0BMetricSlice,
      | 'journeyStartedCount'
      | 'journeyCompletedCount'
      | 'journeyFailedCount'
      | 'journeyUnresolvedCount'
      | 'journeySuccessRate'
      | 'journeyFailureRate'
      | 'latencyMs'
    >
  >;
  quality: {
    inputEventCount: number;
    acceptedEventCount: number;
    duplicateEventCount: number;
    privacyRejectedEventCount: number;
    contractRejectedEventCount: number;
    privacyRejections: Array<{
      index: number;
      code: M0BValidationErrorCode;
      field?: string;
    }>;
    contractErrors: Array<{
      eventId: string;
      code: M0BContractErrorCode;
    }>;
  };
  gates: {
    windowComplete: boolean;
    minimumTotalParticipantsMet: boolean;
    minimumParticipantsPerCohortMet: boolean;
    minimumStartsPerPrimaryJourneyMet: boolean;
    dataQualityPass: boolean;
    automaticStopTriggered: boolean;
  };
  minimums: M0BBaselineConfig['minimums'];
  comparisonThresholds: M0BComparisonThresholds;
};
