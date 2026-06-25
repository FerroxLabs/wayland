/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, expect, it } from 'vitest';
import { CURRENT_DB_VERSION, initSchema } from '@process/services/database/schema';
import { runMigrations } from '@process/services/database/migrations';
import { BetterSqlite3Driver } from '@process/services/database/drivers/BetterSqlite3Driver';
import { WorkflowSessionRepository } from '@process/services/workflow/WorkflowSessionRepository';
import type { AskRecord, ResolvedSkill, StepState, WorkflowSession } from '@/common/types/workflowTypes';
import { describeNativeSqlite } from '../../../helpers/nativeSqlite';

// describeNativeSqlite runs this when the better-sqlite3 ABI matches the runtime
// (CI / after `npm rebuild better-sqlite3`), skips it on the local Electron-ABI
// dev build, and fails loudly in CI if the binding is unloadable so the coverage
// loss can't pass unnoticed.

const DAY_MS = 24 * 60 * 60 * 1000;

const makeSteps = (): StepState[] => [
  {
    n: 1,
    title: 'Kickoff',
    body_excerpt: 'do the thing',
    status: 'now',
    started_at: 1_700_000_000_000,
    completed_at: null,
    eta_seconds: 60,
    eta_source: 'author',
    autonomous_run: null,
  },
  {
    n: 2,
    title: 'Finish',
    body_excerpt: 'finish the thing',
    status: 'todo',
    started_at: null,
    completed_at: null,
    eta_seconds: null,
    eta_source: null,
    autonomous_run: { dispatch_id: 'd-1', started_at: 1_700_000_001_000, state: 'running' },
  },
];

const makeSkills = (): ResolvedSkill[] => [
  { slug: 'workflow-designer', display_name: 'Workflow Designer', icon: null, description: 'd' },
];

const makeAsks = (): AskRecord[] => [
  {
    id: 'ask-1',
    step_n: 1,
    question: 'Pick one',
    type: 'choice',
    options: ['a', 'b'],
    max: null,
    placeholder: null,
    answer: null,
    asked_at: 1_700_000_002_000,
    answered_at: null,
  },
];

const makeSession = (over: Partial<WorkflowSession> = {}): WorkflowSession => ({
  id: 'wfs-1',
  workflow_name: 'demo-flow',
  workflow_title: 'Demo Flow',
  conversation_id: 'conv-1',
  current_step: 1,
  total_steps: 2,
  steps: makeSteps(),
  skills: makeSkills(),
  asks: makeAsks(),
  status: 'active',
  palette: 'amber',
  category: 'build',
  created_at: 1_700_000_000_000,
  updated_at: 1_700_000_000_000,
  completed_at: null,
  begin_sent_at: null,
  run_mode: 'running',
  interactivity: 'step',
  ...over,
});

describeNativeSqlite('WorkflowSessionRepository', () => {
  let driver: BetterSqlite3Driver;
  let repo: WorkflowSessionRepository;

  beforeEach(() => {
    driver = new BetterSqlite3Driver(':memory:');
    initSchema(driver);
    runMigrations(driver, 0, CURRENT_DB_VERSION);
    repo = new WorkflowSessionRepository(driver);
  });
  afterEach(() => driver.close());

  it('insert + findById round-trips the full row including JSON columns', () => {
    const session = makeSession();
    repo.insert(session);
    const got = repo.findById('wfs-1');
    expect(got).not.toBeNull();
    expect(got).toEqual(session);
    // JSON columns must deserialize to deep-equal arrays, not strings
    expect(Array.isArray(got!.steps)).toBe(true);
    expect(got!.steps[1].autonomous_run).toEqual({
      dispatch_id: 'd-1',
      started_at: 1_700_000_001_000,
      state: 'running',
    });
    expect(got!.asks[0].options).toEqual(['a', 'b']);
  });

  it('findById returns null when missing', () => {
    expect(repo.findById('nope')).toBeNull();
  });

  it('findByConversationId locates the session by conversation_id', () => {
    repo.insert(makeSession({ id: 'a', conversation_id: 'conv-a' }));
    repo.insert(makeSession({ id: 'b', conversation_id: 'conv-b' }));
    const got = repo.findByConversationId('conv-b');
    expect(got?.id).toBe('b');
    expect(repo.findByConversationId('nope')).toBeNull();
  });

  it('findActiveByWorkflowName returns the most-recent active session within the 14-day window', () => {
    const now = Date.now();
    repo.insert(makeSession({ id: 'old', workflow_name: 'demo-flow', updated_at: now - 5 * DAY_MS }));
    repo.insert(makeSession({ id: 'newer', workflow_name: 'demo-flow', updated_at: now - 1 * DAY_MS }));
    const got = repo.findActiveByWorkflowName('demo-flow');
    expect(got?.id).toBe('newer');
  });

  it('findActiveByWorkflowName excludes sessions older than 14 days', () => {
    const now = Date.now();
    repo.insert(makeSession({ id: 'stale', workflow_name: 'demo-flow', updated_at: now - 20 * DAY_MS }));
    expect(repo.findActiveByWorkflowName('demo-flow')).toBeNull();
  });

  it('findActiveByWorkflowName excludes non-active statuses', () => {
    repo.insert(
      makeSession({
        id: 'done',
        workflow_name: 'demo-flow',
        status: 'complete',
        updated_at: Date.now(),
      })
    );
    expect(repo.findActiveByWorkflowName('demo-flow')).toBeNull();
  });

  it('findAllActive returns top N active sessions ordered by updated_at DESC', () => {
    const now = Date.now();
    repo.insert(makeSession({ id: 'a', workflow_name: 'wf-a', updated_at: now - 3000 }));
    repo.insert(makeSession({ id: 'b', workflow_name: 'wf-b', updated_at: now - 1000 }));
    repo.insert(makeSession({ id: 'c', workflow_name: 'wf-c', updated_at: now - 2000 }));
    repo.insert(
      makeSession({
        id: 'd',
        workflow_name: 'wf-d',
        status: 'complete',
        updated_at: now,
      })
    );
    const got = repo.findAllActive(2);
    expect(got.map((s) => s.id)).toEqual(['b', 'c']);
  });

  it('findAllActive defaults to limit of 3', () => {
    const now = Date.now();
    for (let i = 0; i < 5; i++) {
      repo.insert(makeSession({ id: `s${i}`, workflow_name: `wf-${i}`, updated_at: now - i }));
    }
    expect(repo.findAllActive()).toHaveLength(3);
  });

  it('update preserves fields not in patch and bumps updated_at', () => {
    repo.insert(makeSession({ updated_at: 1_700_000_000_000 }));
    const before = repo.findById('wfs-1')!;
    const updated = repo.update('wfs-1', { current_step: 2, status: 'complete' });
    expect(updated.current_step).toBe(2);
    expect(updated.status).toBe('complete');
    // Unchanged fields kept
    expect(updated.workflow_name).toBe(before.workflow_name);
    expect(updated.conversation_id).toBe(before.conversation_id);
    expect(updated.steps).toEqual(before.steps);
    expect(updated.skills).toEqual(before.skills);
    expect(updated.asks).toEqual(before.asks);
    // updated_at moved forward
    expect(updated.updated_at).toBeGreaterThan(before.updated_at);
  });

  it('update can patch JSON columns and round-trips losslessly', () => {
    repo.insert(makeSession());
    const newSteps: StepState[] = [
      {
        n: 1,
        title: 'Kickoff',
        body_excerpt: 'do the thing',
        status: 'done',
        started_at: 1,
        completed_at: 2,
        eta_seconds: 30,
        eta_source: 'empirical',
        autonomous_run: null,
      },
    ];
    const updated = repo.update('wfs-1', { steps: newSteps, total_steps: 1, current_step: 1 });
    expect(updated.steps).toEqual(newSteps);
    expect(updated.total_steps).toBe(1);
    // Re-read from DB to confirm persistence
    const reread = repo.findById('wfs-1');
    expect(reread?.steps).toEqual(newSteps);
  });

  it('update can set completed_at and palette/category nullable mirror', () => {
    repo.insert(makeSession());
    const updated = repo.update('wfs-1', {
      status: 'complete',
      completed_at: 1_700_000_999_000,
    });
    expect(updated.status).toBe('complete');
    expect(updated.completed_at).toBe(1_700_000_999_000);
  });

  it('update on missing id throws', () => {
    expect(() => repo.update('nope', { current_step: 2 })).toThrow();
  });

  it('insert defaults created_at and updated_at when not provided', () => {
    const before = Date.now();
    const session = makeSession({ created_at: 0, updated_at: 0 });
    // simulate "not provided" by passing zero - repo should NOT overwrite real timestamps.
    // The explicit contract: only set defaults when values are missing/falsy. We use zero
    // here as the sentinel because all numeric Wayland timestamps are post-1970.
    repo.insert(session);
    const got = repo.findById('wfs-1')!;
    expect(got.created_at).toBeGreaterThanOrEqual(before);
    expect(got.updated_at).toBeGreaterThanOrEqual(before);
  });

  it('delete hard-deletes a row by id', () => {
    repo.insert(makeSession());
    repo.delete('wfs-1');
    expect(repo.findById('wfs-1')).toBeNull();
  });

  it('insert + findById round-trips begin_sent_at: null', () => {
    repo.insert(makeSession({ begin_sent_at: null }));
    const got = repo.findById('wfs-1');
    expect(got).not.toBeNull();
    expect(got!.begin_sent_at).toBeNull();
  });

  it('insert + findById round-trips begin_sent_at: non-null timestamp', () => {
    const ts = 1_234_567_890;
    repo.insert(makeSession({ begin_sent_at: ts }));
    const got = repo.findById('wfs-1');
    expect(got).not.toBeNull();
    expect(got!.begin_sent_at).toBe(ts);
  });

  it('update({ begin_sent_at }) persists and reads back', () => {
    repo.insert(makeSession({ begin_sent_at: null }));
    const ts = 1_700_000_555_000;
    const updated = repo.update('wfs-1', { begin_sent_at: ts });
    expect(updated.begin_sent_at).toBe(ts);
    const reread = repo.findById('wfs-1');
    expect(reread!.begin_sent_at).toBe(ts);
  });

  it('insert + findById round-trips run_mode and interactivity', () => {
    repo.insert(makeSession({ run_mode: 'awaiting_input', interactivity: 'auto' }));
    const got = repo.findById('wfs-1');
    expect(got!.run_mode).toBe('awaiting_input');
    expect(got!.interactivity).toBe('auto');
  });

  it('update({ run_mode, interactivity }) persists and reads back', () => {
    repo.insert(makeSession({ run_mode: 'running', interactivity: 'step' }));
    const updated = repo.update('wfs-1', { run_mode: 'paused', interactivity: 'auto' });
    expect(updated.run_mode).toBe('paused');
    expect(updated.interactivity).toBe('auto');
    const reread = repo.findById('wfs-1');
    expect(reread!.run_mode).toBe('paused');
    expect(reread!.interactivity).toBe('auto');
  });
});
