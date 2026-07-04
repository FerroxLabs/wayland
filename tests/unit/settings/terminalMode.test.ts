/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #645 Task 2 — terminal-mode feature flag. Exercises the REAL
 * `isTerminalModeEnabled()` helper over a mocked ProcessConfig, proving it is
 * off by default and round-trips a write under the documented key.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, unknown>();
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: {
    get: async (k: string) => store.get(k),
    set: async (k: string, v: unknown) => void store.set(k, v),
  },
}));

import { TERMINAL_ENABLED_KEY, isTerminalModeEnabled } from '@process/terminal/terminalConfig';

beforeEach(() => store.clear());

describe('terminal mode flag (#645)', () => {
  it('uses the documented ProcessConfig key', () => {
    expect(TERMINAL_ENABLED_KEY).toBe('terminal.enabled');
  });

  it('defaults to false when never written (advanced, off by default)', async () => {
    expect(await isTerminalModeEnabled()).toBe(false);
  });

  it('reflects an enabled write and round-trips back to false', async () => {
    store.set(TERMINAL_ENABLED_KEY, true);
    expect(await isTerminalModeEnabled()).toBe(true);
    store.set(TERMINAL_ENABLED_KEY, false);
    expect(await isTerminalModeEnabled()).toBe(false);
  });
});
