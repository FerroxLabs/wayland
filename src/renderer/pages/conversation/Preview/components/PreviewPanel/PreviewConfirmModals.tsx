/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Modal } from '@arco-design/web-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Close tab confirmation state
 */
export interface CloseTabConfirmState {
  /**
   * Whether to show confirmation dialog
   */
  show: boolean;

  /**
   * Tab ID to close
   */
  tabId: string | null;
}

/**
 * PreviewConfirmModals component props
 */
interface PreviewConfirmModalsProps {
  /**
   * Whether to show exit edit confirmation dialog
   */
  showExitConfirm: boolean;

  /**
   * Close tab confirmation state
   */
  closeTabConfirm: CloseTabConfirmState;

  /**
   * Confirm exit edit
   */
  onConfirmExit: () => void;

  /**
   * Cancel exit edit
   */
  onCancelExit: () => void;

  /**
   * Save and close tab
   */
  onSaveAndCloseTab: () => void;

  /**
   * Close tab without saving
   */
  onCloseWithoutSave: () => void;

  /**
   * Cancel close tab
   */
  onCancelCloseTab: () => void;
}

/**
 * Preview panel confirmation modals component
 *
 * Contains exit edit confirmation and close tab confirmation dialogs
 */
const PreviewConfirmModals: React.FC<PreviewConfirmModalsProps> = ({
  showExitConfirm,
  closeTabConfirm,
  onConfirmExit,
  onCancelExit,
  onSaveAndCloseTab,
  onCloseWithoutSave,
  onCancelCloseTab,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Exit edit confirmation modal */}
      <Modal
        visible={showExitConfirm}
        title={t('preview.unsavedChangesTitle')}
        onCancel={onCancelExit}
        onOk={onConfirmExit}
        okText={t('preview.confirmExit')}
        cancelText={t('preview.continueEdit')}
        style={{ borderRadius: '12px' }}
        alignCenter
        getPopupContainer={() => document.body}
      >
        <div className='text-14px text-t-secondary'>{t('preview.unsavedChangesMessage')}</div>
      </Modal>

      {/* Close tab confirmation modal */}
      <Modal
        visible={closeTabConfirm.show}
        title={t('preview.closeTabTitle')}
        onCancel={onCancelCloseTab}
        onOk={onSaveAndCloseTab}
        okText={t('preview.saveAndClose')}
        cancelText={t('common.cancel')}
        style={{ borderRadius: '12px' }}
        alignCenter
        getPopupContainer={() => document.body}
        footer={
          <div className='flex justify-end gap-8px'>
            <button
              className='px-16px py-6px cursor-pointer border-none hover:bg-bg-3 transition-colors text-14px text-t-primary'
              onClick={onCancelCloseTab}
            >
              {t('common.cancel')}
            </button>
            <button
              className='px-16px py-6px cursor-pointer border-none hover:bg-bg-3 transition-colors text-14px text-t-primary'
              onClick={onCloseWithoutSave}
            >
              {t('preview.closeWithoutSave')}
            </button>
            <button
              className='px-16px py-6px cursor-pointer border-none bg-primary text-white hover:opacity-80 transition-opacity text-14px'
              onClick={onSaveAndCloseTab}
            >
              {t('preview.saveAndClose')}
            </button>
          </div>
        }
      >
        <div className='text-14px text-t-secondary'>{t('preview.closeTabMessage')}</div>
      </Modal>
    </>
  );
};

export default PreviewConfirmModals;
