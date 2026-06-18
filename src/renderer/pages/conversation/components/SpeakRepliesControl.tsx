/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo } from 'react';
import { Tooltip } from '@arco-design/web-react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ChatSpeakOverride } from '@/common/types/voiceChatPrefs';
import { resolveSpeakState } from '@/common/types/voiceChatPrefs';

/** Tri-state speaker toggle for the active conversation:
 *  inherit (follows system default) / on / off. */
export const SpeakRepliesControl: React.FC<{
  override: ChatSpeakOverride;
  systemDefault: boolean;
  onCycle: () => void;
}> = ({ override, systemDefault, onCycle }) => {
  const { t } = useTranslation();
  const effective = resolveSpeakState({ conversationId: 'x', systemDefault, prefs: { overrides: { x: override } } });

  const { Icon, label } = useMemo(() => {
    if (override === 'on') return { Icon: Volume2, label: t('voice.speakOn', { defaultValue: 'Reading replies aloud (on)' }) };
    if (override === 'off') return { Icon: VolumeX, label: t('voice.speakOff', { defaultValue: 'Not reading replies (off)' }) };
    return {
      Icon: Volume1,
      label: t('voice.speakInherit', {
        defaultValue: effective ? 'Reading replies aloud (default)' : 'Not reading replies (default)',
      }),
    };
  }, [override, effective, t]);

  return (
    <Tooltip content={label}>
      <button
        type='button'
        aria-label={label}
        onClick={onCycle}
        className='flex items-center justify-center w-28px h-28px rd-6px hover:bg-[var(--color-fill-2)] text-t-secondary'
      >
        <Icon size={16} className={override === 'off' ? 'opacity-50' : effective ? 'text-[var(--primary-6)]' : ''} />
      </button>
    </Tooltip>
  );
};
