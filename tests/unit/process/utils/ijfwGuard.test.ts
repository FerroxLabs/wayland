/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { shouldDisableIjfw } from '@process/utils/ijfwGuard';

/**
 * Guards the fix for the reason a dead Memory surface shipped: WAYLAND_E2E_TEST
 * was BOTH the profile-isolation switch and the IJFW kill switch, so no packaged
 * smoke run could cover Memory.
 */
describe('shouldDisableIjfw', () => {
  it('defaults to ON for a normal user launch', () => {
    expect(shouldDisableIjfw({})).toBe(false);
  });

  it('keeps the existing fail-safe defaults (no harness changes required)', () => {
    expect(shouldDisableIjfw({ WAYLAND_E2E_TEST: '1' })).toBe(true);
    expect(shouldDisableIjfw({ CI: 'true' })).toBe(true);
    expect(shouldDisableIjfw({ CI: '1' })).toBe(true);
    expect(shouldDisableIjfw({ GITHUB_ACTIONS: 'true' })).toBe(true);
  });

  it('honours an explicit force-OFF', () => {
    expect(shouldDisableIjfw({ WAYLAND_DISABLE_IJFW: '1' })).toBe(true);
    expect(shouldDisableIjfw({ WAYLAND_DISABLE_IJFW: '1', WAYLAND_E2E_TEST: '1' })).toBe(true);
  });

  it('lets an isolated harness force IJFW ON so Memory is coverable at all', () => {
    // The whole point: isolation and IJFW-enablement are no longer one switch.
    expect(shouldDisableIjfw({ WAYLAND_DISABLE_IJFW: '0', WAYLAND_E2E_TEST: '1' })).toBe(false);
    expect(shouldDisableIjfw({ WAYLAND_DISABLE_IJFW: '0', CI: 'true' })).toBe(false);
    expect(shouldDisableIjfw({ WAYLAND_DISABLE_IJFW: '0', GITHUB_ACTIONS: 'true' })).toBe(false);
  });

  it('ignores values that are neither "0" nor "1" and falls back to the implicit rule', () => {
    expect(shouldDisableIjfw({ WAYLAND_DISABLE_IJFW: 'true' })).toBe(false);
    expect(shouldDisableIjfw({ WAYLAND_DISABLE_IJFW: 'yes', WAYLAND_E2E_TEST: '1' })).toBe(true);
    expect(shouldDisableIjfw({ WAYLAND_DISABLE_IJFW: '', CI: 'true' })).toBe(true);
  });

  it('does not treat an arbitrary CI value as CI', () => {
    expect(shouldDisableIjfw({ CI: 'false' })).toBe(false);
    expect(shouldDisableIjfw({ CI: '0' })).toBe(false);
  });
});
