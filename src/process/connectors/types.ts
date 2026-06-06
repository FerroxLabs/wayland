/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared types for the Flux compatibility layer. A "connector" writes a Flux
 * provider into a coding CLI's own config file (for tools that cannot route
 * via env vars), tracking a receipt so we can detect drift and roll back.
 */

// Renderer-facing types (ConnectorStatus, FluxConnectorReport) live in common so
// they can cross the IPC bridge. Re-export them here so process-side imports of
// `./types` keep working unchanged.
export type { ConnectorStatus, FluxConnectorReport } from '@/common/types/fluxConnector';

/** Persisted record of a single Flux install into a tool's config. */
export type InstallReceipt = {
  tool: string;
  /** sha256 of `provider.flux.options.baseURL=<baseURL>` (apiKey excluded). */
  managedHash: string;
  configPath: string;
  /** null when the config file did not exist before install. */
  backupPath: string | null;
  baseURL: string;
  /** ISO timestamp of the install. */
  installedAt: string;
};

/** Inputs a connector needs; tests inject paths, prod resolves real ones. */
export type ConnectorContext = {
  /** The sk-flux api key (caller supplies; never read keychain here). */
  fluxKey: string;
  /** Default FLUX_SURFACE.openai; injectable for tests. */
  baseURL: string;
  /** Path to the JSON manifest (userData/flux-connectors.json in prod). */
  manifestPath: string;
  /** Dir for full-file snapshots (userData/flux-connector-backups in prod). */
  backupDir: string;
  /** Tests set this; prod resolves the real opencode path. */
  configPathOverride?: string;
};

/** On-disk shape of the connector manifest. */
export type FluxManifest = { version: 1; tools: Record<string, InstallReceipt> };
