/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import type {
  IMessageCodexToolCall,
  IMessageText,
  IMessageToolCall,
  IMessageToolGroup,
  TMessage,
} from '@/common/chat/chatLib';
import { buildWCoreResumeReplayContext } from '@process/task/wcoreResumeReplay';

function textMessage(id: string, position: 'left' | 'right', content: string): IMessageText {
  return {
    id,
    conversation_id: 'conv-wcore-replay',
    type: 'text',
    position,
    content: { content },
  };
}

function editToolGroup(id: string): IMessageToolGroup {
  return {
    id,
    conversation_id: 'conv-wcore-replay',
    type: 'tool_group',
    position: 'left',
    content: [
      {
        callId: 'call-edit-1',
        description: 'Edited README quickstart',
        name: 'Edit',
        renderOutputAsMarkdown: true,
        status: 'Success',
        confirmationDetails: {
          type: 'edit',
          title: 'Edit README.md',
          fileName: 'README.md',
          fileDiff: '- old\n+ new',
          isModifying: true,
        },
      },
    ],
  };
}

function toolCall(id: string): IMessageToolCall {
  return {
    id,
    conversation_id: 'conv-wcore-replay',
    type: 'tool_call',
    position: 'left',
    content: {
      callId: 'call-read-1',
      name: 'read_file',
      args: { path: 'src/process/task/WCoreManager.ts' },
      status: 'success',
    },
  };
}

function codexPatch(id: string): IMessageCodexToolCall {
  return {
    id,
    conversation_id: 'conv-wcore-replay',
    type: 'codex_tool_call',
    position: 'left',
    content: {
      toolCallId: 'codex-patch-1',
      status: 'success',
      title: 'Patch applied',
      kind: 'patch',
      subtype: 'generic',
      content: [
        {
          type: 'diff',
          filePath: 'src/process/task/wcoreResumeReplay.ts',
          oldText: 'throw new Error',
          newText: 'return replay',
        },
      ],
    },
  };
}

describe('buildWCoreResumeReplayContext', () => {
  it('preserves text, tool calls, and file edit trajectory for WCore resume', () => {
    const messages: TMessage[] = [
      textMessage('m1', 'right', 'Please fix the quickstart.'),
      editToolGroup('m2'),
      textMessage('m3', 'left', 'Updated README.md and kept the commands unchanged.'),
    ];

    const result = buildWCoreResumeReplayContext(messages);

    expect(result).not.toBeNull();
    expect(result?.text).toContain('[BEGIN WCORE RESUME REPLAY');
    expect(result?.text).toContain('historical context only');
    expect(result?.text).toContain('[user]: Please fix the quickstart.');
    expect(result?.text).toContain('[assistant tool: Edit (Success)] Edited README quickstart');
    expect(result?.text).toContain('file: README.md');
    expect(result?.text).toContain('[assistant]: Updated README.md and kept the commands unchanged.');
    expect(result?.stats.replayedToolEvents).toBe(1);
    expect(result?.stats.replayedFileEvents).toBe(1);
  });

  it('preserves standalone tool calls and Codex file patches', () => {
    const messages: TMessage[] = [toolCall('m1'), codexPatch('m2')];

    const result = buildWCoreResumeReplayContext(messages);

    expect(result).not.toBeNull();
    expect(result?.text).toContain('[assistant tool: read_file');
    expect(result?.text).toContain('src/process/task/WCoreManager.ts');
    expect(result?.text).toContain('[assistant tool: Patch applied (success)]');
    expect(result?.text).toContain('src/process/task/wcoreResumeReplay.ts');
    expect(result?.stats.replayedToolEvents).toBe(2);
    expect(result?.stats.replayedFileEvents).toBe(2);
  });

  it('keeps the replay text within the configured character budget', () => {
    const messages: TMessage[] = [
      textMessage('m1', 'right', 'first turn establishes the task framing and should be dropped when budget is tiny'),
      textMessage('m2', 'left', 'middle assistant response that is less important than the latest state'),
      textMessage('m3', 'right', 'latest user request with the important resume intent'),
    ];

    const result = buildWCoreResumeReplayContext(messages, { maxChars: 180, perEntryCharLimit: 60 });

    expect(result).not.toBeNull();
    expect(result?.text.length).toBeLessThanOrEqual(180);
    expect(result?.text).toContain('latest user request');
    expect(result?.stats.truncated).toBe(true);
    expect(result?.stats.omittedMessages).toBeGreaterThan(0);
  });
});
