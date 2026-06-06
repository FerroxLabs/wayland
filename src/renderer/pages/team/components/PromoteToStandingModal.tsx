// src/renderer/pages/team/components/PromoteToStandingModal.tsx
//
// W3b - Two-checkbox opt-in modal for promoting a team to Standing Company.
// Confirm stays disabled until both checkboxes are checked. The owning page
// (TeamPage) is responsible for the actual IPC call + success/error toast.

import { Button, Checkbox } from '@arco-design/web-react';
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

const PromoteToStandingModal: React.FC<Props> = ({ visible, teamName, onConfirm, onCancel, loading = false }) => {
  const { t } = useTranslation();
  const [optIn1, setOptIn1] = useState(false);
  const [optIn2, setOptIn2] = useState(false);

  // Reset checkboxes whenever the modal closes so the next open always starts
  // from a clean opt-in state.
  useEffect(() => {
    if (!visible) {
      setOptIn1(false);
      setOptIn2(false);
    }
  }, [visible]);

  const bothChecked = optIn1 && optIn2;

  return (
    <WaylandModal
      visible={visible}
      onCancel={onCancel}
      size='medium'
      header={t('teams.standing.modalTitle', { defaultValue: 'Promote to Standing Company' })}
      footer={
        <div className='flex justify-end gap-12px'>
          <Button
            onClick={onCancel}
            className='px-16px min-w-80px'
            style={{ borderRadius: 8 }}
            data-testid='promote-to-standing-cancel'
          >
            {t('teams.standing.cancelButton', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            type='primary'
            onClick={onConfirm}
            disabled={!bothChecked || loading}
            loading={loading}
            className='min-w-80px'
            data-testid='promote-to-standing-confirm'
          >
            {t('teams.standing.confirmButton', { defaultValue: 'Promote to Standing' })}
          </Button>
        </div>
      }
    >
      <div className='flex flex-col gap-16px p-24px' data-testid='promote-to-standing-modal'>
        <p className='text-13px text-t-secondary m-0'>
          {t('teams.standing.modalDescription', {
            defaultValue:
              'Standing Companies persist across sessions, appear in the dedicated Standing section of the library, and carry a permanent visual badge.',
          })}
        </p>
        {teamName && (
          <p className='text-13px text-t-primary font-medium m-0' data-testid='promote-to-standing-team-name'>
            {teamName}
          </p>
        )}
        <Checkbox
          checked={optIn1}
          onChange={(checked) => setOptIn1(checked)}
          data-testid='promote-to-standing-opt-in-1'
        >
          <span className='text-12px text-t-secondary'>
            {t('teams.standing.optIn1', {
              defaultValue: 'I understand this team will be marked as a Standing Company across the app.',
            })}
          </span>
        </Checkbox>
        <Checkbox
          checked={optIn2}
          onChange={(checked) => setOptIn2(checked)}
          data-testid='promote-to-standing-opt-in-2'
        >
          <span className='text-12px text-t-secondary'>
            {t('teams.standing.optIn2', {
              defaultValue: 'I can demote this team back to a regular team at any time.',
            })}
          </span>
        </Checkbox>
      </div>
    </WaylandModal>
  );
};

export default PromoteToStandingModal;
