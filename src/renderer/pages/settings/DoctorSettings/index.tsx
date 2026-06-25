/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Doctor settings page (issue #35).
 *
 * Runs the full diagnostic battery via `ipcBridge.doctor.runDoctor` and renders
 * a per-check PASS / WARN / FAIL list with a human-readable detail and an
 * actionable remediation. Offers a "Re-run" button and a "Copy report" action
 * (plain-text report for pasting into a bug report).
 */

import { Button, Spin } from '@arco-design/web-react';
import { AlertTriangle, CheckCircle2, Copy, RefreshCw, Stethoscope, XCircle } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, EmptyState } from '@renderer/components/settings/shared';
import { useToast } from '@renderer/hooks/settings/useToast';
import SettingsPageShell from '@renderer/pages/settings/components/SettingsPageShell';
import { copyText } from '@/renderer/utils/ui/clipboard';
import { doctor } from '@/common/adapter/ipcBridge';
import type { DoctorCheckResult, DoctorReport, DoctorStatus } from '@process/doctor/types';
import { buildDoctorReportText } from './reportText';

/** Icon + token color per status. Colors use semantic CSS variables. */
const STATUS_VISUALS: Record<DoctorStatus, { Icon: typeof CheckCircle2; color: string }> = {
  pass: { Icon: CheckCircle2, color: 'var(--success)' },
  warn: { Icon: AlertTriangle, color: 'var(--warning)' },
  fail: { Icon: XCircle, color: 'var(--danger)' },
};

const STATUS_LABEL_KEY: Record<DoctorStatus, string> = {
  pass: 'settings.doctor.status.pass',
  warn: 'settings.doctor.status.warn',
  fail: 'settings.doctor.status.fail',
};

const CheckRow: React.FC<{ result: DoctorCheckResult }> = ({ result }) => {
  const { t } = useTranslation();
  const { Icon, color } = STATUS_VISUALS[result.status];
  return (
    <div className='flex items-start gap-12px py-10px border-b border-[var(--color-border-2)] last:border-b-0'>
      <Icon size={18} style={{ color }} className='shrink-0 mt-2px' aria-hidden='true' />
      <div className='min-w-0 flex-1 flex flex-col gap-2px'>
        <div className='flex items-center gap-8px'>
          <span className='text-14px font-medium text-[var(--color-text-1)]'>
            {t(result.titleKey, { defaultValue: result.id })}
          </span>
          <span className='text-11px uppercase tracking-wide' style={{ color }}>
            {t(STATUS_LABEL_KEY[result.status])}
          </span>
        </div>
        <div className='text-13px text-[var(--color-text-2)]'>{result.detail}</div>
        {result.remediation && (
          <div className='text-12px text-[var(--color-text-3)] mt-2px'>
            {t('settings.doctor.remediationPrefix', { defaultValue: 'Fix:' })} {result.remediation}
          </div>
        )}
      </div>
    </div>
  );
};

const DoctorSettings: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [report, setReport] = useState<DoctorReport | null>(null);
  const [running, setRunning] = useState(false);

  const run = useCallback(async () => {
    setRunning(true);
    try {
      const next = await doctor.runDoctor.invoke();
      setReport(next);
    } catch (error) {
      toast.show({
        variant: 'error',
        title: t('settings.doctor.runFailed', { defaultValue: 'Could not run the Doctor' }),
        body: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setRunning(false);
    }
  }, [t, toast]);

  // Run once on first open so the page is useful without an extra click.
  useEffect(() => {
    void run();
  }, [run]);

  const copyReport = useCallback(async () => {
    if (!report) return;
    try {
      // Use the shared clipboard helper, which prefers `navigator.clipboard`
      // and falls back to `document.execCommand('copy')` when the async API
      // rejects (it does so unreliably in the Electron renderer on Windows /
      // non-secure contexts) — the established, Windows-hardened path (#10, #269).
      await copyText(buildDoctorReportText(report, (key) => t(key, { defaultValue: key })));
      toast.show({ variant: 'success', title: t('settings.doctor.copied', { defaultValue: 'Report copied' }) });
    } catch {
      toast.show({
        variant: 'error',
        title: t('settings.doctor.copyFailed', { defaultValue: 'Could not copy the report' }),
      });
    }
  }, [report, t, toast]);

  const summary = useMemo(() => {
    if (!report) return '';
    return t('settings.doctor.summary', {
      defaultValue: '{{pass}} passed · {{warn}} warnings · {{fail}} failed',
      pass: report.counts.pass,
      warn: report.counts.warn,
      fail: report.counts.fail,
    });
  }, [report, t]);

  return (
    <SettingsPageShell
      title={t('settings.doctor.title', { defaultValue: 'Doctor' })}
      subtitle={t('settings.doctor.subtitle', {
        defaultValue: 'Run diagnostic checks across providers, models, the engine, MCP, backends, and config.',
      })}
      actions={
        <div className='flex items-center gap-8px'>
          <Button icon={<Copy size={16} />} onClick={copyReport} disabled={!report || running}>
            {t('settings.doctor.copy', { defaultValue: 'Copy report' })}
          </Button>
          <Button type='primary' icon={<RefreshCw size={16} />} loading={running} onClick={() => void run()}>
            {t('settings.doctor.rerun', { defaultValue: 'Re-run' })}
          </Button>
        </div>
      }
    >
      {!report && running ? (
        <div className='flex items-center justify-center py-48px'>
          <Spin size={28} />
        </div>
      ) : !report ? (
        <EmptyState
          icon={Stethoscope}
          title={t('settings.doctor.emptyTitle', { defaultValue: 'No diagnostics yet' })}
          body={t('settings.doctor.emptyBody', { defaultValue: 'Run the Doctor to check the app’s health.' })}
          actionLabel={t('settings.doctor.rerun', { defaultValue: 'Re-run' })}
          onAction={() => void run()}
        />
      ) : (
        <Card title={t('settings.doctor.resultsTitle', { defaultValue: 'Diagnostic results' })}>
          <div className='text-12px text-[var(--color-text-3)] mb-8px'>{summary}</div>
          <div className='flex flex-col'>
            {report.results.map((result) => (
              <CheckRow key={result.id} result={result} />
            ))}
          </div>
        </Card>
      )}
    </SettingsPageShell>
  );
};

export default DoctorSettings;
