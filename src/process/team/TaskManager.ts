// src/process/team/TaskManager.ts
import type { ITeamRepository } from './repository/ITeamRepository';
import type { TeamAgent, TeamTask } from './types';

/** Parameters for creating a new task */
type CreateTaskParams = {
  teamId: string;
  subject: string;
  description?: string;
  owner?: string;
  blockedBy?: string[];
};

/** Parameters for updating an existing task */
type UpdateTaskParams = {
  status?: TeamTask['status'];
  owner?: string;
  description?: string;
};

/** Function returning the current team roster — used for owner validation */
type GetAgentsFn = () => TeamAgent[];

/**
 * Thrown when `team_task_create` / `team_task_update` are called with an
 * `owner` that does not match any slotId on the current team. Surfaced through
 * the MCP TCP transport as a structured `{ error: <message> }` payload so the
 * caller can correct the slotId rather than silently writing an orphan task.
 */
export class TeamTaskOwnerNotFoundError extends Error {
  readonly code = 'TEAM_TASK_OWNER_NOT_FOUND';

  constructor(badSlotId: string, availableSlotIds: string[]) {
    const available = availableSlotIds.length > 0 ? availableSlotIds.join(', ') : '(no agents on team)';
    super(`Task owner "${badSlotId}" is not a slotId on this team. Available slotIds: ${available}.`);
    this.name = 'TeamTaskOwnerNotFoundError';
  }
}

/**
 * Service layer for task CRUD with dependency graph resolution.
 * Maintains bidirectional links between tasks via `blockedBy` / `blocks`.
 *
 * Owner validation: when a task's `owner` is set, it must match the `slotId`
 * of an agent on the team's current roster (looked up via `getAgents`). This
 * prevents typos and stale slotIds from creating tasks no agent can claim.
 */
export class TaskManager {
  constructor(
    private readonly repo: ITeamRepository,
    private readonly getAgents: GetAgentsFn
  ) {}

  /**
   * Validate that `owner` is a real slotId on the current team. No-op when
   * owner is undefined or an empty string (both treated as "unassigned").
   */
  private validateOwner(owner: string | undefined): void {
    if (!owner) return;
    const agents = this.getAgents();
    if (!agents.some((a) => a.slotId === owner)) {
      throw new TeamTaskOwnerNotFoundError(
        owner,
        agents.map((a) => a.slotId)
      );
    }
  }

  /**
   * Create a new task. Auto-generates ID and timestamps.
   * When `blockedBy` is provided, also updates the `blocks` array of each
   * upstream task to maintain bidirectional links.
   *
   * @throws {TeamTaskOwnerNotFoundError} when `owner` is set to a slotId not
   *   present on the current team roster.
   */
  async create(params: CreateTaskParams): Promise<TeamTask> {
    this.validateOwner(params.owner);

    const now = Date.now();
    const task: TeamTask = {
      id: crypto.randomUUID(),
      teamId: params.teamId,
      subject: params.subject,
      description: params.description,
      status: 'pending',
      owner: params.owner,
      blockedBy: params.blockedBy ?? [],
      blocks: [],
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.repo.createTask(task);

    // Atomically append to `blocks` on each upstream task (bidirectional link)
    if (created.blockedBy.length > 0) {
      await Promise.all(created.blockedBy.map((upstreamId) => this.repo.appendToBlocks(upstreamId, created.id)));
    }

    return created;
  }

  /**
   * Update a task. Auto-updates `updatedAt`. Returns the merged task.
   *
   * @throws {TeamTaskOwnerNotFoundError} when `updates.owner` is reassigned to
   *   a slotId not present on the current team roster.
   */
  async update(taskId: string, updates: UpdateTaskParams): Promise<TeamTask> {
    this.validateOwner(updates.owner);

    return this.repo.updateTask(taskId, {
      ...updates,
      updatedAt: Date.now(),
    });
  }

  /**
   * List all tasks for a team.
   */
  async list(teamId: string): Promise<TeamTask[]> {
    return this.repo.findTasksByTeam(teamId);
  }

  /**
   * Get tasks assigned to a specific agent.
   */
  async getByOwner(teamId: string, ownerId: string): Promise<TeamTask[]> {
    return this.repo.findTasksByOwner(teamId, ownerId);
  }

  /**
   * Check if completing a task unblocks other tasks.
   * Removes the given taskId from the `blockedBy` array of every task that
   * depends on it. Returns only those tasks whose `blockedBy` became empty
   * (i.e. tasks that are now fully unblocked).
   */
  async checkUnblocks(taskId: string): Promise<TeamTask[]> {
    // Locate the completed task to get its teamId
    const completedTask = await this.repo.findTaskById(taskId);
    if (!completedTask) return [];

    const allTasks = await this.repo.findTasksByTeam(completedTask.teamId);
    const dependents = allTasks.filter((t) => t.blockedBy.includes(taskId));

    if (dependents.length === 0) return [];

    // Atomically remove taskId from each dependent's blockedBy array
    const updated = await Promise.all(dependents.map((t) => this.repo.removeFromBlockedBy(t.id, taskId)));

    // Clear the completed task's stale blocks pointer (Bug #5)
    await this.repo.updateTask(taskId, { blocks: [], updatedAt: Date.now() });

    return updated.filter((t) => t.blockedBy.length === 0);
  }
}
