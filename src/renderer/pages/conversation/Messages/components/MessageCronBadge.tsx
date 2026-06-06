/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Clock } from 'lucide-react';
import type { CronMessageMeta } from '@/common/chat/chatLib';
import { iconColors } from '@/renderer/styles/colors';
import React from 'react';
import { useTranslation } from 'react-i18next';

type MessageCronBadgeProps = {
  meta: CronMessageMeta;
};

const formatTime = (timestamp: number, locale: string): string => {
  return new Date(timestamp).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const MessageCronBadge: React.FC<MessageCronBadgeProps> = ({ meta }) => {
  const { i18n } = useTranslation();

  return (
    <div
      className='inline-flex items-center gap-4px mb-4px px-12px py-2px rounded-full text-2 bg-fill-2'
      style={{ color: 'var(--color-bg-6)' }}
    >
      <Clock strokeWidth={4} size={13} color={iconColors.secondary} className='flex items-center' />
      <span>{formatTime(meta.triggeredAt, i18n.language)}</span>
    </div>
  );
};

export default MessageCronBadge;
