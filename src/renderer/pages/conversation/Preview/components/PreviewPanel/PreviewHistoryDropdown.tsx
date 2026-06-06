/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PreviewHistoryTarget, PreviewSnapshotInfo } from '@/common/types/preview';
import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * PreviewHistoryDropdown component props
 */
interface PreviewHistoryDropdownProps {
  /**
   * History versions list
   */
  historyVersions: PreviewSnapshotInfo[];

  /**
   * Whether loading
   */
  historyLoading: boolean;

  /**
   * Loading error message
   */
  historyError: string | null;

  /**
   * History target
   */
  historyTarget: PreviewHistoryTarget | null;

  /**
   * Current theme
   */
  currentTheme: 'light' | 'dark';

  /**
   * Select snapshot callback
   */
  onSnapshotSelect: (snapshot: PreviewSnapshotInfo) => void;
}

/**
 * Preview history dropdown menu component
 *
 * Displays history versions list, supports selecting history versions to restore content
 */
const PreviewHistoryDropdown: React.FC<PreviewHistoryDropdownProps> = ({
  historyVersions,
  historyLoading,
  historyError,
  historyTarget,
  currentTheme,
  onSnapshotSelect,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className='min-w-220px rd-6px shadow-lg'
      style={{
        backgroundColor: currentTheme === 'dark' ? '#1d1d1f' : '#ffffff',
        border: '1px solid var(--border-base, #e5e6eb)',
        zIndex: 9999,
      }}
    >
      {/* Header: History title + filename */}
      <div className='px-8px py-6px' style={{ borderColor: 'var(--border-base, #e5e6eb)' }}>
        <div className='text-12px text-t-secondary'>{t('preview.historyVersions')}</div>
        <div className='text-11px text-t-tertiary truncate'>
          {historyTarget?.fileName || historyTarget?.title || t('preview.currentFile')}
        </div>
      </div>

      {/* List content: fixed height scrollable */}
      <div className='overflow-y-auto' style={{ maxHeight: '240px' }}>
        {historyLoading ? (
          <div className='py-16px text-center text-12px text-t-secondary'>{t('preview.loading')}</div>
        ) : historyError ? (
          <div className='py-16px text-center text-12px' style={{ color: 'var(--danger, #f53f3f)' }}>
            {historyError}
          </div>
        ) : historyVersions.length === 0 ? (
          <div className='py-16px text-center text-12px text-t-secondary'>{t('preview.noHistory')}</div>
        ) : (
          historyVersions.map((snapshot) => (
            <div
              key={snapshot.id}
              className='px-12px py-8px cursor-pointer hover:bg-bg-2 transition-colors'
              onClick={() => onSnapshotSelect(snapshot)}
            >
              <div className='text-12px text-t-primary'>{new Date(snapshot.createdAt).toLocaleString()}</div>
              <div className='text-11px text-t-tertiary'>{(snapshot.size / 1024).toFixed(1)} KB</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PreviewHistoryDropdown;
