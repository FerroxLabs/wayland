/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { modelRegistry } from '@/common/adapter/ipcBridge';
import { FLUX_PROVIDER_ID } from '@/common/config/flux';

/**
 * Whether the `flux-router` provider is currently connected in the model
 * registry. This mirrors the connected-state source the FluxRouterHero /
 * FluxRouterCard use (`providers.some((p) => p.providerId === 'flux-router')`),
 * but reads it directly via IPC so it works outside the `ModelRegistryProvider`
 * tree (the chat header where AcpModelSelector renders is not wrapped by it).
 *
 * Re-fetches on every `modelRegistry.listChanged` event so connecting /
 * disconnecting Flux toggles the picker's Flux group live.
 */
export function useFluxConnected(): boolean {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const list = await modelRegistry.list.invoke();
        if (cancelled) return;
        const isConnected = Array.isArray(list) && list.some((p) => p.providerId === FLUX_PROVIDER_ID);
        setConnected(isConnected);
      } catch {
        // Best-effort: a failed read leaves the last-known state on screen.
      }
    };

    void load();
    const off = modelRegistry.listChanged.on(() => {
      void load();
    });

    return () => {
      cancelled = true;
      off();
    };
  }, []);

  return connected;
}
