/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Types for the "Migrate from another tool" importer (#migrate). Wayland can
 * pull a user's existing provider API keys, MCP servers, and default model out
 * of a sibling agent's on-disk config (Hermes, OpenClaw) so onboarding is one
 * click instead of re-pasting every credential.
 *
 * The flow mirrors Hermes's own proven OpenClaw migrator: SCAN (read-only,
 * builds a preview plan) -> user selects -> APPLY. Nothing is written during a
 * scan, and an item that already exists in Wayland is reported as `exists` and
 * skipped by default so a migration never clobbers a working setup.
 */

/** The external tools Wayland can migrate from. */
export type MigrationToolId = 'hermes' | 'openclaw';

/** What kind of thing a migration item represents. */
export type MigrationItemKind = 'provider-key' | 'mcp-server' | 'default-model';

/**
 * Whether the item is new to Wayland or already present. `exists` items are
 * unchecked by default in the UI and skipped unless the user opts in.
 */
export type MigrationItemStatus = 'new' | 'exists';

/**
 * One migratable thing found during a scan. `id` is stable within a plan so the
 * renderer can echo back the exact selection. Secret material (the key itself)
 * is NEVER carried on this object - it stays in the main process; only a
 * redacted `detail` (e.g. `sk-…abcd`) is shown.
 */
export type MigrationItem = {
  id: string;
  kind: MigrationItemKind;
  /** Human label, e.g. "Anthropic" or "filesystem (MCP)". */
  label: string;
  /** Redacted, non-sensitive descriptor, e.g. "sk-ant-…1a2b" or "stdio: npx …". */
  detail: string;
  status: MigrationItemStatus;
  /** True for items carrying credentials, so the UI can flag them. */
  sensitive: boolean;
  /** Resolved Wayland provider id for `provider-key` items. */
  providerId?: string;
};

/** The read-only result of scanning a tool's config. */
export type MigrationPlan = {
  toolId: MigrationToolId;
  /** Where the config was found, e.g. "~/.hermes". Null when the tool isn't installed. */
  sourcePath: string | null;
  /** True when a usable config directory for this tool exists on disk. */
  detected: boolean;
  items: MigrationItem[];
  /** Non-fatal problems encountered while scanning (unreadable file, parse error). */
  warnings: string[];
};

/** Outcome of applying a selected subset of a plan. */
export type MigrationResult = {
  toolId: MigrationToolId;
  applied: number;
  skipped: number;
  /** Per-item failures: the item label + a human reason (never the secret). */
  errors: Array<{ label: string; reason: string }>;
};
