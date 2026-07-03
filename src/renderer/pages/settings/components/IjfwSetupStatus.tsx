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
import { Attention, CheckOne, CloseOne, Loading, Round } from '@icon-park/react';
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

/**
 * Per-row lifecycle state:
 * - `ok`       green pass
 * - `warn`     amber failure (not installed / no CLIs / runtime unreachable)
 * - `checking` neutral in-flight probe (no pass/fail yet)
 * - `idle`     neutral not-applicable (runtime row before IJFW is installed)
 */
type ItemState = 'ok' | 'warn' | 'checking' | 'idle';

type ChecklistItem = {
  key: 'install' | 'clis' | 'runtime';
  state: ItemState;
  label: string;
  detail: string;
};

type TestState = 'idle' | 'running' | 'pass' | 'fail';

const IjfwSetupStatus: React.FC<IjfwSetupStatusProps> = ({ status, cliCount }) => {
  const { t } = useTranslation();
  const [testState, setTestState] = useState<TestState>('idle');
  const [runtimeReachable, setRuntimeReachable] = useState<boolean | null>(null);

  const installOk = status === 'installed_current' || status === 'installed_pending_activation';
  const clisOk = cliCount > 0;

  // Probe the IJFW MCP runtime on mount with the SAME read-only round-trip the
  // Test button uses, so the row reflects real reachability instead of the
  // unprobed in-memory mode (which defaults to 'full' and stays green even when
  // the runtime is absent).
  //
  // GATED on installOk: `brainInvoke` spawns the IJFW MCP child process, so we
  // must NOT probe when IJFW isn't installed — opening this panel has to stay
  // side-effect-free for users who never installed or opted out. When not
  // installed the runtime row renders as not-applicable ('idle') and we reset
  // any stale reachability so a later uninstall clears the row. The manual Test
  // button stays unconditional (explicit user action is fine).
  useEffect(() => {
    if (!installOk) {
      setRuntimeReachable(null);
      return;
    }
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
  }, [installOk]);

  // Runtime row is tri-state once installed: null = probe in flight (checking),
  // true = reachable (ok), false = confirmed unreachable (degraded warning).
  // Before install it is not-applicable (idle) and never shows the warning.
  const runtimeState: ItemState = !installOk
    ? 'idle'
    : runtimeReachable === null
      ? 'checking'
      : runtimeReachable
        ? 'ok'
        : 'warn';

  const items: ChecklistItem[] = [
    {
      key: 'install',
      state: installOk ? 'ok' : 'warn',
      label: t('memory.settings.status_install_label', { defaultValue: 'IJFW installed' }),
      detail: installOk
        ? t('memory.settings.status_install_ok', { defaultValue: 'Installed and up to date' })
        : t('memory.settings.status_install_pending', { defaultValue: 'Not installed yet' }),
    },
    {
      key: 'clis',
      state: clisOk ? 'ok' : 'warn',
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
      state: runtimeState,
      label: t('memory.settings.status_runtime_label', { defaultValue: 'Memory runtime' }),
      detail:
        runtimeState === 'ok'
          ? t('memory.settings.status_runtime_full', { defaultValue: 'Live' })
          : runtimeState === 'warn'
            ? t('memory.settings.status_runtime_degraded', {
                defaultValue: 'Degraded (not reachable)',
              })
            : runtimeState === 'checking'
              ? t('memory.settings.status_runtime_checking', { defaultValue: 'Checking…' })
              : t('memory.settings.status_runtime_idle', { defaultValue: 'Waiting for install' }),
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
            data-status={item.state === 'ok' ? 'ok' : item.state === 'checking' ? 'checking' : 'pending'}
          >
            {item.state === 'ok' ? (
              <CheckOne theme='filled' size={16} fill='rgb(var(--success-6))' />
            ) : item.state === 'warn' ? (
              <Attention theme='filled' size={16} fill='rgb(var(--warning-6))' />
            ) : item.state === 'checking' ? (
              <Loading size={16} />
            ) : (
              <Round size={16} />
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
