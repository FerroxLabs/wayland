/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export const COCKPIT_ROLLOUT_STAGES = ['internal-dogfood', 'invited-alpha', 'opt-in-beta', 'default-new'] as const;
export type CockpitRolloutStage = (typeof COCKPIT_ROLLOUT_STAGES)[number];

export type CockpitRolloutStatus = Readonly<{
  eligible: boolean;
  stage: CockpitRolloutStage | null;
  source: 'development' | 'signed-authority' | 'product-default' | 'none';
  reason:
    | 'development-build'
    | 'authorized'
    | 'preview-open'
    | 'authority-missing'
    | 'authority-invalid'
    | 'authority-expired'
    | 'version-mismatch'
    | 'release-track-mismatch'
    | 'cohort-mismatch'
    | 'evidence-gate-failed'
    | 'service-unavailable';
}>;
