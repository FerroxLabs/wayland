// src/process/team/EventLogger.ts
//
// W1e - append-only writer for team_event_log.
//
// Every team-mutating surface (Mailbox.write, TaskManager.create/update,
// TeamSessionService.addAgent, TeammateManager.wake / token-usage stream)
// goes through this single helper so the wire format stays consistent and
// payload shape lives in one place rather than duplicated at each call site.
//
// Failures are swallowed-with-warning on purpose: event logging is observability,
// not correctness - a failed audit row must never break a user-visible op
// (mailbox write, task create, etc.).
import type { ITeamEventRepository } from './repository/ITeamRepository';
import type { TeamEvent, TeamEventType } from './types';

export type AppendEventInput = {
  teamId: string;
  eventType: TeamEventType;
  actorSlotId?: string;
  targetSlotId?: string;
  payload: Record<string, unknown>;
};

export class EventLogger {
  constructor(private readonly repo: ITeamEventRepository) {}

  /**
   * Best-effort append. Generates id + timestamp. Errors are logged but not
   * propagated - the caller's success/failure must not depend on the audit row.
   */
  async append(input: AppendEventInput): Promise<void> {
    const event: TeamEvent = {
      id: crypto.randomUUID(),
      teamId: input.teamId,
      eventType: input.eventType,
      actorSlotId: input.actorSlotId,
      targetSlotId: input.targetSlotId,
      payload: input.payload,
      createdAt: Date.now(),
    };
    try {
      await this.repo.appendEvent(event);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `[EventLogger] Failed to append ${input.eventType} event for team ${input.teamId}: ${message}`
      );
    }
  }
}
