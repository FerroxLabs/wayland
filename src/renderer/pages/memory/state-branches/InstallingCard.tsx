/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Wave 4 - InstallingCard production component.
 *
 * Renders the in-flight surface for three lifecycle states that the
 * MemoryPage routes here as a single component:
 *   - `installing`                    -> spinner + 4-step progress
 *   - `upgrading`                     -> spinner + 4-step progress
 *   - `installed_pending_activation`  -> swaps in pending message + Restart-now
 *
 * The MemoryPage owns the parent subscription that selected this card; this
 * component still subscribes on its own to `onStatusChanged` so it can flip
 * the activate-step into the Restart-now affordance the moment the status
 * transitions to `installed_pending_activation` without remounting.
 *
 * Degraded mode: queries `getRuntimeMode` once on mount and shows a top
 * banner when the runtime returns `'degraded'`. Failures are silent - the
 * banner just stays hidden.
 */

import React, { useEffect, useState } from 'react';
import { Spin, Button } from '@arco-design/web-react';
import { Check, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type { IjfwLifecycleStatus, IjfwStatusPayload } from '@/common/adapter/ipcBridge';
import styles from './InstallingCard.module.css';

type InstallingCardProps = {
  version?: string;
};

type StepKey = 'download' | 'extract' | 'verify' | 'activate';

const STEPS: ReadonlyArray<{ key: StepKey; labelKey: string }> = [
  { key: 'download', labelKey: 'installing.step_download' },
  { key: 'extract', labelKey: 'installing.step_extract' },
  { key: 'verify', labelKey: 'installing.step_verify' },
  { key: 'activate', labelKey: 'installing.step_activate' },
];

const InstallingCard: React.FC<InstallingCardProps> = ({ version }) => {
  const { t } = useTranslation('memory');
  const [pendingActivation, setPendingActivation] = useState(false);
  const [degraded, setDegraded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Best-effort: query runtime mode once on mount. Provider may not be
    // wired in every test env - failures stay silent and the banner hides.
    const runtimeProvider = ipcBridge.ijfw.getRuntimeMode;
    if (runtimeProvider && typeof runtimeProvider.invoke === 'function') {
      Promise.resolve(runtimeProvider.invoke())
        .then((mode) => {
          if (cancelled) return;
          if (mode === 'degraded') setDegraded(true);
        })
        .catch(() => {
          // Silent - banner stays hidden if the bridge can't answer.
        });
    }

    const emitter = ipcBridge.ijfw.onStatusChanged;
    if (!emitter || typeof emitter.on !== 'function') {
      return () => {
        cancelled = true;
      };
    }

    const unsubscribe = emitter.on((payload: IjfwStatusPayload) => {
      if (cancelled) return;
      const status: IjfwLifecycleStatus = payload.status;
      setPendingActivation(status === 'installed_pending_activation');
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const handleRestart = (): void => {
    const restart = ipcBridge.application?.restart;
    if (restart && typeof restart.invoke === 'function') {
      void restart.invoke();
    }
  };

  return (
    <div data-testid='memory-installing-card'>
      {degraded ? (
        <div
          className={styles.banner}
          data-testid='memory-installing-degraded-banner'
          role='status'
          aria-live='polite'
        >
          {t('degraded.banner')}
        </div>
      ) : null}
      <div
        className={styles.card}
        role='status'
        aria-live='polite'
        aria-busy={pendingActivation ? 'false' : 'true'}
      >
        <Spin size={32} />
        <h2 className={styles.title}>{pendingActivation ? t('upgrading.title') : t('installing.title')}</h2>
        <p className={styles.subtitle}>{t('installing.subtitle')}</p>
        {version ? (
          <p className={styles.versionLine} data-testid='memory-installing-version'>
            {t('installing.version_label', { version })}
          </p>
        ) : null}
        <ul className={styles.steps}>
          {STEPS.map((step) => {
            const isActivateStep = step.key === 'activate';
            const isCompleted = isActivateStep && pendingActivation;
            return (
              <li key={step.key} className={styles.step} data-testid={`memory-installing-step-${step.key}`}>
                <span className={styles.stepIcon}>{isCompleted ? <Check size={16} /> : <Circle size={16} />}</span>
                <span>{t(step.labelKey)}</span>
              </li>
            );
          })}
        </ul>
        {pendingActivation ? (
          <div className={styles.pendingActions} data-testid='memory-installing-pending'>
            <p className={styles.pendingMessage}>{t('upgrading.pending_message')}</p>
            <Button type='primary' onClick={handleRestart}>
              {t('upgrading.restart_now')}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default InstallingCard;
