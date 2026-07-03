/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * IjfwSetupStatus - setup-status checklist + Test button for the IJFW Memory
 * settings panel (#414).
 *
 * Presentational: it receives the three lifecycle signals as props (install
 * status, detected-CLI count, MCP runtime mode) and renders a green/amber
 * checklist. The Test button probes the local IJFW MCP server with the
 * read-only `state` verb via `ipcBridge.ijfw.brainInvoke` and reports
 * pass/fail. All signals are already wired main-side; this is renderer-only.
 */

import { Button, Typography } from '@arco-design/web-react';
import { Attention, CheckOne, CloseOne, Loading } from '@icon-park/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type { IjfwLifecycleStatus } from '@/common/adapter/ipcBridge';

export type IjfwSetupStatusProps = {
  /** Latest lifecycle status from `ipcBridge.ijfw.getStatus`. */
  status: IjfwLifecycleStatus | null;
  /** Count of detected CLIs (excludes Wayland Core). */
  cliCount: number;
};

type ChecklistItem = {
  key: 'install' | 'clis' | 'runtime';
  ok: boolean;
  label: string;
  detail: string;
};

type TestState = 'idle' | 'running' | 'pass' | 'fail';

const IjfwSetupStatus: React.FC<IjfwSetupStatusProps> = ({ status, cliCount }) => {
  const { t } = useTranslation();
  const [testState, setTestState] = useState<TestState>('idle');
  const [runtimeReachable, setRuntimeReachable] = useState<boolean | null>(null);

  // Probe the IJFW MCP runtime once on mount with the SAME read-only round-trip
  // the Test button uses, so the row reflects real reachability instead of the
  // unprobed in-memory mode (which defaults to 'full' and stays green even when
  // the runtime is absent). While the probe is in flight the row renders as
  // pending; a resolved probe drives it green/amber to match the Test button.
  useEffect(() => {
    let disposed = false;
    void ipcBridge.ijfw.brainInvoke
      .invoke({ verb: 'state' })
      .then((r) => {
        if (!disposed) setRuntimeReachable(!!r?.ok);
      })
      .catch(() => {
        if (!disposed) setRuntimeReachable(false);
      });
    return () => {
      disposed = true;
    };
  }, []);

  const installOk = status === 'installed_current' || status === 'installed_pending_activation';
  const clisOk = cliCount > 0;
  const runtimeOk = runtimeReachable === true;

  const items: ChecklistItem[] = [
    {
      key: 'install',
      ok: installOk,
      label: t('memory.settings.status_install_label', { defaultValue: 'IJFW installed' }),
      detail: installOk
        ? t('memory.settings.status_install_ok', { defaultValue: 'Installed and up to date' })
        : t('memory.settings.status_install_pending', { defaultValue: 'Not installed yet' }),
    },
    {
      key: 'clis',
      ok: clisOk,
      label: t('memory.settings.status_clis_label', { defaultValue: 'CLIs detected' }),
      detail: clisOk
        ? t('memory.settings.status_clis_ok', {
            defaultValue: '{{count}} detected',
            count: cliCount,
          })
        : t('memory.settings.status_clis_none', { defaultValue: 'None detected yet' }),
    },
    {
      key: 'runtime',
      ok: runtimeOk,
      label: t('memory.settings.status_runtime_label', { defaultValue: 'Memory runtime' }),
      detail: runtimeOk
        ? t('memory.settings.status_runtime_full', { defaultValue: 'Live' })
        : t('memory.settings.status_runtime_degraded', { defaultValue: 'Degraded (not reachable)' }),
    },
  ];

  const handleTest = useCallback(async () => {
    if (testState === 'running') return;
    setTestState('running');
    try {
      const result = await ipcBridge.ijfw.brainInvoke.invoke({ verb: 'state' });
      setTestState(result?.ok ? 'pass' : 'fail');
    } catch {
      setTestState('fail');
    }
  }, [testState]);

  return (
    <div className='flex flex-col gap-12px p-16px rd-12px bg-aou-1' data-testid='ijfw-settings-setup-status'>
      <Typography.Text className='text-14px font-semibold'>
        {t('memory.settings.setup_status_title', { defaultValue: 'Setup status' })}
      </Typography.Text>

      <div className='flex flex-col gap-8px'>
        {items.map((item) => (
          <div
            key={item.key}
            className='flex items-center gap-8px'
            data-testid={`ijfw-status-item-${item.key}`}
            data-status={item.ok ? 'ok' : 'pending'}
          >
            {item.ok ? (
              <CheckOne theme='filled' size={16} fill='rgb(var(--success-6))' />
            ) : (
              <Attention theme='filled' size={16} fill='rgb(var(--warning-6))' />
            )}
            <Typography.Text className='text-13px font-medium'>{item.label}</Typography.Text>
            <Typography.Text type='secondary' className='text-12px'>
              {item.detail}
            </Typography.Text>
          </div>
        ))}
      </div>

      <div className='flex items-center gap-12px'>
        <Button
          type='outline'
          size='small'
          loading={testState === 'running'}
          onClick={() => {
            void handleTest();
          }}
          data-testid='ijfw-settings-test-button'
          className='self-start'
        >
          {t('memory.settings.test_button', { defaultValue: 'Test' })}
        </Button>

        {testState === 'pass' && (
          <span
            className='flex items-center gap-6px text-12px'
            data-testid='ijfw-settings-test-result'
            data-result='pass'
          >
            <CheckOne theme='filled' size={14} fill='rgb(var(--success-6))' />
            <Typography.Text style={{ color: 'rgb(var(--success-6))' }} className='text-12px'>
              {t('memory.settings.test_pass', { defaultValue: 'Memory responded. All good.' })}
            </Typography.Text>
          </span>
        )}

        {testState === 'fail' && (
          <span
            className='flex items-center gap-6px text-12px'
            data-testid='ijfw-settings-test-result'
            data-result='fail'
          >
            <CloseOne theme='filled' size={14} fill='rgb(var(--danger-6))' />
            <Typography.Text style={{ color: 'rgb(var(--danger-6))' }} className='text-12px'>
              {t('memory.settings.test_fail', {
                defaultValue: 'Memory did not respond. Check the install status above.',
              })}
            </Typography.Text>
          </span>
        )}

        {testState === 'running' && (
          <span className='flex items-center gap-6px text-12px' aria-hidden>
            <Loading size={14} />
          </span>
        )}
      </div>
    </div>
  );
};

export default IjfwSetupStatus;
