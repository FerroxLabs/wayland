/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Message, Modal, Spin } from '@arco-design/web-react';
import { RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type { IArchivedCronJob } from '@/common/adapter/ipcBridge';
import { formatSchedule } from '@renderer/pages/cron/cronUtils';

type ArchivedSchedulesModalProps = {
  open: boolean;
  onClose: () => void;
  onRestored: () => void;
};

const ArchivedSchedulesModal: React.FC<ArchivedSchedulesModalProps> = ({ open, onClose, onRestored }) => {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<IArchivedCronJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await ipcBridge.cron.listArchivedJobs.invoke());
    } catch (error) {
      console.error('[ArchivedSchedulesModal] Failed to load archives:', error);
      Message.error(t('cron.archive.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const restore = async (archiveId: string): Promise<void> => {
    setRestoringId(archiveId);
    try {
      await ipcBridge.cron.restoreArchivedJob.invoke({ archiveId });
      Message.success(t('cron.archive.restoreSuccess'));
      await load();
      onRestored();
    } catch (error) {
      console.error('[ArchivedSchedulesModal] Failed to restore archive:', error);
      Message.error(t('cron.archive.restoreError'));
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <Modal
      title={t('cron.archive.title')}
      visible={open}
      onCancel={onClose}
      footer={null}
      unmountOnExit
      data-testid='archived-schedules-modal'
    >
      <p className='mt-0 mb-16px text-13px text-[var(--color-text-3)]'>{t('cron.archive.description')}</p>
      {loading ? (
        <div className='flex justify-center py-24px' data-testid='archived-schedules-loading'>
          <Spin />
        </div>
      ) : entries.length === 0 ? (
        <div
          className='py-24px text-center text-13px text-[var(--color-text-3)]'
          data-testid='archived-schedules-empty'
        >
          {t('cron.archive.empty')}
        </div>
      ) : (
        <div className='flex flex-col gap-8px' data-testid='archived-schedules-list'>
          {entries.map((entry) => (
            <div
              key={entry.archiveId}
              className='flex items-center justify-between gap-12px rounded-8px border border-[var(--color-border-2)] p-12px'
              data-testid={`archived-schedule-${entry.archiveId}`}
            >
              <div className='min-w-0'>
                <div className='truncate text-13px font-500'>{entry.job.name}</div>
                <div className='truncate text-11px text-[var(--color-text-3)]'>{formatSchedule(entry.job, t)}</div>
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
                data-testid={`restore-schedule-${entry.archiveId}`}
              >
                {t('cron.archive.restore')}
              </Button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default ArchivedSchedulesModal;
