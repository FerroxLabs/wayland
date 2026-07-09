/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { KnowledgeDraftResult } from '@/renderer/services/ProjectDraftService';

/**
 * Client-side backstop for the desktop IPC draft call (#684). The HTTP route
 * already carries its own deadline (`AbortSignal.timeout`, #682), but the
 * bridge `invoke()` wire protocol has no reject path: an invocation dropped or
 * rejected by the remote adapter simply never answers, leaving the promise
 * pending forever. The provider aborts its LLM call at 90s, so anything past
 * this deadline is a transport that will never answer.
 *
 * Kept in its own module (not ProjectDraftService) so the wizard's IPC path
 * can use it without widening the ProjectDraftService import surface.
 */
export const DRAFT_TIMEOUT_MS = 120_000;

/**
 * Settle a draft promise no matter what the transport does (#684), using the
 * #682 failure classes so the wizard shows the right message:
 *  - result arrives in time → passed through unchanged
 *  - transport rejects      → 'bridge' (backend unreachable) + cause
 *  - nothing ever settles   → 'timeout' when the deadline fires
 */
export function withDraftTimeout(
  result: Promise<KnowledgeDraftResult>,
  timeoutMs: number = DRAFT_TIMEOUT_MS
): Promise<KnowledgeDraftResult> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ draft: '', error: 'timeout' }), timeoutMs);
    result
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err: unknown) => {
        clearTimeout(timer);
        const detail = err instanceof Error ? err.message : '';
        resolve({ draft: '', error: 'bridge', detail: detail || undefined });
      });
  });
}
