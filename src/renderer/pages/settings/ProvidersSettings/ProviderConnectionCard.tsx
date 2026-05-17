import React, { useState } from 'react';
import { Badge, Button, Input, Switch, Tooltip } from '@arco-design/web-react';
import { AlertTriangle, ChevronDown, ChevronUp, RefreshCw, Settings, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { IConnectedProviderView } from '@/common/adapter/ipcBridge';
import { providers } from '@/common/adapter/ipcBridge';

type Props = {
  provider: IConnectedProviderView;
  onRefresh: (catalogId: string) => void;
  onDisconnect: (catalogId: string) => void;
};

const MODEL_SEARCH_THRESHOLD = 8;

function hoursAgo(ts: number | null): number | null {
  if (!ts) return null;
  return Math.floor((Date.now() - ts) / (1000 * 60 * 60));
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[var(--brand-soft-bg,var(--color-primary-1))] text-inherit rounded-[2px]">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

const STATUS_COLOR: Record<IConnectedProviderView['status'], 'success' | 'error' | 'processing'> = {
  connected: 'success',
  error: 'error',
  refreshing: 'processing',
};

const ProviderConnectionCard = ({ provider, onRefresh, onDisconnect }: Props) => {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');

  const hours = hoursAgo(provider.lastRefreshedAt);
  const hasDeprecated = provider.models.some((m) => m.deprecated);
  const enabledCount = provider.models.filter((m) => m.enabled && !m.deprecated).length;
  const showSearch = provider.models.length > MODEL_SEARCH_THRESHOLD;

  const filteredModels = search
    ? provider.models.filter(
        (m) =>
          m.displayName.toLowerCase().includes(search.toLowerCase()) ||
          m.tier.toLowerCase().includes(search.toLowerCase())
      )
    : provider.models;

  const handleToggleModel = async (modelId: string, enabled: boolean) => {
    await providers.toggleModel.invoke({ catalogId: provider.id, modelId, enabled });
  };

  return (
    <div className="rounded-xl border border-[var(--color-border-2)] bg-[var(--color-bg-2)] p-4 flex flex-col gap-3">
      {hasDeprecated && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-warning-1)] text-[var(--color-warning-6)] text-xs">
          <AlertTriangle size={14} />
          {t('settings.providers.deprecationBanner')}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Badge status={STATUS_COLOR[provider.status]} />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-[var(--color-text-1)] truncate">
            {provider.displayName ?? provider.providerId}
          </div>
          <div className="text-xs text-[var(--color-text-3)]">
            {enabledCount} {t('settings.providers.connected').toLowerCase()} ·{' '}
            {hours !== null ? t('settings.providers.refreshed', { n: hours }) : '—'}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Tooltip content={t('settings.providers.refreshNow')}>
            <Button
              type="text"
              size="small"
              icon={<RefreshCw size={14} />}
              loading={provider.status === 'refreshing'}
              onClick={() => onRefresh(provider.id)}
            />
          </Tooltip>
          <Tooltip content={t('settings.providers.configure')}>
            <Button
              type="text"
              size="small"
              icon={<Settings size={14} />}
              onClick={() => setExpanded((e) => !e)}
            />
          </Tooltip>
          {confirming ? (
            <Button
              type="text"
              size="small"
              status="danger"
              icon={<Trash2 size={14} />}
              onClick={() => onDisconnect(provider.id)}
            />
          ) : (
            <Tooltip content={t('settings.providers.disconnect')}>
              <Button
                type="text"
                size="small"
                icon={<Trash2 size={14} />}
                onClick={() => setConfirming(true)}
              />
            </Tooltip>
          )}
          <Button
            type="text"
            size="small"
            icon={expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            onClick={() => setExpanded((e) => !e)}
          />
        </div>
      </div>

      {expanded && (
        <div className="flex flex-col gap-2 border-t border-[var(--color-border-1)] pt-3">
          {showSearch && (
            <Input.Search
              placeholder={t('settings.providers.search.placeholder')}
              value={search}
              onChange={setSearch}
              size="small"
              allowClear
            />
          )}

          {filteredModels.length === 0 && (
            <div className="text-xs text-[var(--color-text-3)] py-2 text-center">
              {t('settings.providers.search.noResults')}
            </div>
          )}

          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {filteredModels.map((model) => (
              <div
                key={model.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--color-fill-1)] transition-colors"
              >
                <Switch
                  size="small"
                  checked={model.enabled && !model.deprecated}
                  disabled={model.deprecated}
                  onChange={(v) => void handleToggleModel(model.id, v)}
                />
                <span className="flex-1 text-xs text-[var(--color-text-1)] truncate">
                  {highlight(model.displayName, search)}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-fill-2)] text-[var(--color-text-3)] flex-shrink-0">
                  {highlight(model.tier, search)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderConnectionCard;
