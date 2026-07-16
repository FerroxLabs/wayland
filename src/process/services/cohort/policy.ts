/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { M0B_DAY_MS, M0B_OBSERVATION_WINDOW_DAYS, M0B_SCHEMA_VERSION, type M0BBaselineConfig } from './types';

export const M0B_DEFAULT_MINIMUMS: M0BBaselineConfig['minimums'] = {
  participantsTotal: 20,
  participantsPerCohort: 5,
  startsPerPrimaryJourney: 10,
};

export const M0B_DEFAULT_COMPARISON_THRESHOLDS: M0BBaselineConfig['comparisonThresholds'] = {
  maxJourneyFailureRateDelta: 0,
  maxP95LatencyRatio: 1.15,
  minCrashFreeSessionRateDelta: -0.005,
  maxSupportContactsPerParticipantDelta: 0,
  maxAccessibilityViolationsPerSessionDelta: 0,
  maxReturnToClassicRate: 0.1,
};

export type CreateM0BClassicBaselineConfigInput = {
  appVersion: string;
  windowStartMs: number;
  privacyMode: M0BBaselineConfig['privacyMode'];
};

/**
 * Create the unsigned Day 0 Classic-baseline policy. Product code cannot use
 * this factory to authorize invited alpha: the decision signature and rollout
 * enablement remain explicit post-observation release actions.
 */
export function createM0BClassicBaselineConfig(input: CreateM0BClassicBaselineConfigInput): M0BBaselineConfig {
  return {
    schemaVersion: M0B_SCHEMA_VERSION,
    appVersion: input.appVersion,
    windowStartMs: input.windowStartMs,
    windowEndMs: input.windowStartMs + M0B_OBSERVATION_WINDOW_DAYS * M0B_DAY_MS,
    minimums: { ...M0B_DEFAULT_MINIMUMS },
    comparisonThresholds: { ...M0B_DEFAULT_COMPARISON_THRESHOLDS },
    privacyMode: input.privacyMode,
    decisionOwner: 'Sean Donahoe',
    decisionSignedAtMs: null,
    invitedAlphaEnabled: false,
  };
}
