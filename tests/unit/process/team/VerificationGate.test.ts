/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * P3 verification gate - cross-audit second opinion at the `completed` boundary.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskManager } from '@process/team/TaskManager';
import { VerificationGate, type VerificationRecord } from '@process/team/VerificationGate';
import type { ITeamRepository } from '@process/team/repository/ITeamRepository';
import type { IjfwInvokeResult } from '@/common/types/ijfw';
import { LEASE_TTL_MS } from '@process/team/types';
import type { TeamAgent, TeamTask } from '@process/team/types';

/** Minimal in-memory repository over the methods the gate path exercises. */
function makeRepo(seed?: TeamTask): { repo: ITeamRepository; get: (id: string) => TeamTask | undefined } {
  const tasks = new Map<string, TeamTask>();
  if (seed) tasks.set(seed.id, seed);
  const repo: Partial<ITeamRepository> = {
    async createTask(task: TeamTask) {
      tasks.set(task.id, task);
      return task;
    },
    async updateTask(taskId: string, updates: Partial<TeamTask>) {
      const existing = tasks.get(taskId);
      if (!existing) throw new Error(`Task ${taskId} not found`);
      const merged = { ...existing, ...updates } as TeamTask;
      tasks.set(taskId, merged);
      return merged;
    },
    async findTaskById(taskId: string) {
      return tasks.get(taskId) ?? null;
    },
    async findTasksByTeam(teamId: string) {
      return Array.from(tasks.values()).filter((t) => t.teamId === teamId);
    },
    async removeFromBlockedBy(taskId: string) {
      return tasks.get(taskId)!;
    },
  };
  return { repo: repo as ITeamRepository, get: (id) => tasks.get(id) };
}

function makeAgent(slotId: string): TeamAgent {
  return {
    slotId,
    agentId: `agent-${slotId}`,
    agentName: slotId,
    agentType: 'gemini',
    role: 'teammate',
    status: 'idle',
    model: 'gemini-2.5-pro',
  } as TeamAgent;
}

const TEAM_ID = 'team-p3';
const ALICE = makeAgent('slot-alice');

function makeTask(over: Partial<TeamTask> = {}): TeamTask {
  const now = Date.now();
  return {
    id: 'task-1',
    teamId: TEAM_ID,
    subject: 'ship login',
    status: 'in_progress',
    owner: ALICE.slotId,
    blockedBy: [],
    blocks: [],
    metadata: { startRef: 'abc123' },
    createdAt: now,
    updatedAt: now,
    ...over,
  };
}

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  delete process.env.WAYLAND_DISABLE_IJFW;
  delete process.env.CI;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

function passResult(): IjfwInvokeResult {
  return {
    ok: true,
    data: { verdict: 'PASS', findings: [], perIteration: [{ lensResults: [{ lens: 'claude', verdict: 'PASS' }] }] },
  };
}

function failResult(): IjfwInvokeResult {
  return {
    ok: true,
    data: {
      verdict: 'FAIL',
      findings: [{ severity: 'high', issue: 'login form missing validation', _lens: 'claude' }],
      perIteration: [{ lensResults: [{ lens: 'claude', verdict: 'FAIL' }] }],
    },
  };
}

describe('VerificationGate - gate decisions', () => {
  it('PASS with >= 1 lens completes the task', async () => {
    const gate = new VerificationGate(async () => passResult(), () => 'blocking');
    const decision = await gate.verify(makeTask());
    expect(decision.kind).toBe('complete');
    expect(decision.verification.outcome).toBe('pass');
    expect(decision.verification.verdict).toBe('PASS');
  });

  it('PASS with zero lenses is inconclusive -> fails soft to complete (advisory)', async () => {
    const result: IjfwInvokeResult = { ok: true, data: { verdict: 'PASS', perIteration: [{ lensResults: [] }] } };
    const gate = new VerificationGate(async () => result, () => 'blocking');
    const decision = await gate.verify(makeTask());
    expect(decision.kind).toBe('complete');
    expect(decision.verification.outcome).toBe('advisory');
  });

  it('FAIL in blocking mode rejects back to in_progress with critique', async () => {
    const gate = new VerificationGate(async () => failResult(), () => 'blocking');
    const decision = await gate.verify(makeTask());
    expect(decision.kind).toBe('reject');
    expect(decision.verification.outcome).toBe('fail');
    expect(decision.verification.critique?.length).toBe(1);
  });

  it('FAIL in advisory mode completes but records the verdict', async () => {
    const gate = new VerificationGate(async () => failResult(), () => 'advisory');
    const decision = await gate.verify(makeTask());
    expect(decision.kind).toBe('complete');
    expect(decision.verification.outcome).toBe('advisory');
    expect(decision.verification.critique?.length).toBe(1);
  });

  it('2nd consecutive FAIL in blocking mode escalates to needs_human', async () => {
    const gate = new VerificationGate(async () => failResult(), () => 'blocking');
    const task = makeTask({
      metadata: { startRef: 'abc123', verification: { outcome: 'fail', failCount: 1, checkedAt: 1 } },
    });
    const decision = await gate.verify(task);
    expect(decision.kind).toBe('reject');
    expect(decision.verification.outcome).toBe('needs_human');
    expect(decision.verification.needsHuman).toBe(true);
    expect(decision.verification.failCount).toBe(2);
  });

  it('fails soft (complete) when the task carries no commit range', async () => {
    const invoke = vi.fn(async () => passResult());
    const gate = new VerificationGate(invoke, () => 'blocking');
    const decision = await gate.verify(makeTask({ metadata: {} }));
    expect(decision.kind).toBe('complete');
    expect(decision.verification.outcome).toBe('advisory');
    expect(invoke).not.toHaveBeenCalled(); // never sends a bogus range
  });

  it('fails soft (complete) when IJFW is unavailable', async () => {
    const result: IjfwInvokeResult = { ok: false, errorReason: 'spawn_error' };
    const gate = new VerificationGate(async () => result, () => 'blocking');
    const decision = await gate.verify(makeTask());
    expect(decision.kind).toBe('complete');
    expect(decision.verification.outcome).toBe('advisory');
    expect(decision.verification.note).toContain('spawn_error');
  });

  it('fails soft (complete) when invoke THROWS instead of returning ok:false', async () => {
    // A thrown rejection must not escape verify() (it would strand the task in
    // `verifying`); it is treated identically to infra-unavailable.
    const gate = new VerificationGate(async () => {
      throw new Error('mcp transport exploded');
    }, () => 'blocking');
    const decision = await gate.verify(makeTask());
    expect(decision.kind).toBe('complete');
    expect(decision.verification.outcome).toBe('advisory');
    expect(decision.verification.note).toContain('threw');
  });

  it('failSoft CARRIES the prior failCount so a transient IJFW blip cannot launder a real FAIL', async () => {
    // Turn 1 was a real blocking FAIL (failCount 1). Turn 2 hits an IJFW outage.
    const result: IjfwInvokeResult = { ok: false, errorReason: 'spawn_error' };
    const gate = new VerificationGate(async () => result, () => 'blocking');
    const task = makeTask({ metadata: { startRef: 'abc123', verification: { outcome: 'fail', failCount: 1, checkedAt: 1 } } });
    const decision = await gate.verify(task);
    expect(decision.kind).toBe('complete'); // still fails soft (never traps in verifying)
    expect(decision.verification.failCount).toBe(1); // but does NOT reset to 0
  });

  it('short-circuits to advisory when WAYLAND_DISABLE_IJFW=1', async () => {
    process.env.WAYLAND_DISABLE_IJFW = '1';
    const invoke = vi.fn(async () => passResult());
    const gate = new VerificationGate(invoke, () => 'blocking');
    const decision = await gate.verify(makeTask());
    expect(decision.kind).toBe('complete');
    expect(invoke).not.toHaveBeenCalled();
  });

  it('policy off completes without invoking cross-audit', async () => {
    const invoke = vi.fn(async () => passResult());
    const gate = new VerificationGate(invoke, () => 'off');
    const decision = await gate.verify(makeTask());
    expect(decision.kind).toBe('complete');
    expect(invoke).not.toHaveBeenCalled();
  });

  it('builds a baseBranch..taskBranch range when no startRef is present', async () => {
    const invoke = vi.fn(async () => passResult());
    const gate = new VerificationGate(invoke, () => 'blocking');
    await gate.verify(makeTask({ metadata: { baseBranch: 'main', taskBranch: 'feat/login' } }));
    expect(invoke).toHaveBeenCalledWith('cross_audit_converge', expect.objectContaining({ commitRange: 'main..feat/login' }));
  });
});

describe('TaskManager + VerificationGate - completed interception', () => {
  it('routes a proposed completed through verifying then to completed on pass', async () => {
    const seed = makeTask();
    const { repo, get } = makeRepo(seed);
    const gate = new VerificationGate(async () => passResult(), () => 'blocking');
    const tm = new TaskManager(repo, () => [ALICE], undefined, gate);

    const result = await tm.update(seed.id, { status: 'completed' });
    expect(result.status).toBe('completed');
    const stored = get(seed.id)!;
    expect((stored.metadata.verification as VerificationRecord).outcome).toBe('pass');
  });

  it('blocking FAIL sends the task back to in_progress with critique', async () => {
    const seed = makeTask();
    const { repo, get } = makeRepo(seed);
    const gate = new VerificationGate(async () => failResult(), () => 'blocking');
    const tm = new TaskManager(repo, () => [ALICE], undefined, gate);

    const result = await tm.update(seed.id, { status: 'completed' });
    expect(result.status).toBe('in_progress');
    const stored = get(seed.id)!;
    const v = stored.metadata.verification as VerificationRecord;
    expect(v.outcome).toBe('fail');
    expect(v.critique?.length).toBe(1);
  });

  it('does not re-gate a task already in verifying (no infinite loop)', async () => {
    const seed = makeTask({ status: 'verifying' });
    const { repo, get } = makeRepo(seed);
    const invoke = vi.fn(async () => passResult());
    const gate = new VerificationGate(invoke, () => 'blocking');
    const tm = new TaskManager(repo, () => [ALICE], undefined, gate);

    const result = await tm.update(seed.id, { status: 'completed' });
    expect(result.status).toBe('completed');
    expect(invoke).not.toHaveBeenCalled(); // re-entrant verifying skips the gate
    expect(get(seed.id)!.status).toBe('completed');
  });

  it('parks a needs_human task: a re-proposed completion is dropped without re-running the gate', async () => {
    const seed = makeTask({
      metadata: { startRef: 'abc123', verification: { outcome: 'needs_human', needsHuman: true, failCount: 2, checkedAt: 1 } },
    });
    const { repo, get } = makeRepo(seed);
    const invoke = vi.fn(async () => passResult());
    const gate = new VerificationGate(invoke, () => 'blocking');
    const tm = new TaskManager(repo, () => [ALICE], undefined, gate);

    const result = await tm.update(seed.id, { status: 'completed' });
    expect(invoke).not.toHaveBeenCalled(); // parked: no new paid cross-audit
    expect(result.status).toBe('in_progress'); // completion dropped, task unchanged
    expect(get(seed.id)!.status).toBe('in_progress');
  });

  it('completes directly when no gate is wired (legacy behavior)', async () => {
    const seed = makeTask();
    const { repo, get } = makeRepo(seed);
    const tm = new TaskManager(repo, () => [ALICE]);
    const result = await tm.update(seed.id, { status: 'completed' });
    expect(result.status).toBe('completed');
    expect(get(seed.id)!.metadata.verification).toBeUndefined();
  });

  it('stamps a fresh non-NULL lease when a task transitions to in_progress', async () => {
    const seed = makeTask({ status: 'pending', owner: ALICE.slotId, leaseExpiresAt: undefined });
    const { repo, get } = makeRepo(seed);
    const tm = new TaskManager(repo, () => [ALICE]);
    const before = Date.now();
    await tm.update(seed.id, { status: 'in_progress' });
    const stored = get(seed.id)!;
    expect(stored.leaseOwner).toBe(ALICE.slotId);
    expect(stored.leaseExpiresAt).toBeGreaterThanOrEqual(before + LEASE_TTL_MS - 2000);
  });
});
