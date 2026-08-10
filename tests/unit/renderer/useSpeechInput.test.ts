// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  appendSpeechTranscript,
  getSpeechInputAvailabilityForEnvironment,
  mapSpeechInputError,
  pickRecordingMimeType,
  useSpeechInput,
} from '@/renderer/hooks/system/useSpeechInput';

const mockTranscribeAudioBlob = vi.fn();

vi.mock('@/renderer/services/SpeechToTextService', () => ({
  transcribeAudioBlob: (...args: unknown[]) => mockTranscribeAudioBlob(...args),
}));

vi.mock('@/renderer/utils/platform', () => ({
  isElectronDesktop: () => false,
}));

/**
 * Scripted analyser. `getByteTimeDomainData` writes a square wave whose
 * amplitude is exactly the RMS the detector will compute, so a test can drive a
 * precise loudness envelope tick by tick.
 */
const installScriptedAnalyser = () => {
  let level = 0;

  class MockAnalyser {
    fftSize = 128;
    smoothingTimeConstant = 0.82;
    getByteTimeDomainData(data: Uint8Array) {
      const offset = Math.round(level * 128);
      for (let index = 0; index < data.length; index += 1) {
        data[index] = 128 + (index % 2 === 0 ? offset : -offset);
      }
    }
    disconnect() {}
  }

  class MockAudioContext {
    state = 'running';
    async resume() {
      this.state = 'running';
    }
    createAnalyser() {
      return new MockAnalyser();
    }
    createMediaStreamSource() {
      return { connect: () => undefined, disconnect: () => undefined };
    }
    async close() {}
  }

  vi.stubGlobal('AudioContext', MockAudioContext);
  return {
    /** Set the RMS the analyser will report from the next tick onwards. */
    setLevel: (next: number) => {
      level = next;
    },
  };
};

const installRecordingEnvironment = ({ getUserMedia }: { getUserMedia: () => Promise<MediaStream> }) => {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia,
    },
  });

  class MockMediaRecorder {
    static isTypeSupported(mimeType: string) {
      return mimeType === 'audio/webm';
    }

    public mimeType: string;
    public ondataavailable: ((event: { data: Blob }) => void) | null = null;
    public onerror: (() => void) | null = null;
    public onstop: (() => void) | null = null;
    public state = 'inactive';

    constructor(_stream: MediaStream, options?: { mimeType?: string }) {
      this.mimeType = options?.mimeType ?? 'audio/webm';
    }

    start() {
      this.state = 'recording';
    }

    stop() {
      this.state = 'inactive';
      this.ondataavailable?.({
        data: new Blob(['recorded-audio'], { type: this.mimeType }),
      });
      this.onstop?.();
    }
  }

  vi.stubGlobal('MediaRecorder', MockMediaRecorder);
};

describe('mapSpeechInputError', () => {
  it('maps STT_FLUX_PREMIUM_LOCKED to premium-locked (not unknown)', () => {
    expect(mapSpeechInputError(new Error('STT_FLUX_PREMIUM_LOCKED'))).toBe('premium-locked');
  });

  it('maps STT_FLUX_AUTH_ERROR to auth-error', () => {
    expect(mapSpeechInputError(new Error('STT_FLUX_AUTH_ERROR'))).toBe('auth-error');
  });

  it('maps STT_RATE_LIMITED to rate-limited', () => {
    expect(mapSpeechInputError(new Error('STT_RATE_LIMITED'))).toBe('rate-limited');
  });

  it('maps STT_FLUX_NOT_CONFIGURED to not-configured', () => {
    expect(mapSpeechInputError(new Error('STT_FLUX_NOT_CONFIGURED'))).toBe('not-configured');
  });

  it('falls through to unknown for unrecognised error messages', () => {
    expect(mapSpeechInputError(new Error('STT_SOMETHING_UNKNOWN'))).toBe('unknown');
  });
});

describe('appendSpeechTranscript', () => {
  it('appends trimmed speech text on a new line when base content exists', () => {
    expect(appendSpeechTranscript('hello', '  world  ')).toBe('hello\nworld');
  });

  it('ignores empty speech text', () => {
    expect(appendSpeechTranscript('hello', '   ')).toBe('hello');
  });
});

describe('getSpeechInputAvailabilityForEnvironment', () => {
  it('returns record when recording APIs are available in a secure context', () => {
    expect(
      getSpeechInputAvailabilityForEnvironment({
        hasFileInput: true,
        hasMediaDevices: true,
        hasMediaRecorder: true,
        hostname: 'example.com',
        isElectronDesktop: false,
        isSecureContext: true,
      })
    ).toBe('record');
  });

  it('falls back to file when live recording is unavailable', () => {
    expect(
      getSpeechInputAvailabilityForEnvironment({
        hasFileInput: true,
        hasMediaDevices: false,
        hasMediaRecorder: false,
        hostname: 'example.com',
        isElectronDesktop: false,
        isSecureContext: false,
      })
    ).toBe('file');
  });
});

describe('pickRecordingMimeType', () => {
  afterEach(() => {
    mockTranscribeAudioBlob.mockReset();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('returns the first supported recording mime type', () => {
    vi.stubGlobal('MediaRecorder', {
      isTypeSupported: vi.fn((mimeType: string) => mimeType === 'audio/webm'),
    });

    expect(pickRecordingMimeType()).toBe('audio/webm');
  });

  it('returns an empty string when MediaRecorder is unavailable', () => {
    vi.stubGlobal('MediaRecorder', undefined);

    expect(pickRecordingMimeType()).toBe('');
  });
});

describe('useSpeechInput', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('starts in file mode when live recording APIs are unavailable', () => {
    const { result } = renderHook(() =>
      useSpeechInput({
        locale: 'en-US',
        onTranscript: vi.fn(),
      })
    );

    expect(result.current.availability).toBe('file');
    expect(result.current.status).toBe('idle');
  });

  it('returns the transcript and clears transient error state after a successful file transcription', async () => {
    const onTranscript = vi.fn();
    mockTranscribeAudioBlob.mockResolvedValueOnce({ text: 'hello from speech' });

    const { result } = renderHook(() =>
      useSpeechInput({
        locale: 'en-US',
        onTranscript,
      })
    );

    await act(async () => {
      await result.current.transcribeFile(new Blob(['audio'], { type: 'audio/webm' }));
    });

    expect(onTranscript).toHaveBeenCalledWith('hello from speech');
    expect(result.current.status).toBe('idle');
    expect(result.current.errorCode).toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });

  it('surfaces an empty transcript as a recoverable warning state', async () => {
    mockTranscribeAudioBlob.mockResolvedValueOnce({ text: '   ' });

    const { result } = renderHook(() =>
      useSpeechInput({
        locale: 'en-US',
        onTranscript: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.transcribeFile(new Blob(['audio'], { type: 'audio/webm' }));
    });

    expect(result.current.status).toBe('error');
    expect(result.current.errorCode).toBe('empty-transcript');
    expect(result.current.errorMessage).toBeNull();
  });

  it('extracts a concrete provider message when transcription requests fail', async () => {
    mockTranscribeAudioBlob.mockRejectedValueOnce(new Error('STT_REQUEST_FAILED: model overloaded'));

    const { result } = renderHook(() =>
      useSpeechInput({
        locale: 'en-US',
        onTranscript: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.transcribeFile(new Blob(['audio'], { type: 'audio/webm' }));
    });

    expect(result.current.status).toBe('error');
    expect(result.current.errorCode).toBe('transcription-failed');
    expect(result.current.errorMessage).toBe('model overloaded');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.errorCode).toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });

  it('keeps the detailed error empty for generic transcription failures', async () => {
    mockTranscribeAudioBlob.mockRejectedValueOnce(new Error('STT_NETWORK_ERROR'));

    const { result } = renderHook(() =>
      useSpeechInput({
        locale: 'en-US',
        onTranscript: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.transcribeFile(new Blob(['audio'], { type: 'audio/webm' }));
    });

    expect(result.current.status).toBe('error');
    expect(result.current.errorCode).toBe('network');
    expect(result.current.errorMessage).toBeNull();
  });

  it('reports recording unsupported when recording is requested without live capture support', async () => {
    const { result } = renderHook(() =>
      useSpeechInput({
        locale: 'en-US',
        onTranscript: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.errorCode).toBe('recording-unsupported');
    expect(result.current.errorMessage).toBeNull();
  });

  it('records audio and transcribes it when live recording is available', async () => {
    vi.useFakeTimers();
    const stopTrack = vi.fn();
    const onTranscript = vi.fn();
    mockTranscribeAudioBlob.mockResolvedValueOnce({ text: 'recorded result' });
    installRecordingEnvironment({
      getUserMedia: vi.fn(async () => ({
        getTracks: () => [{ stop: stopTrack }],
      })) as unknown as () => Promise<MediaStream>,
    });

    const { result } = renderHook(() =>
      useSpeechInput({
        locale: 'en-US',
        onTranscript,
      })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.availability).toBe('record');
    expect(result.current.status).toBe('recording');
    act(() => {
      vi.advanceTimersByTime(320);
    });
    expect(result.current.recordingDurationMs).toBeGreaterThan(0);
    expect(result.current.recordingLevels).toHaveLength(40);

    await act(async () => {
      result.current.stopRecording();
    });

    await act(async () => {
      await Promise.resolve();
    });
    expect(onTranscript).toHaveBeenCalledWith('recorded result');
    expect(result.current.status).toBe('idle');
    expect(result.current.errorMessage).toBeNull();
    expect(stopTrack).toHaveBeenCalled();
  });

  it('cancels a recording without transcribing or emitting a turn', async () => {
    const transcriptionCallCount = mockTranscribeAudioBlob.mock.calls.length;
    const stopTrack = vi.fn();
    const onTranscript = vi.fn();
    installRecordingEnvironment({
      getUserMedia: vi.fn(async () => ({
        getTracks: () => [{ stop: stopTrack }],
      })) as unknown as () => Promise<MediaStream>,
    });

    const { result } = renderHook(() =>
      useSpeechInput({
        locale: 'en-US',
        onTranscript,
      })
    );

    await act(async () => {
      await result.current.startRecording();
    });
    act(() => {
      result.current.cancelRecording();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.status).toBe('idle');
    expect(mockTranscribeAudioBlob).toHaveBeenCalledTimes(transcriptionCallCount);
    expect(onTranscript).not.toHaveBeenCalled();
    expect(stopTrack).toHaveBeenCalled();
  });

  describe('endpointing', () => {
    const TICK_MS = 80;

    type Handlers = {
      onSpeechEnd: ReturnType<typeof vi.fn>;
      onNoSpeech: ReturnType<typeof vi.fn>;
      onEndpointingUnavailable: ReturnType<typeof vi.fn>;
    };

    /**
     * `omitEndpointing` leaves the option off the object entirely so the hook's
     * own default is what is under test. A destructuring default cannot express
     * this - it also fires for an explicit `undefined`.
     */
    const startCapture = async ({ omitEndpointing = false }: { omitEndpointing?: boolean } = {}) => {
      vi.useFakeTimers();
      const analyser = installScriptedAnalyser();
      installRecordingEnvironment({
        getUserMedia: vi.fn(async () => ({
          getTracks: () => [{ stop: vi.fn() }],
        })) as unknown as () => Promise<MediaStream>,
      });

      const handlers: Handlers = {
        onSpeechEnd: vi.fn(),
        onNoSpeech: vi.fn(),
        onEndpointingUnavailable: vi.fn(),
      };

      const { result } = renderHook(() =>
        useSpeechInput({
          locale: 'en-US',
          onTranscript: vi.fn(),
          ...(omitEndpointing ? {} : { endpointing: true }),
          ...handlers,
        })
      );

      await act(async () => {
        await result.current.startRecording();
      });

      /** Hold `level` for `ms` of the 80 ms detector ticks. */
      const hold = (level: number, ms: number) => {
        analyser.setLevel(level);
        act(() => {
          vi.advanceTimersByTime(ms);
        });
      };

      return { handlers, hold, result };
    };

    // Room tone 0.008 -> noiseFloor 0.008 -> speechThreshold 0.024, silence 0.0144.
    const ROOM = 0.008;
    const SPEECH = 0.05;
    const SILENCE = 0.005;
    const CALIBRATION_MS = 4 * TICK_MS;

    it('does not end a short utterance on a silence shorter than the hangover', async () => {
      const { handlers, hold } = await startCapture();

      hold(ROOM, CALIBRATION_MS);
      hold(SPEECH, 640); // arms: 640 ms > 400 ms minimum
      // 1120 ms is past the standard 1000 ms hangover but inside the 1400 ms one
      // a sub-1500 ms utterance earns, which is the "Um, so..." case.
      hold(SILENCE, 1120);

      expect(handlers.onSpeechEnd).not.toHaveBeenCalled();

      hold(SILENCE, 320); // 1440 ms total clears 1400 ms

      expect(handlers.onSpeechEnd).toHaveBeenCalledOnce();
    });

    it('ends a full-length utterance after sustained silence', async () => {
      const { handlers, hold } = await startCapture();

      hold(ROOM, CALIBRATION_MS);
      hold(SPEECH, 1600); // > 1500 ms, so the standard 1000 ms hangover applies
      hold(SILENCE, 880);
      expect(handlers.onSpeechEnd).not.toHaveBeenCalled();

      hold(SILENCE, 160);
      expect(handlers.onSpeechEnd).toHaveBeenCalledOnce();
    });

    it('survives a mid-sentence thinking pause without cutting the speaker off', async () => {
      const { handlers, hold } = await startCapture();

      hold(ROOM, CALIBRATION_MS);
      hold(SPEECH, 640);
      hold(SILENCE, 320); // "so, um..."
      hold(SPEECH, 640);
      hold(SILENCE, 320);
      hold(SPEECH, 640);

      expect(handlers.onSpeechEnd).not.toHaveBeenCalled();
    });

    it('ignores a transient below the arming minimum and discards the capture instead of submitting it', async () => {
      const transcriptionCallCount = mockTranscribeAudioBlob.mock.calls.length;
      const { handlers, hold } = await startCapture();

      hold(ROOM, CALIBRATION_MS);
      hold(SPEECH, 80); // a click, not speech
      hold(SILENCE, 8000);

      expect(handlers.onSpeechEnd).not.toHaveBeenCalled();
      expect(handlers.onNoSpeech).toHaveBeenCalledOnce();
      // An empty blob would surface `empty-transcript` and strand the caller.
      expect(mockTranscribeAudioBlob).toHaveBeenCalledTimes(transcriptionCallCount);
    });

    it('endpoints a quiet speaker against a quiet floor', async () => {
      const { handlers, hold } = await startCapture();

      hold(0.006, CALIBRATION_MS);
      hold(0.025, 640); // barely above the 0.02 threshold floor
      expect(handlers.onSpeechEnd).not.toHaveBeenCalled();

      hold(0.003, 1440);
      expect(handlers.onSpeechEnd).toHaveBeenCalledOnce();
    });

    /**
     * REPLACES 'refuses to endpoint in a noisy room rather than chopping the
     * turn', which asserted the opposite and was the defect in test form.
     *
     * A flat, loud calibration window is acoustically identical whether it came
     * from a noisy room or from a user who started answering before the mic
     * reopened, so no in-window statistic can separate them. In continuous mode
     * the mic reopens `AUTO_CAPTURE_GRACE_MS` (350 ms) after the assistant stops
     * and the median human turn-taking gap is shorter than that, so the second
     * reading is the common one. Guessing "noisy room" switched the detector off
     * for the whole capture, which also removed the no-speech timeout and the
     * hard cap: the microphone then never closed at all.
     */
    it('treats a loud calibration window as speech already in progress, not as a dead room', async () => {
      const { handlers, hold } = await startCapture();

      hold(0.04, CALIBRATION_MS);
      expect(handlers.onEndpointingUnavailable).not.toHaveBeenCalled();

      hold(SPEECH, 640);
      hold(SILENCE, 1440);
      expect(handlers.onSpeechEnd).toHaveBeenCalledOnce();
    });

    // The headline continuous-mode case: no silent lead-in whatsoever.
    it('endpoints normally when the user is already speaking as the mic reopens', async () => {
      const { handlers, hold } = await startCapture();

      hold(SPEECH, CALIBRATION_MS); // the answer is already under way
      hold(SPEECH, 1600);
      expect(handlers.onSpeechEnd).not.toHaveBeenCalled();

      hold(SILENCE, 1040);
      expect(handlers.onSpeechEnd).toHaveBeenCalledOnce();
      expect(handlers.onEndpointingUnavailable).not.toHaveBeenCalled();
      expect(handlers.onNoSpeech).not.toHaveBeenCalled();
    });

    /**
     * "Yes", "no", "go ahead" are what people actually say hands-free, and in
     * continuous mode they start before the mic reopens. The calibration window
     * has to be carried in as speech or the whole answer sits under the 400 ms
     * arming minimum and is discarded.
     */
    it('does not discard a short answer that mostly landed inside the calibration window', async () => {
      const { handlers, hold } = await startCapture();

      hold(SPEECH, CALIBRATION_MS); // already under way when the mic reopened
      hold(SPEECH, TICK_MS); // ...and it ends 80 ms later
      hold(SILENCE, 1440);

      expect(handlers.onSpeechEnd).toHaveBeenCalledOnce();
      expect(handlers.onNoSpeech).not.toHaveBeenCalled();
    });

    // Silent data loss: deriving the bar from a contaminated floor (x3, clamped
    // to 0.06) put the arming threshold above the speaker's own voice, so the
    // capture never armed and `onNoSpeech` discarded a complete answer.
    it('does not discard a quiet speaker who answers immediately', async () => {
      const { handlers, hold } = await startCapture();

      hold(0.0234, CALIBRATION_MS); // a quiet voice, inside the speech band
      hold(0.0234, 5000);
      hold(0.005, 1040);

      expect(handlers.onSpeechEnd).toHaveBeenCalledOnce();
      expect(handlers.onNoSpeech).not.toHaveBeenCalled();
    });

    // The floor is the quietest tick, not the loudest: one syllable cannot
    // redefine the room.
    it('ignores a single syllable inside the calibration window instead of taking it for the room', async () => {
      const { handlers, hold } = await startCapture();

      hold(ROOM, TICK_MS);
      hold(SPEECH, TICK_MS); // one 80 ms syllable
      hold(ROOM, 2 * TICK_MS);
      hold(SPEECH, 1600);
      hold(SILENCE, 1040);

      expect(handlers.onSpeechEnd).toHaveBeenCalledOnce();
      expect(handlers.onEndpointingUnavailable).not.toHaveBeenCalled();
    });

    /**
     * The sharp edge of taking the peak: a syllable in the window makes the
     * detector read the capture as speech already in progress, which carries
     * 320 ms of credit into the arming budget. An 80 ms click afterwards then
     * clears the 400 ms minimum and submits a click as a whole turn.
     */
    it('does not let a syllable inside the calibration window arm the detector for a later click', async () => {
      const { handlers, hold } = await startCapture();

      hold(ROOM, TICK_MS);
      hold(SPEECH, TICK_MS); // one syllable inside the window
      hold(ROOM, 2 * TICK_MS);
      hold(SPEECH, TICK_MS); // an 80 ms click, far under the 400 ms arming minimum
      hold(SILENCE, 1440);

      expect(handlers.onSpeechEnd).not.toHaveBeenCalled();
    });

    // Degraded endpointing must never cost the hard cap: that is what stops a
    // capture that can no longer measure silence from holding the mic forever.
    it('still force-stops at the hard cap when the calibration window was contaminated', async () => {
      const { handlers, hold } = await startCapture();

      hold(0.04, CALIBRATION_MS);
      hold(SPEECH, 29_000); // and the level never drops back under the silence bar
      expect(handlers.onSpeechEnd).not.toHaveBeenCalled();

      hold(SPEECH, 1000);
      expect(handlers.onSpeechEnd).toHaveBeenCalledOnce();
    });

    it('force-stops a runaway utterance at the hard cap', async () => {
      const { handlers, hold } = await startCapture();

      hold(ROOM, CALIBRATION_MS);
      hold(SPEECH, 29_000);
      expect(handlers.onSpeechEnd).not.toHaveBeenCalled();

      hold(SPEECH, 1000);
      expect(handlers.onSpeechEnd).toHaveBeenCalledOnce();
    });

    // The sendbox mic button and GuidPage pass no `endpointing` option at all;
    // they must keep the tap-to-stop contract.
    it('never endpoints when the caller has not opted in', async () => {
      const { handlers, hold } = await startCapture({ omitEndpointing: true });

      hold(ROOM, CALIBRATION_MS);
      hold(SPEECH, 1600);
      hold(SILENCE, 4000);

      expect(handlers.onSpeechEnd).not.toHaveBeenCalled();
      expect(handlers.onEndpointingUnavailable).not.toHaveBeenCalled();
    });
  });

  describe('acoustic barge-in monitoring', () => {
    const startMonitor = async ({ echoCancellation = true }: { echoCancellation?: boolean } = {}) => {
      vi.useFakeTimers();
      const analyser = installScriptedAnalyser();
      const stopTrack = vi.fn();
      installRecordingEnvironment({
        getUserMedia: vi.fn(async () => ({
          getTracks: () => [{ stop: stopTrack }],
          getAudioTracks: () => [{ stop: stopTrack, getSettings: () => ({ echoCancellation }) }],
        })) as unknown as () => Promise<MediaStream>,
      });

      const onBargeIn = vi.fn();
      const { result } = renderHook(() =>
        useSpeechInput({ locale: 'en-US', onTranscript: vi.fn(), onBargeIn })
      );

      await act(async () => {
        await result.current.startMonitoring();
      });

      const hold = (level: number, ms: number) => {
        analyser.setLevel(level);
        act(() => {
          vi.advanceTimersByTime(ms);
        });
      };

      return { hold, onBargeIn, result, stopTrack };
    };

    it('fires only after speech is sustained over the calibrated echo bar', async () => {
      const { hold, onBargeIn } = await startMonitor();

      hold(0.01, 6 * 80); // calibrate against the assistant's own bleed
      hold(0.2, 400); // 5 ticks - not yet 480 ms
      expect(onBargeIn).not.toHaveBeenCalled();

      hold(0.2, 80);
      expect(onBargeIn).toHaveBeenCalledOnce();
    });

    it('does not fire on the assistant talking to itself through loud speakers', async () => {
      const { hold, onBargeIn } = await startMonitor();

      // Heavy bleed during calibration raises the bar instead of tripping it.
      hold(0.09, 6 * 80);
      hold(0.09, 2000);

      expect(onBargeIn).not.toHaveBeenCalled();
    });

    it('refuses to monitor when the browser does not confirm echo cancellation', async () => {
      const { hold, onBargeIn, stopTrack } = await startMonitor({ echoCancellation: false });

      hold(0.4, 4000);

      expect(onBargeIn).not.toHaveBeenCalled();
      expect(stopTrack).toHaveBeenCalled();
    });
  });

  it('maps recording permission failures without exposing a stale detail message', async () => {
    installRecordingEnvironment({
      getUserMedia: vi.fn(async () => {
        throw new DOMException('Permission denied', 'NotAllowedError');
      }) as unknown as () => Promise<MediaStream>,
    });

    const { result } = renderHook(() =>
      useSpeechInput({
        locale: 'en-US',
        onTranscript: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.errorCode).toBe('permission-denied');
    expect(result.current.errorMessage).toBeNull();
  });
});
