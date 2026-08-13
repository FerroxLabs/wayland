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
  /**
   * A tool-level default we OVERWROTE and must put back on removal.
   *
   * Registering a provider is additive, but for some tools it routes nothing
   * until you also point their default model at it (openclaw:
   * `agents.defaults.model.primary`). That overwrites a user choice, so removal
   * has to restore it rather than leaving them pointed at a provider we just
   * deleted — the difference between "restore" and "strand".
   *
   * `null` means there was no prior value and removal should delete the key.
   * Absent means this tool never touched one.
   */
  priorDefaultModel?: string | null;
  /**
   * A provider block that was ALREADY THERE under the id we write to, captured
   * verbatim so removal can put it back.
   *
   * Our provider id is not reserved. A user can legitimately have their own
   * `flux` provider — pointing at a self-hosted router, with their own key and
   * their own model rows — and for them the id collides exactly. Without this,
   * setup silently repoints their endpoint and removal deletes their block
   * wholesale, so the people most likely to click the button are the ones we
   * damage.
   *
   * `null` means the id was free and removal should delete what we added.
   */
  priorProvider?: unknown;
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
