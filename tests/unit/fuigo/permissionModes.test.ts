/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Fuigo's permission-mode contract on the Wayland side. Verified live on
 * 1.0.13 over ACP stdio: session/new advertises NO `modes`, session/set_mode
 * accepts Claude Code's ids (`bypassPermissions` -> `{}`), and the catalog it
 * advertises lists the four Flux tiers with `currentModelId: 'flux-auto'`.
 *
 * Before this contract existed every Fuigo routine started ask-first
 * (`getDefaultUnattendedMode` fell through to 'default'), an Autopilot routine
 * was not recognised as full-auto, the mode picker was empty (no static list),
 * and SessionLifecycle warned "No YOLO mode found for backend fuigo" on every
 * unattended run.
 */
import { describe, expect, it } from 'vitest';
import {
  ACP_AUTO_GUARDED_MODE,
  getDefaultUnattendedMode,
  getFullAutoMode,
  isExplicitUnattendedFullAuto,
  resolveAcpSessionModeId,
  resolveUnattendedMode,
} from '@/common/types/agentModes';
import { getAgentModes, supportsModeSwitch } from '@/renderer/utils/model/agentModes';
import { FLUX_MODEL_IDS, isFluxNativeBackend } from '@/common/config/flux';

describe('fuigo permission modes (claude vocabulary, nothing advertised)', () => {
  it('full-auto is the client-enforced guarded mode, exactly as for claude', () => {
    expect(getFullAutoMode('fuigo')).toBe(ACP_AUTO_GUARDED_MODE);
    expect(getFullAutoMode('fuigo')).toBe(getFullAutoMode('claude'));
  });

  it('an unattended run defaults to acceptEdits (edits auto-approved, commands still surface)', () => {
    expect(getDefaultUnattendedMode('fuigo')).toBe('acceptEdits');
    expect(resolveUnattendedMode('fuigo', undefined)).toBe('acceptEdits');
    expect(resolveUnattendedMode('fuigo', 'plan')).toBe('plan');
  });

  it('only a declared bypassPermissions authorises the blanket-approval flag', () => {
    expect(isExplicitUnattendedFullAuto('fuigo', 'bypassPermissions')).toBe(true);
    for (const mode of ['default', 'acceptEdits', 'plan', 'dontAsk', 'yolo', 'force', 'auto_edit', undefined]) {
      expect(isExplicitUnattendedFullAuto('fuigo', mode)).toBe(false);
    }
  });

  it('with no advertised modes, every id is sent to the engine as-is (guarded-auto maps to default)', () => {
    expect(resolveAcpSessionModeId('bypassPermissions', undefined, undefined)).toBe('bypassPermissions');
    expect(resolveAcpSessionModeId('acceptEdits', [], null)).toBe('acceptEdits');
    expect(resolveAcpSessionModeId(ACP_AUTO_GUARDED_MODE, undefined, undefined)).toBe('default');
  });

  it('the picker offers Fuigo the same static list as claude, since the engine advertises none', () => {
    expect(supportsModeSwitch('fuigo')).toBe(true);
    expect(getAgentModes('fuigo').map((m) => m.value)).toEqual([
      'default',
      'acceptEdits',
      'plan',
      'bypassPermissions',
      'dontAsk',
    ]);
    expect(getAgentModes('fuigo')).toEqual(getAgentModes('claude'));
  });
});

describe('fuigo is the Flux-native backend', () => {
  it('is the only backend whose Flux tiers are catalog models set in place', () => {
    expect(isFluxNativeBackend('fuigo')).toBe(true);
    for (const backend of ['claude', 'codex', 'qwen', 'goose', 'hermes', 'gemini', undefined, null, '']) {
      expect(isFluxNativeBackend(backend)).toBe(false);
    }
  });

  it('the four picker tiers are exactly what Fuigo advertised on session/new', () => {
    // Pinned from the live 1.0.13 catalog (probe 2026-09-12); if Fuigo drops a
    // tier from its catalog, the in-place set_model for it fails and the picker
    // must stop offering it.
    const advertised = ['flux-auto', 'flux-fast', 'flux-reasoning', 'flux-standard'];
    expect([...FLUX_MODEL_IDS].sort()).toEqual(advertised);
  });
});
