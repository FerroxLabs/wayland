/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input } from '@arco-design/web-react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/renderer/hooks/context/AuthContext';
import { isElectronDesktop } from '@renderer/utils/platform';
import {
  deleteConstitutionSpecialistHttp,
  listConstitutionSpecialistsHttp,
  writeConstitutionSpecialistHttp,
  type ConstitutionEditGrant,
} from '@renderer/services/ConstitutionService';
import HostedEditAuthorization from './HostedEditAuthorization';
import SpecialistOverlayEditor from './SpecialistOverlayEditor';
import { constitutionAutosaveDraftKey, discardSerializedAutosaveDraft } from './useSerializedAutosave';

/** Client-side mirror of the bridge's ASSISTANT_ID_PATTERN. */
const ID_PATTERN = /^[A-Za-z0-9_-]+$/;

type SpecialistEntry = { id: string; bytes: number; revision?: string };

/**
 * Constitution settings section that manages per-specialist overlay files
 * (`~/.wayland/specialists/<id>.md`). Lists existing overlays and provides
 * create / edit / delete flows. Rendered below the core Constitution editor.
 */
const SpecialistOverlays: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isDesktop = isElectronDesktop();

  const [items, setItems] = useState<SpecialistEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  /** Assistant id of the overlay whose inline editor is open (one at a time). */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDirty, setEditingDirty] = useState(false);
  /** Assistant id awaiting a delete confirmation. */
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  /** Whether the inline add form is visible. */
  const [adding, setAdding] = useState(false);
  const [newId, setNewId] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    setLoadError(null);
    try {
      if (!isDesktop) {
        setItems(await listConstitutionSpecialistsHttp());
        return;
      }
      const api = window.electronAPI;
      if (!api?.listConstitutionSpecialists) {
        throw new Error('Specialist inventory is unavailable.');
      }
      setItems(await api.listConstitutionSpecialists());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Specialist overlays could not be loaded.');
    } finally {
      setLoaded(true);
    }
  }, [isDesktop]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleCreate = useCallback(
    async (hostedGrant?: ConstitutionEditGrant): Promise<void> => {
      const id = newId.trim();
      if (!ID_PATTERN.test(id)) {
        setAddError(
          t('settings.constitutionSpecialists.idInvalid', 'Use only letters, numbers, hyphens, and underscores.')
        );
        return;
      }
      if (items.some((entry) => entry.id === id)) {
        setAddError(t('settings.constitutionSpecialists.idDuplicate', 'An overlay with that ID already exists.'));
        return;
      }
      const result = isDesktop
        ? { ok: (await window.electronAPI?.writeConstitutionSpecialist?.(id, '')) ?? false }
        : hostedGrant
          ? await writeConstitutionSpecialistHttp(id, '', null, hostedGrant.token)
          : { ok: false };
      if (!result.ok) {
        setAddError(
          'reason' in result && result.reason === 'conflict'
            ? t(
                'settings.constitutionSpecialists.createConflict',
                'The overlay inventory changed. Refresh and try again.'
              )
            : t('settings.constitutionSpecialists.createFailed', 'The overlay could not be created. Try again.')
        );
        return;
      }
      setAdding(false);
      setNewId('');
      setAddError(null);
      await refresh();
      setEditingId(id);
    },
    [isDesktop, items, newId, refresh, t]
  );

  const handleDelete = useCallback(
    async (id: string, expectedRevision?: string): Promise<void> => {
      const result = isElectronDesktop()
        ? { ok: (await window.electronAPI?.deleteConstitutionSpecialist?.(id)) ?? false }
        : expectedRevision
          ? await deleteConstitutionSpecialistHttp(id, deletePassword, expectedRevision)
          : { ok: false };
      if (!result.ok) {
        setDeleteError(
          'reason' in result && result.reason === 'conflict'
            ? t(
                'settings.constitutionSpecialists.deleteConflict',
                'The overlay changed before deletion. Refresh the inventory and review it again.'
              )
            : t('settings.constitutionSpecialists.deleteFailed', 'The overlay could not be deleted. Try again.')
        );
        return;
      }
      setConfirmDeleteId(null);
      setDeletePassword('');
      setDeleteError(null);
      const draftKey = constitutionAutosaveDraftKey(`specialist:${id}`, isDesktop, user?.id);
      if (draftKey) discardSerializedAutosaveDraft(draftKey);
      if (editingId === id) {
        setEditingId(null);
        setEditingDirty(false);
      }
      await refresh();
    },
    [deletePassword, editingId, isDesktop, refresh, t, user?.id]
  );

  if (!loaded) return null;

  return (
    <div className='flex flex-col gap-12px mt-24px pt-16px b-t-1 b-color-border-2'>
      <div className='flex items-start justify-between gap-16px'>
        <div className='flex flex-col gap-2px'>
          <div className='text-14px font-medium text-t-primary'>
            {t('settings.constitutionSpecialists.title', 'Specialist Overlays')}
          </div>
          <div className='text-12px text-t-secondary'>
            {t(
              'settings.constitutionSpecialists.description',
              "Overlays add assistant-specific rules on top of the Constitution. They are opt-in by assistant ID and compose into that assistant's prompt."
            )}
          </div>
        </div>
        <Button
          type='secondary'
          size='small'
          icon={<Plus size={14} />}
          onClick={() => {
            setAdding(true);
            setAddError(null);
          }}
        >
          {t('settings.constitutionSpecialists.addButton', 'Add overlay')}
        </Button>
      </div>

      {loadError && (
        <div className='rd-8px border border-solid border-[var(--color-danger-light-4)] bg-[var(--color-danger-light-1)] p-12px flex items-center justify-between gap-12px'>
          <span className='text-12px text-t-secondary'>{loadError}</span>
          <Button type='secondary' size='small' onClick={() => void refresh()}>
            {t('settings.constitutionPage.retryRead', 'Retry load')}
          </Button>
        </div>
      )}

      {adding && (
        <div className='b-1 b-color-border-2 rd-8px p-12px flex flex-col gap-8px'>
          <span className='text-12px font-medium text-t-secondary'>
            {t('settings.constitutionSpecialists.idLabel', 'Assistant ID')}
          </span>
          <div className='flex gap-8px'>
            <Input
              value={newId}
              onChange={(v) => {
                setNewId(v);
                setAddError(null);
              }}
              placeholder={t('settings.constitutionSpecialists.idPlaceholder', 'e.g. copy, spark, humanizer')}
              onPressEnter={() => void handleCreate()}
            />
            {isDesktop ? (
              <Button type='primary' size='default' onClick={() => void handleCreate()}>
                {t('settings.constitutionSpecialists.create', 'Create')}
              </Button>
            ) : ID_PATTERN.test(newId.trim()) && !items.some((entry) => entry.id === newId.trim()) ? (
              <HostedEditAuthorization
                scopes={[`specialist.write:${newId.trim()}`]}
                onGranted={(grant) => void handleCreate(grant)}
              />
            ) : (
              <Button type='primary' size='default' onClick={() => void handleCreate()}>
                {t('settings.constitutionSpecialists.create', 'Create')}
              </Button>
            )}
            <Button
              size='default'
              onClick={() => {
                setAdding(false);
                setNewId('');
                setAddError(null);
              }}
            >
              {t('settings.constitutionSpecialists.cancel', 'Cancel')}
            </Button>
          </div>
          {addError && <span className='text-11px text-danger'>{addError}</span>}
        </div>
      )}

      {!loadError && items.length === 0 && !adding ? (
        <div className='text-12px text-t-tertiary py-8px'>
          {t(
            'settings.constitutionSpecialists.empty',
            'No specialist overlays yet. Add one to give a specific assistant extra rules.'
          )}
        </div>
      ) : (
        <div className='flex flex-col gap-8px'>
          {items.map((entry) => (
            <div key={entry.id} className='flex flex-col gap-8px'>
              <div className='flex items-center justify-between gap-8px b-1 b-color-border-2 rd-8px p-12px'>
                <div className='flex items-center gap-8px min-w-0'>
                  <span className='text-13px font-medium text-t-primary truncate'>{entry.id}</span>
                  <span className='text-11px text-t-tertiary shrink-0'>
                    {t('settings.constitutionSpecialists.tokenCount', '{{value}} tokens', {
                      value: Math.ceil(entry.bytes / 4).toLocaleString(),
                    })}
                  </span>
                </div>
                <div className='flex items-center gap-8px shrink-0'>
                  <Button
                    type='secondary'
                    size='small'
                    icon={<Pencil size={14} />}
                    disabled={editingDirty}
                    title={
                      editingDirty
                        ? t(
                            'settings.constitutionSpecialists.switchDirty',
                            'Save or discard the open overlay before switching'
                          )
                        : undefined
                    }
                    onClick={() => {
                      setEditingId(editingId === entry.id ? null : entry.id);
                      setEditingDirty(false);
                    }}
                  >
                    {t('settings.constitutionSpecialists.edit', 'Edit')}
                  </Button>
                  <Button
                    type='secondary'
                    size='small'
                    status='danger'
                    disabled={editingDirty && editingId === entry.id}
                    icon={<Trash2 size={14} />}
                    onClick={() => {
                      setConfirmDeleteId(entry.id);
                      setDeleteError(null);
                    }}
                  >
                    {t('settings.constitutionSpecialists.delete', 'Delete')}
                  </Button>
                </div>
              </div>

              {confirmDeleteId === entry.id && (
                <div className='b-1 b-color-border-2 rd-8px p-12px flex flex-col gap-8px'>
                  <div className='text-13px text-t-primary font-medium'>
                    {t('settings.constitutionSpecialists.deleteConfirmTitle', 'Delete overlay?')}
                  </div>
                  <div className='text-12px text-t-secondary'>
                    {t(
                      'settings.constitutionSpecialists.deleteConfirmBody',
                      'The overlay for "{{value}}" will be permanently removed.',
                      { value: entry.id }
                    )}
                  </div>
                  <div className='flex gap-8px justify-end'>
                    {!isDesktop && (
                      <Input.Password
                        value={deletePassword}
                        onChange={setDeletePassword}
                        placeholder={t('settings.constitutionPage.passwordPlaceholder', 'WebUI password')}
                        autoComplete='current-password'
                      />
                    )}
                    <Button
                      size='small'
                      onClick={() => {
                        setConfirmDeleteId(null);
                        setDeletePassword('');
                        setDeleteError(null);
                      }}
                    >
                      {t('settings.constitutionSpecialists.cancel', 'Cancel')}
                    </Button>
                    <Button
                      size='small'
                      type='primary'
                      status='danger'
                      disabled={!isDesktop && !deletePassword}
                      onClick={() => void handleDelete(entry.id, entry.revision)}
                    >
                      {t('settings.constitutionSpecialists.delete', 'Delete')}
                    </Button>
                  </div>
                  {deleteError && <span className='text-11px text-danger'>{deleteError}</span>}
                </div>
              )}

              {editingId === entry.id && (
                <SpecialistOverlayEditor
                  id={entry.id}
                  onDirtyChange={setEditingDirty}
                  onClose={() => {
                    setEditingId(null);
                    setEditingDirty(false);
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpecialistOverlays;
