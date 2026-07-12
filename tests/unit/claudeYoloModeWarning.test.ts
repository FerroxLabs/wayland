/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #749 - "No YOLO mode found for backend claude" logged every session, which reads as
 * "claude has no full-auto mode" and drove a false bug report. It is cosmetic: claude's
 * full-auto is the Wayland-internal `autoGuarded` mode, which the bridge never advertises
 * because guarded-auto is enforced client-side by the AcpAgentManager guardrail
 * (auto-approve every escalated tool except a destructive one). Full blind auto is
 * separately available via Autopilot (`bypassPermissions`).
 *
 * The load-bearing predicate SessionLifecycle now uses to suppress the false warning is
 * `isAutoGuardedMode(getFullAutoMode(backend))`. Pin it: TRUE for claude (suppress),
 * FALSE for backends whose full-auto is a real advertised agent mode (a genuinely-absent
 * mode there SHOULD still warn).
 */
import { describe, expect, it } from 'vitest';
import { getFullAutoMode, isAutoGuardedMode } from '@/common/types/agentModes';

describe('#749 claude full-auto is the internal guarded mode (warning is cosmetic)', () => {
  it("claude's full-auto is the internal autoGuarded mode -> warning suppressed", () => {
    expect(getFullAutoMode('claude')).toBe('autoGuarded');
    expect(isAutoGuardedMode(getFullAutoMode('claude'))).toBe(true);
  });

  it('backends with a real advertised full-auto mode still warn on a genuine miss', () => {
    for (const backend of ['gemini', 'qwen', 'wcore']) {
      expect(isAutoGuardedMode(getFullAutoMode(backend))).toBe(false);
    }
  });

  it('an unknown backend is not guarded-auto (falls back to yolo, still warns)', () => {
    expect(getFullAutoMode('totally-unknown')).toBe('yolo');
    expect(isAutoGuardedMode(getFullAutoMode('totally-unknown'))).toBe(false);
  });
});
