/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * The opening greeting, end to end through the real session.
 *
 * Sean entered voice mode and got an orb captioned "Tap to speak" - a silent
 * surface waiting for a second gesture. A voice assistant opens by SAYING
 * something and then listens, which is four separate claims: it synthesizes a
 * sentence, that sentence names him, it varies between sessions, and the
 * microphone opens afterwards without another tap.
 *
 * What this file CANNOT prove: that any of it is audible. jsdom has no Web
 * Audio at all, so the AudioContext here is a fake with the four members the
 * speech queue touches. It proves the wiring, the ordering, and every refusal.
 * Whether two clips sound like one speaker on real hardware is the packaged
 * build's job.
 */

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import enUS from '@/renderer/services/i18n/locales/en-US/index';

type SpeechInputOptions = {
  onTranscript: (text: string) => void;
  onBargeIn?: () => void;
};

const mockStartRecording = vi.fn(async () => undefined);
const mockStartMonitoring = vi.fn(async () => undefined);
const mockSpeak = vi.fn(async (_params: unknown) => ({
  ok: true as const,
  data: [82, 73, 70, 70],
  mimeType: 'audio/wav',
}));
let onBargeIn: (() => void) | null = null;

let storedStt: unknown;
let storedTts: unknown;
let storedDisplayName: string | undefined;
let systemUserName: string | undefined;
/** Whether the application bridge exists at all on this surface. */
let hasApplicationBridge = true;

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn(async (key: string) => {
      if (key === 'tools.speechToText') return storedStt;
      if (key === 'tools.textToSpeech') return storedTts;
      if (key === 'user.displayName') return storedDisplayName;
      return undefined;
    }),
    set: vi.fn(async () => undefined),
  },
}));

vi.mock('@/renderer/utils/platform', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/renderer/utils/platform')>()),
  isMacOS: () => true,
  // `rendererPlatform` reads the module's OWN `isMacOS`, not this mocked
  // export, so overriding one without the other leaves readiness on the
  // Windows/Linux story while every other check says macOS.
  rendererPlatform: () => 'darwin',
}));

vi.mock('@/renderer/hooks/system/useSpeechInput', () => ({
  useSpeechInput: (options: SpeechInputOptions) => {
    onBargeIn = options.onBargeIn ?? null;
    return {
      availability: 'record',
      cancelRecording: vi.fn(),
      clearError: vi.fn(),
      errorCode: null,
      recordingLevels: [0.12],
      startMonitoring: mockStartMonitoring,
      startRecording: mockStartRecording,
      status: 'idle',
      stopMonitoring: vi.fn(),
      stopRecording: vi.fn(),
    };
  },
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  get application() {
    if (!hasApplicationBridge) return undefined;
    return { systemInfo: { invoke: vi.fn(async () => ({ userName: systemUserName })) } };
  },
  conversation: {
    stop: { invoke: vi.fn(async () => ({ success: true })) },
    responseStream: { on: () => () => {} },
    turnCompleted: { on: () => () => {} },
    confirmation: { add: { on: () => () => {} } },
    popoutClosed: { on: () => () => {} },
  },
  voiceSynth: { speak: { invoke: (...args: unknown[]) => mockSpeak(...args) } },
  modelRegistry: { list: { invoke: vi.fn(async () => []) } },
}));

/**
 * The real en-US bundle, reached the way the hook reaches it.
 *
 * A `t` that echoed the key would make every assertion below vacuous - the
 * greeting is a KEY in the code, so the only thing that proves the key resolves
 * to a real translated sentence is translating it for real.
 */
const readKey = (key: string): unknown =>
  key.split('.').reduce<unknown>(
    (node, segment) => {
      if (typeof node !== 'object' || node === null) return undefined;
      return (node as Record<string, unknown>)[segment];
    },
    enUS as Record<string, unknown>
  );

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const value = readKey(key);
      if (typeof value !== 'string') return typeof options?.defaultValue === 'string' ? options.defaultValue : key;
      return value.replace(/\{\{(\w+)\}\}/g, (whole, name: string) =>
        typeof options?.[name] === 'string' ? (options[name] as string) : whole
      );
    },
  }),
}));

import { useVoiceSessionSafe, VoiceSessionProvider } from '@/renderer/pages/conversation/voice/VoiceSessionContext';
import VoiceConversationMode from '@/renderer/pages/conversation/voice/VoiceConversationMode';
import { VOICE_GREETING_KEYS, VOICE_GREETING_VARIANT_IDS } from '@/common/voice/voiceGreeting';

/** Every en-US greeting sentence, with the name already substituted. */
const greetingSentences = (name: string): string[] =>
  VOICE_GREETING_KEYS.map((key) => String(readKey(key)).replace('{{name}}', name));

/**
 * The text handed to synthesis. Throws rather than coercing `undefined`, so a
 * session that greeted nothing at all fails here instead of asserting against
 * the string "undefined".
 */
const spokenText = (index = 0): string => {
  const call = mockSpeak.mock.calls[index];
  if (!call) throw new Error(`nothing was synthesized at call ${index}`);
  return String((call[0] as { text: string }).text);
};

type FakeSource = {
  buffer: unknown;
  onended: (() => void) | null;
  endsAt: number | null;
  stopCalls: number;
  connect: () => void;
  start: (when?: number, offset?: number, duration?: number) => void;
  stop: () => void;
};

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

const contexts: GreetingAudioContext[] = [];

/** The four Web Audio members the speech queue actually touches. */
class GreetingAudioContext {
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

/** A context that stays suspended however politely it is asked to resume. */
class BlockedAudioContext extends GreetingAudioContext {
  override async resume() {
    // What a context with no user activation actually does: resolves, and stays
    // exactly where it was.
  }
}

const live = () => contexts.at(-1);

const Harness: React.FC = () => {
  const session = useVoiceSessionSafe();
  return (
    <>
      <button type='button' onClick={() => void session?.begin({ thenListen: true })}>
        talk
      </button>
      <span data-testid='state'>{session?.state ?? 'none'}</span>
      <span data-testid='greeting'>{session?.greetingText ?? ''}</span>
      <span data-testid='error'>{session?.error?.message ?? ''}</span>
    </>
  );
};

const renderSession = () =>
  render(
    <MemoryRouter>
      <VoiceSessionProvider conversationId='conversation-1' actorLabel='Wayland'>
        <VoiceConversationMode />
        <Harness />
      </VoiceSessionProvider>
    </MemoryRouter>
  );

/** Press "Talk with Wayland" and let the greeting reach the audio clock. */
const enterVoice = async () => {
  await act(async () => {
    screen.getByRole('button', { name: 'talk' }).click();
  });
  await waitFor(() => expect(live()?.sources.length ?? 0).toBeGreaterThan(0));
};

describe('the voice session greets before it listens', () => {
  beforeEach(() => {
    contexts.length = 0;
    mockSpeak.mockClear();
    mockStartRecording.mockClear();
    mockStartMonitoring.mockClear();
    onBargeIn = null;
    hasApplicationBridge = true;
    storedDisplayName = 'Sean';
    systemUserName = undefined;
    // Both legs local and ready: nothing to refuse, so the greeting path is the
    // one under test rather than a gate.
    storedStt = { enabled: true, provider: 'whisper-local' };
    storedTts = { enabled: true, provider: 'system-native', voice: 'default', speed: 1, autoReadResponses: false };
    vi.stubGlobal('AudioContext', GreetingAudioContext);
    vi.stubGlobal(
      'Audio',
      class {
        src = '';
        addEventListener() {}
        pause() {}
        async play() {}
      }
    );
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:voice') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  });

  it('speaks a real greeting that says his name', async () => {
    renderSession();
    await enterVoice();

    const spoken = spokenText();
    // A positive observable: the exact en-US sentence, name substituted - not
    // merely "speak was called" and not the dotted key path.
    expect(greetingSentences('Sean')).toContain(spoken);
    expect(spoken).toContain('Sean');
    expect(spoken).not.toContain('{{name}}');
    expect(spoken).not.toContain('conversation.chat.voice');
  });

  it('shows the greeting as the on-screen state while it is sounding', async () => {
    renderSession();
    await enterVoice();

    const spoken = spokenText();
    expect(screen.getByTestId('greeting').textContent).toBe(spoken);
    // And the orb captions it, instead of telling him to tap something. The
    // harness probe says it too, hence `getAllByText`.
    expect(screen.getAllByText(spoken).length).toBeGreaterThan(1);
    expect(screen.queryByText('Tap to speak')).not.toBeInTheDocument();
  });

  it('opens the microphone once the greeting has finished, with no second tap', async () => {
    renderSession();
    await enterVoice();

    // Still greeting: the mic must not be open on top of Wayland's own voice.
    expect(mockStartRecording).not.toHaveBeenCalled();
    expect(screen.getByTestId('state').textContent).toBe('listening');

    await act(async () => live()?.advance(0.5));

    await waitFor(() => expect(mockStartRecording).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('state').textContent).toBe('user-speaking');
    expect(screen.getByTestId('greeting').textContent).toBe('');
  });

  it('varies the greeting across sessions', async () => {
    // Deterministic in the test, random in production: the roll is the only
    // input, so pinning it pins the sentence.
    const rolls = [0.05, 0.25, 0.45, 0.65, 0.85];
    const spoken = new Set<string>();
    for (const roll of rolls) {
      vi.spyOn(Math, 'random').mockReturnValue(roll);
      contexts.length = 0;
      mockSpeak.mockClear();
      const view = renderSession();
      await enterVoice();
      spoken.add(spokenText());
      view.unmount();
    }
    vi.spyOn(Math, 'random').mockRestore();

    expect(spoken.size).toBe(VOICE_GREETING_VARIANT_IDS.length);
    for (const sentence of spoken) expect(greetingSentences('Sean')).toContain(sentence);
  });

  it('greets by the OS account name when nothing was configured', async () => {
    storedDisplayName = undefined;
    systemUserName = 'seand';
    renderSession();
    await enterVoice();

    expect(spokenText()).toContain('seand');
  });

  it('drops the name rather than greeting a hole', async () => {
    // The control for both name paths. With no name anywhere the anonymous
    // family is chosen, and it is a real sentence, not "Hey , how are you?".
    storedDisplayName = undefined;
    systemUserName = undefined;
    renderSession();
    await enterVoice();

    const spoken = spokenText();
    expect(
      VOICE_GREETING_KEYS.filter((key) => key.includes('.anonymous.')).map((key) => String(readKey(key)))
    ).toContain(spoken);
  });

  it('still greets on a surface with no application bridge at all', async () => {
    // WebUI has no `application` object to reach `systemInfo` on, which is a
    // TypeError rather than a rejected promise - and an unhandled one there
    // would take the whole entry down instead of costing a name.
    hasApplicationBridge = false;
    storedDisplayName = undefined;
    renderSession();
    await enterVoice();

    expect(mockSpeak).toHaveBeenCalledTimes(1);
  });
});

describe('barge-in over the greeting', () => {
  beforeEach(() => {
    contexts.length = 0;
    mockSpeak.mockClear();
    mockStartRecording.mockClear();
    mockStartMonitoring.mockClear();
    onBargeIn = null;
    hasApplicationBridge = true;
    storedDisplayName = 'Sean';
    storedStt = { enabled: true, provider: 'whisper-local' };
    storedTts = { enabled: true, provider: 'system-native', voice: 'default', speed: 1, autoReadResponses: false };
    vi.stubGlobal('AudioContext', GreetingAudioContext);
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:voice') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  });

  it('stops the greeting and opens the microphone when the orb is tapped', async () => {
    renderSession();
    await enterVoice();

    await act(async () => {
      screen.getByRole('button', { name: 'Start speaking' }).click();
    });

    expect(live()?.sources.map((source) => source.stopCalls)).toEqual([1]);
    expect(screen.getByTestId('greeting').textContent).toBe('');
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('user-speaking'));
  });

  it('arms the acoustic detector while the greeting plays', async () => {
    // Gating the detector on `state === 'speaking'` alone - which is where it
    // was - makes the opening sentence the one thing in the session that cannot
    // be interrupted by talking, because the machine says `listening` here.
    renderSession();
    await enterVoice();

    await waitFor(() => expect(mockStartMonitoring).toHaveBeenCalled());
    expect(onBargeIn).not.toBeNull();
  });

  it('hands the microphone over when he talks across it', async () => {
    renderSession();
    await enterVoice();

    await act(async () => onBargeIn?.());

    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('user-speaking'));
    expect(live()?.sources.map((source) => source.stopCalls)).toEqual([1]);
    expect(mockStartRecording).toHaveBeenCalledTimes(1);
  });

  it('does not hand the microphone over twice when the stopped clip comes due', async () => {
    // The queue's epoch is the only thing preventing this: a barge-in abandons
    // the clip, and `stop()` still fires `onended` on real hardware. A second
    // `onCompleted` would reopen a microphone that is already open.
    renderSession();
    await enterVoice();
    await act(async () => onBargeIn?.());
    await waitFor(() => expect(mockStartRecording).toHaveBeenCalledTimes(1));

    await act(async () => live()?.advance(1));

    expect(mockStartRecording).toHaveBeenCalledTimes(1);
  });

  it('stops the greeting when the session ends', async () => {
    renderSession();
    await enterVoice();

    await act(async () => {
      screen.getByRole('button', { name: 'Close Voice mode' }).click();
    });

    expect(live()?.sources.map((source) => source.stopCalls)).toEqual([1]);
    expect(screen.getByTestId('state').textContent).toBe('ended');
    expect(screen.getByTestId('greeting').textContent).toBe('');
  });
});

describe('the greeting refuses the same things the session does', () => {
  beforeEach(() => {
    contexts.length = 0;
    mockSpeak.mockClear();
    mockStartRecording.mockClear();
    hasApplicationBridge = true;
    storedDisplayName = 'Sean';
    vi.stubGlobal('AudioContext', GreetingAudioContext);
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:voice') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  });

  /**
   * REWRITTEN, and the rewrite is the point of the lane rather than a
   * concession to it.
   *
   * This used to assert that Sean's exact reported state - `provider:"openai"`
   * with no key - refuses and names the missing key. That state carries NO
   * `origin`, which makes it byte-for-byte indistinguishable from a profile
   * that was never touched, because the old normalizer spread
   * `provider:'openai'` over every stored config. So the ladder now treats it
   * as what it almost always is - an untouched profile - and re-seeds it onto
   * the bundled on-device engine, which needs no key and owes no disclosure.
   *
   * The old assertion is not deleted, it is MOVED: the test below pins the
   * identical refusal for a config that carries `origin:'user'`, which is the
   * only shape that can genuinely mean "I chose keyless OpenAI on purpose".
   */
  it('re-seeds a pre-origin keyless-OpenAI profile onto the on-device engine and greets', async () => {
    storedStt = { enabled: true, provider: 'openai', openai: { apiKey: '', model: 'whisper-1' } };
    storedTts = { enabled: true, provider: 'system-native', voice: 'default', speed: 1, autoReadResponses: false };
    renderSession();

    await act(async () => {
      screen.getByRole('button', { name: 'talk' }).click();
    });

    // No disclosure is owed, because nothing hosted is in the path any more.
    expect(screen.queryByTestId('voice-consent-accept')).toBeNull();
    await waitFor(() => expect(mockSpeak).toHaveBeenCalled());
    expect(screen.getByTestId('error').textContent).toBe('');
  });

  /**
   * The moved assertion. `origin:'user'` is the one shape that distinguishes a
   * deliberate keyless-OpenAI choice from a factory profile, and it is still
   * refused, still by name.
   */
  it('says nothing when a user-chosen transcriber has no key, and keeps the honest reason', async () => {
    storedStt = { enabled: true, origin: 'user', provider: 'openai', openai: { apiKey: '', model: 'whisper-1' } };
    storedTts = { enabled: true, provider: 'system-native', voice: 'default', speed: 1, autoReadResponses: false };
    renderSession();

    await act(async () => {
      screen.getByRole('button', { name: 'talk' }).click();
    });
    // The microphone leg is hosted, so the disclosure comes first. Accepting it
    // is what gets us past consent and onto the readiness check underneath - a
    // key that does not exist.
    const accept = await screen.findByTestId('voice-consent-accept');
    await act(async () => {
      accept.click();
    });

    expect(mockSpeak).not.toHaveBeenCalled();
    expect(screen.getByTestId('greeting').textContent).toBe('');
    await waitFor(() =>
      expect(screen.getByTestId('error').textContent).toBe(
        'openai has no key yet, so nothing can be transcribed. Add one in Voice settings.'
      )
    );
  });

  it('says nothing when the user turned speech output off', async () => {
    storedStt = { enabled: true, provider: 'whisper-local' };
    storedTts = { enabled: false, provider: 'system-native', voice: 'default', speed: 1, autoReadResponses: false };
    renderSession();

    await act(async () => {
      screen.getByRole('button', { name: 'talk' }).click();
    });

    expect(mockSpeak).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId('error').textContent).toMatch(/Speech output is off/));
  });

  /**
   * The autoplay hazard, named on screen instead of in the console.
   *
   * The armed hand-off from the new-chat page runs `begin()` from a MOUNT
   * EFFECT, not a click handler, so the AudioContext can come up suspended.
   * The queue refuses by name; the old behaviour would have been a session that
   * makes no sound with nothing anywhere saying why.
   */
  it('names a blocked AudioContext in the voice panel, and still listens', async () => {
    storedStt = { enabled: true, provider: 'whisper-local' };
    storedTts = { enabled: true, provider: 'system-native', voice: 'default', speed: 1, autoReadResponses: false };
    vi.stubGlobal('AudioContext', BlockedAudioContext);
    renderSession();

    await act(async () => {
      screen.getByRole('button', { name: 'talk' }).click();
    });

    await waitFor(() =>
      expect(screen.getByTestId('error').textContent).toBe(
        'This window is not allowed to play audio yet. Tap the voice button again to start it.'
      )
    );
    // Nothing was synthesized: on a hosted provider that call is billed whether
    // or not anything can play it.
    expect(mockSpeak).not.toHaveBeenCalled();
    // And the microphone still opened, so a blocked greeting is never worse
    // than the silent entry it replaced.
    expect(mockStartRecording).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('state').textContent).toBe('user-speaking');
  });

  it('does not greet on the passive entry that was never asked to listen', async () => {
    // The control for every test above: `openVoiceMode` opens the surface only.
    // Greeting there would make merely looking at voice mode talk at you.
    storedStt = { enabled: true, provider: 'whisper-local' };
    storedTts = { enabled: true, provider: 'system-native', voice: 'default', speed: 1, autoReadResponses: false };
    const { openVoiceMode } = await import('@/renderer/pages/conversation/voice/voiceTurnBridge');
    renderSession();

    act(() => openVoiceMode('conversation-1'));
    await screen.findByRole('dialog', { name: 'Wayland voice conversation' });
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockSpeak).not.toHaveBeenCalled();
    expect(screen.getByTestId('greeting').textContent).toBe('');
    expect(screen.getByText('Tap to speak')).toBeInTheDocument();
  });
});
