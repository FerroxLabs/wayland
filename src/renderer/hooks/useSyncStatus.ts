import { useCallback, useEffect, useState } from 'react';
import { sync } from '@/common/adapter/ipcBridge';

type SyncStatus = { enabled: boolean; lastSync?: number; itemsCount?: number };

const POLL_INTERVAL_MS = 30_000;

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>({ enabled: false });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const next = await sync.status.invoke();
      setStatus(next);
    } catch (e) {
      console.error('[useSyncStatus] failed to load status', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  return { status, loading, refresh };
}
