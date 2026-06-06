/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Unit tests for composeWorkflowSystemPrompt (SPEC §7.1). The composer
// must produce a STATIC system prompt identical for two calls with the
// same session - caching depends on this. Dynamic per-step content lives
// in WORKFLOW_STEP_CONTEXT, not here.
import { describe, expect, it } from 'vitest';
import { composeWorkflowSystemPrompt } from '@process/services/workflow/composeWorkflowSystemPrompt';
import type {
  ResolvedSkill,
  StepState,
  WorkflowSession,
} from '@/common/types/workflowTypes';

function makeStep(n: number, title: string): StepState {
  return {
    n,
    title,
    body_excerpt: `Step ${n} body excerpt.`,
    status: 'todo',
    started_at: null,
    completed_at: null,
    eta_seconds: null,
    eta_source: null,
    autonomous_run: null,
  };
}

function makeSkill(slug: string, display_name: string, description: string): ResolvedSkill {
  return {
    slug,
    display_name,
    icon: null,
    description,
  };
}

function makeSession(overrides: Partial<WorkflowSession> = {}): WorkflowSession {
  const steps: StepState[] = overrides.steps ?? [
    makeStep(1, 'Audit current manual processes'),
    makeStep(2, 'Identify automation opportunities'),
    makeStep(3, 'Choose the right automation tool'),
  ];
  const skills: ResolvedSkill[] =
    overrides.skills ??
    [
      makeSkill('workflow-designer', 'Workflow Designer', 'Designs structured workflows.'),
      makeSkill('automation-coach', 'Automation Coach', 'Guides automation choices.'),
    ];
  return {
    id: 'sess-1',
    workflow_name: 'automation-launch',
    workflow_title: 'Launch Your First Automation',
    conversation_id: 'conv-1',
    current_step: 1,
    total_steps: overrides.total_steps ?? steps.length,
    steps,
    skills,
    asks: [],
    status: 'active',
    palette: null,
    category: null,
    created_at: 0,
    updated_at: 0,
    completed_at: null,
    ...overrides,
  };
}

describe('composeWorkflowSystemPrompt', () => {
  it('embeds the workflow title in the header', () => {
    const prompt = composeWorkflowSystemPrompt(makeSession());
    expect(prompt).toContain(
      'You are executing a structured workflow: "Launch Your First Automation".'
    );
  });

  it('renders the WORKFLOW STEPS block with all step titles (titles only)', () => {
    const prompt = composeWorkflowSystemPrompt(makeSession());
    expect(prompt).toContain('WORKFLOW STEPS (3 total');
    expect(prompt).toContain('1. Audit current manual processes');
    expect(prompt).toContain('2. Identify automation opportunities');
    expect(prompt).toContain('3. Choose the right automation tool');
    // Titles only - body excerpts must NOT appear in the static prompt.
    expect(prompt).not.toContain('Step 1 body excerpt.');
    expect(prompt).not.toContain('Step 2 body excerpt.');
  });

  it('renders SKILLS ACTIVE with all skills + descriptions', () => {
    const prompt = composeWorkflowSystemPrompt(makeSession());
    expect(prompt).toContain('SKILLS ACTIVE:');
    expect(prompt).toContain('Workflow Designer');
    expect(prompt).toContain('Designs structured workflows.');
    expect(prompt).toContain('Automation Coach');
    expect(prompt).toContain('Guides automation choices.');
  });

  it('renders SKILLS ACTIVE: (none) when no skills resolved', () => {
    const prompt = composeWorkflowSystemPrompt(makeSession({ skills: [] }));
    expect(prompt).toContain('SKILLS ACTIVE: (none)');
  });

  it('truncates long skill descriptions to first sentence or ~80 chars', () => {
    const long =
      'This is a very long sentence that exceeds the eighty character cap by quite a lot to ensure the truncation logic is exercised.';
    const session = makeSession({
      skills: [makeSkill('big', 'Big Skill', long)],
    });
    const prompt = composeWorkflowSystemPrompt(session);
    const skillLine = prompt
      .split('\n')
      .find((line) => line.includes('Big Skill'));
    expect(skillLine).toBeDefined();
    // The text after the em-dash should be at most ~80 chars (plus ellipsis).
    const afterDash = skillLine!.split('-')[1]?.trim() ?? '';
    expect(afterDash.length).toBeLessThanOrEqual(83);
  });

  it('includes the PROGRESS PROTOCOL block + valid + invalid examples', () => {
    const prompt = composeWorkflowSystemPrompt(makeSession());
    expect(prompt).toContain('PROGRESS PROTOCOL - REQUIRED ON EVERY RESPONSE');
    expect(prompt).toContain('VALID MARKER EXAMPLES (copy this format):');
    expect(prompt).toContain('<step n="3" status="now" />');
    expect(prompt).toContain('INVALID MARKERS (do NOT do these):');
  });

  it('includes the QUESTION PROTOCOL with <ask> types', () => {
    const prompt = composeWorkflowSystemPrompt(makeSession());
    expect(prompt).toContain('QUESTION PROTOCOL - WHEN YOU NEED USER INPUT');
    expect(prompt).toContain('<ask type="text"');
    expect(prompt).toContain('<ask type="number"');
    expect(prompt).toContain('<ask type="choice"');
    expect(prompt).toContain('<ask type="boolean"');
    expect(prompt).toContain('<ask type="rating"');
  });

  it('includes the ANSWER ENVELOPE format', () => {
    const prompt = composeWorkflowSystemPrompt(makeSession());
    expect(prompt).toContain('ANSWER ENVELOPE - HOW USER ANSWERS ARRIVE');
    expect(prompt).toContain('[workflow_answer ask_id="abc-123" step_n="3"]');
    expect(prompt).toContain('<answer>$500/month</answer>');
    expect(prompt).toContain('[/workflow_answer]');
  });

  it('includes the SUMMARY OF NON-NEGOTIABLES', () => {
    const prompt = composeWorkflowSystemPrompt(makeSession());
    expect(prompt).toContain('SUMMARY OF NON-NEGOTIABLES');
    expect(prompt).toContain('1. EVERY response begins with <step> or <ask>. No exceptions.');
    expect(prompt).toContain('2. Markers are plain text');
    expect(prompt).toContain('5. Step numbers must be in [1, 3].');
  });

  it('is IDENTICAL for two calls with the same session (cacheable)', () => {
    const session = makeSession();
    const a = composeWorkflowSystemPrompt(session);
    const b = composeWorkflowSystemPrompt(session);
    expect(a).toBe(b);
  });

  it('reflects the actual step count and titles', () => {
    const steps = [
      makeStep(1, 'One'),
      makeStep(2, 'Two'),
      makeStep(3, 'Three'),
      makeStep(4, 'Four'),
      makeStep(5, 'Five'),
    ];
    const prompt = composeWorkflowSystemPrompt(makeSession({ steps }));
    expect(prompt).toContain('WORKFLOW STEPS (5 total');
    expect(prompt).toContain('1. One');
    expect(prompt).toContain('5. Five');
    expect(prompt).toContain('Step numbers must be in [1, 5].');
  });

  it('handles total_steps: 0 cleanly (header + empty list + protocol)', () => {
    const session = makeSession({ steps: [], total_steps: 0 });
    const prompt = composeWorkflowSystemPrompt(session);
    expect(prompt).toContain('WORKFLOW STEPS (0 total');
    expect(prompt).toContain('PROGRESS PROTOCOL - REQUIRED ON EVERY RESPONSE');
    expect(prompt).toContain('Step numbers must be in [1, 0].');
  });
});
