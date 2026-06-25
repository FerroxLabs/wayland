/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * "Migrate from another tool" settings pane (#migrate). Auto-detects a Hermes or
 * OpenClaw install, previews exactly what would be imported (provider keys + MCP
 * servers), and imports the user-selected subset. Mirrors the proven plan/apply
 * UX: scan (read-only) -> review -> import. Items already present in Wayland are
 * shown but unchecked by default so a migration never clobbers a working setup.
 */

import { Button, Checkbox, Spin } from '@arco-design/web-react';
import { ArrowRightLeft, CheckCircle2, KeyRound, Server, Download, FolderSearch } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type { MigrationItem, MigrationPlan, MigrationResult, MigrationToolId } from '@/common/types/migration';
import PageShell from '@/renderer/components/layout/PageShell';

const TOOLS: Array<{ id: MigrationToolId; name: string }> = [
  { id: 'hermes', name: 'Hermes' },
  { id: 'openclaw', name: 'OpenClaw' },
];

const kindIcon = (item: MigrationItem) =>
  item.kind === 'provider-key' ? <KeyRound size={15} /> : <Server size={15} />;

const ToolCard: React.FC<{ toolId: MigrationToolId; name: string }> = ({ toolId, name }) => {
  const { t } = useTranslation();
  const [plan, setPlan] = useState<MigrationPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const scan = useCallback(async () => {
    setLoading(true);
    try {
      const p = await ipcBridge.migrate.scan.invoke({ toolId });
      setPlan(p);
      // Default selection: everything NEW (never auto-select an existing item).
      setSelected(new Set(p.items.filter((i) => i.status === 'new').map((i) => i.id)));
    } finally {
      setLoading(false);
    }
  }, [toolId]);

  useEffect(() => {
    void scan();
  }, [scan]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const runImport = useCallback(async () => {
    setImporting(true);
    try {
      const res = await ipcBridge.migrate.apply.invoke({ toolId, selectedIds: [...selected] });
      setResult(res);
      await scan(); // refresh statuses (imported items become "exists")
    } finally {
      setImporting(false);
    }
  }, [toolId, selected, scan]);

  const newCount = useMemo(() => plan?.items.filter((i) => i.status === 'new').length ?? 0, [plan]);

  return (
    <div className='rd-12px border-1 border-solid border-3 bg-1 p-16px mb-14px'>
      <div className='flex items-center justify-between gap-12px'>
        <div className='flex items-center gap-10px min-w-0'>
          <ArrowRightLeft size={18} className='text-t-tertiary flex-shrink-0' />
          <div className='min-w-0'>
            <div className='text-15px font-semibold text-t-primary'>{name}</div>
            <div className='text-12px text-t-tertiary truncate'>
              {loading
                ? t('settings.migrate.scanning')
                : plan?.detected
                  ? t('settings.migrate.detectedAt', { path: plan.sourcePath })
                  : t('settings.migrate.notFound', { name })}
            </div>
          </div>
        </div>
        {loading && <Spin size={16} />}
      </div>

      {!loading && plan?.detected && plan.items.length === 0 && (
        <div className='mt-12px text-13px text-t-tertiary flex items-center gap-6px'>
          <FolderSearch size={14} /> {t('settings.migrate.nothingToImport')}
        </div>
      )}

      {!loading && plan?.detected && plan.items.length > 0 && (
        <div className='mt-14px'>
          <div className='flex flex-col gap-2px'>
            {plan.items.map((item) => {
              const exists = item.status === 'exists';
              return (
                <label
                  key={item.id}
                  className={`flex items-center gap-10px py-6px px-8px rd-8px cursor-pointer hover:bg-2 ${exists ? 'opacity-60' : ''}`}
                >
                  <Checkbox checked={selected.has(item.id)} onChange={() => toggle(item.id)} />
                  <span className='text-t-tertiary flex-shrink-0'>{kindIcon(item)}</span>
                  <span className='text-13px text-t-primary flex-shrink-0 capitalize'>{item.label}</span>
                  <span className='text-12px text-t-tertiary font-mono truncate flex-1'>{item.detail}</span>
                  {exists && (
                    <span className='text-11px text-t-tertiary bg-2 rd-full px-8px py-1px flex-shrink-0'>
                      {t('settings.migrate.alreadyAdded')}
                    </span>
                  )}
                  {item.sensitive && !exists && (
                    <span className='text-11px text-t-tertiary flex-shrink-0'>{t('settings.migrate.key')}</span>
                  )}
                </label>
              );
            })}
          </div>

          {plan.warnings.length > 0 && (
            <div className='mt-8px text-11px text-t-tertiary'>
              {plan.warnings.map((w, i) => (
                <div key={i}>⚠ {w}</div>
              ))}
            </div>
          )}

          <div className='mt-14px flex items-center justify-between gap-12px'>
            <span className='text-12px text-t-tertiary'>
              {t('settings.migrate.selectedCount', { count: selected.size })}
              {newCount > 0 && ` · ${t('settings.migrate.newCount', { count: newCount })}`}
            </span>
            <Button
              type='primary'
              size='small'
              loading={importing}
              disabled={selected.size === 0}
              icon={<Download size={14} />}
              onClick={() => void runImport()}
            >
              {t('settings.migrate.importSelected', { count: selected.size })}
            </Button>
          </div>
        </div>
      )}

      {result && (
        <div className='mt-12px text-13px flex items-start gap-8px text-t-secondary'>
          <CheckCircle2 size={16} className='text-success flex-shrink-0 mt-1px' />
          <div>
            <div>{t('settings.migrate.resultSummary', { applied: result.applied, skipped: result.skipped })}</div>
            {result.errors.length > 0 && (
              <div className='mt-4px text-12px text-t-tertiary'>
                {result.errors.map((e, i) => (
                  <div key={i}>
                    {e.label}: {e.reason}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MigrateSettings: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PageShell
      title={t('settings.migrate.title')}
      icon={<ArrowRightLeft size={20} />}
      subtitle={t('settings.migrate.subtitle')}
      width='standard'
    >
      {TOOLS.map((tool) => (
        <ToolCard key={tool.id} toolId={tool.id} name={tool.name} />
      ))}
    </PageShell>
  );
};

export default MigrateSettings;
