/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IMessageText, IMessageToolGroup, TMessage } from '@/common/chat/chatLib';
import { buildWCoreResumeReplayContext } from '../src/process/task/wcoreResumeReplay';

const CONVERSATION_ID = 'demo-wcore-resume-replay';

function textMessage(id: string, position: 'left' | 'right', content: string): IMessageText {
  return {
    id,
    conversation_id: CONVERSATION_ID,
    type: 'text',
    position,
    content: { content },
  };
}

function editToolGroup(id: string): IMessageToolGroup {
  return {
    id,
    conversation_id: CONVERSATION_ID,
    type: 'tool_group',
    position: 'left',
    content: [
      {
        callId: 'call-edit-readme',
        description: 'Updated the resume instructions in README.md',
        name: 'Edit',
        renderOutputAsMarkdown: true,
        status: 'Success',
        confirmationDetails: {
          type: 'edit',
          title: 'Edit README.md',
          fileName: 'README.md',
          fileDiff: '- old resume instructions\n+ structured resume replay instructions',
        },
      },
    ],
  };
}

const messages: TMessage[] = [
  textMessage('m1', 'right', 'Please keep enough context when WCore resumes.'),
  editToolGroup('m2'),
  textMessage('m3', 'left', 'I updated README.md and kept the replay under the injection budget.'),
];

const replay = buildWCoreResumeReplayContext(messages, {
  maxChars: 700,
  perEntryCharLimit: 220,
});

if (!replay) {
  throw new Error('Expected demo replay context to be generated');
}

console.log(replay.text);
console.log('Replay stats:');
console.log(JSON.stringify(replay.stats, null, 2));
