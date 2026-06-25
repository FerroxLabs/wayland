/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import {
  getFullAutoMode,
  isAutoGuardedMode,
  mapModeForAcpBridge,
  shouldAutoApproveAcpEdit,
} from '@/common/types/agentModes';

describe('shouldAutoApproveAcpEdit', () => {
  it('auto-approves edit tools in acceptEdits mode', () => {
    expect(shouldAutoApproveAcpEdit('acceptEdits', 'edit')).toBe(true);
  });

  it('does NOT auto-approve execute tools in acceptEdits mode', () => {
    expect(shouldAutoApproveAcpEdit('acceptEdits', 'execute')).toBe(false);
  });

  it('does NOT auto-approve read tools in acceptEdits mode', () => {
    expect(shouldAutoApproveAcpEdit('acceptEdits', 'read')).toBe(false);
  });

  it('does NOT auto-approve edits in default mode', () => {
    expect(shouldAutoApproveAcpEdit('default', 'edit')).toBe(false);
  });

  it('does NOT auto-approve edits in plan mode', () => {
    expect(shouldAutoApproveAcpEdit('plan', 'edit')).toBe(false);
  });

  it('handles undefined mode and kind without throwing', () => {
    expect(shouldAutoApproveAcpEdit(undefined, 'edit')).toBe(false);
    expect(shouldAutoApproveAcpEdit('acceptEdits', undefined)).toBe(false);
  });
});

describe('getFullAutoMode', () => {
  it('returns the guarded-auto mode for claude (not raw bypassPermissions)', () => {
    expect(getFullAutoMode('claude')).toBe('autoGuarded');
  });

  it('falls back to yolo for unknown backends', () => {
    expect(getFullAutoMode('unknown-backend')).toBe('yolo');
    expect(getFullAutoMode(undefined)).toBe('yolo');
  });
});

describe('autoGuarded mode (Autopilot guardrail)', () => {
  it('isAutoGuardedMode is true only for the guarded value', () => {
    expect(isAutoGuardedMode('autoGuarded')).toBe(true);
    expect(isAutoGuardedMode('bypassPermissions')).toBe(false);
    expect(isAutoGuardedMode('default')).toBe(false);
    expect(isAutoGuardedMode(undefined)).toBe(false);
  });

  it('maps autoGuarded to the bridge default mode, leaving real modes untouched', () => {
    // The bridge does not understand "autoGuarded"; it must receive "default"
    // so it escalates risky tool calls as permission requests Wayland can gate.
    expect(mapModeForAcpBridge('autoGuarded')).toBe('default');
    expect(mapModeForAcpBridge('default')).toBe('default');
    expect(mapModeForAcpBridge('acceptEdits')).toBe('acceptEdits');
    expect(mapModeForAcpBridge('bypassPermissions')).toBe('bypassPermissions');
    expect(mapModeForAcpBridge('plan')).toBe('plan');
  });
});
