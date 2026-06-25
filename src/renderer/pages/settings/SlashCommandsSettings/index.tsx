/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button } from '@arco-design/web-react';
import { Pencil, Plus, SlashSquare, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, EmptyState, ConfirmDialog } from '@renderer/components/settings/shared';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';
import { useUserSlashCommands } from '@renderer/hooks/chat/useUserSlashCommands';
import type { UserSlashCommand, UserSlashCommandInput } from '@/common/chat/slash/userCommands';
import CommandEditorModal from './CommandEditorModal';

const SlashCommandsSettings: React.FC = () => {
  const { t } = useTranslation();
  const { commands, addCommand, editCommand, removeCommand } = useUserSlashCommands();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<UserSlashCommand | null>(null);
  const [deleting, setDeleting] = useState<UserSlashCommand | null>(null);

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (command: UserSlashCommand) => {
    setEditing(command);
    setEditorOpen(true);
  };

  const handleSave = async (input: UserSlashCommandInput) => {
    if (editing) {
      await editCommand(editing.id, input);
    } else {
      await addCommand(input);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await removeCommand(deleting.id);
    setDeleting(null);
  };

  return (
    <SettingsPageShell
      title={t('settings.slashCommands.title', { defaultValue: 'Slash Commands' })}
      subtitle={t('settings.slashCommands.subtitle', {
        defaultValue: 'Define your own /commands that expand into prompt templates.',
      })}
      actions={
        <Button type='primary' icon={<Plus size={16} />} onClick={openCreate}>
          {t('settings.slashCommands.create', { defaultValue: 'New command' })}
        </Button>
      }
    >
      {commands.length === 0 ? (
        <EmptyState
          icon={SlashSquare}
          title={t('settings.slashCommands.emptyTitle', { defaultValue: 'No custom commands yet' })}
          body={t('settings.slashCommands.emptyBody', {
            defaultValue:
              'Create a command and it appears in the slash menu when you type / in any chat, alongside your agent’s commands.',
          })}
          actionLabel={t('settings.slashCommands.create', { defaultValue: 'New command' })}
          onAction={openCreate}
        />
      ) : (
        <div className='flex flex-col gap-12px'>
          {commands.map((command) => (
            <Card key={command.id}>
              <div className='flex items-start gap-12px'>
                <div className='min-w-0 flex-1 flex flex-col gap-2px'>
                  <div className='text-14px font-medium text-t-primary'>/{command.name}</div>
                  {command.description && <div className='text-13px text-t-secondary'>{command.description}</div>}
                  <div className='text-12px text-t-tertiary line-clamp-2 whitespace-pre-wrap mt-2px'>
                    {command.template}
                  </div>
                </div>
                <div className='flex items-center gap-4px shrink-0'>
                  <Button
                    type='text'
                    size='small'
                    icon={<Pencil size={15} />}
                    aria-label={t('common.edit', { defaultValue: 'Edit' })}
                    onClick={() => openEdit(command)}
                  />
                  <Button
                    type='text'
                    size='small'
                    status='danger'
                    icon={<Trash2 size={15} />}
                    aria-label={t('common.delete', { defaultValue: 'Delete' })}
                    onClick={() => setDeleting(command)}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CommandEditorModal
        open={editorOpen}
        editing={editing}
        existing={commands}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        icon={Trash2}
        destructive
        title={t('settings.slashCommands.deleteTitle', { defaultValue: 'Delete command' })}
        body={t('settings.slashCommands.deleteBody', {
          defaultValue: 'Delete /{{name}}? This cannot be undone.',
          name: deleting?.name ?? '',
        })}
        confirmLabel={t('common.delete', { defaultValue: 'Delete' })}
      />
    </SettingsPageShell>
  );
};

export default SlashCommandsSettings;
