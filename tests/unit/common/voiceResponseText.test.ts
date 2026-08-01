/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { extractVoiceResponseText, normalizeVoiceResponseText } from '@/common/voice/voiceResponseText';

describe('voiceResponseText', () => {
  it('extracts final prose from common canonical message shapes', () => {
    expect(extractVoiceResponseText('text', { content: 'The work is complete.' })).toBe('The work is complete.');
    expect(extractVoiceResponseText('assistant', [{ type: 'text', text: 'First.' }, { text: 'Second.' }])).toBe(
      'First. Second.'
    );
  });

  it('never speaks tool traces, reasoning, approvals, or cost records', () => {
    expect(extractVoiceResponseText('tool_result', { content: 'secret command output' })).toBeNull();
    expect(extractVoiceResponseText('assistant', { type: 'reasoning', text: 'private chain' })).toBeNull();
    expect(extractVoiceResponseText('cost', { text: '$18.20' })).toBeNull();
  });

  it('does not walk arbitrary object fields', () => {
    expect(extractVoiceResponseText('assistant', { debug: 'secret', args: 'rm -rf', raw: 'token' })).toBeNull();
  });

  it('turns visual-only blocks into concise spoken boundaries', () => {
    expect(
      normalizeVoiceResponseText('Done.\n```ts\nconst secret = 1;\n```\nSee [the report](https://example.test).')
    ).toBe('Done. I left the code in the chat. See the report.');
  });
});
