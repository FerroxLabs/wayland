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
import { buildResumeSeedTranscript } from '@/process/task/resumeSeed';
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

describe('#723 carry-forward contract - WORKFLOW_RESET_SEED_BOUND', () => {
  // A REALISTIC per-step reset history, mirroring the real DB shape at reset
  // time: 5 step deliverables interleaved with hidden advance directives
  // (`right` rows) and tool rows, and a TOOL-HEAVY tail after the last
  // deliverable, plus a >4000-char final deliverable. This is the shape a tiny
  // fixture cannot expose (W1): with a naive `slice(-4)` tail bound a tool-heavy
  // step pushes the actual deliverable OUT of the window, and a >4000-char
  // deliverable is truncated to its LAST 4000 chars - so the load-bearing HEAD a
  // dependent step needs is lost. The bound must carry the immediately-prior
  // deliverable's load-bearing content regardless.
  const DELIVERABLE_HEAD = 'DRAFT-V5-HEADING: the canonical release plan';
  // >4000 chars so a raw char-tail slice would truncate the head.
  const bigDeliverable = `${DELIVERABLE_HEAD}\n` + 'body '.repeat(1200);

  const history: TMessage[] = [
    textMsg('right', 'Proceed to step 1: Intro', 'd1'), // hidden advance directive (user row)
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
    textMsg('right', 'Proceed to step 5: Expand', 'd5'),
    textMsg('left', bigDeliverable, 's5'), // the immediately-prior deliverable
    // Tool-heavy tail AFTER the deliverable - a naive slice(-4) would evict s5.
    toolCallMsg('Read', 't5a'),
    fileEditGroupMsg('src/draft.md', 'g5'),
    toolCallMsg('Grep', 't5b'),
  ];

  it('carries the immediately-prior deliverable (load-bearing head intact), not the 1..N-2 history', () => {
    const seed = buildResumeSeedTranscript(history, WORKFLOW_RESET_SEED_BOUND);

    // The dependent step ("refine the draft you just wrote") gets the prior
    // deliverable, HEAD included - the tool-heavy tail did not evict it and the
    // >4000-char body was not truncated away from its heading.
    expect(seed).toContain(DELIVERABLE_HEAD);
    expect(seed).toContain('Assistant:');

    // The seed is the LAST deliverable only - not the earlier steps' text and
    // not the trailing tool rows. This is the O(1)-per-step carry-forward.
    expect(seed).not.toContain('step 1 output');
    expect(seed).not.toContain('step 2 output');
    expect(seed).not.toContain('step 4 output'); // only the immediately-prior step
    expect(seed).not.toContain('WriteFile'); // trailing/older tool rows dropped
  });

  it('leaves the default-bound seed (no opts) unchanged - the tight bound is opt-in (#457 not regressed)', () => {
    const tight = buildResumeSeedTranscript(history, WORKFLOW_RESET_SEED_BOUND);
    const dflt = buildResumeSeedTranscript(history);

    // The default #457 seed is broad: it retains tool/file-edit history and the
    // earlier steps. The tight per-step bound explicitly drops them.
    expect(dflt).toContain('WriteFile');
    expect(dflt).toContain('step 1 output');
    expect(dflt).toContain(DELIVERABLE_HEAD);
    // Opt-in tightening genuinely changes the output.
    expect(dflt).not.toBe(tight);
  });

  it('falls back to the default bounded tail when there is no assistant deliverable', () => {
    // A history with only user rows + tools (no assistant text) must not seed
    // empty - it falls through to the normal bounded tail so resume is not blank.
    const noAssistant: TMessage[] = [
      textMsg('right', 'Proceed to step 1', 'd1'),
      toolCallMsg('Grep', 't1'),
    ];
    const seed = buildResumeSeedTranscript(noAssistant, WORKFLOW_RESET_SEED_BOUND);
    expect(seed).toContain('User: Proceed to step 1');
    expect(seed).toContain('Grep');
  });
});
