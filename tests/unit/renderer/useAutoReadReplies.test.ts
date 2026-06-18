// @vitest-environment jsdom
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it } from 'vitest';
import { computeAutoReadAction } from '@/renderer/hooks/voice/useAutoReadReplies';

describe('computeAutoReadAction', () => {
  const base = {
    enabled: true,
    speakState: true,
    lastSpokenId: null as string | null,
    latestAssistant: { id: 'm1', done: true, text: 'Hello there.' },
  };

  it('speaks a newly-completed assistant message when enabled and speak-state on', () => {
    expect(computeAutoReadAction(base)).toEqual({ speak: true, messageId: 'm1', text: 'Hello there.' });
  });

  it('does nothing when TTS is disabled', () => {
    expect(computeAutoReadAction({ ...base, enabled: false })).toEqual({ speak: false });
  });

  it('does nothing when speak-state is off for this chat', () => {
    expect(computeAutoReadAction({ ...base, speakState: false })).toEqual({ speak: false });
  });

  it('does not re-speak a message already spoken', () => {
    expect(computeAutoReadAction({ ...base, lastSpokenId: 'm1' })).toEqual({ speak: false });
  });

  it('does not speak a message still streaming', () => {
    expect(computeAutoReadAction({ ...base, latestAssistant: { id: 'm2', done: false, text: 'Partial' } })).toEqual({ speak: false });
  });

  it('does not speak when there is no speakable prose (code-only)', () => {
    expect(computeAutoReadAction({ ...base, latestAssistant: { id: 'm3', done: true, text: '' } })).toEqual({ speak: false });
  });
});
