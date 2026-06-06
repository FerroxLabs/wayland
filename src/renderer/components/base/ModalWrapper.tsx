import { X } from 'lucide-react';
import type { ModalProps } from '@arco-design/web-react';
import { Modal } from '@arco-design/web-react';
import React from 'react';

interface ModalWrapperProps extends Omit<ModalProps, 'title'> {
  children?: React.ReactNode;
  title?: React.ReactNode;
  showCustomClose?: boolean;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({
  children,
  title,
  showCustomClose = true,
  onCancel,
  className = '',
  ...props
}) => {
  return (
    <Modal {...props} title={null} closable={false} onCancel={onCancel} className={`wayland-modal ${className}`}>
      <div>
        {showCustomClose && title && (
          <div className='wayland-modal-header'>
            <h3 className='wayland-modal-title'>{title}</h3>
            <button onClick={onCancel} className='wayland-modal-close-btn'>
              <X size={20} color='var(--color-text-3)' />
            </button>
          </div>
        )}
        {children}
      </div>
    </Modal>
  );
};

export default ModalWrapper;
