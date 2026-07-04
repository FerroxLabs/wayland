/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Terminal mode (#645) feature-flag helper — main process side.
 *
 * The flag is stored in {@link ProcessConfig} under {@link TERMINAL_ENABLED_KEY}
 * and defaults to OFF. UI visibility is convenience; this helper is the control
 * the terminalBridge re-checks before spawning a PTY (defense-in-depth), so a
 * renderer that somehow calls `terminal.open` with the flag off is still
 * refused.
 */
import { ProcessConfig } from '@process/utils/initStorage';

/** ProcessConfig key for the advanced "Terminal mode" toggle. */
export const TERMINAL_ENABLED_KEY = 'terminal.enabled';

/**
 * Resolve whether terminal mode is enabled. Defaults to `false` when the key
 * has never been written (advanced, off-by-default).
 */
export async function isTerminalModeEnabled(): Promise<boolean> {
  const value = await ProcessConfig.get(TERMINAL_ENABLED_KEY);
  return value ?? false;
}
