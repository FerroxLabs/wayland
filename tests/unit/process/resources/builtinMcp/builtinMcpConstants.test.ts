/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  BUILTIN_SEARCH_SKILLS_ID,
  BUILTIN_SEARCH_SKILLS_NAME,
  BUILTIN_SEARCH_SKILLS_TOOL_NAME,
  isBuiltinSearchSkillsName,
  isBuiltinSearchSkillsTransport,
} from '@process/resources/builtinMcp/constants';

describe('builtinMcp/constants - search-skills', () => {
  it('exposes the canonical id, server name, and MCP tool name', () => {
    expect(BUILTIN_SEARCH_SKILLS_ID).toBe('builtin-search-skills');
    expect(BUILTIN_SEARCH_SKILLS_NAME).toBe('wayland-search-skills');
    expect(BUILTIN_SEARCH_SKILLS_TOOL_NAME).toBe('wayland_search_skills');
  });

  describe('isBuiltinSearchSkillsName', () => {
    it('matches the canonical name', () => {
      expect(isBuiltinSearchSkillsName(BUILTIN_SEARCH_SKILLS_NAME)).toBe(true);
    });

    it('rejects other names', () => {
      expect(isBuiltinSearchSkillsName('wayland-image-generation')).toBe(false);
      expect(isBuiltinSearchSkillsName('some-user-mcp')).toBe(false);
      expect(isBuiltinSearchSkillsName(undefined)).toBe(false);
      expect(isBuiltinSearchSkillsName(null)).toBe(false);
      expect(isBuiltinSearchSkillsName('')).toBe(false);
    });
  });

  describe('isBuiltinSearchSkillsTransport', () => {
    it('matches a stdio node transport whose args include the bundle path', () => {
      expect(
        isBuiltinSearchSkillsTransport({
          type: 'stdio',
          command: 'node',
          args: ['/abs/path/to/out/main/builtin-mcp-search-skills.js'],
        })
      ).toBe(true);
    });

    it('rejects transports that target a different builtin bundle', () => {
      expect(
        isBuiltinSearchSkillsTransport({
          type: 'stdio',
          command: 'node',
          args: ['/abs/path/to/out/main/builtin-mcp-image-gen.js'],
        })
      ).toBe(false);
    });

    it('rejects http transports and non-node commands', () => {
      expect(
        isBuiltinSearchSkillsTransport({
          type: 'http',
          command: 'node',
          args: ['/whatever/builtin-mcp-search-skills.js'],
        })
      ).toBe(false);

      expect(
        isBuiltinSearchSkillsTransport({
          type: 'stdio',
          command: 'bun',
          args: ['/whatever/builtin-mcp-search-skills.js'],
        })
      ).toBe(false);
    });

    it('handles missing or empty args defensively', () => {
      expect(isBuiltinSearchSkillsTransport({ type: 'stdio', command: 'node' })).toBe(false);
      expect(isBuiltinSearchSkillsTransport({ type: 'stdio', command: 'node', args: [] })).toBe(false);
      expect(isBuiltinSearchSkillsTransport({ type: 'stdio', command: 'node', args: null })).toBe(false);
      expect(isBuiltinSearchSkillsTransport(undefined)).toBe(false);
    });
  });
});
