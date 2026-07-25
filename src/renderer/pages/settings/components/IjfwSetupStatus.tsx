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
import type { IjfwInvokeResult } from '@/common/types/ijfw';

/**
 * Pull the real failure reason off a failed probe result (#891): the human
 * `error` message, else the `errorReason` code, else undefined.
 *
 * `strictNullChecks` is off project-wide, so the `IjfwInvokeResult`
 * discriminated union does NOT narrow its arm-specific optional props after an
 * `if (r.ok)` check — reading `r.error` on the union is a type error. Cast to
 * the failure arm to read the fields the caller has already established are
 * present (this runs only on the `ok:false` path).
 */
const probeFailureReason = (r: IjfwInvokeResult): string | undefined => {
  const fail = r as { ok: false; error?: string; errorReason?: string };
  // `||` (not `??`) so an empty-string `error` falls through to the code.
  return fail.error || fail.errorReason;
};

export type IjfwSetupStatusProps = {
  /** Latest lifecycle status from `ipcBridge.ijfw.getStatus`. */
  status: IjfwLifecycleStatus | null;
  /** Count of detected CLIs (excludes Wayland Core). */
  cliCount: number;
  /**
   * Hide the internal "Setup status" heading. Used when a host already labels
   * the section (e.g. the Memory panel's collapsible health strip in #414),
   * so the title is not shown twice. Defaults to false (Settings usage).
   */
  hideTitle?: boolean;
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

const IjfwSetupStatus: React.FC<IjfwSetupStatusProps> = ({ status, cliCount, hideTitle = false }) => {
  const { t } = useTranslation();
  const [testState, setTestState] = useState<TestState>('idle');
  const [runtimeReachable, setRuntimeReachable] = useState<boolean | null>(null);
  // #891: the real reason a failing probe reported (`error`, else `errorReason`
  // code, else undefined). Threaded into the degraded detail so the runtime row
  // says WHY it is degraded instead of a bare label. Undefined on every
  // success/reset/reject path so the fallback label shows and we never render
  // "undefined".
  const [runtimeReason, setRuntimeReason] = useState<string | undefined>(undefined);
  const [testFailReason, setTestFailReason] = useState<string | undefined>(undefined);

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
      setRuntimeReason(undefined);
      return;
    }
    let disposed = false;
    void ipcBridge.ijfw.brainInvoke
      // `metrics`, NOT `state`. See handleTest below for why `state` could
      // never succeed.
      .invoke({ verb: 'metrics' })
      .then((r) => {
        if (disposed) return;
        if (r.ok) {
          setRuntimeReachable(true);
          setRuntimeReason(undefined);
        } else {
          // #891: keep the real reason the probe returned. `error` is the human
          // message; fall back to the `errorReason` code; undefined if neither.
          setRuntimeReachable(false);
          setRuntimeReason(probeFailureReason(r));
        }
      })
      .catch(() => {
        // A rejected probe carries no structured reason; leave it undefined so
        // the bare degraded label shows.
        if (disposed) return;
        setRuntimeReachable(false);
        setRuntimeReason(undefined);
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
            ? runtimeReason
              ? // #891: surface the real reason. Reuse the EXISTING localized
                // degraded label as the lead (so every locale keeps its own
                // translation) and append the raw machine reason OUTSIDE t()
                // (a received string — never translated).
                `${t('memory.settings.status_runtime_degraded', {
                  defaultValue: 'Degraded (not reachable)',
                })}: ${runtimeReason}`
              : t('memory.settings.status_runtime_degraded', {
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
    setTestFailReason(undefined);
    try {
      // The probe verb used to be `state`, which could NEVER pass and so made
      // Test report "Memory did not respond" on every install, healthy ones
      // included (Sean's live find, 2026-07-25).
      //
      // `resolveToolCall` direct-maps `state` -> tool `ijfw_state` and forwards
      // our args verbatim. But `ijfw_state` is itself a FACADE: server.js
      // requires its own inner `verb` in the arguments and answers
      // `{"ok":false,"error":"verb (string) is required"}` without one. The
      // probe has no inner verb to supply, so the call was guaranteed to fail.
      //
      // Verified against a real IJFW 1.6.5 server over stdio: `ijfw_state` with
      // `{}` errors, `ijfw_metrics` with `{}` returns cleanly. `metrics` is
      // read-only and cheap, which is what a health probe wants.
      const result = await ipcBridge.ijfw.brainInvoke.invoke({ verb: 'metrics' });
      if (result.ok) {
        setTestState('pass');
        setTestFailReason(undefined);
      } else {
        // #891: keep the real reason so the fail text says WHY.
        setTestState('fail');
        setTestFailReason(probeFailureReason(result));
      }
    } catch {
      // A thrown probe carries no structured reason; fall back to the fixed text.
      setTestState('fail');
      setTestFailReason(undefined);
    }
  }, [testState]);

  return (
    <div className='flex flex-col gap-12px p-16px rd-12px bg-aou-1' data-testid='ijfw-settings-setup-status'>
      {!hideTitle && (
        <Typography.Text className='text-14px font-semibold'>
          {t('memory.settings.setup_status_title', { defaultValue: 'Setup status' })}
        </Typography.Text>
      )}

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
              {testFailReason
                ? // #891: reuse the EXISTING localized fail label as the lead +
                  // the raw reason as data (outside t()).
                  `${t('memory.settings.test_fail', {
                    defaultValue: 'Memory did not respond. Check the install status above.',
                  })}: ${testFailReason}`
                : t('memory.settings.test_fail', {
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
