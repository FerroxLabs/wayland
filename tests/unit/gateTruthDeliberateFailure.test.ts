/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// TEMPORARY - F-01 gate verification only. This test fails on purpose to prove a
// required "Unit Tests (<os>)" check reports RED on a mixed PR. Delete with the
// verification branch.
import { describe, expect, it } from 'vitest';

describe('F-01 gate verification', () => {
  it('fails on purpose so the required check must go red', () => {
    expect('gate').toBe('bypassed');
  });
});
