/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Spin } from '@arco-design/web-react';
import { BookOpenText, Pencil, Plus, SlashSquare, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, EmptyState, ConfirmDialog } from '@renderer/components/settings/shared';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';
import { useExtensionAcronyms, type ManagedAcronym } from '@renderer/hooks/chat/useExtensionAcronyms';
import { useUserAcronyms } from '@renderer/hooks/chat/useUserAcronyms';
import { useUserSlashCommands } from '@renderer/hooks/chat/useUserSlashCommands';
import type { AcronymLike, UserAcronymInput } from '@/common/chat/acronyms/userAcronyms';
import type { UserSlashCommand, UserSlashCommandInput } from '@/common/chat/slash/userCommands';
import AcronymEditorModal from './AcronymEditorModal';
import CommandEditorModal from './CommandEditorModal';

const SlashCommandsSettings: React.FC = () => {
  const { t } = useTranslation();
  const { commands, addCommand, editCommand, removeCommand } = useUserSlashCommands();
  const { acronyms, isLoading: acronymsLoading } = useExtensionAcronyms();
  const { addAcronym, editAcronym, removeAcronym } = useUserAcronyms();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<UserSlashCommand | null>(null);
  const [deleting, setDeleting] = useState<UserSlashCommand | null>(null);
  const [acronymEditorOpen, setAcronymEditorOpen] = useState(false);
  const [editingAcronym, setEditingAcronym] = useState<ManagedAcronym | null>(null);
  const [deletingAcronym, setDeletingAcronym] = useState<ManagedAcronym | null>(null);

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

  const acronymValidationItems: AcronymLike[] = acronyms.map((item) => ({
    id: item._userAcronymId ?? item.id,
    acronym: item.acronym,
    sourceId: item._sourceId,
  }));

  const openCreateAcronym = () => {
    setEditingAcronym(null);
    setAcronymEditorOpen(true);
  };

  const openEditAcronym = (item: ManagedAcronym) => {
    setEditingAcronym(item);
    setAcronymEditorOpen(true);
  };

  const handleSaveAcronym = async (input: UserAcronymInput) => {
    if (editingAcronym?._userAcronymId) {
      await editAcronym(editingAcronym._userAcronymId, input, acronymValidationItems);
      return;
    }
    await addAcronym(input, acronymValidationItems);
  };

  const handleDeleteAcronym = async () => {
    if (!deletingAcronym) return;
    if (deletingAcronym._userAcronymId && deletingAcronym._source !== 'override') {
      await removeAcronym(deletingAcronym._userAcronymId);
    } else if (deletingAcronym._userAcronymId) {
      await editAcronym(
        deletingAcronym._userAcronymId,
        {
          acronym: deletingAcronym.acronym,
          expansion: deletingAcronym.expansion,
          description: deletingAcronym.description,
          enabled: false,
          sourceId: deletingAcronym._sourceId,
        },
        acronymValidationItems
      );
    } else {
      await addAcronym(
        {
          acronym: deletingAcronym.acronym,
          expansion: deletingAcronym.expansion,
          description: deletingAcronym.description,
          enabled: false,
          sourceId: deletingAcronym.id,
        },
        acronymValidationItems
      );
    }
    setDeletingAcronym(null);
  };

  return (
    <SettingsPageShell
      title={t('settings.slashCommands.title', { defaultValue: 'Slash Commands' })}
      subtitle={t('settings.slashCommands.subtitle', {
        defaultValue: 'Define /commands and review extension-provided acronyms that expand in chat.',
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

      <section className='mt-20px flex flex-col gap-12px'>
        <div className='flex items-center justify-between gap-12px'>
          <div className='min-w-0'>
            <div className='text-15px font-semibold text-t-primary'>
              {t('settings.slashCommands.acronymsTitle', { defaultValue: 'Acronyms' })}
            </div>
            <div className='text-13px text-t-secondary'>
              {t('settings.slashCommands.acronymsSubtitle', {
                defaultValue: 'Extension-provided plain-text shortcuts that expand before a message is sent.',
              })}
            </div>
          </div>
          <div className='flex shrink-0 items-center gap-8px'>
            <div className='rounded-999px bg-fill-2 px-8px py-3px text-12px text-t-secondary'>{acronyms.length}</div>
            <Button size='small' type='primary' icon={<Plus size={15} />} onClick={openCreateAcronym}>
              {t('settings.slashCommands.createAcronym', { defaultValue: 'New acronym' })}
            </Button>
          </div>
        </div>

        {acronymsLoading ? (
          <Card>
            <div className='flex items-center gap-10px text-13px text-t-secondary'>
              <Spin size={16} />
              {t('common.loading', { defaultValue: 'Loading...' })}
            </div>
          </Card>
        ) : acronyms.length === 0 ? (
          <EmptyState
            icon={BookOpenText}
            title={t('settings.slashCommands.noAcronymsTitle', { defaultValue: 'No acronyms installed' })}
            body={t('settings.slashCommands.noAcronymsBody', {
              defaultValue: 'Installed extensions can contribute acronyms like EIB or WWA.',
            })}
          />
        ) : (
          <div className='grid grid-cols-1 gap-12px lg:grid-cols-2'>
            {acronyms.map((item) => (
              <Card key={item.id}>
                <div className='flex items-start gap-12px'>
                  <div className='flex h-34px min-w-46px items-center justify-center rounded-8px bg-fill-2 px-8px text-13px font-semibold text-t-primary'>
                    {item.acronym}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='text-14px font-medium text-t-primary'>{item.expansion}</div>
                    {item.description && (
                      <div className='mt-3px text-12px leading-18px text-t-secondary'>{item.description}</div>
                    )}
                    <div className='mt-8px flex flex-wrap items-center gap-6px'>
                      <span className='rounded-999px bg-fill-2 px-7px py-2px text-11px text-t-secondary'>
                        {item._source === 'custom'
                          ? t('settings.slashCommands.customProvided', { defaultValue: 'Custom' })
                          : `${t('settings.slashCommands.extensionProvided', { defaultValue: 'Extension' })}: ${
                              item._extensionName
                            }`}
                      </span>
                      {item._source === 'override' && (
                        <span className='rounded-999px bg-fill-2 px-7px py-2px text-11px text-t-secondary'>
                          {t('settings.slashCommands.localOverride', { defaultValue: 'Local override' })}
                        </span>
                      )}
                      {item.enabled === false && (
                        <span className='rounded-999px bg-warning-1 px-7px py-2px text-11px text-warning-6'>
                          {t('common.disabled', { defaultValue: 'Disabled' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className='flex items-center gap-4px shrink-0'>
                    <Button
                      type='text'
                      size='small'
                      icon={<Pencil size={15} />}
                      aria-label={t('common.edit', { defaultValue: 'Edit' })}
                      onClick={() => openEditAcronym(item)}
                    />
                    <Button
                      type='text'
                      size='small'
                      status='danger'
                      icon={<Trash2 size={15} />}
                      aria-label={t('common.delete', { defaultValue: 'Delete' })}
                      onClick={() => setDeletingAcronym(item)}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <CommandEditorModal
        open={editorOpen}
        editing={editing}
        existing={commands}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
      />

      <AcronymEditorModal
        open={acronymEditorOpen}
        editing={editingAcronym}
        existing={acronymValidationItems}
        onClose={() => setAcronymEditorOpen(false)}
        onSave={handleSaveAcronym}
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

      <ConfirmDialog
        open={deletingAcronym !== null}
        onClose={() => setDeletingAcronym(null)}
        onConfirm={handleDeleteAcronym}
        icon={Trash2}
        destructive
        title={t('settings.slashCommands.deleteAcronymTitle', { defaultValue: 'Delete acronym' })}
        body={t('settings.slashCommands.deleteAcronymBody', {
          defaultValue: 'Delete {{name}}? This removes it from acronym expansion.',
          name: deletingAcronym?.acronym ?? '',
        })}
        confirmLabel={t('common.delete', { defaultValue: 'Delete' })}
      />
    </SettingsPageShell>
  );
};

export default SlashCommandsSettings;
