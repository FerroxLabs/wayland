/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import type { AcpInitializeResult } from '@/common/types/acpTypes';
import { getTeamCapableBackends, isTeamCapableBackend } from '@/common/types/teamTypes';

const withStdio = (stdio: boolean) =>
  ({ capabilities: { mcpCapabilities: { stdio } } }) as unknown as AcpInitializeResult;

describe('team-capable backend filter (#152)', () => {
  it('keeps the known-capable backends, including both engine ids', () => {
    for (const b of ['gemini', 'claude', 'codex', 'wcore', 'wayland-core']) {
      expect(isTeamCapableBackend(b, null)).toBe(true);
    }
  });

  it('drops a backend that is not known-capable and has no stdio init result (e.g. copilot)', () => {
    expect(isTeamCapableBackend('copilot', null)).toBe(false);
    expect(isTeamCapableBackend('copilot', { copilot: withStdio(false) })).toBe(false);
  });

  it('admits an unknown ACP backend only when its init result advertises stdio MCP', () => {
    expect(isTeamCapableBackend('cursor', { cursor: withStdio(true) })).toBe(true);
  });

  it('filters a detected list down to team-capable backends and never drops the engine fallback', () => {
    const detected = ['claude', 'copilot', 'wayland-core'];
    expect(getTeamCapableBackends(detected, null)).toEqual(['claude', 'wayland-core']);
  });
});
