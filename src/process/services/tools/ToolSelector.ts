/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Lane 3 (#344) tool selector. Ranks the candidate MCP tools (built by Lane 2's
 * `getCandidateTools`) against the conversation context with BM25 and caps the
 * result to the active provider's tool-array limit, so an OpenAI/gpt-5 request
 * can never exceed 128 tools (the 400 "tools array too long" error, #344).
 *
 * Reuses the proven BM25 core (`@process/utils/bm25`) shared with `SkillRetriever`
 * rather than copying the formula. Owns the selection; the `configBridge.allow_list`
 * writer + session-time injection live alongside (separate from Lane 2).
 */

import { buildBm25Index, rankBm25 } from '../../utils/bm25';
import { PROVIDER_TOOL_LIMITS } from './toolContract';
import type { CandidateTool, SelectToolsForSession } from './toolContract';

/**
 * Fallback tool-array cap for any provider NOT in `PROVIDER_TOOL_LIMITS`. Set to
 * the strictest known limit (OpenAI = 128) so a capped provider we haven't mapped
 * yet can never overflow into the 400 error (#344). A provider that could accept
 * more still gets up to this many of the MOST RELEVANT tools — ample for a turn.
 */
export const DEFAULT_PROVIDER_TOOL_LIMIT = 128;

/**
 * Slots held back under the provider cap for engine/provider BUILT-IN tools
 * (web search, etc.) that get appended outside this MCP selection — so selected
 * MCP tools + built-ins together stay under the hard limit.
 */
export const BUILTIN_TOOL_HEADROOM = 8;

/**
 * Effective MCP-tool budget for a provider: its hard cap minus built-in headroom,
 * floored at 1. Never indexes `PROVIDER_TOOL_LIMITS` unguarded — unknown
 * providers fall back to `DEFAULT_PROVIDER_TOOL_LIMIT`.
 */
export function resolveToolBudget(providerId: string): number {
  const limit = PROVIDER_TOOL_LIMITS[providerId] ?? DEFAULT_PROVIDER_TOOL_LIMIT;
  return Math.max(1, limit - BUILTIN_TOOL_HEADROOM);
}

/**
 * Select the MCP tools to expose for a session: BM25-rank `candidates` against
 * `context`, then return the (deduplicated) tool NAMES to keep, capped to the
 * provider's budget. Under budget => all candidates kept (relevance-ordered);
 * over budget => truncated to the top-N by score (context matches first, then
 * remaining tools in stable input order so the budget is used).
 */
export const selectToolsForSession: SelectToolsForSession = (
  candidates: CandidateTool[],
  providerId: string,
  context: string
): string[] => {
  const budget = resolveToolBudget(providerId);

  // Rank by "name description" vs the conversation context. rankBm25 returns only
  // docs that matched >=1 query term, most-relevant first.
  const index = buildBm25Index(candidates, (t) => `${t.name} ${t.description}`);
  const ranked = rankBm25(index, context, candidates.length).map((h) => h.ref);

  // Append candidates that matched nothing in stable input order, so an
  // under-budget set keeps everything and an over-budget set still fills the
  // budget with the next-best tools after the context matches.
  const matched = new Set(ranked);
  const ordered = [...ranked, ...candidates.filter((c) => !matched.has(c))];

  // The provider sees tool NAMES; dedupe by name so the allow_list never repeats
  // one (two servers can expose the same name). Take up to `budget` names.
  const names: string[] = [];
  const seen = new Set<string>();
  for (const tool of ordered) {
    if (seen.has(tool.name)) continue;
    seen.add(tool.name);
    names.push(tool.name);
    if (names.length >= budget) break;
  }
  return names;
};
