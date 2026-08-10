/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { conversation, modelRegistry, voiceSynth } from '@/common/adapter/ipcBridge';
import { FLUX_PROVIDER_ID } from '@/common/config/flux';
import { ConfigStorage } from '@/common/config/storage';
import type { SpeechToTextConfig, SpeechToTextProvider } from '@/common/types/speech';
import {
  grantHostedVoiceConsent,
  isHostedVoiceProvider,
  type HostedVoiceConsent,
  type HostedVoiceProvider,
} from '@/common/types/voiceConsent';
import { normalizeTextToSpeechConfig, type TextToSpeechConfig } from '@/common/types/ttsTypes';
import {
  createVoiceSession,
  transitionVoiceSession,
  type VoiceSessionEffect,
  type VoiceSessionEvent,
  type VoiceSessionSnapshot,
} from '@/common/voice/VoiceSessionMachine';
import { resolveEffectiveSttProvider } from '@/common/voice/sttProviderResolution';
import {
  resolveVoiceSessionReadiness,
  type VoiceReadinessReason,
  type VoiceSessionReadiness,
} from '@/common/voice/voiceReadiness';
import { extractVoiceResponseText } from '@/common/voice/voiceResponseText';
import { useSpeechInput } from '@/renderer/hooks/system/useSpeechInput';
import { isMacOS } from '@/renderer/utils/platform';
import {
  submitVoiceTurn,
  VOICE_MODE_OPEN_EVENT,
  VOICE_TURN_SETTLED_EVENT,
  type VoiceModeOpenDetail,
  type VoiceTurnSettledDetail,
} from '@/renderer/pages/conversation/voice/voiceTurnBridge';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

/**
 * The voice session, lifted out of the full-screen orb.
 *
 * It used to live inside `VoiceConversationMode`, which meant the session and
 * the only surface that could show it were the same component. Two things
 * followed from that. The composer could not display voice state at all, so the
 * soundwave button in workflow-mode surfaces dispatched an open event into a
 * void - the component that listened for it was mounted inside a header those
 * surfaces do not render. And the orb was the only place a session could be
 * stopped, which is survivable while the orb is a modal overlay and stops being
 * survivable the moment it is not.
 *
 * Nothing here is new logic. This is the same state machine driver, the same
 * effects, and the same deliberate no-ops, moved so that more than one surface
 * can read it.
 */

const sanitizeCorrelationId = (value: string, fallback: string): string => {
  const safe = value
    .replace(/[^A-Za-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 128);
  return safe || fallback;
};

const newCorrelationId = (prefix: string): string => {
  const random = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  return sanitizeCorrelationId(`${prefix}-${random}`, `${prefix}-${Date.now()}`);
};

/**
 * Grace between the assistant finishing a sentence and the mic reopening. Long
 * enough that the tail of the assistant's own audio is not captured as a user
 * turn, short enough that the conversation still feels continuous.
 */
const AUTO_CAPTURE_GRACE_MS = 350;

/**
 * Acoustic barge-in kill switch. The detector itself is gated on the browser
 * confirming echo cancellation is active and calibrates against the measured
 * speaker bleed, but neither guard has been validated against real hardware.
 * Set to `false` to fall back to Escape/tap interruption only.
 */
const ACOUSTIC_BARGE_IN_ENABLED: boolean = true;

/**
 * What to tell someone whose voice conversation cannot start, per reason.
 *
 * Every line names the actual obstacle and the way out. "Voice setup is
 * incomplete" is a dead end, and on Windows and Linux it would also be a lie -
 * nothing is misconfigured there, the local synthesizer simply does not exist
 * on that platform yet.
 */
const CAPTURE_BLOCKED_COPY: Record<VoiceReadinessReason, (readiness: VoiceSessionReadiness) => string> = {
  ok: () => '',
  'tts-disabled-by-user': () =>
    'Speech output is off. Turn it back on in Voice settings to have a spoken conversation.',
  'no-local-adapter': () =>
    'Wayland has no built-in voice on this operating system yet. Choose OpenAI Speech in Voice settings to talk out loud, or keep typing in Chat.',
  'kokoro-unavailable': () =>
    'Kokoro has no working voice yet. Choose System Voice or OpenAI Speech in Voice settings.',
  'tts-needs-consent': (r) => `Speaking would send the reply to ${r.ttsProvider}, which needs your agreement first.`,
  'stt-disabled': () => 'Speech input is off. Turn it on in Voice settings so Wayland can hear you.',
  'stt-unavailable': (r) =>
    `${r.sttProvider} has no key yet, so nothing can be transcribed. Add one in Voice settings.`,
  'stt-needs-consent': (r) => `Listening would send your audio to ${r.sttProvider}, which needs your agreement first.`,
  'audio-blocked': () => 'This window is not allowed to play audio yet. Tap the voice button again to start it.',
};

const isTerminalCompletion = (status: string, state: string): boolean =>
  status === 'finished' || state === 'ai_waiting_input' || state === 'stopped' || state === 'error';

export type VoiceConversationSessionOptions = {
  conversationId: string;
  actorLabel?: string;
  /**
   * Resolves the hosted-voice disclosure for a provider, or `true` immediately
   * for a local one. Injected because the modal it opens can only be rendered by
   * the provider - a hook cannot render, and an unrendered modal means the
   * promise never settles.
   */
  ensureConsent?: (provider: string) => Promise<boolean>;
};

export type VoiceConversationSession = {
  /** The conversation this session belongs to. Consumers must match on it. */
  conversationId: string;
  actorLabel: string;
  snapshot: VoiceSessionSnapshot | null;
  state: VoiceSessionSnapshot['state'];
  /** A session exists and owns the microphone. Independent of whether the orb is up. */
  isActive: boolean;
  /** The full-screen orb is showing. Purely a view concern. */
  isExpanded: boolean;
  isMuted: boolean;
  /** True once the user has committed to a turn and the mic re-arms itself. */
  continuousArmed: boolean;
  endpointingAvailable: boolean;
  lastTranscript: string;
  lastResponse: string;
  error: string | null;
  /** Microphone level, 0-1, for whatever wants to draw it. */
  level: number;
  ttsConfig: TextToSpeechConfig | null;
  sttConfig: SpeechToTextConfig | null;
  /** Why voice cannot run, named, so a surface can offer the one tap that fixes it. */
  readiness: VoiceSessionReadiness;
  configReady: boolean;
  /** `thenListen` opens the microphone in the same gesture that enters. */
  begin: (options?: { thenListen?: boolean }) => Promise<void>;
  beginCapture: () => Promise<void>;
  finishCapture: () => void;
  end: () => void;
  interrupt: () => Promise<void>;
  toggleMute: () => void;
  expand: () => void;
  collapse: () => void;
};

export const useVoiceConversationSession = ({
  conversationId,
  actorLabel = 'Wayland',
  ensureConsent,
}: VoiceConversationSessionOptions): VoiceConversationSession => {
  // `isActive` owns the microphone and every subscription; `isExpanded` owns
  // only whether the orb is drawn. They were one flag while the orb was the
  // entire surface. Splitting them is what lets the session outlive the view -
  // and the subscriptions must follow isActive, because gating them on the view
  // means collapsing the orb mid-answer silently unsubscribes the response
  // stream and the turn hangs in `thinking` forever.
  const [isActive, setIsActive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [surfaceError, setSurfaceError] = useState<string | null>(null);
  const [ttsConfig, setTtsConfig] = useState<TextToSpeechConfig | null>(null);
  const [sttConfig, setSttConfig] = useState<SpeechToTextConfig | null>(null);
  const [consent, setConsent] = useState<Partial<HostedVoiceConsent> | null>(null);
  /**
   * The same two configs as refs. `begin` can start listening in the tick it
   * enters, and React state is a render behind at that point - reading it there
   * reports "Speech input is off" on the very first tap, for a user whose
   * speech input is on.
   */
  const sttConfigRef = useRef<SpeechToTextConfig | null>(null);
  const ttsConfigRef = useRef<TextToSpeechConfig | null>(null);
  const consentRef = useRef<Partial<HostedVoiceConsent> | null>(null);
  /**
   * The transcriber that will actually receive the audio, resolved ONCE at
   * entry and then reused for both the disclosure and the readiness check.
   *
   * It is not always what is stored: main seeds Flux Voice when Flux is
   * connected, and an unset provider means local Whisper in the renderer while
   * main's factory default calls it openai. Resolving it twice, in two places,
   * with two different answers is how a session ends up asking for consent to
   * one company and then refusing to start because a different one has no key.
   */
  const sttProviderRef = useRef<SpeechToTextProvider | null>(null);
  const [effectiveSttProvider, setEffectiveSttProvider] = useState<SpeechToTextProvider | null>(null);
  const [snapshot, setSnapshot] = useState<VoiceSessionSnapshot | null>(null);
  const snapshotRef = useRef<VoiceSessionSnapshot | null>(null);
  const activeTurnRef = useRef<string | null>(null);
  const completionKeyRef = useRef<string | null>(null);
  const responseTextRef = useRef('');
  const responseMessageIdRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  // `continuousArmed` drives copy, so it is state; the ref is what the capture
  // timer reads, because the timer closes over a stale render otherwise.
  const [continuousArmed, setContinuousArmed] = useState(false);
  const continuousArmedRef = useRef(false);
  // Drives the copy under the orb. When this is false, "pause when you are done"
  // is a lie: nothing is listening for the pause and only a tap sends the turn.
  const [endpointingAvailable, setEndpointingAvailable] = useState(true);
  const mountedRef = useRef(true);
  const isActiveRef = useRef(false);
  const isMutedRef = useRef(false);
  const captureTimerRef = useRef<number | null>(null);
  const captureInFlightRef = useRef(false);
  const beginCaptureRef = useRef<() => Promise<void>>(async () => {});
  const finishCaptureRef = useRef<() => void>(() => {});
  const interruptRef = useRef<() => Promise<void>>(async () => {});

  const cancelAutoCapture = useCallback(() => {
    if (captureTimerRef.current !== null) {
      window.clearTimeout(captureTimerRef.current);
      captureTimerRef.current = null;
    }
  }, []);

  /**
   * Reopens the mic after the assistant stops talking. Every precondition is
   * re-checked when the timer *fires*, not when it is scheduled: the user can
   * tap the orb, mute, or leave Voice mode inside the grace window.
   */
  const scheduleAutoCapture = useCallback(() => {
    // The first turn is always a deliberate tap: opening the panel must not
    // open the microphone.
    if (!continuousArmedRef.current || !mountedRef.current) return;
    cancelAutoCapture();
    captureTimerRef.current = window.setTimeout(() => {
      captureTimerRef.current = null;
      if (!mountedRef.current || !isActiveRef.current || isMutedRef.current) return;
      if (captureInFlightRef.current) return;
      if (snapshotRef.current?.state !== 'listening') return;
      captureInFlightRef.current = true;
      void beginCaptureRef.current().finally(() => {
        captureInFlightRef.current = false;
      });
    }, AUTO_CAPTURE_GRACE_MS);
  }, [cancelAutoCapture]);

  /**
   * Applies the effects the session machine emits. Only `start_capture` is
   * executed here — that is the hop that makes the conversation continuous.
   *
   * The rest are deliberately no-ops:
   *  - `transcribe` / `submit_turn` / `synthesize_segment` are payload-incomplete.
   *    `submit_turn{turnId}` carries no text; the transcript only exists in the
   *    `handleTranscript` closure. Widening the effect types to "fix" this is not
   *    an improvement, it is a second copy of the same state.
   *  - `stop_capture` / `cancel_capture` / `cancel_synthesis` / `stop_playback`
   *    already have imperative owners at sites that must run even when the
   *    transition is *rejected* (the confirmation handler stops audio before
   *    `approval_required`; a turnId mismatch there must not leave the assistant
   *    talking over an approval prompt).
   *  - `announce_state` is already rendered by the aria-live status block.
   *
   * The `never` default is the drift guard: a tenth effect fails typecheck here.
   */
  const runEffects = useCallback(
    (effects: readonly VoiceSessionEffect[]) => {
      for (const effect of effects) {
        switch (effect.type) {
          case 'start_capture':
            scheduleAutoCapture();
            break;
          case 'transcribe':
          case 'submit_turn':
          case 'synthesize_segment':
          case 'stop_capture':
          case 'cancel_capture':
          case 'cancel_synthesis':
          case 'stop_playback':
          case 'announce_state':
            break;
          default: {
            const exhaustive: never = effect;
            void exhaustive;
          }
        }
      }
    },
    [scheduleAutoCapture]
  );

  const applyEvent = useCallback(
    (event: VoiceSessionEvent) => {
      const current = snapshotRef.current;
      if (!current) return null;
      const transition = transitionVoiceSession(current, event);
      if (transition.rejected) return transition;
      snapshotRef.current = transition.snapshot;
      setSnapshot(transition.snapshot);
      runEffects(transition.effects);
      return transition;
    },
    [runEffects]
  );

  const clearAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const handleTranscript = useCallback(
    (text: string) => {
      const turnId = activeTurnRef.current;
      if (!turnId) {
        setSurfaceError('The transcript arrived without an active voice turn. Nothing was sent.');
        return;
      }
      setLastTranscript(text);
      setLastResponse('');
      responseTextRef.current = '';
      responseMessageIdRef.current = null;
      const transition = applyEvent({ type: 'transcription_ready', turnId });
      if (!transition || transition.rejected) {
        setSurfaceError('The voice turn could not be correlated. Nothing was sent.');
        return;
      }
      submitVoiceTurn({ conversationId, turnId, text });
    },
    [applyEvent, conversationId]
  );

  const {
    availability,
    cancelRecording,
    clearError: clearSpeechError,
    errorCode: speechErrorCode,
    recordingLevels,
    startMonitoring,
    startRecording,
    status: speechStatus,
    stopMonitoring,
    stopRecording,
  } = useSpeechInput({
    onTranscript: handleTranscript,
    endpointing: true,
    // `finishCapture` is declared below this call, so it is reached through a
    // ref that a layout effect keeps current.
    onSpeechEnd: () => finishCaptureRef.current(),
    onNoSpeech: () => {
      applyEvent({ type: 'capture_cancelled' });
      setSurfaceError('I did not hear anything. Tap the orb when you are ready to talk.');
    },
    onEndpointingUnavailable: () => {
      setEndpointingAvailable(false);
      setSurfaceError('This device gave no audio signal to listen to. Tap the orb when you are done speaking.');
    },
    onBargeIn: () => {
      void interruptRef.current();
    },
  });

  const sttEnabled = Boolean(sttConfig?.enabled);
  const ttsProviderReady = Boolean(ttsConfig?.enabled && ttsConfig.provider !== 'kokoro-local');

  const beginCapture = useCallback(async () => {
    if (!snapshotRef.current || snapshotRef.current.state !== 'listening') return;
    /**
     * Refuse before the microphone opens, and say which thing is wrong.
     *
     * The old pair of ad-hoc booleans could not describe the platform this runs
     * on. `say` exists only on macOS, so on Windows and Linux a default config
     * reads as ready - `enabled` is true and the provider is not kokoro - and
     * the failure lands mid-turn as TTS_SYSTEM_NATIVE_UNAVAILABLE. The user
     * talks, waits, and only then learns that speech output was never possible.
     * The reason is what makes the refusal actionable.
     */
    const readinessNow = resolveVoiceSessionReadiness({
      ttsConfig: ttsConfigRef.current,
      sttConfig: sttConfigRef.current && { ...sttConfigRef.current, provider: sttProviderRef.current ?? undefined },
      platform: isMacOS() ? 'darwin' : 'other',
      consent: consentRef.current,
    });
    if (!readinessNow.ready) {
      setSurfaceError(CAPTURE_BLOCKED_COPY[readinessNow.reason](readinessNow));
      return;
    }
    if (isMutedRef.current) {
      setSurfaceError('The microphone is muted. Unmute it before starting a voice turn.');
      return;
    }
    if (availability !== 'record') {
      setSurfaceError('Live microphone capture is not available in this environment.');
      return;
    }
    setSurfaceError(null);
    const transition = applyEvent({ type: 'speech_started' });
    if (transition?.rejected) return;
    await startRecording();
  }, [applyEvent, availability, startRecording]);

  const finishCapture = useCallback(() => {
    if (snapshotRef.current?.state !== 'user-speaking') return;
    const turnId = newCorrelationId('voice-turn');
    activeTurnRef.current = turnId;
    const transition = applyEvent({ type: 'speech_ended', turnId });
    if (transition?.rejected) return;
    // The user has committed to a turn, so every later `start_capture` the
    // machine emits reopens the mic without another tap.
    continuousArmedRef.current = true;
    setContinuousArmed(true);
    stopRecording();
  }, [applyEvent, stopRecording]);

  const toggleMute = useCallback(() => {
    setIsMuted((current) => {
      const next = !current;
      if (next && speechStatus === 'recording') {
        cancelRecording();
        activeTurnRef.current = null;
        applyEvent({ type: 'capture_cancelled' });
      }
      return next;
    });
  }, [applyEvent, cancelRecording, speechStatus]);

  const playResponse = useCallback(
    async (turnId: string, segmentId: string, text: string) => {
      clearAudio();
      const result = await voiceSynth.speak.invoke({ text });
      if (result.ok === false || result.data.length === 0) {
        applyEvent({ type: 'fail', errorCode: result.ok === false ? result.errorCode : 'TTS_EMPTY_AUDIO' });
        setSurfaceError(
          result.ok === false
            ? `Speech output is unavailable (${result.errorCode}). The complete answer is still in Chat.`
            : 'Speech output returned no audio. The complete answer is still in Chat.'
        );
        return;
      }

      const bytes = Uint8Array.from(result.data);
      const url = URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: result.mimeType }));
      const audio = new Audio(url);
      audioRef.current = audio;
      audioUrlRef.current = url;
      audio.addEventListener(
        'ended',
        () => {
          clearAudio();
          applyEvent({ type: 'playback_completed', turnId, segmentId });
        },
        { once: true }
      );
      audio.addEventListener(
        'error',
        () => {
          clearAudio();
          applyEvent({ type: 'fail', errorCode: 'TTS_PLAYBACK_FAILED' });
          setSurfaceError('Audio playback failed. The complete answer is still in Chat.');
        },
        { once: true }
      );
      applyEvent({ type: 'playback_started', turnId, segmentId });
      try {
        await audio.play();
      } catch {
        clearAudio();
        applyEvent({ type: 'fail', errorCode: 'TTS_PLAYBACK_FAILED' });
        setSurfaceError('Audio playback could not start. The complete answer is still in Chat.');
      }
    },
    [applyEvent, clearAudio]
  );

  const interrupt = useCallback(async () => {
    const current = snapshotRef.current;
    if (!current || !['thinking', 'acting', 'speaking'].includes(current.state)) return;
    const wasRunning = current.state === 'thinking' || current.state === 'acting';
    const transition = applyEvent({ type: 'barge_in' });
    if (!transition || transition.rejected) return;
    clearAudio();
    if (wasRunning) {
      try {
        await conversation.stop.invoke({ conversation_id: conversationId });
      } catch {
        // The local playback is already stopped. The canonical chat surface
        // will expose any backend cancellation failure and recovery action.
      }
    }
    applyEvent({ type: 'interruption_settled' });
  }, [applyEvent, clearAudio, conversationId]);

  const begin = useCallback(
    async (options?: { thenListen?: boolean }) => {
      /**
       * Entering an already-live session is a no-op.
       *
       * `begin` unconditionally built a NEW session and swapped it in without
       * stopping anything the old one owned - no clearAudio, no stopMonitoring,
       * no cancelRecording. One stray tap therefore orphaned a playing clip and
       * a live recorder. That was masked only because the composer's control
       * was disabled while a reply was streaming, and the next steps remove
       * that guard and make the composer the single door.
       */
      if (isActiveRef.current) return;
      try {
        const [storedStt, storedTts] = await Promise.all([
          ConfigStorage.get('tools.speechToText'),
          ConfigStorage.get('tools.textToSpeech'),
        ]);
        const nextTts = normalizeTextToSpeechConfig(storedTts ?? undefined);

        /**
         * Which transcriber will actually receive the audio, which is not always
         * the one stored: main seeds Flux Voice when Flux is connected and no
         * engine was ever chosen. Asking about the stored provider would prompt
         * for a disclosure that unblocks nothing - the same defect the settings
         * panel had. Registry failure degrades to the stored provider rather than
         * blocking entry.
         */
        let sttProvider: SpeechToTextProvider = 'whisper-local';
        if (storedStt?.provider) {
          try {
            const providers = await modelRegistry.list.invoke();
            sttProvider = resolveEffectiveSttProvider({
              stored: storedStt,
              hasConnectedOpenAIKey: providers.some((p) => p.providerId === 'openai' && p.state === 'connected'),
              hasConnectedFluxKey: providers.some((p) => p.providerId === FLUX_PROVIDER_ID && p.state === 'connected'),
            });
          } catch {
            // Non-fatal: an unreadable registry must not stop someone talking.
            sttProvider = storedStt.provider;
          }
        }
        // An UNSET provider is the one case where the renderer and main disagree,
        // and here the renderer wins because it is the one that runs: its
        // transcribe path short-circuits an unset provider to the bundled local
        // Whisper and never reaches main at all. Main's factory default says
        // `openai`, so mirroring main would prompt for a disclosure covering a
        // transmission that never happens - gating on-device audio behind consent
        // to send it off-device. That divergence is a real defect and its own
        // packet; what must not happen is this code quietly picking the wrong
        // side of it.

        /**
         * Consent for BOTH legs, before the session exists.
         *
         * Entering a conversation is consent to make sound. It is not consent to
         * transmit, and speaking and listening are two disclosures to two
         * potentially different companies. Gating on the speaking leg alone means
         * that on macOS - where the default speech output is local and silent - a
         * user enters, sees no disclosure at all, and the session immediately
         * begins continuously re-arming a microphone routed off-device.
         *
         * The main-side gates stay exactly as they are: per-provider,
         * version-bound, fail-closed, and checked on every single call. This is
         * the prompt, not the gate. Never cache a "granted" here and never add a
         * skip parameter to the bridge to make chunking cheaper.
         */
        const grantedNow: HostedVoiceProvider[] = [];
        if (ensureConsent) {
          for (const [leg, provider] of [
            ['speech output', nextTts.provider],
            ['the microphone', sttProvider],
          ] as const) {
            if (!(await ensureConsent(provider))) {
              setSurfaceError(
                `Voice conversation needs your agreement to send ${leg} to ${provider}. Nothing was sent, and Chat still works normally.`
              );
              return;
            }
            if (isHostedVoiceProvider(provider)) grantedNow.push(provider);
          }
        }

        /**
         * Read AFTER the prompting above, then fold in what was just agreed.
         *
         * A consent record fetched before the prompt still says "not granted",
         * so the readiness check would refuse to start the very session the
         * user had just agreed to - a dead end with no way forward. Re-reading
         * alone fixes that only if the write has landed AND is visible, which
         * makes correctness depend on a read-after-write round trip through
         * storage. It does not need to: `ensureConsent` returning true IS the
         * answer, so the providers confirmed a moment ago are merged in
         * directly. The stored record stays the durable one, and the main-side
         * gates still read it on every single call.
         */
        const storedConsent = await ConfigStorage.get('tools.voiceHostedConsent');
        const effectiveConsent = grantedNow.reduce<Partial<HostedVoiceConsent> | null | undefined>(
          (record, provider) => grantHostedVoiceConsent(provider, 0, record),
          storedConsent
        );

        sttProviderRef.current = sttProvider;
        setEffectiveSttProvider(sttProvider);
        sttConfigRef.current = storedStt ?? null;
        ttsConfigRef.current = nextTts;
        consentRef.current = effectiveConsent ?? null;
        setSttConfig(storedStt ?? null);
        setTtsConfig(nextTts);
        setConsent(effectiveConsent ?? null);
        setSurfaceError(null);
        setLastTranscript('');
        setLastResponse('');
        activeTurnRef.current = null;
        completionKeyRef.current = null;
        responseTextRef.current = '';
        responseMessageIdRef.current = null;
        cancelAutoCapture();
        continuousArmedRef.current = false;
        setContinuousArmed(false);
        setEndpointingAvailable(true);
        const next = createVoiceSession({
          sessionId: newCorrelationId('voice-session'),
          conversationId: sanitizeCorrelationId(conversationId, 'conversation'),
          actorId: sanitizeCorrelationId(actorLabel, 'wayland'),
          modelId: sanitizeCorrelationId(actorLabel, 'current-model'),
          authorityClass: 'ask',
          voiceId: sanitizeCorrelationId(nextTts.voice, 'default'),
        });
        const connected = transitionVoiceSession(next, { type: 'connected' });
        snapshotRef.current = connected.snapshot;
        setSnapshot(connected.snapshot);
        isActiveRef.current = true;
        setIsActive(true);
        setIsExpanded(true);
        /**
         * One tap, one meaning.
         *
         * Entry used to land in `listening` with the microphone CLOSED, and the
         * copy under the orb says "Tap to speak" precisely because of that. Once
         * the composer is the surface, its status line reads "Listening..." while
         * nothing is recording - so the everyman talks and nothing happens. The
         * caller that owns the gesture asks for the mic to open with it.
         */
        if (options?.thenListen) await beginCaptureRef.current();
      } catch {
        sttConfigRef.current = null;
        ttsConfigRef.current = null;
        consentRef.current = null;
        setSttConfig(null);
        setTtsConfig(null);
        setConsent(null);
        setSurfaceError('Voice settings could not be loaded. Open Voice settings or continue in Chat.');
        const next = createVoiceSession({
          sessionId: newCorrelationId('voice-session'),
          conversationId: sanitizeCorrelationId(conversationId, 'conversation'),
          actorId: sanitizeCorrelationId(actorLabel, 'wayland'),
          modelId: sanitizeCorrelationId(actorLabel, 'current-model'),
          authorityClass: 'ask',
          voiceId: 'unavailable',
        });
        const failed = transitionVoiceSession(next, { type: 'fail', errorCode: 'VOICE_CONFIG_UNAVAILABLE' });
        snapshotRef.current = failed.snapshot;
        setSnapshot(failed.snapshot);
        isActiveRef.current = true;
        setIsActive(true);
        setIsExpanded(true);
      }
    },
    [actorLabel, cancelAutoCapture, conversationId, ensureConsent]
  );

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const detail = (event as CustomEvent<VoiceModeOpenDetail>).detail;
      if (!detail || detail.conversationId !== conversationId) return;
      void begin();
    };
    window.addEventListener(VOICE_MODE_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(VOICE_MODE_OPEN_EVENT, handleOpen);
  }, [begin, conversationId]);

  const end = useCallback(() => {
    // Disarm before the transition: `end` must not leave a timer that reopens
    // the mic 350 ms after the user pressed "Return to Chat".
    cancelAutoCapture();
    continuousArmedRef.current = false;
    setContinuousArmed(false);
    stopMonitoring();
    if (speechStatus === 'recording' || snapshotRef.current?.state === 'user-speaking') cancelRecording();
    activeTurnRef.current = null;
    clearAudio();
    applyEvent({ type: 'end' });
    isActiveRef.current = false;
    setIsActive(false);
    setIsExpanded(false);
    clearSpeechError();
  }, [applyEvent, cancelAutoCapture, cancelRecording, clearAudio, clearSpeechError, speechStatus, stopMonitoring]);

  const expand = useCallback(() => setIsExpanded(true), []);
  const collapse = useCallback(() => setIsExpanded(false), []);

  /**
   * Escape, with exactly the semantics it already had: interrupt while the
   * assistant is talking, end the session otherwise. It lives on the session
   * rather than the orb so it still works once the composer is the surface -
   * the reflexive panic key must not become a no-op that leaves the mic hot.
   */
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (['thinking', 'acting', 'speaking'].includes(snapshotRef.current?.state ?? '')) {
        void interrupt();
      } else {
        end();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [end, interrupt, isActive]);

  const completeResponse = useCallback(
    (terminalId: string, terminalError = false) => {
      const current = snapshotRef.current;
      const turnId = current?.activeTurnId;
      if (!current || !turnId || !['thinking', 'acting'].includes(current.state)) return;

      const completionKey = `${turnId}:${terminalId}`;
      if (completionKeyRef.current === completionKey) return;
      completionKeyRef.current = completionKey;
      if (terminalError) {
        applyEvent({ type: 'fail', errorCode: 'TURN_FAILED' });
        setSurfaceError('The turn failed. Inspect Chat for the exact error and recovery options.');
        return;
      }

      const text = extractVoiceResponseText('content', responseTextRef.current);
      if (!text) {
        applyEvent({ type: 'fail', errorCode: 'NO_SPEAKABLE_RESPONSE' });
        setSurfaceError('This turn produced a visual or tool-only result. Open Chat to inspect it.');
        return;
      }
      setLastResponse(text);
      const segmentId = newCorrelationId(`voice-segment-${responseMessageIdRef.current ?? terminalId}`);
      const transition = applyEvent({ type: 'response_segment_ready', turnId, segmentId });
      if (!transition || transition.rejected) return;
      void playResponse(turnId, segmentId, text);
    },
    [applyEvent, playResponse]
  );

  useEffect(() => {
    if (!isActive) return;
    return conversation.responseStream.on((message) => {
      if (message.conversation_id !== conversationId || !activeTurnRef.current) return;
      if (message.type === 'content') {
        const chunk =
          typeof message.data === 'string'
            ? message.data
            : message.data && typeof message.data === 'object' && 'content' in message.data
              ? (message.data as { content?: unknown }).content
              : null;
        if (typeof chunk === 'string') {
          responseTextRef.current += chunk;
          responseMessageIdRef.current = message.msg_id || responseMessageIdRef.current;
        }
        return;
      }
      if (message.type === 'error') {
        completeResponse(message.msg_id || newCorrelationId('voice-error'), true);
        return;
      }
      if (message.type === 'finish') {
        completeResponse(message.msg_id || responseMessageIdRef.current || newCorrelationId('voice-finish'));
      }
    });
  }, [completeResponse, conversationId, isActive]);

  useEffect(() => {
    if (!isActive) return;
    return conversation.turnCompleted.on((event) => {
      if (event.sessionId !== conversationId || !isTerminalCompletion(event.status, event.state)) return;
      completeResponse(String(event.lastMessage.id ?? event.lastMessage.createdAt), event.state === 'error');
    });
  }, [completeResponse, conversationId, isActive]);

  useEffect(() => {
    if (!isActive) return;
    const handleSettled = (event: Event) => {
      const detail = (event as CustomEvent<VoiceTurnSettledDetail>).detail;
      if (!detail || detail.conversationId !== conversationId || detail.turnId !== activeTurnRef.current) return;

      /*
       * A deferred turn is not a failure - the words were transcribed fine and
       * are sitting in the draft, waiting for the user to press Send so their
       * staged files go with the sentence they chose.
       *
       * It still has to stop the session. Leaving the mic armed would re-arm
       * 350ms later, hear the next thing said, and defer that too - a loop that
       * silently overwrites the draft it just asked the user to confirm.
       *
       * It rides the error state because that is the only channel the composer
       * renders a sentence through; the copy is written to say plainly that
       * nothing went wrong.
       */
      if (detail.errorCode === 'deferred_to_draft') {
        const count = detail.deferredFileCount ?? 0;
        applyEvent({ type: 'fail', errorCode: 'VOICE_TURN_DEFERRED' });
        setSurfaceError(
          `Draft ready — press send to include your ${count} attachment${count === 1 ? '' : 's'}.`
        );
        return;
      }

      if (!detail.accepted) {
        applyEvent({ type: 'fail', errorCode: detail.errorCode ?? 'VOICE_SEND_FAILED' });
        setSurfaceError('The transcribed turn was not accepted by Chat. It was not retried automatically.');
      }
    };
    window.addEventListener(VOICE_TURN_SETTLED_EVENT, handleSettled);
    return () => window.removeEventListener(VOICE_TURN_SETTLED_EVENT, handleSettled);
  }, [applyEvent, conversationId, isActive]);

  useEffect(() => {
    if (!isActive) return;
    return conversation.confirmation.add.on((confirmation) => {
      if (confirmation.conversation_id !== conversationId) return;
      const current = snapshotRef.current;
      if (!current?.activeTurnId || !['thinking', 'acting', 'speaking'].includes(current.state)) return;
      clearAudio();
      applyEvent({
        type: 'approval_required',
        turnId: current.activeTurnId,
        approvalId: sanitizeCorrelationId(confirmation.id, 'approval'),
      });
    });
  }, [applyEvent, clearAudio, conversationId, isActive]);

  // Kept current every render so the capture timer and the detector callbacks
  // never invoke a stale closure.
  useLayoutEffect(() => {
    beginCaptureRef.current = beginCapture;
    finishCaptureRef.current = finishCapture;
    interruptRef.current = interrupt;
    isActiveRef.current = isActive;
    isMutedRef.current = isMuted;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelAutoCapture();
    };
  }, [cancelAutoCapture]);

  useEffect(() => () => clearAudio(), [clearAudio]);

  useEffect(() => {
    if (!speechErrorCode) return;
    setSurfaceError(`Microphone or transcription failed (${speechErrorCode}). Nothing was sent.`);
  }, [speechErrorCode]);

  /**
   * Navigating to another conversation ends the session.
   *
   * Every conversationId site in this file FILTERS by the id; none of them
   * noticed it changing. The modal orb hid that, because there was no way to
   * navigate while it was up. Once the surface is the composer, the user can
   * switch conversations with a live microphone and a session still holding the
   * old id - and `submitVoiceTurn` would file whatever they said next into the
   * conversation they just left.
   */
  const sessionConversationIdRef = useRef(conversationId);
  useEffect(() => {
    if (sessionConversationIdRef.current === conversationId) return;
    sessionConversationIdRef.current = conversationId;
    if (isActiveRef.current) end();
  }, [conversationId, end]);

  const state = snapshot?.state ?? 'connecting';

  useEffect(() => {
    if (!ACOUSTIC_BARGE_IN_ENABLED || !isActive || state !== 'speaking') return;
    void startMonitoring();
    return () => stopMonitoring();
  }, [isActive, startMonitoring, state, stopMonitoring]);

  const readiness = useMemo(
    () =>
      resolveVoiceSessionReadiness({
        ttsConfig,
        sttConfig: sttConfig && { ...sttConfig, provider: effectiveSttProvider ?? undefined },
        platform: isMacOS() ? 'darwin' : 'other',
        consent,
      }),
    [consent, effectiveSttProvider, sttConfig, ttsConfig]
  );

  const level = useMemo(() => {
    if (speechStatus !== 'recording' || recordingLevels.length === 0) return 0.18;
    return Math.max(0.18, recordingLevels.at(-1) ?? 0.18);
  }, [recordingLevels, speechStatus]);

  return {
    conversationId,
    actorLabel,
    snapshot,
    state,
    isActive,
    isExpanded,
    isMuted,
    continuousArmed,
    endpointingAvailable,
    lastTranscript,
    lastResponse,
    error: surfaceError,
    level,
    ttsConfig,
    sttConfig,
    readiness,
    configReady: Boolean(sttEnabled && ttsProviderReady),
    begin,
    beginCapture,
    finishCapture,
    end,
    interrupt,
    toggleMute,
    expand,
    collapse,
  };
};
