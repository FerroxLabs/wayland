/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { isCiRuntime, isHomeRedirected, shouldDisableIjfw } from '@process/utils/ijfwGuard';

// A provably sandboxed HOME vs one that matches the real account home.
const SANDBOXED = { effective: '/tmp/sandbox-home', login: '/Users/real' };
const REAL_HOME = { effective: '/Users/real', login: '/Users/real' };

/**
 * Guards the fix for the reason a dead Memory surface shipped: WAYLAND_E2E_TEST
 * was BOTH the profile-isolation switch and the IJFW kill switch, so no packaged
 * smoke run could cover Memory.
 */
describe('shouldDisableIjfw', () => {
  it('defaults to ON for a normal user launch', () => {
    expect(shouldDisableIjfw({}, SANDBOXED)).toBe(false);
  });

  it('keeps the existing fail-safe defaults (no harness changes required)', () => {
    expect(shouldDisableIjfw({ WAYLAND_E2E_TEST: '1' }, SANDBOXED)).toBe(true);
    expect(shouldDisableIjfw({ CI: 'true' }, SANDBOXED)).toBe(true);
    expect(shouldDisableIjfw({ CI: '1' }, SANDBOXED)).toBe(true);
    expect(shouldDisableIjfw({ GITHUB_ACTIONS: 'true' }, SANDBOXED)).toBe(true);
  });

  it('honours an explicit force-OFF', () => {
    expect(shouldDisableIjfw({ WAYLAND_DISABLE_IJFW: '1' }, SANDBOXED)).toBe(true);
    expect(shouldDisableIjfw({ WAYLAND_DISABLE_IJFW: '1', WAYLAND_E2E_TEST: '1' }, SANDBOXED)).toBe(true);
  });

  it('lets an isolated harness force IJFW ON so Memory is coverable at all', () => {
    // The whole point: isolation and IJFW-enablement are no longer one switch.
    expect(shouldDisableIjfw({ WAYLAND_DISABLE_IJFW: '0', WAYLAND_E2E_TEST: '1' }, SANDBOXED)).toBe(false);
    expect(shouldDisableIjfw({ WAYLAND_DISABLE_IJFW: '0', CI: 'true' }, SANDBOXED)).toBe(false);
    expect(shouldDisableIjfw({ WAYLAND_DISABLE_IJFW: '0', GITHUB_ACTIONS: 'true' }, SANDBOXED)).toBe(false);
  });

  it('ignores values that are neither "0" nor "1" and falls back to the implicit rule', () => {
    expect(shouldDisableIjfw({ WAYLAND_DISABLE_IJFW: 'true' }, SANDBOXED)).toBe(false);
    expect(shouldDisableIjfw({ WAYLAND_DISABLE_IJFW: 'yes', WAYLAND_E2E_TEST: '1' }, SANDBOXED)).toBe(true);
    expect(shouldDisableIjfw({ WAYLAND_DISABLE_IJFW: '', CI: 'true' }, SANDBOXED)).toBe(true);
  });

  /**
   * Force-ON is fail-closed. A comment saying "pair this with a sandboxed HOME"
   * is not a guard: the obvious one-line edit (adding '0' to the packaged smoke,
   * which allowlists the REAL HOME) would have run `npx ijfw-install` against
   * the developer's own ~/.ijfw, taken its lock, and rewritten prelude blocks in
   * their repos.
   */
  describe('force-ON requires a provably sandboxed HOME', () => {
    it('refuses force-ON when HOME is the real account home', () => {
      expect(shouldDisableIjfw({ WAYLAND_DISABLE_IJFW: '0', WAYLAND_E2E_TEST: '1' }, REAL_HOME)).toBe(true);
      expect(shouldDisableIjfw({ WAYLAND_DISABLE_IJFW: '0', CI: 'true' }, REAL_HOME)).toBe(true);
    });

    it('still allows a normal user launch when HOME is real and nothing forces it', () => {
      expect(shouldDisableIjfw({}, REAL_HOME)).toBe(false);
    });

    it('force-OFF is honoured regardless of HOME', () => {
      expect(shouldDisableIjfw({ WAYLAND_DISABLE_IJFW: '1' }, REAL_HOME)).toBe(true);
    });

    it('cannot prove isolation when the login home is unknown', () => {
      expect(isHomeRedirected({ effective: '/tmp/x', login: '' })).toBe(false);
      expect(shouldDisableIjfw({ WAYLAND_DISABLE_IJFW: '0', CI: 'true' }, { effective: '/tmp/x', login: '' })).toBe(
        true
      );
    });
  });

  describe('isCiRuntime is the single owner of the CI predicate', () => {
    it('matches only the exact truthy values, not any non-empty CI', () => {
      expect(isCiRuntime({ CI: 'true' })).toBe(true);
      expect(isCiRuntime({ CI: '1' })).toBe(true);
      expect(isCiRuntime({ GITHUB_ACTIONS: 'true' })).toBe(true);
      // The old VerificationGate used bare `process.env.CI`, which was truthy here.
      expect(isCiRuntime({ CI: 'false' })).toBe(false);
      expect(isCiRuntime({})).toBe(false);
    });
  });

  it('does not treat an arbitrary CI value as CI', () => {
    expect(shouldDisableIjfw({ CI: 'false' }, SANDBOXED)).toBe(false);
    expect(shouldDisableIjfw({ CI: '0' }, SANDBOXED)).toBe(false);
  });
});
