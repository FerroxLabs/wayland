/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Memory page shell + 6-state router.
 *
 * Subscribes to `ipcBridge.ijfw.onStatusChanged` and dispatches one of five
 * production components based on {@link IjfwLifecycleStatus}. Once status is
 * `installed_current`, the FullPanelShell owns the per-tab data flow - empty
 * states surface inside individual tabs, not at the route level. (The prior
 * `memory_facts({any:true})` route-level gate was a hallucinated arg shape
 * that wedged users with hundreds of memories on an onboarding screen.)
 */

import React, { useEffect, useState } from 'react';
import { ipcBridge } from '@/common';
import type { IjfwStatusPayload } from '@/common/adapter/ipcBridge';
import AutoSettingUpCard from './state-branches/AutoSettingUpCard';
import InstallerPitchCard from './state-branches/InstallerPitchCard';
import InstallingCard from './state-branches/InstallingCard';
import InstallFailedCard from './state-branches/InstallFailedCard';
import FullPanelShell from './state-branches/FullPanelShell';
import styles from './MemoryPage.module.css';

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
      // v0.6.3 disclosure / auto-install UX flip: bootstrap auto-installs at
      // +5s on app boot, so the default `not_installed` view is the silent
      // "Setting up Memory" surface. The InstallerPitchCard is now exclusively
      // the OPT-OUT re-enable surface -- shown only when the user explicitly
      // disabled IJFW via Settings (`reason === 'opt_out'`).
      if (status.reason === 'opt_out') {
        return <InstallerPitchCard />;
      }
      return <AutoSettingUpCard />;
    case 'installing':
      return <InstallingCard version={status.version} />;
    case 'upgrading':
      return <InstallingCard version={status.version} />;
    case 'installed_pending_activation':
      return <InstallingCard version={status.version} />;
    case 'install_failed':
      return <InstallFailedCard errorReason={status.errorReason} stderr={status.stderr} />;
    case 'installed_current':
      return <FullPanelShell />;
    default:
      // Exhaustiveness guard - keeps FullPanelShell reachable for the
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

    // Gemini H2: prior `Promise.resolve(invoke()).then(...).catch(...)` chain
    // did NOT catch SYNCHRONOUS throws from `invoke()`. The IPC dispatcher can
    // throw synchronously before returning a promise (not yet hydrated,
    // serialization error on `void` params, channel uninitialized). Such a
    // throw escaped the Promise chain entirely and left the page stuck on the
    // initial loading state. The async IIFE + try/catch wraps both sync and
    // async failures in a single guard.
    const initialSnapshot = async (): Promise<void> => {
      const getStatusProvider = ipcBridge.ijfw.getStatus;
      if (!getStatusProvider || typeof getStatusProvider.invoke !== 'function') {
        fallbackToNotInstalled();
        return;
      }
      try {
        const payload = await getStatusProvider.invoke();
        if (cancelled) return;
        if (payload && typeof payload === 'object') {
          snapshotArrived = true;
          setStatus(payload as IjfwStatusPayload);
        } else {
          fallbackToNotInstalled();
        }
      } catch {
        // Sync throw or rejected promise - both routed here. Fall back so the
        // user sees the install pitch instead of an infinite spinner.
        fallbackToNotInstalled();
      }
    };
    void initialSnapshot();

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
