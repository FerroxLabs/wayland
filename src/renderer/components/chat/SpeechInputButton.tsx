/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import { ConfigStorage } from '@/common/config/storage';
import { Message, Button, Tooltip } from '@arco-design/web-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useSpeechInput,
  type SpeechInputAvailability,
  type SpeechInputErrorCode,
} from '@/renderer/hooks/system/useSpeechInput';

type SpeechInputButtonProps = {
  disabled?: boolean;
  locale?: string;
  onTranscript: (transcript: string) => void;
  /**
   * 'prominent' renders the mic as a tier-1 affordance (brand-tinted) and
   * enables hold-⌥Space push-to-talk. Used on the new-chat Launch Pad surface.
   */
  variant?: 'default' | 'prominent';
};

const SpeechMicIcon = () => (
  <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden='true'>
    <path d='M12 3a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3Z' />
    <path d='M19 10v2a7 7 0 0 1-14 0v-2' />
    <path d='M12 19v3' />
  </svg>
);

const SpeechStopIcon = () => (
  <svg width='18' height='18' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
    <rect x='6' y='6' width='12' height='12' rx='2.5' />
  </svg>
);

const SpeechLoaderIcon = () => <span className='speech-loader-spinner' aria-hidden='true' />;

const SPEECH_TO_TEXT_CONFIG_CHANGED_EVENT = 'wayland:speech-to-text-config-changed';

/**
 * Where an unconfigured mic sends the user.
 *
 * A hash assignment rather than `useNavigate`: this button is a leaf rendered
 * from several composers, and a router hook throws outright anywhere it is
 * mounted outside a `<Router>`. The orb learned that the expensive way.
 */
const OPEN_VOICE_SETTINGS_HASH = '#/settings/voice';

const getAvailabilityMessageKey = (availability: SpeechInputAvailability) => {
  switch (availability) {
    case 'file':
      return 'conversation.chat.speech.pickFileTooltip';
    case 'unsupported':
      return 'conversation.chat.speech.unsupported';
    default:
      return 'conversation.chat.speech.recordTooltip';
  }
};

export const getErrorMessageKey = (errorCode: SpeechInputErrorCode) => {
  switch (errorCode) {
    case 'audio-capture':
      return 'conversation.chat.speech.audioCaptureError';
    case 'auth-error':
      return 'conversation.chat.speech.authError';
    case 'empty-transcript':
      return 'conversation.chat.speech.emptyTranscript';
    case 'file-too-large':
      return 'conversation.chat.speech.fileTooLarge';
    case 'network':
      return 'conversation.chat.speech.networkError';
    case 'not-configured':
      return 'conversation.chat.speech.notConfigured';
    case 'permission-denied':
      return 'conversation.chat.speech.permissionDenied';
    case 'premium-locked':
      return 'conversation.chat.speech.premiumLocked';
    case 'rate-limited':
      return 'conversation.chat.speech.rateLimited';
    case 'recording-unsupported':
      return 'conversation.chat.speech.recordingUnsupported';
    case 'transcription-failed':
      return 'conversation.chat.speech.transcriptionFailed';
    case 'aborted':
    case 'unknown':
    default:
      return 'conversation.chat.speech.genericError';
  }
};

const formatSpeechDuration = (durationMs: number): string => {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const getTooltipKey = (availability: SpeechInputAvailability, isListening: boolean, isProcessing: boolean) => {
  if (isProcessing) {
    return 'conversation.chat.speech.processing';
  }
  if (isListening) {
    return 'conversation.chat.speech.stopTooltip';
  }
  if (availability === 'record') {
    return 'conversation.chat.speech.recordTooltip';
  }
  return getAvailabilityMessageKey(availability);
};

const SpeechInputButton: React.FC<SpeechInputButtonProps> = ({
  disabled,
  locale,
  onTranscript,
  variant = 'default',
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSpeechToTextEnabled, setIsSpeechToTextEnabled] = useState(false);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const {
    availability,
    clearError,
    errorCode,
    errorMessage,
    recordingDurationMs,
    recordingLevels,
    startRecording,
    status,
    stopRecording,
    transcribeFile,
  } = useSpeechInput({
    locale,
    onTranscript,
  });

  const isRecording = status === 'recording';
  const isProcessing = status === 'transcribing';
  const showSpeechFeedback = isRecording || isProcessing;
  const displayedWaveformLevels = useMemo(() => {
    if (recordingLevels.length > 0) {
      return recordingLevels;
    }
    return [0.08, 0.12, 0.1, 0.16, 0.09, 0.14];
  }, [recordingLevels]);

  useEffect(() => {
    let cancelled = false;

    const syncSpeechToTextEnabled = async () => {
      try {
        const config = await ConfigStorage.get('tools.speechToText');
        if (cancelled) {
          return;
        }
        setIsSpeechToTextEnabled(Boolean(config?.enabled));
      } catch {
        if (cancelled) {
          return;
        }
        setIsSpeechToTextEnabled(false);
      } finally {
        if (!cancelled) {
          setIsConfigLoaded(true);
        }
      }
    };

    const handleConfigChanged = () => {
      void syncSpeechToTextEnabled();
    };

    void syncSpeechToTextEnabled();
    window.addEventListener(SPEECH_TO_TEXT_CONFIG_CHANGED_EVENT, handleConfigChanged);

    return () => {
      cancelled = true;
      window.removeEventListener(SPEECH_TO_TEXT_CONFIG_CHANGED_EVENT, handleConfigChanged);
    };
  }, []);

  useEffect(() => {
    if (!errorCode) {
      return;
    }

    const baseMessage = t(getErrorMessageKey(errorCode));
    const detail = errorMessage?.trim();
    if (errorCode === 'empty-transcript') {
      Message.warning(baseMessage);
      clearError();
      return;
    }
    Message.error(detail ? `${baseMessage}: ${detail}` : baseMessage);
    clearError();
  }, [clearError, errorCode, errorMessage, t]);

  const handleClick = () => {
    if (disabled) {
      return;
    }

    if (!isSpeechToTextEnabled) {
      // Route to settings; never flip `enabled` from here. The stored default is
      // {enabled:false, provider:'openai'} while an UNSET provider transcribes
      // on-device, so a click that quietly enabled dictation would move the user
      // from local Whisper to a hosted service they never chose.
      if (typeof window !== 'undefined') {
        window.location.hash = OPEN_VOICE_SETTINGS_HASH;
      }
      return;
    }

    if (availability === 'unsupported') {
      Message.warning(t(getAvailabilityMessageKey(availability)));
      return;
    }

    if (isRecording) {
      stopRecording();
      return;
    }

    if (availability === 'file') {
      fileInputRef.current?.click();
      return;
    }

    void startRecording();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    void transcribeFile(file);
  };

  // Still resolving: render nothing rather than flash a button whose meaning we
  // do not know yet. Disabled dictation, by contrast, now RENDERS - returning
  // null there meant most users saw two composer affordances where the design
  // assumed three, and the missing one was the only on-ramp to the feature.
  if (!isConfigLoaded) {
    return null;
  }

  const needsSetup = !isSpeechToTextEnabled;
  const ariaLabel = needsSetup
    ? t('conversation.chat.speech.setupLabel', { defaultValue: 'Set up dictation' })
    : t(getTooltipKey(availability, isRecording, isProcessing));
  const tooltipContent = needsSetup
    ? t('conversation.chat.speech.setupTooltip', {
        defaultValue: 'Dictation is off - open Voice settings to turn it on',
      })
    : ariaLabel;
  const icon = isRecording ? <SpeechStopIcon /> : isProcessing ? <SpeechLoaderIcon /> : <SpeechMicIcon />;

  return (
    <>
      <input
        ref={fileInputRef}
        type='file'
        accept='audio/*'
        capture='user'
        className='hidden'
        onChange={handleFileChange}
      />
      <div
        className={`speech-input-control ${variant === 'prominent' ? 'speech-input-control--prominent' : ''} ${showSpeechFeedback ? 'speech-input-control--active' : ''}`}
      >
        {showSpeechFeedback && (
          <div
            className={`speech-input-feedback ${isProcessing ? 'speech-input-feedback--processing' : ''}`}
            role='status'
            aria-live='polite'
          >
            <div className='speech-input-feedback__waveform' aria-hidden='true'>
              {displayedWaveformLevels.map((level, index) => (
                <span
                  key={`speech-wave-${index}`}
                  className='speech-input-feedback__bar'
                  style={{
                    height: `${Math.max(1.5, 1 + level * 18)}px`,
                    animationDelay: `${index * 40}ms`,
                  }}
                />
              ))}
            </div>
            <span className='speech-input-feedback__label'>
              {isProcessing
                ? t('conversation.chat.speech.transcribingShort')
                : formatSpeechDuration(recordingDurationMs)}
            </span>
          </div>
        )}
        <Tooltip content={tooltipContent} mini>
          <Button
            type='text'
            size='small'
            shape='circle'
            className={`speech-input-button ${variant === 'prominent' ? 'speech-input-button--prominent' : ''} ${isRecording ? 'speech-input-button--listening' : ''} ${isProcessing ? 'speech-input-button--processing' : ''} ${needsSetup ? 'speech-input-button--needs-setup' : ''}`}
            disabled={disabled || isProcessing}
            onClick={handleClick}
            aria-label={ariaLabel}
            icon={icon}
          />
        </Tooltip>
      </div>
    </>
  );
};

export default SpeechInputButton;
