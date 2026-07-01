/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Standalone stdio MCP server for project-scoped operator tools.
 *
 * The real file/command implementation lives in the Electron main process.
 * This stdio bridge is intentionally thin: WCore talks MCP over stdio, this
 * bridge forwards each tool call over an authenticated localhost TCP socket,
 * and the main process enforces workspace containment.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { sendTcpRequest } from '@process/team/mcp/tcpHelpers';
import type { PROJECT_OPERATOR_TOOLS } from './ProjectOperatorMcpServer';

const PROJECT_OPERATOR_MCP_PORT = parseInt(process.env.PROJECT_OPERATOR_MCP_PORT || '0', 10);
const PROJECT_OPERATOR_MCP_TOKEN = process.env.PROJECT_OPERATOR_MCP_TOKEN || undefined;
const PROJECT_OPERATOR_PROJECT_ID = process.env.PROJECT_OPERATOR_PROJECT_ID || '';
const PROJECT_OPERATOR_PROJECT_NAME = process.env.PROJECT_OPERATOR_PROJECT_NAME || '';
const PROJECT_OPERATOR_WORKSPACE = process.env.PROJECT_OPERATOR_WORKSPACE || '';

process.stderr.write(
  `[project-operator-mcp-stdio] Script started. PID=${process.pid}, PORT=${PROJECT_OPERATOR_MCP_PORT || 'unset'}, PROJECT=${PROJECT_OPERATOR_PROJECT_ID || 'unset'}\n`
);

if (!PROJECT_OPERATOR_MCP_PORT) {
  process.stderr.write('PROJECT_OPERATOR_MCP_PORT environment variable is required\n');
  process.exit(1);
}

if (!PROJECT_OPERATOR_MCP_TOKEN) {
  process.stderr.write('PROJECT_OPERATOR_MCP_TOKEN environment variable is required\n');
  process.exit(1);
}

function createProjectTool(
  server: McpServer,
  toolName: (typeof PROJECT_OPERATOR_TOOLS)[number],
  description: string,
  schema: Record<string, z.ZodTypeAny>
): void {
  server.tool(toolName, description, schema, async (args: Record<string, unknown>) => {
    try {
      const response = await sendTcpRequest<{ result?: string; error?: string }>(PROJECT_OPERATOR_MCP_PORT, {
        tool: toolName,
        args,
        auth_token: PROJECT_OPERATOR_MCP_TOKEN,
      });

      if (response.error) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${response.error}` }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text' as const, text: response.result || '' }],
      };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  });
}

const server = new McpServer(
  {
    name: 'wayland-project-operator',
    version: '1.0.0',
  },
  { capabilities: { tools: {} } }
);

createProjectTool(
  server,
  'project_operator_health',
  `Verify project-chat operator readiness for the attached project.

Returns manifest-known, bridge-attached, and successfully-callable status for:
active project, workspace cwd, project file read/write, and project command execution.

Attached project:
- id: ${PROJECT_OPERATOR_PROJECT_ID}
- name: ${PROJECT_OPERATOR_PROJECT_NAME}
- workspace: ${PROJECT_OPERATOR_WORKSPACE}`,
  {}
);

createProjectTool(
  server,
  'read_project_file',
  'Read a non-secret file from the attached project workspace. The path must be relative to the project workspace.',
  {
    path: z.string().min(1).describe('Project-relative file path to read. Secret-looking paths are rejected.'),
  }
);

createProjectTool(
  server,
  'write_project_file',
  'Write a non-secret file inside the attached project workspace. The path must be relative to the project workspace.',
  {
    path: z.string().min(1).describe('Project-relative file path to write. Secret-looking paths are rejected.'),
    content: z.string().describe('Complete file content to write. Existing files are replaced.'),
  }
);

createProjectTool(
  server,
  'run_project_command',
  'Run a project-local shell command in the attached workspace, with bounded timeout and output.',
  {
    command: z.string().min(1).describe('Shell command to run in the project workspace.'),
    cwd: z
      .string()
      .optional()
      .describe('Optional project-relative working directory. Defaults to the project workspace.'),
  }
);

createProjectTool(
  server,
  'append_project_log',
  'Append a short operator note to .wayland/operator-log.md in the attached project workspace.',
  {
    message: z.string().min(1).describe('Operator note to append.'),
  }
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: unknown) => {
  process.stderr.write(`[project-operator-mcp-stdio] Fatal error: ${err}\n`);
  process.exit(1);
});
