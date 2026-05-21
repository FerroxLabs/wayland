/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bot, MoreHorizontal } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { CUSTOM_AVATAR_IMAGE_MAP } from '@/renderer/pages/guid/constants';
import type { AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';
import { resolveExtensionAssetUrl } from '@/renderer/utils/platform';
import { isImageAvatar } from '@/renderer/utils/avatar';
import { getLucideIcon } from '@/renderer/utils/lucideAvatar';
import styles from './AssistantCard.module.css';

export type AssistantCardType = 'team' | 'specialist' | 'builtin';

export type AssistantCardProps = {
  assistant: AssistantListItem;
  type: AssistantCardType;
  localeKey: string;
  onLaunch: (assistant: AssistantListItem) => void;
  onMenuClick: (assistant: AssistantListItem, anchorEl: HTMLElement) => void;
};

const AssistantCard: React.FC<AssistantCardProps> = ({ assistant, type, localeKey, onLaunch, onMenuClick }) => {
  const { t } = useTranslation();
  const name = assistant.nameI18n?.[localeKey] || assistant.nameI18n?.['en-US'] || assistant.name || assistant.id;
  const description =
    assistant.descriptionI18n?.[localeKey] || assistant.descriptionI18n?.['en-US'] || assistant.description || '';
  const avatarValue = assistant.avatar?.trim();
  const LucideIconComponent = getLucideIcon(avatarValue);
  const mapped = avatarValue && !LucideIconComponent ? CUSTOM_AVATAR_IMAGE_MAP[avatarValue] : undefined;
  const resolved =
    avatarValue && !LucideIconComponent ? mapped || resolveExtensionAssetUrl(avatarValue) || avatarValue : undefined;
  const showImage = resolved ? isImageAvatar(resolved) : false;

  const dotClass =
    type === 'team' ? styles.typeDotTeam : type === 'specialist' ? styles.typeDotSpecialist : styles.typeDotBuiltin;

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Don't launch when the click originated from the menu button
    if ((event.target as HTMLElement).closest(`.${styles.menuButton}`)) return;
    onLaunch(assistant);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onLaunch(assistant);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    onMenuClick(assistant, event.currentTarget);
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      onMenuClick(assistant, event.currentTarget);
    }
  };

  return (
    <div
      role='button'
      tabIndex={0}
      className={styles.card}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-testid={`assistant-card-${assistant.id}`}
      data-card-type={type}
      aria-label={name}
    >
      <div className={styles.cardHeader}>
        <div className={styles.avatar}>
          {LucideIconComponent ? (
            <LucideIconComponent size={18} className='text-[var(--color-text-2)]' />
          ) : showImage && resolved ? (
            <img src={resolved} alt='' style={{ filter: 'var(--avatar-img-filter, none)' }} />
          ) : avatarValue ? (
            <span>{avatarValue}</span>
          ) : (
            <Bot size={18} />
          )}
        </div>
        <div className={styles.nameRow}>
          <span className={classNames(styles.typeDot, dotClass)} aria-hidden='true' />
          <span className={styles.name} title={name}>
            {name}
          </span>
        </div>
      </div>
      {description && <div className={styles.description}>{description}</div>}
      <div
        role='button'
        tabIndex={0}
        aria-label={t('assistants.card.menuAria', { name, defaultValue: 'Open menu for {{name}}' })}
        className={styles.menuButton}
        onClick={handleMenuClick}
        onKeyDown={handleMenuKeyDown}
        data-testid={`assistant-card-menu-${assistant.id}`}
      >
        <MoreHorizontal size={16} />
      </div>
    </div>
  );
};

export default AssistantCard;
