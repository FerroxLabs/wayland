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
import { resolveVoiceLeg, type VoiceLeg } from '@/common/voice/voiceReadiness';
import { normalizeSpeechToTextConfig } from '@/common/voice/speechToTextConfig';
import './speechInput.css';

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
/** Where a no-model refusal routes. The same destination NoModelCtaCard uses. */
const OPEN_MODELS_SETTINGS_HASH = '#/settings/models';

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

/**
 * Hover copy for a leg that is not clickable. `warming` and `preparing` are on
 * their way to ready and say so; the rest name their cause. Nothing here is a
 * dead end and nothing here says "unknown".
 */
export const legTooltip = (leg: VoiceLeg): string => {
  switch (leg.status) {
    case 'warming':
      return 'The on-device voice model is still loading. It will be ready in a few seconds.';
    case 'preparing':
      return 'Getting audio ready. This takes a moment.';
    case 'needsSetup':
      return leg.cause === 'no-model-connected'
        ? 'No model is connected yet, so nothing can answer. Connect one in Models and Providers.'
        : 'Dictation needs a moment of setup. Check Voice settings.';
    case 'unsupported':
      return `Dictation is not available on this system (${leg.cause}).`;
    case 'failed':
      return `Dictation is unavailable (${leg.cause}).`;
    case 'ready':
    default:
      return '';
  }
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
  /**
   * The listening leg for THIS button.
   *
   * The composer mic previously had ZERO references to readiness: it took a
   * bare `disabled` prop from its parent and gated itself on `config.enabled`
   * alone. That is the wrong question - `enabled` says nothing about whether a
   * transcriber can actually run - and it is asked on the surface that IS the
   * shipped voice feature.
   */
  const [leg, setLeg] = useState<VoiceLeg | null>(null);
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
    leg: leg ?? undefined,
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
        // Through the normalizer, so a stored config that predates `origin`
        // lands on the same on-device floor the resolver assumes.
        setLeg(resolveVoiceLeg('in', { sttConfig: normalizeSpeechToTextConfig(config ?? undefined) }));
      } catch {
        if (cancelled) {
          return;
        }
        // A config read that failed is not a reason to hide the mic: the floor
        // needs no config at all.
        setLeg(resolveVoiceLeg('in', { sttConfig: normalizeSpeechToTextConfig(undefined) }));
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

    if (leg && !leg.clickable) {
      // No control may EVER be clickable into a dead end. `warming` and
      // `preparing` are transient and say so on hover rather than routing the
      // user somewhere they do not need to go; only a real setup gap routes.
      if (leg.status === 'warming' || leg.status === 'preparing') return;
      if (leg.status === 'needsSetup' && typeof window !== 'undefined') {
        window.location.hash = leg.cause === 'no-model-connected' ? OPEN_MODELS_SETTINGS_HASH : OPEN_VOICE_SETTINGS_HASH;
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

  const needsSetup = Boolean(leg && !leg.clickable);
  const ariaLabel = needsSetup
    ? t('conversation.chat.speech.setupLabel', { defaultValue: 'Set up dictation' })
    : t(getTooltipKey(availability, isRecording, isProcessing));
  // The leg's own sentence, not a generic "dictation is off": warming says it
  // is warming, no-model says no model. A tooltip that lies is a dead end with
  // extra steps.
  const tooltipContent = needsSetup && leg ? legTooltip(leg) : ariaLabel;
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
