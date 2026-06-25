/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Stdio MCP subprocess entrypoint for `wayland_search_skills`.
 *
 * Bundled by `scripts/build-mcp-servers.js` into
 * `out/main/builtin-mcp-search-skills.js`, packaged as `app.asar.unpacked`,
 * and spawned by ACP/Gemini/wcore agent sessions via `mcp.config`.
 *
 * The tool exposes the second channel of the two-channel skill architecture:
 * the native channel ships only `_builtin + pinned + enabledSkills`; the full
 * 2,105-entry library is reachable ONLY through this MCP tool.
 *
 * `SkillLibrary.loadBody` returns null for blocked entries, and this server
 * additionally filters them defensively before the body load (defense-in-depth).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  BUILTIN_READ_SKILL_TOOL_NAME,
  BUILTIN_SEARCH_SKILLS_NAME,
  BUILTIN_SEARCH_SKILLS_TOOL_NAME,
} from './constants';
import { createSearchSkillsServer } from './searchSkillsServer';

const SEARCH_TOOL_DESCRIPTION = `Search the full Wayland skill library (~2,000+ entries) by natural-language query. Returns lightweight metadata by default so you can pick the right skill before pulling its full instructions.

When to use:
- The user's task hints at a domain not covered by the small set of skills already loaded in your context (those advertised in the system prompt).
- You need a specific recipe (e.g., "stripe webhook signing", "diff two PDFs", "git rebase recovery") that is not currently visible.

How it works (two steps):
1. Search returns up to \`limit\` ranked results (default 5). Each has \`name\`, \`description\`, \`score\`, a short \`excerpt\`, and \`bodyChars\`/\`bodyTokenEstimate\` so you know how big the full skill is.
2. To read a skill, either set \`includeBody: true\` here (bodies are inlined but capped at \`maxBodyChars\`, default 2000) for a quick peek, or call \`${BUILTIN_READ_SKILL_TOOL_NAME}\` to read the full body page-by-page.
- Lexical BM25 retrieval over titles + descriptions + tags + metadata.
- Blocked or quarantined skills are NEVER returned.

Input:
- \`query\`: natural-language description of what you are trying to do. Be specific.
- \`limit\`: optional; max results to return (default 5, max 50).
- \`includeBody\`: optional; when true, inline each body capped at \`maxBodyChars\` (limited to a few results to keep output small).
- \`maxBodyChars\`: optional; per-body character cap when \`includeBody\` is true (default 2000).`;

const READ_TOOL_DESCRIPTION = `Read the full markdown body of one Wayland skill by exact \`name\` (use \`${BUILTIN_SEARCH_SKILLS_TOOL_NAME}\` first to find the name). Paginated so large skills don't exceed your context limits.

How it works:
- Returns the slice starting at \`offset\` for up to \`maxChars\` characters (default 8000), plus \`totalChars\` and \`nextOffset\`.
- If \`nextOffset\` is non-null, call again with that value to read the next page; null means you've reached the end.
- Blocked, quarantined, or unknown skills return \`found: false\`.

Input:
- \`name\`: exact skill name from a prior search result.
- \`offset\`: optional; character index to start at (default 0; pass the previous \`nextOffset\`).
- \`maxChars\`: optional; max characters to return this page (default 8000, max 20000).`;

async function main(): Promise<void> {
  const server = new McpServer({
    name: BUILTIN_SEARCH_SKILLS_NAME,
    version: '1.0.0',
  });

  const handler = createSearchSkillsServer();

  server.tool(
    BUILTIN_SEARCH_SKILLS_TOOL_NAME,
    SEARCH_TOOL_DESCRIPTION,
    {
      query: z.string().describe('Natural-language description of the task or topic to find skills for.'),
      limit: z
        .number()
        .int()
        .positive()
        .max(50)
        .optional()
        .describe('Optional. Maximum number of skills to return (default 5, max 50).'),
      includeBody: z
        .boolean()
        .optional()
        .describe('Optional. When true, inline each skill body capped at maxBodyChars (default false).'),
      maxBodyChars: z
        .number()
        .int()
        .positive()
        .max(4000)
        .optional()
        .describe('Optional. Per-body character cap when includeBody is true (default 2000, max 4000).'),
    },
    async ({ query, limit, includeBody, maxBodyChars }) => {
      try {
        const result = await handler.call({ query, limit, includeBody, maxBodyChars });
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: `wayland_search_skills error: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    BUILTIN_READ_SKILL_TOOL_NAME,
    READ_TOOL_DESCRIPTION,
    {
      name: z.string().describe('Exact skill name from a prior wayland_search_skills result.'),
      offset: z
        .number()
        .int()
        .nonnegative()
        .optional()
        .describe('Optional. Character index to start reading from (default 0; pass the previous nextOffset).'),
      maxChars: z
        .number()
        .int()
        .positive()
        .max(20000)
        .optional()
        .describe('Optional. Maximum characters to return this page (default 8000, max 20000).'),
    },
    async ({ name, offset, maxChars }) => {
      try {
        const result = await handler.readSkill({ name, offset, maxChars });
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: `wayland_read_skill error: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('[SearchSkillsMCP] Fatal error:', error);
  process.exit(1);
});
