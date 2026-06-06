import React, { useState } from 'react';
import { Button } from '@arco-design/web-react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from './ConfirmDialog';

type DangerZoneProps = {
  title: string;
  description: string;
  actionLabel: string;
  onConfirm: () => void;
  confirmTitle: string;
  confirmBody: string;
};

const DangerZone: React.FC<DangerZoneProps> = ({
  title,
  description,
  actionLabel,
  onConfirm,
  confirmTitle,
  confirmBody,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className='flex items-center justify-between gap-16px px-16px py-12px rounded-8px bg-[var(--danger-soft-bg)] border border-[var(--danger-soft-border)]'>
        <div className='flex items-center gap-10px'>
          <AlertTriangle size={16} className='text-[var(--danger)] shrink-0' />
          <div className='flex flex-col gap-2px'>
            <span className='text-13px font-medium text-[var(--text-primary)]'>{title}</span>
            <span className='text-12px text-[var(--text-secondary)]'>{description}</span>
          </div>
        </div>
        <Button size='small' status='danger' onClick={() => setOpen(true)}>
          {actionLabel}
        </Button>
      </div>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        icon={AlertTriangle}
        title={confirmTitle}
        body={confirmBody}
        confirmLabel={t('settings.shared.confirm')}
        destructive
      />
    </>
  );
};

export default DangerZone;
