/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Canonical workflow session types for the Wayland workflow launch surface.
 * See SPEC §4.2 (`.planning/brainstorm/2026-05-25-workflow-launch-surface/SPEC.md`).
 */

export type WorkflowSessionStatus = 'active' | 'complete' | 'errored' | 'ended';

export type StepStatus = 'todo' | 'now' | 'done' | 'skipped' | 'errored';

/**
 * Live driver gate for a workflow run (the run-state machine).
 *  - `running`        – the driver may advance/await as turns complete.
 *  - `paused`         – user explicitly paused; the driver halts losslessly.
 *  - `awaiting_input` – halted pending a human action (step-gate or an ask).
 *  - `done`           – terminal; the driver never fires again.
 */
export type WorkflowRunMode = 'running' | 'paused' | 'awaiting_input' | 'done';

export const WORKFLOW_RUN_MODES: readonly WorkflowRunMode[] = [
  'running',
  'paused',
  'awaiting_input',
  'done',
];

export const isWorkflowRunMode = (v: unknown): v is WorkflowRunMode =>
  typeof v === 'string' && (WORKFLOW_RUN_MODES as readonly string[]).includes(v);

/**
 * User-chosen run cadence (the binary toggle on the run surface).
 *  - `step` – step-by-step; the driver awaits a human nudge between steps.
 *  - `auto` – auto-run; the driver advances steps without prompting.
 */
export type WorkflowInteractivity = 'step' | 'auto';

export const WORKFLOW_INTERACTIVITIES: readonly WorkflowInteractivity[] = ['step', 'auto'];

export const isWorkflowInteractivity = (v: unknown): v is WorkflowInteractivity =>
  typeof v === 'string' && (WORKFLOW_INTERACTIVITIES as readonly string[]).includes(v);

export type StepState = {
  n: number; // 1-based step index
  title: string; // parsed from `## Step N: <title>`
  body_excerpt: string; // first 1KB of step's prose (for rotating prompt)
  status: StepStatus;
  started_at: number | null; // epoch ms
  completed_at: number | null;
  eta_seconds: number | null; // source order: author > empirical > heuristic
  eta_source: 'author' | 'empirical' | 'heuristic' | null;
  autonomous_run: {
    // present when "Run autonomously" was clicked
    dispatch_id: string;
    started_at: number;
    state: 'running' | 'reporting' | 'done' | 'failed';
  } | null;
};

export type ResolvedSkill = {
  slug: string; // 'workflow-designer'
  display_name: string; // 'Workflow Designer'
  icon: string | null; // SVG path or lucide icon name
  description: string;
};

export type AskRecord = {
  id: string; // UUID
  step_n: number; // step at which asked
  question: string;
  type: 'text' | 'number' | 'choice' | 'boolean' | 'rating';
  options: string[] | null; // for 'choice'
  max: number | null; // for 'rating'
  placeholder: string | null;
  answer: string | null; // null until answered
  asked_at: number;
  answered_at: number | null;
};

export type WorkflowSession = {
  id: string;
  workflow_name: string;
  workflow_title: string;
  conversation_id: string;
  current_step: number;
  total_steps: number;
  steps: StepState[];
  skills: ResolvedSkill[];
  asks: AskRecord[];
  status: WorkflowSessionStatus;
  palette: string | null;
  category: string | null;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
  /**
   * Epoch ms when the hidden "begin {workflow_name}" message was first sent
   * to the agent for this session. Used by WorkflowSurface to guarantee
   * exactly-once begin semantics across mount/unmount and refresh. `null`
   * means begin has not yet fired.
   */
  begin_sent_at: number | null;
  /** Live driver gate for the run-state machine. Defaults to `running`. */
  run_mode: WorkflowRunMode;
  /** User-chosen run cadence (the binary toggle). Defaults to `step`. */
  interactivity: WorkflowInteractivity;
};

export type WorkflowMarker =
  | { kind: 'step'; n: number; status: StepStatus }
  | { kind: 'ask'; ask: Omit<AskRecord, 'id' | 'step_n' | 'asked_at' | 'answer' | 'answered_at'> };

// NEW per audit (SPEC §11.1): source-tagged transitions for monotonic state
export type StepTransitionSource = 'parent' | 'worker' | 'user';

export type StepTransition = {
  step_n: number;
  status: StepStatus;
  source: StepTransitionSource;
  dispatch_id: string | null; // present when source='worker'
  timestamp: number; // epoch ms
};
