import classNames from 'classnames';
import { type LucideIcon } from 'lucide-react';
import React from 'react';

type CardProps = {
  title?: React.ReactNode;
  titleIcon?: LucideIcon;
  statusBadge?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

const Card: React.FC<CardProps> = ({ title, titleIcon: Icon, statusBadge, actions, children, className }) => {
  const hasHeader = title || statusBadge || actions;

  return (
    <div
      className={classNames(
        'rounded-12px bg-[var(--color-bg-2)] border-2 border-solid border-[var(--color-border-2)] overflow-hidden shadow-[var(--shadow-1)]',
        className
      )}
    >
      {hasHeader && (
        <div className='flex items-center gap-8px px-16px py-12px border-b border-[var(--color-border-2)]'>
          {Icon && <Icon size={16} className='text-[var(--color-text-3)] shrink-0' />}
          {title && <span className='text-14px font-medium text-[var(--color-text-1)] flex-1'>{title}</span>}
          {statusBadge && <span className='ml-auto'>{statusBadge}</span>}
          {actions && <span className='ml-2'>{actions}</span>}
        </div>
      )}
      <div className='px-16px py-12px'>{children}</div>
    </div>
  );
};

export default Card;
