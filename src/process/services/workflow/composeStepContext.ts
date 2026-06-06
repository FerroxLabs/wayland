/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Composes the per-turn WORKFLOW_STEP_CONTEXT control block (SPEC §7.2).
 *
 * This block is the dynamic complement to the static WORKFLOW_PROTOCOL system
 * prompt (SPEC §7.1). It is prepended to the user-channel input every turn so
 * that the system prompt itself stays untouched and prompt caching holds across
 * the entire workflow run.
 *
 * The block format is byte-stable: opening tag, current-step header, optional
 * step body (truncated at 8KB), the transitions tape, and a literal closing
 * tag. The downstream stream parser (SPEC §8) relies on the closing terminator.
 */

import type { StepState, WorkflowSession } from '@/common/types/workflowTypes';

const MAX_BODY_BYTES = 8192;
const TRUNCATION_SUFFIX = ' …[truncated]';
const OPEN_TAG = 'workflow_step_context';

const STATUS_GLYPH: Record<StepState['status'], string> = {
  done: '✓',
  now: '→',
  todo: '⋯',
  skipped: '⊘',
  errored: '⚠',
};

const STATUS_LABEL: Record<StepState['status'], string> = {
  done: 'done',
  now: 'in progress',
  todo: 'pending',
  skipped: 'skipped',
  errored: 'errored',
};

function formatElapsed(startedAt: number | null, completedAt: number | null): string | null {
  if (startedAt === null || completedAt === null) return null;
  const elapsedSeconds = Math.max(0, Math.floor((completedAt - startedAt) / 1000));
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function truncateBody(body: string): string {
  if (body.length <= MAX_BODY_BYTES) return body;
  return body.slice(0, MAX_BODY_BYTES) + TRUNCATION_SUFFIX;
}

function renderTransition(step: StepState): string {
  const glyph = STATUS_GLYPH[step.status];
  const label = STATUS_LABEL[step.status];
  const elapsed = step.status === 'done' ? formatElapsed(step.started_at, step.completed_at) : null;
  const tail = elapsed === null ? `(${label})` : `(${label}, ${elapsed})`;
  return `  ${glyph} Step ${step.n}: ${step.title} ${tail}`;
}

export function composeStepContext(session: WorkflowSession): string {
  if (session.current_step === 0 || session.total_steps === 0) return '';

  const lines: string[] = [];
  lines.push(`[${OPEN_TAG} current_step="${session.current_step}" total_steps="${session.total_steps}"]`);

  const activeStep = session.steps[session.current_step - 1] ?? null;
  if (activeStep !== null) {
    lines.push(`You are currently on Step ${activeStep.n}: "${activeStep.title}".`);
    lines.push('');
    lines.push(`Step ${activeStep.n} body (from the workflow author):`);
    lines.push(truncateBody(activeStep.body_excerpt));
    lines.push('');
  }

  lines.push('Recent step transitions:');
  for (const step of session.steps) {
    lines.push(renderTransition(step));
  }

  lines.push(`[/${OPEN_TAG}]`);
  return lines.join('\n');
}
