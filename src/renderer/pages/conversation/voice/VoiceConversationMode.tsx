/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { conversation, voiceSynth } from '@/common/adapter/ipcBridge';
import { ConfigStorage } from '@/common/config/storage';
import {
  createVoiceSession,
  transitionVoiceSession,
  type VoiceSessionEffect,
  type VoiceSessionEvent,
  type VoiceSessionSnapshot,
} from '@/common/voice/VoiceSessionMachine';
import { extractVoiceResponseText } from '@/common/voice/voiceResponseText';
import { normalizeTextToSpeechConfig, type TextToSpeechConfig } from '@/common/types/ttsTypes';
import { useSpeechInput } from '@/renderer/hooks/system/useSpeechInput';
import { MessageCircle, Mic, MicOff, Settings2, Square, Volume2, X } from 'lucide-react';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import VoiceModeEntryButton from './VoiceModeEntryButton';
import {
  submitVoiceTurn,
  VOICE_MODE_OPEN_EVENT,
  VOICE_TURN_SETTLED_EVENT,
  type VoiceModeOpenDetail,
  type VoiceTurnSettledDetail,
} from './voiceTurnBridge';
import './voice-conversation-mode.css';

type VoiceConversationModeProps = {
  conversationId: string;
  conversationTitle?: React.ReactNode;
  actorLabel?: string;
};

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

const STATE_COPY: Record<VoiceSessionSnapshot['state'], string> = {
  connecting: 'Connecting',
  listening: 'Tap to speak',
  'user-speaking': 'Listening',
  transcribing: 'Transcribing',
  thinking: 'Thinking',
  acting: 'Working',
  'approval-needed': 'Needs your approval',
  speaking: 'Speaking',
  interrupted: 'Stopping',
  reconnecting: 'Reconnecting',
  error: 'Voice needs attention',
  ended: 'Ended',
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

const VoiceConversationMode: React.FC<VoiceConversationModeProps> = ({
  conversationId,
  conversationTitle,
  actorLabel = 'Wayland',
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [captionsVisible, setCaptionsVisible] = useState(true);
  const [lastTranscript, setLastTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [surfaceError, setSurfaceError] = useState<string | null>(null);
  const [ttsConfig, setTtsConfig] = useState<TextToSpeechConfig | null>(null);
  const [sttEnabled, setSttEnabled] = useState<boolean | null>(null);
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
  const isOpenRef = useRef(false);
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
      if (!mountedRef.current || !isOpenRef.current || isMutedRef.current) return;
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
      setSurfaceError("I did not hear anything. Tap the orb when you are ready to talk.");
    },
    onEndpointingUnavailable: () => {
      setEndpointingAvailable(false);
      setSurfaceError('This device gave no audio signal to listen to. Tap the orb when you are done speaking.');
    },
    onBargeIn: () => {
      void interruptRef.current();
    },
  });

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

  const openMode = useCallback(async () => {
    try {
      const [storedStt, storedTts] = await Promise.all([
        ConfigStorage.get('tools.speechToText'),
        ConfigStorage.get('tools.textToSpeech'),
      ]);
      const nextTts = normalizeTextToSpeechConfig(storedTts ?? undefined);
      setSttEnabled(Boolean(storedStt?.enabled));
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
      setIsOpen(true);
    } catch {
      setSttEnabled(false);
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
      setIsOpen(true);
    }
  }, [actorLabel, cancelAutoCapture, conversationId]);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const detail = (event as CustomEvent<VoiceModeOpenDetail>).detail;
      if (!detail || detail.conversationId !== conversationId) return;
      void openMode();
    };
    window.addEventListener(VOICE_MODE_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(VOICE_MODE_OPEN_EVENT, handleOpen);
  }, [conversationId, openMode]);

  const closeMode = useCallback(() => {
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
    setIsOpen(false);
    clearSpeechError();
  }, [applyEvent, cancelAutoCapture, cancelRecording, clearAudio, clearSpeechError, speechStatus, stopMonitoring]);

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
    if (!isOpen) return;
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
  }, [completeResponse, conversationId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    return conversation.turnCompleted.on((event) => {
      if (event.sessionId !== conversationId || !isTerminalCompletion(event.status, event.state)) return;
      completeResponse(String(event.lastMessage.id ?? event.lastMessage.createdAt), event.state === 'error');
    });
  }, [completeResponse, conversationId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
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
  }, [applyEvent, conversationId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
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
  }, [applyEvent, clearAudio, conversationId, isOpen]);

  // Kept current every render so the capture timer and the detector callbacks
  // never invoke a stale closure.
  useLayoutEffect(() => {
    beginCaptureRef.current = beginCapture;
    finishCaptureRef.current = finishCapture;
    interruptRef.current = interrupt;
    isOpenRef.current = isOpen;
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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      // Escape is the natural "stop!" key. Interrupt for the whole running turn,
      // not only while audio happens to be playing; it used to destroy the
      // session outright during thinking/acting.
      if (['thinking', 'acting', 'speaking'].includes(snapshotRef.current?.state ?? '')) {
        void interrupt();
      } else {
        closeMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeMode, interrupt, isOpen]);

  const title = typeof conversationTitle === 'string' ? conversationTitle : 'Current conversation';
  const state = snapshot?.state ?? 'connecting';

  useEffect(() => {
    if (!ACOUSTIC_BARGE_IN_ENABLED || !isOpen || state !== 'speaking') return;
    void startMonitoring();
    return () => stopMonitoring();
  }, [isOpen, startMonitoring, state, stopMonitoring]);
  const orbLevel = useMemo(() => {
    if (speechStatus !== 'recording' || recordingLevels.length === 0) return 0.18;
    return Math.max(0.18, recordingLevels.at(-1) ?? 0.18);
  }, [recordingLevels, speechStatus]);
  const configReady = Boolean(sttEnabled && ttsProviderReady);

  const overlay = isOpen ? (
    <div className='voice-mode' role='dialog' aria-modal='true' aria-label='Wayland voice conversation'>
      <div className='voice-mode__topbar'>
        <div className='voice-mode__identity'>
          <span className='voice-mode__eyebrow'>VOICE · SAME CHAT</span>
          <strong>{title}</strong>
          <span>{actorLabel} · Permission: Ask</span>
        </div>
        <div className='voice-mode__top-actions'>
          <button type='button' onClick={() => navigate('/settings/voice')} aria-label='Open Voice settings'>
            <Settings2 size={18} />
          </button>
          <button type='button' onClick={closeMode} aria-label='Return to Chat'>
            <MessageCircle size={18} />
            <span>Chat</span>
          </button>
          <button type='button' onClick={closeMode} aria-label='Close Voice mode'>
            <X size={18} />
          </button>
        </div>
      </div>

      <main className='voice-mode__stage'>
        <div className='voice-mode__ambient voice-mode__ambient--one' />
        <div className='voice-mode__ambient voice-mode__ambient--two' />
        <button
          type='button'
          className={`voice-mode__orb voice-mode__orb--${state}`}
          style={{ '--voice-level': orbLevel } as React.CSSProperties}
          onClick={() => {
            if (state === 'listening') void beginCapture();
            else if (state === 'user-speaking') finishCapture();
            else if (['thinking', 'acting', 'speaking'].includes(state)) void interrupt();
          }}
          aria-label={
            state === 'listening'
              ? 'Start speaking'
              : state === 'user-speaking'
                ? 'Stop and send voice turn'
                : ['thinking', 'acting', 'speaking'].includes(state)
                  ? 'Interrupt'
                  : STATE_COPY[state]
          }
        >
          <span className='voice-mode__orb-core' />
          <span className='voice-mode__orb-ring' />
        </button>
        <div className='voice-mode__state' role='status' aria-live='polite'>
          <strong>{state === 'listening' && continuousArmed ? 'Listening for you' : STATE_COPY[state]}</strong>
          <span>
            {state === 'listening' &&
              (continuousArmed
                ? endpointingAvailable
                  ? 'Speak whenever you are ready — the mic reopens itself after every answer'
                  : 'The mic reopens after every answer — tap the orb when you are done speaking'
                : 'One tap starts the conversation; after that it stays open')}
            {state === 'user-speaking' &&
              (endpointingAvailable
                ? 'Pause when you are done, or tap to send now'
                : 'Tap the orb to send — nothing is listening for you to pause')}
            {state === 'thinking' && 'Your turn is running through the same chat and tools'}
            {state === 'acting' && 'Wayland is working; tap the orb to interrupt'}
            {state === 'speaking' && 'Tap the orb or press Escape to interrupt'}
            {state === 'approval-needed' && 'Return to Chat to review the exact action. Voice cannot approve it.'}
          </span>
        </div>

        {!configReady && (
          <div className='voice-mode__notice voice-mode__notice--setup'>
            <strong>Voice setup is incomplete</strong>
            <span>
              {!sttEnabled ? 'Speech input is off. ' : ''}
              {!ttsConfig?.enabled ? 'Speech output is off. ' : ''}
              {ttsConfig?.provider === 'kokoro-local'
                ? 'Kokoro is not yet backed by a verified production runtime. Select System Voice or OpenAI Speech. '
                : ''}
              Enable both to run a complete turn-based voice conversation.
            </span>
            <button type='button' onClick={() => navigate('/settings/voice')}>
              Open Voice settings
            </button>
          </div>
        )}

        {surfaceError && (
          <div className='voice-mode__notice voice-mode__notice--error' role='alert'>
            <strong>Nothing hidden</strong>
            <span>{surfaceError}</span>
          </div>
        )}

        {captionsVisible && (lastTranscript || lastResponse) && (
          <div className='voice-mode__captions' aria-label='Voice transcript'>
            {lastTranscript && (
              <p>
                <span>You</span>
                {lastTranscript}
              </p>
            )}
            {lastResponse && (
              <p>
                <span>{actorLabel}</span>
                {lastResponse}
              </p>
            )}
          </div>
        )}
      </main>

      <div className='voice-mode__controls'>
        <button type='button' className={isMuted ? 'is-active' : ''} onClick={toggleMute} aria-pressed={isMuted}>
          {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          <span>{isMuted ? 'Muted' : 'Mic on'}</span>
        </button>
        <button type='button' onClick={() => setCaptionsVisible((value) => !value)} aria-pressed={captionsVisible}>
          <span className='voice-mode__cc'>CC</span>
          <span>Captions</span>
        </button>
        <button
          type='button'
          disabled={!['thinking', 'acting', 'speaking'].includes(state)}
          onClick={() => void interrupt()}
        >
          <Square size={16} />
          <span>Interrupt</span>
        </button>
        <button type='button' onClick={() => navigate('/settings/voice')}>
          <Volume2 size={18} />
          <span>{ttsConfig?.voice || 'Voice'}</span>
        </button>
        <button type='button' className='voice-mode__end' onClick={closeMode}>
          <X size={18} />
          <span>End</span>
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <VoiceModeEntryButton conversationId={conversationId} placement='header' />
      {overlay && typeof document !== 'undefined' ? createPortal(overlay, document.body) : null}
    </>
  );
};

export default VoiceConversationMode;
