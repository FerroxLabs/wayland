/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Spin, Tag } from '@arco-design/web-react';
import { AlertTriangle, ArrowRightLeft, PauseCircle, ShieldCheck } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { waylandTransfer } from '@/common/adapter/ipcBridge';
import type {
  WaylandTransferFamilyDisposition,
  WaylandTransferFamilyPreview,
  WaylandTransferPreflight,
  WaylandTransferPreflightRequest,
} from '@/common/types/transfer';
import { Card } from '@renderer/components/settings/shared';
import { isElectronDesktop } from '@renderer/utils/platform';

const FAMILY_LABELS = {
  'desktop.chats-projects': {
    key: 'settings.storagePage.transfer.families.chatsProjects',
    fallback: 'Chats and Projects',
  },
  'desktop.scheduler': {
    key: 'settings.storagePage.transfer.families.schedules',
    fallback: 'Schedules and automations',
  },
  'desktop.workflows-teams': {
    key: 'settings.storagePage.transfer.families.workflowsTeams',
    fallback: 'Workflows and teams',
  },
  'desktop.artifacts-receipts': {
    key: 'settings.storagePage.transfer.families.artifactsReceipts',
    fallback: 'Files, outputs, and receipts',
  },
  'desktop.webui': { key: 'settings.storagePage.transfer.families.webui', fallback: 'Cloud and WebUI state' },
  'desktop.preferences': {
    key: 'settings.storagePage.transfer.families.preferences',
    fallback: 'Settings and preferences',
  },
  'core.engine-state': {
    key: 'settings.storagePage.transfer.families.coreEngine',
    fallback: 'Wayland Core memory and profiles',
  },
  'external.backend-handles': {
    key: 'settings.storagePage.transfer.families.backends',
    fallback: 'Connected agents and backends',
  },
  'credentials.secrets': {
    key: 'settings.storagePage.transfer.families.credentials',
    fallback: 'Credentials and secrets',
  },
  'updater.release-channel': {
    key: 'settings.storagePage.transfer.families.updater',
    fallback: 'App update state',
  },
  'external.workspaces': {
    key: 'settings.storagePage.transfer.families.workspaces',
    fallback: 'External workspace files',
  },
} as const satisfies Record<
  WaylandTransferFamilyPreview['id'],
  { key: `settings.storagePage.transfer.families.${string}`; fallback: string }
>;

const REQUIRED_FAMILY_IDS = Object.keys(FAMILY_LABELS) as WaylandTransferFamilyPreview['id'][];
const REQUIRED_FAMILY_SET = new Set<string>(REQUIRED_FAMILY_IDS);

const DISPOSITION_LABELS: Record<WaylandTransferFamilyDisposition, string> = {
  included: 'Included',
  'reference-only': 'Reference only',
  'reconnect-required': 'Reconnect required',
  excluded: 'Excluded',
  blocked: 'Blocked',
};

const DISPOSITION_COLORS: Record<WaylandTransferFamilyDisposition, string> = {
  included: 'green',
  'reference-only': 'blue',
  'reconnect-required': 'orange',
  excluded: 'gray',
  blocked: 'red',
};

const PREVIEW_REQUEST: WaylandTransferPreflightRequest = {
  mode: 'recovery',
  scope: 'full',
  selectedLogicalState: REQUIRED_FAMILY_IDS,
  // Preview does not impersonate the owner-authority flow. The future create
  // action must collect fresh, single-use authority before publication.
  ownerConfirmed: false,
  stepUpAuthenticated: false,
  recoveryCredentialReady: false,
};

function isValidPreview(value: WaylandTransferPreflight): boolean {
  if (
    value.contract !== 'wayland-transfer-preflight/1.0' ||
    value.formatVersion !== 1 ||
    value.dryRunOnly !== true ||
    value.mode !== 'recovery' ||
    value.suite !== 'WT-R1' ||
    value.scope !== 'full' ||
    value.readyToExport !== false ||
    !Array.isArray(value.families) ||
    !Array.isArray(value.blockers) ||
    !Array.isArray(value.warnings) ||
    value.blockers.length === 0 ||
    value.families.length !== REQUIRED_FAMILY_IDS.length
  ) {
    return false;
  }

  const seen = new Set<string>();
  for (const family of value.families) {
    if (
      !REQUIRED_FAMILY_SET.has(family.id) ||
      seen.has(family.id) ||
      !Object.hasOwn(DISPOSITION_LABELS, family.disposition) ||
      !Array.isArray(family.authorityIds) ||
      typeof family.sensitive !== 'boolean' ||
      typeof family.executableCapable !== 'boolean' ||
      !Number.isFinite(family.estimatedBytes) ||
      family.estimatedBytes < 0 ||
      !Number.isSafeInteger(family.fileCount) ||
      family.fileCount < 0
    ) {
      return false;
    }
    seen.add(family.id);
  }
  return REQUIRED_FAMILY_IDS.every((id) => seen.has(id));
}

function dispositionCounts(families: WaylandTransferFamilyPreview[]) {
  return families.reduce(
    (counts, family) => {
      if (family.disposition === 'included') counts.included += 1;
      else if (family.disposition === 'reference-only') counts.reference += 1;
      else counts.excluded += 1;
      return counts;
    },
    { included: 0, reference: 0, excluded: 0 }
  );
}

const TransferCard: React.FC = () => {
  const { t } = useTranslation();
  const desktop = isElectronDesktop();
  const [preview, setPreview] = React.useState<WaylandTransferPreflight | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);

  const loadPreview = React.useCallback(async () => {
    if (!desktop) return;
    setLoading(true);
    setError(false);
    setPreview(null);
    try {
      const result = await waylandTransfer.preview.invoke(PREVIEW_REQUEST);
      if (!isValidPreview(result)) throw new Error('transfer preview contract mismatch');
      setPreview(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [desktop]);

  const counts = preview ? dispositionCounts(preview.families) : null;

  return (
    <Card
      title={t('settings.storagePage.transfer.title', 'Move this Wayland instance')}
      titleIcon={ArrowRightLeft}
      statusBadge={
        preview ? (
          <Tag color={preview.readyToExport ? 'green' : 'orange'}>
            {preview.readyToExport
              ? t('settings.storagePage.transfer.ready', 'Preflight ready')
              : t('settings.storagePage.transfer.actionRequired', 'Action required')}
          </Tag>
        ) : undefined
      }
    >
      <div className='flex flex-col gap-12px'>
        <div className='text-12px leading-relaxed text-[var(--color-text-2)]'>
          {t(
            'settings.storagePage.transfer.description',
            'See exactly what can move to another Wayland instance before any encrypted bundle is created.'
          )}
        </div>

        {!desktop ? (
          <div className='rounded-8px bg-[var(--color-fill-2)] px-12px py-10px text-12px text-[var(--color-text-2)]'>
            {t(
              'settings.storagePage.transfer.desktopOnly',
              'Transfer preview is local-only and must be opened in the Wayland desktop app.'
            )}
          </div>
        ) : !preview && !error ? (
          <div className='flex items-center gap-10px'>
            <Button type='primary' size='small' loading={loading} onClick={() => void loadPreview()}>
              {t('settings.storagePage.transfer.previewAction', 'Preview my transfer')}
            </Button>
            <span className='text-11px text-[var(--color-text-3)]'>
              {t('settings.storagePage.transfer.previewSafety', 'Read-only. No bundle or file is created.')}
            </span>
            {loading && <Spin size={14} />}
          </div>
        ) : error ? (
          <div className='flex items-start gap-10px rounded-8px bg-[var(--color-danger-light-1)] px-12px py-10px'>
            <AlertTriangle size={17} className='mt-1px shrink-0 text-[rgb(var(--red-6))]' aria-hidden />
            <div className='flex flex-1 flex-col gap-6px'>
              <span className='text-12px font-medium text-[var(--color-text-1)]'>
                {t('settings.storagePage.transfer.unavailableTitle', 'Transfer inventory could not be proven')}
              </span>
              <span className='text-11px text-[var(--color-text-2)]'>
                {t(
                  'settings.storagePage.transfer.unavailableDescription',
                  'Nothing can be exported or imported until Wayland can account for every data family.'
                )}
              </span>
              <Button size='mini' className='self-start' onClick={() => void loadPreview()}>
                {t('settings.storagePage.transfer.tryAgain', 'Try again')}
              </Button>
            </div>
          </div>
        ) : preview && counts ? (
          <>
            <div
              className='grid grid-cols-3 gap-8px'
              aria-label={t('settings.storagePage.transfer.summary', 'Transfer summary')}
            >
              {[
                [counts.included, t('settings.storagePage.transfer.includedCount', 'Included')],
                [counts.reference, t('settings.storagePage.transfer.referenceCount', 'Reference only')],
                [counts.excluded, t('settings.storagePage.transfer.excludedCount', 'Excluded, reconnect, or blocked')],
              ].map(([value, label]) => (
                <div key={String(label)} className='rounded-8px border border-[var(--color-border-2)] px-10px py-8px'>
                  <div className='text-18px font-semibold leading-22px text-[var(--color-text-1)]'>{value}</div>
                  <div className='text-11px text-[var(--color-text-3)]'>{label}</div>
                </div>
              ))}
            </div>

            <div
              className='flex flex-col gap-6px'
              aria-label={t('settings.storagePage.transfer.dataFamilies', 'Data families')}
            >
              {preview.families.map((family) => (
                <div
                  key={family.id}
                  className='flex items-start gap-8px rounded-6px border border-[var(--color-border-2)] px-10px py-8px'
                >
                  <div className='min-w-0 flex-1'>
                    <div className='text-12px font-medium text-[var(--color-text-1)]'>
                      {t(FAMILY_LABELS[family.id].key, FAMILY_LABELS[family.id].fallback)}
                    </div>
                    {family.reason && (
                      <div className='mt-2px text-11px text-[var(--color-text-3)]'>{family.reason}</div>
                    )}
                    {family.executableCapable && (
                      <div className='mt-4px flex items-center gap-4px text-11px text-[rgb(var(--orange-6))]'>
                        <PauseCircle size={12} aria-hidden />
                        {t('settings.storagePage.transfer.pausedOnImport', 'Paused and quarantined after import')}
                      </div>
                    )}
                  </div>
                  <Tag size='small' color={DISPOSITION_COLORS[family.disposition]}>
                    {t(
                      `settings.storagePage.transfer.dispositions.${family.disposition}`,
                      DISPOSITION_LABELS[family.disposition]
                    )}
                  </Tag>
                </div>
              ))}
            </div>

            {preview.blockers.length > 0 && (
              <div className='rounded-8px bg-[var(--color-fill-2)] px-12px py-10px'>
                <div className='flex items-center gap-6px text-12px font-medium text-[var(--color-text-1)]'>
                  <AlertTriangle size={14} className='text-[rgb(var(--orange-6))]' aria-hidden />
                  {t('settings.storagePage.transfer.blockersTitle', 'Required before a bundle can be created')}
                </div>
                <ul className='mt-6px list-disc pl-18px text-11px leading-18px text-[var(--color-text-2)]'>
                  {preview.blockers.map((finding) => (
                    <li key={`${finding.code}:${finding.logicalStateId ?? ''}:${finding.authorityId ?? ''}`}>
                      {finding.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {preview.warnings.length > 0 && (
              <div className='rounded-8px border border-[var(--color-border-2)] px-12px py-10px'>
                <div className='text-12px font-medium text-[var(--color-text-1)]'>
                  {t('settings.storagePage.transfer.warningsTitle', 'What happens after import')}
                </div>
                <ul className='mt-6px list-disc pl-18px text-11px leading-18px text-[var(--color-text-2)]'>
                  {preview.warnings.map((finding) => (
                    <li key={`${finding.code}:${finding.logicalStateId ?? ''}:${finding.authorityId ?? ''}`}>
                      {finding.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : null}

        <div className='flex flex-wrap items-center gap-8px border-t border-[var(--color-border-2)] pt-12px'>
          <Button size='small' type='primary' disabled>
            {t('settings.storagePage.transfer.exportAction', 'Export encrypted bundle')}
          </Button>
          <Button size='small' disabled>
            {t('settings.storagePage.transfer.recoveryAction', 'Create recovery bundle')}
          </Button>
          <Button size='small' disabled>
            {t('settings.storagePage.transfer.importAction', 'Import bundle')}
          </Button>
          <div className='flex items-center gap-4px text-11px text-[var(--color-text-3)]'>
            <ShieldCheck size={13} aria-hidden />
            {t(
              'settings.storagePage.transfer.actionsLocked',
              'Locked until owner approval, verified capture, encryption, and transactional restore are connected.'
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TransferCard;
