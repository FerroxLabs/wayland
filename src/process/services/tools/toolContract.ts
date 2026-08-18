/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IMcpServer } from '@/common/config/storage';
import type { McpSessionState } from '@/common/mcp/sessionReceipt';

/**
 * Contract for the desktop MCP candidate-tool pool (#348 Lane 2).
 *
 * Lane 2 builds the candidate pool: every ENABLED + connected MCP server's
 * tools, filtered by the per-server `IMcpServer.allowedTools` toggle
 * (absent => all). This is the desktop's user-facing tool-scoping surface
 * (#347 overview + #348 per-server/per-conversation selection).
 *
 * #998 - this pool is a DESKTOP-side view, not an engine constraint. Filtering
 * here does not stop a launched engine from calling a tool it was handed; only
 * the backends in `TOOL_ALLOWLIST_ENFORCING_BACKENDS` (`@/common/mcp`) receive
 * the allowlist in their launch configuration. Do not read this contract as
 * proof that a switched-off tool is unreachable everywhere.
 *
 * Relevance ranking + the provider tool-array cap are NOT done here: per the
 * #344 architecture decision (Sean ratified), Wayland Core owns smart curation
 * (BM25 + provider-aware cap, wayland-core#86/#359), so every host (CLI,
 * desktop, json-stream) gets identical behaviour. The dormant desktop BM25
 * selector that previously lived alongside this contract was retired under #360.
 */

/** A single MCP tool offered as a candidate for the desktop tool-scoping UI. */
export type CandidateTool = {
  /** Owning MCP server id. */
  serverId: string;
  /** Tool name exactly as the engine/provider sees it. */
  name: string;
  /** Human description — surfaced in the management UI. */
  description: string;
};

/**
 * Builds the candidate pool from the CURRENT launch's correlated publication
 * receipts (MCP-01): each server the session registered with a non-empty tool
 * inventory, filtered by its `allowedTools` toggle (absent => all) - a desktop
 * view of the pool, NOT engine enforcement, see the module note above. Saved
 * `connected` status, probe state, or a stale/revoked receipt contribute
 * nothing. Pure and synchronous — the caller holds the current `McpSessionState`
 * plus the loaded servers and passes them in, so this stays trivially testable
 * and free of I/O.
 */
export type GetCandidateTools = (
  sessionState: McpSessionState | undefined,
  servers: readonly IMcpServer[]
) => CandidateTool[];
