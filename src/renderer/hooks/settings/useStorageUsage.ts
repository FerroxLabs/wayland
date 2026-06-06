import { useCallback, useEffect, useState } from 'react';
import { storage } from '@/common/adapter/ipcBridge';
import type { StorageUsageResult } from '@/common/adapter/ipcBridge';

type State = { data: StorageUsageResult | null; loading: boolean; error: string | null };

export function useStorageUsage() {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null });

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    storage.computeUsage
      .invoke()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: unknown) => setState({ data: null, loading: false, error: String(err) }));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
