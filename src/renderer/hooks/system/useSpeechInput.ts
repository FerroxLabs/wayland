/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLatestRef } from '@/renderer/hooks/ui/useLatestRef';
import { transcribeAudioBlob } from '@/renderer/services/SpeechToTextService';
import { isElectronDesktop } from '@/renderer/utils/platform';
import { ipcBridge } from '@/common';

export type SpeechInputAvailability = 'record' | 'file' | 'unsupported';
export type SpeechInputStatus = 'idle' | 'recording' | 'transcribing' | 'error';
export type SpeechInputErrorCode =
  | 'aborted'
  | 'audio-capture'
  | 'auth-error'
  | 'empty-transcript'
  | 'file-too-large'
  | 'network'
  | 'not-configured'
  | 'permission-denied'
  | 'premium-locked'
  | 'rate-limited'
  | 'recording-unsupported'
  | 'transcription-failed'
  | 'unknown';

type SpeechInputEnvironment = {
  hasFileInput: boolean;
  hasMediaDevices: boolean;
  hasMediaRecorder: boolean;
  hostname: string;
  isElectronDesktop: boolean;
  isSecureContext: boolean;
};

type UseSpeechInputOptions = {
  locale?: string;
  onTranscript: (transcript: string) => void;
  /** Opt in to automatic end-of-utterance detection. Off keeps the tap-to-stop contract. */
  endpointing?: boolean;
  /** The speaker stopped talking and the utterance should be submitted. */
  onSpeechEnd?: () => void;
  /** Nobody spoke before the no-speech timeout; the capture was discarded, not submitted. */
  onNoSpeech?: () => void;
  /** There is no analysable audio signal at all, so the caller must fall back to a tap. */
  onEndpointingUnavailable?: () => void;
  /** Fired from `startMonitoring` when the user talks over assistant playback. */
  onBargeIn?: () => void;
};

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);
const RECORDING_MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
const SPEECH_WAVEFORM_SAMPLE_COUNT = 40;
const SPEECH_WAVEFORM_MIN_LEVEL = 0.015;
const SPEECH_WAVEFORM_MAX_LEVEL = 1;
const SPEECH_VISUALIZER_INTERVAL_MS = 80;

// Endpointing knobs, in the raw RMS units produced by `readAnalyserRms`.
// Every value is deliberately biased against chopping a slow speaker: an
// ambiguous room makes the detector hang open to the hard cap or refuse to arm,
// it never shortens the hangover.
const ENDPOINT_CALIBRATION_TICKS = 4; // 320 ms of room tone
const ENDPOINT_NOISE_FLOOR_MIN = 0.004;
const ENDPOINT_NOISE_FLOOR_MAX = 0.05;
const ENDPOINT_SPEECH_THRESHOLD_MIN = 0.02;
const ENDPOINT_SPEECH_THRESHOLD_MAX = 0.06;
/** Hysteresis: the silence bar sits 40% under the speech bar so consonant gaps do not cross it. */
const ENDPOINT_SILENCE_RATIO = 0.6;
const ENDPOINT_MIN_SPEECH_MS = 400;
const ENDPOINT_HANGOVER_MS = 1000;
/** "Um, so…" openings get a longer tail before the turn is closed. */
const ENDPOINT_SHORT_UTTERANCE_MS = 1500;
const ENDPOINT_SHORT_HANGOVER_MS = 1400;
const ENDPOINT_NO_SPEECH_TIMEOUT_MS = 8000;
const ENDPOINT_MAX_UTTERANCE_MS = 30000;

// Acoustic barge-in is far stricter than endpointing: the loudest thing the mic
// hears during playback is the assistant itself.
const BARGE_IN_CALIBRATION_TICKS = 6; // 480 ms of the assistant's own bleed
const BARGE_IN_ABSOLUTE_MIN_LEVEL = 0.06;
const BARGE_IN_ECHO_MULTIPLE = 3;
const BARGE_IN_SUSTAIN_TICKS = 6; // 480 ms of continuous speech over the bar

type EndpointDetector = {
  ticks: number;
  calibrationFloor: number;
  speechThreshold: number;
  silenceThreshold: number;
  armed: boolean;
  fired: boolean;
  speechMs: number;
  silenceMs: number;
  elapsedMs: number;
};

const createEndpointDetector = (): EndpointDetector => ({
  ticks: 0,
  calibrationFloor: Number.POSITIVE_INFINITY,
  speechThreshold: ENDPOINT_SPEECH_THRESHOLD_MIN,
  silenceThreshold: ENDPOINT_SPEECH_THRESHOLD_MIN * ENDPOINT_SILENCE_RATIO,
  armed: false,
  fired: false,
  speechMs: 0,
  silenceMs: 0,
  elapsedMs: 0,
});

const clampNumber = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const createInitialWaveformLevels = (): number[] =>
  Array.from({ length: SPEECH_WAVEFORM_SAMPLE_COUNT }, (_, index) => ((index + 1) % 6 === 0 ? 0.04 : 0.015));

const clampWaveformLevel = (value: number): number =>
  Math.max(SPEECH_WAVEFORM_MIN_LEVEL, Math.min(SPEECH_WAVEFORM_MAX_LEVEL, value));

const createNextWaveformLevels = (previous: number[], nextLevel: number): number[] => [
  ...previous.slice(1),
  clampWaveformLevel(nextLevel),
];

export const appendSpeechTranscript = (base: string, transcript: string): string => {
  const normalizedTranscript = transcript.trim();
  if (!normalizedTranscript) {
    return base;
  }

  const normalizedBase = base.trimEnd();
  if (!normalizedBase) {
    return normalizedTranscript;
  }

  return `${normalizedBase}\n${normalizedTranscript}`;
};

const getSpeechInputEnvironment = (): SpeechInputEnvironment => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      hasFileInput: false,
      hasMediaDevices: false,
      hasMediaRecorder: false,
      hostname: '',
      isElectronDesktop: false,
      isSecureContext: false,
    };
  }

  return {
    hasFileInput: typeof document.createElement === 'function',
    hasMediaDevices: typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia),
    hasMediaRecorder: typeof MediaRecorder !== 'undefined',
    hostname: window.location.hostname,
    isElectronDesktop: isElectronDesktop(),
    isSecureContext: window.isSecureContext,
  };
};

export const getSpeechInputAvailabilityForEnvironment = (
  environment: SpeechInputEnvironment
): SpeechInputAvailability => {
  const canUseLiveRecording =
    environment.hasMediaDevices &&
    environment.hasMediaRecorder &&
    (environment.isElectronDesktop || environment.isSecureContext || LOCAL_HOSTNAMES.has(environment.hostname));

  if (canUseLiveRecording) {
    return 'record';
  }

  if (environment.hasFileInput) {
    return 'file';
  }

  return 'unsupported';
};

export const getSpeechInputAvailability = (): SpeechInputAvailability => {
  return getSpeechInputAvailabilityForEnvironment(getSpeechInputEnvironment());
};

export const pickRecordingMimeType = (): string => {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return '';
  }

  return RECORDING_MIME_TYPES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || '';
};

export const mapSpeechInputError = (error: unknown): SpeechInputErrorCode => {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
      case 'SecurityError':
        return 'permission-denied';
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'audio-capture';
      case 'AbortError':
        return 'aborted';
      default:
        return 'unknown';
    }
  }

  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('STT_FLUX_PREMIUM_LOCKED')) {
    return 'premium-locked';
  }
  if (message.includes('STT_FLUX_AUTH_ERROR')) {
    return 'auth-error';
  }
  if (message.includes('STT_RATE_LIMITED')) {
    return 'rate-limited';
  }
  if (
    message.includes('STT_FLUX_NOT_CONFIGURED') ||
    message.includes('STT_OPENAI_NOT_CONFIGURED') ||
    message.includes('STT_DEEPGRAM_NOT_CONFIGURED') ||
    message.includes('STT_DISABLED') ||
    // The disclosure is accepted in the same Voice settings pane the
    // "not configured" copy sends the user to, so it is the honest bucket.
    message.includes('STT_HOSTED_CONSENT_REQUIRED')
  ) {
    return 'not-configured';
  }
  if (message.includes('STT_FILE_TOO_LARGE')) {
    return 'file-too-large';
  }
  if (message.includes('STT_NETWORK_ERROR')) {
    return 'network';
  }
  if (message.includes('STT_ABORTED')) {
    return 'aborted';
  }
  if (message.includes('STT_REQUEST_FAILED')) {
    return 'transcription-failed';
  }

  return 'unknown';
};

export const useSpeechInput = ({
  locale,
  onTranscript,
  endpointing = false,
  onSpeechEnd,
  onNoSpeech,
  onEndpointingUnavailable,
  onBargeIn,
}: UseSpeechInputOptions) => {
  const [status, setStatus] = useState<SpeechInputStatus>('idle');
  const [errorCode, setErrorCode] = useState<SpeechInputErrorCode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordingDurationMs, setRecordingDurationMs] = useState(0);
  const [recordingLevels, setRecordingLevels] = useState<number[]>(() => createInitialWaveformLevels());
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const discardRecordingRef = useRef(false);
  const recordingStartedAtRef = useRef<number | null>(null);
  const visualizerIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const onTranscriptRef = useLatestRef(onTranscript);
  // Every detector callout crosses a `setInterval` closure created once at
  // capture start, so it must be read through a latest-ref or it silently
  // invokes the first render's identity.
  const endpointingRef = useLatestRef(endpointing);
  const onSpeechEndRef = useLatestRef(onSpeechEnd);
  const onNoSpeechRef = useLatestRef(onNoSpeech);
  const onEndpointingUnavailableRef = useLatestRef(onEndpointingUnavailable);
  const onBargeInRef = useLatestRef(onBargeIn);
  const detectorRef = useRef<EndpointDetector>(createEndpointDetector());
  const monitorStreamRef = useRef<MediaStream | null>(null);
  const monitorContextRef = useRef<AudioContext | null>(null);
  const monitorAnalyserRef = useRef<AnalyserNode | null>(null);
  const monitorDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const monitorIntervalRef = useRef<number | null>(null);
  const cancelRecordingRef = useRef<() => void>(() => {});
  const availability = useMemo(() => getSpeechInputAvailability(), []);

  const recognitionLocale = locale?.trim() || 'en-US';

  const pauseSpeechVisualizer = useCallback(() => {
    if (visualizerIntervalRef.current !== null) {
      window.clearInterval(visualizerIntervalRef.current);
      visualizerIntervalRef.current = null;
    }
  }, []);

  const resetSpeechVisualizer = useCallback(() => {
    pauseSpeechVisualizer();
    recordingStartedAtRef.current = null;
    setRecordingDurationMs(0);
    setRecordingLevels(createInitialWaveformLevels());
  }, [pauseSpeechVisualizer]);

  const cleanupAudioAnalysis = useCallback(async () => {
    if (mediaSourceRef.current) {
      try {
        mediaSourceRef.current.disconnect();
      } catch {
        // Ignore disconnect failures during teardown.
      }
      mediaSourceRef.current = null;
    }

    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {
        // Ignore disconnect failures during teardown.
      }
      analyserRef.current = null;
    }

    analyserDataRef.current = null;

    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch {
        // Ignore close failures during teardown.
      }
      audioContextRef.current = null;
    }
  }, []);

  const readAnalyserRms = useCallback((
    analyser: AnalyserNode | null,
    data: Uint8Array<ArrayBuffer> | null
  ): number | null => {
    if (!analyser || !data) return null;
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (const sample of data) {
      const normalized = (sample - 128) / 128;
      sum += normalized * normalized;
    }
    return Math.sqrt(sum / data.length);
  }, []);

  /**
   * One tick of the endpointing detector, driven by the waveform interval that
   * already runs during capture. Deliberately asymmetric: when the acoustics are
   * ambiguous it hangs open to `ENDPOINT_MAX_UTTERANCE_MS` or refuses to arm,
   * because chopping a slow speaker turns one utterance into several full turns.
   */
  const advanceEndpointDetector = useCallback((rms: number) => {
    const detector = detectorRef.current;
    // Only a fired detector short-circuits. Nothing else may skip the elapsed-ms
    // accounting below, because that is what keeps the no-speech timeout and the
    // `ENDPOINT_MAX_UTTERANCE_MS` hard cap alive when endpointing degrades. A
    // detector that stops counting is a microphone that never closes.
    if (detector.fired) return;

    detector.ticks += 1;
    detector.elapsedMs += SPEECH_VISUALIZER_INTERVAL_MS;

    if (detector.ticks <= ENDPOINT_CALIBRATION_TICKS) {
      // The MINIMUM, not the peak: a single 80 ms syllable inside the window
      // must not be able to redefine the room. The quietest tick is the only
      // honest estimate of the floor.
      detector.calibrationFloor = Math.min(detector.calibrationFloor, rms);
      if (detector.ticks < ENDPOINT_CALIBRATION_TICKS) return;
      const noiseFloor = clampNumber(detector.calibrationFloor, ENDPOINT_NOISE_FLOOR_MIN, ENDPOINT_NOISE_FLOOR_MAX);
      if (noiseFloor >= ENDPOINT_SPEECH_THRESHOLD_MIN) {
        // The window never went quiet, so it was not room tone. In continuous
        // mode the mic reopens 350 ms after the assistant stops and the median
        // turn-taking gap is shorter than that, so the overwhelmingly likely
        // cause is that the user is already answering. Treat it as speech in
        // progress: keep the default bars and carry the calibration window in as
        // speech. The old behaviour - call it a noisy room and switch the
        // detector off - is the one outcome that guarantees the mic never closes
        // again, and a floor of 0.025 also pushed the speech bar to 0.06, above
        // any normal voice, so the whole turn was silently discarded.
        detector.speechThreshold = ENDPOINT_SPEECH_THRESHOLD_MIN;
        detector.silenceThreshold = ENDPOINT_SPEECH_THRESHOLD_MIN * ENDPOINT_SILENCE_RATIO;
        detector.speechMs = ENDPOINT_CALIBRATION_TICKS * SPEECH_VISUALIZER_INTERVAL_MS;
        return;
      }
      detector.speechThreshold = clampNumber(
        noiseFloor * 3,
        ENDPOINT_SPEECH_THRESHOLD_MIN,
        ENDPOINT_SPEECH_THRESHOLD_MAX
      );
      detector.silenceThreshold = detector.speechThreshold * ENDPOINT_SILENCE_RATIO;
      return;
    }

    if (rms >= detector.speechThreshold) {
      detector.speechMs += SPEECH_VISUALIZER_INTERVAL_MS;
      detector.silenceMs = 0;
      if (detector.speechMs >= ENDPOINT_MIN_SPEECH_MS) detector.armed = true;
    } else if (rms < detector.silenceThreshold) {
      detector.silenceMs += SPEECH_VISUALIZER_INTERVAL_MS;
    } else {
      // Inside the hysteresis band: not speech, but not silence either. A run of
      // consecutive sub-silence ticks is what closes a turn, so this breaks it.
      detector.silenceMs = 0;
    }

    if (!detector.armed) {
      if (detector.elapsedMs >= ENDPOINT_NO_SPEECH_TIMEOUT_MS) {
        detector.fired = true;
        // Discard rather than submit: an empty blob surfaces `empty-transcript`
        // as a hard error and strands the caller with no exit transition.
        cancelRecordingRef.current();
        onNoSpeechRef.current?.();
      }
      return;
    }

    const hangoverMs =
      detector.speechMs < ENDPOINT_SHORT_UTTERANCE_MS ? ENDPOINT_SHORT_HANGOVER_MS : ENDPOINT_HANGOVER_MS;
    if (detector.silenceMs >= hangoverMs || detector.elapsedMs >= ENDPOINT_MAX_UTTERANCE_MS) {
      detector.fired = true;
      onSpeechEndRef.current?.();
    }
  }, []);

  const startSpeechVisualizer = useCallback(
    async (stream: MediaStream) => {
      resetSpeechVisualizer();
      recordingStartedAtRef.current = Date.now();
      detectorRef.current = createEndpointDetector();

      const AudioContextCtor =
        typeof AudioContext !== 'undefined'
          ? AudioContext
          : typeof window !== 'undefined'
            ? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
            : undefined;

      if (AudioContextCtor) {
        try {
          const audioContext = new AudioContextCtor();
          // Electron hands back a suspended context. Without this the analyser
          // returns a constant 0x80, RMS is exactly 0, and the detector reads
          // permanent silence while the mic stays open.
          if (audioContext.state === 'suspended') await audioContext.resume();
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 128;
          analyser.smoothingTimeConstant = 0.82;
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          audioContextRef.current = audioContext;
          analyserRef.current = analyser;
          mediaSourceRef.current = source;
          analyserDataRef.current = new Uint8Array(analyser.fftSize);
        } catch {
          void cleanupAudioAnalysis();
        }
      }

      if (endpointingRef.current && !analyserRef.current) {
        // No analyser means no signal to endpoint on. This is the only genuine
        // "endpointing cannot work" case left: everything acoustic is handled by
        // the detector itself. Say so instead of leaving the mic open forever
        // waiting for a silence that can never be measured.
        onEndpointingUnavailableRef.current?.();
      }

      visualizerIntervalRef.current = window.setInterval(() => {
        const startedAt = recordingStartedAtRef.current;
        if (startedAt) {
          setRecordingDurationMs(Date.now() - startedAt);
        }

        const rms = readAnalyserRms(analyserRef.current, analyserDataRef.current);
        if (rms === null) {
          setRecordingLevels((previous) => createNextWaveformLevels(previous, SPEECH_WAVEFORM_MIN_LEVEL));
          return;
        }

        setRecordingLevels((previous) => createNextWaveformLevels(previous, clampWaveformLevel(rms * 5.6)));
        if (endpointingRef.current) advanceEndpointDetector(rms);
      }, SPEECH_VISUALIZER_INTERVAL_MS);
    },
    [advanceEndpointDetector, cleanupAudioAnalysis, readAnalyserRms, resetSpeechVisualizer]
  );

  const cleanupRecorder = useCallback(() => {
    pauseSpeechVisualizer();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
    chunksRef.current = [];
    void cleanupAudioAnalysis();
  }, [cleanupAudioAnalysis, pauseSpeechVisualizer]);

  const clearError = useCallback(() => {
    setErrorCode(null);
    setErrorMessage(null);
    setStatus('idle');
    resetSpeechVisualizer();
  }, [resetSpeechVisualizer]);

  const transcribeBlob = useCallback(
    async (blob: Blob) => {
      try {
        setStatus('transcribing');
        setErrorCode(null);
        setErrorMessage(null);
        const result = await transcribeAudioBlob(blob, recognitionLocale);
        const transcript = result.text.trim();
        if (!transcript) {
          setErrorCode('empty-transcript');
          setErrorMessage(null);
          setStatus('error');
          resetSpeechVisualizer();
          return;
        }
        onTranscriptRef.current(transcript);
        setStatus('idle');
        resetSpeechVisualizer();
      } catch (error) {
        setErrorCode(mapSpeechInputError(error));
        const message = error instanceof Error ? error.message : String(error);
        setErrorMessage(
          message.startsWith('STT_REQUEST_FAILED:') ? message.replace('STT_REQUEST_FAILED:', '').trim() : null
        );
        setStatus('error');
        resetSpeechVisualizer();
      }
    },
    [onTranscriptRef, recognitionLocale, resetSpeechVisualizer]
  );

  const startRecording = useCallback(async () => {
    if (availability !== 'record') {
      setErrorCode('recording-unsupported');
      setStatus('error');
      return;
    }

    // Trigger the macOS mic TCC prompt on demand (Electron desktop only) so a
    // signed/hardened build can actually capture the mic, and a denial surfaces
    // instead of a silent recording. Best-effort: any IPC failure falls through
    // to getUserMedia, which maps its own permission error.
    if (isElectronDesktop()) {
      try {
        const micStatus = await ipcBridge.mic.requestAccess.invoke();
        if (micStatus === 'denied' || micStatus === 'restricted') {
          setErrorCode('permission-denied');
          setStatus('error');
          return;
        }
      } catch {
        // Best-effort: fall through to getUserMedia.
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickRecordingMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      discardRecordingRef.current = false;
      await startSpeechVisualizer(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        cleanupRecorder();
        setErrorCode('unknown');
        setStatus('error');
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || 'audio/webm',
        });
        const shouldDiscard = discardRecordingRef.current;
        discardRecordingRef.current = false;
        cleanupRecorder();
        if (shouldDiscard) {
          setStatus('idle');
          resetSpeechVisualizer();
          return;
        }
        void transcribeBlob(audioBlob);
      };

      setErrorCode(null);
      setErrorMessage(null);
      setStatus('recording');
      recorder.start();
    } catch (error) {
      cleanupRecorder();
      setErrorCode(mapSpeechInputError(error));
      setErrorMessage(null);
      setStatus('error');
      resetSpeechVisualizer();
    }
  }, [availability, cleanupRecorder, resetSpeechVisualizer, startSpeechVisualizer, transcribeBlob]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || status !== 'recording') {
      return;
    }

    setStatus('transcribing');
    recorder.stop();
  }, [status]);

  const cancelRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      cleanupRecorder();
      setStatus('idle');
      resetSpeechVisualizer();
      return;
    }

    discardRecordingRef.current = true;
    setStatus('idle');
    recorder.stop();
  }, [cleanupRecorder, resetSpeechVisualizer]);

  useLayoutEffect(() => {
    cancelRecordingRef.current = cancelRecording;
  });

  const stopMonitoring = useCallback(() => {
    if (monitorIntervalRef.current !== null) {
      window.clearInterval(monitorIntervalRef.current);
      monitorIntervalRef.current = null;
    }
    monitorAnalyserRef.current?.disconnect();
    monitorAnalyserRef.current = null;
    monitorDataRef.current = null;
    if (monitorContextRef.current) {
      void monitorContextRef.current.close().catch((): void => {
        // Ignore close failures during teardown.
      });
      monitorContextRef.current = null;
    }
    if (monitorStreamRef.current) {
      monitorStreamRef.current.getTracks().forEach((track) => track.stop());
      monitorStreamRef.current = null;
    }
  }, []);

  /**
   * Samples the mic *without* a MediaRecorder so the caller can detect the user
   * talking over assistant playback. Two guards keep the assistant from
   * interrupting itself: the stream is refused unless the browser confirms
   * echo cancellation is actually active, and the bar is calibrated against the
   * speaker bleed measured during the first 480 ms, so a loud room raises the
   * bar instead of tripping it.
   */
  const startMonitoring = useCallback(async () => {
    if (availability !== 'record' || monitorStreamRef.current) return;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch {
      return;
    }

    const track = stream.getAudioTracks()[0];
    const settings = track?.getSettings?.();
    if (!settings || settings.echoCancellation !== true) {
      stream.getTracks().forEach((entry) => entry.stop());
      return;
    }

    const AudioContextCtor =
      typeof AudioContext !== 'undefined'
        ? AudioContext
        : typeof window !== 'undefined'
          ? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
          : undefined;
    if (!AudioContextCtor) {
      stream.getTracks().forEach((entry) => entry.stop());
      return;
    }

    try {
      const audioContext = new AudioContextCtor();
      if (audioContext.state === 'suspended') await audioContext.resume();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.82;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      monitorStreamRef.current = stream;
      monitorContextRef.current = audioContext;
      monitorAnalyserRef.current = analyser;
      monitorDataRef.current = new Uint8Array(analyser.fftSize);
    } catch {
      stream.getTracks().forEach((entry) => entry.stop());
      stopMonitoring();
      return;
    }

    let ticks = 0;
    let echoPeak = 0;
    let threshold = BARGE_IN_ABSOLUTE_MIN_LEVEL;
    let sustained = 0;
    let fired = false;

    monitorIntervalRef.current = window.setInterval(() => {
      const rms = readAnalyserRms(monitorAnalyserRef.current, monitorDataRef.current);
      if (rms === null || fired) return;

      ticks += 1;
      if (ticks <= BARGE_IN_CALIBRATION_TICKS) {
        echoPeak = Math.max(echoPeak, rms);
        if (ticks === BARGE_IN_CALIBRATION_TICKS) {
          threshold = Math.max(echoPeak * BARGE_IN_ECHO_MULTIPLE, BARGE_IN_ABSOLUTE_MIN_LEVEL);
        }
        return;
      }

      if (rms >= threshold) {
        sustained += 1;
        if (sustained >= BARGE_IN_SUSTAIN_TICKS) {
          fired = true;
          onBargeInRef.current?.();
        }
        return;
      }
      sustained = 0;
    }, SPEECH_VISUALIZER_INTERVAL_MS);
  }, [availability, readAnalyserRms, stopMonitoring]);

  const transcribeFile = useCallback(
    async (file: Blob) => {
      await transcribeBlob(file);
    },
    [transcribeBlob]
  );

  useEffect(() => {
    return () => {
      stopMonitoring();
      const recorder = recorderRef.current;
      if (recorder) {
        recorder.ondataavailable = null;
        recorder.onerror = null;
        recorder.onstop = null;
      }
      if (recorder?.state !== 'inactive') {
        try {
          recorder.stop();
        } catch {
          // Ignore teardown failures from partially started recording sessions.
        }
      }
      cleanupRecorder();
    };
  }, [cleanupRecorder, stopMonitoring]);

  return {
    availability,
    cancelRecording,
    clearError,
    errorCode,
    errorMessage,
    recordingDurationMs,
    recordingLevels,
    startMonitoring,
    startRecording,
    status,
    stopMonitoring,
    stopRecording,
    transcribeFile,
  };
};
