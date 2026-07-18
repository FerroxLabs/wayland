/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import { resolveEffectiveWcoreRuntime } from '@process/agent/wcore/effectiveRuntime';

describe('effective Core runtime config truth', () => {
  it('reports the exact Desktop-managed profile config separately from the Desktop settings store', async () => {
    const result = await resolveEffectiveWcoreRuntime({
      rawEngineMode: false,
      desktopConfigPath: '/Users/mike/Library/Application Support/Wayland/config/wayland-config.txt',
      desktopPromptOverlayApplied: false,
      resolveActiveConfigIdentity: async () => ({
        profile: 'client-work',
        dir: '/Users/mike/.wayland/profiles/client-work',
      }),
      standaloneConfigDir: () => '/Users/mike/Library/Application Support/wayland-core',
    });

    expect(result).toEqual({
      mode: 'desktop-managed',
      profile: 'client-work',
      profileApplied: true,
      waylandHomeInjected: true,
      desktopModelOverrideApplied: true,
      desktopPromptOverlayApplied: false,
      selectedConnectorsAuthority: 'desktop',
      teamBridgePolicy: 'host-preserved',
      toolCredentialPolicy: 'allowlisted-host-forwarding',
      hostProtocolAuthority: 'desktop',
      engineConfigDir: '/Users/mike/.wayland/profiles/client-work',
      engineConfigPath: '/Users/mike/.wayland/profiles/client-work/config.toml',
      desktopConfigDir: '/Users/mike/Library/Application Support/Wayland/config',
      desktopConfigPath: '/Users/mike/Library/Application Support/Wayland/config/wayland-config.txt',
    });
    expect(result.engineConfigPath).not.toBe(result.desktopConfigPath);
  });

  it('raw mode bypasses a conflicting active profile and reports standalone Core truth', async () => {
    const resolveActiveConfigIdentity = vi.fn(async () => ({
      profile: 'client-work',
      dir: '/Users/mike/.wayland/profiles/client-work',
    }));

    const result = await resolveEffectiveWcoreRuntime({
      rawEngineMode: true,
      desktopConfigPath: '/Users/mike/Library/Application Support/Wayland/config/wayland-config.txt',
      desktopPromptOverlayApplied: true,
      resolveActiveConfigIdentity,
      standaloneConfigDir: () => '/Users/mike/Library/Application Support/wayland-core',
    });

    expect(result.mode).toBe('raw-engine');
    expect(result.profile).toBeNull();
    expect(result.profileApplied).toBe(false);
    expect(result.desktopModelOverrideApplied).toBe(false);
    expect(result.desktopPromptOverlayApplied).toBe(false);
    expect(result.selectedConnectorsAuthority).toBe('core');
    expect(result.teamBridgePolicy).toBe('host-preserved');
    expect(result.toolCredentialPolicy).toBe('allowlisted-host-forwarding');
    expect(result.hostProtocolAuthority).toBe('desktop');
    expect(result.waylandHomeInjected).toBe(false);
    expect(result.engineConfigPath).toBe('/Users/mike/Library/Application Support/wayland-core/config.toml');
    expect(resolveActiveConfigIdentity).not.toHaveBeenCalled();
  });

  it('fails closed when a Desktop-managed named profile cannot be resolved', async () => {
    const failure = Object.assign(new Error('active profile is invalid'), { code: 'PROFILE_ISOLATION' });
    await expect(
      resolveEffectiveWcoreRuntime({
        rawEngineMode: false,
        desktopConfigPath: '/app/wayland-config.txt',
        desktopPromptOverlayApplied: false,
        resolveActiveConfigIdentity: async () => {
          throw failure;
        },
        standaloneConfigDir: () => '/native/wayland-core',
      })
    ).rejects.toBe(failure);
  });

  it('reports a managed prompt overlay only when the caller observed an injected overlay', async () => {
    const result = await resolveEffectiveWcoreRuntime({
      rawEngineMode: false,
      desktopConfigPath: '/app/wayland-config.txt',
      desktopPromptOverlayApplied: true,
      resolveActiveConfigIdentity: async () => ({ profile: 'default', dir: '/profiles/default' }),
      standaloneConfigDir: () => '/native/wayland-core',
    });

    expect(result.desktopPromptOverlayApplied).toBe(true);
  });
});
