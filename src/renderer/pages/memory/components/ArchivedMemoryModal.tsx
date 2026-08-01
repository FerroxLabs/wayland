/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Message, Modal, Spin } from '@arco-design/web-react';
import { RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { memory as memoryBridge } from '@/common/adapter/ipcBridge';
import type { ArchivedMemoryEntry } from '@/common/types/memory';

type ArchivedMemoryModalProps = {
  open: boolean;
  onClose: () => void;
  onRestored: () => void;
};

const ArchivedMemoryModal: React.FC<ArchivedMemoryModalProps> = ({ open, onClose, onRestored }) => {
  const { t } = useTranslation('memory');
  const loadError = t('archive.recovery.loadError', 'Could not load archived memories');
  const [entries, setEntries] = useState<ArchivedMemoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await memoryBridge.listArchivedEntries.invoke());
    } catch {
      Message.error(loadError);
    } finally {
      setLoading(false);
    }
  }, [loadError]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const restore = async (archiveId: string): Promise<void> => {
    setRestoringId(archiveId);
    try {
      const result = await memoryBridge.restoreArchivedEntry.invoke({ archiveId });
      if (!result.ok) {
        Message.error(t('archive.recovery.restoreError', 'Could not restore this memory'));
        return;
      }
      Message.success(t('archive.recovery.restored', 'Memory restored'));
      await load();
      onRestored();
    } catch {
      Message.error(t('archive.recovery.restoreError', 'Could not restore this memory'));
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <Modal
      title={t('archive.recovery.title', 'Archived memories')}
      visible={open}
      onCancel={onClose}
      footer={null}
      unmountOnExit
      data-testid='archived-memory-modal'
    >
      <p className='mt-0 mb-16px text-13px text-[var(--color-text-3)]'>
        {t(
          'archive.recovery.description',
          'Archived memories stay on disk and can be restored to their original file.'
        )}
      </p>
      {loading ? (
        <div className='flex justify-center py-24px' data-testid='archived-memory-loading'>
          <Spin />
        </div>
      ) : entries.length === 0 ? (
        <div className='py-24px text-center text-13px text-[var(--color-text-3)]' data-testid='archived-memory-empty'>
          {t('archive.recovery.empty', 'No archived memories')}
        </div>
      ) : (
        <div className='flex flex-col gap-8px' data-testid='archived-memory-list'>
          {entries.map((entry) => (
            <div
              key={entry.archiveId}
              className='flex items-center justify-between gap-12px rounded-8px border border-[var(--color-border-2)] p-12px'
              data-testid={`archived-memory-${entry.archiveId}`}
            >
              <div className='min-w-0'>
                <div className='truncate text-13px font-500'>{entry.summary}</div>
                <div className='truncate text-11px text-[var(--color-text-3)]' title={entry.sourcePath}>
                  {entry.sourcePath}
                </div>
                <div className='text-11px text-[var(--color-text-4)]'>
                  {new Date(entry.archivedAt).toLocaleString()}
                </div>
              </div>
              <Button
                size='small'
                icon={<RotateCcw size={13} aria-hidden />}
                loading={restoringId === entry.archiveId}
                disabled={restoringId !== null && restoringId !== entry.archiveId}
                onClick={() => void restore(entry.archiveId)}
                data-testid={`restore-memory-${entry.archiveId}`}
              >
                {t('archive.recovery.restore', 'Restore')}
              </Button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default ArchivedMemoryModal;
