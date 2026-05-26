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
  if (state.loading === true) {
    return (
      <div
        className={styles.center}
        data-testid='memory-installed-loading'
        role='status'
        aria-busy='true'
        aria-live='polite'
      >
        <Spin />
      </div>
    );
  }
  if (state.ok === true) {
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
      <div
        className={styles.center}
        data-testid='memory-loading'
        role='status'
        aria-busy='true'
        aria-live='polite'
      >
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
    let snapshotArrived = false;
    const fallbackToNotInstalled = (): void => {
      if (cancelled || snapshotArrived) return;
      snapshotArrived = true;
      setStatus({ status: 'not_installed' });
    };

    // Initial snapshot. The bridge's `getStatus` provider falls back to
    // `{status:'not_installed'}` when `__lastStatus` is null — but if the
    // invoke fails for any reason (IPC race, channel rejection, serialization
    // error), we MUST NOT silently wedge the page on the loading state. In
    // `not_installed` steady state, `bootstrap()` does not spontaneously emit,
    // so the emitter path alone cannot rescue a stuck render.
    const getStatusProvider = ipcBridge.ijfw.getStatus;
    if (getStatusProvider && typeof getStatusProvider.invoke === 'function') {
      Promise.resolve(getStatusProvider.invoke())
        .then((payload) => {
          if (cancelled) return;
          if (payload && typeof payload === 'object') {
            snapshotArrived = true;
            setStatus(payload as IjfwStatusPayload);
          } else {
            fallbackToNotInstalled();
          }
        })
        .catch(() => {
          // Invoke rejected (no handler, IPC race, serialization). Fall back
          // so the user sees the install pitch instead of an infinite spinner.
          fallbackToNotInstalled();
        });
    } else {
      // Provider not even exposed on this build — fall back immediately.
      fallbackToNotInstalled();
    }

    // Safety net: if neither invoke nor an early emit settles within 1.5s,
    // assume not_installed. Real status changes still update the UI via the
    // emitter subscription below.
    const safetyTimer = setTimeout(fallbackToNotInstalled, 1500);

    const unsubscribe = ipcBridge.ijfw.onStatusChanged.on((payload) => {
      if (cancelled) return;
      snapshotArrived = true;
      setStatus(payload);
    });

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  return (
    <div className={styles.page} data-testid='memory-page' role='region' aria-label='IJFW Memory'>
      {renderStateBranch(status)}
    </div>
  );
};

export default MemoryPage;
