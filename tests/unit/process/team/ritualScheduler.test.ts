/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Unit tests for the Standing-Company ritual scheduler. Covers:
//   - cadenceToCronExpr parses every shape bundle rituals use today and
//     rejects malformed inputs without throwing
//   - CronRitualScheduler.installRituals: walks resolver output, creates one
//     cron per ritual on the leader's conversation, sets agentType from the
//     leader, uses bypassUniqueGuard so multiple rituals can coexist
//   - installRituals is a no-op when sourceLauncherId is absent
//   - installRituals is a no-op when resolver returns undefined / empty
//   - installRituals warns + skips when a cadence cannot be parsed
//   - uninstallRituals removes every agent-created cron on the leader's
//     conversation (the only ones the install path produces)

import { describe, expect, it, vi } from 'vitest';

vi.mock('@office-ai/platform', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

vi.mock('@process/extensions/ExtensionRegistry', () => ({
  ExtensionRegistry: { getInstance: vi.fn(() => ({ getAssistants: () => [] })) },
}));

import { cadenceToCronExpr, CronRitualScheduler, type RitualsResolver } from '@process/team/ritualScheduler';
import type { CronService } from '@process/services/cron/CronService';
import type { CronJob } from '@process/services/cron/CronStore';
import type { TTeam } from '@process/team/types';

function makeTeam(overrides: Partial<TTeam> = {}): TTeam {
  return {
    id: 'team-1',
    userId: 'user-1',
    name: 'Sales Org',
    workspace: '/tmp/ws',
    workspaceMode: 'shared',
    leaderAgentId: 'slot-leader',
    sourceLauncherId: 'sales-org',
    agents: [
      {
        slotId: 'slot-leader',
        conversationId: 'conv-leader',
        role: 'leader',
        agentType: 'claude',
        agentName: 'Sales Lead',
        conversationType: 'claude',
        status: 'idle',
      },
      {
        slotId: 'slot-r',
        conversationId: 'conv-research',
        role: 'teammate',
        agentType: 'claude',
        agentName: 'Research',
        conversationType: 'claude',
        status: 'idle',
      },
    ],
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

function makeCronService(overrides: Partial<CronService> = {}): CronService {
  return {
    addJob: vi.fn().mockResolvedValue({} as CronJob),
    listJobsByConversation: vi.fn().mockResolvedValue([]),
    removeJob: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as CronService;
}

describe('cadenceToCronExpr', () => {
  it.each([
    ['weekly:monday:08:00', '0 8 * * 1'],
    ['weekly:sunday:18:00', '0 18 * * 0'],
    ['weekly:friday:23:59', '59 23 * * 5'],
    ['weekly:MONDAY:09:00', '0 9 * * 1'], // case-insensitive
    ['daily:07:30', '30 7 * * *'],
    ['daily', '0 9 * * *'],
    // Monthly: <dom>:<HH>:<MM>
    ['monthly:1:09:00', '0 9 1 * *'],
    ['monthly:15:14:30', '30 14 15 * *'],
    ['monthly:31:23:59', '59 23 31 * *'],
    // Quarterly: defaults to 1st of Jan/Apr/Jul/Oct
    ['quarterly:09:00', '0 9 1 1,4,7,10 *'],
    ['quarterly:14:30', '30 14 1 1,4,7,10 *'],
    // Quarterly with explicit day-of-month
    ['quarterly:15:09:00', '0 9 15 1,4,7,10 *'],
    // Annual: <month>:<dom>:<HH>:<MM>
    ['annual:1:1:10:00', '0 10 1 1 *'],
    ['annual:january:1:10:00', '0 10 1 1 *'],
    ['annual:JAN:1:10:00', '0 10 1 1 *'],
    ['annual:december:31:23:59', '59 23 31 12 *'],
    ['annual:july:4:09:00', '0 9 4 7 *'],
  ])('parses %s → %s', (cadence, expected) => {
    expect(cadenceToCronExpr(cadence)).toBe(expected);
  });

  it.each([
    'weekly:funday:08:00',
    'weekly:monday:25:00',
    'weekly:monday:08:60',
    'weekly:monday',
    'weekly',
    'hourly',
    'daily:08',
    'daily:08:99',
    '',
    'nonsense',
    // Monthly malformed
    'monthly:0:09:00',
    'monthly:32:09:00',
    'monthly:abc:09:00',
    'monthly:1:25:00',
    'monthly:1:09',
    // Quarterly malformed
    'quarterly',
    'quarterly:25:00',
    'quarterly:09:60',
    'quarterly:0:09:00',
    'quarterly:32:09:00',
    // Annual malformed
    'annual:0:1:09:00',
    'annual:13:1:09:00',
    'annual:funtember:1:09:00',
    'annual:1:0:09:00',
    'annual:1:32:09:00',
    'annual:1:1:25:00',
    'annual:1:1',
  ])('rejects malformed cadence %s', (cadence) => {
    expect(cadenceToCronExpr(cadence)).toBeNull();
  });
});

describe('CronRitualScheduler.installRituals', () => {
  it('creates one cron per ritual with leader as the target', async () => {
    const resolver: RitualsResolver = vi.fn().mockResolvedValue([
      { name: 'weekly-checkin', cadence: 'weekly:monday:08:00' },
      { name: 'standup', cadence: 'daily:09:00' },
    ]);
    const cronService = makeCronService();
    const scheduler = new CronRitualScheduler(cronService, resolver);

    await scheduler.installRituals(makeTeam());

    expect(cronService.addJob).toHaveBeenCalledTimes(2);
    const first = vi.mocked(cronService.addJob).mock.calls[0][0];
    expect(first).toMatchObject({
      name: 'Sales Org · weekly-checkin',
      conversationId: 'conv-leader',
      conversationTitle: 'Sales Org',
      agentType: 'claude',
      createdBy: 'agent',
      executionMode: 'existing',
      bypassUniqueGuard: true,
      schedule: { kind: 'cron', expr: '0 8 * * 1', description: 'weekly:monday:08:00' },
    });
    expect(first.message).toContain('weekly-checkin');
    expect(first.message).toContain('Sales Org');
    expect(first.agentConfig).toMatchObject({
      backend: 'claude',
      name: 'Sales Lead',
      mode: 'bypassPermissions',
      workspace: '/tmp/ws',
    });
  });

  it('clears prior rituals before installing so re-promotion is idempotent', async () => {
    const stale: CronJob = {
      id: 'stale',
      name: 'stale',
      enabled: true,
      schedule: { kind: 'cron', expr: '0 0 * * *', description: 'old' },
      target: { payload: { kind: 'message', text: '' }, executionMode: 'existing' },
      metadata: {
        conversationId: 'conv-leader',
        agentType: 'claude',
        createdBy: 'agent',
        createdAt: 0,
        updatedAt: 0,
        // v0.4.7.1 (ENGINE-2) - the stale prior ritual carries the ritual
        // tag set by installRituals. Without it the uninstall filter
        // would (correctly) skip it as if it were a user-NL-scheduled cron.
        agentConfig: {
          backend: 'claude',
          name: 'leader',
          configOptions: { kind: 'ritual' },
        },
      },
      state: { runCount: 0, retryCount: 0, maxRetries: 3 },
    };
    const cronService = makeCronService({
      listJobsByConversation: vi.fn().mockResolvedValue([stale]),
    });
    const resolver: RitualsResolver = vi
      .fn()
      .mockResolvedValue([{ name: 'weekly-checkin', cadence: 'weekly:monday:08:00' }]);
    const scheduler = new CronRitualScheduler(cronService, resolver);

    await scheduler.installRituals(makeTeam());

    expect(cronService.removeJob).toHaveBeenCalledWith('stale');
    expect(cronService.addJob).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when sourceLauncherId is absent', async () => {
    const resolver: RitualsResolver = vi.fn();
    const cronService = makeCronService();
    const scheduler = new CronRitualScheduler(cronService, resolver);

    await scheduler.installRituals(makeTeam({ sourceLauncherId: undefined }));

    expect(resolver).not.toHaveBeenCalled();
    expect(cronService.addJob).not.toHaveBeenCalled();
  });

  it('is a no-op when resolver returns undefined or empty', async () => {
    const cronService = makeCronService();
    const sched1 = new CronRitualScheduler(cronService, vi.fn().mockResolvedValue(undefined));
    await sched1.installRituals(makeTeam());
    const sched2 = new CronRitualScheduler(cronService, vi.fn().mockResolvedValue([]));
    await sched2.installRituals(makeTeam());
    expect(cronService.addJob).not.toHaveBeenCalled();
  });

  it('skips rituals with unparseable cadence but installs the rest', async () => {
    const resolver: RitualsResolver = vi.fn().mockResolvedValue([
      { name: 'good', cadence: 'weekly:monday:08:00' },
      { name: 'bad', cadence: 'every-fortnight' },
    ]);
    const cronService = makeCronService();
    const scheduler = new CronRitualScheduler(cronService, resolver);

    await scheduler.installRituals(makeTeam());

    expect(cronService.addJob).toHaveBeenCalledTimes(1);
    expect(vi.mocked(cronService.addJob).mock.calls[0][0].name).toBe('Sales Org · good');
  });

  it('does nothing when the team has no leader conversation', async () => {
    const team = makeTeam({
      agents: [
        {
          slotId: 'slot-leader',
          conversationId: '',
          role: 'leader',
          agentType: 'claude',
          agentName: 'Lead',
          conversationType: 'claude',
          status: 'idle',
        },
      ],
    });
    const resolver: RitualsResolver = vi.fn().mockResolvedValue([{ name: 'weekly', cadence: 'weekly:monday:08:00' }]);
    const cronService = makeCronService();
    const scheduler = new CronRitualScheduler(cronService, resolver);

    await scheduler.installRituals(team);

    expect(cronService.addJob).not.toHaveBeenCalled();
  });

  it('survives a resolver throw without surfacing the error', async () => {
    const resolver: RitualsResolver = vi.fn().mockRejectedValue(new Error('registry not ready'));
    const cronService = makeCronService();
    const scheduler = new CronRitualScheduler(cronService, resolver);

    await expect(scheduler.installRituals(makeTeam())).resolves.toBeUndefined();
    expect(cronService.addJob).not.toHaveBeenCalled();
  });
});

describe('CronRitualScheduler.uninstallRituals', () => {
  it('removes only ritual-tagged crons on the leader conversation, leaves user crons + agent-NL-scheduled crons untouched', async () => {
    // v0.4.7.1 (ENGINE-2) - uninstall now requires the explicit
    // `configOptions.kind === 'ritual'` tag, not just createdBy:'agent'.
    // MessageMiddleware tags user-NL-scheduled crons with createdBy:'agent'
    // too; sweeping them on demote would silently delete user work.
    const ritual: CronJob = {
      id: 'ritual-1',
      name: 'r1',
      enabled: true,
      schedule: { kind: 'cron', expr: '0 8 * * 1', description: 'weekly:monday:08:00' },
      target: { payload: { kind: 'message', text: '' }, executionMode: 'existing' },
      metadata: {
        conversationId: 'conv-leader',
        agentType: 'claude',
        createdBy: 'agent',
        createdAt: 0,
        updatedAt: 0,
        agentConfig: {
          backend: 'claude',
          name: 'leader',
          configOptions: { kind: 'ritual' },
        },
      },
      state: { runCount: 0, retryCount: 0, maxRetries: 3 },
    };
    const userCron: CronJob = { ...ritual, id: 'user-1', metadata: { ...ritual.metadata, createdBy: 'user' } };
    const agentNlCron: CronJob = {
      ...ritual,
      id: 'agent-nl-1',
      metadata: {
        ...ritual.metadata,
        agentConfig: { backend: 'claude', name: 'leader' /* no configOptions.kind */ },
      },
    };
    const cronService = makeCronService({
      listJobsByConversation: vi.fn().mockResolvedValue([ritual, userCron, agentNlCron]),
    });
    const scheduler = new CronRitualScheduler(cronService, vi.fn());

    await scheduler.uninstallRituals(makeTeam());

    expect(cronService.removeJob).toHaveBeenCalledTimes(1);
    expect(cronService.removeJob).toHaveBeenCalledWith('ritual-1');
  });
});
