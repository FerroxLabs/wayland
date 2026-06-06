import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { modelRegistry } from '@/common/adapter/ipcBridge';
import type {
  IModelRegistryCatalogView,
  IModelRegistryConnectResult,
  IModelRegistryCreds,
  IModelRegistryDetectedKey,
  IModelRegistryProviderView,
  IModelRegistryRefreshState,
  IModelRegistryRefreshSummary,
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
 * `{ success, data }` envelope - that wrapper only applies to namespaces whose
 * declared return type is `IBridgeResponse`).
 *
 * The hook is a thin consumer of `ModelRegistryProvider` - wrap the tree once
 * at the Models settings root so child surfaces (Manage / Browse) share one
 * `providers` snapshot. Surfaces outside the Models tree (e.g. the home
 * picker) can read `curatedForAgent` without a provider; the rest of the API
 * still works but each consumer owns its own snapshot - see
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
  /**
   * Re-fetch + re-enrich every connected provider once and return the run
   * summary (added models, success/failure, freshness stamp). Reloads the
   * providers list on resolve so the page header / row badges reflect the run.
   */
  refreshAll: () => Promise<IModelRegistryRefreshSummary>;
  /**
   * Monotonic invalidation counter for registry-derived data. Bumped on every
   * `modelRegistry.listChanged` event (a global or per-provider refresh landed)
   * and on every successful `reload()`. Consumers that fetch derived views
   * imperatively (`curatedForAgent` / `getCatalog`, which are pass-throughs,
   * not hook-held state) depend on this value so an open picker / catalog view
   * re-fetches live when a background refresh changes the catalog.
   */
  registryVersion: number;
};

const ModelRegistryContext = createContext<UseModelRegistry | null>(null);

/**
 * Inner hook implementation - owns the providers list + loading/error state
 * and exposes every method. Used directly by `ModelRegistryProvider`, or as a
 * standalone fallback by `useModelRegistry` when no provider is in scope
 * (read-only consumers like the home model picker).
 *
 * `skipInitialReload` suppresses the mount-time `list()` IPC - surfaces that
 * only need pass-throughs (e.g. `curatedForAgent`) shouldn't hammer the list
 * endpoint just to satisfy the hook contract.
 */
function useModelRegistryImpl(skipInitialReload = false): UseModelRegistry {
  const [providers, setProviders] = useState<IModelRegistryProviderView[]>([]);
  const [loading, setLoading] = useState(!skipInitialReload);
  const [error, setError] = useState<string | null>(null);
  // Invalidation counter for registry-derived data - see `registryVersion` in
  // the {@link UseModelRegistry} contract.
  const [registryVersion, setRegistryVersion] = useState(0);

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
        // A fresh providers snapshot can carry new catalogs (a connect / rekey
        // / refresh landed) - bump the invalidation counter so derived-view
        // consumers re-fetch.
        setRegistryVersion((v) => v + 1);
      } else {
        // A non-array response is an IPC error - surface it as `error` and
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

  // Live invalidation: the main process emits `modelRegistry.listChanged` once
  // at the end of every successful global `refreshAll` and after a manual
  // per-provider refresh. Subscribe the same way the renderer subscribes to
  // `conversation.listChanged` / `team.listChanged` (see useTeamList.ts) and
  // re-fetch the providers list - `reload()` also bumps `registryVersion`, so
  // derived-view consumers (curatedForAgent / getCatalog) re-fetch live.
  useEffect(() => {
    return modelRegistry.listChanged.on(() => {
      void reload();
    });
  }, [reload]);

  const detectKeys = useCallback(() => modelRegistry.detectKeys.invoke(), []);

  const connect = useCallback(
    async (providerId: ProviderId, creds: IModelRegistryCreds) => {
      const res = await modelRegistry.connect.invoke({ providerId, creds });
      // Only reload on success - a failed connect produces no state change
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
      // A successful toggle changes a connected provider's `modelCount` - the
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

  const refreshAll = useCallback(async () => {
    const summary = await modelRegistry.refreshAll.invoke({ reason: 'manual' });
    // Refresh the providers list so per-row badges / model counts reflect the
    // run. The main process also emits `listChanged`, but awaiting `reload()`
    // here keeps the click → freshness-label / row update synchronous for the
    // Models page header.
    await reload();
    return summary;
  }, [reload]);

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
      refreshAll,
      registryVersion,
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
      refreshAll,
      registryVersion,
    ]
  );
}

/**
 * Read the global model-registry refresh state (last success timestamp +
 * in-flight flag) for the Models settings header. Fetches once on mount and
 * re-fetches on every `modelRegistry.listChanged` event so the "updated Xh
 * ago" label and the spinner track background / scheduler-driven refreshes
 * even when this surface didn't trigger them.
 */
export function useRefreshState(): IModelRegistryRefreshState {
  const [state, setState] = useState<IModelRegistryRefreshState>({ lastRefreshedAt: null, refreshing: false });

  const load = useCallback(async () => {
    try {
      const next = await modelRegistry.getRefreshState.invoke();
      if (next && typeof next === 'object') setState(next);
    } catch {
      // Best-effort - a failed read leaves the last-known freshness on screen.
    }
  }, []);

  useEffect(() => {
    void load();
    return modelRegistry.listChanged.on(() => {
      void load();
    });
  }, [load]);

  return state;
}

/**
 * Context provider that owns one shared `providers` snapshot for every
 * descendant `useModelRegistry()` consumer. Wrap the Models settings root in
 * this provider so the page, the Manage view, and the Browse modal all see
 * the same mutations - a disconnect from Manage drops the row on the parent,
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
  // Fresh-instance fallback for surfaces outside the provider - keeps the API
  // contract stable for read-only consumers that aren't part of the Models
  // settings tree. The fallback skips the mount-time list() IPC; consumers
  // that care about `providers` should sit inside a `ModelRegistryProvider`.
  const standalone = useModelRegistryImpl(ctx !== null);
  return ctx ?? standalone;
}
