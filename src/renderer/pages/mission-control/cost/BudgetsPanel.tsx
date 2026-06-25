/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Lists configured budgets with a spend-vs-limit progress bar each, and an
 * add / edit / delete flow over the remote-denied cost.upsertBudget /
 * cost.deleteBudget / cost.listBudgets providers. Subscribes to
 * cost.budgetAlert and surfaces a non-blocking warning notification.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, InputNumber, Modal, Notification, Select } from '@arco-design/web-react';
import { Plus } from 'lucide-react';
import useSWR from 'swr';
import { ipcBridge } from '@/common';
import type {
  BudgetAction,
  BudgetInput,
  BudgetPeriod,
  BudgetScope,
  BudgetStatus,
} from '@process/services/cost/types';
import { formatUsd } from '@renderer/utils/format/tokens';
import { budgetFraction, budgetSeverity } from './costChart';
import { BudgetBar } from './BudgetBar';
import styles from './Cost.module.css';

const FormItem = Form.Item;
const Option = Select.Option;

const SCOPES: BudgetScope[] = ['global', 'model', 'backend', 'team'];
const PERIODS: BudgetPeriod[] = ['day', 'week', 'month'];
const ACTIONS: BudgetAction[] = ['warn', 'pause'];

type FormValues = {
  scope: BudgetScope;
  scopeKey?: string;
  limitUsd: number;
  period: BudgetPeriod;
  action: BudgetAction;
};

export const BudgetsPanel: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm<FormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, mutate } = useSWR<BudgetStatus[]>(
    'cost-budgets',
    (): Promise<BudgetStatus[]> => ipcBridge.cost.listBudgets.invoke(),
    { revalidateOnFocus: true }
  );
  const budgets = data ?? [];

  // Surface over-budget warn alerts as a non-blocking notification.
  useEffect(() => {
    const off = ipcBridge.cost.budgetAlert.on((alert) => {
      Notification.warning({
        title: t('missionControl.cost.budgets.alertTitle'),
        content: t('missionControl.cost.budgets.alertBody', {
          spent: formatUsd(alert.spentUsd),
          limit: formatUsd(alert.limitUsd),
        }),
        duration: 8000,
      });
      void mutate();
    });
    return () => off();
  }, [t, mutate]);

  const openCreate = useCallback(() => {
    setEditId(undefined);
    form.setFieldsValue({ scope: 'global', limitUsd: 10, period: 'month', action: 'warn' });
    setModalOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (b: BudgetStatus) => {
      setEditId(b.id);
      form.setFieldsValue({
        scope: b.scope,
        scopeKey: b.scopeKey,
        limitUsd: b.limitUsd,
        period: b.period,
        action: b.action,
      });
      setModalOpen(true);
    },
    [form]
  );

  const handleSave = useCallback(async () => {
    try {
      const values = await form.validate();
      setSaving(true);
      const payload: BudgetInput = {
        id: editId,
        scope: values.scope,
        scopeKey: values.scope === 'global' ? undefined : values.scopeKey?.trim() || undefined,
        limitUsd: values.limitUsd,
        period: values.period,
        action: values.action,
      };
      await ipcBridge.cost.upsertBudget.invoke(payload);
      setModalOpen(false);
      await mutate();
    } catch {
      // validation error - leave the modal open.
    } finally {
      setSaving(false);
    }
  }, [form, editId, mutate]);

  const handleDelete = useCallback(
    (b: BudgetStatus) => {
      Modal.confirm({
        title: t('missionControl.cost.budgets.deleteTitle'),
        content: t('missionControl.cost.budgets.deleteBody'),
        okText: t('conversation.history.deleteTitle', { defaultValue: 'Delete' }),
        cancelText: t('common.cancel', { defaultValue: 'Cancel' }),
        okButtonProps: { status: 'danger' },
        onOk: async () => {
          await ipcBridge.cost.deleteBudget.invoke(b.id);
          await mutate();
        },
      });
    },
    [t, mutate]
  );

  const scopeLabel = (b: BudgetStatus): string => {
    if (b.scope === 'global') return t('missionControl.cost.budgets.scope.global');
    const dim = t(`missionControl.cost.budgets.scope.${b.scope}`);
    return b.scopeKey ? `${dim}: ${b.scopeKey}` : dim;
  };

  return (
    <div className={styles.panel}>
      <div className={styles.budgetsHead}>
        <span className={styles.panelTitle}>{t('missionControl.cost.budgets.title')}</span>
        <Button size='small' type='primary' icon={<Plus size={14} />} onClick={openCreate}>
          {t('missionControl.cost.budgets.add')}
        </Button>
      </div>

      {isLoading ? (
        <div className={styles.panelHint}>{t('missionControl.cost.loading')}</div>
      ) : budgets.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyTitle}>{t('missionControl.cost.budgets.emptyTitle')}</span>
          <span className={styles.emptyHint}>{t('missionControl.cost.budgets.emptyHint')}</span>
          <Button type='primary' icon={<Plus size={14} />} onClick={openCreate}>
            {t('missionControl.cost.budgets.add')}
          </Button>
        </div>
      ) : (
        <div className={styles.budgetList}>
          {budgets.map((b) => (
            <div className={styles.budgetRow} key={b.id}>
              <div className={styles.budgetTop}>
                <span className={styles.budgetName}>
                  {scopeLabel(b)}
                  {b.action === 'pause' ? (
                    <span className={styles.pauseTag}>{t('missionControl.cost.budgets.pauseTag')}</span>
                  ) : (
                    <span className={styles.warnTag}>{t('missionControl.cost.budgets.warnTag')}</span>
                  )}
                </span>
                <div className={styles.budgetActions}>
                  <span className={styles.budgetSpend}>
                    {formatUsd(b.spentUsd)} / {formatUsd(b.limitUsd)}
                    {' · '}
                    {t(`missionControl.cost.budgets.period.${b.period}`)}
                  </span>
                  <Button size='mini' type='text' onClick={() => openEdit(b)}>
                    {t('missionControl.cost.budgets.edit')}
                  </Button>
                  <Button size='mini' type='text' status='danger' onClick={() => handleDelete(b)}>
                    {t('missionControl.cost.budgets.delete')}
                  </Button>
                </div>
              </div>
              <BudgetBar
                fraction={budgetFraction(b.spentUsd, b.limitUsd)}
                severity={budgetSeverity(b.spentUsd, b.limitUsd)}
              />
              {b.action === 'pause' ? (
                <span className={styles.pauseHint}>{t('missionControl.cost.budgets.pauseHint')}</span>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <Modal
        visible={modalOpen}
        title={editId ? t('missionControl.cost.budgets.editTitle') : t('missionControl.cost.budgets.addTitle')}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        confirmLoading={saving}
        okText={t('missionControl.cost.budgets.save')}
        cancelText={t('missionControl.cost.budgets.cancel')}
        unmountOnExit
      >
        <Form form={form} layout='vertical'>
          <FormItem
            label={t('missionControl.cost.budgets.fieldScope')}
            field='scope'
            rules={[{ required: true }]}
          >
            <Select>
              {SCOPES.map((s) => (
                <Option key={s} value={s}>
                  {t(`missionControl.cost.budgets.scope.${s}`)}
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem shouldUpdate noStyle>
            {(values) =>
              values.scope && values.scope !== 'global' ? (
                <FormItem
                  label={t('missionControl.cost.budgets.fieldScopeKey')}
                  field='scopeKey'
                  rules={[{ required: true }]}
                >
                  <Select
                    allowCreate
                    showSearch
                    placeholder={t('missionControl.cost.budgets.scopeKeyPlaceholder')}
                  />
                </FormItem>
              ) : null
            }
          </FormItem>
          <FormItem
            label={t('missionControl.cost.budgets.fieldLimit')}
            field='limitUsd'
            rules={[{ required: true, type: 'number', min: 0.01 }]}
          >
            <InputNumber min={0.01} step={1} prefix='$' />
          </FormItem>
          <FormItem
            label={t('missionControl.cost.budgets.fieldPeriod')}
            field='period'
            rules={[{ required: true }]}
          >
            <Select>
              {PERIODS.map((p) => (
                <Option key={p} value={p}>
                  {t(`missionControl.cost.budgets.period.${p}`)}
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem
            label={t('missionControl.cost.budgets.fieldAction')}
            field='action'
            rules={[{ required: true }]}
          >
            <Select>
              {ACTIONS.map((a) => (
                <Option key={a} value={a}>
                  {t(`missionControl.cost.budgets.action.${a}`)}
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem shouldUpdate noStyle>
            {(values) =>
              values.action === 'pause' ? (
                <div className={styles.pauseHint}>{t('missionControl.cost.budgets.pauseActionHint')}</div>
              ) : null
            }
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
};
