/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input, Modal, Message } from '@arco-design/web-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  validateAcronym,
  type AcronymLike,
  type AcronymValidationError,
  type UserAcronymInput,
} from '@/common/chat/acronyms/userAcronyms';
import type { ManagedAcronym } from '@renderer/hooks/chat/useExtensionAcronyms';

type Props = {
  open: boolean;
  editing: ManagedAcronym | null;
  existing: readonly AcronymLike[];
  onClose: () => void;
  onSave: (input: UserAcronymInput) => Promise<void>;
};

const ACRONYM_ERROR_KEY: Record<AcronymValidationError, string> = {
  empty: 'settings.slashCommands.acronymError.empty',
  tooLong: 'settings.slashCommands.acronymError.tooLong',
  invalidChars: 'settings.slashCommands.acronymError.invalidChars',
  duplicate: 'settings.slashCommands.acronymError.duplicate',
};

const AcronymEditorModal: React.FC<Props> = ({ open, editing, existing, onClose, onSave }) => {
  const { t } = useTranslation();
  const [acronym, setAcronym] = useState('');
  const [expansion, setExpansion] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAcronym(editing?.acronym ?? '');
    setExpansion(editing?.expansion ?? '');
    setDescription(editing?.description ?? '');
    setSaving(false);
  }, [open, editing]);

  const acronymValidation = useMemo(
    () => validateAcronym(acronym, existing, editing?.id, editing?._sourceId ?? editing?.id),
    [acronym, existing, editing]
  );

  const acronymError =
    acronymValidation.valid === false && acronym.trim().length > 0
      ? t(ACRONYM_ERROR_KEY[acronymValidation.reason], { defaultValue: 'Invalid acronym' })
      : undefined;

  const canSave = acronymValidation.valid && expansion.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave({
        acronym: acronym.trim(),
        expansion: expansion.trim(),
        description: description.trim(),
        enabled: true,
        sourceId: editing?._source === 'extension' ? editing.id : editing?._sourceId,
      });
      onClose();
    } catch (err) {
      console.error('[AcronymEditorModal] save failed:', err);
      Message.error(t('settings.slashCommands.acronymSaveError', { defaultValue: 'Could not save acronym' }));
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={open}
      onCancel={onClose}
      title={
        editing
          ? t('settings.slashCommands.editAcronymTitle', { defaultValue: 'Edit acronym' })
          : t('settings.slashCommands.createAcronymTitle', { defaultValue: 'New acronym' })
      }
      footer={
        <div className='flex justify-end gap-8px'>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type='primary' loading={saving} disabled={!canSave} onClick={handleSave}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <div className='flex flex-col gap-16px'>
        <div className='flex flex-col gap-4px'>
          <div className='text-13px font-medium text-t-primary'>
            {t('settings.slashCommands.acronymLabel', { defaultValue: 'Acronym' })}
          </div>
          <Input
            value={acronym}
            onChange={setAcronym}
            placeholder={t('settings.slashCommands.acronymPlaceholder', { defaultValue: 'WWA' })}
            status={acronymError ? 'error' : undefined}
            maxLength={32}
          />
          {acronymError ? (
            <div className='text-12px text-[var(--danger)]'>{acronymError}</div>
          ) : (
            <div className='text-12px text-t-tertiary'>
              {t('settings.slashCommands.acronymHelp', {
                defaultValue: 'Letters, digits, hyphen, underscore. Must start with a letter.',
              })}
            </div>
          )}
        </div>

        <div className='flex flex-col gap-4px'>
          <div className='text-13px font-medium text-t-primary'>
            {t('settings.slashCommands.expansionLabel', { defaultValue: 'Expansion' })}
          </div>
          <Input
            value={expansion}
            onChange={setExpansion}
            placeholder={t('settings.slashCommands.expansionPlaceholder', {
              defaultValue: 'Where We At',
            })}
            maxLength={160}
          />
        </div>

        <div className='flex flex-col gap-4px'>
          <div className='text-13px font-medium text-t-primary'>
            {t('settings.slashCommands.descriptionLabel', { defaultValue: 'Description' })}
          </div>
          <Input.TextArea
            value={description}
            onChange={setDescription}
            autoSize={{ minRows: 3, maxRows: 8 }}
            placeholder={t('settings.slashCommands.acronymDescriptionPlaceholder', {
              defaultValue: 'Optional extra instruction appended after the expansion.',
            })}
          />
        </div>
      </div>
    </Modal>
  );
};

export default AcronymEditorModal;
