/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * W-1 mitigation for Core C-5.
 *
 * Core's `ToolSearch` is not a semantic search. `tool_search.rs:120-123` (tag
 * v0.12.26) keeps a tool only when EVERY whitespace token of the query is a
 * literal substring of that tool's name or description:
 *
 *     if tokens.iter().all(|t| name_l.contains(t) || desc_l.contains(t))
 *
 * So a query holding the tool's exact name still misses when any adjacent word
 * is absent, and a longer, more natural query is strictly LESS likely to match.
 * Measured against the released binary, back to back in one session on one tool:
 *
 *     ToolSearch("probe")                                   -> match
 *     ToolSearch("wld_probe_secret tool schema parameters")  -> no match
 *
 * A model that gets nothing and rephrases more fully therefore diverges. That is
 * the discover-but-never-invoke loop: one captured session shows 28 tool calls,
 * all `ToolSearch`, 19 returning no match, on claude-sonnet-5. Punctuation is
 * part of the token too, so `aion_list_models,` never matches.
 *
 * Lives in its own module so the live end-to-end test can send the SAME bytes
 * production sends. A copy pasted into the test would drift and quietly stop
 * covering the thing it claims to cover.
 *
 * DELETE THIS once Core fixes C-5 — it is a workaround for a matcher bug, not
 * behaviour we want to own.
 */
export const TOOL_SEARCH_GUIDANCE_HEADING = '[Tool Search]' as const;

export const TOOL_SEARCH_GUIDANCE = `${TOOL_SEARCH_GUIDANCE_HEADING}
When you need an MCP tool, call ToolSearch with a SINGLE distinctive keyword — normally one word \
from the tool name, with no punctuation. Do not search with a sentence, and do not add words like \
"tool", "schema", "parameters" or "input": every extra word must also appear in the tool name or \
description or the search returns nothing. If a search returns no match, retry with a SHORTER \
query, never a longer one. As soon as a search matches, call the tool by name — searching again \
for a tool you have already found returns the same result and makes no progress.` as const;
