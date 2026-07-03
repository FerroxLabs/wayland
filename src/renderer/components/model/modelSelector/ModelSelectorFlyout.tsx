/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input } from '@arco-design/web-react';
import { Check, ChevronRight, Info, Pin, Plus, Search, Settings, Sparkles } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { iconColors } from '@/renderer/styles/colors';
import { providerLabel } from '@renderer/components/onboarding/providerLabel';
import EffortSubRow from './EffortSubRow';
import styles from './ModelSelectorFlyout.module.css';
import type { ModelRow, ModelSelectorProps, ModelZone } from './modelSelectorTypes';

/** First-letter glyph tile, mirroring the composer SkillsFlyout `Tile`. */
const Tile: React.FC<{ label: string }> = ({ label }) => (
  <div className={styles.tile}>{(label.trim().charAt(0) || 'M').toUpperCase()}</div>
);

const tierClass = (price?: ModelRow['price']): string => {
  if (price === '$$$') return `${styles.tier} ${styles.tier3}`;
  if (price === '$$') return `${styles.tier} ${styles.tier2}`;
  return styles.tier;
};

const ModelSelectorFlyout: React.FC<ModelSelectorProps> = ({
  vm,
  effort = 'medium',
  onSelect,
  onTogglePin,
  onSetEffort,
  onManage,
  draftSearch = false,
  notice,
}) => {
  const { t } = useTranslation();

  // Optional informational banner (e.g. the Claude-Code subscription-vs-chat
  // explainer, #335). Rendered in both the empty and populated states.
  const noticeBanner = notice ? (
    <div className={styles.notice} role='note'>
      <Info size={14} strokeWidth={2} className={styles.noticeIc} />
      <span>{notice}</span>
    </div>
  ) : null;
  const [query, setQuery] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);

  const searching = query.trim().length > 0;

  // Flat catalog over every row (visible zones + the "More models" tail), used
  // only while searching. Deduped by key so a model in both pinned and
  // recommended shows once.
  const flatRows = useMemo(() => {
    // Include the Flux Auto hero so a search for "flux"/"auto" finds it and the
    // enabled count reflects it (the hero renders outside the zone list).
    const all = [
      ...(vm.fluxHero ? [vm.fluxHero] : []),
      ...vm.zones.flatMap((z) => z.rows),
      ...vm.moreZones.flatMap((z) => z.rows),
    ];
    const seen = new Set<string>();
    const out: ModelRow[] = [];
    for (const r of all) {
      if (seen.has(r.key)) continue;
      seen.add(r.key);
      out.push(r);
    }
    return out;
  }, [vm.fluxHero, vm.zones, vm.moreZones]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return flatRows.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        r.providerId.toLowerCase().includes(q) ||
        r.descriptor.toLowerCase().includes(q)
    );
  }, [flatRows, query]);

  // Group search results by provider, preserving first-seen order.
  const groupedResults = useMemo(() => {
    const groups: { providerId: string; rows: ModelRow[] }[] = [];
    const index = new Map<string, ModelRow[]>();
    for (const r of results) {
      let bucket = index.get(r.providerId);
      if (!bucket) {
        bucket = [];
        index.set(r.providerId, bucket);
        groups.push({ providerId: r.providerId, rows: bucket });
      }
      bucket.push(r);
    }
    return groups;
  }, [results]);

  const enabledCount = useMemo(() => flatRows.filter((r) => r.available).length, [flatRows]);
  const moreCount = useMemo(() => vm.moreZones.reduce((n, z) => n + z.rows.length, 0), [vm.moreZones]);

  const renderRow = (row: ModelRow) => {
    if (!row.available) {
      return (
        <div className={`${styles.row} ${styles.unavail}`} key={row.key}>
          <Tile label={row.label} />
          <div className={styles.meta}>
            <div className={styles.name}>{row.label}</div>
            {row.descriptor && <div className={styles.desc}>{row.descriptor}</div>}
          </div>
          <span className={styles.unavailNote}>
            {t('conversation.modelSelector.unavailable', { defaultValue: 'Currently unavailable' })}
          </span>
        </div>
      );
    }

    const active = vm.activeKey === row.key;
    return (
      <div
        className={`${styles.row} ${active ? styles.rowActive : ''}`}
        key={row.key}
        role='button'
        tabIndex={0}
        onClick={() => onSelect(row.id, row.providerId)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onSelect(row.id, row.providerId);
        }}
      >
        <Tile label={row.label} />
        <div className={styles.meta}>
          <div className={styles.name}>{row.label}</div>
          {row.descriptor && <div className={styles.desc}>{row.descriptor}</div>}
        </div>
        {row.price && <span className={tierClass(row.price)}>{row.price}</span>}
        {active && (
          <span className={styles.check}>
            <Check size={16} strokeWidth={2.6} />
          </span>
        )}
        <Button
          type='text'
          shape='circle'
          size='mini'
          className={`${styles.pin} ${row.pinned ? styles.pinned : ''}`}
          aria-label={
            row.pinned
              ? t('conversation.modelSelector.unpinAria', { defaultValue: 'Unpin {{name}}', name: row.label })
              : t('conversation.modelSelector.pinAria', { defaultValue: 'Pin {{name}}', name: row.label })
          }
          icon={<Pin size={13} strokeWidth={1.8} fill={row.pinned ? 'currentColor' : 'none'} />}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(row.key);
          }}
        />
      </div>
    );
  };

  const zoneLabelEls = (zone: ModelZone, hintDot: boolean) => (
    <div className={styles.sectionLabel} key={`${zone.id}-label`}>
      {hintDot && <span className={styles.hintDot} />}
      {zone.label}
      <span className={styles.grpPill}>
        {t('conversation.modelSelector.modelCount', { defaultValue: '{{count}} models', count: zone.rows.length })}
      </span>
    </div>
  );

  // Empty state - no provider connected and flux off.
  if (vm.empty) {
    return (
      <div className={styles.flyout}>
        <div className={styles.flyoutHead}>
          <div className={styles.flyoutTitle}>
            <Sparkles size={15} color='rgb(var(--primary-6))' strokeWidth={2} />
            {t('conversation.modelSelector.title', { defaultValue: 'Model' })}
          </div>
          <div className={styles.flyoutSub}>
            {t('conversation.modelSelector.emptySub', { defaultValue: 'Connect a provider to choose a model.' })}
          </div>
        </div>
        <div className={styles.flyoutScroll}>
          {noticeBanner}
          <div className={styles.emptyCard}>
            <div className={styles.emptyIc}>
              <Sparkles size={22} strokeWidth={1.8} />
            </div>
            <div className={styles.emptyTitle}>
              {t('conversation.modelSelector.emptyTitle', { defaultValue: 'No models yet' })}
            </div>
            <div className={styles.emptySub}>
              {t('conversation.modelSelector.emptyBody', {
                defaultValue: 'No models yet. Connect a provider or sign in to a CLI.',
              })}
            </div>
            <Button type='primary' onClick={onManage}>
              {t('conversation.modelSelector.connectProvider', { defaultValue: 'Connect a provider' })}
            </Button>
            <div className={styles.emptyFlux}>
              {t('conversation.modelSelector.emptyFlux', {
                defaultValue: 'Tip: connect Flux Router for one-tap auto-routing across every model you add.',
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.flyout}>
      <div className={styles.flyoutHead}>
        <div className={styles.flyoutTitle}>
          <Sparkles size={15} color='rgb(var(--primary-6))' strokeWidth={2} />
          {t('conversation.modelSelector.title', { defaultValue: 'Model' })}
          <span className={styles.countPill}>
            {t('conversation.modelSelector.enabledCount', { defaultValue: '{{count}} enabled', count: enabledCount })}
          </span>
        </div>
        <div className={styles.flyoutSub}>
          {t('conversation.modelSelector.subtitle', {
            defaultValue: 'Pick a model for this chat. Only what you have connected shows.',
          })}
        </div>
      </div>

      <div className={styles.flyoutScroll}>
        {noticeBanner}
        {/* Flux Auto hero - rendered independently of zones (zones may be empty
            while the curated list resolves even though the hero is present). */}
        {vm.fluxHero && (
          <div
            className={styles.hero}
            role='button'
            tabIndex={0}
            onClick={() => onSelect(vm.fluxHero!.id, vm.fluxHero!.providerId)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelect(vm.fluxHero!.id, vm.fluxHero!.providerId);
            }}
          >
            <div className={styles.heroIc}>
              <Sparkles size={18} strokeWidth={2.2} />
            </div>
            <div className={styles.heroMeta}>
              <div className={styles.heroName}>
                {vm.fluxHero.label}
                <span className={styles.recPill}>
                  {t('conversation.modelSelector.recommended', { defaultValue: 'Recommended' })}
                </span>
              </div>
              <div className={styles.heroDesc}>{vm.fluxHero.descriptor}</div>
            </div>
            {vm.activeKey === vm.fluxHero.key && (
              <span className={styles.heroCheck}>
                <Check size={18} strokeWidth={2.6} />
              </span>
            )}
          </div>
        )}

        {/* Effort sub-row under the active model (effort-capable backends only). */}
        {vm.effortSupported && onSetEffort && <EffortSubRow level={effort} onChange={onSetEffort} />}

        <div className={styles.searchBox}>
          <Input
            value={query}
            onChange={setQuery}
            allowClear
            autoFocus={draftSearch}
            prefix={<Search size={15} color='var(--color-text-3)' />}
            placeholder={t('conversation.modelSelector.searchPlaceholder', { defaultValue: 'Search models…' })}
          />
        </div>

        {searching ? (
          <div>
            <div className={styles.sectionLabel}>
              {results.length === 1
                ? t('conversation.modelSelector.resultsOne', { defaultValue: '1 result' })
                : t('conversation.modelSelector.resultsN', {
                    defaultValue: '{{count}} results',
                    count: results.length,
                  })}
            </div>
            {results.length > 0 ? (
              groupedResults.map((g) => (
                <div key={g.providerId}>
                  <div className={styles.sectionLabel}>
                    {providerLabel(g.providerId)}
                    <span className={styles.grpPill}>
                      {t('conversation.modelSelector.modelCount', {
                        defaultValue: '{{count}} models',
                        count: g.rows.length,
                      })}
                    </span>
                  </div>
                  {g.rows.map(renderRow)}
                </div>
              ))
            ) : (
              <div className={styles.empty}>
                {t('conversation.modelSelector.noMatch', { defaultValue: 'No models match “{{query}}”.', query })}
              </div>
            )}
          </div>
        ) : (
          <div>
            {vm.zones.map((zone) => (
              <div key={zone.id}>
                {zoneLabelEls(zone, zone.id.startsWith('recommended') || zone.id === 'flux')}
                {zone.rows.map(renderRow)}
              </div>
            ))}

            {vm.moreZones.length > 0 && (
              <>
                <div
                  className={styles.moreToggle}
                  role='button'
                  tabIndex={0}
                  aria-expanded={moreOpen}
                  onClick={() => setMoreOpen((v) => !v)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setMoreOpen((v) => !v);
                  }}
                >
                  <Plus size={16} strokeWidth={1.8} />
                  {t('conversation.modelSelector.moreModels', { defaultValue: 'More models' })}
                  <span className={styles.grpPill}>
                    {t('conversation.modelSelector.modelCount', {
                      defaultValue: '{{count}} models',
                      count: moreCount,
                    })}
                  </span>
                  <span className={`${styles.moreChev} ${moreOpen ? styles.moreChevOpen : ''}`}>
                    <ChevronRight size={14} strokeWidth={2} />
                  </span>
                </div>
                {moreOpen &&
                  vm.moreZones.map((zone) => (
                    <div key={zone.id}>
                      {zoneLabelEls(zone, false)}
                      {zone.rows.map(renderRow)}
                    </div>
                  ))}
              </>
            )}
          </div>
        )}
      </div>

      <div className={styles.foot}>
        <div
          className={styles.footItem}
          role='button'
          tabIndex={0}
          onClick={onManage}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onManage();
          }}
        >
          <Settings size={16} color={iconColors.secondary} />
          {t('conversation.modelSelector.manageModels', { defaultValue: 'Manage models' })}
          <span className={styles.footChev}>
            <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
};

export default ModelSelectorFlyout;
