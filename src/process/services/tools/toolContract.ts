/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared contract for the MCP tool-scaling build (#344 Lane 3 + #348 Lane 2).
 * Authoritative boundary defined by the #348 ruling — both lanes import these
 * exact shapes; keep them in lockstep with that ruling.
 *
 * Lane 2 (#348) builds the candidate pool: every ENABLED + connected MCP
 * server's tools, filtered by the per-server `IMcpServer.allowedTools` toggle
 * (absent => all). It IMPLEMENTS `GetCandidateTools` and never writes
 * `configBridge.allow_list`.
 *
 * Lane 3 (#344, this lane) ranks those candidates against the conversation
 * context (BM25) and caps them to the active provider's tool-array limit, then
 * writes the selection to `configBridge.allow_list`. It IMPLEMENTS
 * `SelectToolsForSession` and OWNS the allow_list writer.
 */

/** A single MCP tool offered as a candidate for per-session selection. */
export type CandidateTool = {
  /** Owning MCP server id. */
  serverId: string;
  /** Tool name exactly as the engine/provider sees it. */
  name: string;
  /** Human description — used for BM25 ranking and the management UI. */
  description: string;
};

/**
 * Per-provider hard cap on the tool array a single request may carry (OpenAI's
 * limit is 128). The selector leaves headroom under this for built-in/engine
 * tools rather than filling it to the brim.
 */
export const PROVIDER_TOOL_LIMITS: Record<string, number> = {
  openai: 128,
  'gpt-5': 128,
};

/** Lane 2 implements; Lane 3 consumes. Returns the candidate pool to rank + cap. */
export type GetCandidateTools = () => CandidateTool[];

/**
 * Lane 3 implements. Ranks `candidates` against `context` and returns the names
 * of the tools to keep for the session, capped to `providerId`'s limit.
 */
export type SelectToolsForSession = (candidates: CandidateTool[], providerId: string, context: string) => string[];
