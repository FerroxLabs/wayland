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
import { BUILTIN_SEARCH_SKILLS_NAME, BUILTIN_SEARCH_SKILLS_TOOL_NAME } from './constants';
import { createSearchSkillsServer } from './searchSkillsServer';

const TOOL_DESCRIPTION = `Search the full Wayland skill library (~2,000+ entries) by natural-language query and return the matching skill bodies inline.

When to use:
- The user's task hints at a domain not covered by the small set of skills already loaded in your context (those advertised in the system prompt).
- You need a specific recipe (e.g., "stripe webhook signing", "diff two PDFs", "git rebase recovery") that is not currently visible.

How it works:
- Lexical BM25 retrieval over titles + descriptions + tags + metadata.
- Returns up to \`limit\` ranked results (default 25). Each result has \`name\`, \`description\`, \`score\`, and the full skill \`body\` (markdown).
- Blocked or quarantined skills are NEVER returned.

After retrieval, treat the returned \`body\` as additional context: read it, follow its guidance, and cite the skill by \`name\` if relevant.

Input:
- \`query\`: natural-language description of what you are trying to do. Be specific.
- \`limit\`: optional; max number of results to return (default 25).`;

async function main(): Promise<void> {
  const server = new McpServer({
    name: BUILTIN_SEARCH_SKILLS_NAME,
    version: '1.0.0',
  });

  const handler = createSearchSkillsServer();

  server.tool(
    BUILTIN_SEARCH_SKILLS_TOOL_NAME,
    TOOL_DESCRIPTION,
    {
      query: z.string().describe('Natural-language description of the task or topic to find skills for.'),
      limit: z
        .number()
        .int()
        .positive()
        .max(100)
        .optional()
        .describe('Optional. Maximum number of skills to return (default 25, max 100).'),
    },
    async ({ query, limit }) => {
      try {
        const result = await handler.call({ query, limit: limit ?? 25 });
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

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('[SearchSkillsMCP] Fatal error:', error);
  process.exit(1);
});
