import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let speechToTextEnabled = false;
let speechInputAvailability: 'record' | 'file' | 'unsupported' = 'record';
let speechInputStatus: 'idle' | 'recording' | 'transcribing' | 'error' = 'idle';
let speechInputRecordingDurationMs = 0;
let speechInputRecordingLevels = [0.12, 0.18, 0.24, 0.16];

const mockClearError = vi.fn();
const mockCancelRecording = vi.fn();
const mockStartRecording = vi.fn();
const mockStopRecording = vi.fn();
const mockTranscribeFile = vi.fn();
const mockMessageError = vi.fn();
const mockMessageWarning = vi.fn();
let speechInputErrorCode: string | null = null;
let speechInputErrorMessage: string | null = null;

const mockConfigSet = vi.fn(async () => undefined);
// 'pending' never resolves, standing in for the window before stored config
// arrives - the only case where the button is still allowed to render nothing.
let configResolution: 'resolved' | 'pending' | 'factory' = 'resolved';

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn((key: string) => {
      if (configResolution === 'pending') {
        return new Promise(() => {});
      }
      // Nothing stored at all: a genuine factory profile.
      if (configResolution === 'factory') {
        return Promise.resolve(undefined);
      }
      if (key === 'tools.speechToText') {
        // `origin: 'user'` because `speechToTextEnabled = false` here means "the
        // user switched dictation off", and that is now the only shape that can
        // mean it. A config with no origin reads as never-configured and is
        // re-seeded onto the on-device floor - see the factory-profile test at
        // the end of this file, which pins that separately.
        return Promise.resolve({ enabled: speechToTextEnabled, origin: 'user' });
      }
      return Promise.resolve(undefined);
    }),
    set: (...args: unknown[]) => mockConfigSet(...(args as [])),
  },
}));

vi.mock('@/renderer/hooks/system/useSpeechInput', () => ({
  useSpeechInput: () => ({
    availability: speechInputAvailability,
    cancelRecording: mockCancelRecording,
    clearError: mockClearError,
    errorCode: speechInputErrorCode,
    errorMessage: speechInputErrorMessage,
    recordingDurationMs: speechInputRecordingDurationMs,
    recordingLevels: speechInputRecordingLevels,
    startRecording: mockStartRecording,
    status: speechInputStatus,
    stopRecording: mockStopRecording,
    transcribeFile: mockTranscribeFile,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@arco-design/web-react', () => ({
  Button: ({ icon, children, ...props }: React.ComponentProps<'button'> & { icon?: React.ReactNode }) =>
    React.createElement('button', props, icon ?? children),
  Message: {
    error: (...args: unknown[]) => mockMessageError(...args),
    warning: (...args: unknown[]) => mockMessageWarning(...args),
  },
  Tooltip: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, {}, children),
}));

import SpeechInputButton, { getErrorMessageKey, legTooltip } from '@/renderer/components/chat/SpeechInputButton';
import type { VoiceFailureCause, VoiceLeg, VoiceLegStatus } from '@/common/voice/voiceReadiness';

/**
 * Hover copy is copy. Two branches of `legTooltip` used to interpolate the raw
 * failure slug - "Dictation is not available on this system (no-local-adapter)."
 * - which is a member of a TypeScript union printed at a user. This is the guard
 * that keeps every branch a sentence.
 */
describe('legTooltip never puts a slug or a code on the screen', () => {
  const statuses: ReadonlyArray<VoiceLegStatus> = [
    'ready',
    'warming',
    'preparing',
    'needsSetup',
    'unsupported',
    'failed',
  ];
  const causes: ReadonlyArray<VoiceFailureCause> = [
    'ok',
    'tts-disabled-by-user',
    'no-local-adapter',
    'kokoro-unavailable',
    'tts-needs-consent',
    'stt-disabled',
    'stt-unavailable',
    'stt-needs-consent',
    'audio-blocked',
    'local-engine-warming',
    'no-model-connected',
  ];

  it('renders a sentence for every status and cause pairing', () => {
    // Control: a non-empty product, so the loop is not vacuous.
    expect(statuses.length * causes.length).toBeGreaterThan(50);

    for (const status of statuses) {
      for (const cause of causes) {
        const leg: VoiceLeg = { direction: 'in', status, cause, provider: null, clickable: status === 'ready' };
        const copy = legTooltip(leg);

        // `ready` is the one branch that deliberately says nothing, because a
        // working control needs no explanation.
        if (status === 'ready') {
          expect(copy).toBe('');
          continue;
        }

        expect(copy.length).toBeGreaterThan(20);
        expect(copy.toLowerCase()).not.toContain('unknown');
        // Not the cause it was given, and not ANY cause: a tooltip that leaks a
        // different leg's slug is the same defect.
        for (const slug of causes) expect(copy).not.toContain(slug);
        // The exact shape the two broken branches produced: a slug in
        // parentheses at the end of an otherwise fine sentence. Hyphenated
        // ENGLISH ("on-device") is not a slug, so this targets the bracket.
        expect(copy).not.toMatch(/\([a-z]+(-[a-z]+)+\)/);
        // No error code left over from a bridge failure.
        expect(copy).not.toMatch(/\b[A-Z][A-Z0-9_]{4,}\b/);
      }
    }
  });
});

describe('getErrorMessageKey', () => {
  it('maps premium-locked to the premiumLocked i18n key (not genericError)', () => {
    expect(getErrorMessageKey('premium-locked')).toBe('conversation.chat.speech.premiumLocked');
  });

  it('maps auth-error to the authError i18n key', () => {
    expect(getErrorMessageKey('auth-error')).toBe('conversation.chat.speech.authError');
  });

  it('maps rate-limited to the rateLimited i18n key', () => {
    expect(getErrorMessageKey('rate-limited')).toBe('conversation.chat.speech.rateLimited');
  });

  it('maps not-configured to the notConfigured i18n key', () => {
    expect(getErrorMessageKey('not-configured')).toBe('conversation.chat.speech.notConfigured');
  });
});

describe('SpeechInputButton', () => {
  beforeEach(() => {
    speechToTextEnabled = false;
    configResolution = 'resolved';
    speechInputAvailability = 'record';
    speechInputStatus = 'idle';
    speechInputRecordingDurationMs = 0;
    speechInputRecordingLevels = [0.12, 0.18, 0.24, 0.16];
    speechInputErrorCode = null;
    speechInputErrorMessage = null;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /**
   * Inverted deliberately. This used to assert the button stayed hidden while
   * dictation was off, which is the shipped default - so most users saw two
   * composer affordances where the design assumed three, and the one they could
   * not see was the only route to turning dictation on. A feature reachable only
   * by users who already enabled it is not discoverable.
   */
  it('renders and routes to settings when speech-to-text is disabled', async () => {
    globalThis.location.hash = '';

    render(<SpeechInputButton onTranscript={vi.fn()} />);

    const button = await screen.findByRole('button', {
      name: 'conversation.chat.speech.setupLabel',
    });

    fireEvent.click(button);
    expect(globalThis.location.hash).toBe('#/settings/voice');
  });

  /**
   * The click must never flip `enabled` itself. Turning dictation back on is a
   * decision, and the button's job is to route to where the decision is made,
   * not to make it on the user's behalf.
   */
  it('never enables speech-to-text as a side effect of the click', async () => {
    render(<SpeechInputButton onTranscript={vi.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: 'conversation.chat.speech.setupLabel' }));

    expect(mockConfigSet).not.toHaveBeenCalled();
    expect(mockStartRecording).not.toHaveBeenCalled();
  });

  it('does not render at all until the stored config resolves', () => {
    // A button whose meaning is not yet known must not flash into the composer.
    configResolution = 'pending';

    render(<SpeechInputButton onTranscript={vi.fn()} />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders a microphone button when speech-to-text is enabled', async () => {
    speechToTextEnabled = true;

    render(<SpeechInputButton onTranscript={vi.fn()} />);

    const button = await screen.findByRole('button', {
      name: 'conversation.chat.speech.recordTooltip',
    });
    expect(button).toBeInTheDocument();
    expect(button.querySelector('svg')).not.toBeNull();
  });

  it('refreshes visibility when the speech-to-text config changes', async () => {
    render(<SpeechInputButton onTranscript={vi.fn()} />);

    // Was `queryByRole('button')` is null. That went vacuous the moment the
    // disabled state started rendering a button: `waitFor` succeeds on its first
    // synchronous check, which lands BEFORE the stored config resolves, so it
    // was asserting the not-yet-loaded state and would have passed no matter
    // what the disabled state did. Assert the disabled affordance instead.
    expect(await screen.findByRole('button', { name: 'conversation.chat.speech.setupLabel' })).toBeInTheDocument();

    speechToTextEnabled = true;

    await act(async () => {
      window.dispatchEvent(new CustomEvent('wayland:speech-to-text-config-changed'));
    });

    expect(
      await screen.findByRole('button', {
        name: 'conversation.chat.speech.recordTooltip',
      })
    ).toBeInTheDocument();
  });

  /**
   * The factory profile, which is the case the whole lane is about. A stored
   * config with no `origin` is indistinguishable from never having been
   * configured, so it resolves to the bundled on-device engine and the mic is
   * LIVE - not a setup prompt.
   */
  it('is immediately usable on a profile that has never been configured', async () => {
    configResolution = 'factory';

    render(<SpeechInputButton onTranscript={vi.fn()} />);

    const button = await screen.findByRole('button', { name: 'conversation.chat.speech.recordTooltip' });
    fireEvent.click(button);

    expect(mockStartRecording).toHaveBeenCalled();
    expect(mockConfigSet).not.toHaveBeenCalled();
  });

  it('shows the transcription detail when speech-to-text returns a concrete error', async () => {
    speechToTextEnabled = true;
    speechInputErrorCode = 'transcription-failed';
    speechInputErrorMessage = 'model overloaded';

    render(<SpeechInputButton onTranscript={vi.fn()} />);

    await waitFor(() => {
      expect(mockMessageError).toHaveBeenCalledWith('conversation.chat.speech.transcriptionFailed: model overloaded');
    });
    expect(mockClearError).toHaveBeenCalled();
  });

  it('shows the translated error without details when the provider does not return one', async () => {
    speechToTextEnabled = true;
    speechInputErrorCode = 'network';

    render(<SpeechInputButton onTranscript={vi.fn()} />);

    await waitFor(() => {
      expect(mockMessageError).toHaveBeenCalledWith('conversation.chat.speech.networkError');
    });
    expect(mockClearError).toHaveBeenCalled();
  });

  it('shows a warning when recording ends without a detectable transcript', async () => {
    speechToTextEnabled = true;
    speechInputErrorCode = 'empty-transcript';

    render(<SpeechInputButton onTranscript={vi.fn()} />);

    await waitFor(() => {
      expect(mockMessageWarning).toHaveBeenCalledWith('conversation.chat.speech.emptyTranscript');
    });
    expect(mockClearError).toHaveBeenCalled();
  });

  it('starts recording when the speech input button is clicked in record mode', async () => {
    speechToTextEnabled = true;

    render(<SpeechInputButton onTranscript={vi.fn()} />);

    const button = await screen.findByRole('button', {
      name: 'conversation.chat.speech.recordTooltip',
    });
    button.click();

    expect(mockStartRecording).toHaveBeenCalledTimes(1);
    expect(mockStopRecording).not.toHaveBeenCalled();
  });

  it('stops recording when clicked while a recording is in progress', async () => {
    speechToTextEnabled = true;
    speechInputStatus = 'recording';
    speechInputRecordingDurationMs = 42_000;

    render(<SpeechInputButton onTranscript={vi.fn()} />);

    const button = await screen.findByRole('button', {
      name: 'conversation.chat.speech.stopTooltip',
    });
    button.click();

    expect(mockStopRecording).toHaveBeenCalledTimes(1);
    expect(mockStartRecording).not.toHaveBeenCalled();
    expect(screen.getByText('0:42')).toBeInTheDocument();
  });

  it('shows a processing label and disables the button while transcribing', async () => {
    speechToTextEnabled = true;
    speechInputStatus = 'transcribing';
    speechInputRecordingLevels = [0.2, 0.28, 0.12, 0.18];

    render(<SpeechInputButton onTranscript={vi.fn()} />);

    const button = await screen.findByRole('button', {
      name: 'conversation.chat.speech.processing',
    });
    expect(button).toBeDisabled();
    expect(screen.getByText('conversation.chat.speech.transcribingShort')).toBeInTheDocument();
  });

  it('opens the file picker when only file upload is available', async () => {
    speechToTextEnabled = true;
    speechInputAvailability = 'file';

    render(<SpeechInputButton onTranscript={vi.fn()} />);

    const button = await screen.findByRole('button', {
      name: 'conversation.chat.speech.pickFileTooltip',
    });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    await act(async () => {
      fireEvent.click(button);
    });

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('forwards a chosen audio file to the transcription hook', async () => {
    speechToTextEnabled = true;
    speechInputAvailability = 'file';

    render(<SpeechInputButton onTranscript={vi.fn()} />);

    await screen.findByRole('button', {
      name: 'conversation.chat.speech.pickFileTooltip',
    });
    const file = new File(['audio'], 'sample.webm', { type: 'audio/webm' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    await act(async () => {
      Object.defineProperty(fileInput, 'files', {
        configurable: true,
        value: [file],
      });
      fireEvent.change(fileInput);
    });

    expect(mockTranscribeFile).toHaveBeenCalledWith(file);
  });

  it('shows an unsupported warning instead of starting recording when capture is unavailable', async () => {
    speechToTextEnabled = true;
    speechInputAvailability = 'unsupported';

    render(<SpeechInputButton onTranscript={vi.fn()} />);

    const button = await screen.findByRole('button', {
      name: 'conversation.chat.speech.unsupported',
    });
    button.click();

    expect(mockMessageWarning).toHaveBeenCalledWith('conversation.chat.speech.unsupported');
    expect(mockStartRecording).not.toHaveBeenCalled();
  });
});
