/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared IJFW types - used by both main and renderer.
 *
 * Standardized `errorReason` enum codes for the IJFW lifecycle. Surfaced via
 * `ipcBridge.ijfw.onStatusChanged` payloads and `brain.invoke` responses.
 * Renderer maps each code to a localized i18n key (Wave 6 fills the locale
 * dictionaries; Wave 2 wires the code path).
 */

export type IjfwErrorReason =
  | 'spawn_error'
  /**
   * #891: the respawn backoff refused to even ATTEMPT a spawn, so nothing was
   * probed. Distinct from `spawn_error` (a spawn was attempted and failed) so
   * callers can retry after the window instead of latching a false negative.
   */
  | 'spawn_backoff'
  | 'install_exit_nonzero'
  | 'invalid_target_version'
  | 'unsafe_ownership'
  | 'stage_pending_failed'
  | 'stage_swap_failed'
  | 'upgrade_failed_no_rollback'
  | 'upgrade_failed_rolled_back'
  | 'rollback_also_failed'
  | 'mcp_crashed'
  | 'mcp_error'
  | 'timeout'
  | 'validation_failed'
  | 'unavailable'
  | 'opt_out'
  /** Another process holds the install lock, so bootstrap did nothing. */
  | 'install_lock_held';

export const IJFW_ERROR_REASONS = [
  'spawn_error',
  'spawn_backoff',
  'install_exit_nonzero',
  'invalid_target_version',
  'unsafe_ownership',
  'stage_pending_failed',
  'stage_swap_failed',
  'upgrade_failed_no_rollback',
  'upgrade_failed_rolled_back',
  'rollback_also_failed',
  'mcp_crashed',
  'mcp_error',
  'timeout',
  'validation_failed',
  'unavailable',
  'opt_out',
  'install_lock_held',
] as const satisfies readonly IjfwErrorReason[];

/** Runtime mode reported by the MCP client. */
export type IjfwRuntimeModePublic = 'degraded' | 'full';

/** Result envelope returned by `brain.invoke` and all main-side IJFW callers. */
export type IjfwInvokeResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error?: string; errorReason?: IjfwErrorReason };
