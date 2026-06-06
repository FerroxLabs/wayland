import { Button, Spin } from '@arco-design/web-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@renderer/components/settings/shared';
import { useStorageUsage } from '@renderer/hooks/settings/useStorageUsage';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function timeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

const UsageCard: React.FC = () => {
  const { t } = useTranslation();
  const { data, loading, refresh } = useStorageUsage();

  const total = data?.used ?? 0;

  return (
    <Card
      title={t('settings.storagePage.usageTitle')}
      actions={
        <Button size='mini' loading={loading} onClick={refresh}>
          {t('settings.storagePage.refresh')}
        </Button>
      }
    >
      {loading && !data ? (
        <div className='flex justify-center py-16px'>
          <Spin />
        </div>
      ) : (
        <>
          <p className='text-12px text-[var(--color-text-3)] mb-8px'>
            {t('settings.storagePage.totalUsed', { used: formatBytes(total), total: '-' })}
          </p>

          {/* Multi-segment progress bar */}
          {data && data.breakdown.length > 0 && (
            <div className='rounded-4px overflow-hidden h-8px flex mb-12px bg-[var(--color-bg-4)]'>
              {data.breakdown.map((item) => {
                const pct = total > 0 ? (item.bytes / total) * 100 : 0;
                return (
                  <div
                    key={item.label}
                    style={{ width: `${pct}%`, background: item.color }}
                    title={`${t(`settings.storagePage.${item.label}`)} - ${formatBytes(item.bytes)}`}
                  />
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className='flex flex-wrap gap-12px'>
            {data?.breakdown.map((item) => (
              <div key={item.label} className='flex items-center gap-6px'>
                <span className='w-8px h-8px rounded-full shrink-0' style={{ background: item.color }} />
                <span className='text-12px text-[var(--color-text-2)]'>
                  {t(`settings.storagePage.${item.label}`)} ({formatBytes(item.bytes)})
                </span>
              </div>
            ))}
          </div>

          {data && (
            <p className='text-11px text-[var(--color-text-3)] mt-8px'>
              {t('settings.storagePage.usageStale', { ago: timeAgo(data.computedAt) })}
            </p>
          )}
        </>
      )}
    </Card>
  );
};

export default UsageCard;
