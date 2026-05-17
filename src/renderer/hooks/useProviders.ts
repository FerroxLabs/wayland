import { useState, useEffect, useCallback } from 'react';
import { ipcBridge } from '@/common';
import type { IConnectedProviderView, IDefaultModelView } from '@/common/adapter/ipcBridge';

type ProvidersState = {
  providers: IConnectedProviderView[];
  defaults: IDefaultModelView[];
  loading: boolean;
  error: string | null;
};

export function useProviders() {
  const [state, setState] = useState<ProvidersState>({
    providers: [],
    defaults: [],
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await ipcBridge.providers.list.invoke();
      if (res.success && res.data) {
        setState({ providers: res.data.providers, defaults: res.data.defaults, loading: false, error: null });
      } else {
        setState((prev) => ({ ...prev, loading: false, error: res.msg ?? 'Failed to load providers' }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Re-load when any catalog is updated (refresh scheduler, manual connect, etc.)
  useEffect(() => {
    const unsub = ipcBridge.providers.catalogUpdated.on(() => {
      void load();
    });
    return () => unsub();
  }, [load]);

  const refresh = useCallback(
    async (catalogId: string) => {
      await ipcBridge.providers.refresh.invoke({ catalogId });
      void load();
    },
    [load]
  );

  const disconnect = useCallback(
    async (catalogId: string) => {
      await ipcBridge.providers.disconnect.invoke({ catalogId });
      void load();
    },
    [load]
  );

  const toggleModel = useCallback(
    async (catalogId: string, modelId: string, enabled: boolean) => {
      await ipcBridge.providers.toggleModel.invoke({ catalogId, modelId, enabled });
      void load();
    },
    [load]
  );

  const setDisplayName = useCallback(
    async (catalogId: string, displayName: string) => {
      await ipcBridge.providers.setDisplayName.invoke({ catalogId, displayName });
      void load();
    },
    [load]
  );

  const setDefault = useCallback(
    async (scope: IDefaultModelView['scope'], catalogId: string, modelId: string) => {
      await ipcBridge.providers.setDefault.invoke({ scope, catalogId, modelId });
      void load();
    },
    [load]
  );

  return {
    ...state,
    reload: load,
    refresh,
    disconnect,
    toggleModel,
    setDisplayName,
    setDefault,
  };
}
