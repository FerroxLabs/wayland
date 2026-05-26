/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Wave 5 - PromotionsTab shows the queue of memories pending promotion to the
 * wiki. The list refreshes via bounded polling: 30s on success, with
 * exponential backoff (30s → 60s → 120s → 240s, capped at 300s) on error.
 * Rows expose Promote / Skip / Preview actions and a manual Refresh button
 * tops the panel.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Message } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, RefreshCw, Sparkle } from 'lucide-react';
import { ipcBridge } from '@/common';
import MCPVerbCard from '../components/MCPVerbCard';
import { useIjfwBrain } from '../hooks/useIjfwBrain';
import styles from './PromotionsTab.module.css';

type PendingItem = {
  id: string;
  preview: string;
  queuedAt: number;
};

type PendingPayload = {
  pending: PendingItem[];
};

const INITIAL_BACKOFF_MS = 30_000;
const MAX_BACKOFF_MS = 300_000;

const PromotionsTab: React.FC = () => {
  const { t } = useTranslation();
  const [pollGen, setPollGen] = useState(0);
  const [backoffMs, setBackoffMs] = useState(INITIAL_BACKOFF_MS);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const state = useIjfwBrain<PendingPayload>('memory_facts', { pending_promotion: true }, [pollGen]);

  // Bounded polling with exponential backoff. When the fetch settles:
  //   - success → schedule the next poll at the 30s base interval, and reset
  //     the backoff state for future failures.
  //   - failure → double the backoff first (30→60→120→240→300 cap), then
  //     schedule the next poll at the new backoff.
  // Effect deps are pinned to the fetch-settled signal so the effect runs
  // exactly once per settled response, not on every render.
  const isLoading = state.loading;
  const isOk = state.loading === false && state.ok === true;
  useEffect(() => {
    if (isLoading) return;
    let delay: number;
    if (isOk) {
      delay = INITIAL_BACKOFF_MS;
      if (backoffMs !== INITIAL_BACKOFF_MS) setBackoffMs(INITIAL_BACKOFF_MS);
    } else {
      delay = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
      if (delay !== backoffMs) setBackoffMs(delay);
    }
    const id = setTimeout(() => setPollGen((g) => g + 1), delay);
    return () => clearTimeout(id);
    // backoffMs is read fresh (closure capture) but excluded from deps so
    // updating it inside the effect doesn't re-fire the schedule.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isOk, pollGen]);

  const handleRefresh = useCallback(() => {
    setPollGen((g) => g + 1);
  }, []);

  const handlePromote = useCallback(
    async (id: string) => {
      try {
        const result = await ipcBridge.ijfw.brainInvoke.invoke({
          verb: 'wiki.promote',
          args: { id },
        });
        if (result.ok === true) {
          Message.success(t('memory.promotions.promote_success'));
          setPollGen((g) => g + 1);
        } else {
          Message.error(t('memory.promotions.promote_error'));
        }
      } catch {
        Message.error(t('memory.promotions.promote_error'));
      }
    },
    [t]
  );

  const handleSkip = useCallback(
    async (id: string) => {
      try {
        // TODO: `memory_facts` does not yet accept a `skipPromotion` arg on
        // the brain side. Wave 6 will route this through a dedicated verb.
        const result = await ipcBridge.ijfw.brainInvoke.invoke({
          verb: 'memory_facts',
          args: { id, skipPromotion: true },
        });
        if (result.ok === true) {
          Message.success(t('memory.promotions.skip_success'));
          setPollGen((g) => g + 1);
        } else {
          Message.error(t('memory.promotions.skip_error'));
        }
      } catch {
        Message.error(t('memory.promotions.skip_error'));
      }
    },
    [t]
  );

  const togglePreview = useCallback((id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return (
    <div className={styles.container} data-testid='memory-tab-promotions'>
      <div className={styles.header}>
        <div className={styles.title}>
          <Sparkle size={16} aria-hidden />
          <span>{t('memory.promotions.title')}</span>
        </div>
        <Button
          size='small'
          icon={<RefreshCw size={14} aria-hidden />}
          onClick={handleRefresh}
          data-testid='memory-promotions-refresh'
        >
          {t('memory.promotions.refresh')}
        </Button>
      </div>

      <MCPVerbCard<PendingPayload>
        state={state}
        empty={
          <div className={styles.empty} data-testid='memory-promotions-empty'>
            {t('memory.promotions.empty')}
          </div>
        }
        render={(data) => {
          const pending = data?.pending ?? [];
          if (pending.length === 0) {
            return (
              <div className={styles.empty} data-testid='memory-promotions-empty'>
                {t('memory.promotions.empty')}
              </div>
            );
          }
          return (
            <div className={styles.list} data-testid='memory-promotions-list'>
              {pending.map((item) => {
                const expanded = expandedIds[item.id] === true;
                return (
                  <div key={item.id} className={styles.row} data-testid={`memory-promotions-row-${item.id}`}>
                    <div className={styles.rowHead}>
                      <div className={`${styles.preview} ${expanded ? styles.previewExpanded : ''}`}>
                        {item.preview}
                      </div>
                      <div className={styles.actions}>
                        <Button
                          size='mini'
                          type='primary'
                          icon={<ArrowRight size={12} aria-hidden />}
                          onClick={() => handlePromote(item.id)}
                          data-testid={`memory-promotions-promote-${item.id}`}
                        >
                          {t('memory.promotions.promote')}
                        </Button>
                        <Button
                          size='mini'
                          onClick={() => handleSkip(item.id)}
                          data-testid={`memory-promotions-skip-${item.id}`}
                        >
                          {t('memory.promotions.skip')}
                        </Button>
                        <Button
                          size='mini'
                          type='text'
                          onClick={() => togglePreview(item.id)}
                          data-testid={`memory-promotions-preview-${item.id}`}
                        >
                          {expanded ? t('memory.promotions.preview_hide') : t('memory.promotions.preview')}
                        </Button>
                      </div>
                    </div>
                    <div className={styles.queuedAt}>
                      {t('memory.promotions.queued_at', {
                        time: new Date(item.queuedAt).toLocaleString(),
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }}
      />
    </div>
  );
};

export default PromotionsTab;
