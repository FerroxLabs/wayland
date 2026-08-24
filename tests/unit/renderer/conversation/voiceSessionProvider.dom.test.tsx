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
import {
  armVoiceModeOnNextConversation,
  consumeArmedVoiceMode,
  openVoiceMode,
} from '@/renderer/pages/conversation/voice/voiceTurnBridge';

type SpeechInputOptions = {
  onTranscript: (text: string) => void;
  endpointing?: boolean;
  onSpeechEnd?: () => void;
};

let onTranscript: ((text: string) => void) | null = null;
const mockStartRecording = vi.fn(async () => undefined);
const responseListeners: Array<(message: IResponseMessage) => void> = [];

/**
 * The OTHER terminal path. `finish` arrives on the response stream and
 * `turnCompleted` arrives here, and both end the same turn - which is why the
 * dedupe between them matters enough to emit this in a test.
 */
type TurnCompletedEvent = {
  sessionId: string;
  status: string;
  state: string;
  lastMessage: { id?: string; createdAt?: string };
};
const turnCompletedListeners: Array<(event: TurnCompletedEvent) => void> = [];
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
 *
 * A NAMED PLATFORM, not a macOS boolean. The session used to be handed
 * `isMacOS() ? 'darwin' : 'other'`, which cannot tell Windows from Linux - so
 * "off macOS" was one undifferentiated case and the Windows story could never
 * be asserted separately from the Linux one. It has to be, because
 * `packet/wl-voice-wintts` is about to make them differ.
 */
let testPlatform: 'darwin' | 'win32' | 'linux' = 'darwin';
vi.mock('@/renderer/utils/platform', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/renderer/utils/platform')>()),
  isMacOS: () => testPlatform === 'darwin',
  rendererPlatform: () => testPlatform,
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
    turnCompleted: {
      on: (listener: (event: TurnCompletedEvent) => void) => {
        turnCompletedListeners.push(listener);
        return () => {
          const index = turnCompletedListeners.indexOf(listener);
          if (index >= 0) turnCompletedListeners.splice(index, 1);
        };
      },
    },
    confirmation: { add: { on: () => () => {} } },
    popoutClosed: { on: () => () => {} },
  },
  voiceSynth: { speak: { invoke: (...args: unknown[]) => mockSpeak(...args) } },
  // ChatLayout now mounts `usePreviewAway`, which subscribes to the preview
  // break-out broadcast on mount. The real bridge always has this namespace
  // (`bridgeAllowlist` registers every provider/emitter key at module load), so
  // a mock without it is a mock that does not match production.
  preview: {
    handoff: { on: () => () => undefined },
    popout: { invoke: vi.fn(async () => ({ ok: true, alreadyOpen: false })) },
    dockBack: { invoke: vi.fn(async () => undefined) },
  },
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

const audioInstances: MockAudio[] = [];

class MockAudio {
  src = '';
  private listeners = new Map<string, () => void>();
  constructor() {
    audioInstances.push(this);
  }
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
    turnCompletedListeners.splice(0);
    audioInstances.splice(0);
    mockSpeak.mockClear();
    mockStartRecording.mockClear();
    onTranscript = null;
    storedStt = { enabled: true };
    storedTts = undefined;
    testPlatform = 'darwin';
    vi.stubGlobal('Audio', MockAudio);
    // jsdom has no Web Audio. Pinned per test so the AudioContext suite below
    // cannot leak its fake into anything else.
    vi.stubGlobal('AudioContext', undefined);
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

  /**
   * The new-chat page's handoff arrives here.
   *
   * `VOICE_MODE_OPEN_EVENT` cannot carry it: the event is dispatched on the
   * welcome page, before the conversation - and therefore this provider -
   * exists, so it lands in an empty room. The arming survives the navigation
   * and is read on mount.
   */
  it('opens the session for a conversation the new-chat page armed', async () => {
    armVoiceModeOnNextConversation();
    render(
      <MemoryRouter>
        <VoiceSessionProvider conversationId='conversation-1' actorLabel='Wayland'>
          <VoiceConversationMode />
        </VoiceSessionProvider>
      </MemoryRouter>
    );

    await screen.findByRole('dialog', { name: 'Wayland voice conversation' });
    // `thenListen`: the user pressed a button captioned "Talk with Wayland", so
    // the microphone is open, not merely the surface.
    await waitFor(() => expect(mockStartRecording).toHaveBeenCalled());
    // Consumed by the read, so a second conversation cannot inherit it.
    expect(consumeArmedVoiceMode()).toBe(false);
  });

  it('stays closed when nothing armed it', async () => {
    // The control. Without this the test above would pass on a provider that
    // opened a session unconditionally. Asserted against a POSITIVE observable
    // state - `dead` - rather than the absence of a dialog, which any render
    // satisfies on its first synchronous check.
    const ArmProbe: React.FC = () => {
      const session = useVoiceSessionSafe();
      return <span data-testid='arm-probe'>{session?.isActive ? 'live' : 'dead'}</span>;
    };
    render(
      <MemoryRouter>
        <VoiceSessionProvider conversationId='conversation-1' actorLabel='Wayland'>
          <VoiceConversationMode />
          <ArmProbe />
        </VoiceSessionProvider>
      </MemoryRouter>
    );

    // Let the mount effects and the config reads the armed path awaits settle.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByTestId('arm-probe').textContent).toBe('dead');
    expect(mockStartRecording).not.toHaveBeenCalled();
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
    it.each(['win32', 'linux'] as const)(
      'refuses before recording on %s, which has no local voice',
      async (platform) => {
        testPlatform = platform;
        storedTts = { enabled: true, provider: 'system-native', voice: 'default', speed: 1, autoReadResponses: false };
        renderSession();

        await tapToSpeak();

        expect(screen.getByText(/no built-in voice on this operating system/)).toBeInTheDocument();
        expect(mockStartRecording).not.toHaveBeenCalled();
      }
    );

    it('records on macOS with exactly the same stored config', async () => {
      // The control. Same config, same code path, different platform - so the
      // refusal above is about the operating system and nothing else.
      testPlatform = 'darwin';
      storedTts = { enabled: true, provider: 'system-native', voice: 'default', speed: 1, autoReadResponses: false };
      renderSession();

      await tapToSpeak();

      expect(mockStartRecording).toHaveBeenCalledTimes(1);
    });

    /**
     * THE UPGRADED PROFILE, end to end through the session, unnormalized.
     *
     * `{"enabled":false,"provider":"openai"}` with no `origin` is the shipped
     * pre-origin factory default and is what an upgraded install actually holds
     * on disk. The session read it RAW - `sttConfigRef.current = storedStt` -
     * and passed it through `readinessInput()` untouched, so `enabled:false`
     * refused the microphone and the panel told the user "Speech input is off"
     * about a decision they never made.
     *
     * Two separate things are asserted because two separate reads were wrong:
     * the mic opens, AND the setup banner stays away. The banner is the one the
     * resolver cannot fix on its own - it is driven off the config the session
     * holds in state, so it pins the normalization at the READ, not in the
     * ladder.
     */
    it('records on a raw pre-origin profile and does not call it incomplete', async () => {
      testPlatform = 'darwin';
      storedStt = JSON.parse('{"enabled":false,"provider":"openai"}');
      storedTts = { enabled: true, provider: 'system-native', voice: 'default', speed: 1, autoReadResponses: false };
      renderSession();

      await tapToSpeak();

      expect(mockStartRecording).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Voice setup is incomplete')).toBeNull();
      expect(screen.queryByText(/Speech input is off/)).toBeNull();
    });

    it('records off macOS once a hosted voice is chosen and agreed', async () => {
      // Windows and Linux are not blocked from voice, they are blocked from
      // LOCAL voice. The hosted route has to stay open or the refusal above
      // would be a dead end after all.
      testPlatform = 'win32';
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
      storedStt = {
        enabled: true,
        origin: 'user',
        provider: 'openai',
        openai: { apiKey: 'sk-test', model: 'whisper-1' },
      };
      renderSession();

      act(() => openVoiceMode('conversation-1'));
      expect(await screen.findByTestId('voice-consent-accept')).toBeInTheDocument();
      expect(screen.queryByRole('dialog', { name: 'Wayland voice conversation' })).not.toBeInTheDocument();
    });

    it('does not enter, speak, or record when the disclosure is declined', async () => {
      storedStt = {
        enabled: true,
        origin: 'user',
        provider: 'openai',
        openai: { apiKey: 'sk-test', model: 'whisper-1' },
      };
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
      storedStt = {
        enabled: true,
        origin: 'user',
        provider: 'openai',
        openai: { apiKey: 'sk-test', model: 'whisper-1' },
      };
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

  /**
   * The turn-terminal handler.
   *
   * `finish` and `turnCompleted` both end the same turn. The old handler
   * refused to run outside `thinking`/`acting`, and the first terminal event
   * moves the machine to `speaking` - so the state guard was doing the dedupe
   * by accident. The handler now accepts `speaking`, because under chunked
   * synthesis that is the only state a turn ever ends in, and the dedupe is
   * explicit and keyed on the TURN. Keyed on the terminal event's id it would
   * not hold: `turnCompleted` reports the last message in the conversation,
   * which is routinely an activity card rather than the assistant message
   * `finish` names.
   */
  describe('ending a turn exactly once', () => {
    const Probe: React.FC = () => {
      const session = useVoiceSessionSafe();
      return (
        <>
          <span data-testid='state'>{session?.state ?? 'none'}</span>
          <span data-testid='last-response'>{session?.lastResponse ?? ''}</span>
          <span data-testid='error'>{session?.error?.message ?? ''}</span>
        </>
      );
    };

    const renderWithProbe = () =>
      render(
        <MemoryRouter>
          <VoiceSessionProvider conversationId='conversation-1' actorLabel='Wayland'>
            <VoiceConversationMode />
            <Probe />
          </VoiceSessionProvider>
        </MemoryRouter>
      );

    const emitTurnCompleted = (lastMessageId: string, state = 'ai_waiting_input') =>
      act(() => {
        for (const listener of turnCompletedListeners) {
          listener({
            sessionId: 'conversation-1',
            status: 'finished',
            state,
            lastMessage: { id: lastMessageId },
          });
        }
      });

    it('speaks the answer once and sets the captions', async () => {
      renderWithProbe();
      await runOneTurn();

      await waitFor(() => expect(mockSpeak).toHaveBeenCalledTimes(1));
      expect(mockSpeak).toHaveBeenCalledWith({ text: 'Here is the answer.' });
      expect(screen.getByTestId('last-response').textContent).toBe('Here is the answer.');
      expect(screen.getByTestId('state').textContent).toBe('speaking');
    });

    /**
     * The regression this split could have introduced, as a test.
     *
     * `turnCompleted` names a DIFFERENT message from the one `finish` named, so
     * a dedupe keyed on the terminal event's id would let the whole answer be
     * spoken a second time on top of the first.
     */
    it('does not speak again when the other terminal path names a different message', async () => {
      renderWithProbe();
      await runOneTurn();
      await waitFor(() => expect(mockSpeak).toHaveBeenCalledTimes(1));

      emitTurnCompleted('session-cost-activity-9');

      await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('speaking'));
      expect(mockSpeak).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('error').textContent).toBe('');
    });

    /**
     * The dedupe on its own, isolated from the tail.
     *
     * `turnCompleted` reporting an error state after the stream already
     * finished must not fail a turn that has been answered and is playing. This
     * is the assertion the accidental state guard used to make, and the only
     * thing making it now is that the dedupe is keyed on the turn - a key that
     * included the terminal id would let this through and put the session into
     * `error` on top of an answer the user is listening to.
     */
    it('cannot be failed by a second terminal event naming a different message', async () => {
      renderWithProbe();
      await runOneTurn();
      await waitFor(() => expect(mockSpeak).toHaveBeenCalledTimes(1));

      emitTurnCompleted('session-cost-activity-9', 'error');

      await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('speaking'));
      expect(screen.getByTestId('error').textContent).toBe('');
    });

    it('does not speak again when the other terminal path names the same message', async () => {
      // The control for the id above: the dedupe must hold whether or not the
      // two paths happen to agree.
      renderWithProbe();
      await runOneTurn();
      await waitFor(() => expect(mockSpeak).toHaveBeenCalledTimes(1));

      emitTurnCompleted('assistant-1');

      await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('speaking'));
      expect(mockSpeak).toHaveBeenCalledTimes(1);
    });

    /**
     * The control for the dedupe: it is keyed on the turn, so it must not wedge
     * the session shut. A second turn still speaks.
     */
    it('still speaks the next turn', async () => {
      renderWithProbe();
      await runOneTurn();
      await waitFor(() => expect(mockSpeak).toHaveBeenCalledTimes(1));
      emitTurnCompleted('session-cost-activity-9');

      // Let the first clip finish, which returns the machine to `listening`.
      act(() => audioInstances.at(-1)?.fire('ended'));
      await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('listening'));

      act(() => {
        screen.getByRole('button', { name: 'Start speaking' }).click();
      });
      act(() => {
        screen.getByRole('button', { name: 'Stop and send voice turn' }).click();
      });
      act(() => onTranscript?.('And again.'));
      act(() => {
        for (const listener of responseListeners) {
          listener({
            type: 'content',
            data: 'The second answer.',
            msg_id: 'assistant-2',
            conversation_id: 'conversation-1',
          });
          listener({ type: 'finish', data: null, msg_id: 'assistant-2', conversation_id: 'conversation-1' });
        }
      });

      await waitFor(() => expect(mockSpeak).toHaveBeenCalledTimes(2));
      expect(mockSpeak).toHaveBeenLastCalledWith({ text: 'The second answer.' });
    });
  });

  /**
   * The AudioContext.
   *
   * There is no `autoplay-policy` switch in main, so Chromium's gesture
   * requirement applies. A blocked `HTMLAudioElement` rejects and surfaces an
   * error; a suspended AudioContext does not - it accepts the schedule against
   * a clock that never advances, nothing sounds, and no callback ever fires.
   * Silence with no error is the exact bug this work exists to remove, so a
   * context that is not running has to fail loudly and before anything is
   * scheduled.
   */
  describe('the AudioContext lifecycle', () => {
    let resumeCalls = 0;

    class BlockedAudioContext {
      state: AudioContextState = 'suspended';
      async resume() {
        // What a blocked context actually does: resolves, stays suspended.
        resumeCalls += 1;
      }
      async close() {}
    }

    class RunningAudioContext {
      state: AudioContextState = 'suspended';
      async resume() {
        resumeCalls += 1;
        this.state = 'running';
      }
      async close() {}
    }

    const Probe: React.FC = () => {
      const session = useVoiceSessionSafe();
      return (
        <>
          <span data-testid='state'>{session?.state ?? 'none'}</span>
          <span data-testid='error'>{session?.error?.message ?? ''}</span>
          <span data-testid='reason'>{session?.readiness.reason ?? ''}</span>
        </>
      );
    };

    const renderWithProbe = () =>
      render(
        <MemoryRouter>
          <VoiceSessionProvider conversationId='conversation-1' actorLabel='Wayland'>
            <VoiceConversationMode />
            <Probe />
          </VoiceSessionProvider>
        </MemoryRouter>
      );

    beforeEach(() => {
      resumeCalls = 0;
    });

    it('never schedules against a suspended context, and says so', async () => {
      vi.stubGlobal('AudioContext', BlockedAudioContext);
      renderWithProbe();

      await runOneTurn();

      await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('error'));
      // Never `speaking`: the machine only reaches it through
      // `response_segment_ready`, which is exactly what the assertion refuses
      // to emit. And nothing was synthesized, so nothing was scheduled.
      expect(mockSpeak).not.toHaveBeenCalled();
      expect(screen.getByTestId('error').textContent).toBe(
        'This window is not allowed to play audio yet. Tap the voice button again to start it.'
      );
      expect(screen.getByTestId('reason').textContent).toBe('audio-blocked');
    });

    /**
     * The control. Same fake, same code path, but `resume()` does what a
     * gesture-resumed context does - so the refusal above is about the context
     * state and nothing else.
     */
    it('speaks normally once the context resumes', async () => {
      vi.stubGlobal('AudioContext', RunningAudioContext);
      renderWithProbe();

      await runOneTurn();

      await waitFor(() => expect(mockSpeak).toHaveBeenCalledWith({ text: 'Here is the answer.' }));
      expect(screen.getByTestId('state').textContent).toBe('speaking');
      expect(screen.getByTestId('reason').textContent).toBe('ok');
    });

    /**
     * The resume has to happen in the gesture, not at the point of playback -
     * playback runs from a stream event, where Chromium will refuse.
     */
    it('resumes the context in the tap that enters, before anything is spoken', async () => {
      vi.stubGlobal('AudioContext', RunningAudioContext);
      renderWithProbe();

      act(() => openVoiceMode('conversation-1'));
      await screen.findByRole('dialog', { name: 'Wayland voice conversation' });

      expect(resumeCalls).toBe(1);
      expect(mockSpeak).not.toHaveBeenCalled();
    });
  });

  /**
   * The wiring between the stream and the queue.
   *
   * The queue's own suite exercises the queue against a fake it owns; it cannot
   * see whether this hook ever hands it anything. Nothing else can either -
   * every other test in this file runs with `AudioContext` undefined, which is
   * exactly the branch where chunking does not happen. So a fake with the four
   * Web Audio members the queue actually uses is stubbed in here, and a
   * two-sentence answer is driven through the real stream site.
   *
   * It is still a fake. It proves the wiring exists and the seams are computed;
   * it cannot tell you whether two independently-synthesized clips sound like
   * one speaker. That is the packaged-build check.
   */
  describe('sentence chunking', () => {
    type FakeSource = {
      buffer: unknown;
      onended: (() => void) | null;
      endsAt: number | null;
      stopCalls: number;
      connect: () => void;
      start: (when?: number, offset?: number, duration?: number) => void;
      stop: () => void;
    };

    /** Every context the session constructed; the live one is the last. */
    const contexts: ChunkingAudioContext[] = [];
    const chunking = () => contexts.at(-1);

    /** 0.5 s of speech at 8 kHz, no silence to trim. */
    const speechBuffer = () => {
      const samples = new Float32Array(4000).fill(0.5);
      return {
        numberOfChannels: 1,
        sampleRate: 8000,
        length: samples.length,
        duration: 0.5,
        getChannelData: () => samples,
      };
    };

    class ChunkingAudioContext {
      state: AudioContextState = 'suspended';
      currentTime = 0;
      destination = {};
      readonly sources: FakeSource[] = [];
      constructor() {
        contexts.push(this);
      }
      async resume() {
        this.state = 'running';
      }
      async close() {}
      async decodeAudioData() {
        return speechBuffer();
      }
      createBufferSource(): FakeSource {
        const source: FakeSource = {
          buffer: null,
          onended: null,
          endsAt: null,
          stopCalls: 0,
          connect: () => {},
          start: (when = 0, _offset = 0, duration = 0) => {
            source.endsAt = when + duration;
          },
          stop: () => {
            source.stopCalls += 1;
            source.endsAt = null;
          },
        };
        this.sources.push(source);
        return source;
      }
      /** Move the audio clock, firing whatever `onended` falls due, in order. */
      advance(seconds: number) {
        const target = this.currentTime + seconds;
        for (;;) {
          const due = this.sources
            .filter((source) => source.endsAt !== null && source.endsAt <= target)
            .sort((a, b) => (a.endsAt ?? 0) - (b.endsAt ?? 0))[0];
          if (!due) break;
          this.currentTime = due.endsAt ?? target;
          const handler = due.onended;
          due.endsAt = null;
          handler?.();
        }
        this.currentTime = target;
      }
    }

    const Probe: React.FC = () => {
      const session = useVoiceSessionSafe();
      return (
        <>
          <span data-testid='state'>{session?.state ?? 'none'}</span>
          <span data-testid='error'>{session?.error?.message ?? ''}</span>
        </>
      );
    };

    /** One answer that arrives as two deltas, the second still unterminated. */
    const streamTwoSentences = async () => {
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
            data: 'The first sentence is here. ',
            msg_id: 'assistant-1',
            conversation_id: 'conversation-1',
          });
        }
      });
    };

    beforeEach(() => {
      contexts.length = 0;
      vi.stubGlobal('AudioContext', ChunkingAudioContext);
    });

    it('speaks the first sentence before the answer has finished streaming', async () => {
      render(
        <MemoryRouter>
          <VoiceSessionProvider conversationId='conversation-1' actorLabel='Wayland'>
            <VoiceConversationMode />
            <Probe />
          </VoiceSessionProvider>
        </MemoryRouter>
      );

      await streamTwoSentences();

      // No `finish` has arrived, and the first sentence is already synthesized.
      await waitFor(() => expect(mockSpeak).toHaveBeenCalledWith({ text: 'The first sentence is here.' }));
      // And it went through Web Audio, not a second `<audio>` element.
      expect(audioInstances).toHaveLength(0);
      await waitFor(() => expect(chunking()?.sources).toHaveLength(1));
    });

    it('gives the tail to the same queue and ends the turn exactly once', async () => {
      render(
        <MemoryRouter>
          <VoiceSessionProvider conversationId='conversation-1' actorLabel='Wayland'>
            <VoiceConversationMode />
            <Probe />
          </VoiceSessionProvider>
        </MemoryRouter>
      );

      await streamTwoSentences();
      await waitFor(() => expect(chunking()?.sources).toHaveLength(1));

      act(() => {
        for (const listener of responseListeners) {
          listener({
            type: 'content',
            data: 'And the second one is here.',
            msg_id: 'assistant-1',
            conversation_id: 'conversation-1',
          });
          listener({ type: 'finish', data: null, msg_id: 'assistant-1', conversation_id: 'conversation-1' });
        }
      });

      // The trailing fragment has no terminator, so the splitter never emits it
      // and the turn-terminal handler owns it - into the SAME queue.
      await waitFor(() => expect(mockSpeak).toHaveBeenCalledTimes(2));
      expect(mockSpeak).toHaveBeenLastCalledWith({ text: 'And the second one is here.' });
      expect(audioInstances).toHaveLength(0);
      await waitFor(() => expect(chunking()?.sources).toHaveLength(2));

      // Halfway through the answer the session is still speaking: a
      // `playback_completed` per chunk would have reopened the microphone here.
      await act(async () => chunking()?.advance(0.5));
      expect(screen.getByTestId('state').textContent).toBe('speaking');

      await act(async () => chunking()?.advance(0.5));
      await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('listening'));
      expect(screen.getByTestId('error').textContent).toBe('');
    });

    /**
     * The control for the tail: when the splitter has already consumed the
     * whole answer there is nothing left to speak, and the terminal handler's
     * only job is to seal. Without that, the queue waits forever for text that
     * is never coming, `playback_completed` never fires, and the microphone
     * never re-arms - a session that has stopped making sound and stopped
     * listening, with no error anywhere.
     */
    it('ends a turn whose sentences were all chunked, with no tail left', async () => {
      render(
        <MemoryRouter>
          <VoiceSessionProvider conversationId='conversation-1' actorLabel='Wayland'>
            <VoiceConversationMode />
            <Probe />
          </VoiceSessionProvider>
        </MemoryRouter>
      );

      await streamTwoSentences();
      await waitFor(() => expect(chunking()?.sources).toHaveLength(1));

      act(() => {
        for (const listener of responseListeners) {
          listener({
            type: 'content',
            data: 'And the second one is here. ',
            msg_id: 'assistant-1',
            conversation_id: 'conversation-1',
          });
          listener({ type: 'finish', data: null, msg_id: 'assistant-1', conversation_id: 'conversation-1' });
        }
      });

      await waitFor(() => expect(chunking()?.sources).toHaveLength(2));
      expect(mockSpeak).toHaveBeenCalledTimes(2);

      await act(async () => chunking()?.advance(0.5));
      expect(screen.getByTestId('state').textContent).toBe('speaking');

      await act(async () => chunking()?.advance(0.5));
      await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('listening'));
    });

    it('stops every scheduled chunk when the session ends mid-answer', async () => {
      render(
        <MemoryRouter>
          <VoiceSessionProvider conversationId='conversation-1' actorLabel='Wayland'>
            <VoiceConversationMode />
            <Probe />
          </VoiceSessionProvider>
        </MemoryRouter>
      );

      await streamTwoSentences();
      await waitFor(() => expect(chunking()?.sources).toHaveLength(1));

      act(() => {
        screen.getByRole('button', { name: 'Close Voice mode' }).click();
      });

      expect(chunking()?.sources.map((source) => source.stopCalls)).toEqual([1]);
      expect(screen.getByTestId('state').textContent).toBe('ended');
    });
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
