/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { applyVoiceProsody } from '@/common/voice/voiceProsody';
import {
  extractVoiceResponseText,
  normalizeVoiceResponseText,
  takeSpeakableSentences,
} from '@/common/voice/voiceResponseText';

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

  it('gives list items the boundary the writing gave them', () => {
    // Stripping the marker and then collapsing newlines ran these together as
    // "one two", deleting the clearest structural signal in the text.
    expect(normalizeVoiceResponseText('- one\n- two')).toBe('one. two.');
    expect(normalizeVoiceResponseText('1. first\n2) second')).toBe('first. second.');
    expect(normalizeVoiceResponseText('- already ends properly.\n- so does this!')).toBe(
      'already ends properly. so does this!'
    );
  });
});

describe('takeSpeakableSentences', () => {
  /**
   * The only invariant worth asserting on the splitter, fed the way it is
   * actually used: one character at a time, as deltas arrive.
   */
  it('never loses or invents a character, at any feed boundary', () => {
    const source =
      'The weather in London today is mild. Temperatures will hover around fifteen degrees. ' +
      'Dr. Smith said it is 3.5 metres. Really?! That is all.\n- one item here\n- another item here\n';

    let buffer = '';
    const spoken: string[] = [];
    for (const char of source) {
      buffer += char;
      const { sentences, rest } = takeSpeakableSentences(buffer);
      expect(sentences.join('') + rest).toBe(buffer);
      spoken.push(...sentences);
      buffer = rest;
    }
    expect(spoken.join('') + buffer).toBe(source);
    expect(spoken.length).toBeGreaterThan(1);
  });

  it('emits one sentence per complete thought', () => {
    const { sentences, rest } = takeSpeakableSentences(
      'The first thing happened. The second thing happened. And a third '
    );
    expect(sentences.map((s) => s.trim())).toEqual(['The first thing happened.', 'The second thing happened.']);
    expect(rest).toBe('And a third ');
  });

  it('does not split an abbreviation, an initial, or a decimal', () => {
    const one = (text: string) => takeSpeakableSentences(text).sentences.map((s) => s.trim());
    expect(one('Dr. Smith went home for the evening. ')).toEqual(['Dr. Smith went home for the evening.']);
    expect(one('It is 3.5 metres from the wall. ')).toEqual(['It is 3.5 metres from the wall.']);
    expect(one('J. R. Hartley wrote the book about it. ')).toEqual(['J. R. Hartley wrote the book about it.']);
    expect(one('Bring a coat, e.g. the waxed one you own. ')).toEqual(['Bring a coat, e.g. the waxed one you own.']);
  });

  it('holds everything while a code fence is open', () => {
    const open = 'Here is the code. ```ts\nconst secret = 1;\n';
    expect(takeSpeakableSentences(open)).toEqual({ sentences: [], rest: open });

    // Closing it releases the prose around it.
    const closed = `${open}\`\`\`\nThat is the whole file. `;
    const { sentences } = takeSpeakableSentences(closed);
    expect(sentences.length).toBeGreaterThan(0);
  });

  it('merges a sentence too short to be worth its own synthesis call', () => {
    // "Yes." renders in 0.668 s against ~765 ms of fixed overhead per call, so
    // speaking it alone underruns the queue and stutters.
    const { sentences } = takeSpeakableSentences('Yes. That is exactly what I meant to say. ');
    expect(sentences.map((s) => s.trim())).toEqual(['Yes. That is exactly what I meant to say.']);
  });

  it('never emits a terminator sitting at the end of the buffer', () => {
    // The next delta may continue it - this is how "3." becomes "3.5".
    expect(takeSpeakableSentences('It is a complete looking sentence.')).toEqual({
      sentences: [],
      rest: 'It is a complete looking sentence.',
    });
  });

  it('force-flushes a long run that has no terminator at all', () => {
    const runOn = `${'word '.repeat(60)}`;
    const { sentences, rest } = takeSpeakableSentences(runOn);
    expect(sentences).toHaveLength(1);
    expect(sentences[0].length).toBeLessThanOrEqual(200);
    expect(sentences.join('') + rest).toBe(runOn);
  });

  it('emits exactly three for a plain three-sentence paragraph', () => {
    // The control. A splitter that emits nothing would pass several assertions
    // above; this one it cannot.
    const { sentences } = takeSpeakableSentences(
      'The first sentence is here. The second sentence follows it. The third one ends things. '
    );
    expect(sentences).toHaveLength(3);
  });
});

describe('agent control markup is never spoken', () => {
  // Auto-read consumes the LIVE stream. The renderer's strip runs at display
  // time and the main process's runs at turn end, so both happen too late for
  // voice - which is why asking the agent to schedule something had the
  // synthesizer read "CRON underscore PROPOSE, schedule colon zero eight..."
  // out loud, one field at a time.
  const CRON_TURN = [
    "I'll set that up for you before the open, Monday through Friday.",
    '[CRON_PROPOSE]',
    'name: Weekday morning market report',
    'schedule: 0 8 * * 1-5',
    '[/CRON_PROPOSE]',
    'It will run each weekday.',
  ].join('\n');

  it('drops a cron proposal envelope but keeps the prose around it', () => {
    const spoken = normalizeVoiceResponseText(CRON_TURN);

    expect(spoken).not.toContain('CRON_PROPOSE');
    expect(spoken).not.toContain('0 8 * * 1-5');
    // The prose on BOTH sides has to survive - stripping the whole turn would
    // be a different bug wearing the same green test.
    expect(spoken).toContain('before the open');
    expect(spoken).toContain('It will run each weekday.');
  });

  it.each([
    ['[CRON_LIST]', 'CRON_LIST'],
    ['[[AION_FILES]]', 'AION_FILES'],
    ['[CONCIERGE_PROPOSE]body[/CONCIERGE_PROPOSE]', 'CONCIERGE'],
    ['[SKILL_SUGGEST]x[/SKILL_SUGGEST]', 'SKILL_SUGGEST'],
    ['[CRON_UPDATE: abc123]body[/CRON_UPDATE]', 'CRON_UPDATE'],
  ])('strips %s', (input, forbidden) => {
    const spoken = normalizeVoiceResponseText(`Before. ${input} After.`);
    expect(spoken).not.toContain(forbidden);
    expect(spoken).toContain('Before.');
    expect(spoken).toContain('After.');
  });

  it('removes think tags instead of shredding them into pronounceable rubble', () => {
    // The emphasis rule deletes `>` but not `<` or `/`, so this used to degrade
    // to `<thinkreasoning</think` - which the synthesizer happily read out.
    const spoken = normalizeVoiceResponseText('<think>weighing options</think>Here is the answer.');

    expect(spoken).not.toContain('<');
    expect(spoken).not.toContain('think');
    expect(spoken).toContain('Here is the answer.');
  });

  it('leaves arithmetic alone — the tag rule requires a letter after the bracket', () => {
    // Guards the obvious over-reach: a blanket `<...>` strip would eat this.
    expect(normalizeVoiceResponseText('Keep it under 5 < 10 always.')).toContain('5 < 10');
  });

  it('holds the buffer while a control block is still open', () => {
    // Mid-stream the closing tag has not arrived. Splitting here would hand the
    // queue fragments of a marker whose envelope rule can no longer match, and
    // each fragment would be normalized alone and then spoken. Mirrors the
    // existing unclosed-code-fence guard.
    const partial = 'Sure thing. [CRON_PROPOSE]\nname: Daily report.\nschedule: 0 8 * * 1-5.\n';
    expect(takeSpeakableSentences(partial)).toEqual({ sentences: [], rest: partial });
  });

  it('CONTROL: releases the buffer once the block closes', () => {
    // Without this the guard above could pass by never emitting anything at all.
    const complete = 'Sure thing. [CRON_PROPOSE]\nname: Daily.\n[/CRON_PROPOSE] All set. ';
    const { sentences } = takeSpeakableSentences(complete);
    expect(sentences.length).toBeGreaterThan(0);
    expect(sentences.join('')).toContain('Sure thing.');
  });

  it('CONTROL: ordinary prose is still spoken unchanged', () => {
    // The whole suite above asserts absence, so it would pass on a normalizer
    // that returned the empty string for everything.
    expect(normalizeVoiceResponseText('The build finished in 12 seconds.')).toBe('The build finished in 12 seconds.');
  });
});

describe('applyVoiceProsody', () => {
  it('replaces the comma contour with an explicit breath, on macOS only', () => {
    expect(applyVoiceProsody('Hey, I can hear you fine.', 'system-native')).toBe(
      'Hey [[slnc 150]] I can hear you fine.'
    );
    // A hosted synthesizer would pronounce the command, so it never sees one.
    expect(applyVoiceProsody('Hey, I can hear you fine.', 'openai')).toBe('Hey, I can hear you fine.');
  });

  it('leaves a comma inside a number alone', () => {
    expect(applyVoiceProsody('That is 1,000 metres.', 'system-native')).toBe('That is 1,000 metres.');
  });

  it('stops model prose from issuing speech commands of its own', () => {
    // `say` interprets [[...]] as a command wherever it appears, so this text
    // could otherwise mute the assistant mid-answer.
    expect(applyVoiceProsody('Try [[volm 0]] in your terminal.', 'system-native')).not.toContain('[[volm');
  });
});
