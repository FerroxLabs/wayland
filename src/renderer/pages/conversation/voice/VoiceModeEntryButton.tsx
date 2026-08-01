/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button } from '@arco-design/web-react';
import { AudioWaveform } from 'lucide-react';
import React from 'react';
import { openVoiceMode } from './voiceTurnBridge';

type VoiceModeEntryButtonProps = {
  conversationId: string;
  disabled?: boolean;
  placement?: 'composer' | 'header';
};

const VoiceModeEntryButton: React.FC<VoiceModeEntryButtonProps> = ({
  conversationId,
  disabled = false,
  placement = 'composer',
}) => {
  const label = 'Start Voice conversation';

  if (placement === 'header') {
    return (
      <button
        type='button'
        className='voice-mode-entry'
        disabled={disabled}
        onClick={() => openVoiceMode(conversationId)}
        aria-label={label}
        title='Voice conversation'
      >
        <AudioWaveform size={17} />
      </button>
    );
  }

  return (
    <Button
      type='text'
      size='small'
      shape='circle'
      className='voice-mode-composer-entry'
      disabled={disabled}
      onClick={() => openVoiceMode(conversationId)}
      aria-label={label}
      title='Voice conversation · same chat, spoken aloud'
      icon={<AudioWaveform size={18} aria-hidden='true' />}
    />
  );
};

export default VoiceModeEntryButton;
