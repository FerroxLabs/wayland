import React from 'react';
import { Button } from '@arco-design/web-react';
import { type LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
};

const EmptyState: React.FC<EmptyStateProps> = ({ title, body, actionLabel, onAction, icon: Icon }) => {
  return (
    <div className='flex flex-col items-center justify-center py-48px px-24px text-center gap-12px'>
      {Icon && (
        <span className='w-48px h-48px flex items-center justify-center rounded-full bg-[var(--bg-3)]'>
          <Icon size={24} className='text-[var(--text-muted)]' />
        </span>
      )}
      <div className='text-15px font-medium text-[var(--text-primary)]'>{title}</div>
      <div className='text-13px text-[var(--text-muted)] max-w-320px'>{body}</div>
      {actionLabel && onAction && (
        <Button type='primary' onClick={onAction} className='mt-4px'>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
