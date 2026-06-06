/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import type {
  WorkflowSession,
  StepState,
  StepStatus,
  AskRecord,
  WorkflowMarker,
  StepTransition,
  StepTransitionSource,
  ResolvedSkill,
} from '@/common/types/workflowTypes';

describe('workflowTypes', () => {
  it('exports all required type aliases', () => {
    const status: StepStatus = 'now';
    const src: StepTransitionSource = 'worker';
    expect(status).toBe('now');
    expect(src).toBe('worker');
  });

  it('WorkflowSession has required fields', () => {
    const session: WorkflowSession = {
      id: 'test-id',
      workflow_name: 'automate-business-workflows',
      workflow_title: 'Automate Business Workflows',
      conversation_id: 'conv-1',
      current_step: 1,
      total_steps: 6,
      steps: [],
      skills: [],
      asks: [],
      status: 'active',
      palette: null,
      category: null,
      created_at: Date.now(),
      updated_at: Date.now(),
      completed_at: null,
    };
    expect(session.status).toBe('active');
  });

  it('StepTransition carries source + dispatch_id + timestamp', () => {
    const t: StepTransition = {
      step_n: 3,
      status: 'done',
      source: 'worker',
      dispatch_id: 'd-1',
      timestamp: 1234,
    };
    expect(t.source).toBe('worker');
  });

  it('StepState supports autonomous_run + eta sources', () => {
    const step: StepState = {
      n: 1,
      title: 'Discover',
      body_excerpt: 'Explore the problem',
      status: 'now',
      started_at: 1000,
      completed_at: null,
      eta_seconds: 120,
      eta_source: 'author',
      autonomous_run: {
        dispatch_id: 'd-2',
        started_at: 1000,
        state: 'running',
      },
    };
    expect(step.autonomous_run?.state).toBe('running');
  });

  it('AskRecord supports choice + rating types', () => {
    const ask: AskRecord = {
      id: 'ask-1',
      step_n: 2,
      question: 'Pick a tone',
      type: 'choice',
      options: ['warm', 'sharp'],
      max: null,
      placeholder: null,
      answer: null,
      asked_at: 2000,
      answered_at: null,
    };
    expect(ask.type).toBe('choice');
  });

  it('WorkflowMarker discriminated union narrows by kind', () => {
    const stepMarker: WorkflowMarker = { kind: 'step', n: 2, status: 'done' };
    const askMarker: WorkflowMarker = {
      kind: 'ask',
      ask: {
        question: 'Confirm?',
        type: 'boolean',
        options: null,
        max: null,
        placeholder: null,
      },
    };
    expect(stepMarker.kind).toBe('step');
    expect(askMarker.kind).toBe('ask');
  });

  it('ResolvedSkill carries display metadata', () => {
    const skill: ResolvedSkill = {
      slug: 'workflow-designer',
      display_name: 'Workflow Designer',
      icon: 'workflow',
      description: 'Designs workflows.',
    };
    expect(skill.slug).toBe('workflow-designer');
  });
});
