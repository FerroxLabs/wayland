/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
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

  /**
   * P2-8. Whether to warn before handing a generated HTML report to the OS
   * default browser.
   */
  showExternalOpenConfirm: boolean;

  /**
   * Proceed with the external open despite the warning.
   */
  onConfirmExternalOpen: () => void;

  /**
   * Abandon the external open.
   */
  onCancelExternalOpen: () => void;
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
  showExternalOpenConfirm,
  onConfirmExternalOpen,
  onCancelExternalOpen,
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
              className='px-16px py-6px cursor-pointer border-none hover:bg-3 transition-colors text-14px text-t-primary'
              onClick={onCancelCloseTab}
            >
              {t('common.cancel')}
            </button>
            <button
              className='px-16px py-6px cursor-pointer border-none hover:bg-3 transition-colors text-14px text-t-primary'
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

      {/*
        P2-8. Leaving the preview is a downgrade in protection, and the user is
        the only one who can weigh it. In here the report runs with no scripts
        and no network; in the default browser it runs with both, against data
        Wayland never vetted. So the external open stays available - it is how a
        report gets printed, shared or attached - but it is SECONDARY and it
        says what changes. Cancel is the default: the modal's own dismissal
        paths (Escape, backdrop, the X) all land on `onCancelExternalOpen`, so
        nothing but a deliberate click on the warned button opens the browser.
      */}
      <Modal
        visible={showExternalOpenConfirm}
        title={t('preview.externalOpenTitle')}
        onCancel={onCancelExternalOpen}
        onOk={onConfirmExternalOpen}
        okText={t('preview.externalOpenConfirm')}
        cancelText={t('common.cancel')}
        okButtonProps={{ status: 'warning' }}
        style={{ borderRadius: '12px' }}
        alignCenter
        getPopupContainer={() => document.body}
      >
        <div className='text-14px text-t-secondary'>{t('preview.externalOpenMessage')}</div>
      </Modal>
    </>
  );
};

export default PreviewConfirmModals;
