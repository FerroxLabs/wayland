import React, { useState, useEffect } from 'react';
import { Button, Switch } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import type { ProviderModel, Capability, ModelTier } from '@process/providers/types';

type ModelWithEnabled = ProviderModel & { enabled: boolean };

type Props = {
  providerDisplayName: string;
  models: ProviderModel[];
  onConnect: (models: ModelWithEnabled[]) => void;
  onBack: () => void;
};

const TIER_ORDER: ModelTier[] = ['flagship', 'everyday', 'fast', 'reasoning', 'legacy'];
const PRESELECT_TIERS = new Set<ModelTier>(['flagship', 'everyday', 'fast']);

const TIER_COLORS: Record<ModelTier, string> = {
  flagship: 'bg-[var(--color-primary-1)] text-[var(--color-primary-6)]',
  everyday: 'bg-[var(--color-success-1)] text-[var(--color-success-6)]',
  fast: 'bg-[var(--color-warning-1)] text-[var(--color-warning-6)]',
  reasoning: 'bg-[var(--color-purple-1,#f5f0ff)] text-[var(--color-purple-6,#7c3aed)]',
  legacy: 'bg-[var(--color-fill-2)] text-[var(--color-text-3)]',
};

const CAPABILITY_ORDER: Capability[] = ['chat', 'vision', 'image', 'audio', 'embeddings', 'reasoning'];

function groupByCapability(models: ModelWithEnabled[]): Record<string, ModelWithEnabled[]> {
  const grouped: Record<string, ModelWithEnabled[]> = {};
  for (const cap of CAPABILITY_ORDER) {
    const items = models.filter((m) => m.capabilities.includes(cap));
    if (items.length) grouped[cap] = items;
  }
  // models with no known capability
  const uncategorised = models.filter((m) => m.capabilities.length === 0);
  if (uncategorised.length) grouped['chat'] = [...(grouped['chat'] ?? []), ...uncategorised];
  return grouped;
}

const ResultsState = ({ providerDisplayName, models: rawModels, onConnect, onBack }: Props) => {
  const { t } = useTranslation();

  const [models, setModels] = useState<ModelWithEnabled[]>(() =>
    rawModels
      .slice()
      .toSorted((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier))
      .map((m) => ({ ...m, enabled: PRESELECT_TIERS.has(m.tier) }))
  );

  // Chip stagger animation: reveal chips progressively
  const [visibleCount, setVisibleCount] = useState(0);
  useEffect(() => {
    if (models.length <= 2) {
      setVisibleCount(models.length);
      return;
    }
    const timers = [
      setTimeout(() => setVisibleCount(1), 60),
      setTimeout(() => setVisibleCount(2), 140),
      setTimeout(() => setVisibleCount(models.length), 220),
    ];
    return () => timers.forEach(clearTimeout);
  }, [models.length]);

  const toggle = (id: string, enabled: boolean) => {
    setModels((prev) => prev.map((m) => (m.id === id ? { ...m, enabled } : m)));
  };

  const grouped = groupByCapability(models);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(['audio']));

  const toggleSection = (cap: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cap)) next.delete(cap);
      else next.add(cap);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <h2 className="text-base font-semibold text-[var(--color-text-1)]">
        {providerDisplayName} — {t('settings.providers.connect.resultsTitle')}
      </h2>

      <div style={{ maxHeight: 360, overflowY: 'auto' }} className="flex flex-col gap-2">
        {Object.entries(grouped).map(([cap, items]) => (
          <div key={cap} className="border border-[var(--color-border-2)] rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-3 py-2 bg-[var(--color-fill-1)] hover:bg-[var(--color-fill-2)] transition-colors"
              onClick={() => toggleSection(cap)}
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-2)]">
                {t(`settings.providers.capabilities.${cap}`)}
              </span>
              <span className="text-[var(--color-text-3)] text-xs">{collapsed.has(cap) ? '▶' : '▼'}</span>
            </button>

            {!collapsed.has(cap) && (
              <div className="divide-y divide-[var(--color-border-1)]">
                {items.map((m, i) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 px-3 py-2 transition-opacity"
                    style={{
                      opacity: i < visibleCount ? 1 : 0,
                      transition: 'opacity 0.15s ease',
                    }}
                  >
                    <Switch
                      size="small"
                      checked={m.enabled}
                      onChange={(v) => toggle(m.id, v)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[var(--color-text-1)] truncate">{m.displayName}</div>
                      {m.contextWindow && (
                        <div className="text-xs text-[var(--color-text-3)]">
                          {(m.contextWindow / 1000).toFixed(0)}K ctx
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${TIER_COLORS[m.tier]}`}
                    >
                      {t(`settings.providers.tiers.${m.tier}`)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button onClick={onBack}>{t('settings.providers.connect.cancel')}</Button>
        <Button type="primary" onClick={() => onConnect(models)}>
          {t('settings.providers.connect.connectButton')}
        </Button>
      </div>
    </div>
  );
};

export default ResultsState;
export type { ModelWithEnabled };
