/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// tests/unit/process/team/importExport/TeamExportSchema.test.ts
//
// W4 (T4.2) - strict-mode Zod schema for v1 team imports.

import { describe, it, expect } from 'vitest';
import { TeamExportSchema } from '@process/team/importExport/TeamExportSchema';

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    version: 'v1' as const,
    id: 'team-1',
    name: 'Affiliate Engine',
    leader: { id: 'affiliate-site-engine', recommendBackend: 'gemini' },
    teammates: [
      { id: 'research', name: 'Scout', prompt: '', recommendBackend: 'gemini' },
      { id: 'copy', name: 'Quill', prompt: '', recommendBackend: 'gemini' },
    ],
    capabilities: {
      canReadFiles: false,
      canWriteFiles: false,
      canSpawnAgents: false,
      canNetworkRequest: false,
      canCrossTeamMessage: false,
    },
    ...overrides,
  };
}

describe('TeamExportSchema', () => {
  it('parses a valid v1 payload', () => {
    const result = TeamExportSchema.safeParse(validPayload());
    expect(result.success).toBe(true);
  });

  it('rejects unknown top-level fields under strict mode', () => {
    const result = TeamExportSchema.safeParse(validPayload({ extraField: 'sneaky' }));
    expect(result.success).toBe(false);
  });

  it('rejects skill IDs with / or .. or uppercase via regex', () => {
    for (const badId of ['foo/bar', '..', 'Foo', 'foo bar', 'foo.bar']) {
      const result = TeamExportSchema.safeParse(
        validPayload({
          leader: { id: badId },
        })
      );
      expect(result.success).toBe(false);
    }
  });

  it('rejects rosters larger than 20 teammates', () => {
    const teammates = Array.from({ length: 21 }, (_, i) => ({
      id: `teammate-${i}`,
      name: `T${i}`,
      prompt: '',
    }));
    const result = TeamExportSchema.safeParse(validPayload({ teammates }));
    expect(result.success).toBe(false);
  });

  it('rejects prompt strings longer than 8192 chars', () => {
    const teammates = [{ id: 'research', name: 'Scout', prompt: 'x'.repeat(8193) }];
    const result = TeamExportSchema.safeParse(validPayload({ teammates }));
    expect(result.success).toBe(false);
  });

  it('rejects payload missing the version literal', () => {
    const { version: _omitVersion, ...rest } = validPayload();
    void _omitVersion;
    const result = TeamExportSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});
