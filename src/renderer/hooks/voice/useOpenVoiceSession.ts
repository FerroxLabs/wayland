/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useRef, useState } from 'react';
import { conversation } from '@/common/adapter/ipcBridge';
import { ConfigStorage } from '@/common/config/storage';
import { detectThresholdIntent } from '@/common/voice/thresholdIntent';
import { detectSensitivityIntent } from '@/common/voice/sensitivityIntent';
import { buildCallGreeting } from '@/common/voice/greeting';
import { createVadEndpointer, type VadEndpointer } from '@/common/voice/vad';
import { createNoiseFloorTracker } from '@/common/voice/noiseFloor';
import { stepSensitivityBias, stepSilenceMs } from '@/common/types/voiceChatPrefs';
import { createVoiceCapture, type VoiceCapture } from '@/renderer/utils/voiceCapture';
import { transcribeAudioBlob } from '@/renderer/services/SpeechToTextService';
import { isVoicePlaybackActive, playStreamedAudio, stopVoicePlayback } from '@/renderer/utils/voicePlayback';
import { useOpenVoicePrefs } from '@/renderer/hooks/voice/useOpenVoicePrefs';
import { useTtsConfig } from '@/renderer/hooks/voice/useTtsConfig';

// ---------------------------------------------------------------------------
// Pure decision core (unit-tested). No I/O, no Date, no Web Audio — the hook
// wires real seams to it. See useOpenVoiceSession.test.ts.
// ---------------------------------------------------------------------------

export type OpenVoicePhase = 'listening' | 'capturing' | 'transcribing';

export type OpenVoiceState = {
  phase: OpenVoicePhase;
  ttsActive: boolean;
  turnRunning: boolean;
};

export type OpenVoiceEvent =
  | { type: 'speech-start' }
  | { type: 'speech-end' }
  | { type: 'transcript'; text: string };

export type OpenVoiceAction =
  | { kind: 'barge-in' }
  | { kind: 'begin-utterance' }
  | { kind: 'transcribe' }
  | { kind: 'adjust-threshold'; direction: 'longer' | 'shorter' }
  | { kind: 'adjust-sensitivity'; direction: 'less' | 'more' }
  | { kind: 'send'; text: string }
  | { kind: 'resume' };

/**
 * Pure reducer: maps (state, event) to the next action the controller should
 * take. Barge-in wins on speech-start whenever TTS is playing — regardless of
 * turnRunning — so the user can always interrupt the voice. Otherwise a
 * speech-start begins capturing. On a transcript, a recognized threshold-tuning
 * command adjusts the VAD gap, else a recognized sensitivity-tuning command
 * adjusts the noise-gate bias, instead of being sent; an empty transcript just
 * resumes listening; anything else is sent.
 */
export const nextOpenVoiceAction = (state: OpenVoiceState, event: OpenVoiceEvent): OpenVoiceAction => {
  switch (event.type) {
    case 'speech-start':
      if (state.ttsActive) return { kind: 'barge-in' };
      return { kind: 'begin-utterance' };
    case 'speech-end':
      return { kind: 'transcribe' };
    case 'transcript': {
      const text = event.text.trim();
      const thresholdIntent = detectThresholdIntent(text);
      if (thresholdIntent) return { kind: 'adjust-threshold', direction: thresholdIntent.direction };
      const sensitivityIntent = detectSensitivityIntent(text);
      if (sensitivityIntent) return { kind: 'adjust-sensitivity', direction: sensitivityIntent.direction };
      if (!text) return { kind: 'resume' };
      return { kind: 'send', text };
    }
  }
};

// ---------------------------------------------------------------------------
// Hook (Web Audio + React wiring around the pure reducer).
// ---------------------------------------------------------------------------

const START_THRESHOLD = 0.2;
const END_THRESHOLD = 0.12;
const FRAME_MS = 50;

export type UseOpenVoiceSessionArgs = {
  /** Call mode on for this conversation. */
  active: boolean;
  conversationId: string | undefined;
  /** Provided by the mount site; calls the real send path. */
  sendMessage: (text: string) => void;
  // Injectable seams (default to real impls) so the hook is testable.
  capture?: VoiceCapture;
  transcribe?: (blob: Blob) => Promise<{ text: string }>;
  playSpeak?: (text: string) => Promise<unknown>;
  stopTts?: () => void;
  stopTurn?: (conversationId: string | undefined) => void;
  isTtsActive?: () => boolean;
  isTurnRunning?: () => boolean;
  onLevel?: (level: number) => void;
  onPhase?: (phase: OpenVoicePhase) => void;
};

export type UseOpenVoiceSessionResult = {
  phase: OpenVoicePhase;
  level: number;
  silenceMs: number;
  /** Current adaptive ambient noise floor (RMS) — for the overlay. */
  noiseFloor: number;
  /** Current resolved per-conversation mic-sensitivity bias — for the overlay. */
  sensitivityBias: number;
};

/** Min interval between overlay (noiseFloor/level) state updates to avoid per-frame re-renders. */
const OVERLAY_UPDATE_MS = 120;

export const useOpenVoiceSession = (args: UseOpenVoiceSessionArgs): UseOpenVoiceSessionResult => {
  const prefs = useOpenVoicePrefs();
  const [ttsConfig] = useTtsConfig();

  const [phase, setPhase] = useState<OpenVoicePhase>('listening');
  const [level, setLevel] = useState(0);
  const [silenceMs, setSilenceMs] = useState(() => prefs.silenceMs(args.conversationId));
  const [noiseFloor, setNoiseFloor] = useState(0);
  const [sensitivityBias, setSensitivityBias] = useState(() =>
    prefs.sensitivityBias(args.conversationId),
  );

  // Latest-value refs so the long-lived listen loop never reads stale props.
  const phaseRef = useRef<OpenVoicePhase>('listening');
  const captureRef = useRef<VoiceCapture | null>(null);
  const endpointerRef = useRef<VadEndpointer | null>(null);
  const variantRef = useRef(0);
  // Live mic-sensitivity bias the per-frame loop reads so voice tuning applies
  // on the very next frame without re-running the effect.
  const biasRef = useRef(prefs.sensitivityBias(args.conversationId));

  const argsRef = useRef(args);
  argsRef.current = args;
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const ttsConfigRef = useRef(ttsConfig);
  ttsConfigRef.current = ttsConfig;

  const setPhaseBoth = (next: OpenVoicePhase) => {
    phaseRef.current = next;
    setPhase(next);
    try {
      argsRef.current.onPhase?.(next);
    } catch (err) {
      console.warn('[open-voice] onPhase callback failed', err);
    }
  };

  useEffect(() => {
    const { active, conversationId } = args;
    if (!active || !conversationId) return;

    // Resolve injectable seams (production defaults).
    const capture = args.capture ?? createVoiceCapture();
    const transcribe = args.transcribe ?? ((blob: Blob) => transcribeAudioBlob(blob));
    const playSpeak =
      args.playSpeak ??
      ((text: string) => playStreamedAudio({ text, config: ttsConfigRef.current }));
    const stopTts = args.stopTts ?? stopVoicePlayback;
    const stopTurn =
      args.stopTurn ??
      ((id: string | undefined) => {
        if (id) void conversation.stop.invoke({ conversation_id: id }).catch(() => {});
      });
    const isTtsActive = args.isTtsActive ?? isVoicePlaybackActive;
    const isTurnRunning = args.isTurnRunning ?? (() => false);
    const onLevel = (l: number) => {
      try {
        argsRef.current.onLevel?.(l);
      } catch (err) {
        console.warn('[open-voice] onLevel callback failed', err);
      }
    };

    captureRef.current = capture;

    const initialSilence = prefsRef.current.silenceMs(conversationId);
    setSilenceMs(initialSilence);
    const initialBias = prefsRef.current.sensitivityBias(conversationId);
    biasRef.current = initialBias;
    setSensitivityBias(initialBias);
    const endpointer = createVadEndpointer({
      frameMs: FRAME_MS,
      startThreshold: START_THRESHOLD,
      endThreshold: END_THRESHOLD,
      silenceMs: initialSilence,
    });
    endpointerRef.current = endpointer;

    // Adaptive noise-gate: tracks the ambient floor from non-speech frames and
    // derives live start/end energy gates so quiet rooms stay sensitive and
    // noisy rooms do not false-trigger.
    const tracker = createNoiseFloorTracker();

    let cancelled = false;
    let lastOverlayUpdate = 0;

    const dispatch = (event: OpenVoiceEvent) => {
      // TEXT-NEVER-GATED GUARANTEE: this controller drives audio OUT OF BAND.
      // It only READS completed assistant text (via the unchanged auto-read
      // mount) and never awaits TTS before any user-visible text. No code here
      // touches the MessageList render path; barge-in / capture / send happen
      // independently of how/when text is shown.
      const state: OpenVoiceState = {
        phase: phaseRef.current,
        ttsActive: isTtsActive(),
        turnRunning: isTurnRunning(),
      };
      const action = nextOpenVoiceAction(state, event);
      void runAction(action);
    };

    const runAction = async (action: OpenVoiceAction): Promise<void> => {
      try {
        switch (action.kind) {
          case 'barge-in':
            stopTts();
            stopTurn(conversationId);
            setPhaseBoth('listening');
            return;
          case 'begin-utterance':
            capture.beginUtterance();
            setPhaseBoth('capturing');
            return;
          case 'transcribe': {
            setPhaseBoth('transcribing');
            const blob = await capture.endUtterance();
            const result = await transcribe(blob);
            if (cancelled) return;
            dispatch({ type: 'transcript', text: result?.text ?? '' });
            return;
          }
          case 'adjust-threshold': {
            const cur = prefsRef.current.silenceMs(conversationId);
            const next = stepSilenceMs(cur, action.direction);
            prefsRef.current.setConversationSilence(conversationId, next);
            endpointer.setSilenceMs(next);
            setSilenceMs(next);
            const confirm =
              action.direction === 'longer'
                ? "Okay, I'll wait a bit longer."
                : "Got it, I'll be quicker.";
            void Promise.resolve(playSpeak(confirm)).catch((err) =>
              console.warn('[open-voice] confirm speak failed', err),
            );
            setPhaseBoth('listening');
            return;
          }
          case 'adjust-sensitivity': {
            const cur = prefsRef.current.sensitivityBias(conversationId);
            const next = stepSensitivityBias(cur, action.direction);
            prefsRef.current.setConversationSensitivity(conversationId, next);
            // Update the live bias ref so the next frame's gate recompute applies it.
            biasRef.current = next;
            setSensitivityBias(next);
            const confirm =
              action.direction === 'less'
                ? "Okay, I'll ignore more background noise."
                : "Got it, I'll listen more closely.";
            void Promise.resolve(playSpeak(confirm)).catch((err) =>
              console.warn('[open-voice] confirm speak failed', err),
            );
            setPhaseBoth('listening');
            return;
          }
          case 'send':
            argsRef.current.sendMessage(action.text);
            setPhaseBoth('listening');
            return;
          case 'resume':
            setPhaseBoth('listening');
            return;
        }
      } catch (err) {
        // Resilience: any seam failure resumes listening rather than crashing
        // the loop.
        console.warn('[open-voice] action failed; resuming listening', err);
        setPhaseBoth('listening');
      }
    };

    void (async () => {
      try {
        await capture.startListening((frame) => {
          if (cancelled) return;
          onLevel(frame);

          // Feed only non-speech frames into the ambient noise floor so speech
          // energy never inflates the gate.
          if (!endpointer.isSpeaking()) tracker.observe(frame);

          // Recompute and apply the adaptive gates every frame (cheap) using the
          // live per-conversation sensitivity bias. Barge-in and speech-start are
          // thereby gated on energy >= floor + margin automatically: the endpointer
          // only emits speech-start when a frame exceeds this adaptive start
          // threshold, so no extra above-floor check is needed here.
          const { startThreshold, endThreshold } = tracker.thresholds(biasRef.current);
          endpointer.setThresholds(startThreshold, endThreshold);

          const ev = endpointer.push(frame);

          // Throttle overlay state updates (level + noiseFloor) to avoid a
          // re-render every frame; the endpointer gate recompute above stays
          // per-frame.
          const now = Date.now();
          if (now - lastOverlayUpdate >= OVERLAY_UPDATE_MS) {
            lastOverlayUpdate = now;
            setLevel(frame);
            setNoiseFloor(tracker.floor());
          }

          if (ev) dispatch({ type: ev });
        }, FRAME_MS);
      } catch (err) {
        console.warn('[open-voice] failed to start listening', err);
        return;
      }

      if (cancelled) return;

      // Speak the greeting once. This is the ONE place new Date() is allowed
      // (in the hook, not the pure reducer).
      try {
        const spokenName = (await ConfigStorage.get('user.spokenName')) ?? undefined;
        if (cancelled) return;
        const greeting = buildCallGreeting({
          spokenName,
          hour: new Date().getHours(),
          variantSeed: variantRef.current++,
        });
        void Promise.resolve(playSpeak(greeting)).catch((err) =>
          console.warn('[open-voice] greeting speak failed', err),
        );
      } catch (err) {
        console.warn('[open-voice] greeting failed', err);
      }
    })();

    return () => {
      cancelled = true;
      try {
        capture.stop();
      } catch (err) {
        console.warn('[open-voice] capture.stop failed', err);
      }
      stopVoicePlayback();
      endpointer.reset();
      tracker.reset();
      captureRef.current = null;
      endpointerRef.current = null;
      setPhaseBoth('listening');
      setLevel(0);
      setNoiseFloor(0);
    };
    // Re-run on active / conversation change; seam identities are read via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [args.active, args.conversationId]);

  return { phase, level, silenceMs, noiseFloor, sensitivityBias };
};
