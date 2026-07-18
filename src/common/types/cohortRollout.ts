/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export const COCKPIT_ROLLOUT_STAGES = ['internal-dogfood', 'invited-alpha', 'opt-in-beta', 'default-new'] as const;
export type CockpitRolloutStage = (typeof COCKPIT_ROLLOUT_STAGES)[number];

export const COCKPIT_RETURN_REASONS = [
  'performance',
  'confusing-navigation',
  'missing-capability',
  'reliability',
  'accessibility',
  'trust-or-control',
  'other-no-text',
] as const;
export type CockpitReturnReason = (typeof COCKPIT_RETURN_REASONS)[number];

export type CockpitRolloutStatus = Readonly<{
  eligible: boolean;
  stage: CockpitRolloutStage | null;
  source: 'development' | 'signed-authority' | 'none';
  reason:
    | 'development-build'
    | 'authorized'
    | 'authority-missing'
    | 'authority-invalid'
    | 'authority-expired'
    | 'version-mismatch'
    | 'release-track-mismatch'
    | 'cohort-mismatch'
    | 'evidence-gate-failed'
    | 'service-unavailable';
}>;

export type CockpitReturnRecordResult = Readonly<{
  status: 'recorded' | 'consent-disabled' | 'outside-window' | 'storage-error' | 'session-unavailable';
}>;
