/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AddTeammatePicker - modal picker over the specialist roster.
 *
 * Lists every assistant from `useAssistantList()` where `_kind === 'specialist'`
 * (the resolver prefixes their IDs with `ext-`). The caller passes the
 * already-selected specialist IDs in `excludeIds` so duplicates are filtered.
 *
 * Selection fires `onPick(specialistId)` which the parent uses to either set
 * the leader (when `mode === 'leader'`) or push a new RosterEntry (mode 'teammate').
 */

import React, { useMemo, useState } from 'react';
import { Button, Input } from '@arco-design/web-react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import WaylandModal from '@renderer/components/base/WaylandModal';
import type { AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';

export type AddTeammatePickerProps = {
  visible: boolean;
  onClose: () => void;
  onPick: (specialistId: string) => void;
  specialists: AssistantListItem[];
  excludeIds: string[];
  localeKey: string;
  mode?: 'leader' | 'teammate';
};

const AddTeammatePicker: React.FC<AddTeammatePickerProps> = ({
  visible,
  onClose,
  onPick,
  specialists,
  excludeIds,
  localeKey,
  mode = 'teammate',
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const excluded = new Set(excludeIds);
    const q = query.trim().toLowerCase();
    return specialists.filter((s) => {
      if (excluded.has(s.id)) return false;
      if (!q) return true;
      const name = (s.nameI18n?.[localeKey] || s.nameI18n?.['en-US'] || s.name || s.id).toLowerCase();
      const desc = (
        s.descriptionI18n?.[localeKey] ||
        s.descriptionI18n?.['en-US'] ||
        s.description ||
        ''
      ).toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [specialists, excludeIds, query, localeKey]);

  const handlePick = (id: string) => {
    onPick(id);
    setQuery('');
  };

  const handleCancel = () => {
    setQuery('');
    onClose();
  };

  const title =
    mode === 'leader'
      ? t('teams.launcher.pickLeader', { defaultValue: 'Pick a specialist as team leader' })
      : t('teams.launcher.pickerTitle', { defaultValue: 'Add a teammate' });

  return (
    <WaylandModal
      visible={visible}
      onCancel={handleCancel}
      style={{ width: 480 }}
      autoFocus={false}
      unmountOnExit
      maskStyle={{ zIndex: 9999 }}
      wrapStyle={{ zIndex: 10000 }}
      contentStyle={{
        background: 'var(--dialog-fill-0)',
        maxHeight: 'min(72vh, 640px)',
        overflow: 'hidden',
      }}
      header={{
        render: () => (
          <div className='flex items-center justify-between border-b border-border-1 bg-dialog-fill-0 px-20px py-16px'>
            <h3 className='m-0 text-16px font-500 text-t-primary'>{title}</h3>
            <Button
              type='text'
              icon={<X size={18} className='text-t-secondary' />}
              onClick={handleCancel}
              className='!h-28px !w-28px !min-w-28px !p-0 !rd-6px hover:!bg-fill-1'
              aria-label={t('teams.launcher.pickerCancel', { defaultValue: 'Cancel' })}
            />
          </div>
        ),
      }}
      footer={null}
    >
      <div className='flex flex-col gap-12px px-20px py-16px' data-testid='teams-launcher-picker'>
        <Input
          allowClear
          placeholder={t('teams.launcher.pickerSearch', { defaultValue: 'Search specialists' })}
          value={query}
          onChange={setQuery}
          data-testid='teams-launcher-picker-search'
        />
        <div
          className='flex flex-col gap-4px overflow-y-auto'
          style={{ maxHeight: 440 }}
          data-testid='teams-launcher-picker-list'
        >
          {filtered.length === 0 ? (
            <div className='py-32px text-center text-13px text-t-tertiary'>
              {t('teams.launcher.pickerEmpty', { defaultValue: 'No specialists found.' })}
            </div>
          ) : (
            filtered.map((s) => {
              const name = s.nameI18n?.[localeKey] || s.nameI18n?.['en-US'] || s.name || s.id;
              const desc =
                s.descriptionI18n?.[localeKey] ||
                s.descriptionI18n?.['en-US'] ||
                s.description ||
                '';
              const handleKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handlePick(s.id);
                }
              };
              return (
                <div
                  key={s.id}
                  role='button'
                  tabIndex={0}
                  className='flex flex-col items-start gap-2px rounded-8px border border-transparent px-12px py-10px text-left hover:border-border-2 hover:bg-fill-1'
                  onClick={() => handlePick(s.id)}
                  onKeyDown={handleKey}
                  data-testid={`teams-launcher-picker-option-${s.id}`}
                >
                  <span className='text-13.5px font-500 text-t-primary'>{name}</span>
                  {desc && (
                    <span className='line-clamp-2 text-11.5px text-t-tertiary'>{desc}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </WaylandModal>
  );
};

export default AddTeammatePicker;
