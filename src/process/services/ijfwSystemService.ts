/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * ijfwSystemService — Wave 1 of v0.6.3 IJFW integration.
 *
 * Replaces the v0.6.2 `ijfwAutoInstallService`. Responsibilities:
 *   1. Detect a local IJFW install at `~/.ijfw/mcp-server` (lstat — symlink safe)
 *      and fall back to a PATH probe for CLI-only installs.
 *   2. Resolve the latest `@ijfw/install` version published to npm (via the
 *      Wave 0 `safeSpawn` wrapper — trusted npm CLI, allowlisted env).
 *   3. Bootstrap on first boot when no install is present; upgrade in place
 *      to a `.pending` directory when one is present and out of date.
 *   4. Activate `.pending` on the next boot via the full JSON-RPC envelope
 *      spawn-test (rolls back to `.prev` on failure).
 *   5. Surface install lifecycle via `ipcBridge.ijfw.onStatusChanged`.
 *
 * Decision 1a: we trust the npm OIDC publish chain rather than verifying a
 * (fake) on-the-wire fingerprint. The trust boundary lives at publish time.
 */

export type IjfwRuntimeMode = 'disabled' | 'enabled' | 'pending_activation';

export type IjfwDetectionResult = {
  installed: boolean;
  version?: string;
  mcpServerPath?: string;
  cliOnPath?: boolean;
  detectedVia: 'directory' | 'symlink' | 'cli' | 'none';
  pathProbe: {
    homebrew: boolean;
    usrLocal: boolean;
    standardPath: boolean;
  };
};

const NOT_IMPLEMENTED = new Error('ijfwSystemService: method not implemented yet (Wave 1 shell)');

let runtimeMode: IjfwRuntimeMode = 'disabled';

export const ijfwSystemService = {
  async detectLocalInstall(): Promise<IjfwDetectionResult> {
    throw NOT_IMPLEMENTED;
  },

  async getLatestPublished(): Promise<string | null> {
    throw NOT_IMPLEMENTED;
  },

  async bootstrap(): Promise<void> {
    throw NOT_IMPLEMENTED;
  },

  async applyPendingUpgrade(): Promise<void> {
    throw NOT_IMPLEMENTED;
  },

  getRuntimeMode(): IjfwRuntimeMode {
    return runtimeMode;
  },
};

/** Test-only — reset module-level state. */
export function __setRuntimeModeForTests(mode: IjfwRuntimeMode): void {
  runtimeMode = mode;
}
