/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { COCKPIT_RETURN_REASONS } from '../../src/common/types/cohortRollout';
import {
  M0B_ACCESSIBILITY_SEVERITIES,
  M0B_COHORTS,
  M0B_DAY_MS,
  M0B_OBSERVATION_WINDOW_DAYS,
  M0B_PRIMARY_JOURNEYS,
  M0B_RETURN_REASONS,
  M0B_SCHEMA_VERSION,
  M0B_SHELLS,
  M0B_SUPPORT_CATEGORIES,
  M0B_ZERO_TOLERANCE_REASONS,
} from '../../src/process/services/cohort/types';
import { M0B_DEFAULT_COMPARISON_THRESHOLDS, M0B_DEFAULT_MINIMUMS } from '../../src/process/services/cohort/policy';

const immutableBindings = {
  cohorts: M0B_COHORTS,
  shells: M0B_SHELLS,
  primaryJourneys: M0B_PRIMARY_JOURNEYS,
  returnReasons: M0B_RETURN_REASONS,
  sharedReturnReasons: COCKPIT_RETURN_REASONS,
  supportCategories: M0B_SUPPORT_CATEGORIES,
  accessibilitySeverities: M0B_ACCESSIBILITY_SEVERITIES,
  zeroToleranceReasons: M0B_ZERO_TOLERANCE_REASONS,
  minimums: M0B_DEFAULT_MINIMUMS,
  thresholds: M0B_DEFAULT_COMPARISON_THRESHOLDS,
};

for (const [name, value] of Object.entries(immutableBindings)) {
  if (!Object.isFrozen(value)) throw new Error(`M0B_RUNTIME_MUTABLE:${name}`);
}

process.stdout.write(
  JSON.stringify({
    schemaVersion: M0B_SCHEMA_VERSION,
    observationWindowDays: M0B_OBSERVATION_WINDOW_DAYS,
    dayMs: M0B_DAY_MS,
    ...immutableBindings,
  })
);
