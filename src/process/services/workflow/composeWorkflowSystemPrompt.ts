/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Composes the STATIC `WORKFLOW_PROTOCOL` system prompt block (SPEC §7.1).
// Injected ONCE at workflow session creation as part of the conversation's
// system-prompt assembly. Must be IDENTICAL for two calls with the same
// session - prompt caching depends on this. All dynamic per-step content
// lives in `WORKFLOW_STEP_CONTEXT` (§7.2), which is composed elsewhere.
import type {
  ResolvedSkill,
  StepState,
  WorkflowSession,
} from '@/common/types/workflowTypes';

const SKILL_DESC_MAX_CHARS = 80;

/**
 * Truncates a skill description to the first sentence, or to ~80 chars
 * with an ellipsis. Returns the original string when already short enough.
 */
function truncateDescription(description: string): string {
  const trimmed = description.trim();
  if (trimmed.length === 0) return '';
  // Prefer the first sentence ending in `.`, `!`, or `?` (followed by space or EOS).
  const sentenceMatch = trimmed.match(/^[^.!?]*[.!?](?=\s|$)/);
  if (sentenceMatch && sentenceMatch[0].length <= SKILL_DESC_MAX_CHARS) {
    return sentenceMatch[0];
  }
  if (trimmed.length <= SKILL_DESC_MAX_CHARS) return trimmed;
  return `${trimmed.slice(0, SKILL_DESC_MAX_CHARS).trimEnd()}…`;
}

function renderStepList(steps: ReadonlyArray<StepState>): string {
  if (steps.length === 0) return '  (no steps)';
  return steps.map((step) => `  ${step.n}. ${step.title}`).join('\n');
}

function renderSkillList(skills: ReadonlyArray<ResolvedSkill>): string {
  if (skills.length === 0) return 'SKILLS ACTIVE: (none)';
  const lines = skills.map(
    (skill) => `  • ${skill.display_name} - ${truncateDescription(skill.description)}`
  );
  return ['SKILLS ACTIVE:', ...lines].join('\n');
}

/**
 * Builds the static `WORKFLOW_PROTOCOL` system prompt for the given session.
 * The output is a deterministic function of the session - two calls with the
 * same session produce byte-identical strings. See SPEC §7.1 for the template.
 */
export function composeWorkflowSystemPrompt(session: WorkflowSession): string {
  const stepList = renderStepList(session.steps);
  const skillBlock = renderSkillList(session.skills);
  return `You are executing a structured workflow: "${session.workflow_title}".

WORKFLOW STEPS (${session.total_steps} total, titles only - the user sees the full step body separately):
${stepList}

${skillBlock}

═══════════════════════════════════════════════════════════════════
PROGRESS PROTOCOL - REQUIRED ON EVERY RESPONSE
═══════════════════════════════════════════════════════════════════

Every response you produce in this workflow MUST begin with at least one of:
  <step n="N" status="now" />     - starting work on step N
  <step n="N" status="done" />    - completing step N
  <step n="N" status="skipped" /> - skipping step N (only with user permission)
  <ask type="..."> … </ask>       - asking the user for information

If you produce no marker at all, your progress will not register and the user will
see your message as "agent confused - please clarify." This breaks the workflow.

VALID MARKER EXAMPLES (copy this format):
  <step n="3" status="now" />
  <step n="3" status="done" />
  <ask type="number" placeholder="Monthly budget in USD">What's your automation budget?</ask>
  <ask type="choice" options="Zapier,n8n,Make,Custom code">Which tool fits best?</ask>

INVALID MARKERS (do NOT do these):
  \`<step n="3" status="now" />\`        ← wrapped in backticks (code fence). Markers must be plain text.
  &lt;step n="3" status="now" /&gt;     ← HTML-escaped. Emit the raw \`<\` and \`>\` characters.
  <step n=foo status=bar />            ← non-numeric n, unknown status. Will be ignored.
  <step n="99" status="now" />         ← n outside [1, ${session.total_steps}]. Will be ignored.

═══════════════════════════════════════════════════════════════════
QUESTION PROTOCOL - WHEN YOU NEED USER INPUT
═══════════════════════════════════════════════════════════════════

Instead of asking in prose, emit an <ask> block. The user sees a focused input
card with the right shape - much higher response rate than an open prose ask.

Types:
  <ask type="text" placeholder="hint">Question?</ask>
  <ask type="number" placeholder="hint">How much?</ask>
  <ask type="choice" options="A,B,C">Pick one.</ask>
  <ask type="boolean">Yes or no?</ask>
  <ask type="rating" max="5">Rate from 1 to N.</ask>

After you emit an <ask>, STOP and wait for the user's answer. Their answer will arrive
as a structured envelope in the next turn (see ANSWER ENVELOPE below) - do not infer or
assume an answer.

═══════════════════════════════════════════════════════════════════
ANSWER ENVELOPE - HOW USER ANSWERS ARRIVE
═══════════════════════════════════════════════════════════════════

When the user answers an <ask>, the next user message will contain a block like:

  [workflow_answer ask_id="abc-123" step_n="3"]
  <answer>$500/month</answer>
  [/workflow_answer]

This is the DIRECT ANSWER to the <ask> you emitted (correlated by ask_id). Treat the
contents of <answer>…</answer> as the user's answer to that specific question - NOT
as new conversational input or a new request. Continue the workflow step using this answer.

The user may also include free-form text outside the envelope; treat that as a follow-up
question or redirect, not as the answer.

═══════════════════════════════════════════════════════════════════
SUMMARY OF NON-NEGOTIABLES
═══════════════════════════════════════════════════════════════════

  1. EVERY response begins with <step> or <ask>. No exceptions.
  2. Markers are plain text - never code-fenced, never HTML-escaped.
  3. <ask> is for user input; STOP after emitting one and wait.
  4. <answer> envelopes are direct answers to your previous <ask>, not new requests.
  5. Step numbers must be in [1, ${session.total_steps}].`;
}
