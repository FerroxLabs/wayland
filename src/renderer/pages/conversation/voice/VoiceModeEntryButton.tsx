/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button } from '@arco-design/web-react';
import { AudioWaveform } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useVoiceSessionSafe } from './VoiceSessionContext';
import { openVoiceMode } from './voiceTurnBridge';
import './voiceModeEntry.css';

type VoiceModeEntryButtonProps = {
  /**
   * Omitted on the new-chat page, where the conversation does not exist yet.
   * `onLaunch` is then the whole behaviour: create one, then arm voice.
   */
  conversationId?: string;
  disabled?: boolean;
  placement?: 'composer' | 'header';
  /** Launches voice where there is no conversation to start a session in. */
  onLaunch?: () => void;
};

/**
 * The composer's single door into a voice conversation, and back out of it.
 *
 * It is a toggle, not a start button. Once the orb stopped being a modal
 * overlay the composer became the only place a session is visible, so it has to
 * be the place a session can be STOPPED - otherwise the surface that starts a
 * continuously re-arming microphone offers no way to end it. The destructive
 * direction must never be the one with no exit.
 *
 * Entering also opens the microphone. Entry used to land in `listening` with the
 * mic closed, which is honest under an orb captioned "Tap to speak" and a lie
 * under a composer that says "Listening…". One tap, one meaning.
 */
const VoiceModeEntryButton: React.FC<VoiceModeEntryButtonProps> = ({
  conversationId,
  disabled = false,
  placement = 'composer',
  onLaunch,
}) => {
  const { t } = useTranslation();
  const session = useVoiceSessionSafe();
  const isActive = Boolean(session?.isActive);

  if (placement === 'header') {
    return (
      <button
        type='button'
        className='voice-mode-entry'
        disabled={disabled}
        onClick={() => (conversationId ? openVoiceMode(conversationId) : onLaunch?.())}
        aria-label={t('conversation.chat.voice.startLabel', { defaultValue: 'Talk with Wayland' })}
        title={t('conversation.chat.voice.startTitle', {
          defaultValue: 'Talk with Wayland — it answers out loud',
        })}
      >
        <AudioWaveform size={17} />
      </button>
    );
  }

  const label = isActive
    ? t('conversation.chat.voice.endLabel', { defaultValue: 'End voice conversation' })
    : t('conversation.chat.voice.startLabel', { defaultValue: 'Talk with Wayland' });

  return (
    <Button
      type='text'
      size='small'
      shape='circle'
      className={`voice-mode-composer-entry${isActive ? ' voice-mode-composer-entry--active' : ''}`}
      disabled={disabled}
      onClick={() => {
        if (!conversationId) {
          // New-chat page: there is nothing to start a session in yet, so the
          // caller creates the conversation and arms voice for its arrival.
          onLaunch?.();
          return;
        }
        if (!session) {
          // No provider on this surface: fall back to the open event, which is
          // exactly what this button did before it could see a session.
          openVoiceMode(conversationId);
          return;
        }
        if (session.isActive) session.end();
        else void session.begin({ thenListen: true });
      }}
      aria-label={label}
      title={
        isActive
          ? t('conversation.chat.voice.endTitle', { defaultValue: 'End the voice conversation' })
          : t('conversation.chat.voice.startTitle', { defaultValue: 'Talk with Wayland — it answers out loud' })
      }
      icon={<AudioWaveform size={18} aria-hidden='true' />}
    />
  );
};

export default VoiceModeEntryButton;
