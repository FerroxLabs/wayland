import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { modelRegistry } from '@/common/adapter/ipcBridge';
import type {
  IModelRegistryCatalogView,
  IModelRegistryConnectResult,
  IModelRegistryCreds,
  IModelRegistryDetectedKey,
  IModelRegistryProviderView,
  IModelRegistryTestResult,
} from '@/common/adapter/ipcBridge';
import type { CuratedModel, ProviderId } from '@process/providers/types';

/**
 * Renderer wrapper around the full `ipcBridge.modelRegistry` IPC contract.
 *
 * Exposes thin pass-throughs for every method so the Models page, the Manage
 * page (Packet 2B), the Browse modal (2C) and the home picker (2E) all consume
 * the same surface without re-implementing IPC plumbing.
 *
 * `modelRegistry.*.invoke()` resolves to the bare contract type (no
 * `{ success, data }` envelope — that wrapper only applies to namespaces whose
 * declared return type is `IBridgeResponse`).
 *
 * The hook is a thin consumer of `ModelRegistryProvider` — wrap the tree once
 * at the Models settings root so child surfaces (Manage / Browse) share one
 * `providers` snapshot. Surfaces outside the Models tree (e.g. the home
 * picker) can read `curatedForAgent` without a provider; the rest of the API
 * still works but each consumer owns its own snapshot — see
 * {@link ModelRegistryProvider} for the shared-state pattern.
 */
export type UseModelRegistry = {
  /** Connected providers with live state + model counts. */
  providers: IModelRegistryProviderView[];
  /** True while the initial `list()` is in flight. */
  loading: boolean;
  /** Last error from `list()`, or null. */
  error: string | null;
  /** Re-fetch the connected-providers list. */
  reload: () => Promise<void>;

  /** Auto-discover provider keys already on the machine. */
  detectKeys: () => Promise<IModelRegistryDetectedKey[]>;
  /** Connect a provider via key / cloud fields / a discovered key. */
  connect: (providerId: ProviderId, creds: IModelRegistryCreds) => Promise<IModelRegistryConnectResult>;
  /** Run a connectivity test against an already-connected provider. */
  testConnection: (providerId: ProviderId) => Promise<IModelRegistryTestResult>;
  /** Enriched catalog + curated view for one provider. */
  getCatalog: (providerId: ProviderId) => Promise<IModelRegistryCatalogView>;
  /** Enable / disable a single model. */
  toggleModel: (providerId: ProviderId, modelId: string, enabled: boolean) => Promise<{ ok: boolean }>;
  /** Re-fetch + re-enrich a provider's model list. */
  refresh: (providerId: ProviderId) => Promise<{ ok: boolean }>;
  /** Disconnect a provider and drop its catalog. */
  disconnect: (providerId: ProviderId) => Promise<{ ok: boolean }>;
  /** Replace a connected provider's credentials. */
  rekey: (providerId: ProviderId, creds: IModelRegistryCreds) => Promise<IModelRegistryConnectResult>;
  /** Curated model list scoped to a CLI agent / backend key. */
  curatedForAgent: (agentKey: string) => Promise<CuratedModel[]>;
};

const ModelRegistryContext = createContext<UseModelRegistry | null>(null);

/**
 * Inner hook implementation — owns the providers list + loading/error state
 * and exposes every method. Used directly by `ModelRegistryProvider`, or as a
 * standalone fallback by `useModelRegistry` when no provider is in scope
 * (read-only consumers like the home model picker).
 *
 * `skipInitialReload` suppresses the mount-time `list()` IPC — surfaces that
 * only need pass-throughs (e.g. `curatedForAgent`) shouldn't hammer the list
 * endpoint just to satisfy the hook contract.
 */
function useModelRegistryImpl(skipInitialReload = false): UseModelRegistry {
  const [providers, setProviders] = useState<IModelRegistryProviderView[]>([]);
  const [loading, setLoading] = useState(!skipInitialReload);
  const [error, setError] = useState<string | null>(null);

  // Monotonic request sequence. Concurrent mutations each `await reload()`;
  // `list()` calls can resolve out of order, so a stale snapshot could win.
  // Each reload captures its sequence number and only commits its result if no
  // newer reload has started since.
  const reloadSeq = useRef(0);

  const reload = useCallback(async () => {
    const seq = ++reloadSeq.current;
    setLoading(true);
    setError(null);
    try {
      const list = await modelRegistry.list.invoke();
      if (seq !== reloadSeq.current) return; // a newer reload superseded this one
      if (Array.isArray(list)) {
        setProviders(list);
      } else {
        // A non-array response is an IPC error — surface it as `error` and
        // keep the previous providers list intact (don't blank the UI).
        setError('Unexpected response from modelRegistry.list');
      }
    } catch (err) {
      if (seq !== reloadSeq.current) return;
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (seq === reloadSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!skipInitialReload) void reload();
  }, [reload, skipInitialReload]);

  const detectKeys = useCallback(() => modelRegistry.detectKeys.invoke(), []);

  const connect = useCallback(
    async (providerId: ProviderId, creds: IModelRegistryCreds) => {
      const res = await modelRegistry.connect.invoke({ providerId, creds });
      // Only reload on success — a failed connect produces no state change
      // worth re-fetching, and the caller already has the failure detail.
      if (res.ok) await reload();
      return res;
    },
    [reload]
  );

  const testConnection = useCallback(
    (providerId: ProviderId) => modelRegistry.testConnection.invoke({ providerId }),
    []
  );

  const getCatalog = useCallback((providerId: ProviderId) => modelRegistry.getCatalog.invoke({ providerId }), []);

  const toggleModel = useCallback(
    async (providerId: ProviderId, modelId: string, enabled: boolean) => {
      const res = await modelRegistry.toggleModel.invoke({ providerId, modelId, enabled });
      // A successful toggle changes a connected provider's `modelCount` — the
      // parent's row badge/state needs to refresh when the user returns.
      if (res?.ok) await reload();
      return res;
    },
    [reload]
  );

  const refresh = useCallback(
    async (providerId: ProviderId) => {
      const res = await modelRegistry.refresh.invoke({ providerId });
      if (res?.ok) await reload();
      return res;
    },
    [reload]
  );

  const disconnect = useCallback(
    async (providerId: ProviderId) => {
      const res = await modelRegistry.disconnect.invoke({ providerId });
      if (res?.ok) await reload();
      return res;
    },
    [reload]
  );

  const rekey = useCallback(
    async (providerId: ProviderId, creds: IModelRegistryCreds) => {
      const res = await modelRegistry.rekey.invoke({ providerId, creds });
      if (res.ok) await reload();
      return res;
    },
    [reload]
  );

  const curatedForAgent = useCallback((agentKey: string) => modelRegistry.curatedForAgent.invoke({ agentKey }), []);

  return useMemo(
    () => ({
      providers,
      loading,
      error,
      reload,
      detectKeys,
      connect,
      testConnection,
      getCatalog,
      toggleModel,
      refresh,
      disconnect,
      rekey,
      curatedForAgent,
    }),
    [
      providers,
      loading,
      error,
      reload,
      detectKeys,
      connect,
      testConnection,
      getCatalog,
      toggleModel,
      refresh,
      disconnect,
      rekey,
      curatedForAgent,
    ]
  );
}

/**
 * Context provider that owns one shared `providers` snapshot for every
 * descendant `useModelRegistry()` consumer. Wrap the Models settings root in
 * this provider so the page, the Manage view, and the Browse modal all see
 * the same mutations — a disconnect from Manage drops the row on the parent,
 * a Browse-modal connect adds it, a re-key refreshes the header badge.
 */
export const ModelRegistryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useModelRegistryImpl();
  return React.createElement(ModelRegistryContext.Provider, { value }, children);
};

/**
 * Consume the shared model-registry state. Inside a `ModelRegistryProvider`
 * every call shares one `providers` snapshot; outside, the hook falls back to
 * a fresh per-consumer instance (fine for read-only callers like the home
 * model picker that only need `curatedForAgent`).
 */
export function useModelRegistry(): UseModelRegistry {
  const ctx = useContext(ModelRegistryContext);
  // Fresh-instance fallback for surfaces outside the provider — keeps the API
  // contract stable for read-only consumers that aren't part of the Models
  // settings tree. The fallback skips the mount-time list() IPC; consumers
  // that care about `providers` should sit inside a `ModelRegistryProvider`.
  const standalone = useModelRegistryImpl(ctx !== null);
  return ctx ?? standalone;
}
