/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import { resolveAcpSessionModeId } from '@/common/types/agentModes';

describe('resolveAcpSessionModeId', () => {
  it('maps Wayland-internal autoGuarded → bridge default when no modes are advertised', () => {
    // Claude bridge advertises no top-level modes; the mapped id passes through.
    expect(resolveAcpSessionModeId('autoGuarded', undefined, null)).toBe('default');
    expect(resolveAcpSessionModeId('default', [], null)).toBe('default');
    expect(resolveAcpSessionModeId('acceptEdits', [], 'default')).toBe('acceptEdits');
  });

  it('keeps the requested mode when it is one of the advertised modes', () => {
    const modes = [{ id: 'build' }, { id: 'plan' }];
    expect(resolveAcpSessionModeId('plan', modes, 'build')).toBe('plan');
    expect(resolveAcpSessionModeId('build', modes, 'build')).toBe('build');
  });

  it('falls back to the advertised current/primary mode for opencode (#298)', () => {
    // opencode advertises build/plan and has no `default` agent. Both the literal
    // `default` and the mapped `autoGuarded → default` must resolve to `build`.
    const modes = [{ id: 'build' }, { id: 'plan' }];
    expect(resolveAcpSessionModeId('default', modes, 'build')).toBe('build');
    expect(resolveAcpSessionModeId('autoGuarded', modes, 'build')).toBe('build');
  });

  it('falls back to the first advertised mode when currentModeId is missing or invalid', () => {
    const modes = [{ id: 'build' }, { id: 'plan' }];
    expect(resolveAcpSessionModeId('default', modes, null)).toBe('build');
    expect(resolveAcpSessionModeId('default', modes, undefined)).toBe('build');
    expect(resolveAcpSessionModeId('default', modes, 'nonexistent')).toBe('build');
  });
});
