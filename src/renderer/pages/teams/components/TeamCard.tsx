/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Users } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { CUSTOM_AVATAR_IMAGE_MAP } from '@/renderer/pages/guid/constants';
import type { AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';
import { resolveExtensionAssetUrl } from '@/renderer/utils/platform';
import { isImageAvatar } from '@/renderer/utils/avatar';
import styles from './TeamCard.module.css';

export type TeamCardProps = {
  team: AssistantListItem;
  localeKey: string;
  onLaunch: (team: AssistantListItem) => void;
};

const TeamCard: React.FC<TeamCardProps> = ({ team, localeKey, onLaunch }) => {
  const { t } = useTranslation();
  const isStanding = team._standing === true;
  const name = team.nameI18n?.[localeKey] || team.nameI18n?.['en-US'] || team.name || team.id;
  const description =
    team.descriptionI18n?.[localeKey] || team.descriptionI18n?.['en-US'] || team.description || '';
  const avatarValue = team.avatar?.trim();
  const mapped = avatarValue ? CUSTOM_AVATAR_IMAGE_MAP[avatarValue] : undefined;
  const resolved = avatarValue ? mapped || resolveExtensionAssetUrl(avatarValue) || avatarValue : undefined;
  const showImage = resolved ? isImageAvatar(resolved) : false;

  const teammateCount = team._teammates?.length ?? 0;
  const firstRitual = team._rituals && team._rituals.length > 0 ? team._rituals[0] : undefined;

  const handleClick = () => {
    onLaunch(team);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onLaunch(team);
    }
  };

  return (
    <div
      role='button'
      tabIndex={0}
      className={classNames(styles.card, isStanding && styles.cardStanding)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-testid={`team-card-${team.id}`}
      data-card-variant={isStanding ? 'standing' : 'team'}
      aria-label={name}
    >
      {isStanding && (
        <span className={styles.standingBadge} aria-hidden='true'>
          <span className={styles.standingBadgeDot} />
          {t('teams.standingBadge', { defaultValue: 'Standing' })}
        </span>
      )}
      <div className={styles.cardHeader}>
        <div className={styles.avatar}>
          {showImage && resolved ? (
            <img src={resolved} alt='' />
          ) : avatarValue ? (
            <span>{avatarValue}</span>
          ) : (
            <Users size={18} />
          )}
        </div>
        <div className={styles.nameRow}>
          <span
            className={classNames(styles.typeDot, isStanding && styles.typeDotStanding)}
            aria-hidden='true'
          />
          <span className={styles.name} title={name}>
            {name}
          </span>
        </div>
      </div>
      {(teammateCount > 0 || firstRitual) && (
        <div className={styles.meta}>
          {teammateCount > 0 &&
            t('teams.card.rolesCount', {
              count: teammateCount,
              defaultValue: '{{count}} roles',
            })}
          {teammateCount > 0 && firstRitual ? ' · ' : ''}
          {firstRitual?.cadence ?? ''}
        </div>
      )}
      {description && <div className={styles.description}>{description}</div>}
    </div>
  );
};

export default TeamCard;
