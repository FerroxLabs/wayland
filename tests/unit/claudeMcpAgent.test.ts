/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import { describe, expect, it } from 'vitest';
import type { IMcpServer } from '../../src/common/config/storage';
import {
  buildClaudeStdioJsonConfig,
  isClaudeMcpAbsentDetail,
  isClaudeMcpNameTakenDetail,
} from '../../src/process/services/mcpServices/agents/ClaudeMcpAgent';
import { execErrorDetail } from '../../src/process/utils/safeExec';

/**
 * Rejection shape `safeExecFile` produces on a non-zero exit: a fixed message,
 * with the process output carried on `stdout`/`stderr` properties.
 */
const execFailure = (stderr: string, code = 1): Error =>
  Object.assign(new Error(`Command failed with exit code ${code}`), { stdout: '', stderr, code });

describe('ClaudeMcpAgent helpers', () => {
  it('builds stdio MCP JSON config including env vars', () => {
    const server: IMcpServer = {
      id: 'builtin-image-gen',
      name: 'wayland-image-generation',
      enabled: true,
      transport: {
        type: 'stdio',
        command: 'node',
        args: ['/abs/builtin-mcp-image-gen.js'],
        env: {
          WAYLAND_IMG_PLATFORM: 'openai',
          WAYLAND_IMG_MODEL: 'gpt-image-1',
        },
      },
      createdAt: 1,
      updatedAt: 1,
      originalJson: '{}',
    };

    expect(JSON.parse(buildClaudeStdioJsonConfig(server))).toEqual({
      command: 'node',
      args: ['/abs/builtin-mcp-image-gen.js'],
      env: {
        WAYLAND_IMG_PLATFORM: 'openai',
        WAYLAND_IMG_MODEL: 'gpt-image-1',
      },
    });
  });
});

/**
 * Every string below is the verbatim stderr of the real Claude Code CLI,
 * captured by running the command. They are the whole point of these tests:
 * the previous classifiers were written against invented wordings
 * ("not found", "does not exist") that the CLI never emits.
 */
describe('ClaudeMcpAgent CLI failure classification', () => {
  it('does not classify from error.message, which never carries the CLI wording', () => {
    // The trap that made the absent-server check dead code: safeExecFile fixes
    // the message and puts the CLI's words on `stderr`. Asserted first so a
    // future refactor back to `error.message` fails here with the reason.
    const failure = execFailure('No MCP server named "tvcontrol" in user scope');
    expect(failure.message).toBe('Command failed with exit code 1');
    expect(isClaudeMcpAbsentDetail(failure.message)).toBe(false);
    expect(isClaudeMcpAbsentDetail(execErrorDetail(failure))).toBe(true);
  });

  it.each([
    ['user scope', 'No MCP server named "tvcontrol" in user scope'],
    ['local scope', 'No MCP server named "tvcontrol" in local scope'],
    ['project scope', 'No MCP server named "tvcontrol" in .mcp.json'],
  ])('treats removal from an empty %s as absence, not failure', (_scope, stderr) => {
    expect(isClaudeMcpAbsentDetail(execErrorDetail(execFailure(stderr)))).toBe(true);
  });

  it('treats a taken name as replaceable rather than a publication failure', () => {
    const detail = execErrorDetail(execFailure('MCP server tvcontrol already exists in user config'));
    expect(isClaudeMcpNameTakenDetail(detail)).toBe(true);
    // A taken name is not an absence; misrouting it would make publication
    // silently report success without writing anything.
    expect(isClaudeMcpAbsentDetail(detail)).toBe(false);
  });

  it('still reports a real failure as a failure', () => {
    // Negative control. Without it, `() => true` would satisfy every
    // assertion above and both defects would reappear as silent successes.
    const denied = execErrorDetail(execFailure("EACCES: permission denied, open '/Users/x/.claude.json'"));
    expect(isClaudeMcpAbsentDetail(denied)).toBe(false);
    expect(isClaudeMcpNameTakenDetail(denied)).toBe(false);

    const timeout = execErrorDetail(Object.assign(new Error('Command timed out after 5000ms'), { killed: true }));
    expect(isClaudeMcpAbsentDetail(timeout)).toBe(false);
    expect(isClaudeMcpNameTakenDetail(timeout)).toBe(false);
  });
});
