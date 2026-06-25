/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Message, Modal } from '@arco-design/web-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import { uuid } from '@/common/utils';
import type { BudgetGateBlocked } from '@process/services/cost/types';

const fmt = (n: number) => `$${n.toFixed(2)}`;

/**
 * Runaway circuit-breaker Phase 1 - the resumable card shown when a 'pause'
 * budget blocks a turn before it starts. Globally mounted (Layout) so it catches
 * the block regardless of which conversation is open. The held message rides in
 * the event, so "Raise cap and continue" re-sends it after bumping the budget.
 */
const BudgetGateModal: React.FC = () => {
  const { t } = useTranslation();
  const [blocked, setBlocked] = useState<BudgetGateBlocked | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const off = ipcBridge.cost.budgetGateBlocked.on((payload) => setBlocked(payload));
    return () => off();
  }, []);

  if (!blocked) return null;

  // Raise the cap clear of current spend so the next turn passes and the user
  // gets a fresh budget's worth of headroom (not a one-token reprieve).
  const newLimit = Math.max(blocked.limitUsd * 2, Math.ceil(blocked.spentUsd) + blocked.limitUsd);

  const stop = () => setBlocked(null);

  const raiseAndContinue = async () => {
    setBusy(true);
    try {
      await ipcBridge.cost.upsertBudget.invoke({
        id: blocked.budgetId,
        scope: blocked.scope,
        scopeKey: blocked.scopeKey,
        limitUsd: newLimit,
        period: blocked.period,
        action: 'pause',
      });
      await ipcBridge.conversation.sendMessage.invoke({
        input: blocked.content,
        msg_id: uuid(),
        conversation_id: blocked.conversationId,
        files: blocked.files,
      });
      Message.success(t('missionControl.cost.budgets.gateRaised', { limit: fmt(newLimit) }));
      setBlocked(null);
    } catch {
      Message.error(t('missionControl.cost.budgets.gateError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible
      title={t('missionControl.cost.budgets.gateTitle')}
      onCancel={stop}
      onOk={() => void raiseAndContinue()}
      okText={t('missionControl.cost.budgets.gateRaiseAndContinue', { limit: fmt(newLimit) })}
      cancelText={t('missionControl.cost.budgets.gateStop')}
      confirmLoading={busy}
    >
      <div className='text-13px text-t-secondary leading-relaxed'>
        {t('missionControl.cost.budgets.gateBody', {
          spent: fmt(blocked.spentUsd),
          limit: fmt(blocked.limitUsd),
        })}
      </div>
    </Modal>
  );
};

export default BudgetGateModal;
