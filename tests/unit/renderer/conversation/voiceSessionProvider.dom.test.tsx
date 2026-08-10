/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import { ConversationProvider } from '@/renderer/hooks/context/ConversationContext';
import { openVoiceMode } from '@/renderer/pages/conversation/voice/voiceTurnBridge';

type SpeechInputOptions = {
  onTranscript: (text: string) => void;
  endpointing?: boolean;
  onSpeechEnd?: () => void;
};

let onTranscript: ((text: string) => void) | null = null;
const responseListeners: Array<(message: IResponseMessage) => void> = [];
const mockSpeak = vi.fn(async (_params: unknown) => ({
  ok: true as const,
  data: [82, 73, 70, 70],
  mimeType: 'audio/wav',
}));

/**
 * Per-test, because the whole point of the headline test below is what happens
 * when this returns nothing at all.
 */
let storedTts: unknown;
let storedStt: unknown;

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn(async (key: string) => {
      if (key === 'tools.speechToText') return storedStt;
      if (key === 'tools.textToSpeech') return storedTts;
      return undefined;
    }),
    set: vi.fn(async () => undefined),
  },
}));

// ChatLayout's two throw-outside-provider contexts. Everything else in it is
// left real, because the thing under test is where ChatLayout mounts the
// session relative to its own header.
vi.mock('@/renderer/pages/conversation/Preview', () => ({
  PreviewPanel: () => null,
  usePreviewContext: () => ({ isOpen: false, closePreview: vi.fn() }),
}));
vi.mock('@/renderer/pages/conversation/hooks/ConversationTabsContext', () => ({
  useConversationTabs: () => ({ openTabs: [], updateTabName: vi.fn() }),
}));

vi.mock('@/renderer/hooks/system/useSpeechInput', () => ({
  useSpeechInput: (options: SpeechInputOptions) => {
    onTranscript = options.onTranscript;
    return {
      availability: 'record',
      cancelRecording: vi.fn(),
      clearError: vi.fn(),
      errorCode: null,
      recordingLevels: [0.12],
      startMonitoring: vi.fn(async () => undefined),
      startRecording: vi.fn(async () => undefined),
      status: 'idle',
      stopMonitoring: vi.fn(),
      stopRecording: vi.fn(),
    };
  },
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  conversation: {
    stop: { invoke: vi.fn(async () => ({ success: true })) },
    responseStream: {
      on: (listener: (message: IResponseMessage) => void) => {
        responseListeners.push(listener);
        return () => {
          const index = responseListeners.indexOf(listener);
          if (index >= 0) responseListeners.splice(index, 1);
        };
      },
    },
    turnCompleted: { on: () => () => {} },
    confirmation: { add: { on: () => () => {} } },
    popoutClosed: { on: () => () => {} },
  },
  voiceSynth: { speak: { invoke: (...args: unknown[]) => mockSpeak(...args) } },
  // Pulled in by the header path (conversation history -> projects). Present so
  // the hideHeader=false control exercises the real header rather than dying in
  // an unrelated dependency.
  project: {
    list: { invoke: vi.fn(async () => []) },
    getConversations: { invoke: vi.fn(async () => []) },
    changed: { on: () => () => {} },
  },
}));

import ChatLayout from '@/renderer/pages/conversation/components/ChatLayout';
import VoiceConversationMode from '@/renderer/pages/conversation/voice/VoiceConversationMode';
import { useVoiceSessionSafe, VoiceSessionProvider } from '@/renderer/pages/conversation/voice/VoiceSessionContext';

class MockAudio {
  src = '';
  private listeners = new Map<string, () => void>();
  addEventListener(type: string, listener: () => void) {
    this.listeners.set(type, listener);
  }
  fire(type: string) {
    this.listeners.get(type)?.();
  }
  pause() {}
  async play() {}
}

/** Drives a complete spoken turn, the way a user would. */
const runOneTurn = async () => {
  act(() => openVoiceMode('conversation-1'));
  await screen.findByRole('dialog', { name: 'Wayland voice conversation' });
  act(() => {
    screen.getByRole('button', { name: 'Start speaking' }).click();
  });
  act(() => {
    screen.getByRole('button', { name: 'Stop and send voice turn' }).click();
  });
  act(() => onTranscript?.('Say something back.'));
  act(() => {
    for (const listener of responseListeners) {
      listener({
        type: 'content',
        data: 'Here is the answer.',
        msg_id: 'assistant-1',
        conversation_id: 'conversation-1',
      });
      listener({ type: 'finish', data: null, msg_id: 'assistant-1', conversation_id: 'conversation-1' });
    }
  });
};

describe('VoiceSessionProvider', () => {
  beforeEach(() => {
    responseListeners.splice(0);
    mockSpeak.mockClear();
    onTranscript = null;
    storedStt = { enabled: true };
    storedTts = undefined;
    vi.stubGlobal('Audio', MockAudio);
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:voice') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  });

  /**
   * The regression test for the bug that shipped.
   *
   * The existing session suite stubs `tools.textToSpeech` to `{enabled: true}`.
   * That single override is why 16,450 tests were green while every real
   * session was silent: no test had ever exercised the path a new user actually
   * takes, where the key has never been written and the read resolves undefined.
   */
  it('speaks for a user whose voice settings have never been written', async () => {
    render(
      <MemoryRouter>
        <VoiceSessionProvider conversationId='conversation-1' actorLabel='Wayland'>
          <VoiceConversationMode />
        </VoiceSessionProvider>
      </MemoryRouter>
    );

    await runOneTurn();
    await waitFor(() => expect(mockSpeak).toHaveBeenCalledWith({ text: 'Here is the answer.' }));
  });

  it('stays silent for a user who turned speech output off', async () => {
    // The control. If speech were unconditional this would fail, and the test
    // above would prove nothing about the default specifically.
    storedTts = { enabled: false, provider: 'system-native', voice: 'default', speed: 1, autoReadResponses: false };
    render(
      <MemoryRouter>
        <VoiceSessionProvider conversationId='conversation-1' actorLabel='Wayland'>
          <VoiceConversationMode />
        </VoiceSessionProvider>
      </MemoryRouter>
    );

    act(() => openVoiceMode('conversation-1'));
    await screen.findByRole('dialog', { name: 'Wayland voice conversation' });
    act(() => {
      screen.getByRole('button', { name: 'Start speaking' }).click();
    });

    // Two elements say it: the setup notice and the capture-blocked error.
    expect(screen.getAllByText(/Speech output is off/).length).toBeGreaterThan(0);
    expect(mockSpeak).not.toHaveBeenCalled();
  });

  /**
   * The lift moved the session from inside the header to around the whole
   * layout, and ChatLayout is rendered outside a Router on some surfaces - it
   * already guards its own router bridge with `useInRouterContext`. react-router
   * throws a hard invariant rather than degrading, so a stray `useNavigate` in
   * the session would take down every one of those surfaces.
   */
  it('mounts with no Router at all', () => {
    expect(() =>
      render(
        <VoiceSessionProvider conversationId='conversation-1' actorLabel='Wayland'>
          <div>composer</div>
        </VoiceSessionProvider>
      )
    ).not.toThrow();
    expect(screen.getByText('composer')).toBeInTheDocument();
  });

  it('mounts inside a Router too', () => {
    // The control: proves the assertion above is about the absence of a Router
    // and not about the provider failing to render anything either way.
    expect(() =>
      render(
        <MemoryRouter>
          <VoiceSessionProvider conversationId='conversation-1' actorLabel='Wayland'>
            <div>composer</div>
          </VoiceSessionProvider>
        </MemoryRouter>
      )
    ).not.toThrow();
    expect(screen.getByText('composer')).toBeInTheDocument();
  });

  /**
   * `ensureConsent` resolves its promise from this modal's own handlers, so if
   * nothing renders it the await never settles - entry hangs with no error and
   * no modal, and the obvious repair is to delete the await along with the
   * disclosure. Asserting the element exists, not merely that a function was
   * called.
   */
  /**
   * The dead-button defect, as a test.
   *
   * The session used to mount inside ChatLayout's `headerBlock`, and three call
   * sites render the conversation with `hideHeader`. On those surfaces nothing
   * was listening for the composer's open event, so the soundwave button
   * dispatched into a void - a control that looked live and did nothing.
   *
   * Mounting around the whole layout is what fixes it, and this fails against a
   * header-mounted session.
   */
  it.each([true, false])('starts a session with hideHeader=%s', async (hideHeader) => {
    render(
      <MemoryRouter>
        <ChatLayout conversationId='conversation-1' hideHeader={hideHeader}>
          <div>composer</div>
        </ChatLayout>
      </MemoryRouter>
    );

    act(() => openVoiceMode('conversation-1'));
    expect(await screen.findByRole('dialog', { name: 'Wayland voice conversation' })).toBeInTheDocument();
  });

  /**
   * TeamPage renders ONE ChatLayout over many conversations, with a SendBox per
   * agent each carrying its own conversation id. Without this scoping every one
   * of those composers would show a session belonging to a different agent, and
   * offer a Stop that interrupts it.
   */
  it('is invisible to a composer belonging to another conversation', () => {
    const Probe: React.FC<{ label: string }> = ({ label }) => {
      const session = useVoiceSessionSafe();
      return <div>{`${label}:${session ? 'has-session' : 'none'}`}</div>;
    };
    const conversationValue = (conversationId: string) =>
      ({ conversationId }) as unknown as React.ComponentProps<typeof ConversationProvider>['value'];

    render(
      <VoiceSessionProvider conversationId='conversation-1' actorLabel='Wayland'>
        <ConversationProvider value={conversationValue('conversation-1')}>
          <Probe label='mine' />
        </ConversationProvider>
        <ConversationProvider value={conversationValue('conversation-2')}>
          <Probe label='theirs' />
        </ConversationProvider>
      </VoiceSessionProvider>
    );

    expect(screen.getByText('mine:has-session')).toBeInTheDocument();
    expect(screen.getByText('theirs:none')).toBeInTheDocument();
  });

  it('can actually settle a hosted-voice consent decision', async () => {
    // Arco's Modal renders nothing while hidden, so asserting the element
    // exists up front would assert nothing. What matters is that the promise
    // CAN settle: `ensureConsent` resolves from the modal's own handlers, and
    // if the provider does not render it the await hangs forever with no error
    // and no modal.
    let answered: boolean | null = null;
    const Probe: React.FC = () => {
      const session = useVoiceSessionSafe();
      return (
        <button
          type='button'
          onClick={() => void session?.ensureConsent('openai').then((accepted) => (answered = accepted))}
        >
          ask
        </button>
      );
    };

    render(
      <VoiceSessionProvider conversationId='conversation-1' actorLabel='Wayland'>
        <Probe />
      </VoiceSessionProvider>
    );

    act(() => screen.getByRole('button', { name: 'ask' }).click());
    const accept = await screen.findByTestId('voice-consent-accept');
    expect(answered).toBeNull();

    act(() => accept.click());
    await waitFor(() => expect(answered).toBe(true));
  });
});
