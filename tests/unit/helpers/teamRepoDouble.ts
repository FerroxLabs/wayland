/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The ONE place a hand-rolled `ITeamRepository` double gets its defaults for the
 * field-scoped roster writers.
 *
 * ~20 test files hand-roll their own team-repository double, and every one of
 * them is cast (`as unknown as ITeamRepository`), so widening the interface is a
 * RUNTIME break at the call site rather than a type error at the double. That
 * has now happened twice: `updateAgentStatuses` (#980) and `mutateAgents`
 * (#1057). Each new method gets its default here so the next widening is one
 * edit instead of twenty, and so a double never silently answers `undefined` for
 * a writer the code under test depends on.
 *
 * The defaults are faithful, not inert: `mutateAgents` reads through the
 * double's own `findById` and hands the mutator the roster it finds, exactly as
 * `SqliteTeamRepository` hands it the persisted one. Nothing is stored - a
 * double whose `findById` is a fixed `mockResolvedValue` stays that way, which
 * is what those suites expect.
 */

import { vi } from 'vitest';
import type { ITeamRepository } from '@process/team/repository/ITeamRepository';
import type { TeamAgent, TTeam } from '@process/team/types';

/**
 * Fill in any roster writer the caller did not supply, and return the double.
 * An explicitly provided implementation always wins.
 */
export function withTeamRepoDoubleDefaults(repo: Partial<ITeamRepository>): ITeamRepository {
  const self = repo as ITeamRepository;

  if (!repo.mutateAgents) {
    self.mutateAgents = vi.fn(async (id: string, mutate: (agents: TeamAgent[]) => TeamAgent[] | null) => {
      const current = await self.findById(id);
      if (!current) return null;
      const next = mutate(current.agents ?? []);
      if (!next) return current;
      return { ...current, agents: next, updatedAt: Date.now() } as TTeam;
    });
  }

  if (!repo.updateAgentStatuses) {
    self.updateAgentStatuses = vi.fn(async (id: string, statuses: Array<{ slotId: string; status: TeamAgent['status'] }>) => {
      const current = await self.findById(id);
      if (!current) return null;
      const wanted = new Map(statuses.map((s) => [s.slotId, s.status]));
      const agents = (current.agents ?? []).map((agent) => {
        const status = wanted.get(agent.slotId);
        return status === undefined ? agent : { ...agent, status };
      });
      return { ...current, agents, updatedAt: Date.now() } as TTeam;
    });
  }

  return self;
}
