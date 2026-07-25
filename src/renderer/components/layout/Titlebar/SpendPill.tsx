/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * A compact spend indicator for the top bar (#508). Reads the existing,
 * remote-denied, allowlisted cost.listBudgets provider - which already carries
 * each budget's current-period spend and limit - and renders "$spent / $limit"
 * for the global budget, colored by the shared severity tier. Hides entirely
 * when no budget is configured. Clicking opens the Mission Control cost tab.
 *
 * No new IPC, no new cost store: this only surfaces data the cost UI already
 * ships.
 */

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { ipcBridge } from '@/common';
import type { BudgetSeverity } from '@renderer/pages/mission-control/cost/costChart';
import { budgetSeverity } from '@renderer/pages/mission-control/cost/costChart';
import { formatUsd } from '@renderer/utils/format/tokens';

// Shares the exact tier colors used by the cost budget bars (Cost.module.css).
const SEVERITY_COLOR: Record<BudgetSeverity, string> = {
  ok: '#2ec27e',
  warn: '#ff9f43',
  over: '#ff4d4f',
};

type BudgetLike = {
  scope: string;
  period: string;
  spentUsd: number;
  limitUsd: number;
};

export const SpendPill: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, mutate } = useSWR<BudgetLike[]>(
    'titlebar-spend',
    (): Promise<BudgetLike[]> => ipcBridge.cost.listBudgets.invoke() as Promise<BudgetLike[]>,
    { revalidateOnFocus: true }
  );

  // Keep the pill fresh when a budget alert fires (same source BudgetsPanel uses).
  useEffect(() => {
    const off = ipcBridge.cost.budgetAlert.on(() => {
      // Swallow transient IPC/mutate failures - the pill self-heals on the next
      // SWR revalidation; an unhandled rejection here would be noise (xaudit finding 4).
      void mutate().catch(() => {});
    });
    return () => off();
  }, [mutate]);

  const budgets = data ?? [];
  // Prefer the monthly global budget; fall back to any global budget.
  const budget =
    budgets.find((b) => b.scope === 'global' && b.period === 'month') ?? budgets.find((b) => b.scope === 'global');

  // Budget-runway visibility only: no configured budget means nothing to show.
  if (!budget) return null;

  const { spentUsd, limitUsd } = budget;
  // Guard against malformed budget data: require finite spend and a finite,
  // positive limit, else the pill would render "$NaN" or a bad severity tier
  // (xaudit finding 3). Treat bad data like no budget - render nothing.
  if (!Number.isFinite(spentUsd) || !Number.isFinite(limitUsd) || limitUsd <= 0) return null;

  const severity = budgetSeverity(spentUsd, limitUsd);
  const spendText = `${formatUsd(spentUsd)} / ${formatUsd(limitUsd)}`;
  const ariaLabel = `${t('missionControl.cost.totalSpend')}: ${spendText}`;

  return (
    <button
      type='button'
      className='app-titlebar__button flex items-center gap-6px px-8px text-12px text-t-secondary'
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={() => navigate('/mission-control?tab=cost')}
    >
      <span
        aria-hidden='true'
        className='inline-block w-6px h-6px rounded-full shrink-0'
        style={{ backgroundColor: SEVERITY_COLOR[severity] }}
      />
      <span className='leading-none tabular-nums'>{spendText}</span>
    </button>
  );
};

export default SpendPill;
