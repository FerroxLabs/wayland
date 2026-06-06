import React from 'react';
import classNames from 'classnames';
import Card from './Card';

type ConnectionCardProps = {
  provider: string;
  status: React.ReactNode;
  lastSync?: string;
  actions?: React.ReactNode;
  body?: React.ReactNode;
  dangerSlot?: React.ReactNode;
  className?: string;
};

const ConnectionCard: React.FC<ConnectionCardProps> = ({
  provider,
  status,
  lastSync,
  actions,
  body,
  dangerSlot,
  className,
}) => {
  return (
    <div className={classNames('flex flex-col gap-1px', className)}>
      <Card
        title={provider}
        statusBadge={status}
        actions={actions}
      >
        {lastSync && (
          <div className='text-12px text-[var(--text-muted)] mb-8px'>{lastSync}</div>
        )}
        {body}
      </Card>
      {dangerSlot && <div className='mt-8px'>{dangerSlot}</div>}
    </div>
  );
};

export default ConnectionCard;
