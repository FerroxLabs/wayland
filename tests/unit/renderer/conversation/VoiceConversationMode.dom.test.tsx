/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IConversationTurnCompletedEvent, IResponseMessage } from '@/common/adapter/ipcBridge';
import type { VoiceTurnSubmitDetail } from '@/renderer/pages/conversation/voice/voiceTurnBridge';
import { openVoiceMode, VOICE_TURN_SUBMIT_EVENT } from '@/renderer/pages/conversation/voice/voiceTurnBridge';

/**
 * The whole options object, not two hand-picked callbacks. A mock that only
 * destructures what it already knows about is structurally incapable of
 * noticing when the surface stops passing something - `endpointing` and
 * `onSpeechEnd` were both deletable with a green suite.
 */
type SpeechInputOptions = {
  onTranscript: (text: string) => void;
  endpointing?: boolean;
  onSpeechEnd?: () => void;
  onNoSpeech?: () => void;
  onEndpointingUnavailable?: () => void;
  onBargeIn?: () => void;
};

let speechInputOptions: SpeechInputOptions | null = null;
let onTranscript: ((text: string) => void) | null = null;
let onBargeIn: (() => void) | null = null;
const responseListeners: Array<(message: IResponseMessage) => void> = [];
const completionListeners: Array<(event: IConversationTurnCompletedEvent) => void> = [];
const confirmationListeners: Array<(event: { conversation_id: string; id: string }) => void> = [];
const mockStartRecording = vi.fn(async () => undefined);
const mockStopRecording = vi.fn();
const mockCancelRecording = vi.fn();
const mockSpeak = vi.fn(async (_params: unknown) => ({
  ok: true as const,
  data: [82, 73, 70, 70],
  mimeType: 'audio/wav',
}));
const mockStopConversation = vi.fn(async (_params: unknown) => ({ success: true }));
const mockNavigate = vi.fn();

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn(async (key: string) => {
      if (key === 'tools.speechToText') return { enabled: true };
      if (key === 'tools.textToSpeech') {
        return {
          enabled: true,
          provider: 'system-native',
          voice: 'Samantha',
          speed: 1,
          autoReadResponses: false,
        };
      }
      return undefined;
    }),
  },
}));

const mockStartMonitoring = vi.fn(async () => undefined);
const mockStopMonitoring = vi.fn();

vi.mock('@/renderer/hooks/system/useSpeechInput', () => ({
  useSpeechInput: (options: SpeechInputOptions) => {
    speechInputOptions = options;
    onTranscript = options.onTranscript;
    onBargeIn = options.onBargeIn ?? null;
    return {
      availability: 'record',
      cancelRecording: mockCancelRecording,
      clearError: vi.fn(),
      errorCode: null,
      recordingLevels: [0.12, 0.25],
      startMonitoring: mockStartMonitoring,
      startRecording: mockStartRecording,
      status: 'idle',
      stopMonitoring: mockStopMonitoring,
      stopRecording: mockStopRecording,
    };
  },
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  conversation: {
    stop: { invoke: (...args: unknown[]) => mockStopConversation(...args) },
    responseStream: {
      on: (listener: (message: IResponseMessage) => void) => {
        responseListeners.push(listener);
        return () => {
          const index = responseListeners.indexOf(listener);
          if (index >= 0) responseListeners.splice(index, 1);
        };
      },
    },
    turnCompleted: {
      on: (listener: (event: IConversationTurnCompletedEvent) => void) => {
        completionListeners.push(listener);
        return () => {
          const index = completionListeners.indexOf(listener);
          if (index >= 0) completionListeners.splice(index, 1);
        };
      },
    },
    confirmation: {
      add: {
        on: (listener: (event: { conversation_id: string; id: string }) => void) => {
          confirmationListeners.push(listener);
          return () => {
            const index = confirmationListeners.indexOf(listener);
            if (index >= 0) confirmationListeners.splice(index, 1);
          };
        },
      },
    },
  },
  voiceSynth: {
    speak: { invoke: (...args: unknown[]) => mockSpeak(...args) },
  },
}));

// These tests all describe the macOS local-voice path (system-native + `say`).
// jsdom's navigator is not a Mac, and readiness is platform-aware, so without
// this they would silently be asserting the Windows/Linux story instead.
vi.mock('@/renderer/utils/platform', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/renderer/utils/platform')>()),
  isMacOS: () => true,
  // `rendererPlatform` reads the module's OWN `isMacOS`, not this mocked
  // export, so overriding one without the other leaves readiness on the
  // Windows/Linux story while every other check says macOS.
  rendererPlatform: () => 'darwin',
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  // The orb asks whether a Router exists before reaching for `useNavigate`,
  // because it now mounts on surfaces that render outside one.
  useInRouterContext: () => true,
}));

import VoiceConversationMode from '@/renderer/pages/conversation/voice/VoiceConversationMode';
import { VoiceSessionProvider } from '@/renderer/pages/conversation/voice/VoiceSessionContext';

let lastAudio: MockAudio | null = null;

class MockAudio {
  src = '';
  private listeners = new Map<string, () => void>();

  constructor() {
    lastAudio = this;
  }

  addEventListener(type: string, listener: () => void) {
    this.listeners.set(type, listener);
  }

  /** The real element fires this; the previous mock stored listeners and never called them. */
  fire(type: string) {
    this.listeners.get(type)?.();
  }

  pause() {}

  async play() {}
}

/**
 * Mounts the orb the way ChatLayout does: a provider owning the session, with
 * the orb as one view of it.
 *
 * Entry is driven by the real `wayland:voice-mode-open` event, which is exactly
 * what the entry button dispatches. Deliberately NOT a test-only entry button -
 * that would turn nine behavioural tests into presence-only ones and they would
 * stay green through V11 deleting the control they were written to exercise.
 */
const renderVoice = (props: { conversationTitle?: string } = {}) =>
  render(
    <VoiceSessionProvider conversationId='conversation-1' actorLabel='Wayland Core'>
      <VoiceConversationMode conversationTitle={props.conversationTitle} />
    </VoiceSessionProvider>
  );

describe('VoiceConversationMode', () => {
  beforeEach(() => {
    responseListeners.splice(0);
    completionListeners.splice(0);
    confirmationListeners.splice(0);
    mockStartRecording.mockClear();
    mockStopRecording.mockClear();
    mockCancelRecording.mockClear();
    mockSpeak.mockClear();
    mockStopConversation.mockClear();
    mockNavigate.mockClear();
    mockStartMonitoring.mockClear();
    mockStopMonitoring.mockClear();
    speechInputOptions = null;
    onTranscript = null;
    onBargeIn = null;
    lastAudio = null;
    vi.useRealTimers();
    vi.stubGlobal('Audio', MockAudio);
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:voice') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  });

  it('runs transcript and response through the same scoped conversation', async () => {
    const submitted: VoiceTurnSubmitDetail[] = [];
    window.addEventListener(VOICE_TURN_SUBMIT_EVENT, (event) => {
      submitted.push((event as CustomEvent<VoiceTurnSubmitDetail>).detail);
    });
    renderVoice({ conversationTitle: 'Book launch' });

    act(() => openVoiceMode('conversation-1'));
    expect(await screen.findByRole('dialog', { name: 'Wayland voice conversation' })).toBeInTheDocument();
    expect(screen.getByText('Book launch')).toBeInTheDocument();
    expect(screen.getByText('Tap to speak')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Start speaking' }));
    expect(mockStartRecording).toHaveBeenCalledOnce();
    expect(screen.getByText('Listening')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Stop and send voice turn' }));
    expect(mockStopRecording).toHaveBeenCalledOnce();

    act(() => {
      onTranscript?.('Build the launch plan.');
    });
    expect(submitted).toHaveLength(1);
    expect(submitted[0]).toMatchObject({ conversationId: 'conversation-1', text: 'Build the launch plan.' });
    expect(screen.getByText('Thinking')).toBeInTheDocument();

    act(() => {
      for (const listener of responseListeners) {
        listener({
          type: 'content',
          data: 'The launch plan is ready.',
          msg_id: 'assistant-1',
          conversation_id: 'conversation-1',
        });
        listener({
          type: 'finish',
          data: null,
          msg_id: 'assistant-1',
          conversation_id: 'conversation-1',
        });
      }
    });

    await waitFor(() => expect(mockSpeak).toHaveBeenCalledWith({ text: 'The launch plan is ready.' }));
    expect(screen.getByText('Speaking')).toBeInTheDocument();
    expect(screen.getByText('The launch plan is ready.')).toBeInTheDocument();
  });

  it('opens from the scoped composer Voice control without affecting another conversation', async () => {
    renderVoice();

    act(() => openVoiceMode('conversation-2'));
    expect(screen.queryByRole('dialog', { name: 'Wayland voice conversation' })).not.toBeInTheDocument();

    act(() => openVoiceMode('conversation-1'));
    expect(await screen.findByRole('dialog', { name: 'Wayland voice conversation' })).toBeInTheDocument();
  });

  it('stops at a visual approval boundary and never offers spoken approval', async () => {
    renderVoice();
    act(() => openVoiceMode('conversation-1'));
    await screen.findByRole('dialog', { name: 'Wayland voice conversation' });
    fireEvent.click(screen.getByRole('button', { name: 'Start speaking' }));
    fireEvent.click(screen.getByRole('button', { name: 'Stop and send voice turn' }));
    act(() => onTranscript?.('Publish it.'));

    act(() => {
      for (const listener of confirmationListeners) {
        listener({ conversation_id: 'conversation-1', id: 'approval-1' });
      }
    });

    expect(screen.getByText('Needs your approval')).toBeInTheDocument();
    expect(screen.getByText(/Voice cannot approve it/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
  });

  /**
   * Drives one complete turn: open, tap, stop, transcript, response, playback
   * started. Leaves the session in `speaking` with `lastAudio` holding the
   * element whose `ended` event returns the machine to `listening`.
   */
  const runOneTurn = async () => {
    const view = renderVoice();
    act(() => openVoiceMode('conversation-1'));
    await screen.findByRole('dialog', { name: 'Wayland voice conversation' });
    fireEvent.click(screen.getByRole('button', { name: 'Start speaking' }));
    fireEvent.click(screen.getByRole('button', { name: 'Stop and send voice turn' }));
    await act(async () => {
      onTranscript?.('Build the launch plan.');
    });
    await act(async () => {
      for (const listener of responseListeners) {
        listener({ type: 'content', data: 'Done.', msg_id: 'assistant-1', conversation_id: 'conversation-1' });
        listener({ type: 'finish', data: null, msg_id: 'assistant-1', conversation_id: 'conversation-1' });
      }
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText('Speaking')).toBeInTheDocument();
    expect(mockStartRecording).toHaveBeenCalledOnce();
    return view;
  };

  it('reopens the microphone after the assistant finishes speaking, with no second tap', async () => {
    await runOneTurn();

    vi.useFakeTimers();
    act(() => lastAudio?.fire('ended'));
    expect(screen.getByText('Listening for you')).toBeInTheDocument();
    expect(mockStartRecording).toHaveBeenCalledOnce();

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(mockStartRecording).toHaveBeenCalledTimes(2);
  });

  it('reopens the microphone exactly once and never repeats it', async () => {
    await runOneTurn();

    vi.useFakeTimers();
    act(() => lastAudio?.fire('ended'));
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(mockStartRecording).toHaveBeenCalledTimes(2);
  });

  it('does not open the microphone when Voice mode is merely opened', async () => {
    renderVoice();
    act(() => openVoiceMode('conversation-1'));
    await screen.findByRole('dialog', { name: 'Wayland voice conversation' });

    expect(screen.getByText('Tap to speak')).toBeInTheDocument();
    vi.useFakeTimers();
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(mockStartRecording).not.toHaveBeenCalled();
  });

  it('does not reopen the microphone after the user returns to Chat inside the grace window', async () => {
    await runOneTurn();

    vi.useFakeTimers();
    act(() => lastAudio?.fire('ended'));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Close Voice mode' }));
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockStartRecording).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog', { name: 'Wayland voice conversation' })).not.toBeInTheDocument();
  });

  it('does not apply a pending capture effect after the component unmounts', async () => {
    const { unmount } = await runOneTurn();

    vi.useFakeTimers();
    act(() => lastAudio?.fire('ended'));
    unmount();
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockStartRecording).toHaveBeenCalledOnce();
  });

  it('stays quiet instead of nagging when the microphone is muted', async () => {
    await runOneTurn();

    fireEvent.click(screen.getByRole('button', { name: /Mic on/ }));
    vi.useFakeTimers();
    act(() => lastAudio?.fire('ended'));
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockStartRecording).toHaveBeenCalledOnce();
    // The auto re-arm must not walk into beginCapture's mute guard and raise an
    // error banner the user never asked for.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('interrupts on acoustic barge-in while the assistant is speaking', async () => {
    await runOneTurn();

    await act(async () => {
      onBargeIn?.();
    });

    // Back to listening (and already armed, so the copy reflects hands-free).
    expect(screen.getByText('Listening for you')).toBeInTheDocument();
    expect(screen.queryByText('Speaking')).not.toBeInTheDocument();
    expect(mockStartMonitoring).toHaveBeenCalled();
  });

  it('interrupts the running turn on Escape instead of destroying the session', async () => {
    renderVoice();
    act(() => openVoiceMode('conversation-1'));
    await screen.findByRole('dialog', { name: 'Wayland voice conversation' });
    fireEvent.click(screen.getByRole('button', { name: 'Start speaking' }));
    fireEvent.click(screen.getByRole('button', { name: 'Stop and send voice turn' }));
    await act(async () => {
      onTranscript?.('Build the launch plan.');
    });
    expect(screen.getByText('Thinking')).toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });

    expect(mockStopConversation).toHaveBeenCalledWith({ conversation_id: 'conversation-1' });
    expect(screen.getByRole('dialog', { name: 'Wayland voice conversation' })).toBeInTheDocument();
  });

  it('cancels captured audio when returning to Chat instead of sending it', async () => {
    renderVoice();
    act(() => openVoiceMode('conversation-1'));
    await screen.findByRole('dialog', { name: 'Wayland voice conversation' });
    fireEvent.click(screen.getByRole('button', { name: 'Start speaking' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close Voice mode' }));

    expect(mockCancelRecording).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog', { name: 'Wayland voice conversation' })).not.toBeInTheDocument();
  });

  /**
   * Pins the two lines that ARE hands-free. Deleting `endpointing: true` or
   * `onSpeechEnd` from the `useSpeechInput` call used to leave the whole suite
   * green, which made the entire feature silently revertible.
   */
  it('opts the capture into endpointing and sends the turn when the endpointer fires', async () => {
    renderVoice();
    act(() => openVoiceMode('conversation-1'));
    await screen.findByRole('dialog', { name: 'Wayland voice conversation' });
    fireEvent.click(screen.getByRole('button', { name: 'Start speaking' }));

    expect(speechInputOptions?.endpointing).toBe(true);

    act(() => speechInputOptions?.onSpeechEnd?.());

    expect(mockStopRecording).toHaveBeenCalledOnce();
    expect(screen.getByText('Transcribing')).toBeInTheDocument();
  });

  it('completes a second turn end to end after the microphone reopens', async () => {
    const submitted: VoiceTurnSubmitDetail[] = [];
    const handler = (event: Event) => submitted.push((event as CustomEvent<VoiceTurnSubmitDetail>).detail);
    window.addEventListener(VOICE_TURN_SUBMIT_EVENT, handler);

    try {
      await runOneTurn();

      vi.useFakeTimers();
      act(() => lastAudio?.fire('ended'));
      act(() => {
        vi.advanceTimersByTime(400);
      });
      vi.useRealTimers();
      expect(mockStartRecording).toHaveBeenCalledTimes(2);

      // Every other test stops at the reopen. This one proves the reopened
      // capture can finish: endpoint -> transcript -> submit -> second answer.
      act(() => speechInputOptions?.onSpeechEnd?.());
      expect(mockStopRecording).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Transcribing')).toBeInTheDocument();

      await act(async () => {
        onTranscript?.('And the timeline?');
      });
      expect(submitted).toHaveLength(2);
      expect(submitted[1]).toMatchObject({ conversationId: 'conversation-1', text: 'And the timeline?' });

      await act(async () => {
        for (const listener of responseListeners) {
          listener({ type: 'content', data: 'Six weeks.', msg_id: 'assistant-2', conversation_id: 'conversation-1' });
          listener({ type: 'finish', data: null, msg_id: 'assistant-2', conversation_id: 'conversation-1' });
        }
      });
      await act(async () => {
        await Promise.resolve();
      });

      expect(mockSpeak).toHaveBeenCalledTimes(2);
      expect(mockSpeak).toHaveBeenLastCalledWith({ text: 'Six weeks.' });
      expect(screen.getByText('Speaking')).toBeInTheDocument();
    } finally {
      window.removeEventListener(VOICE_TURN_SUBMIT_EVENT, handler);
    }
  });

  it('stops microphone monitoring when the surface unmounts mid-playback', async () => {
    const { unmount } = await runOneTurn();

    expect(mockStartMonitoring).toHaveBeenCalled();
    expect(mockStopMonitoring).not.toHaveBeenCalled();

    unmount();

    // A hot mic that outlives the surface is the worst failure mode this
    // component has, and nothing asserted the teardown.
    expect(mockStopMonitoring).toHaveBeenCalled();
  });

  /**
   * Closing mid-capture is the path the `state === 'speaking'` effect cleanup
   * does not cover, so `closeMode` has to release the monitor itself.
   */
  it('stops microphone monitoring when the user returns to Chat mid-capture', async () => {
    renderVoice();
    act(() => openVoiceMode('conversation-1'));
    await screen.findByRole('dialog', { name: 'Wayland voice conversation' });
    fireEvent.click(screen.getByRole('button', { name: 'Start speaking' }));
    expect(mockStopMonitoring).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Close Voice mode' }));

    expect(mockStopMonitoring).toHaveBeenCalled();
  });

  it('stops promising a pause will send the turn once endpointing reports it cannot', async () => {
    renderVoice();
    act(() => openVoiceMode('conversation-1'));
    await screen.findByRole('dialog', { name: 'Wayland voice conversation' });
    fireEvent.click(screen.getByRole('button', { name: 'Start speaking' }));

    expect(screen.getByText('Pause when you are done, or tap to send now')).toBeInTheDocument();

    act(() => speechInputOptions?.onEndpointingUnavailable?.());

    expect(screen.queryByText('Pause when you are done, or tap to send now')).not.toBeInTheDocument();
    expect(screen.getByText('Tap the orb to send — nothing is listening for you to pause')).toBeInTheDocument();
  });
});
