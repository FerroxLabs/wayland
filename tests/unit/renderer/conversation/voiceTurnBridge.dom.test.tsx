/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import React from 'react';
import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  VOICE_TURN_SETTLED_EVENT,
  submitVoiceTurn,
  useVoiceTurnSubmission,
  type VoiceTurnSettledDetail,
} from '@/renderer/pages/conversation/voice/voiceTurnBridge';

const Harness: React.FC<{ conversationId: string; onSend: (message: string) => Promise<void> }> = ({
  conversationId,
  onSend,
}) => {
  useVoiceTurnSubmission(conversationId, onSend);
  return null;
};

describe('voiceTurnBridge', () => {
  it('submits through only the matching conversation composer', async () => {
    const first = vi.fn(async () => undefined);
    const second = vi.fn(async () => undefined);
    render(
      <>
        <Harness conversationId='conversation-1' onSend={first} />
        <Harness conversationId='conversation-2' onSend={second} />
      </>
    );

    await act(async () => {
      submitVoiceTurn({ conversationId: 'conversation-2', turnId: 'turn-1', text: '  Do the work.  ' });
      await Promise.resolve();
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledWith('Do the work.');
  });

  it('settles success only after the canonical send handler resolves', async () => {
    let resolveSend: (() => void) | undefined;
    const onSend = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSend = resolve;
        })
    );
    const settled: VoiceTurnSettledDetail[] = [];
    window.addEventListener(VOICE_TURN_SETTLED_EVENT, (event) => {
      settled.push((event as CustomEvent<VoiceTurnSettledDetail>).detail);
    });
    render(<Harness conversationId='conversation-1' onSend={onSend} />);

    act(() => {
      submitVoiceTurn({ conversationId: 'conversation-1', turnId: 'turn-1', text: 'Hello' });
    });
    expect(settled).toEqual([]);

    await act(async () => {
      resolveSend?.();
      await Promise.resolve();
    });
    expect(settled).toEqual([{ conversationId: 'conversation-1', turnId: 'turn-1', accepted: true }]);
  });

  it('rejects empty transcripts without invoking chat', async () => {
    const onSend = vi.fn(async () => undefined);
    const settled: VoiceTurnSettledDetail[] = [];
    window.addEventListener(VOICE_TURN_SETTLED_EVENT, (event) => {
      settled.push((event as CustomEvent<VoiceTurnSettledDetail>).detail);
    });
    render(<Harness conversationId='conversation-1' onSend={onSend} />);

    act(() => {
      submitVoiceTurn({ conversationId: 'conversation-1', turnId: 'turn-empty', text: '   ' });
    });

    expect(onSend).not.toHaveBeenCalled();
    expect(settled.at(-1)).toEqual({
      conversationId: 'conversation-1',
      turnId: 'turn-empty',
      accepted: false,
      errorCode: 'empty_transcript',
    });
  });

  it('reports canonical send failures without throwing into the event loop', async () => {
    const onSend = vi.fn(async () => {
      throw new Error('provider failed');
    });
    const settled: VoiceTurnSettledDetail[] = [];
    window.addEventListener(VOICE_TURN_SETTLED_EVENT, (event) => {
      settled.push((event as CustomEvent<VoiceTurnSettledDetail>).detail);
    });
    render(<Harness conversationId='conversation-1' onSend={onSend} />);

    await act(async () => {
      submitVoiceTurn({ conversationId: 'conversation-1', turnId: 'turn-1', text: 'Hello' });
      await Promise.resolve();
    });

    expect(settled.at(-1)).toEqual({
      conversationId: 'conversation-1',
      turnId: 'turn-1',
      accepted: false,
      errorCode: 'send_failed',
    });
  });
});
