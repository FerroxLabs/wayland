/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { normalizeNpxArgsForBundledBun, resolveNpxPath } from './shellEnv';

/**
 * Resolve a stdio MCP server's launch command/args so a bare `npx` invocation
 * runs through Wayland's bundled Bun runtime instead of a system-installed npx.
 *
 * End-user machines - especially Windows, which bundles no system Node - often
 * have no `npx` on PATH, so a raw `{ command: 'npx' }` handed to a spawner dies
 * at launch. The Settings "Test Connection" probe already rewrites npx to bundled
 * Bun (`McpProtocol.testStdioConnection`), but the live chat-session injection
 * path did NOT - so a server could show green in Settings yet expose zero tools
 * in a chat (#827, Windows). Every session-injection path routes stdio commands
 * through this single rewrite so it can never diverge from the probe again.
 * Non-npx commands pass through unchanged.
 *
 * Lives in its own module (not shellEnv) so the many unit tests that `vi.mock`
 * shellEnv do not lose this export and turn calls into `undefined`.
 */
export function resolveStdioMcpCommand(command: string, args: string[]): { command: string; args: string[] } {
  if (command === 'npx') {
    return { command: resolveNpxPath({}), args: ['x', '--bun', ...normalizeNpxArgsForBundledBun(args)] };
  }
  return { command, args };
}
