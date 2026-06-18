/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Tooltip } from '@arco-design/web-react';
import { Phone, PhoneOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Enter/leave "call mode" (open-voice) for the active conversation. Sits
 *  beside the speaker toggle; PTT remains always available via the send box. */
export const MicModeControl: React.FC<{
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
}> = ({ active, onToggle, disabled }) => {
  const { t } = useTranslation();
  const label = active
    ? t('voice.endCall', { defaultValue: 'End voice call' })
    : t('voice.startCall', { defaultValue: 'Start voice call' });
  const Icon = active ? PhoneOff : Phone;

  return (
    <Tooltip content={label}>
      <button
        type='button'
        aria-label={label}
        aria-pressed={active}
        disabled={disabled}
        onClick={onToggle}
        className='flex items-center justify-center w-28px h-28px rd-6px hover:bg-[var(--color-fill-2)] text-t-secondary disabled:opacity-50'
      >
        <Icon size={16} className={active ? 'text-[var(--primary-6)]' : ''} />
      </button>
    </Tooltip>
  );
};
