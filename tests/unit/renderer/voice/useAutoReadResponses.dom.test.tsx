/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * WHAT THIS SUITE CAN AND CANNOT TELL YOU.
 *
 * jsdom has no Web Audio. `AudioContext` here is a fake written by the same
 * hand as the code under test, so every number below is arithmetic against that
 * fake - NOT evidence that a single sample reached a speaker. What is genuinely
 * pinned is the wiring: which text is handed to synthesis, when nothing is,
 * and that an interrupt reaches both the queue and the nodes it already
 * scheduled. Whether the result is audible is H3's job (packaged app, real
 * speakers) and this suite must never be read as covering it.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';

const speak = vi.fn();
const responseListeners: Array<(message: IResponseMessage) => void> = [];
let storedTts: unknown;
let storedConsent: unknown;

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn(async (key: string) => {
      if (key === 'tools.textToSpeech') return storedTts;
      if (key === 'tools.voiceHostedConsent') return storedConsent;
      return undefined;
    }),
    set: vi.fn(async () => undefined),
  },
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  conversation: {
    responseStream: {
      on: (listener: (message: IResponseMessage) => void) => {
        responseListeners.push(listener);
        return () => {
          const index = responseListeners.indexOf(listener);
          if (index >= 0) responseListeners.splice(index, 1);
        };
      },
    },
  },
  voiceSynth: { speak: { invoke: (...args: unknown[]) => speak(...args) } },
}));

import { useAutoReadResponses } from '@/renderer/hooks/voice/useAutoReadResponses';
import { TTS_CONFIG_CHANGED_EVENT } from '@/renderer/services/voice/voiceSettingsEvents';
import { VOICE_HOSTED_CONSENT_CHANGED_EVENT } from '@/renderer/hooks/voice/useHostedVoiceConsent';

// ---------------------------------------------------------------------------
// The fake clock
// ---------------------------------------------------------------------------

class FakeSource {
  buffer: AudioBuffer | null = null;
  onended: ((event: Event) => void) | null = null;
  started: Array<{ when: number; offset: number; duration: number }> = [];
  stopCalls = 0;
  connect() {}
  start(when = 0, offset = 0, duration = 0) {
    this.started.push({ when, offset, duration });
  }
  stop() {
    this.stopCalls += 1;
  }
}

const SAMPLE_RATE = 8000;
/** 0.2 s of speech between 0.1 s of silence on each side. */
const CLIP = (() => {
  const samples = new Float32Array(800 + 1600 + 800);
  samples.fill(0.5, 800, 2400);
  return {
    numberOfChannels: 1,
    sampleRate: SAMPLE_RATE,
    length: samples.length,
    duration: samples.length / SAMPLE_RATE,
    getChannelData: () => samples,
  } as unknown as AudioBuffer;
})();

let contexts: FakeAudioContext[] = [];

class FakeAudioContext {
  state: AudioContextState = 'running';
  currentTime = 0;
  destination = {} as AudioNode;
  sources: FakeSource[] = [];
  closed = 0;
  constructor() {
    contexts.push(this);
  }
  createBufferSource() {
    const source = new FakeSource();
    this.sources.push(source);
    return source;
  }
  async decodeAudioData() {
    return CLIP;
  }
  async resume() {
    this.state = 'running';
  }
  async close() {
    this.closed += 1;
  }
}

const context = () => contexts[0];

const flush = async () => {
  await act(async () => {
    for (let i = 0; i < 12; i++) await Promise.resolve();
  });
};

const emit = async (message: Partial<IResponseMessage>) => {
  await act(async () => {
    // A copy: a listener that unsubscribes while the event is being delivered
    // would otherwise shorten the array mid-iteration.
    for (const listener of responseListeners.slice()) {
      listener({
        type: 'content',
        data: '',
        msg_id: 'assistant-1',
        conversation_id: 'conversation-1',
        ...message,
      } as IResponseMessage);
    }
  });
  await flush();
};

const AUTO_READ_ON = {
  enabled: true,
  provider: 'system-native',
  voice: 'default',
  speed: 1,
  autoReadResponses: true,
};

const FIRST = 'Here is the first answer. ';
const SECOND = 'And here is the second one. ';

const mount = (voiceSessionActive = false, conversationId = 'conversation-1') =>
  renderHook(
    ({ active, id }: { active: boolean; id: string }) =>
      useAutoReadResponses({ conversationId: id, voiceSessionActive: active }),
    { initialProps: { active: voiceSessionActive, id: conversationId } }
  );

/** Mounts, waits for the config read, and streams two complete sentences. */
const mountAndStream = async () => {
  const rendered = mount();
  await flush();
  await emit({ type: 'content', data: FIRST + SECOND });
  return rendered;
};

beforeEach(() => {
  vi.clearAllMocks();
  responseListeners.splice(0);
  contexts = [];
  storedTts = AUTO_READ_ON;
  storedConsent = undefined;
  speak.mockResolvedValue({ ok: true, data: [1], mimeType: 'audio/wav' });
  vi.stubGlobal('AudioContext', FakeAudioContext);
});

describe('useAutoReadResponses — speaking', () => {
  it('speaks each finished sentence of a streaming reply', async () => {
    await mountAndStream();

    expect(speak.mock.calls.map((call) => call[0].text)).toEqual([
      'Here is the first answer.',
      'And here is the second one.',
    ]);
    expect(context().sources).toHaveLength(2);
  });

  it('speaks the tail only once the turn ends', async () => {
    const rendered = mount();
    await flush();
    // No terminator yet: nothing is safe to speak, because the next delta may
    // continue the sentence.
    await emit({ type: 'content', data: 'A sentence that has not ended yet' });
    expect(speak).not.toHaveBeenCalled();

    await emit({ type: 'finish', data: null });
    await waitFor(() => expect(speak).toHaveBeenCalledTimes(1));
    expect(speak.mock.calls[0][0]).toEqual({ text: 'A sentence that has not ended yet' });
    rendered.unmount();
  });

  it('never speaks the user’s own message', async () => {
    mount();
    await flush();
    await emit({ type: 'user_content', data: 'Read this back to me please.', msg_id: 'user-1' });

    expect(speak).not.toHaveBeenCalled();
  });

  it('ignores another conversation on the same stream', async () => {
    mount();
    await flush();
    await emit({ type: 'content', data: FIRST, conversation_id: 'conversation-2' });

    expect(speak).not.toHaveBeenCalled();
  });
});

describe('useAutoReadResponses — the off switches', () => {
  it('says nothing when the switch is off', async () => {
    storedTts = { ...AUTO_READ_ON, autoReadResponses: false };
    await mountAndStream();

    expect(speak).not.toHaveBeenCalled();
    expect(contexts).toHaveLength(0);
  });

  it('says nothing when speech output itself is off', async () => {
    storedTts = { ...AUTO_READ_ON, enabled: false };
    await mountAndStream();

    expect(speak).not.toHaveBeenCalled();
  });

  it('stands down while a voice session owns the speaker', async () => {
    const { rerender } = mount(true);
    await flush();
    await emit({ type: 'content', data: FIRST + SECOND });
    expect(speak).not.toHaveBeenCalled();

    // Control: the identical stream is spoken the moment the session ends.
    rerender({ active: false, id: 'conversation-1' });
    await flush();
    await emit({ type: 'content', data: FIRST + SECOND, msg_id: 'assistant-2' });
    expect(speak).toHaveBeenCalledTimes(2);
  });

  it('stops mid-answer when the user turns the switch off', async () => {
    await mountAndStream();
    expect(context().sources).toHaveLength(2);
    const callsBefore = speak.mock.calls.length;

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(TTS_CONFIG_CHANGED_EVENT, { detail: { ...AUTO_READ_ON, autoReadResponses: false } })
      );
    });
    await flush();

    expect(context().sources.map((source) => source.stopCalls)).toEqual([1, 1]);
    // And nothing further is synthesized for the rest of the same answer.
    await emit({ type: 'content', data: 'A third sentence arrives here. ' });
    expect(speak).toHaveBeenCalledTimes(callsBefore);
  });

  it('stops mid-answer when the user sends a new message', async () => {
    await mountAndStream();
    const callsBefore = speak.mock.calls.length;

    await emit({ type: 'user_content', data: 'Actually, never mind.', msg_id: 'user-2' });

    expect(context().sources.map((source) => source.stopCalls)).toEqual([1, 1]);
    expect(speak).toHaveBeenCalledTimes(callsBefore);
  });

  it('stops when the surface navigates to another conversation', async () => {
    const { rerender } = mount();
    await flush();
    await emit({ type: 'content', data: FIRST + SECOND });
    expect(context().sources).toHaveLength(2);

    rerender({ active: false, id: 'conversation-9' });
    await flush();

    expect(context().sources.map((source) => source.stopCalls)).toEqual([1, 1]);
  });

  it('stops and closes its audio context on unmount', async () => {
    const { unmount } = await mountAndStream();
    expect(context().sources).toHaveLength(2);

    unmount();
    await flush();

    expect(context().sources.map((source) => source.stopCalls)).toEqual([1, 1]);
    expect(context().closed).toBe(1);
  });

  it('starts a fresh answer when the next assistant message arrives', async () => {
    await mountAndStream();
    await emit({ type: 'content', data: FIRST, msg_id: 'assistant-2' });

    // The previous answer's nodes were stopped, and the new one is speaking.
    expect(
      context()
        .sources.slice(0, 2)
        .map((source) => source.stopCalls)
    ).toEqual([1, 1]);
    expect(speak.mock.calls.at(-1)?.[0]).toEqual({ text: 'Here is the first answer.' });
  });
});

describe('useAutoReadResponses — hosted consent', () => {
  beforeEach(() => {
    storedTts = { ...AUTO_READ_ON, provider: 'openai', voice: 'marin' };
  });

  it('never starts hosted synthesis without consent', async () => {
    storedConsent = undefined;
    await mountAndStream();

    expect(speak).not.toHaveBeenCalled();
    expect(contexts).toHaveLength(0);
  });

  it('treats a stale consent version as no consent', async () => {
    storedConsent = { version: 0, acceptedProviders: ['openai'], updatedAt: 1 };
    await mountAndStream();

    expect(speak).not.toHaveBeenCalled();
  });

  it('treats consent for a different provider as no consent', async () => {
    storedConsent = { version: 1, acceptedProviders: ['deepgram'], updatedAt: 1 };
    await mountAndStream();

    expect(speak).not.toHaveBeenCalled();
  });

  it('control: speaks once consent for that provider is stored', async () => {
    storedConsent = { version: 1, acceptedProviders: ['openai'], updatedAt: 1 };
    await mountAndStream();

    expect(speak).toHaveBeenCalledTimes(2);
  });

  it('picks up consent granted elsewhere without a remount', async () => {
    storedConsent = undefined;
    mount();
    await flush();
    await emit({ type: 'content', data: FIRST + SECOND });
    expect(speak).not.toHaveBeenCalled();

    storedConsent = { version: 1, acceptedProviders: ['openai'], updatedAt: 1 };
    await act(async () => {
      window.dispatchEvent(new CustomEvent(VOICE_HOSTED_CONSENT_CHANGED_EVENT));
    });
    await flush();
    await emit({ type: 'content', data: FIRST + SECOND, msg_id: 'assistant-2' });

    expect(speak).toHaveBeenCalledTimes(2);
  });
});

describe('useAutoReadResponses — the audio clock', () => {
  it('refuses a suspended context by name instead of going silent', async () => {
    const errors: unknown[][] = [];
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args);
    });
    class SuspendedContext extends FakeAudioContext {
      state: AudioContextState = 'suspended';
      async resume() {
        // A context Chromium refuses to start stays suspended.
      }
    }
    vi.stubGlobal('AudioContext', SuspendedContext);

    await mountAndStream();

    expect(speak).not.toHaveBeenCalled();
    expect(errors.flat()).toContain('TTS_AUDIO_CONTEXT_BLOCKED');
    // And it does not retry, per delta, for the rest of the answer.
    await emit({ type: 'content', data: 'A third sentence arrives here. ' });
    expect(errors.filter((entry) => entry.includes('TTS_AUDIO_CONTEXT_BLOCKED'))).toHaveLength(1);
  });

  it('stays inert where there is no Web Audio at all', async () => {
    vi.stubGlobal('AudioContext', undefined);
    await mountAndStream();

    expect(speak).not.toHaveBeenCalled();
  });
});
