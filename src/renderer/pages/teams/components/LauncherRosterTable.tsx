/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * LauncherRosterTable - editable roster table for the team launcher.
 *
 * Renders one row per RosterEntry (leader first, then teammates). Each row
 * shows specialist identity, slot-name input, per-row backend pill, and a
 * remove button. The footer hosts "+ Add teammate" which opens the picker
 * (parent-controlled visibility).
 *
 * Pure presentational - state is owned by TeamLauncherPage.
 */

import React from 'react';
import { Button, Input } from '@arco-design/web-react';
import { Crown, Plus, Trash2 } from 'lucide-react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import Avatar from '@/renderer/components/base/Avatar';
import AssistantIconTile from '@/renderer/pages/guid/components/AssistantIconTile';
import { resolveSpecialistPalette } from './teamPalette';
import type { AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';
import BackendPill from './BackendPill';
import styles from './LauncherRosterTable.module.css';

export type RosterEntry = {
  specialistId: string;
  backend: string;
  slotName: string;
};

export type RosterRowMeta = {
  /** True when this entry occupies the leader slot (always rendered first). */
  isLeader: boolean;
  /** The specialist record; undefined if the bundle reference is stale. */
  specialist: AssistantListItem | undefined;
};

export type LauncherRosterTableProps = {
  leader: RosterEntry | null;
  teammates: RosterEntry[];
  backendOptions: string[];
  specialistsById: Map<string, AssistantListItem>;
  localeKey: string;
  onChangeLeaderBackend: (backend: string) => void;
  onChangeLeaderSlotName: (slotName: string) => void;
  onRemoveLeader: () => void;
  onChangeTeammateBackend: (index: number, backend: string) => void;
  onChangeTeammateSlotName: (index: number, slotName: string) => void;
  onRemoveTeammate: (index: number) => void;
  onAddTeammate: () => void;
  onPickLeader: () => void;
};

const resolveSpecialistName = (
  specialist: AssistantListItem | undefined,
  localeKey: string,
  fallbackId: string
): string => {
  if (!specialist) return fallbackId;
  return specialist.nameI18n?.[localeKey] || specialist.nameI18n?.['en-US'] || specialist.name || specialist.id;
};

const resolveSpecialistDesc = (specialist: AssistantListItem | undefined, localeKey: string): string => {
  if (!specialist) return '';
  return (
    specialist.descriptionI18n?.[localeKey] ||
    specialist.descriptionI18n?.['en-US'] ||
    specialist.description ||
    ''
  );
};

type RowProps = {
  entry: RosterEntry;
  index: number;
  isLeader: boolean;
  specialist: AssistantListItem | undefined;
  backendOptions: string[];
  localeKey: string;
  onChangeBackend: (backend: string) => void;
  onChangeSlotName: (slotName: string) => void;
  onRemove: () => void;
};

const RosterRow: React.FC<RowProps> = ({
  entry,
  index,
  isLeader,
  specialist,
  backendOptions,
  localeKey,
  onChangeBackend,
  onChangeSlotName,
  onRemove,
}) => {
  const { t } = useTranslation();
  const name = resolveSpecialistName(specialist, localeKey, entry.specialistId);
  const desc = resolveSpecialistDesc(specialist, localeKey);
  const testIdSuffix = isLeader ? 'leader' : `teammate-${index}`;

  const palette = resolveSpecialistPalette(specialist, entry.specialistId);
  return (
    <div
      className={classNames(styles.row, isLeader && styles.rowLeader)}
      data-testid={`launcher-row-${testIdSuffix}`}
      data-specialist-id={entry.specialistId}
      data-is-leader={isLeader ? 'true' : undefined}
    >
      <AssistantIconTile paletteKey={palette} size='md' className={styles.avatarTile}>
        <Avatar avatar={specialist?.avatar} name={name} />
      </AssistantIconTile>
      <div className={styles.identity}>
        <div className={styles.nameLine}>
          <span>{name}</span>
          {isLeader ? (
            <span className={styles.leaderTag} data-testid='launcher-leader-tag'>
              <Crown size={10} aria-hidden='true' />
              <span>{t('teams.launcher.leaderRoleLabel', { defaultValue: 'Leader' })}</span>
            </span>
          ) : (
            <span className={styles.roleTag}>
              {t('teams.launcher.teammateRoleLabel', { defaultValue: 'Teammate' })}
            </span>
          )}
          {!specialist && (
            <span className={styles.roleTag}>
              {t('teams.launcher.specialistNotFound', { defaultValue: '(missing specialist)' })}
            </span>
          )}
        </div>
        {desc && <div className={styles.description}>{desc}</div>}
      </div>
      <div className={styles.controls}>
        <Input
          className={styles.slotInput}
          size='small'
          value={entry.slotName}
          onChange={onChangeSlotName}
          placeholder={t('teams.launcher.slotNamePlaceholder', { defaultValue: 'Slot name (optional)' })}
          data-testid={`launcher-slotname-${testIdSuffix}`}
          aria-label={t('teams.launcher.slotNameLabel', { defaultValue: 'Display name' })}
        />
        <BackendPill
          value={entry.backend}
          options={backendOptions}
          onChange={onChangeBackend}
          testId={`launcher-backend-${testIdSuffix}`}
        />
        <Button
          type='text'
          size='mini'
          className={styles.removeBtn}
          icon={<Trash2 size={14} />}
          onClick={onRemove}
          data-testid={`launcher-remove-${testIdSuffix}`}
          aria-label={t('teams.launcher.remove', { defaultValue: 'Remove' })}
        />
      </div>
    </div>
  );
};

const LauncherRosterTable: React.FC<LauncherRosterTableProps> = ({
  leader,
  teammates,
  backendOptions,
  specialistsById,
  localeKey,
  onChangeLeaderBackend,
  onChangeLeaderSlotName,
  onRemoveLeader,
  onChangeTeammateBackend,
  onChangeTeammateSlotName,
  onRemoveTeammate,
  onAddTeammate,
  onPickLeader,
}) => {
  const { t } = useTranslation();

  return (
    <div className={styles.card} data-testid='launcher-roster-card'>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>
          {t('teams.launcher.rosterTitle', { defaultValue: 'Roster' })}
        </span>
        <span className={styles.cardSubtitle}>
          {t('teams.launcher.rosterSubtitle', { defaultValue: 'Backends chosen per role' })}
        </span>
      </div>

      {leader ? (
        <RosterRow
          entry={leader}
          index={-1}
          isLeader
          specialist={specialistsById.get(leader.specialistId)}
          backendOptions={backendOptions}
          localeKey={localeKey}
          onChangeBackend={onChangeLeaderBackend}
          onChangeSlotName={onChangeLeaderSlotName}
          onRemove={onRemoveLeader}
        />
      ) : (
        <div className={styles.emptyRow} data-testid='launcher-no-leader'>
          <Button type='text' size='small' onClick={onPickLeader} data-testid='launcher-pick-leader'>
            <Plus size={14} /> {t('teams.launcher.pickLeader', { defaultValue: 'Pick a specialist as team leader' })}
          </Button>
        </div>
      )}

      {teammates.map((entry, index) => (
        <RosterRow
          key={`${entry.specialistId}-${index}`}
          entry={entry}
          index={index}
          isLeader={false}
          specialist={specialistsById.get(entry.specialistId)}
          backendOptions={backendOptions}
          localeKey={localeKey}
          onChangeBackend={(backend) => onChangeTeammateBackend(index, backend)}
          onChangeSlotName={(slotName) => onChangeTeammateSlotName(index, slotName)}
          onRemove={() => onRemoveTeammate(index)}
        />
      ))}

      {leader && teammates.length === 0 && (
        <div className={styles.emptyRow} data-testid='launcher-no-teammates'>
          {t('teams.launcher.emptyRoster', { defaultValue: 'No teammates yet.' })}
        </div>
      )}

      <Button
        type='outline'
        size='small'
        className={styles.addBtn}
        icon={<Plus size={14} />}
        onClick={onAddTeammate}
        data-testid='launcher-add-teammate'
      >
        {t('teams.launcher.addTeammate', { defaultValue: 'Add teammate' })}
      </Button>

      <div className={styles.tip}>
        {t('teams.launcher.rosterTip', {
          defaultValue: 'Tip - leaving teammates empty makes this a solo-leader team.',
        })}
      </div>
    </div>
  );
};

export default LauncherRosterTable;
