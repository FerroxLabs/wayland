/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import type { IMcpServer } from '../../src/common/config/storage';
import { buildClaudeStdioJsonConfig } from '../../src/process/services/mcpServices/agents/ClaudeMcpAgent';

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
