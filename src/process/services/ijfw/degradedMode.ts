/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Degraded-mode helpers - main-process side.
 *
 * When `ijfwMcpClient.getMode() === 'degraded'` the IJFW MCP child is not
 * reachable (not installed, crashed, or shutting down). Chat must keep
 * working; only memory enrichment hooks short-circuit. This module owns:
 *
 *   1. `shortCircuitIfDegraded()` - the single helper every memory caller
 *      pre-flights through. Returns `{ ok:false, errorReason:'unavailable' }`
 *      when degraded so callers can no-op without try/catch.
 *   2. `getDegradedToastKey()` - the i18n key the renderer will resolve when
 *      surfacing the one-time toast. Wave 6 fills the 8-locale dictionaries.
 *   3. `markToastShown()` / `wasToastShown()` - process-lifetime memo so the
 *      toast appears at most once per session.
 */

import { ijfwMcpClient } from './ijfwMcpClient';
import type { IjfwInvokeResult } from '@/common/types/ijfw';

/** i18n key resolved by the renderer when the toast surface fires. */
export const DEGRADED_TOAST_KEY = 'memory.degraded.toast';

/** English fallback - used when the renderer cannot resolve DEGRADED_TOAST_KEY. */
export const DEGRADED_TOAST_FALLBACK = 'Memory will activate after first-time setup';

let __toastShown = false;

export function getDegradedToastKey(): string {
  return DEGRADED_TOAST_KEY;
}

export function markToastShown(): void {
  __toastShown = true;
}

export function wasToastShown(): boolean {
  return __toastShown;
}

/**
 * Memory enrichment hooks call this before invoking the MCP client. When
 * degraded, returns a structured short-circuit response so the caller can
 * continue the chat flow without any further branching.
 */
export function shortCircuitIfDegraded(): IjfwInvokeResult | null {
  if (ijfwMcpClient.getMode() === 'degraded') {
    return { ok: false, error: 'IJFW MCP unavailable', errorReason: 'unavailable' };
  }
  return null;
}

/** Test-only - reset the per-session toast latch. */
export function __resetDegradedModeForTests(): void {
  __toastShown = false;
}
