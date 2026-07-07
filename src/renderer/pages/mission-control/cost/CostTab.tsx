/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Mission Control cost tab: period selector, summary cards, the hand-rolled SVG
 * trend, by-model / by-backend / by-team / by-conversation breakdown bars, and
 * the budgets panel. Covers solo + team in one view (no flag).
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Radio } from '@arco-design/web-react';
import { RefreshCw } from 'lucide-react';
import { formatTokenCount, formatUsd } from '@renderer/utils/format/tokens';
import { type CostPeriod } from './costChart';
import { useCostAnalytics } from './useCostAnalytics';
import { CostTrend } from './CostTrend';
import { CostBreakdown } from './CostBreakdown';
import { BudgetsPanel } from './BudgetsPanel';
import styles from './Cost.module.css';

const PERIODS: CostPeriod[] = ['day', 'week', 'month'];

const SummaryCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className={styles.card}>
    <span className={styles.cardLabel}>{label}</span>
    <span className={styles.cardValue}>{value}</span>
  </div>
);

export const CostTab: React.FC = () => {
  const { t } = useTranslation();
  const { period, setPeriod, summary, byModel, byBackend, byTeam, byConversation, series, loading, refresh } =
    useCostAnalytics();

  const hasData = summary.events > 0;
  const unattributed = t('missionControl.cost.unattributed');

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>{t('missionControl.cost.periodLabel')}</span>
        <div className='flex items-center gap-10px'>
          <Radio.Group type='button' size='small' value={period} onChange={(v) => setPeriod(v as CostPeriod)}>
            {PERIODS.map((p) => (
              <Radio key={p} value={p}>
                {t(`missionControl.cost.period.${p}`)}
              </Radio>
            ))}
          </Radio.Group>
          <Button size='small' icon={<RefreshCw size={14} />} loading={loading} onClick={() => void refresh()}>
            {t('missionControl.refresh')}
          </Button>
        </div>
      </div>

      <div className={styles.cards}>
        <SummaryCard label={t('missionControl.cost.totalSpend')} value={formatUsd(summary.costUsd)} />
        <SummaryCard label={t('missionControl.cost.totalTokens')} value={formatTokenCount(summary.tokensTotal)} />
        <SummaryCard label={t('missionControl.cost.totalEvents')} value={summary.events.toLocaleString()} />
      </div>

      {!hasData ? (
        <div className={styles.panel}>
          <div className={styles.empty}>
            <span className={styles.emptyTitle}>{t('missionControl.cost.emptyTitle')}</span>
            <span className={styles.emptyHint}>{t('missionControl.cost.emptyHint')}</span>
          </div>
        </div>
      ) : (
        <>
          <CostTrend series={series} period={period} />
          <div className={styles.grid2}>
            <CostBreakdown title={t('missionControl.cost.byModel')} rows={byModel} unattributedLabel={unattributed} />
            <CostBreakdown
              title={t('missionControl.cost.byBackend')}
              rows={byBackend}
              unattributedLabel={unattributed}
            />
            <CostBreakdown title={t('missionControl.cost.byTeam')} rows={byTeam} unattributedLabel={unattributed} />
            <CostBreakdown
              title={t('missionControl.cost.byConversation')}
              rows={byConversation}
              unattributedLabel={unattributed}
            />
          </div>
        </>
      )}

      <BudgetsPanel />
    </div>
  );
};

export default CostTab;
