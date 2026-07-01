/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #504 AskUserQuestion rendering.
 *
 * The engine surfaces `AskUserQuestion` as an ordinary `info`-category
 * `tool_request` (wayland-core has no `question` ToolCategory), with the prompt
 * buried inside `tool.args`:
 *
 *   { question: string, header?: string, multiSelect?: boolean,
 *     options: [{ label: string, description: string }] }
 *
 * The old desktop code mapped it to the generic `info` confirmation, which
 * rendered an empty approval box (issue #504). This module lifts the question +
 * choices out of the args so the renderer can show them as selectable answers.
 *
 * The chosen option's `label` is sent back over the approval channel
 * (`tool_approve.answer`, wayland-core v0.9.3+); the engine feeds that label to
 * the model as the tool's output. The name guard here mirrors the engine's own
 * answer-synth guard (`tool_name == "AskUserQuestion"`), so we only render the
 * choice UI when the answer channel is actually honored.
 */

import type { ToolInfo } from './protocol';

/** The engine tool whose answer routes back via `tool_approve.answer`. */
export const ASK_USER_QUESTION_TOOL = 'AskUserQuestion';

export type QuestionChoice = { label: string; description?: string };

export type QuestionConfirmation = {
  type: 'question';
  title: string;
  question: string;
  header?: string;
  choices: QuestionChoice[];
};

function trimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/** Normalize one raw option entry (object `{label,description}` or bare string). */
function normalizeChoice(raw: unknown): QuestionChoice | null {
  if (typeof raw === 'string') {
    const label = raw.trim();
    return label ? { label } : null;
  }
  if (raw && typeof raw === 'object') {
    const rec = raw as Record<string, unknown>;
    const label = trimmedString(rec.label) ?? trimmedString(rec.value);
    if (!label) return null;
    const description = trimmedString(rec.description);
    return description ? { label, description } : { label };
  }
  return null;
}

/** Pull the choice list from args - `options` (AskUserQuestion) or `choices`. */
function extractChoices(args: Record<string, unknown>): QuestionChoice[] {
  const source = Array.isArray(args.options) ? args.options : Array.isArray(args.choices) ? args.choices : [];
  const seen = new Set<string>();
  const choices: QuestionChoice[] = [];
  for (const raw of source) {
    const choice = normalizeChoice(raw);
    // Dedupe by label: the answer channel is keyed on the label, so duplicate
    // labels would be indistinguishable when the engine synthesizes the result.
    if (choice && !seen.has(choice.label)) {
      seen.add(choice.label);
      choices.push(choice);
    }
  }
  return choices;
}

/**
 * Parse an AskUserQuestion-class `tool_request` into structured question
 * details, or `null` if `tool` is not a renderable question prompt (wrong name,
 * or no usable choices - in which case the caller falls back to the generic
 * confirmation rather than showing an empty choice list).
 */
export function parseQuestionTool(tool: Pick<ToolInfo, 'name' | 'args' | 'description'>): QuestionConfirmation | null {
  if (tool?.name !== ASK_USER_QUESTION_TOOL) return null;
  const args = (tool.args ?? {}) as Record<string, unknown>;
  const choices = extractChoices(args);
  if (choices.length === 0) return null;

  const question = trimmedString(args.question) ?? trimmedString(tool.description) ?? ASK_USER_QUESTION_TOOL;
  const header = trimmedString(args.header);
  return {
    type: 'question',
    title: header ?? question,
    question,
    header,
    choices,
  };
}
