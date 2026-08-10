/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { conversation, voiceSynth } from '@/common/adapter/ipcBridge';
import { ConfigStorage } from '@/common/config/storage';
import type { SpeechToTextConfig } from '@/common/types/speech';
import { normalizeTextToSpeechConfig, type TextToSpeechConfig } from '@/common/types/ttsTypes';
import {
  createVoiceSession,
  transitionVoiceSession,
  type VoiceSessionEffect,
  type VoiceSessionEvent,
  type VoiceSessionSnapshot,
} from '@/common/voice/VoiceSessionMachine';
import { extractVoiceResponseText } from '@/common/voice/voiceResponseText';
import { useSpeechInput } from '@/renderer/hooks/system/useSpeechInput';
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

const isTerminalCompletion = (status: string, state: string): boolean =>
  status === 'finished' || state === 'ai_waiting_input' || state === 'stopped' || state === 'error';

export type VoiceConversationSessionOptions = {
  conversationId: string;
  actorLabel?: string;
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
  configReady: boolean;
  begin: () => Promise<void>;
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
    if (!sttEnabled) {
      setSurfaceError('Speech input is off. Enable it in Voice settings before starting a voice turn.');
      return;
    }
    if (!ttsProviderReady) {
      setSurfaceError('Speech output is off. Enable it in Voice settings before starting a complete voice turn.');
      return;
    }
    if (isMuted) {
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
  }, [applyEvent, availability, isMuted, startRecording, sttEnabled, ttsProviderReady]);

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

  const begin = useCallback(async () => {
    try {
      const [storedStt, storedTts] = await Promise.all([
        ConfigStorage.get('tools.speechToText'),
        ConfigStorage.get('tools.textToSpeech'),
      ]);
      const nextTts = normalizeTextToSpeechConfig(storedTts ?? undefined);
      setSttConfig(storedStt ?? null);
      setTtsConfig(nextTts);
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
      setIsActive(true);
      setIsExpanded(true);
    } catch {
      setSttConfig(null);
      setTtsConfig(null);
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
      setIsActive(true);
      setIsExpanded(true);
    }
  }, [actorLabel, cancelAutoCapture, conversationId]);

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
