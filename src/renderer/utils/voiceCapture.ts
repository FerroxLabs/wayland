/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Thin Web Audio wrapper for open-voice mode: opens a mic stream with browser
 * echo cancellation, runs an AnalyserNode to emit normalized RMS frames at a
 * fixed cadence, and records the current utterance via MediaRecorder so the
 * controller can grab the audio blob to transcribe. Isolating Web Audio here
 * keeps the session controller unit-testable with a fake capture.
 */
export type VoiceCapture = {
  startListening(onFrame: (rms: number) => void, frameMs?: number): Promise<void>;
  /** Begin buffering audio for the current utterance (MediaRecorder). */
  beginUtterance(): void;
  /** Stop buffering and resolve the recorded blob. */
  endUtterance(): Promise<Blob>;
  stop(): void;
  isListening(): boolean;
};

const DEFAULT_FRAME_MS = 50;

export const createVoiceCapture = (): VoiceCapture => {
  let stream: MediaStream = null;
  let audioContext: AudioContext = null;
  let analyser: AnalyserNode = null;
  let source: MediaStreamAudioSourceNode = null;
  let frameTimer: ReturnType<typeof setInterval> = null;
  let recorder: MediaRecorder = null;
  let chunks: Blob[] = [];
  let listening = false;

  const clearFrameTimer = () => {
    if (frameTimer != null) {
      clearInterval(frameTimer);
      frameTimer = null;
    }
  };

  const stopRecorder = () => {
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch {
        /* ignore */
      }
    }
  };

  return {
    async startListening(onFrame, frameMs = DEFAULT_FRAME_MS) {
      // getUserMedia rejection propagates to the caller intentionally.
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });

      try {
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const buf = new Uint8Array(analyser.frequencyBinCount);
        listening = true;

        frameTimer = setInterval(() => {
          try {
            if (!analyser) return;
            analyser.getByteTimeDomainData(buf);
            let sum = 0;
            for (const sample of buf) {
              const normalized = (sample - 128) / 128;
              sum += normalized * normalized;
            }
            const rms = Math.sqrt(sum / buf.length);
            onFrame(rms);
          } catch {
            /* never throw from the frame loop */
          }
        }, frameMs);
      } catch {
        // If the analyser setup fails, listening still proceeds without frames
        // rather than throwing; teardown will clean up the stream.
        listening = true;
      }
    },

    beginUtterance() {
      try {
        if (!stream) return;
        chunks = [];
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (event: BlobEvent) => {
          if (event.data && event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        recorder.start();
      } catch {
        /* never throw synchronously */
      }
    },

    endUtterance() {
      return new Promise<Blob>((resolve) => {
        const activeRecorder = recorder;
        const mimeType = (activeRecorder && activeRecorder.mimeType) || 'audio/webm';
        const collected = chunks;

        if (!activeRecorder || activeRecorder.state === 'inactive') {
          resolve(new Blob(collected, { type: mimeType }));
          return;
        }

        activeRecorder.onstop = () => {
          resolve(new Blob(collected, { type: mimeType }));
        };

        try {
          activeRecorder.stop();
        } catch {
          resolve(new Blob(collected, { type: mimeType }));
        }
      });
    },

    stop() {
      listening = false;
      clearFrameTimer();
      stopRecorder();
      recorder = null;

      if (audioContext) {
        try {
          audioContext.close();
        } catch {
          /* ignore */
        }
        audioContext = null;
      }
      analyser = null;
      source = null;

      if (stream) {
        try {
          stream.getTracks().forEach((track) => track.stop());
        } catch {
          /* ignore */
        }
        stream = null;
      }
    },

    isListening() {
      return listening;
    },
  };
};
