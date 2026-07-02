/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #504 AskUserQuestion parsing. The engine sends AskUserQuestion as an
 * `info`-category tool with the prompt buried in args; parseQuestionTool lifts
 * the question + choices out so the renderer can show selectable answers.
 */
import { describe, it, expect } from 'vitest';
import { parseQuestionTool, ASK_USER_QUESTION_TOOL } from '@/process/agent/wcore/questionTool';
import type { ToolInfo } from '@/process/agent/wcore/protocol';

const tool = (over: Partial<ToolInfo>): ToolInfo => ({
  name: ASK_USER_QUESTION_TOOL,
  category: 'info',
  description: '',
  args: {},
  ...over,
});

describe('parseQuestionTool (#504)', () => {
  it('parses AskUserQuestion options ({label, description}) into choices', () => {
    const result = parseQuestionTool(
      tool({
        args: {
          question: 'Which offer structure fits?',
          header: 'Nail the offer',
          options: [
            { label: 'Founding Member deal', description: 'Paid now via Gumroad' },
            { label: 'Free core + paid Pro', description: 'Open-source base' },
          ],
        },
      })
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe('question');
    expect(result!.question).toBe('Which offer structure fits?');
    expect(result!.header).toBe('Nail the offer');
    expect(result!.title).toBe('Nail the offer'); // header preferred as title
    expect(result!.choices).toEqual([
      { label: 'Founding Member deal', description: 'Paid now via Gumroad' },
      { label: 'Free core + paid Pro', description: 'Open-source base' },
    ]);
  });

  it('supports a bare `choices: string[]` shape and falls back to the question as title', () => {
    const result = parseQuestionTool(tool({ args: { question: 'Pick one', choices: ['Alpha', 'Beta', '  '] } }));
    expect(result!.choices).toEqual([{ label: 'Alpha' }, { label: 'Beta' }]); // blank dropped
    expect(result!.title).toBe('Pick one'); // no header → question is the title
    expect(result!.header).toBeUndefined();
  });

  it('returns null for a non-AskUserQuestion tool (answer channel would be ignored engine-side)', () => {
    expect(parseQuestionTool(tool({ name: 'clarify', args: { choices: ['a', 'b'] } }))).toBeNull();
    expect(parseQuestionTool(tool({ name: 'Bash', args: { command: 'ls' } }))).toBeNull();
  });

  it('returns null when there are no usable choices (so it falls back to the generic confirmation)', () => {
    expect(parseQuestionTool(tool({ args: { question: 'q', options: [] } }))).toBeNull();
    expect(parseQuestionTool(tool({ args: { question: 'q' } }))).toBeNull();
    expect(parseQuestionTool(tool({ args: { options: [{ description: 'no label' }] } }))).toBeNull();
  });

  it('dedupes choices by label (the answer channel is keyed on the label)', () => {
    const result = parseQuestionTool(
      tool({ args: { question: 'q', options: [{ label: 'A' }, { label: 'A' }, { label: 'B' }] } })
    );
    expect(result!.choices).toEqual([{ label: 'A' }, { label: 'B' }]);
  });

  it('falls back to the tool description, then the tool name, when args.question is missing', () => {
    const withDesc = parseQuestionTool(tool({ description: 'desc?', args: { choices: ['a'] } }));
    expect(withDesc!.question).toBe('desc?');
    const withNothing = parseQuestionTool(tool({ description: '', args: { choices: ['a'] } }));
    expect(withNothing!.question).toBe(ASK_USER_QUESTION_TOOL);
  });

  it('does not throw on malformed args', () => {
    expect(() => parseQuestionTool(tool({ args: undefined as never }))).not.toThrow();
    expect(() => parseQuestionTool(tool({ args: { options: 'not-an-array' } as never }))).not.toThrow();
  });
});
