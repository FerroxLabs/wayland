/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// tests/unit/process/team/importExport/exportTeam.test.ts
//
// W4 (T4.1) - verify that exported JSON is whitelist-only AND that the
// output is itself a valid input to the import schema (round-trip).

import { describe, it, expect } from 'vitest';
import { buildTeamExport, serializeTeamExport } from '@process/team/importExport/exportTeam';
import { TeamExportSchema } from '@process/team/importExport/TeamExportSchema';
import type { TTeam } from '@process/team/types';

function makeTeam(overrides: Partial<TTeam> = {}): TTeam {
  return {
    id: 'team-export-1',
    userId: 'user-1',
    name: 'Affiliate Engine',
    workspace: '/private/workspace/should-not-leak',
    workspaceMode: 'shared',
    leaderAgentId: 'slot-leader',
    agents: [
      {
        slotId: 'slot-leader',
        conversationId: 'conv-leader-should-not-leak',
        role: 'leader',
        agentType: 'gemini',
        agentName: 'Stream',
        conversationType: 'gemini',
        status: 'idle',
        customAgentId: 'ext-affiliate-site-engine',
      },
      {
        slotId: 'slot-1',
        conversationId: 'conv-1-should-not-leak',
        role: 'teammate',
        agentType: 'gemini',
        agentName: 'Scout',
        conversationType: 'gemini',
        status: 'idle',
        customAgentId: 'ext-research',
      },
    ],
    sourceLauncherId: 'ext-affiliate-site-engine',
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

describe('buildTeamExport - whitelist enforcement', () => {
  it('drops every secret-bearing field - JSON output contains no apiKey/env/workspace/conversationId/mailbox/task tokens', async () => {
    const team = makeTeam();
    const payload = await buildTeamExport(team);
    const serialized = serializeTeamExport(payload);
    // Token-by-token forbidden-string scan. Defensive - if any of these
    // appears verbatim in the serialized output, a future patch has
    // re-introduced a leak path.
    const forbidden = ['apiKey', 'env', 'workspace', 'conversationId', 'mailbox', 'task'];
    for (const token of forbidden) {
      expect(serialized.toLowerCase()).not.toContain(token.toLowerCase());
    }
    // Sanity: the original team really did have a workspace + conversationId.
    expect(team.workspace).toContain('should-not-leak');
  });

  it('round-trips through the import schema (export output validates as import input)', async () => {
    const team = makeTeam();
    const payload = await buildTeamExport(team);
    const result = TeamExportSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('returns rituals absent (undefined or missing key) when no source launcher resolver is provided', async () => {
    const team = makeTeam({ sourceLauncherId: undefined });
    const payload = await buildTeamExport(team);
    expect(payload.rituals).toBeUndefined();
  });

  it('includes rituals when the resolver returns a non-empty array', async () => {
    const team = makeTeam();
    const payload = await buildTeamExport(team, async () => [
      { name: 'Weekly review', cadence: 'weekly' },
    ]);
    expect(payload.rituals).toEqual([{ name: 'Weekly review', cadence: 'weekly' }]);
  });
});
