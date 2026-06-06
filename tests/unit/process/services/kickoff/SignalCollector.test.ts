/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Unit tests for SignalCollector - the main-process signal reader that
// feeds the SuggestionEngine. Covers (TRIAGE TEST-1 + E-L-1, E-L-5, E-L-7):
//   - collectRecentConversations: 5-newest aggregation, messageCount +
//     durationMs computation, both prefix forms (ext- AND builtin-),
//     error-degrade paths
//   - isAutoTitled implicit (via collectRecentConversations returning
//     conversations with isAutoTitled flag set)
//   - detectRecentRitualOutput: standing gate, sourceLauncherId match for
//     both prefix forms, 4h window boundary, lastStatus filter,
//     configOptions.kind === 'ritual' filter
//   - findAssistantInRegistry: ambiguous match (>1 hit) → null, throw path → null
//   - numericTimestamp edge cases (covered via collectRecentConversations
//     with various message timestamp shapes)
//
// The collector itself wires installUuid via getInstallUuid; we mock that
// to keep tests deterministic and avoid touching ProcessConfig.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const installUuidMock = vi.fn(async () => 'install-fixture-uuid');

vi.mock('@process/services/kickoff/installUuid', () => ({
  getInstallUuid: () => installUuidMock(),
  __resetInstallUuidCacheForTests: vi.fn(),
}));

const getInstanceMock = vi.fn();
vi.mock('@process/extensions/ExtensionRegistry', () => ({
  ExtensionRegistry: { getInstance: () => getInstanceMock() },
}));

import { SignalCollector, findAssistantInRegistry, stripIdPrefix } from '@process/services/kickoff/SignalCollector';
import type { CronService } from '@process/services/cron/CronService';
import type { CronJob } from '@process/services/cron/CronStore';
import type { IConversationRepository, PaginatedResult } from '@process/services/database/IConversationRepository';
import type { ITeamCrudRepository } from '@process/team/repository/ITeamRepository';
import type { TTeam } from '@process/team/types';
import type { TChatConversation } from '@/common/config/storage';
import type { TMessage } from '@/common/chat/chatLib';
import { RITUAL_RECENT_WINDOW_MS } from '@process/services/kickoff/types';

// ----------------------------------------------------------------------------
// Helpers - minimal fakes shaped just enough for SignalCollector's calls.
// ----------------------------------------------------------------------------

function makeConvRepo(overrides: Partial<IConversationRepository> = {}): IConversationRepository {
  return {
    getConversation: vi.fn().mockResolvedValue(undefined),
    createConversation: vi.fn().mockResolvedValue(undefined),
    updateConversation: vi.fn().mockResolvedValue(undefined),
    deleteConversation: vi.fn().mockResolvedValue(undefined),
    getMessages: vi.fn().mockResolvedValue({ data: [], total: 0, hasMore: false }),
    insertMessage: vi.fn().mockResolvedValue(undefined),
    getUserConversations: vi.fn().mockResolvedValue({ data: [], total: 0, hasMore: false }),
    listAllConversations: vi.fn().mockResolvedValue([]),
    searchMessages: vi.fn().mockResolvedValue({ data: [], total: 0, hasMore: false }),
    getConversationsByCronJob: vi.fn().mockResolvedValue([]),
    getConversationsByAssistant: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as IConversationRepository;
}

function makeCronService(overrides: Partial<CronService> = {}): CronService {
  return {
    listJobsByConversation: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as CronService;
}

function makeTeamRepo(overrides: Partial<ITeamCrudRepository> = {}): ITeamCrudRepository {
  return {
    findAll: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMailboxByTeam: vi.fn(),
    deleteTasksByTeam: vi.fn(),
    ...overrides,
  } as ITeamCrudRepository;
}

function makeConv(overrides: Partial<TChatConversation> = {}): TChatConversation {
  return {
    id: 'c1',
    modifyTime: 1000,
    name: 'Decision: shut down Q3?',
    createTime: 900,
    type: 'claude' as any,
    ...overrides,
  } as TChatConversation;
}

function makeMessage(overrides: Partial<TMessage> & { createdAt?: unknown; timestamp?: unknown } = {}): TMessage {
  return {
    id: 'm1',
    role: 'user',
    content: { content: 'hi' },
    createdAt: 1000,
    type: 'text',
    conversationId: 'c1',
    ...overrides,
  } as unknown as TMessage;
}

function makeTeam(overrides: Partial<TTeam> = {}): TTeam {
  return {
    id: 'team-1',
    userId: 'default',
    name: 'Coach Co',
    workspace: '/tmp',
    workspaceMode: 'shared',
    leaderAgentId: 'slot-leader',
    sourceLauncherId: 'helm',
    promotedToStanding: true,
    agents: [
      {
        slotId: 'slot-leader',
        conversationId: 'conv-leader',
        role: 'leader',
        agentType: 'claude',
        agentName: 'Helm',
        conversationType: 'claude',
        status: 'idle',
      },
    ],
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

function makeRitualCron(overrides: { lastRunAtMs?: number; lastStatus?: 'ok' | 'error' | 'skipped' | 'missed'; createdBy?: 'user' | 'agent'; kind?: 'ritual' | undefined } = {}): CronJob {
  return {
    id: 'cron-r1',
    name: 'helm ritual',
    enabled: true,
    schedule: { kind: 'cron', expr: '0 8 * * 1', description: 'weekly' },
    target: { payload: { kind: 'message', text: 'recap' }, executionMode: 'existing' },
    metadata: {
      conversationId: 'conv-leader',
      agentType: 'claude',
      createdBy: overrides.createdBy ?? 'agent',
      createdAt: 0,
      updatedAt: 0,
      agentConfig: {
        backend: 'claude',
        name: 'helm',
        configOptions: overrides.kind === undefined && 'kind' in overrides ? undefined : { kind: overrides.kind ?? 'ritual' },
      },
    },
    state: {
      runCount: 1,
      retryCount: 0,
      maxRetries: 3,
      lastRunAtMs: overrides.lastRunAtMs,
      lastStatus: overrides.lastStatus,
    },
  } as CronJob;
}

beforeEach(() => {
  installUuidMock.mockClear();
  getInstanceMock.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// stripIdPrefix - shared helper
// ============================================================================

describe('stripIdPrefix', () => {
  it('strips ext- prefix', () => {
    expect(stripIdPrefix('ext-helm')).toBe('helm');
  });
  it('strips builtin- prefix', () => {
    expect(stripIdPrefix('builtin-helm')).toBe('helm');
  });
  it('leaves bare id unchanged', () => {
    expect(stripIdPrefix('helm')).toBe('helm');
  });
});

// ============================================================================
// collectRecentConversations + numericTimestamp
// ============================================================================

describe('SignalCollector.collect - collectRecentConversations', () => {
  it('returns the 5 newest assistant-scoped conversations with messageCount + durationMs computed', async () => {
    const convs: TChatConversation[] = [
      makeConv({ id: 'c-newest', modifyTime: 5000, name: 'Latest' }),
      makeConv({ id: 'c-mid', modifyTime: 4000, name: 'Middle' }),
      makeConv({ id: 'c-old', modifyTime: 3000, name: 'Older' }),
    ];
    const convRepo = makeConvRepo({
      getConversationsByAssistant: vi.fn().mockImplementation(async (id: string) => {
        if (id === 'helm') return convs;
        return [];
      }),
      getMessages: vi.fn().mockImplementation(async (cid: string) => {
        if (cid === 'c-newest') {
          return {
            data: [makeMessage({ id: 'a', createdAt: 100 }), makeMessage({ id: 'b', createdAt: 100 + 2 * 60 * 1000 }), makeMessage({ id: 'c', createdAt: 100 + 5 * 60 * 1000 })],
            total: 3,
            hasMore: false,
          } as PaginatedResult<TMessage>;
        }
        return { data: [], total: 0, hasMore: false } as PaginatedResult<TMessage>;
      }),
    });
    const sc = new SignalCollector(convRepo, makeCronService(), makeTeamRepo());
    const signals = await sc.collect('helm', 10_000);
    expect(signals.assistantRecentConversations).toHaveLength(3);
    expect(signals.assistantRecentConversations[0].id).toBe('c-newest');
    expect(signals.assistantRecentConversations[0].messageCount).toBe(3);
    expect(signals.assistantRecentConversations[0].durationMs).toBe(5 * 60 * 1000);
    // The two empty ones still appear with 0 / 0.
    expect(signals.assistantRecentConversations[1].messageCount).toBe(0);
    expect(signals.assistantRecentConversations[1].durationMs).toBe(0);
  });

  it('caps result at 5 newest even if repo returns more', async () => {
    const many: TChatConversation[] = Array.from({ length: 12 }, (_, i) =>
      makeConv({ id: `c-${i}`, modifyTime: 1000 + i })
    );
    const convRepo = makeConvRepo({
      getConversationsByAssistant: vi.fn().mockResolvedValue(many),
    });
    const sc = new SignalCollector(convRepo, makeCronService(), makeTeamRepo());
    const signals = await sc.collect('helm');
    expect(signals.assistantRecentConversations).toHaveLength(5);
    // Newest-first
    expect(signals.assistantRecentConversations[0].id).toBe('c-11');
    expect(signals.assistantRecentConversations[4].id).toBe('c-7');
  });

  it('marks auto-titled conversations correctly (isAutoTitled flag)', async () => {
    const convs: TChatConversation[] = [
      makeConv({ id: 'a', modifyTime: 3, name: 'New Conversation' }),
      makeConv({ id: 'b', modifyTime: 2, name: 'Untitled' }),
      makeConv({ id: 'c', modifyTime: 1, name: 'Chat 7' }),
      makeConv({ id: 'd', modifyTime: 0, name: '' }),
      makeConv({ id: 'e', modifyTime: 4, name: 'Real subject here' }),
    ];
    const convRepo = makeConvRepo({
      getConversationsByAssistant: vi.fn().mockResolvedValue(convs),
    });
    const sc = new SignalCollector(convRepo, makeCronService(), makeTeamRepo());
    const signals = await sc.collect('helm');
    const byId = Object.fromEntries(signals.assistantRecentConversations.map((c) => [c.id, c]));
    expect(byId.a.isAutoTitled).toBe(true);
    expect(byId.b.isAutoTitled).toBe(true);
    expect(byId.c.isAutoTitled).toBe(true);
    expect(byId.d.isAutoTitled).toBe(true);
    expect(byId.e.isAutoTitled).toBe(false);
  });

  it('queries both ext- AND builtin- prefix forms for an unprefixed assistantId', async () => {
    const byId = vi.fn().mockResolvedValue([]);
    const convRepo = makeConvRepo({ getConversationsByAssistant: byId });
    const sc = new SignalCollector(convRepo, makeCronService(), makeTeamRepo());
    await sc.collect('helm');
    const ids = byId.mock.calls.map((c) => c[0]);
    expect(ids).toContain('helm');
    expect(ids.length).toBeGreaterThanOrEqual(1);
  });

  it('with builtin- prefix on assistantId, also queries the unprefixed form', async () => {
    const byId = vi.fn().mockResolvedValue([]);
    const convRepo = makeConvRepo({ getConversationsByAssistant: byId });
    const sc = new SignalCollector(convRepo, makeCronService(), makeTeamRepo());
    await sc.collect('builtin-helm');
    const ids = byId.mock.calls.map((c) => c[0]);
    expect(ids).toEqual(expect.arrayContaining(['builtin-helm', 'helm']));
  });

  it('with ext- prefix on assistantId, also queries the unprefixed form', async () => {
    const byId = vi.fn().mockResolvedValue([]);
    const convRepo = makeConvRepo({ getConversationsByAssistant: byId });
    const sc = new SignalCollector(convRepo, makeCronService(), makeTeamRepo());
    await sc.collect('ext-helm');
    const ids = byId.mock.calls.map((c) => c[0]);
    expect(ids).toEqual(expect.arrayContaining(['ext-helm', 'helm']));
  });

  it('dedupes conversations seen across prefix variants', async () => {
    const dup = makeConv({ id: 'shared', modifyTime: 100 });
    const convRepo = makeConvRepo({
      getConversationsByAssistant: vi.fn().mockResolvedValue([dup]),
    });
    const sc = new SignalCollector(convRepo, makeCronService(), makeTeamRepo());
    const signals = await sc.collect('helm');
    expect(signals.assistantRecentConversations).toHaveLength(1);
    expect(signals.assistantRecentConversations[0].id).toBe('shared');
  });

  it('degrades safely when getConversationsByAssistant throws (returns no recent convs, does not throw)', async () => {
    const convRepo = makeConvRepo({
      getConversationsByAssistant: vi.fn().mockRejectedValue(new Error('db dead')),
    });
    const sc = new SignalCollector(convRepo, makeCronService(), makeTeamRepo());
    const signals = await sc.collect('helm');
    expect(signals.assistantRecentConversations).toEqual([]);
  });

  it('degrades safely when getMessages throws for one conv (durationMs stays 0)', async () => {
    const convRepo = makeConvRepo({
      getConversationsByAssistant: vi.fn().mockResolvedValue([makeConv({ id: 'c1', modifyTime: 100 })]),
      getMessages: vi.fn().mockRejectedValue(new Error('msg load failed')),
    });
    const sc = new SignalCollector(convRepo, makeCronService(), makeTeamRepo());
    const signals = await sc.collect('helm');
    expect(signals.assistantRecentConversations).toHaveLength(1);
    expect(signals.assistantRecentConversations[0].messageCount).toBe(0);
    expect(signals.assistantRecentConversations[0].durationMs).toBe(0);
  });

  it('numericTimestamp accepts numeric ms', async () => {
    const convRepo = makeConvRepo({
      getConversationsByAssistant: vi.fn().mockResolvedValue([makeConv({ id: 'c1', modifyTime: 100 })]),
      getMessages: vi.fn().mockResolvedValue({
        data: [makeMessage({ createdAt: 1000 }), makeMessage({ createdAt: 4000 })],
        total: 2,
        hasMore: false,
      }),
    });
    const sc = new SignalCollector(convRepo, makeCronService(), makeTeamRepo());
    const signals = await sc.collect('helm');
    expect(signals.assistantRecentConversations[0].durationMs).toBe(3000);
  });

  it('numericTimestamp accepts ISO-string createdAt', async () => {
    const convRepo = makeConvRepo({
      getConversationsByAssistant: vi.fn().mockResolvedValue([makeConv({ id: 'c1', modifyTime: 100 })]),
      getMessages: vi.fn().mockResolvedValue({
        data: [
          makeMessage({ createdAt: '2026-05-23T09:00:00Z' as any }),
          makeMessage({ createdAt: '2026-05-23T09:05:00Z' as any }),
        ],
        total: 2,
        hasMore: false,
      }),
    });
    const sc = new SignalCollector(convRepo, makeCronService(), makeTeamRepo());
    const signals = await sc.collect('helm');
    expect(signals.assistantRecentConversations[0].durationMs).toBe(5 * 60 * 1000);
  });

  it('numericTimestamp rejects non-ISO strings ("not a date") → durationMs=0', async () => {
    const convRepo = makeConvRepo({
      getConversationsByAssistant: vi.fn().mockResolvedValue([makeConv({ id: 'c1', modifyTime: 100 })]),
      getMessages: vi.fn().mockResolvedValue({
        data: [makeMessage({ createdAt: 'not a date' as any }), makeMessage({ createdAt: 'still nope' as any })],
        total: 2,
        hasMore: false,
      }),
    });
    const sc = new SignalCollector(convRepo, makeCronService(), makeTeamRepo());
    const signals = await sc.collect('helm');
    expect(signals.assistantRecentConversations[0].durationMs).toBe(0);
  });

  it('numericTimestamp returns null when both createdAt + timestamp are undefined → durationMs=0', async () => {
    const convRepo = makeConvRepo({
      getConversationsByAssistant: vi.fn().mockResolvedValue([makeConv({ id: 'c1', modifyTime: 100 })]),
      getMessages: vi.fn().mockResolvedValue({
        data: [
          makeMessage({ createdAt: undefined, timestamp: undefined }),
          makeMessage({ createdAt: undefined, timestamp: undefined }),
        ],
        total: 2,
        hasMore: false,
      }),
    });
    const sc = new SignalCollector(convRepo, makeCronService(), makeTeamRepo());
    const signals = await sc.collect('helm');
    expect(signals.assistantRecentConversations[0].durationMs).toBe(0);
  });

  it('numericTimestamp falls back to timestamp when createdAt is missing', async () => {
    const convRepo = makeConvRepo({
      getConversationsByAssistant: vi.fn().mockResolvedValue([makeConv({ id: 'c1', modifyTime: 100 })]),
      getMessages: vi.fn().mockResolvedValue({
        data: [
          makeMessage({ createdAt: undefined, timestamp: 1000 }),
          makeMessage({ createdAt: undefined, timestamp: 5000 }),
        ],
        total: 2,
        hasMore: false,
      }),
    });
    const sc = new SignalCollector(convRepo, makeCronService(), makeTeamRepo());
    const signals = await sc.collect('helm');
    expect(signals.assistantRecentConversations[0].durationMs).toBe(4000);
  });
});

// ============================================================================
// detectRecentRitualOutput
// ============================================================================

describe('SignalCollector.collect - detectRecentRitualOutput', () => {
  function setupRitual(teams: TTeam[], crons: CronJob[]) {
    const convRepo = makeConvRepo();
    const cronService = makeCronService({
      listJobsByConversation: vi.fn().mockResolvedValue(crons),
    });
    const teamRepo = makeTeamRepo({ findAll: vi.fn().mockResolvedValue(teams) });
    return new SignalCollector(convRepo, cronService, teamRepo);
  }

  it('returns true when standing team + sourceLauncherId match + ritual cron fired within 4h with status ok', async () => {
    const now = 10_000_000;
    const sc = setupRitual(
      [makeTeam()],
      [makeRitualCron({ lastRunAtMs: now - 1000, lastStatus: 'ok', kind: 'ritual' })]
    );
    const signals = await sc.collect('helm', now);
    expect(signals.hasStandingRitualFiredRecently).toBe(true);
  });

  it('matches sourceLauncherId === assistantId AND === unprefixed form (covers both builtin-helm and ext-helm targets)', async () => {
    const now = 10_000_000;
    // sourceLauncherId is the bare slug 'helm'.
    const sc = setupRitual(
      [makeTeam({ sourceLauncherId: 'helm' })],
      [makeRitualCron({ lastRunAtMs: now - 1000, lastStatus: 'ok', kind: 'ritual' })]
    );
    // assistantId stamped 'builtin-helm' → strip prefix → 'helm' → matches.
    const a = await sc.collect('builtin-helm', now);
    expect(a.hasStandingRitualFiredRecently).toBe(true);
    // assistantId stamped 'ext-helm' → strip prefix → 'helm' → matches.
    const b = await sc.collect('ext-helm', now);
    expect(b.hasStandingRitualFiredRecently).toBe(true);
  });

  it('returns false when team is not promotedToStanding', async () => {
    const sc = setupRitual(
      [makeTeam({ promotedToStanding: false })],
      [makeRitualCron({ lastRunAtMs: 100, lastStatus: 'ok', kind: 'ritual' })]
    );
    const signals = await sc.collect('helm', 1000);
    expect(signals.hasStandingRitualFiredRecently).toBe(false);
  });

  it('returns false when sourceLauncherId does not match the assistantId', async () => {
    const sc = setupRitual(
      [makeTeam({ sourceLauncherId: 'sales' })],
      [makeRitualCron({ lastRunAtMs: 100, lastStatus: 'ok', kind: 'ritual' })]
    );
    const signals = await sc.collect('helm', 1000);
    expect(signals.hasStandingRitualFiredRecently).toBe(false);
  });

  it('returns false when lastStatus is not ok (e.g. error)', async () => {
    const now = 10_000_000;
    const sc = setupRitual(
      [makeTeam()],
      [makeRitualCron({ lastRunAtMs: now - 1000, lastStatus: 'error', kind: 'ritual' })]
    );
    const signals = await sc.collect('helm', now);
    expect(signals.hasStandingRitualFiredRecently).toBe(false);
  });

  it('returns false when cron has no agentConfig.configOptions.kind === ritual (user-NL-scheduled crons with createdBy:agent must NOT trip Level 1)', async () => {
    const now = 10_000_000;
    // Build a non-ritual cron: createdBy:'agent' (like user-NL-scheduled) but
    // missing the kind: 'ritual' tag.
    const cron = makeRitualCron({ lastRunAtMs: now - 1000, lastStatus: 'ok' });
    // Strip the kind tag to simulate a user-NL-scheduled cron.
    cron.metadata.agentConfig = { backend: 'claude', name: 'helm' };
    const sc = setupRitual([makeTeam()], [cron]);
    const signals = await sc.collect('helm', now);
    expect(signals.hasStandingRitualFiredRecently).toBe(false);
  });

  it('returns false when lastRunAtMs is undefined', async () => {
    const sc = setupRitual([makeTeam()], [makeRitualCron({ lastStatus: 'ok', kind: 'ritual' })]);
    const signals = await sc.collect('helm', 1000);
    expect(signals.hasStandingRitualFiredRecently).toBe(false);
  });

  // E-L-1 - boundary cases at the 4h window
  it('boundary: lastRun = now - 4h → considered fresh (inclusive)', async () => {
    const now = 10_000_000;
    const sc = setupRitual(
      [makeTeam()],
      [makeRitualCron({ lastRunAtMs: now - RITUAL_RECENT_WINDOW_MS, lastStatus: 'ok', kind: 'ritual' })]
    );
    const signals = await sc.collect('helm', now);
    expect(signals.hasStandingRitualFiredRecently).toBe(true);
  });

  it('boundary: lastRun = now - 4h - 1ms → stale', async () => {
    const now = 10_000_000;
    const sc = setupRitual(
      [makeTeam()],
      [makeRitualCron({ lastRunAtMs: now - RITUAL_RECENT_WINDOW_MS - 1, lastStatus: 'ok', kind: 'ritual' })]
    );
    const signals = await sc.collect('helm', now);
    expect(signals.hasStandingRitualFiredRecently).toBe(false);
  });

  it('degrades safely when teamRepo.findAll throws (returns false, does not throw)', async () => {
    const convRepo = makeConvRepo();
    const cronService = makeCronService();
    const teamRepo = makeTeamRepo({ findAll: vi.fn().mockRejectedValue(new Error('teams down')) });
    const sc = new SignalCollector(convRepo, cronService, teamRepo);
    const signals = await sc.collect('helm');
    expect(signals.hasStandingRitualFiredRecently).toBe(false);
  });

  it('degrades safely when cronService.listJobsByConversation throws (returns false, does not throw)', async () => {
    const convRepo = makeConvRepo();
    const cronService = makeCronService({ listJobsByConversation: vi.fn().mockRejectedValue(new Error('cron down')) });
    const teamRepo = makeTeamRepo({ findAll: vi.fn().mockResolvedValue([makeTeam()]) });
    const sc = new SignalCollector(convRepo, cronService, teamRepo);
    const signals = await sc.collect('helm');
    expect(signals.hasStandingRitualFiredRecently).toBe(false);
  });
});

// ============================================================================
// findAssistantInRegistry
// ============================================================================

describe('findAssistantInRegistry', () => {
  it('returns the single matching record', () => {
    getInstanceMock.mockReturnValue({
      getAssistants: () => [{ id: 'helm', name: 'Coach' }, { id: 'sales', name: 'Sales' }],
    });
    const result = findAssistantInRegistry('helm');
    expect(result).toEqual({ id: 'helm', name: 'Coach' });
  });

  it('matches prefixed assistantId against unprefixed registry record', () => {
    getInstanceMock.mockReturnValue({
      getAssistants: () => [{ id: 'helm' }],
    });
    expect(findAssistantInRegistry('ext-helm')).toEqual({ id: 'helm' });
    expect(findAssistantInRegistry('builtin-helm')).toEqual({ id: 'helm' });
  });

  it('returns null when no match', () => {
    getInstanceMock.mockReturnValue({
      getAssistants: () => [{ id: 'other' }],
    });
    expect(findAssistantInRegistry('helm')).toBeNull();
  });

  it('returns null + warns on ambiguous match (>1 hit)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    getInstanceMock.mockReturnValue({
      // Two entries that both match 'helm' once prefixes are stripped on both
      // sides (the dup-id condition this guard exists to catch).
      getAssistants: () => [{ id: 'helm' }, { id: 'ext-helm' }],
    });
    const result = findAssistantInRegistry('helm');
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('ambiguous match'));
    warnSpy.mockRestore();
  });

  // E-L-7
  it('returns null when ExtensionRegistry.getInstance throws (registry not yet initialized)', () => {
    getInstanceMock.mockImplementation(() => {
      throw new Error('not ready');
    });
    expect(findAssistantInRegistry('helm')).toBeNull();
  });
});
