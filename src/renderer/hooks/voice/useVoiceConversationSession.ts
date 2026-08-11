/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { application, conversation, modelRegistry, voiceSynth } from '@/common/adapter/ipcBridge';
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
import { normalizeSpeechToTextConfig } from '@/common/voice/speechToTextConfig';
import { selectVoiceGreeting } from '@/common/voice/voiceGreeting';
import { resolveEffectiveSttProvider } from '@/common/voice/sttProviderResolution';
import {
  resolveVoiceLeg,
  resolveVoiceSessionReadiness,
  type ConnectedVoiceCredentials,
  type VoiceLeg,
  type VoiceReadinessInput,
  type VoiceReadinessReason,
  type VoiceSessionReadiness,
} from '@/common/voice/voiceReadiness';
import { isLocalWhisperReady, warmLocalWhisper } from '@/renderer/services/voice/localWhisper';
import {
  extractVoiceResponseText,
  MAX_SPOKEN_CHARACTERS,
  takeSpeakableSentences,
} from '@/common/voice/voiceResponseText';
import { resolveVoiceTurnTerminal } from '@/common/voice/voiceTurnTerminal';
import { createVoiceSpeechQueue, type VoiceSpeechQueue } from '@/renderer/services/voice/voiceSpeechQueue';
import { useSpeechInput } from '@/renderer/hooks/system/useSpeechInput';
import { useLatestRef } from '@/renderer/hooks/ui/useLatestRef';
import { rendererPlatform } from '@/renderer/utils/platform';
import {
  consumeArmedVoiceMode,
  submitVoiceTurn,
  VOICE_MODE_OPEN_EVENT,
  VOICE_TURN_SETTLED_EVENT,
  type VoiceModeOpenDetail,
  type VoiceTurnSettledDetail,
} from '@/renderer/pages/conversation/voice/voiceTurnBridge';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
 * How the opening greeting ended.
 *
 * `skipped` and `blocked` are deliberately different. Skipped means there was
 * never anything to speak through - no Web Audio in this environment at all -
 * and entry proceeds byte-for-byte as it did before the greeting existed.
 * Blocked means synthesis or the audio clock refused, which the user has to be
 * TOLD about: a suspended AudioContext produces silence and no error, and
 * silence that looks like working is the single failure mode this whole surface
 * exists to remove.
 */
type VoiceGreetingOutcome =
  | { kind: 'spoken' }
  | { kind: 'stopped' }
  | { kind: 'skipped' }
  | { kind: 'blocked'; message: string };

/**
 * The name to greet, from the same two sources the new-chat greeting uses: the
 * user's explicit override first, the OS account name second.
 *
 * Every failure degrades to '', which selects the name-less family rather than
 * a greeting with a hole in it. The `try` wraps the property access as well as
 * the call because a surface without the application bridge (WebUI, tests) has
 * no `application` object to reach `systemInfo` on, and that is a TypeError
 * rather than a rejected promise.
 */
const resolveGreetingName = async (): Promise<string> => {
  const configured = await ConfigStorage.get('user.displayName').catch((): undefined => undefined);
  if (configured?.trim()) return configured;
  try {
    const info = await application.systemInfo.invoke();
    return info?.userName ?? '';
  } catch {
    return '';
  }
};

/**
 * Acoustic barge-in kill switch. The detector itself is gated on the browser
 * confirming echo cancellation is active and calibrates against the measured
 * speaker bleed, but neither guard has been validated against real hardware.
 * Set to `false` to fall back to Escape/tap interruption only.
 */
const ACOUSTIC_BARGE_IN_ENABLED: boolean = true;

/**
 * Sentence-chunked synthesis: speak each sentence as the model writes it rather
 * than waiting for the whole answer. Measured time-to-first-audio 5056 ms down
 * to 953 ms.
 *
 * Its own switch, and the single-clip `HTMLAudioElement` path below is retained
 * rather than deleted, because that is the only rollback that is genuinely
 * byte-for-byte today's behaviour. Delete the retained path once a packaged
 * build has passed the seam check on real speakers and one release has shipped
 * with this on.
 */
const VOICE_STREAM_SENTENCES_ENABLED: boolean = true;

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
  'tts-needs-consent': (r) => `Speaking would send the reply to ${r.ttsProvider}, which needs your agreement first.`,
  'stt-disabled': () => 'Speech input is off. Turn it on in Voice settings so Wayland can hear you.',
  'stt-unavailable': (r) =>
    `${r.sttProvider} has no key yet, so nothing can be transcribed. Add one in Voice settings.`,
  'stt-needs-consent': (r) => `Listening would send your audio to ${r.sttProvider}, which needs your agreement first.`,
  'audio-blocked': () => 'This window is not allowed to play audio yet. Tap the voice button again to start it.',
  'local-engine-warming': () => 'The on-device voice model is still loading. It will be ready in a few seconds.',
  'no-model-connected': () =>
    'No model is connected yet, so nothing can answer you. Connect one in Models and Providers, then start a voice turn.',
};

/**
 * A refusal the user can see twice. `seq` is monotonic per session and exists
 * only to give the value identity - nothing reads it but React's own equality.
 */
export type VoiceSurfaceError = { message: string; seq: number };

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
  /**
   * Is anything connected that could answer a voice turn?
   *
   * `undefined` means "not known here" and never blocks. Only an explicit
   * `false` resolves voice entry to `needsSetup / no-model-connected`, which is
   * the state where the old resolver reported ready, greeted, opened the
   * microphone, transcribed - and then nothing answered.
   *
   * Injected rather than derived, because the predicate that decides this
   * (`noModelConfigured` in `useGuidSend`) depends on the selected agent, the
   * preset agent info and the Google-auth path. Recomputing it here would be a
   * second copy of a rule that has already broken once by diverging.
   */
  modelConnected?: boolean;
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
  /**
   * The greeting Wayland is saying right now, or null. It is the on-screen
   * state for that moment: the machine is in `listening` throughout, so without
   * this every surface would caption an assistant that is talking with "Tap to
   * speak".
   */
  greetingText: string | null;
  error: VoiceSurfaceError | null;
  /** Microphone level, 0-1, for whatever wants to draw it. */
  level: number;
  ttsConfig: TextToSpeechConfig | null;
  sttConfig: SpeechToTextConfig | null;
  /** Why voice cannot run, named, so a surface can offer the one tap that fixes it. */
  readiness: VoiceSessionReadiness;
  /** The listening leg on its own. Two directions, resolved separately. */
  speechInLeg: VoiceLeg;
  /** The speaking leg on its own. Flux Voice can never appear here. */
  speechOutLeg: VoiceLeg;
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
  modelConnected: modelConnectedOption,
}: VoiceConversationSessionOptions): VoiceConversationSession => {
  const { t } = useTranslation();
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
  /**
   * The refusal shown to the user, WITH IDENTITY.
   *
   * It used to be a plain string, and that is a real bug, not a style point:
   * tap-to-speak refusing twice for the same reason sets a byte-identical
   * string, `Object.is` says nothing changed, and React never repaints. The
   * user taps, sees the message appear, taps again expecting a retry, and gets
   * no acknowledgement of the second tap at all. A monotonic `seq` makes every
   * refusal a distinct object, so two taps produce two renders even when the
   * sentence is the same.
   */
  const [surfaceError, setSurfaceErrorState] = useState<VoiceSurfaceError | null>(null);
  const surfaceErrorSeqRef = useRef(0);
  const setSurfaceError = useCallback((message: string | null) => {
    if (message === null) {
      setSurfaceErrorState(null);
      return;
    }
    surfaceErrorSeqRef.current += 1;
    setSurfaceErrorState({ message, seq: surfaceErrorSeqRef.current });
  }, []);
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
  /**
   * What the shared provider registry says is connected. Readiness needs it:
   * main resolves both OpenAI and Flux Voice credentials from the registry when
   * the STT config carries none, so judging the listening leg on the STT config
   * alone declares `stt-unavailable` for a provider that would have worked.
   */
  const [connectedCredentials, setConnectedCredentials] = useState<ConnectedVoiceCredentials>({});
  /**
   * The same credentials as a ref, because three of the four readiness call
   * sites in this hook run inside callbacks created before the registry read
   * lands and were therefore STRUCTURALLY BLIND to a connected Flux credential:
   * only the render-time memo ever passed `connectedCredentials`, so
   * `beginCapture`, `blockedAudioMessage` and the greeting gate all judged a
   * connected user as `stt-unavailable`.
   *
   * Fixed by construction rather than at four sites: nothing below builds a
   * readiness input by hand, they all go through `readinessInput()`. A fifth
   * call site cannot reintroduce the divergence because there is no longer a
   * way to spell it.
   */
  const connectedCredentialsRef = useRef<ConnectedVoiceCredentials>({});
  /**
   * `isLocalWhisperReady()` as of the last poll. The bundled model costs a
   * one-time 5-10 second warmup and the ladder now makes it the default, so
   * this is what keeps that latency visible as `warming` instead of silent.
   */
  const [localSttReady, setLocalSttReady] = useState(() => isLocalWhisperReady());
  const localSttReadyRef = useRef(localSttReady);
  /** Whether anything is connected that could answer a voice turn. */
  const modelConnected = modelConnectedOption;
  const modelConnectedRef = useLatestRef(modelConnected);
  const [snapshot, setSnapshot] = useState<VoiceSessionSnapshot | null>(null);
  const snapshotRef = useRef<VoiceSessionSnapshot | null>(null);
  const activeTurnRef = useRef<string | null>(null);
  /**
   * The turn whose terminal event has already run.
   *
   * Two events end a turn - `finish` on the response stream and
   * `turnCompleted` - and this is the only thing that stops the second one.
   * It used to be keyed on `${turnId}:${terminalId}`, which worked by accident:
   * the first terminal moved the machine to `speaking` and the state guard
   * rejected the second. The terminal handler now accepts `speaking`, so that
   * backstop is gone, and the key has to be the turn - the two paths do not
   * agree on a message id.
   */
  const completedTurnRef = useRef<string | null>(null);
  const responseTextRef = useRef('');
  /** How much of `responseTextRef` has already been handed to speech. */
  const spokenLengthRef = useRef(0);
  /**
   * Normalized characters spoken so far this turn.
   *
   * `MAX_SPOKEN_CHARACTERS` is a cap on a TURN, and applied per chunk it means
   * nothing - no individual sentence comes anywhere near 4000 characters, so a
   * per-chunk cap would let an unbounded answer be read out in full.
   */
  const spokenCharsRef = useRef(0);
  const responseMessageIdRef = useRef<string | null>(null);
  /**
   * The live sentence queue, and the turn it belongs to. Held as a ref rather
   * than state because `clearAudio` has to reach it from event handlers that
   * are a render behind.
   */
  const speechQueueRef = useRef<VoiceSpeechQueue | null>(null);
  const speechQueueTurnRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [audioContextState, setAudioContextState] = useState<AudioContextState | undefined>(undefined);
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

  /**
   * Create and resume the AudioContext inside the entry gesture.
   *
   * There is no `autoplay-policy` switch anywhere in main, so Chromium's
   * gesture requirement applies. A blocked `HTMLAudioElement` at least rejects
   * and surfaces `TTS_PLAYBACK_FAILED`; a suspended AudioContext gives no error
   * at all - `start(when)` schedules against a clock that is not advancing,
   * nothing sounds, `onended` never fires, and the session never re-arms. That
   * is symptom-for-symptom the bug this work exists to fix, so the context is
   * created and resumed in the one place a user gesture is guaranteed: the tap
   * that enters the session.
   *
   * An environment with no Web Audio at all (jsdom, and the precedent at
   * `useSpeechInput.ts:686-695`) leaves the ref null. There is no suspended
   * clock to schedule against there, so it is not a blocker.
   */
  const ensureAudioContext = useCallback(async () => {
    const AudioContextCtor =
      typeof AudioContext !== 'undefined'
        ? AudioContext
        : typeof window !== 'undefined'
          ? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
          : undefined;
    if (!AudioContextCtor) return;
    try {
      const context = audioContextRef.current ?? new AudioContextCtor();
      audioContextRef.current = context;
      if (context.state !== 'running') await context.resume();
      setAudioContextState(context.state);
    } catch {
      // A context that cannot even be constructed is reported the same way a
      // suspended one is: named, at the point of scheduling.
      setAudioContextState(audioContextRef.current?.state);
    }
  }, []);

  /**
   * The greeting's own queue, and the promise `begin` is waiting on.
   *
   * A SECOND queue rather than a branch inside the turn queue, because the two
   * differ in the one thing that queue is built around: `onSegmentStart` and
   * `onCompleted` exist to drive `response_segment_ready` /
   * `playback_completed` for a TURN, and the greeting has no turn. Sharing the
   * instance would mean either inventing a fake turn id for the machine to
   * reject, or making the turn path tolerate a null one. The epoch, the
   * `stopAll`, and the refusal to schedule against a stopped clock are the parts
   * that matter here, and they are the queue's, not the turn's.
   */
  const greetingQueueRef = useRef<VoiceSpeechQueue | null>(null);
  const greetingSettleRef = useRef<((outcome: VoiceGreetingOutcome) => void) | null>(null);
  const [greetingText, setGreetingText] = useState<string | null>(null);

  const settleGreeting = useCallback((outcome: VoiceGreetingOutcome) => {
    greetingQueueRef.current = null;
    setGreetingText(null);
    const settle = greetingSettleRef.current;
    greetingSettleRef.current = null;
    settle?.(outcome);
  }, []);

  /**
   * Stop the greeting mid-sentence. Returns whether there was one to stop, so
   * callers can tell "I interrupted the greeting" from "there was nothing to
   * interrupt" without reading a ref of their own.
   *
   * `stopAll` bumps the queue's epoch, which is what stops `onCompleted` from
   * firing afterwards - otherwise a barge-in would still hand the microphone
   * over a second time when the abandoned clip's own timer came due.
   */
  const stopGreeting = useCallback((): boolean => {
    const queue = greetingQueueRef.current;
    if (!queue) return false;
    queue.stopAll();
    settleGreeting({ kind: 'stopped' });
    return true;
  }, [settleGreeting]);

  /**
   * Stop everything that is making, or about to make, sound.
   *
   * Both halves of the interrupt live here, because there is no cancel anywhere
   * in the synthesis path: the queue's epoch stops it ISSUING work and discards
   * results already in flight, and `stopAll()` stops the one or two
   * `AudioBufferSourceNode`s gapless scheduling always has queued ahead. The
   * epoch alone leaves the assistant talking, which is the one thing barge-in
   * exists to prevent.
   *
   * Every teardown path in this file routes through here - playback entry, the
   * two playback error paths, the play() rejection, `interrupt`, `end`, the
   * confirmation handler, and unmount - so wiring the queue in at this single
   * point is what covers all eight of them.
   */
  const clearAudio = useCallback(() => {
    // The greeting is sound too. Every teardown path routes through here, and
    // one that left a greeting playing after `end()` would keep talking at
    // somebody who just pressed the stop glyph.
    stopGreeting();
    speechQueueRef.current?.stopAll();
    speechQueueRef.current = null;
    speechQueueTurnRef.current = null;
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
  }, [stopGreeting]);

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
      spokenLengthRef.current = 0;
      spokenCharsRef.current = 0;
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
    errorMessage: speechErrorMessage,
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
  const ttsProviderReady = Boolean(ttsConfig?.enabled);

  /**
   * THE one way to ask "can voice work right now" from inside a callback.
   *
   * Every field is read from a ref, so this is correct in the tick it is called
   * rather than a render behind, and - the point of the whole helper - no caller
   * can omit a field. The three callback call sites used to build this object by
   * hand and all three silently dropped `connectedCredentials`.
   */
  const readinessInput = useCallback(
    (audioContextState?: AudioContextState): VoiceReadinessInput => ({
      ttsConfig: ttsConfigRef.current,
      sttConfig: sttConfigRef.current && { ...sttConfigRef.current, provider: sttProviderRef.current ?? undefined },
      platform: rendererPlatform(),
      consent: consentRef.current,
      connectedCredentials: connectedCredentialsRef.current,
      localSttReady: localSttReadyRef.current,
      modelConnected: modelConnectedRef.current,
      audioContextState,
    }),
    []
  );

  const beginCapture = useCallback(async () => {
    if (!snapshotRef.current || snapshotRef.current.state !== 'listening') return;
    /**
     * Opening the microphone means Wayland stops talking.
     *
     * The greeting plays while the machine is in `listening`, so the orb's tap
     * target and Escape both land here rather than on `interrupt`. Without this
     * the greeting would go on sounding into an open microphone, and echo
     * cancellation is not a reason to let it.
     */
    stopGreeting();
    /**
     * Refuse before the microphone opens, and say which thing is wrong.
     *
     * The old pair of ad-hoc booleans could not describe the platform this runs
     * on. `say` exists only on macOS, so on Windows and Linux a default config
     * read as ready on `enabled` alone, and
     * the failure landed mid-turn as TTS_SYSTEM_NATIVE_UNAVAILABLE. The user
     * talks, waits, and only then learns that speech output was never possible.
     * The reason is what makes the refusal actionable.
     */
    const readinessNow = resolveVoiceSessionReadiness(readinessInput());
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
  }, [applyEvent, availability, startRecording, stopGreeting]);

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

  /** The named reason a context that is not running gives the user. */
  const blockedAudioMessage = useCallback((audioContextState: AudioContextState): string => {
    const blocked = resolveVoiceSessionReadiness(readinessInput(audioContextState));
    return CAPTURE_BLOCKED_COPY[blocked.reason](blocked);
  }, [readinessInput]);

  /** Every way the speech pipeline can fail, said by name rather than in silence. */
  const failSpeech = useCallback(
    (errorCode: string) => {
      applyEvent({ type: 'fail', errorCode });
      if (errorCode === 'TTS_AUDIO_CONTEXT_BLOCKED') {
        const state = audioContextRef.current?.state;
        if (state) setAudioContextState(state);
        setSurfaceError(blockedAudioMessage(state ?? 'suspended'));
        return;
      }
      setSurfaceError(`Speech output is unavailable (${errorCode}). The complete answer is still in Chat.`);
    },
    [applyEvent, blockedAudioMessage]
  );

  /**
   * A chunk has started sounding, so it becomes THE segment.
   *
   * `activeSegmentId` is single-valued and `playback_started` is rejected with
   * `segment_mismatch` against anything else, which is why both events are
   * emitted here, together, at the start of the chunk - rather than when the
   * chunk was scheduled, since two chunks are always scheduled ahead.
   */
  const announceSegment = useCallback(
    (turnId: string, index: number): boolean => {
      const segmentId = newCorrelationId(`voice-chunk-${index}`);
      const ready = applyEvent({ type: 'response_segment_ready', turnId, segmentId });
      if (!ready || ready.rejected) return false;
      const started = applyEvent({ type: 'playback_started', turnId, segmentId });
      return Boolean(started && !started.rejected);
    },
    [applyEvent]
  );

  const ensureSpeechQueue = useCallback(
    (turnId: string, context: AudioContext): VoiceSpeechQueue => {
      if (speechQueueRef.current && speechQueueTurnRef.current === turnId) return speechQueueRef.current;
      speechQueueRef.current?.stopAll();
      const queue = createVoiceSpeechQueue({
        context,
        speak: (text) => voiceSynth.speak.invoke({ text }),
        onSegmentStart: (index) => announceSegment(turnId, index),
        /**
         * The LAST chunk owns this. `playback_completed` unconditionally
         * returns to `listening`, clears the turn, and emits `start_capture`,
         * so per chunk it reopens the microphone over the assistant's own voice
         * halfway through the answer.
         */
        onCompleted: () => {
          const current = snapshotRef.current;
          if (!current?.activeTurnId || !current.activeSegmentId) return;
          applyEvent({
            type: 'playback_completed',
            turnId: current.activeTurnId,
            segmentId: current.activeSegmentId,
          });
        },
        onFailed: failSpeech,
      });
      speechQueueRef.current = queue;
      speechQueueTurnRef.current = turnId;
      return queue;
    },
    [announceSegment, applyEvent, failSpeech]
  );

  /**
   * Hand every complete sentence the model has written to the queue.
   *
   * Driven from the response stream, where the chunks are deltas. The splitter
   * returns RAW slices, so the marker advances by the raw length of every slice
   * taken - including one that normalizes away to nothing - and the tail the
   * turn-terminal handler computes from that marker stays exact.
   */
  const pumpSpeakableSentences = useCallback(() => {
    if (!VOICE_STREAM_SENTENCES_ENABLED) return;
    const context = audioContextRef.current;
    // No Web Audio at all means there is no scheduler to be gapless on. The
    // retained single-clip path speaks the whole answer from the terminal
    // handler instead; there is no suspended clock to schedule against here.
    if (!context) return;
    const turnId = snapshotRef.current?.activeTurnId;
    if (!turnId) return;
    const { sentences } = takeSpeakableSentences(responseTextRef.current.slice(spokenLengthRef.current));
    if (sentences.length === 0) return;
    const queue = ensureSpeechQueue(turnId, context);
    for (const raw of sentences) {
      spokenLengthRef.current += raw.length;
      const spoken = extractVoiceResponseText('content', raw);
      if (!spoken || spokenCharsRef.current >= MAX_SPOKEN_CHARACTERS) continue;
      spokenCharsRef.current += spoken.length;
      queue.enqueue(spoken);
    }
  }, [ensureSpeechQueue]);

  /**
   * The single-clip path: one piece of text becomes one spoken segment.
   *
   * Nothing is scheduled against a context that is not running. A suspended
   * context fails here, by name, BEFORE `response_segment_ready` moves the
   * machine to `speaking` - otherwise the session sits in `speaking` waiting
   * for a `playback_completed` that a stopped clock will never produce, which
   * is silence with no error, the worst of the two failure modes.
   */
  const speakSegment = useCallback(
    (turnId: string, terminalId: string, text: string): boolean => {
      const context = audioContextRef.current;
      if (context && context.state !== 'running') {
        setAudioContextState(context.state);
        applyEvent({ type: 'fail', errorCode: 'TTS_AUDIO_CONTEXT_BLOCKED' });
        setSurfaceError(blockedAudioMessage(context.state));
        return false;
      }

      /**
       * The tail of an answer that is already being chunked belongs to the
       * queue playing it, not to a second independent clip. Starting one here
       * would talk over the chunks, and its `clearAudio()` would stop them
       * mid-word.
       */
      const queue = speechQueueRef.current;
      if (queue && speechQueueTurnRef.current === turnId) {
        spokenLengthRef.current = responseTextRef.current.length;
        if (spokenCharsRef.current < MAX_SPOKEN_CHARACTERS) {
          spokenCharsRef.current += text.length;
          queue.enqueue(text);
        }
        queue.seal();
        return true;
      }

      const segmentId = newCorrelationId(`voice-segment-${responseMessageIdRef.current ?? terminalId}`);
      const transition = applyEvent({ type: 'response_segment_ready', turnId, segmentId });
      if (!transition || transition.rejected) return false;
      spokenLengthRef.current = responseTextRef.current.length;
      void playResponse(turnId, segmentId, text);
      return true;
    },
    [applyEvent, blockedAudioMessage, playResponse]
  );

  /**
   * Say hello, once, at the top of a session.
   *
   * Only ever called on a path that has already established voice can actually
   * work - a greeting into a session with no transcriber would be a machine
   * talking to itself, and the honest refusal it replaced is the more useful
   * thing to show. It resolves rather than throws, because `begin` has to hand
   * the microphone over on EVERY outcome including the ones that made no sound.
   */
  const speakGreeting = useCallback(async (): Promise<VoiceGreetingOutcome> => {
    const context = audioContextRef.current;
    // No Web Audio here at all, so there is no scheduler to speak through and
    // no suspended clock to be blocked by either. Entry proceeds exactly as it
    // did before the greeting existed.
    if (!context) return { kind: 'skipped' };

    const selection = selectVoiceGreeting({ displayName: await resolveGreetingName() });
    const text = t(selection.key, selection.name ? { name: selection.name } : {}).trim();
    // i18next hands back the key itself when nothing resolves it. Synthesizing
    // that would read a dotted key path out loud.
    if (!text || text === selection.key) return { kind: 'skipped' };

    setGreetingText(text);
    return new Promise<VoiceGreetingOutcome>((resolve) => {
      greetingSettleRef.current = resolve;
      const queue = createVoiceSpeechQueue({
        context,
        speak: (segment) => voiceSynth.speak.invoke({ text: segment }),
        // The greeting is not a turn. There is no `activeTurnId` to correlate
        // and no segment for the machine to own, so nothing is announced and
        // nothing can be rejected.
        onSegmentStart: () => true,
        onCompleted: () => settleGreeting({ kind: 'spoken' }),
        onFailed: (errorCode) =>
          settleGreeting({
            kind: 'blocked',
            message:
              errorCode === 'TTS_AUDIO_CONTEXT_BLOCKED'
                ? blockedAudioMessage(context.state)
                : `Wayland could not say hello (${errorCode}). The microphone is open anyway.`,
          }),
      });
      greetingQueueRef.current = queue;
      queue.enqueue(text);
      // One sentence, and no more is coming - so this clip owns `onCompleted`.
      queue.seal();
    });
  }, [blockedAudioMessage, settleGreeting, t]);

  const interrupt = useCallback(async () => {
    /**
     * Barge-in over the greeting.
     *
     * The greeting plays while the machine is in `listening`, which `barge_in`
     * refuses, and there is no backend run to cancel - so routing it through
     * the turn path below would reject the transition and leave Wayland
     * talking. Stopping the queue and opening the microphone is the whole of
     * what "talk over it" means here.
     */
    if (stopGreeting()) {
      await beginCaptureRef.current();
      return;
    }
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
  }, [applyEvent, clearAudio, conversationId, stopGreeting]);

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
      /**
       * The gesture. This runs in the entry button's own click handler, which
       * is the only moment Chromium is guaranteed to let an AudioContext start,
       * and it runs before the first `await` so the activation is still fresh.
       */
      await ensureAudioContext();
      try {
        const [rawStoredStt, storedTts] = await Promise.all([
          ConfigStorage.get('tools.speechToText'),
          ConfigStorage.get('tools.textToSpeech'),
        ]);
        // The platform picks the DEFAULT synthesizer. Without it, an unopened
        // Windows profile entered the session on the macOS provider and could
        // never make a sound.
        const nextTts = normalizeTextToSpeechConfig(storedTts ?? undefined, rendererPlatform());
        /**
         * Normalize ONCE, here, and never touch the raw value again.
         *
         * `normalizeTextToSpeechConfig` was applied to the speaking side on the
         * line above and its speech-in sibling was simply missing, so the bytes
         * off disk went into `sttConfigRef` and out through `readinessInput()`
         * unchanged. On a real upgraded profile those bytes are
         * `{enabled:false, provider:'openai'}` with no `origin`, which is the
         * pre-origin factory default rather than anything the user chose - and
         * read raw it refuses the session with `stt-disabled`, on exactly the
         * installs this lane exists to unblock.
         */
        const storedStt = normalizeSpeechToTextConfig(rawStoredStt);

        /**
         * Which transcriber will actually receive the audio, which is not always
         * the one stored: main seeds Flux Voice when Flux is connected and no
         * engine was ever chosen. Asking about the stored provider would prompt
         * for a disclosure that unblocks nothing - the same defect the settings
         * panel had. Registry failure degrades to the stored provider rather than
         * blocking entry.
         */
        let sttProvider: SpeechToTextProvider = 'whisper-local';
        /**
         * The ladder decides whether the stored provider is even in the path.
         *
         * A `default`-origin config resolves to the bundled on-device engine no
         * matter what `provider` says, so consulting the stored value here would
         * prompt for a disclosure covering a transmission that never happens -
         * gating on-device audio behind consent to send it off-device, which is
         * the exact wall this lane exists to remove.
         */
        const storedOrigin = storedStt?.origin === 'user' ? 'user' : 'default';
        if (storedOrigin === 'user' && storedStt?.provider) {
          try {
            const providers = await modelRegistry.list.invoke();
            const hasConnectedOpenAIKey = providers.some((p) => p.providerId === 'openai' && p.state === 'connected');
            const hasConnectedFluxKey = providers.some(
              (p) => p.providerId === FLUX_PROVIDER_ID && p.state === 'connected'
            );
            connectedCredentialsRef.current = { openai: hasConnectedOpenAIKey, flux: hasConnectedFluxKey };
            setConnectedCredentials(connectedCredentialsRef.current);
            sttProvider = resolveEffectiveSttProvider({
              stored: storedStt,
              hasConnectedOpenAIKey,
              hasConnectedFluxKey,
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
        sttConfigRef.current = storedStt;
        ttsConfigRef.current = nextTts;
        consentRef.current = effectiveConsent ?? null;
        setSttConfig(storedStt);
        setTtsConfig(nextTts);
        setConsent(effectiveConsent ?? null);
        setSurfaceError(null);
        setLastTranscript('');
        setLastResponse('');
        activeTurnRef.current = null;
        completedTurnRef.current = null;
        responseTextRef.current = '';
        spokenLengthRef.current = 0;
        spokenCharsRef.current = 0;
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
         * One tap, one meaning - and a voice assistant opens by SAYING
         * something.
         *
         * Entry used to land in `listening` with the microphone CLOSED, and the
         * copy under the orb says "Tap to speak" precisely because of that. Once
         * the composer is the surface, its status line reads "Listening..." while
         * nothing is recording - so the everyman talks and nothing happens. The
         * caller that owns the gesture asks for the mic to open with it, and the
         * greeting goes in front of that: Wayland says hello, and then listens,
         * with no second gesture in between.
         *
         * The greeting is gated on the SAME readiness the microphone is, read
         * from the refs that were set a few lines above rather than from state a
         * render behind. Every existing refusal is untouched - a session with no
         * transcriber still lands on the honest reason instead of being greeted
         * into a dead end, because there is nothing on the other side of the
         * greeting for the user to talk to.
         */
        if (options?.thenListen) {
          const greetable = resolveVoiceSessionReadiness(readinessInput()).ready;
          const greeting = greetable ? await speakGreeting() : ({ kind: 'skipped' } as const);
          // Unconditional, including after a barge-in that already opened the
          // microphone on its own way through: `beginCapture` refuses anything
          // that is not `listening`, so the second call is the no-op it should
          // be rather than a second guard to keep in step with the first.
          await beginCaptureRef.current();
          /**
           * A greeting nobody could hear has to say so, and it has to say so
           * AFTER the microphone attempt, because `beginCapture` clears the
           * surface error on its way in and would wipe this. `user-speaking` is
           * the positive signal that the mic really opened and therefore has no
           * more urgent refusal of its own to show.
           */
          if (greeting.kind === 'blocked' && snapshotRef.current?.state === 'user-speaking') {
            setSurfaceError(greeting.message);
          }
        }
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
    [actorLabel, cancelAutoCapture, conversationId, ensureAudioContext, ensureConsent, speakGreeting]
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

  /**
   * The new-chat page's handoff: it armed voice before creating this
   * conversation, because there was no conversation to start a session in yet.
   *
   * `thenListen` matches what the composer's own entry button does - the user
   * pressed a button captioned "Talk with Wayland", so the microphone opens.
   * Reading the flag consumes it, so this fires exactly once and only for the
   * conversation the arming led to.
   */
  const armedBeginRef = useRef(false);
  useEffect(() => {
    if (armedBeginRef.current) return;
    armedBeginRef.current = true;
    if (!consumeArmedVoiceMode()) return;
    void begin({ thenListen: true });
    // `begin` is deliberately absent: this must run on mount only, and begin's
    // identity changes whenever the session's config refs settle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  /**
   * The turn-terminal handler: whatever ends the turn ends it here, once.
   *
   * It owns the tail, the captions, the no-speakable-response case, and the
   * dedupe. `terminalId` is only a naming input for the segment id now - the
   * dedupe is keyed on the turn, because the two terminal paths do not agree on
   * a message id and the state guard that used to reject the second one no
   * longer applies once `speaking` is terminable.
   */
  const completeTurn = useCallback(
    (terminalId: string, terminalError = false) => {
      const current = snapshotRef.current;
      const turnId = current?.activeTurnId ?? null;
      const decision = resolveVoiceTurnTerminal({
        state: current?.state ?? 'connecting',
        turnId,
        completedTurnId: completedTurnRef.current,
        terminalError,
        rawResponse: responseTextRef.current,
        spokenLength: spokenLengthRef.current,
      });
      if (decision.kind === 'ignore' || !turnId) return;
      completedTurnRef.current = turnId;

      if (decision.kind === 'fail') {
        applyEvent({ type: 'fail', errorCode: decision.errorCode });
        setSurfaceError(
          decision.errorCode === 'TURN_FAILED'
            ? 'The turn failed. Inspect Chat for the exact error and recovery options.'
            : 'This turn produced a visual or tool-only result. Open Chat to inspect it.'
        );
        return;
      }

      if (decision.transcript) setLastResponse(decision.transcript);
      // `settle` means the chunks already said everything. Sealing is what
      // hands `playback_completed` to the last of them; without it the queue
      // waits for text that is never coming and the microphone never re-arms.
      if (decision.kind === 'settle' && speechQueueTurnRef.current === turnId) speechQueueRef.current?.seal();
      if (decision.kind === 'speak') speakSegment(turnId, terminalId, decision.tail);
    },
    [applyEvent, speakSegment]
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
          // Deltas, so this runs on the whole accumulated buffer and takes only
          // what is now complete. Synthesis starts before the model finishes
          // writing: measured time-to-first-audio 5056 ms down to 953 ms.
          pumpSpeakableSentences();
        }
        return;
      }
      if (message.type === 'error') {
        completeTurn(message.msg_id || newCorrelationId('voice-error'), true);
        return;
      }
      if (message.type === 'finish') {
        completeTurn(message.msg_id || responseMessageIdRef.current || newCorrelationId('voice-finish'));
      }
    });
  }, [completeTurn, conversationId, isActive, pumpSpeakableSentences]);

  useEffect(() => {
    if (!isActive) return;
    return conversation.turnCompleted.on((event) => {
      if (event.sessionId !== conversationId || !isTerminalCompletion(event.status, event.state)) return;
      completeTurn(String(event.lastMessage.id ?? event.lastMessage.createdAt), event.state === 'error');
    });
  }, [completeTurn, conversationId, isActive]);

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

  useEffect(
    () => () => {
      clearAudio();
      // One context per mounted session, closed with it. Leaking one per
      // conversation walks into Chromium's per-page context ceiling.
      void audioContextRef.current?.close().catch(() => {});
      audioContextRef.current = null;
    },
    [clearAudio]
  );

  useEffect(() => {
    if (!speechErrorCode) return;
    /**
     * Name the cause, not the bucket.
     *
     * This used to print the error code alone, and for a local-engine failure
     * that code was the literal word "unknown" - shown to a user who had just
     * finished speaking. The underlying reason (a bundled model file that would
     * not load, a runtime that is not installed) travels with the error now, so
     * show it whenever it exists and keep the code only as the fallback.
     */
    setSurfaceError(
      speechErrorMessage
        ? `Transcription failed: ${speechErrorMessage}. Nothing was sent.`
        : `Microphone or transcription failed (${speechErrorCode}). Nothing was sent.`
    );
  }, [speechErrorCode, speechErrorMessage]);

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

  // The greeting is Wayland talking, so the detector that lets the user talk
  // over an ANSWER has to cover it too - the machine says `listening` there, and
  // gating on that alone is what would make the opening sentence the one thing
  // in the session you cannot interrupt by speaking.
  useEffect(() => {
    if (!ACOUSTIC_BARGE_IN_ENABLED || !isActive || (state !== 'speaking' && greetingText === null)) return;
    void startMonitoring();
    return () => stopMonitoring();
  }, [greetingText, isActive, startMonitoring, state, stopMonitoring]);

  const renderReadinessInput = useMemo(
    (): VoiceReadinessInput => ({
      ttsConfig,
      sttConfig: sttConfig && { ...sttConfig, provider: effectiveSttProvider ?? undefined },
      platform: rendererPlatform(),
      consent,
      audioContextState,
      connectedCredentials,
      localSttReady,
      modelConnected,
    }),
    [
      audioContextState,
      connectedCredentials,
      consent,
      effectiveSttProvider,
      localSttReady,
      modelConnected,
      sttConfig,
      ttsConfig,
    ]
  );

  /**
   * Warm the on-device model at a moment the user is NOT waiting.
   *
   * `whisperWorker` documents a 5-10 SECOND one-time warmup. Until now that was
   * hidden, because whisper-local was only reachable via Settings, and opening
   * Settings warmed it. Making the on-device floor the DEFAULT relocates those
   * 5-10 silent seconds onto the first tap of the mic - the single most
   * important interaction in the feature - unless it is paid off in advance.
   *
   * `requestIdleCallback` after first paint, so it never competes with the
   * conversation rendering. Failure is deliberately swallowed: an unwarmed
   * worker is a slow first tap, not a broken one, and `transcribeLocally`
   * re-initializes on demand anyway.
   */
  useEffect(() => {
    if (localSttReadyRef.current) return;
    let cancelled = false;

    const warm = () => {
      void warmLocalWhisper()
        .then(() => {
          if (cancelled) return;
          localSttReadyRef.current = true;
          setLocalSttReady(true);
        })
        .catch(() => {
          // Slow first tap, not a broken one.
        });
    };

    const idle = typeof window !== 'undefined' ? window.requestIdleCallback : undefined;
    const handle = idle ? idle(warm, { timeout: 2000 }) : window.setTimeout(warm, 0);

    return () => {
      cancelled = true;
      if (idle && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(handle as number);
      else window.clearTimeout(handle as number);
    };
  }, []);

  const readiness = useMemo(() => resolveVoiceSessionReadiness(renderReadinessInput), [renderReadinessInput]);
  /** The two directions, resolved separately. @see resolveVoiceLeg */
  const speechInLeg = useMemo(() => resolveVoiceLeg('in', renderReadinessInput), [renderReadinessInput]);
  const speechOutLeg = useMemo(() => resolveVoiceLeg('out', renderReadinessInput), [renderReadinessInput]);

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
    greetingText,
    error: surfaceError,
    level,
    ttsConfig,
    sttConfig,
    readiness,
    speechInLeg,
    speechOutLeg,
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
