/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Regression for S1: native standing teams' rituals never scheduled because
// makeExtensionRegistryRitualsResolver read ONLY the ExtensionRegistry, which
// by design EXCLUDES native records (ExtensionLoader skips the native bundle).
// Native standing teams live in getBuiltinCatalogAssistants() / config.assistants
// as `builtin-<slug>` records. The fixed resolver must resolve their rituals
// from the catalog (and config.assistants), matching the launcher id across
// bare / `builtin-` / `ext-` shapes, so installRituals creates crons.

import { describe, expect, it, vi } from 'vitest';

vi.mock('@office-ai/platform', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

// Registry is intentionally EMPTY - this is the whole point of the bug: native
// records are never in the registry, so the resolver must look elsewhere.
vi.mock('@process/extensions/ExtensionRegistry', () => ({
  ExtensionRegistry: { getInstance: vi.fn(() => ({ getAssistants: () => [] })) },
}));

const QUIET_MONEY_RITUALS = [
  { name: 'weekly-rollup', cadence: 'weekly:monday:08:00' },
  { name: 'daily-standup', cadence: 'daily:09:00' },
  { name: 'quarterly-review', cadence: 'quarterly:09:00' },
];

// The native catalog holds the standing team as a `builtin-<slug>` record.
vi.mock('@process/utils/builtinCatalog', () => ({
  getBuiltinCatalogAssistants: vi.fn(() => [
    { id: 'builtin-quiet-money-standing', standing: true, rituals: QUIET_MONEY_RITUALS },
    { id: 'builtin-some-other-team', standing: false },
  ]),
}));

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: vi.fn(async () => null) },
}));

import {
  CronRitualScheduler,
  makeExtensionRegistryRitualsResolver,
} from '@process/team/ritualScheduler';
import type { CronService } from '@process/services/cron/CronService';
import type { CronJob } from '@process/services/cron/CronStore';
import type { TTeam } from '@process/team/types';

function makeCronService(): CronService {
  return {
    addJob: vi.fn().mockResolvedValue({} as CronJob),
    listJobsByConversation: vi.fn().mockResolvedValue([]),
    removeJob: vi.fn().mockResolvedValue(undefined),
  } as unknown as CronService;
}

function makeTeam(sourceLauncherId: string): TTeam {
  return {
    id: 'team-1',
    userId: 'user-1',
    name: 'Quiet Money',
    workspace: '/tmp/ws',
    workspaceMode: 'shared',
    leaderAgentId: 'slot-leader',
    sourceLauncherId,
    agents: [
      {
        slotId: 'slot-leader',
        conversationId: 'conv-leader',
        role: 'leader',
        agentType: 'claude',
        agentName: 'Lead',
        conversationType: 'claude',
        status: 'idle',
      },
    ],
    createdAt: 1,
    updatedAt: 1,
  };
}

describe('makeExtensionRegistryRitualsResolver - native catalog records (S1)', () => {
  it('resolves rituals for a native standing team from the catalog even when the registry is empty', async () => {
    const resolver = makeExtensionRegistryRitualsResolver();
    // Stored id shape (`builtin-<slug>`).
    expect(await resolver('builtin-quiet-money-standing')).toEqual(QUIET_MONEY_RITUALS);
    // Bare slug shape (native rosters / older call sites).
    expect(await resolver('quiet-money-standing')).toEqual(QUIET_MONEY_RITUALS);
  });

  it('returns undefined for an unknown launcher', async () => {
    const resolver = makeExtensionRegistryRitualsResolver();
    expect(await resolver('builtin-does-not-exist')).toBeUndefined();
  });

  it('installRituals creates one cron per native ritual (previously zero)', async () => {
    const cronService = makeCronService();
    const scheduler = new CronRitualScheduler(cronService, makeExtensionRegistryRitualsResolver());

    await scheduler.installRituals(makeTeam('builtin-quiet-money-standing'));

    expect(cronService.addJob).toHaveBeenCalledTimes(QUIET_MONEY_RITUALS.length);
    expect(vi.mocked(cronService.addJob).mock.calls[0][0].name).toBe('Quiet Money · weekly-rollup');
  });
});
