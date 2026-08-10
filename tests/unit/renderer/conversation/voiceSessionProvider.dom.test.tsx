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
const mockStartRecording = vi.fn(async () => undefined);
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

/**
 * The platform, switchable per test. Only macOS ships a local synthesizer, so
 * the identical stored config means different things on different machines.
 */
let onMacOS = true;
vi.mock('@/renderer/utils/platform', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/renderer/utils/platform')>()),
  isMacOS: () => onMacOS,
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
      startRecording: mockStartRecording,
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
  modelRegistry: { list: { invoke: vi.fn(async () => []) } },
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
    mockStartRecording.mockClear();
    onTranscript = null;
    storedStt = { enabled: true };
    storedTts = undefined;
    onMacOS = true;
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
  describe('one tap means one thing', () => {
    const Entry: React.FC = () => {
      const session = useVoiceSessionSafe();
      return (
        <>
          <button type='button' onClick={() => void session?.begin({ thenListen: true })}>
            talk
          </button>
          <span data-testid='state'>{session?.state ?? 'none'}</span>
        </>
      );
    };

    const renderWithEntry = () =>
      render(
        <MemoryRouter>
          <VoiceSessionProvider conversationId='conversation-1' actorLabel='Wayland'>
            <VoiceConversationMode />
            <Entry />
          </VoiceSessionProvider>
        </MemoryRouter>
      );

    /**
     * Entry landed in `listening` with the microphone CLOSED - which is why the
     * copy under the orb says "Tap to speak" rather than "Listening". Once the
     * composer is the surface its status line says "Listening..." there, so the
     * user talks into a closed microphone and nothing happens.
     */
    it('opens the microphone in the same tap that enters', async () => {
      renderWithEntry();

      await act(async () => {
        screen.getByRole('button', { name: 'talk' }).click();
      });

      await waitFor(() => expect(mockStartRecording).toHaveBeenCalledTimes(1));
      expect(screen.getByTestId('state').textContent).toBe('user-speaking');
    });

    it('still enters without opening the microphone when not asked to', async () => {
      // The control: `openVoiceMode` is the passive entry point and must stay
      // passive, or merely opening the panel starts recording.
      renderWithEntry();
      act(() => openVoiceMode('conversation-1'));
      await screen.findByRole('dialog', { name: 'Wayland voice conversation' });
      expect(mockStartRecording).not.toHaveBeenCalled();
      expect(screen.getByTestId('state').textContent).toBe('listening');
    });

    /**
     * `begin` used to build a NEW session and swap it in without stopping
     * anything the old one owned. A stray second tap orphaned a playing clip
     * and a live recorder.
     */
    it('does not rebuild a session that is already live', async () => {
      renderWithEntry();

      await act(async () => {
        screen.getByRole('button', { name: 'talk' }).click();
      });
      await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('user-speaking'));

      await act(async () => {
        screen.getByRole('button', { name: 'talk' }).click();
      });

      // A rebuilt session would have reset the machine to `listening` and
      // reopened the recorder.
      expect(screen.getByTestId('state').textContent).toBe('user-speaking');
      expect(mockStartRecording).toHaveBeenCalledTimes(1);
    });
  });

  describe('across operating systems', () => {
    const renderSession = () =>
      render(
        <MemoryRouter>
          <VoiceSessionProvider conversationId='conversation-1' actorLabel='Wayland'>
            <VoiceConversationMode />
          </VoiceSessionProvider>
        </MemoryRouter>
      );

    const tapToSpeak = async () => {
      act(() => openVoiceMode('conversation-1'));
      await screen.findByRole('dialog', { name: 'Wayland voice conversation' });
      act(() => {
        screen.getByRole('button', { name: 'Start speaking' }).click();
      });
    };

    /**
     * `say` exists only on macOS. Off it, the DEFAULT config still reads as
     * ready by the old check - enabled is true and the provider is not kokoro -
     * so the microphone opened, the user spoke, and the failure only arrived
     * afterwards as TTS_SYSTEM_NATIVE_UNAVAILABLE. Refusing up front, and
     * naming the platform rather than blaming the settings, is the difference
     * between a dead end and a route.
     */
    it('refuses before recording on a platform with no local voice', async () => {
      onMacOS = false;
      storedTts = { enabled: true, provider: 'system-native', voice: 'default', speed: 1, autoReadResponses: false };
      renderSession();

      await tapToSpeak();

      expect(screen.getByText(/no built-in voice on this operating system/)).toBeInTheDocument();
      expect(mockStartRecording).not.toHaveBeenCalled();
    });

    it('records on macOS with exactly the same stored config', async () => {
      // The control. Same config, same code path, different platform - so the
      // refusal above is about the operating system and nothing else.
      onMacOS = true;
      storedTts = { enabled: true, provider: 'system-native', voice: 'default', speed: 1, autoReadResponses: false };
      renderSession();

      await tapToSpeak();

      expect(mockStartRecording).toHaveBeenCalledTimes(1);
    });

    it('records off macOS once a hosted voice is chosen and agreed', async () => {
      // Windows and Linux are not blocked from voice, they are blocked from
      // LOCAL voice. The hosted route has to stay open or the refusal above
      // would be a dead end after all.
      onMacOS = false;
      storedTts = { enabled: true, provider: 'openai', voice: 'alloy', speed: 1, autoReadResponses: false };
      renderSession();

      act(() => openVoiceMode('conversation-1'));
      const accept = await screen.findByTestId('voice-consent-accept');
      act(() => accept.click());
      await screen.findByRole('dialog', { name: 'Wayland voice conversation' });
      act(() => {
        screen.getByRole('button', { name: 'Start speaking' }).click();
      });

      expect(mockStartRecording).toHaveBeenCalledTimes(1);
    });
  });

  describe('leaving the orb', () => {
    const StateProbe: React.FC = () => {
      const session = useVoiceSessionSafe();
      return <span data-testid='probe'>{`${session?.state ?? 'none'}|${session?.isActive ? 'live' : 'dead'}`}</span>;
    };

    const renderWithProbe = () =>
      render(
        <MemoryRouter>
          <VoiceSessionProvider conversationId='conversation-1' actorLabel='Wayland'>
            <VoiceConversationMode />
            <StateProbe />
          </VoiceSessionProvider>
        </MemoryRouter>
      );

    /**
     * X is the universal "stop this" glyph. Leaving two live getUserMedia
     * streams behind it is indefensible, so it is the hard mic-off.
     */
    it('X ends the session', async () => {
      renderWithProbe();
      act(() => openVoiceMode('conversation-1'));
      await screen.findByRole('dialog', { name: 'Wayland voice conversation' });

      act(() => screen.getByRole('button', { name: 'Close Voice mode' }).click());

      expect(screen.getByTestId('probe').textContent).toBe('ended|dead');
      expect(screen.queryByRole('dialog', { name: 'Wayland voice conversation' })).not.toBeInTheDocument();
    });

    /**
     * The control. "Return to Chat" means exactly that - the orb goes away and
     * the session keeps running, which is the whole point of splitting the view
     * from the session.
     */
    it('Return to Chat hides the orb and keeps the session', async () => {
      renderWithProbe();
      act(() => openVoiceMode('conversation-1'));
      await screen.findByRole('dialog', { name: 'Wayland voice conversation' });

      act(() => screen.getByRole('button', { name: 'Return to Chat' }).click());

      expect(screen.queryByRole('dialog', { name: 'Wayland voice conversation' })).not.toBeInTheDocument();
      expect(screen.getByTestId('probe').textContent).toBe('listening|live');
    });

    /**
     * The assertion that a `state !== 'ended'` check would have passed while the
     * feature was broken. Every subscription follows isActive, not the view, so
     * collapsing mid-answer must not unsubscribe the response stream - if it
     * did the reply would never be captured and the turn would hang in
     * `thinking` forever.
     */
    it('a turn collapsed mid-answer still completes and still speaks', async () => {
      renderWithProbe();
      act(() => openVoiceMode('conversation-1'));
      await screen.findByRole('dialog', { name: 'Wayland voice conversation' });
      act(() => {
        screen.getByRole('button', { name: 'Start speaking' }).click();
      });
      act(() => {
        screen.getByRole('button', { name: 'Stop and send voice turn' }).click();
      });
      act(() => onTranscript?.('Say something back.'));

      act(() => screen.getByRole('button', { name: 'Return to Chat' }).click());
      expect(screen.queryByRole('dialog', { name: 'Wayland voice conversation' })).not.toBeInTheDocument();

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

      await waitFor(() => expect(mockSpeak).toHaveBeenCalledWith({ text: 'Here is the answer.' }));
    });
  });

  describe('consent at entry, on both legs', () => {
    const renderSession = () =>
      render(
        <MemoryRouter>
          <VoiceSessionProvider conversationId='conversation-1' actorLabel='Wayland'>
            <VoiceConversationMode />
          </VoiceSessionProvider>
        </MemoryRouter>
      );

    /**
     * The microphone leg, which the draft of this plan did not gate.
     *
     * On macOS the default speech OUTPUT is local and silent, so gating entry
     * on that leg alone lets a user enter having seen no disclosure at all -
     * and the session then begins continuously re-arming a microphone routed to
     * a hosted transcriber. The quieter leg was disclosed and the louder one
     * was not.
     */
    it('asks before the microphone goes off-device', async () => {
      storedStt = { enabled: true, provider: 'openai', openai: { apiKey: 'sk-test', model: 'whisper-1' } };
      renderSession();

      act(() => openVoiceMode('conversation-1'));
      expect(await screen.findByTestId('voice-consent-accept')).toBeInTheDocument();
      expect(screen.queryByRole('dialog', { name: 'Wayland voice conversation' })).not.toBeInTheDocument();
    });

    it('does not enter, speak, or record when the disclosure is declined', async () => {
      storedStt = { enabled: true, provider: 'openai', openai: { apiKey: 'sk-test', model: 'whisper-1' } };
      renderSession();

      act(() => openVoiceMode('conversation-1'));
      const decline = await screen.findByTestId('voice-consent-cancel');
      act(() => decline.click());

      // Give the declined promise a turn to settle, then assert nothing started.
      // Arco keeps the dismissed modal mounted through its exit animation, so
      // that element's presence says nothing either way.
      await act(async () => {
        await Promise.resolve();
      });
      expect(screen.queryByRole('dialog', { name: 'Wayland voice conversation' })).not.toBeInTheDocument();
      expect(mockSpeak).not.toHaveBeenCalled();
    });

    it('enters after the disclosure is accepted', async () => {
      storedStt = { enabled: true, provider: 'openai', openai: { apiKey: 'sk-test', model: 'whisper-1' } };
      renderSession();

      act(() => openVoiceMode('conversation-1'));
      const accept = await screen.findByTestId('voice-consent-accept');
      act(() => accept.click());

      expect(await screen.findByRole('dialog', { name: 'Wayland voice conversation' })).toBeInTheDocument();
    });

    /**
     * The control, and it is the corrected one. Asserting silence for
     * system-native ALONE would assert it on exactly the leg that stays on the
     * machine, and would have passed while the microphone leg was unguarded.
     * Both legs have to be local for this to mean anything.
     */
    it('never prompts when both legs are local', async () => {
      storedStt = { enabled: true, provider: 'whisper-local' };
      storedTts = { enabled: true, provider: 'system-native', voice: 'default', speed: 1, autoReadResponses: false };
      renderSession();

      act(() => openVoiceMode('conversation-1'));
      expect(await screen.findByRole('dialog', { name: 'Wayland voice conversation' })).toBeInTheDocument();
      expect(screen.queryByTestId('voice-consent-accept')).not.toBeInTheDocument();
    });

    /**
     * An unset provider is the one case where main and the renderer disagree.
     * The renderer wins because it is the one that runs: it short-circuits to
     * the bundled local Whisper and never reaches main. Prompting here would
     * gate on-device audio behind consent to send it off-device.
     */
    it('does not prompt for a provider the renderer resolves to local', async () => {
      storedStt = { enabled: true };
      renderSession();

      act(() => openVoiceMode('conversation-1'));
      expect(await screen.findByRole('dialog', { name: 'Wayland voice conversation' })).toBeInTheDocument();
      expect(screen.queryByTestId('voice-consent-accept')).not.toBeInTheDocument();
    });
  });

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
