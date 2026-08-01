/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { dirname, join } from 'node:path';
import type { IWcoreEffectiveRuntime } from '@/common/adapter/ipcBridge';

export type EffectiveRuntimeDeps = {
  rawEngineMode: boolean;
  desktopConfigPath: string;
  /** Observed launch truth; managed mode alone does not prove an overlay exists. */
  desktopPromptOverlayApplied: boolean;
  resolveActiveConfigIdentity: () => Promise<{ profile: string; dir: string }>;
  standaloneConfigDir: () => string;
};

/**
 * Resolve the exact config identity currently selected for Desktop-launched
 * Core sessions. This is shared launch truth, not a guessed path derived in
 * React. Callers recompute it at the point of use rather than treating it as a
 * durable promise about a future session.
 *
 * Raw mode intentionally does not consult the active-profile marker: a corrupt
 * or inaccessible Desktop profile must not prevent a user from selecting the
 * standalone recovery path.
 */
export async function resolveEffectiveWcoreRuntime(deps: EffectiveRuntimeDeps): Promise<IWcoreEffectiveRuntime> {
  if (deps.rawEngineMode) {
    const engineConfigDir = deps.standaloneConfigDir();
    return {
      mode: 'raw-engine',
      profile: null,
      profileApplied: false,
      waylandHomeInjected: false,
      desktopModelOverrideApplied: false,
      desktopPromptOverlayApplied: false,
      selectedConnectorsAuthority: 'core',
      teamBridgePolicy: 'host-preserved',
      toolCredentialPolicy: 'allowlisted-host-forwarding',
      hostProtocolAuthority: 'desktop',
      engineConfigDir,
      engineConfigPath: join(engineConfigDir, 'config.toml'),
      desktopConfigDir: dirname(deps.desktopConfigPath),
      desktopConfigPath: deps.desktopConfigPath,
    };
  }

  // Resolve both values from the same profile authority used by WCoreManager.
  // Any invalid named-profile marker fails closed instead of fabricating the
  // default path in the UI.
  const identity = await deps.resolveActiveConfigIdentity();
  const profile = identity.profile;
  const engineConfigDir = identity.dir;
  return {
    mode: 'desktop-managed',
    profile,
    profileApplied: true,
    waylandHomeInjected: true,
    desktopModelOverrideApplied: true,
    desktopPromptOverlayApplied: deps.desktopPromptOverlayApplied,
    selectedConnectorsAuthority: 'desktop',
    teamBridgePolicy: 'host-preserved',
    toolCredentialPolicy: 'allowlisted-host-forwarding',
    hostProtocolAuthority: 'desktop',
    engineConfigDir,
    engineConfigPath: join(engineConfigDir, 'config.toml'),
    desktopConfigDir: dirname(deps.desktopConfigPath),
    desktopConfigPath: deps.desktopConfigPath,
  };
}
