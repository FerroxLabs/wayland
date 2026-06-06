import React from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

type StatusVariant = 'connected' | 'running' | 'soon' | 'error' | 'idle' | 'custom';

type StatusBadgeProps = {
  variant: StatusVariant;
  label: string;
  customColor?: string;
};

const DOT_COLORS: Record<StatusVariant, string> = {
  connected: 'bg-[var(--success)]',
  running: 'bg-[var(--success)]',
  soon: 'bg-[var(--warning)]',
  error: 'bg-[var(--danger)]',
  idle: 'bg-[var(--color-text-3)]',
  custom: '',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ variant, label, customColor }) => {
  const { t } = useTranslation();
  const dotClass = variant === 'custom' ? '' : DOT_COLORS[variant];

  return (
    <span className='inline-flex items-center gap-5px px-8px py-2px rounded-full bg-[var(--color-bg-4)] text-12px text-[var(--color-text-2)]'>
      <span
        className={classNames('w-6px h-6px rounded-full shrink-0', dotClass)}
        style={variant === 'custom' && customColor ? { backgroundColor: customColor } : undefined}
        aria-hidden='true'
      />
      <span>{label}</span>
      <span className='sr-only'>{t('settings.shared.statusPrefix', { label })}</span>
    </span>
  );
};

export default StatusBadge;
