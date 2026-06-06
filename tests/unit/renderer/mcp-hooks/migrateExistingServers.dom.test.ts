/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, test } from 'vitest';
import {
  migrateExistingServers,
  type McpServerRecord,
} from '@renderer/hooks/mcp/migrateExistingServers';

describe('migrateExistingServers', () => {
  test("tags pre-existing servers as 'custom' if missing source", () => {
    const before = [
      { id: 'old-pg', command: 'uvx', args: ['postgres-mcp'] },
      {
        id: 'lib-gmail',
        command: 'uvx',
        args: ['workspace-mcp'],
        source: 'library' as const,
        libraryEntryId: 'io.github.taylorwilsdon/google-workspace-mcp',
      },
    ] as unknown as McpServerRecord[];
    const after = migrateExistingServers(before);
    expect(after[0].source).toBe('custom');
    expect(after[1].source).toBe('library');
  });

  test('is idempotent', () => {
    const tagged = [
      { id: 'x', command: 'npx', args: [], source: 'custom' as const },
    ] as unknown as McpServerRecord[];
    const after = migrateExistingServers(tagged);
    expect(after).toEqual(tagged);
  });

  test('returns the SAME object reference when source is already set (no-op write guard)', () => {
    // useMcpServers detects "did migration change anything?" by reference
    // equality (server !== data[idx]). If we cloned even when source was
    // present, every launch would trigger a redundant disk write.
    const tagged = [
      { id: 'a', source: 'library' as const, libraryEntryId: 'x' },
      { id: 'b', source: 'custom' as const },
    ] as unknown as McpServerRecord[];
    const after = migrateExistingServers(tagged);
    expect(after[0]).toBe(tagged[0]);
    expect(after[1]).toBe(tagged[1]);
  });

  test('preserves all original fields', () => {
    const before = [
      {
        id: 'x',
        command: 'npx',
        args: ['mcp-x'],
        env: { FOO: 'bar' },
        transport: { type: 'stdio' },
      },
    ] as unknown as McpServerRecord[];
    const [after] = migrateExistingServers(before);
    expect(after.command).toBe('npx');
    expect(after.env).toEqual({ FOO: 'bar' });
    expect((after as { transport?: { type: string } }).transport).toEqual({ type: 'stdio' });
    expect(after.source).toBe('custom');
  });
});
