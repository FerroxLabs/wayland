/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IMcpServer } from '@/common/config/storage';

/**
 * Contract for the desktop MCP candidate-tool pool (#348 Lane 2).
 *
 * Lane 2 builds the candidate pool: every ENABLED + connected MCP server's
 * tools, filtered by the per-server `IMcpServer.allowedTools` toggle
 * (absent => all). This is the desktop's user-facing tool-scoping surface
 * (#347 overview + #348 per-server/per-conversation selection).
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
 * Builds the candidate pool from the loaded MCP servers: each ENABLED +
 * connected server's tools, filtered by its `allowedTools` toggle
 * (absent => all). Pure and synchronous — the caller loads the servers (an
 * async source with no sync snapshot) and passes them in, so this stays
 * trivially testable and free of I/O.
 */
export type GetCandidateTools = (servers: readonly IMcpServer[]) => CandidateTool[];
