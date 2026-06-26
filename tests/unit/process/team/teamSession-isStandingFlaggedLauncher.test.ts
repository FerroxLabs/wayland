/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Regression for S1 (standing-flag half): isStandingFlaggedLauncher only read
// the ExtensionRegistry, which EXCLUDES native records (ExtensionLoader skips
// the native bundle), so native standing teams (`builtin-<slug>`) never
// auto-promoted - `promotedToStanding` stayed undefined and kickoff cards were
// gated off. The fix also consults getBuiltinCatalogAssistants() / config
// assistants and matches the launcher id across bare / `builtin-` / `ext-`
// shapes.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/common', () => ({ ipcBridge: { team: { listChanged: { emit: vi.fn() } } } }));
vi.mock('electron', () => ({ app: { getPath: vi.fn(() => '/tmp') } }));

// Registry is EMPTY - native records are never in it (the bug).
vi.mock('@process/extensions/ExtensionRegistry', () => ({
  ExtensionRegistry: { getInstance: vi.fn(() => ({ getAssistants: () => [] })) },
}));

// The native standing team lives in the catalog as a `builtin-<slug>` record.
vi.mock('@process/utils/builtinCatalog', () => ({
  getBuiltinCatalogAssistants: vi.fn(() => [
    { id: 'builtin-quiet-money-standing', standing: true },
    { id: 'builtin-non-standing-team', standing: false },
  ]),
}));

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: vi.fn(async () => null) },
  getAssistantsDir: () => '/assistants',
}));

import { TeamSessionService } from '@process/team/TeamSessionService';
import type { ITeamRepository } from '@process/team/repository/ITeamRepository';
import type { IConversationService } from '@process/services/IConversationService';

function makeRepo(): ITeamRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn(),
    deleteMailboxByTeam: vi.fn(),
    deleteTasksByTeam: vi.fn(),
    writeMessage: vi.fn(),
    readUnread: vi.fn(),
    readUnreadAndMark: vi.fn(),
    markRead: vi.fn(),
    getMailboxHistory: vi.fn(),
    createTask: vi.fn(),
    findTaskById: vi.fn(),
    updateTask: vi.fn(),
    findTasksByTeam: vi.fn(),
    findTasksByOwner: vi.fn(),
    deleteTask: vi.fn(),
    appendToBlocks: vi.fn(),
    removeFromBlockedBy: vi.fn(),
    appendEvent: vi.fn().mockResolvedValue(undefined),
    listEvents: vi.fn().mockResolvedValue([]),
  } as ITeamRepository;
}

function makeConversationService(): IConversationService {
  return {
    createConversation: vi.fn(),
    deleteConversation: vi.fn(),
    updateConversation: vi.fn(),
    getConversation: vi.fn(),
    createWithMigration: vi.fn(),
    listAllConversations: vi.fn(),
  } as IConversationService;
}

type StandingProbe = { isStandingFlaggedLauncher: (id: string) => Promise<boolean> };

// Each TeamSessionService starts a 60s Watchdog sweep setInterval in its
// constructor; left un-stopped, those ref'd timers keep the vitest fork
// worker's event loop alive and hang the unit shard under CI load (#353).
const services: TeamSessionService[] = [];
function makeService(): StandingProbe {
  const svc = new TeamSessionService(makeRepo(), { getOrBuildTask: vi.fn(), kill: vi.fn() }, makeConversationService());
  services.push(svc);
  return svc as unknown as StandingProbe;
}

afterEach(async () => {
  await Promise.all(services.splice(0).map((svc) => svc.stopAllSessions()));
});

describe('TeamSessionService.isStandingFlaggedLauncher - native catalog (S1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true for a native standing team stored as builtin-<slug>', async () => {
    const svc = makeService();
    expect(await svc.isStandingFlaggedLauncher('builtin-quiet-money-standing')).toBe(true);
  });

  it('returns true for the same native standing team referenced by bare slug', async () => {
    const svc = makeService();
    expect(await svc.isStandingFlaggedLauncher('quiet-money-standing')).toBe(true);
  });

  it('returns false for a native team that is not standing', async () => {
    const svc = makeService();
    expect(await svc.isStandingFlaggedLauncher('builtin-non-standing-team')).toBe(false);
  });

  it('returns false for an unknown launcher', async () => {
    const svc = makeService();
    expect(await svc.isStandingFlaggedLauncher('builtin-nope')).toBe(false);
  });
});
