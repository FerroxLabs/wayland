/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input, Modal, Message } from '@arco-design/web-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  extractTemplatePlaceholders,
  validateCommandName,
  type NameValidationError,
  type UserSlashCommand,
  type UserSlashCommandInput,
} from '@/common/chat/slash/userCommands';

type Props = {
  open: boolean;
  /** The command being edited, or null to create a new one. */
  editing: UserSlashCommand | null;
  /** All existing commands, for uniqueness validation. */
  existing: readonly UserSlashCommand[];
  onClose: () => void;
  onSave: (input: UserSlashCommandInput) => Promise<void>;
};

const NAME_ERROR_KEY: Record<NameValidationError, string> = {
  empty: 'settings.slashCommands.nameError.empty',
  tooLong: 'settings.slashCommands.nameError.tooLong',
  invalidChars: 'settings.slashCommands.nameError.invalidChars',
  reserved: 'settings.slashCommands.nameError.reserved',
  duplicate: 'settings.slashCommands.nameError.duplicate',
};

const CommandEditorModal: React.FC<Props> = ({ open, editing, existing, onClose, onSave }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? '');
    setDescription(editing?.description ?? '');
    setTemplate(editing?.template ?? '');
    setSaving(false);
  }, [open, editing]);

  const nameValidation = useMemo(() => validateCommandName(name, existing, editing?.id), [name, existing, editing?.id]);

  const nameError =
    nameValidation.valid === false && name.trim().length > 0
      ? t(NAME_ERROR_KEY[nameValidation.reason], { defaultValue: 'Invalid name' })
      : undefined;

  const detectedArgs = useMemo(() => extractTemplatePlaceholders(template), [template]);

  const canSave = nameValidation.valid && template.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        template,
        args: detectedArgs.length > 0 ? detectedArgs : undefined,
      });
      onClose();
    } catch (err) {
      console.error('[CommandEditorModal] save failed:', err);
      Message.error(t('settings.slashCommands.saveError', { defaultValue: 'Could not save command' }));
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={open}
      onCancel={onClose}
      title={
        editing
          ? t('settings.slashCommands.editTitle', { defaultValue: 'Edit command' })
          : t('settings.slashCommands.createTitle', { defaultValue: 'New command' })
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
            {t('settings.slashCommands.nameLabel', { defaultValue: 'Command name' })}
          </div>
          <Input
            value={name}
            onChange={setName}
            prefix='/'
            placeholder={t('settings.slashCommands.namePlaceholder', { defaultValue: 'standup' })}
            status={nameError ? 'error' : undefined}
            maxLength={32}
          />
          {nameError ? (
            <div className='text-12px text-[var(--danger)]'>{nameError}</div>
          ) : (
            <div className='text-12px text-t-tertiary'>
              {t('settings.slashCommands.nameHelp', {
                defaultValue: 'Letters, digits, hyphen, underscore. Must start with a letter.',
              })}
            </div>
          )}
        </div>

        <div className='flex flex-col gap-4px'>
          <div className='text-13px font-medium text-t-primary'>
            {t('settings.slashCommands.descriptionLabel', { defaultValue: 'Description' })}
          </div>
          <Input
            value={description}
            onChange={setDescription}
            placeholder={t('settings.slashCommands.descriptionPlaceholder', {
              defaultValue: 'Shown in the slash menu',
            })}
            maxLength={120}
          />
        </div>

        <div className='flex flex-col gap-4px'>
          <div className='text-13px font-medium text-t-primary'>
            {t('settings.slashCommands.templateLabel', { defaultValue: 'Prompt template' })}
          </div>
          <Input.TextArea
            value={template}
            onChange={setTemplate}
            autoSize={{ minRows: 4, maxRows: 12 }}
            placeholder={t('settings.slashCommands.templatePlaceholder', {
              defaultValue: 'Write the prompt this command expands into. Use {topic} for fill-in placeholders.',
            })}
          />
          <div className='text-12px text-t-tertiary'>
            {detectedArgs.length > 0
              ? t('settings.slashCommands.detectedArgs', {
                  defaultValue: 'Placeholders: {{args}}',
                  args: detectedArgs.join(', '),
                })
              : t('settings.slashCommands.templateHelp', {
                  defaultValue: 'Selecting the command inserts this text into the composer to edit and send.',
                })}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CommandEditorModal;
