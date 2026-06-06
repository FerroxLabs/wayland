/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * InstallFailedCard - Wave 4 surface shown when IJFW status is
 * `install_failed`. Replaces the Wave 3 placeholder.
 *
 * Props mirror the {@link IjfwStatusPayload} fields surfaced for failures:
 *   - `errorReason` drives the localized error copy via `memory.error.<reason>`,
 *     falling back to `memory.error.unknown` when the reason is missing or
 *     unrecognised. The set of known reasons is the {@link IjfwErrorReason}
 *     union in `src/common/types/ijfw.ts`.
 *   - `stderr`, when present, is shown verbatim inside a collapsible Details
 *     section so users can copy/paste it into a bug report without leaking
 *     it into the default surface.
 *
 * The Retry button calls `ipcBridge.ijfw.triggerInstall.invoke()` - the same
 * surface InstallerPitchCard's primary CTA uses. MemoryPage routes to
 * InstallingCard as soon as the bridge emits the `installing` status; the
 * local disabled state guards against double-fires before that flip.
 */

import { Button, Collapse } from '@arco-design/web-react';
import { AlertCircle } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import { IJFW_ERROR_REASONS, type IjfwErrorReason } from '@/common/types/ijfw';
import styles from './InstallFailedCard.module.css';

type InstallFailedCardProps = {
  errorReason?: string;
  stderr?: string;
};

const KNOWN_REASONS: ReadonlySet<string> = new Set<string>(IJFW_ERROR_REASONS);

const resolveErrorKey = (reason: string | undefined): string => {
  if (reason && KNOWN_REASONS.has(reason)) {
    return `memory.error.${reason as IjfwErrorReason}`;
  }
  return 'memory.error.unknown';
};

const InstallFailedCard: React.FC<InstallFailedCardProps> = ({ errorReason, stderr }) => {
  const { t } = useTranslation();
  const [isRetrying, setIsRetrying] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleRetry = useCallback(async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    try {
      await ipcBridge.ijfw.triggerInstall.invoke();
    } catch {
      // If the bridge rejects, flip the button back so the user can retry.
      // MemoryPage will route to InstallingCard / InstallFailedCard once the
      // lifecycle status advances; here we only own the local CTA state.
      setIsRetrying(false);
    }
  }, [isRetrying]);

  const errorMessage = t(resolveErrorKey(errorReason));
  const hasStderr = typeof stderr === 'string' && stderr.length > 0;

  return (
    <div className={styles.center} data-testid='memory-install-failed' role='alert' aria-live='assertive'>
      <div className={styles.card}>
        <div className={styles.headerRow}>
          <AlertCircle size={20} className={styles.errorIcon} aria-hidden />
          <h2 className='text-16px font-semibold text-t-primary leading-24px m-0'>{t('memory.failed.title')}</h2>
        </div>
        <p className={styles.message} data-testid='memory-install-failed-message'>
          {errorMessage}
        </p>
        <div className={styles.actions}>
          <Button
            type='primary'
            size='default'
            disabled={isRetrying}
            onClick={handleRetry}
            data-testid='memory-install-failed-retry'
          >
            {t('memory.failed.retry')}
          </Button>
        </div>
        {hasStderr && (
          <Collapse
            className={styles.detailsCollapse}
            bordered={false}
            onChange={(_, keys) => {
              setDetailsOpen((keys as string[]).includes('stderr'));
            }}
            data-testid='memory-install-failed-details'
          >
            <Collapse.Item
              name='stderr'
              header={detailsOpen ? t('memory.failed.details_hide') : t('memory.failed.details_toggle')}
            >
              <pre className={styles.stderrPre} data-testid='memory-install-failed-stderr'>
                {stderr}
              </pre>
            </Collapse.Item>
          </Collapse>
        )}
      </div>
    </div>
  );
};

export default InstallFailedCard;
