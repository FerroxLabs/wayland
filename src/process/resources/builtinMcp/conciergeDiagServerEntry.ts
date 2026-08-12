/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Stdio MCP subprocess entrypoint for `wayland_concierge_diag` (Phase 2a).
 *
 * Mirrors `searchSkillsServerEntry.ts`: wraps the `createConciergeDiagServer`
 * factory in a `@modelcontextprotocol/sdk` `McpServer` over stdio. Intended to
 * be bundled by `scripts/build-mcp-servers.js` into
 * `out/main/builtin-mcp-concierge-diag.js`, packaged as `app.asar.unpacked`,
 * and spawned via `mcp.config` with the on-disk source paths injected as env
 * vars (WAYLAND_CONFIG_PATH / WAYLAND_CRON_DB / WAYLAND_PROVIDER_DB /
 * WAYLAND_WORKSPACE_DB / WAYLAND_LOG_DIR / WAYLAND_APP_CONFIG_DIR /
 * WAYLAND_ENGINE_CONFIG_DIR / WAYLAND_VOICE_MODELS_DIR /
 * WAYLAND_AGENT_INSTALL_ROOT) by `ensureBuiltinMcpServers()`.
 *
 * The last two are injected for the same reason as the rest, and the reason is
 * worth stating because both LOOK derivable here and are not:
 *   - WAYLAND_VOICE_MODELS_DIR ← `getVoiceModelsDir()`. That resolver branches
 *     on `isPackaged()` and `process.resourcesPath`; neither exists in a plain
 *     node subprocess.
 *   - WAYLAND_AGENT_INSTALL_ROOT ← `<userData>/agents`. `installPrefix.ts` and
 *     `extensions/constants.ts` both reach `@/common/platform`, whose Node
 *     fallback returns `~/.wayland-server` — a directory the app never installs
 *     agents into. Importing either here would produce a confident WRONG answer
 *     instead of an honest `available: false`.
 *
 * Strictly READ-ONLY: every tool only reads on-disk state, masks secrets to
 * last-4, and never mutates anything.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { BUILTIN_CONCIERGE_DIAG_NAME, BUILTIN_CONCIERGE_DIAG_TOOL_NAME } from './constants';
import { createConciergeDiagServer } from './conciergeDiagServer';

const CONCIERGE_DIAG_TOOL_NAME = BUILTIN_CONCIERGE_DIAG_TOOL_NAME;
const CONCIERGE_DIAG_SERVER_NAME = BUILTIN_CONCIERGE_DIAG_NAME;

const DIAG_TOOL_DESCRIPTION = `Read-only diagnostics for this Wayland install. Use it to honestly answer "why isn't X working?" — it inspects on-disk state and NEVER mutates anything. All secrets/keys are masked to their last 4 characters.

Sections (pass \`section\`, default "overview"):
- "overview": one snapshot of all sections below, PLUS \`platform\`: the OS, the architecture this build was compiled for, and whether it is running through ARM64 translation (macOS Rosetta / Windows ARM64 emulation) instead of natively, with a plain-English \`whyProblem\` when it is. Answers "why is Wayland slow / why is my fan on / why does it drain the battery on my new Mac?".
- "scheduledTasks": each scheduled task's name, enabled flag, next/last run, last error, and a plain-English \`whyNotRunning\` when an enabled task is stuck. Answers "why didn't my scheduled task run?".
- "mcp": each MCP server's name, enabled flag, status, tool count, last error, and a flag when it is enabled but exposes 0 tools. Answers "my MCP is on but has no tools".
- "providers": each connected provider's id, connection state, and error (credentials are never read or returned). Answers "why is my model provider failing?".
- "workspace": each project/conversation using a throwaway TEMPORARY workspace instead of a real folder, with a plain-English \`whyProblem\`. Answers "where did my file go?" / "Concierge can't find my files" / "it's writing to a temporary workspace".
- "configPaths": the resolved app config directory AND the separate engine config directory. Answers "where is my config?" / "there seem to be two config paths" / "a stale config survived my reinstall".
- "voice": whether the bundled on-device speech model is complete on disk (speech IN), and which local synthesizer this OS resolves to (speech OUT). Answers "why can't it hear me?" / "why doesn't it talk back?". IMPORTANT: the speech-out half reports RESOLUTION only — it does not and cannot check that a system voice is installed or that audio would be produced, so never report it as "text to speech is available".
- "agentInstalls": for each agent Wayland installed, whether its install receipt is intact, orphaned (folder with no receipt), unreadable, mismatched, or points at a program that is no longer on disk. Answers "I installed this agent and it isn't there" — the app itself cannot tell a broken install from one that never happened.
- "tvControl": whether the TVControl connector is present in settings and switched on. Answers "is TVControl set up?". IMPORTANT: this reads the settings file only — it does NOT connect to TVControl or TradingView, so never report a live chart as reachable on the strength of it.
- "recentErrors": recent redacted error/warning lines tailed from the log directory.

Output is bounded JSON. This tool cannot change settings — it only reports.`;

async function main(): Promise<void> {
  const server = new McpServer({
    name: CONCIERGE_DIAG_SERVER_NAME,
    version: '1.0.0',
  });

  const handler = createConciergeDiagServer();

  server.tool(
    CONCIERGE_DIAG_TOOL_NAME,
    DIAG_TOOL_DESCRIPTION,
    {
      section: z
        .enum([
          'overview',
          'scheduledTasks',
          'mcp',
          'providers',
          'workspace',
          'configPaths',
          'voice',
          'agentInstalls',
          'tvControl',
          'recentErrors',
        ])
        .optional()
        .describe('Which diagnostics section to return. Defaults to "overview" (all sections).'),
    },
    async ({ section }) => {
      try {
        const sections = {
          scheduledTasks: () => handler.scheduledTasks(),
          mcp: () => handler.mcpHealth(),
          providers: () => handler.providers(),
          workspace: () => handler.workspace(),
          configPaths: () => handler.configPaths(),
          voice: () => handler.voice(),
          agentInstalls: () => handler.agentInstalls(),
          tvControl: () => handler.tvControl(),
          recentErrors: () => handler.recentErrors(),
        } as const;
        const result = section && section in sections ? sections[section as keyof typeof sections]() : handler.overview();
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
              text: `${CONCIERGE_DIAG_TOOL_NAME} error: ${message}`,
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
  console.error('[ConciergeDiagMCP] Fatal error:', error);
  process.exit(1);
});
