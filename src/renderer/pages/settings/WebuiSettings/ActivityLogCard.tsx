import React, { useCallback, useEffect, useState } from 'react';
import { Button, Spin } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { webui } from '@/common/adapter/ipcBridge';
import { invokeWithTimeout } from '@/renderer/utils/invokeWithTimeout';

type ActivityEvent = {
  id: string;
  type: 'login' | 'command' | 'chat' | 'paired-device-added' | 'paired-device-revoked';
  detail: string;
  deviceId?: string;
  ts: number;
};

const PREVIEW_COUNT = 20;

const TYPE_LABELS: Record<ActivityEvent['type'], string> = {
  login: 'Login',
  command: 'Command',
  chat: 'Chat',
  'paired-device-added': 'Device paired',
  'paired-device-revoked': 'Device revoked',
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const ActivityLogCard: React.FC = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Race a timeout so the card clears even if the web bridge never returns.
      const result = await invokeWithTimeout(webui.activityLog.invoke({}), 3000, { success: false as const });
      if (result.success && result.data) {
        setEvents(result.data.events as ActivityEvent[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = expanded ? events : events.slice(0, PREVIEW_COUNT);

  return (
    <div className="px-[12px] md:px-[28px] py-14px bg-[var(--color-bg-2)] border border-solid border-[var(--color-border-2)] rd-12px">
      <div className="flex items-center justify-between mb-12px">
        <div className="text-14px font-500 text-t-primary">{t('settings.webui.activityLog.title')}</div>
        <Button type="text" size="small" onClick={load}>
          {t('settings.webui.activityLog.refresh')}
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-12px">
          <Spin />
        </div>
      )}

      {!loading && events.length === 0 && (
        <div className="text-13px text-t-tertiary py-8px">{t('settings.webui.activityLog.empty')}</div>
      )}

      {!loading && visible.length > 0 && (
        <div className="flex flex-col gap-4px">
          {visible.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-10px px-10px py-8px rd-8px hover:bg-fill-1 transition-colors"
            >
              <span className="text-11px font-500 text-t-tertiary shrink-0 mt-1px w-100px truncate">
                {TYPE_LABELS[event.type] ?? event.type}
              </span>
              <span className="flex-1 text-12px text-t-secondary truncate">{event.detail}</span>
              <span className="text-11px text-t-tertiary shrink-0">{formatTime(event.ts)}</span>
            </div>
          ))}
        </div>
      )}

      {!loading && events.length > PREVIEW_COUNT && (
        <div className="mt-8px">
          <Button
            type="text"
            size="small"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded
              ? t('settings.webui.activityLog.showLess')
              : t('settings.webui.activityLog.viewAll', { count: events.length })}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActivityLogCard;
