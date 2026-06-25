/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export type FluxManagedTool = {
  id: string;
  status: 'routed' | 'drifted' | string;
  configPath: string;
  managedHash: string;
};

export type FluxDesktopState =
  | {
      kind: 'DAEMON_RUNNING';
      daemonVersion: string;
      upstreamBase: string;
      apiKeyConfigured: boolean;
      defaultTier: string | null;
      tools: FluxManagedTool[];
    }
  | { kind: 'INSTALLED_NOT_RUNNING' }
  | { kind: 'KEY_ONLY' }
  | { kind: 'NONE' };
