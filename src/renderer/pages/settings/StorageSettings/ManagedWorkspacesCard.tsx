/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Message, Spin, Tag } from '@arco-design/web-react';
import { FolderClock, ShieldCheck } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { shell, workspaceRetention } from '@/common/adapter/ipcBridge';
import {
  parseManagedWorkspaceInventoryReport,
  type ManagedWorkspaceInventoryReport,
} from '@/common/types/managedWorkspaceRetention';
import { Card } from '@renderer/components/settings/shared';
import { isElectronDesktop } from '@renderer/utils/platform';

const AUTHORITY_LABELS: Record<keyof ManagedWorkspaceInventoryReport['authorityCompleteness'], string> = {
  conversation: 'Chats',
  project: 'Projects',
  schedule: 'Schedules',
  artifact: 'Outputs',
  receipt: 'Receipts',
  'active-process': 'Active work',
  provenance: 'Creation records',
  snapshot: 'Stable filesystem snapshot',
};

const CLASSIFICATION_LABELS: Record<string, string> = {
  referenced: 'In use',
  scheduled: 'Scheduled',
  active: 'Active work',
  'artifact-bearing': 'Has outputs',
  modified: 'Has files',
  'user-promoted': 'Persistent',
  'empty-abandoned': 'Review candidate',
  unknown: 'Protected by default',
};

function basename(value: string): string {
  const normalized = value.replace(/[\\/]+$/, '');
  const separator = Math.max(normalized.lastIndexOf('/'), normalized.lastIndexOf('\\'));
  return normalized.slice(separator + 1) || value;
}

const ManagedWorkspacesCard: React.FC = () => {
  const { t } = useTranslation();
  const desktop = isElectronDesktop();
  const [report, setReport] = React.useState<ManagedWorkspaceInventoryReport | null>(null);
  const [loading, setLoading] = React.useState(desktop);
  const [error, setError] = React.useState(false);

  const refresh = React.useCallback(async () => {
    if (!desktop) return;
    setLoading(true);
    setError(false);
    try {
      const next = parseManagedWorkspaceInventoryReport(await workspaceRetention.preview.invoke());
      if (!next) throw new Error('workspace retention returned a malformed report');
      setReport(next);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [desktop]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const incompleteAuthorities = report
    ? Object.entries(report.authorityCompleteness).filter(([, state]) => state !== 'complete')
    : [];

  const reveal = React.useCallback(
    async (workspacePath: string) => {
      try {
        const result = await shell.showItemInFolder.invoke(workspacePath);
        if (!result.ok) throw new Error(result.error || 'reveal failed');
      } catch {
        Message.error(t('settings.storagePage.revealWorkspaceFailed', 'Could not show this workspace.'));
      }
    },
    [t]
  );

  return (
    <Card
      title={t('settings.storagePage.managedWorkspacesTitle', 'Managed workspaces')}
      titleIcon={FolderClock}
      statusBadge={report && <Tag color='green'>{t('settings.storagePage.protected', 'Protected')}</Tag>}
      actions={
        desktop ? (
          <Button size='mini' loading={loading} onClick={() => void refresh()}>
            {t('settings.storagePage.refresh', 'Refresh')}
          </Button>
        ) : undefined
      }
    >
      {!desktop ? (
        <p className='text-12px text-[var(--color-text-3)]'>
          {t(
            'settings.storagePage.managedWorkspacesDesktopOnly',
            'Managed workspace inventory is available in the desktop app.'
          )}
        </p>
      ) : loading && !report ? (
        <div className='flex justify-center py-16px' aria-label={t('common.loading', 'Loading')}>
          <Spin />
        </div>
      ) : error ? (
        <div className='flex flex-col items-start gap-8px'>
          <p className='text-12px text-[var(--color-text-2)]'>
            {t(
              'settings.storagePage.managedWorkspacesUnavailable',
              'Wayland could not prove the inventory, so every workspace remains protected.'
            )}
          </p>
          <Button size='mini' onClick={() => void refresh()}>
            {t('settings.storagePage.tryAgain', 'Try again')}
          </Button>
        </div>
      ) : report ? (
        <div className='flex flex-col gap-12px'>
          <div className='flex items-start gap-10px rounded-8px bg-[var(--color-success-light-1)] px-12px py-10px'>
            <ShieldCheck size={18} className='mt-1px shrink-0 text-[rgb(var(--green-6))]' aria-hidden />
            <div className='flex flex-col gap-2px'>
              <span className='text-13px font-medium text-[var(--color-text-1)]'>
                {t('settings.storagePage.noAutomaticDeletion', 'Nothing here is deleted automatically')}
              </span>
              <span className='text-12px text-[var(--color-text-2)]'>
                {t(
                  'settings.storagePage.managedWorkspacesSafety',
                  'Chats, Projects, schedules, active work, files, outputs, and receipts are checked before a workspace can even become reviewable.'
                )}
              </span>
            </div>
          </div>

          <div
            className='grid grid-cols-3 gap-8px'
            aria-label={t('settings.storagePage.inventorySummary', 'Inventory summary')}
          >
            {[
              [report.summary.discovered, t('settings.storagePage.found', 'Found')],
              [report.summary.preserved, t('settings.storagePage.preserved', 'Protected')],
              [report.summary.reviewCandidate, t('settings.storagePage.reviewable', 'Later human review')],
            ].map(([value, label]) => (
              <div key={String(label)} className='rounded-8px border border-[var(--color-border-2)] px-10px py-8px'>
                <div className='text-18px font-semibold leading-22px text-[var(--color-text-1)]'>{value}</div>
                <div className='text-11px text-[var(--color-text-3)]'>{label}</div>
              </div>
            ))}
          </div>

          {incompleteAuthorities.length > 0 && (
            <div className='rounded-8px bg-[var(--color-fill-2)] px-12px py-10px'>
              <div className='text-12px font-medium text-[var(--color-text-1)]'>
                {t('settings.storagePage.cleanupLocked', 'Cleanup remains locked')}
              </div>
              <div className='mt-3px text-11px text-[var(--color-text-3)]'>
                {t(
                  'settings.storagePage.cleanupLockedReason',
                  'Wayland preserves everything until these inventories are complete:'
                )}{' '}
                {incompleteAuthorities
                  .map(([source]) => AUTHORITY_LABELS[source as keyof typeof AUTHORITY_LABELS])
                  .join(', ')}
              </div>
            </div>
          )}

          {report.entries.length > 0 ? (
            <div className='flex flex-col gap-6px'>
              {report.entries.slice(0, 5).map((entry) => (
                <div key={entry.path} className='flex items-center gap-8px rounded-6px px-2px py-4px'>
                  <div className='min-w-0 flex-1'>
                    <div className='truncate text-12px font-medium text-[var(--color-text-2)]' title={entry.path}>
                      {basename(entry.path)}
                    </div>
                    <div className='text-11px text-[var(--color-text-3)]'>
                      {entry.decision.classifications.map((value) => CLASSIFICATION_LABELS[value] ?? value).join(' - ')}
                    </div>
                    {entry.decision.reasons.length > 0 && (
                      <div className='text-11px text-[var(--color-text-3)]'>{entry.decision.reasons.join('; ')}</div>
                    )}
                  </div>
                  <div className='flex shrink-0 items-center gap-6px'>
                    <Button type='text' size='mini' onClick={() => void reveal(entry.path)}>
                      {t('settings.storagePage.showWorkspace', 'Show')}
                    </Button>
                    <Tag size='small' color={entry.decision.disposition === 'review-candidate' ? 'orange' : 'green'}>
                      {entry.decision.disposition === 'review-candidate'
                        ? t('settings.storagePage.reviewLater', 'Review later - no action available')
                        : t('settings.storagePage.keep', 'Keep')}
                    </Tag>
                  </div>
                </div>
              ))}
              {report.entries.length > 5 && (
                <div className='text-11px text-[var(--color-text-3)]'>
                  {t('settings.storagePage.moreWorkspaces', {
                    count: report.entries.length - 5,
                    defaultValue: `+${report.entries.length - 5} more`,
                  })}
                </div>
              )}
            </div>
          ) : (
            <p className='text-12px text-[var(--color-text-3)]'>
              {t('settings.storagePage.noManagedWorkspaces', 'No generated workspaces found.')}
            </p>
          )}
        </div>
      ) : null}
    </Card>
  );
};

export default ManagedWorkspacesCard;
