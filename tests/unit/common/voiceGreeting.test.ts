/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import enUS from '@/renderer/services/i18n/locales/en-US/index';
import {
  MAX_GREETING_NAME_LENGTH,
  sanitizeGreetingName,
  selectVoiceGreeting,
  voiceGreetingKey,
  VOICE_GREETING_KEYS,
  VOICE_GREETING_VARIANT_IDS,
} from '@/common/voice/voiceGreeting';

const readKey = (bundle: Record<string, unknown>, key: string): unknown =>
  key.split('.').reduce<unknown>((node, segment) => {
    if (typeof node !== 'object' || node === null) return undefined;
    return (node as Record<string, unknown>)[segment];
  }, bundle);

describe('selectVoiceGreeting', () => {
  it('offers more than one greeting', () => {
    // The whole ask was "a few possibilities". One variant is a script.
    expect(VOICE_GREETING_VARIANT_IDS.length).toBeGreaterThanOrEqual(4);
    expect(new Set(VOICE_GREETING_VARIANT_IDS).size).toBe(VOICE_GREETING_VARIANT_IDS.length);
  });

  it('reaches every variant across the roll range', () => {
    // A picker that indexed wrongly - floor of roll*(n-1), or a stray +1 -
    // would leave a variant permanently unreachable while still looking random.
    const reached = new Set(
      Array.from({ length: 1000 }, (_, i) => selectVoiceGreeting({ roll: i / 1000 }).variantId)
    );
    expect([...reached].sort()).toEqual([...VOICE_GREETING_VARIANT_IDS].sort());
  });

  it('greets by name when there is one', () => {
    const picked = selectVoiceGreeting({ displayName: 'Sean', roll: 0 });
    expect(picked.name).toBe('Sean');
    expect(picked.key).toBe(voiceGreetingKey(picked.variantId, true));
    expect(picked.key).toBe('conversation.chat.voice.greeting.named.howAreYou');
  });

  it.each([undefined, null, '', '   ', '\n\t'])('falls back to the name-less family for %j', (displayName) => {
    // The alternative is "Hey , how are you?" spoken out loud.
    const picked = selectVoiceGreeting({ displayName, roll: 0 });
    expect(picked.name).toBeNull();
    expect(picked.key).toBe('conversation.chat.voice.greeting.anonymous.howAreYou');
  });

  it('picks the same variant id in both families', () => {
    // The control for the two assertions above: the family switches on the
    // name, the variant does not.
    expect(selectVoiceGreeting({ displayName: 'Sean', roll: 0.5 }).variantId).toBe(
      selectVoiceGreeting({ roll: 0.5 }).variantId
    );
  });

  it('never indexes past the pool on a roll of exactly 1', () => {
    // `Math.random()` cannot return 1, but a caller passing a percentage could.
    const picked = selectVoiceGreeting({ roll: 1 });
    expect(VOICE_GREETING_VARIANT_IDS).toContain(picked.variantId);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('still returns a real variant for roll %j', (roll) => {
    expect(VOICE_GREETING_VARIANT_IDS).toContain(selectVoiceGreeting({ roll }).variantId);
  });
});

describe('sanitizeGreetingName', () => {
  it('keeps an ordinary name intact', () => {
    expect(sanitizeGreetingName('  Sean Donahoe ')).toBe('Sean Donahoe');
  });

  it('strips control characters rather than speaking them', () => {
    expect(sanitizeGreetingName('Se\u0000an\nDon\u007fahoe')).toBe('Se an Don ahoe');
  });

  it('caps a name that would be read out forever', () => {
    const long = 'a'.repeat(MAX_GREETING_NAME_LENGTH * 3);
    expect(sanitizeGreetingName(long)).toHaveLength(MAX_GREETING_NAME_LENGTH);
  });

  it('returns empty for a name that is nothing but control characters', () => {
    expect(sanitizeGreetingName('\u0000\u0001')).toBe('');
  });
});

describe('the greeting keys really exist', () => {
  it('names ten keys - one named and one anonymous per variant', () => {
    expect(VOICE_GREETING_KEYS).toHaveLength(VOICE_GREETING_VARIANT_IDS.length * 2);
  });

  it.each(VOICE_GREETING_KEYS)('%s resolves to an en-US string', (key) => {
    // A key that does not exist is spoken as the dotted path itself.
    expect(typeof readKey(enUS as Record<string, unknown>, key)).toBe('string');
  });

  it.each(VOICE_GREETING_VARIANT_IDS)('the named %s variant carries the {{name}} placeholder', (variantId) => {
    // Without this an English "Hey Sean" could quietly become a named key whose
    // translation dropped the name and greeted nobody.
    expect(readKey(enUS as Record<string, unknown>, voiceGreetingKey(variantId, true))).toContain('{{name}}');
  });

  it.each(VOICE_GREETING_VARIANT_IDS)('the anonymous %s variant carries no placeholder', (variantId) => {
    expect(readKey(enUS as Record<string, unknown>, voiceGreetingKey(variantId, false))).not.toContain('{{name}}');
  });
});
