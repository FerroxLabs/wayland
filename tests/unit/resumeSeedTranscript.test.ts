/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #457 True Continue - resume-seeding must retain tool/file-edit history.
 *
 * The old seed (WCoreManager.ts:338-342) replayed only the last 20 TEXT
 * messages, so a rebuilt engine session lost every tool call and file edit and
 * the model restarted from scratch. buildResumeSeedTranscript must include
 * tool_call + tool_group (file-edit) entries so resumed work is preserved.
 */
import { describe, it, expect } from 'vitest';
import { buildResumeSeedTranscript, composeResetSeed } from '@/process/task/resumeSeed';
import { WORKFLOW_RESET_SEED_BOUND } from '@process/services/workflow/workflowAdvanceReset';
import type { TMessage } from '@/common/chat/chatLib';

const textMsg = (position: 'left' | 'right', content: string, id: string): TMessage =>
  ({ id, type: 'text', position, conversation_id: 'c1', content: { content }, createdAt: 1 }) as TMessage;

const toolCallMsg = (name: string, id: string): TMessage =>
  ({
    id,
    type: 'tool_call',
    position: 'left',
    conversation_id: 'c1',
    content: { callId: `call-${id}`, name, args: {}, status: 'success' },
    createdAt: 1,
  }) as TMessage;

const fileEditGroupMsg = (fileName: string, id: string): TMessage =>
  ({
    id,
    type: 'tool_group',
    position: 'left',
    conversation_id: 'c1',
    content: [
      {
        callId: `call-${id}`,
        description: 'edit',
        name: 'WriteFile',
        renderOutputAsMarkdown: false,
        resultDisplay: { fileDiff: '@@ -1 +1 @@', fileName },
        status: 'Success',
      },
    ],
    createdAt: 1,
  }) as TMessage;

// #723: a tool_group whose resultDisplay is a STRING (a Search/Read whose
// findings ARE the deliverable) - the shape FIX 3 must carry into the seed.
const toolResultGroupMsg = (name: string, resultText: string, id: string): TMessage =>
  ({
    id,
    type: 'tool_group',
    position: 'left',
    conversation_id: 'c1',
    content: [
      {
        callId: `call-${id}`,
        description: 'search',
        name,
        renderOutputAsMarkdown: true,
        resultDisplay: resultText,
        status: 'Success',
      },
    ],
    createdAt: 1,
  }) as TMessage;

const codexPatchMsg = (filePath: string, id: string): TMessage =>
  ({
    id,
    type: 'codex_tool_call',
    position: 'left',
    conversation_id: 'c1',
    content: {
      toolCallId: `call-${id}`,
      status: 'success',
      kind: 'patch',
      title: 'Apply patch',
      subtype: 'patch_apply_end',
      content: [{ type: 'diff', filePath, oldText: 'a', newText: 'b' }],
      data: {},
    },
    createdAt: 1,
  }) as unknown as TMessage;

describe('buildResumeSeedTranscript (#457)', () => {
  it('retains tool_call and file-edit history, not just text', () => {
    const messages: TMessage[] = [
      textMsg('right', 'Refactor the auth module', 'u1'),
      textMsg('left', 'Starting the refactor.', 'a1'),
      toolCallMsg('Grep', 't1'),
      fileEditGroupMsg('src/auth/login.ts', 'g1'),
    ];

    const seed = buildResumeSeedTranscript(messages);

    // Text turns preserved with role prefixes.
    expect(seed).toContain('User: Refactor the auth module');
    expect(seed).toContain('Assistant: Starting the refactor.');
    // Tool + file-edit work preserved (the regression this fixes).
    expect(seed).toContain('Grep');
    expect(seed).toContain('WriteFile');
    expect(seed).toContain('src/auth/login.ts');
  });

  it('preserves codex_tool_call file-patch paths (#467 fold)', () => {
    // A resumed session must know which files a codex patch already touched -
    // the path lives in content[].filePath, not in a top-level field.
    const seed = buildResumeSeedTranscript([
      textMsg('right', 'Patch the config', 'u1'),
      codexPatchMsg('src/config/settings.ts', 'x1'),
    ]);
    expect(seed).toContain('codex');
    expect(seed).toContain('src/config/settings.ts');
  });

  it('surfaces file paths carried in tool_call args', () => {
    const editCall = {
      id: 'e1',
      type: 'tool_call',
      position: 'left',
      conversation_id: 'c1',
      content: { callId: 'call-e1', name: 'Edit', args: { filePath: 'src/index.ts' }, status: 'success' },
      createdAt: 1,
    } as unknown as TMessage;
    const seed = buildResumeSeedTranscript([editCall]);
    expect(seed).toContain('Edit');
    expect(seed).toContain('src/index.ts');
  });

  it('caps a single oversized entry (per-entry budget) so it cannot eat the tail', () => {
    const huge = 'x'.repeat(5000);
    const messages: TMessage[] = [textMsg('right', huge, 'u1'), textMsg('left', 'the important latest reply', 'a1')];
    // Total budget is generous; the per-entry cap is what keeps the huge first
    // message from crowding out the latest reply.
    const seed = buildResumeSeedTranscript(messages, { perEntryChars: 200 });
    expect(seed).toContain('the important latest reply');
    // The oversized entry was clipped, not replayed whole.
    expect(seed).not.toContain(huge);
    expect(seed).toContain('…');
  });

  it('does not drop a whole tool_group when one item is null', () => {
    const messages = [
      {
        id: 'g1',
        type: 'tool_group',
        position: 'left',
        conversation_id: 'c1',
        content: [
          null,
          {
            callId: 'call-g1',
            description: 'edit',
            name: 'WriteFile',
            renderOutputAsMarkdown: false,
            resultDisplay: { fileDiff: '@@', fileName: 'src/kept.ts' },
            status: 'Success',
          },
        ],
        createdAt: 1,
      } as unknown as TMessage,
    ];
    expect(() => buildResumeSeedTranscript(messages)).not.toThrow();
    const seed = buildResumeSeedTranscript(messages);
    // The surviving item's file edit is retained despite the null sibling.
    expect(seed).toContain('WriteFile');
    expect(seed).toContain('src/kept.ts');
  });

  it('skips empty/whitespace text messages', () => {
    const seed = buildResumeSeedTranscript([textMsg('left', '   ', 'a1'), textMsg('right', 'hi', 'u1')]);
    expect(seed).toBe('User: hi');
  });

  it('returns empty string for no replayable messages', () => {
    expect(buildResumeSeedTranscript([])).toBe('');
  });

  it('skips unknown message types without dropping the rest of the transcript', () => {
    // The DB stores types beyond text/tool_call/tool_group (thinking,
    // sub_agent_event, cron, ...). An unknown type must be skipped, never throw
    // - else WCoreManager's try/catch swallows it and resumes with ZERO history.
    const messages = [
      textMsg('right', 'first', 'u1'),
      {
        id: 'k1',
        type: 'thinking',
        position: 'left',
        conversation_id: 'c1',
        content: { content: 'hmm' },
        createdAt: 1,
      } as unknown as TMessage,
      textMsg('left', 'second', 'a1'),
    ];
    const seed = buildResumeSeedTranscript(messages);
    expect(seed).toContain('User: first');
    expect(seed).toContain('Assistant: second');
  });

  it('does not let one malformed message nuke the whole transcript', () => {
    // A row whose shape violates expectations (e.g. tool_group content not an
    // array, text content not a string) must be skipped, not throw.
    const messages = [
      textMsg('right', 'keep me', 'u1'),
      {
        id: 'bad1',
        type: 'tool_group',
        position: 'left',
        conversation_id: 'c1',
        content: null,
        createdAt: 1,
      } as unknown as TMessage,
      {
        id: 'bad2',
        type: 'text',
        position: 'left',
        conversation_id: 'c1',
        content: { content: { not: 'a string' } },
        createdAt: 1,
      } as unknown as TMessage,
      textMsg('left', 'and me', 'a1'),
    ];
    expect(() => buildResumeSeedTranscript(messages)).not.toThrow();
    const seed = buildResumeSeedTranscript(messages);
    expect(seed).toContain('User: keep me');
    expect(seed).toContain('Assistant: and me');
  });

  it('caps the transcript to the char budget (keeps the most recent tail)', () => {
    const many: TMessage[] = Array.from({ length: 50 }, (_v, i) =>
      textMsg(i % 2 === 0 ? 'right' : 'left', `message number ${i}`, `m${i}`)
    );
    const seed = buildResumeSeedTranscript(many, { maxChars: 120 });
    expect(seed.length).toBeLessThanOrEqual(120);
    // The tail (latest) survives; the head is dropped.
    expect(seed).toContain('message number 49');
    expect(seed).not.toContain('message number 0');
  });
});

describe('#723 carry-forward contract - WORKFLOW_RESET_SEED_BOUND (whole prior turn, LIVE shape)', () => {
  // EVERY fixture ends with a trailing hidden advance directive (a `right` row):
  // the LIVE reset shape. The skipCache respawn persists the current directive
  // to SQLite BEFORE start() reads history, so the tail row is the CURRENT
  // directive - not the prior deliverable. A fixture WITHOUT the trailing
  // directive is false-green (it tests a message shape that never occurs in
  // production). The selector must strip the current directive, land on the
  // PRIOR step's boundary, and carry the whole prior turn.
  const DELIVERABLE_HEAD = 'DRAFT-V5-HEADING: the canonical release plan';
  const bigDeliverable = `${DELIVERABLE_HEAD}\n` + 'body '.repeat(1200);

  const history: TMessage[] = [
    textMsg('right', 'Proceed to step 1: Intro', 'd1'),
    textMsg('left', 'step 1 output', 's1'),
    toolCallMsg('Grep', 't1'),
    textMsg('right', 'Proceed to step 2: Research', 'd2'),
    textMsg('left', 'step 2 output', 's2'),
    fileEditGroupMsg('src/research.md', 'g2'),
    textMsg('right', 'Proceed to step 3: Outline', 'd3'),
    textMsg('left', 'step 3 output', 's3'),
    textMsg('right', 'Proceed to step 4: Draft', 'd4'),
    textMsg('left', 'step 4 output', 's4'),
    fileEditGroupMsg('src/draft.md', 'g4'),
    textMsg('right', 'Proceed to step 5: Expand', 'd5'), // boundary that starts the prior turn
    textMsg('left', bigDeliverable, 's5'), // the immediately-prior deliverable
    // Tool-heavy tail - PART OF THE SAME (step 5) turn.
    toolCallMsg('Read', 't5a'),
    fileEditGroupMsg('src/final-draft.md', 'g5'),
    toolCallMsg('Grep', 't5b'),
    // LIVE SHAPE: the current advance directive, persisted before start() reads.
    textMsg('right', 'Proceed to step 6: Finalize', 'd6'),
  ];

  it('LIVE shape: strips the current directive, carries the WHOLE prior turn (deliverable + tool context)', () => {
    const seed = buildResumeSeedTranscript(history, WORKFLOW_RESET_SEED_BOUND);

    // The dependent step gets the prior deliverable, HEAD included...
    expect(seed).toContain(DELIVERABLE_HEAD);
    expect(seed).toContain('Assistant:');
    // ...AND the same turn's tool/file context (the file it just wrote).
    expect(seed).toContain('src/final-draft.md');

    // The CURRENT directive is stripped - it must NOT leak into the seed.
    expect(seed).not.toContain('step 6');
    expect(seed).not.toContain('Finalize');
    // And NOTHING from an earlier step: the walk stops at the prior boundary.
    expect(seed).not.toContain('step 1 output');
    expect(seed).not.toContain('step 2 output');
    expect(seed).not.toContain('step 4 output');
    expect(seed).not.toContain('src/draft.md'); // step 4's file excluded
    // It is NOT the 1000-char default fallback (the deliverable is fully present).
    expect(seed.length).toBeGreaterThan(2000);
  });

  it('leaves the default-bound seed (no opts) unchanged - the reset bound is opt-in (#457 not regressed)', () => {
    const tight = buildResumeSeedTranscript(history, WORKFLOW_RESET_SEED_BOUND);
    const dflt = buildResumeSeedTranscript(history);

    expect(dflt).toContain('step 1 output');
    expect(dflt).toContain(DELIVERABLE_HEAD);
    expect(dflt).not.toBe(tight);
    expect(dflt).toContain('step 4 output');
    expect(tight).not.toContain('step 4 output');
  });

  it('tool-only prior step (LIVE shape): carries the tool findings, never an older step', () => {
    // Step 5 produced NO assistant text - only a Search whose findings ARE the
    // deliverable. The single-last-text selector would cross into step 4.
    const toolOnly: TMessage[] = [
      textMsg('right', 'Proceed to step 4: Draft', 'd4'),
      textMsg('left', 'step 4 output PROSE', 's4'),
      textMsg('right', 'Proceed to step 5: Search', 'd5'),
      toolResultGroupMsg('WebSearch', 'FINDING: Reykjavik is the capital of Iceland', 'g5'),
      textMsg('right', 'Proceed to step 6: Summarize', 'd6'), // current directive
    ];
    const seed = buildResumeSeedTranscript(toolOnly, WORKFLOW_RESET_SEED_BOUND);
    // FIX 3: the tool's string findings survive (not just "[tools WebSearch]").
    expect(seed).toContain('FINDING: Reykjavik is the capital of Iceland');
    expect(seed).toContain('WebSearch');
    expect(seed).not.toContain('step 4 output PROSE'); // did NOT cross into step 4
    expect(seed).not.toContain('Summarize'); // current directive stripped
  });

  it('FIX 4: a >16K text deliverable does not evict its own trailing tool/file context', () => {
    const HEAD_MARKER = 'HEAD-16K: opening thesis';
    const bigText = `${HEAD_MARKER}\n` + 'x'.repeat(18000);
    const withTool: TMessage[] = [
      textMsg('right', 'Proceed to step 5: Expand', 'd5'),
      textMsg('left', bigText, 's5'),
      fileEditGroupMsg('src/reserved-context.md', 'g5'), // must survive the clip
      textMsg('right', 'Proceed to step 6: Refine', 'd6'), // current directive
    ];
    const seed = buildResumeSeedTranscript(withTool, WORKFLOW_RESET_SEED_BOUND);
    expect(seed).toContain(HEAD_MARKER);
    // The reserved tool budget keeps the file context even though the text is huge.
    expect(seed).toContain('src/reserved-context.md');
    expect(seed).not.toContain('Refine');
  });

  it('trailing status text (LIVE shape): carries the deliverable, not just the closer', () => {
    const trailing: TMessage[] = [
      textMsg('right', 'Proceed to step 5: Draft', 'd5'),
      textMsg('left', 'DRAFT-BODY: the canonical plan text with enough length', 's5a'),
      fileEditGroupMsg('src/draft.md', 'g5'),
      textMsg('left', 'Draft saved ✓', 's5b'),
      textMsg('right', 'Proceed to step 6: Refine', 'd6'), // current directive
    ];
    const seed = buildResumeSeedTranscript(trailing, WORKFLOW_RESET_SEED_BOUND);
    expect(seed).toContain('DRAFT-BODY: the canonical plan text with enough length');
    expect(seed).toContain('Draft saved ✓');
    expect(seed).not.toContain('Refine');
  });

  it('split deliverable (LIVE shape): carries every fragment of the prior turn', () => {
    const split: TMessage[] = [
      textMsg('right', 'Proceed to step 5: Draft', 'd5'),
      textMsg('left', 'PART-ONE: intro paragraph long enough to be substantive', 's5a'),
      toolCallMsg('Read', 't5'),
      textMsg('left', 'PART-TWO: closing paragraph', 's5b'),
      textMsg('right', 'Proceed to step 6: Refine', 'd6'), // current directive
    ];
    const seed = buildResumeSeedTranscript(split, WORKFLOW_RESET_SEED_BOUND);
    expect(seed).toContain('PART-ONE: intro paragraph long enough to be substantive');
    expect(seed).toContain('PART-TWO: closing paragraph');
  });

  it('LIVE shape >16K deliverable: deep markers survive, tail dropped, no fallback, no directive leak', () => {
    // Reproduces the round-2 harness repro exactly: >8000-char deliverable +
    // trailing current directive. Before the strip, this fell to the 1000-char
    // default and dropped MID2K/DEEP8K AND leaked "step 6". It must now carry
    // the full deliverable head.
    const huge =
      'HEAD0: opening thesis\n' +
      'a'.repeat(2000) +
      '\nMID2K: mid marker\n' +
      'b'.repeat(6000) +
      '\nDEEP8K: deep marker\n' +
      'c'.repeat(11000) +
      '\nTAIL19K: conclusion';
    const live16k: TMessage[] = [
      textMsg('right', 'Proceed to step 5: Expand', 'd5'),
      textMsg('left', huge, 's5'),
      textMsg('right', 'Proceed to step 6: Refine the draft you just wrote', 'd6'),
    ];
    const seed = buildResumeSeedTranscript(live16k, WORKFLOW_RESET_SEED_BOUND);
    expect(seed).toContain('HEAD0: opening thesis');
    expect(seed).toContain('MID2K: mid marker'); // ~2010 - survived (was dropped)
    expect(seed).toContain('DEEP8K: deep marker'); // ~8000 - survived (was dropped)
    expect(seed).not.toContain('TAIL19K'); // beyond the bound - head-clip drops the tail
    expect(seed).not.toContain('step 6'); // current directive stripped, no leak
    expect(seed.length).toBeGreaterThan(8000); // NOT the 1000-char fallback
    expect(seed.length).toBeLessThanOrEqual(16000);
  });

  it('FIX 6: a trivial mid-step fragment falls back to the default tail (real deliverable preserved)', () => {
    // A mid-step user interjection -> a trivial "Thanks!" is not a deliverable;
    // seeding it would starve the dependent step. Fall back to the default tail,
    // which still holds the real prior deliverable.
    const midInterjection: TMessage[] = [
      textMsg('right', 'Proceed to step 4: Draft the plan', 'd4'),
      textMsg('left', 'THE-REAL-DELIVERABLE: a long substantive plan body worth carrying forward', 's4'),
      textMsg('right', 'looks good, thanks', 'u1'), // mid-step interjection
      textMsg('left', 'Thanks!', 's5'), // trivial fragment
      textMsg('right', 'Proceed to step 5: Refine', 'd6'), // current directive
    ];
    const seed = buildResumeSeedTranscript(midInterjection, WORKFLOW_RESET_SEED_BOUND);
    // Fell back to the default tail -> the real deliverable is present.
    expect(seed).toContain('THE-REAL-DELIVERABLE: a long substantive plan body worth carrying forward');
  });

  it('empty turn (all directives): falls back to the default bounded tail, never blank', () => {
    const allDirectives: TMessage[] = [
      textMsg('right', 'Proceed to step 1', 'd1'),
      textMsg('right', 'Proceed to step 2', 'd2'),
    ];
    const seed = buildResumeSeedTranscript(allDirectives, WORKFLOW_RESET_SEED_BOUND);
    expect(seed).toContain('User: Proceed to step 1');
    expect(seed).toContain('User: Proceed to step 2');
  });

  it('composeResetSeed wiring: applies the bound when set, default #457 seed when absent (W2)', () => {
    const withBound = composeResetSeed(history, WORKFLOW_RESET_SEED_BOUND);
    expect(withBound).toContain(DELIVERABLE_HEAD);
    expect(withBound).not.toContain('step 1 output');

    const withoutBound = composeResetSeed(history);
    expect(withoutBound).toBe(buildResumeSeedTranscript(history));
    expect(withoutBound).toContain('step 1 output');
  });
});
