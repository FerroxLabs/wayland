/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Renderer-facing types for the Flux compatibility-layer connectors. These
 * cross the IPC bridge, so they live in common (no Node APIs). The
 * process-internal types (InstallReceipt, ConnectorContext, FluxManifest)
 * stay in src/process/connectors/types.ts.
 */

/** Routing state of a tool relative to its install receipt. */
export type ConnectorStatus = 'routed' | 'drifted' | 'unconfigured' | 'absent';

/** Human-readable outcome of a connector action, surfaced to the user. */
export type FluxConnectorReport = {
  tool: string;
  action: 'installed' | 'already-routed' | 'updated' | 'removed' | 'noop';
  status: ConnectorStatus;
  configPath: string;
  configExistedBefore: boolean;
  backupPath: string | null;
  /** e.g. "Added provider.flux pointing at https://api.fluxrouter.ai/v1". */
  changes: string[];
  /** Copy-pasteable manual restore instruction. */
  rollbackCommand: string;
  baseURL: string;
};

/** Result of a setup-opencode request over the bridge. */
export type OpencodeSetupResult =
  | { ok: true; report: FluxConnectorReport }
  | { ok: false; reason: 'flux-not-connected' | 'error'; message?: string };

/** Result of an opencode-status request over the bridge. */
export type OpencodeStatusResult = {
  status: ConnectorStatus;
  configPath: string;
  /** opencode binary detected on PATH OR a config file present. */
  installed: boolean;
};

/** Result of a setup-codex request over the bridge. */
export type CodexSetupResult =
  | { ok: true; report: FluxConnectorReport }
  | { ok: false; reason: 'flux-not-connected' | 'error'; message?: string };

/** Result of a codex-status request over the bridge. */
export type CodexStatusResult = {
  status: ConnectorStatus;
  configPath: string;
  /** codex binary detected on PATH OR a config file present. */
  installed: boolean;
};
