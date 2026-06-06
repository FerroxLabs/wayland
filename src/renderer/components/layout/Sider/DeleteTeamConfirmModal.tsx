/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Live-smoke fix #3 (2026-05-19) - Typed-confirmation modal for team
// deletion. Replaces the Arco Modal.confirm() one-shot dialog in
// TeamSiderSection, which has no way to gate the OK button on input
// state. The user must type "delete" (case-insensitive) before the
// destructive CTA enables.

import { Button, Input } from '@arco-design/web-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import WaylandModal from '@renderer/components/base/WaylandModal';

type Props = {
  visible: boolean;
  teamName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

const DeleteTeamConfirmModal: React.FC<Props> = ({
  visible,
  teamName,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const { t } = useTranslation();
  const [typed, setTyped] = useState('');

  // Reset the input whenever the modal closes so the next open starts clean.
  useEffect(() => {
    if (!visible) setTyped('');
  }, [visible]);

  const enabled = typed.trim().toLowerCase() === 'delete';

  return (
    <WaylandModal
      visible={visible}
      onCancel={onCancel}
      size='small'
      header={t('team.sider.deleteConfirmTitle', { defaultValue: 'Delete team?' })}
      footer={
        <div className='flex justify-end gap-12px'>
          <Button
            onClick={onCancel}
            className='px-16px min-w-80px'
            style={{ borderRadius: 8 }}
            data-testid='delete-team-confirm-cancel'
          >
            {t('team.sider.deleteConfirmCancelCta', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            type='primary'
            status='danger'
            onClick={onConfirm}
            disabled={!enabled || loading}
            loading={loading}
            className='min-w-80px'
            data-testid='delete-team-confirm-cta'
          >
            {t('team.sider.deleteConfirmCta', { defaultValue: 'Delete team' })}
          </Button>
        </div>
      }
    >
      <div
        className='flex flex-col gap-12px p-24px'
        data-testid='delete-team-confirm-modal'
      >
        <p className='text-13px text-t-secondary m-0'>
          {t('team.sider.deleteConfirmBody', {
            teamName,
            defaultValue:
              'This will permanently delete {{teamName}} and its conversation history. Type "delete" below to confirm.',
          })}
        </p>
        <Input
          value={typed}
          onChange={setTyped}
          placeholder={t('team.sider.deleteConfirmInputPlaceholder', { defaultValue: 'delete' })}
          autoFocus
          data-testid='delete-team-confirm-input'
        />
      </div>
    </WaylandModal>
  );
};

export default DeleteTeamConfirmModal;
