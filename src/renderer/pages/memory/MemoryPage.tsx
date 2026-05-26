/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Wave 3 — Memory page shell + 6-state router.
 *
 * Subscribes to `ipcBridge.ijfw.onStatusChanged` and dispatches one of five
 * Wave-3 placeholder components based on {@link IjfwLifecycleStatus}.
 *
 * Notes on coexistence with Wave 2 (parallel branch):
 *   - This file only READS the `ipcBridge.ijfw` namespace. It does not add
 *     new keys, mutate the bridge module, or touch any file under
 *     `src/process/services/ijfw/` or the bridge wrappers.
 *   - `getStatus` may not be wired yet when this branch lands. The page
 *     calls it defensively: if it throws or resolves with no payload, the
 *     UI stays in its initial "querying" state until the first emit
 *     arrives. The emitter subscription is the load-bearing path.
 *
 * Wave 5 will replace the always-empty `installed_current` branch with a
 * real "has memories?" check.
 */

import { Spin } from '@arco-design/web-react';
import React, { useEffect, useState } from 'react';
import { ipcBridge } from '@/common';
import type { IjfwStatusPayload } from '@/common/adapter/ipcBridge';
import InstallerPitchCard from './state-branches/InstallerPitchCard';
import InstallingCard from './state-branches/InstallingCard';
import InstallFailedCard from './state-branches/InstallFailedCard';
import OnboardingEmptyState from './state-branches/OnboardingEmptyState';
import FullPanelShell from './state-branches/FullPanelShell';
import { useIjfwBrain } from './hooks/useIjfwBrain';
import styles from './MemoryPage.module.css';

type MemoryFactsData = {
  facts?: unknown[];
};

/**
 * Routes the `installed_current` state by checking whether the active brain
 * has any memories via the `memory_facts` MCP verb. Lifted into its own
 * component so the `useIjfwBrain` hook only fires when status reaches
 * `installed_current` — keeping it inside MemoryPage would force every
 * lifecycle state to pay the IPC roundtrip.
 *
 * Routing decisions:
 *   - loading -> spinner
 *   - ok, zero facts -> OnboardingEmptyState
 *   - ok, has facts -> FullPanelShell
 *   - !ok (degraded) -> FullPanelShell so the user can still reach the tabs
 */
const InstalledCurrentBranch: React.FC = () => {
  const state = useIjfwBrain<MemoryFactsData>('memory_facts', { any: true });
  if (state.loading) {
    return (
      <div className={styles.center} data-testid='memory-installed-loading'>
        <Spin />
      </div>
    );
  }
  if (state.ok) {
    const factsLength = state.data.facts?.length ?? 0;
    if (factsLength === 0) {
      return <OnboardingEmptyState />;
    }
    return <FullPanelShell />;
  }
  // Degraded: brain invoke failed but the user has activated. Show the full
  // shell so they can still navigate; individual tabs surface their own
  // per-verb error states.
  return <FullPanelShell />;
};

const renderStateBranch = (status: IjfwStatusPayload | null): React.ReactElement => {
  if (!status) {
    return (
      <div className={styles.center} data-testid='memory-loading'>
        <p className='text-14px text-t-secondary m-0'>Checking IJFW status…</p>
      </div>
    );
  }
  switch (status.status) {
    case 'not_installed':
      return <InstallerPitchCard />;
    case 'installing':
      return <InstallingCard version={status.version} />;
    case 'upgrading':
      return <InstallingCard version={status.version} />;
    case 'installed_pending_activation':
      return <InstallingCard version={status.version} />;
    case 'install_failed':
      return <InstallFailedCard errorReason={status.errorReason} stderr={status.stderr} />;
    case 'installed_current':
      return <InstalledCurrentBranch />;
    default:
      // Exhaustiveness guard — keeps FullPanelShell reachable for the
      // typechecker and gives Wave 5 a fallback for unknown states.
      return <FullPanelShell />;
  }
};

const MemoryPage: React.FC = () => {
  const [status, setStatus] = useState<IjfwStatusPayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Initial snapshot. Wave 2 owns the provider implementation; if it has
    // not landed in this branch yet, fall through to the emitter path.
    const getStatusProvider = ipcBridge.ijfw.getStatus;
    if (getStatusProvider && typeof getStatusProvider.invoke === 'function') {
      Promise.resolve(getStatusProvider.invoke())
        .then((payload) => {
          if (cancelled) return;
          if (payload && typeof payload === 'object') {
            setStatus(payload as IjfwStatusPayload);
          }
        })
        .catch(() => {
          // Provider may not be wired yet — wait for the next emit.
        });
    }

    const unsubscribe = ipcBridge.ijfw.onStatusChanged.on((payload) => {
      if (cancelled) return;
      setStatus(payload);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return (
    <div className={styles.page} data-testid='memory-page'>
      {renderStateBranch(status)}
    </div>
  );
};

export default MemoryPage;
