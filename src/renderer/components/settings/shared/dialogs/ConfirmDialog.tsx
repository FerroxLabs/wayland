import React from 'react';
import { Button, Modal } from '@arco-design/web-react';
import { type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  icon?: LucideIcon;
  title: string;
  body: string;
  confirmLabel?: string;
  destructive?: boolean;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  icon: Icon,
  title,
  body,
  confirmLabel,
  destructive = false,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={open}
      onCancel={onClose}
      title={
        <div className='flex items-center gap-8px'>
          {Icon && (
            <span className={destructive ? 'text-[var(--danger)]' : 'text-[var(--brand)]'}>
              <Icon size={18} />
            </span>
          )}
          <span>{title}</span>
        </div>
      }
      footer={
        <div className='flex justify-end gap-8px'>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            type='primary'
            status={destructive ? 'danger' : 'default'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </div>
      }
    >
      <p className='text-13px text-[var(--text-secondary)] m-0'>{body}</p>
    </Modal>
  );
};

export default ConfirmDialog;
