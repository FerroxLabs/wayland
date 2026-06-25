/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input } from '@arco-design/web-react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isElectronDesktop } from '@renderer/utils/platform';
import {
  deleteConstitutionSpecialistHttp,
  writeConstitutionSpecialistHttp,
} from '@renderer/services/ConstitutionService';
import SpecialistOverlayEditor from './SpecialistOverlayEditor';

/** Client-side mirror of the bridge's ASSISTANT_ID_PATTERN. */
const ID_PATTERN = /^[A-Za-z0-9_-]+$/;

type SpecialistEntry = { id: string; bytes: number };

/**
 * Constitution settings section that manages per-specialist overlay files
 * (`~/.wayland/specialists/<id>.md`). Lists existing overlays and provides
 * create / edit / delete flows. Rendered below the core Constitution editor.
 */
const SpecialistOverlays: React.FC = () => {
  const { t } = useTranslation();

  const [items, setItems] = useState<SpecialistEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  /** Assistant id of the overlay whose inline editor is open (one at a time). */
  const [editingId, setEditingId] = useState<string | null>(null);
  /** Assistant id awaiting a delete confirmation. */
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  /** Whether the inline add form is visible. */
  const [adding, setAdding] = useState(false);
  const [newId, setNewId] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    const api = window.electronAPI;
    if (!api?.listConstitutionSpecialists) {
      setLoaded(true);
      return;
    }
    const list = await api.listConstitutionSpecialists();
    setItems(list);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleCreate = useCallback(async (): Promise<void> => {
    const id = newId.trim();
    if (!ID_PATTERN.test(id)) {
      setAddError(
        t(
          'settings.constitutionSpecialists.idInvalid',
          'Use only letters, numbers, hyphens, and underscores.'
        )
      );
      return;
    }
    if (items.some((entry) => entry.id === id)) {
      setAddError(
        t(
          'settings.constitutionSpecialists.idDuplicate',
          'An overlay with that ID already exists.'
        )
      );
      return;
    }
    const ok = isElectronDesktop()
      ? ((await window.electronAPI?.writeConstitutionSpecialist?.(id, '')) ?? false)
      : await writeConstitutionSpecialistHttp(id, '');
    if (!ok) return;
    setAdding(false);
    setNewId('');
    setAddError(null);
    await refresh();
    setEditingId(id);
  }, [newId, items, refresh, t]);

  const handleDelete = useCallback(
    async (id: string): Promise<void> => {
      const ok = isElectronDesktop()
        ? ((await window.electronAPI?.deleteConstitutionSpecialist?.(id)) ?? false)
        : await deleteConstitutionSpecialistHttp(id);
      if (!ok) return;
      setConfirmDeleteId(null);
      if (editingId === id) setEditingId(null);
      await refresh();
    },
    [editingId, refresh]
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
              placeholder={t(
                'settings.constitutionSpecialists.idPlaceholder',
                'e.g. copy, spark, humanizer'
              )}
              onPressEnter={() => void handleCreate()}
            />
            <Button type='primary' size='default' onClick={() => void handleCreate()}>
              {t('settings.constitutionSpecialists.create', 'Create')}
            </Button>
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

      {items.length === 0 && !adding ? (
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
                    onClick={() => setEditingId(editingId === entry.id ? null : entry.id)}
                  >
                    {t('settings.constitutionSpecialists.edit', 'Edit')}
                  </Button>
                  <Button
                    type='secondary'
                    size='small'
                    status='danger'
                    icon={<Trash2 size={14} />}
                    onClick={() => setConfirmDeleteId(entry.id)}
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
                    <Button size='small' onClick={() => setConfirmDeleteId(null)}>
                      {t('settings.constitutionSpecialists.cancel', 'Cancel')}
                    </Button>
                    <Button
                      size='small'
                      type='primary'
                      status='danger'
                      onClick={() => void handleDelete(entry.id)}
                    >
                      {t('settings.constitutionSpecialists.delete', 'Delete')}
                    </Button>
                  </div>
                </div>
              )}

              {editingId === entry.id && (
                <SpecialistOverlayEditor id={entry.id} onClose={() => setEditingId(null)} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpecialistOverlays;
