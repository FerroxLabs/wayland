/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Bot, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AssistantIconTile from '@/renderer/pages/guid/components/AssistantIconTile';
import { LAUNCHPAD_MAX_ENTRIES } from '@/renderer/hooks/launchpad/useLaunchpadBar';
import { QUICK_LAUNCH_ANCHORS } from '@/renderer/pages/guid/quickLaunchAnchors';
import type { AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';
import { resolveBarEntry, type LaunchpadBarEntry } from './launchpadCatalog';
import styles from './LaunchpadPicker.module.css';

/**
 * Drawer that lists every assistant the bar can hold. Stays open across
 * picks (Sutherland: minimise round-trips) so a user adding three at
 * once doesn't have to reopen for each. The just-picked card flashes
 * orange for ~600ms then transitions to the dimmed `pinned` state.
 *
 * Pinned cards stay visible (rather than being filtered out) so the
 * user can see what's already in the bar at a glance and not pick a
 * duplicate by accident.
 *
 * Lives below the bar in the same DOM tree - not a modal. Picker DnD
 * (drag a card up into a bar slot) is a deferred polish; the click path
 * lands every assistant at the end of the bar today, which the spec
 * accepts as the v1 behaviour.
 */

export type LaunchpadPickerProps = {
  /** Close button + Esc handler. */
  onClose: () => void;
  /** Add this assistantId to the bar. */
  onPick: (assistantId: string) => void;
  /** Current bar order; pinned entries show "pinned" tag and don't fire onPick. */
  pinnedIds: string[];
  /** Live assistant catalogue from useAssistantList (built-in + extension). */
  assistants: AssistantListItem[];
  /** Resolved locale key (e.g. 'en-US') for nameI18n lookup. */
  localeKey: string;
};

const FLASH_MS = 600;

const LaunchpadPicker: React.FC<LaunchpadPickerProps> = ({
  onClose,
  onPick,
  pinnedIds,
  assistants,
  localeKey,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [flashId, setFlashId] = useState<string | null>(null);

  // Esc closes the drawer.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const pinnedSet = useMemo(() => new Set(pinnedIds), [pinnedIds]);
  const atCap = pinnedIds.length >= LAUNCHPAD_MAX_ENTRIES;

  // Build the catalog of pickable entries. Union of:
  //   - Default anchors (so 'Cowork' shows even if the catalogue is still loading)
  //   - Every live assistant from useAssistantList
  //
  // De-duped by runtime id. The order reflects: anchors first (familiar),
  // then catalog order (which useAssistantList already sorts).
  const entries = useMemo<LaunchpadBarEntry[]>(() => {
    const seen = new Set<string>();
    const acc: LaunchpadBarEntry[] = [];

    for (const anchor of QUICK_LAUNCH_ANCHORS) {
      if (seen.has(anchor.assistantId)) continue;
      const entry = resolveBarEntry(anchor.assistantId, assistants, localeKey);
      if (entry) {
        acc.push(entry);
        seen.add(anchor.assistantId);
      }
    }

    for (const a of assistants) {
      // Exclude team launchers - they live on /teams, not the new-chat
      // launchpad - so the count + list match /assistants (the real total).
      if (a._kind === 'team') continue;
      const candidates = [a.id, `builtin-${a.id}`];
      for (const id of candidates) {
        if (seen.has(id)) continue;
        const entry = resolveBarEntry(id, assistants, localeKey);
        if (entry) {
          acc.push(entry);
          seen.add(id);
          break;
        }
      }
    }
    return acc;
  }, [assistants, localeKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => {
      const haystack = `${e.label} ${e.sub} ${e.id}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [entries, query]);

  const handlePick = (entry: LaunchpadBarEntry) => {
    if (pinnedSet.has(entry.id)) return;
    if (atCap) return;
    onPick(entry.assistantId);
    setFlashId(entry.id);
    window.setTimeout(() => {
      setFlashId((current) => (current === entry.id ? null : current));
    }, FLASH_MS);
  };

  return (
    <div className={styles.drawer} data-testid='launchpad-picker' role='region' aria-label={t('guid.launchpad.picker.title', { defaultValue: 'Add to your launchpad bar' })}>
      <div className={styles.head}>
        <div>
          <span className={styles.title}>
            {t('guid.launchpad.picker.title', { defaultValue: 'Add to your launchpad bar' })}
          </span>
          <span className={styles.sub}>
            {t('guid.launchpad.picker.count', {
              defaultValue: '{{count}} available',
              count: entries.length,
            })}
          </span>
        </div>
        <button
          type='button'
          className={styles.close}
          onClick={onClose}
          aria-label={t('guid.launchpad.picker.close', { defaultValue: 'Close picker' })}
          data-testid='launchpad-picker-close'
        >
          <X size={14} aria-hidden='true' />
        </button>
      </div>

      {atCap ? (
        <div className={styles.capBanner} data-testid='launchpad-picker-cap-banner' role='status'>
          {t('guid.launchpad.picker.capBanner', {
            defaultValue: 'Maximum {{max}} shortcuts. Remove one from the bar to add another.',
            max: LAUNCHPAD_MAX_ENTRIES,
          })}
        </div>
      ) : null}

      <div className={styles.searchRow}>
        <span className={styles.searchIcon} aria-hidden='true'>
          <Search size={14} />
        </span>
        <input
          className={styles.search}
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('guid.launchpad.picker.searchPlaceholder', {
            defaultValue: 'Filter assistants',
          })}
          data-testid='launchpad-picker-search'
          autoFocus
        />
      </div>

      <div className={styles.grid}>
        {filtered.length === 0 ? (
          <div className={styles.empty} data-testid='launchpad-picker-empty'>
            {t('guid.launchpad.picker.empty', { defaultValue: 'No assistants match.' })}
          </div>
        ) : (
          filtered.map((entry) => {
            const pinned = pinnedSet.has(entry.id);
            const Icon = entry.Icon ?? Bot;
            // At cap, every unpinned card is also disabled + dimmed so the
            // user can see "I can't add more right now" at a glance. Pinned
            // cards keep their existing affordance (so the pinned tag is
            // still visible against the dashed border).
            const capLocked = !pinned && atCap;
            const className = [
              styles.pick,
              pinned ? styles.pinned : '',
              capLocked ? styles.capLocked : '',
              flashId === entry.id ? styles.pickFlash : '',
            ]
              .filter(Boolean)
              .join(' ');
            const ariaLabel = pinned
              ? t('guid.launchpad.picker.pinnedAria', {
                  defaultValue: '{{label}} (already in bar)',
                  label: entry.label,
                })
              : capLocked
                ? t('guid.launchpad.picker.capLockedAria', {
                    defaultValue: '{{label}} (bar full - remove one to add)',
                    label: entry.label,
                  })
                : t('guid.launchpad.picker.addAria', {
                    defaultValue: 'Add {{label}} to bar',
                    label: entry.label,
                  });
            return (
              <button
                key={entry.id}
                type='button'
                className={className}
                onClick={() => handlePick(entry)}
                disabled={pinned || capLocked}
                aria-disabled={pinned || capLocked}
                data-testid={`launchpad-picker-card-${entry.id}`}
                data-pinned={pinned ? 'true' : 'false'}
                data-cap-locked={capLocked ? 'true' : 'false'}
                aria-label={ariaLabel}
              >
                <AssistantIconTile paletteKey={entry.palette} size='sm'>
                  {entry.avatarUrl ? (
                    <img
                      src={entry.avatarUrl}
                      alt=''
                      style={{ width: '60%', height: '60%', objectFit: 'contain' }}
                    />
                  ) : entry.avatarEmoji ? (
                    <span style={{ fontSize: 14, lineHeight: '16px' }}>{entry.avatarEmoji}</span>
                  ) : (
                    <Icon size={14} />
                  )}
                </AssistantIconTile>
                <span className={styles.pickLabel}>{entry.label}</span>
                {pinned ? (
                  <span className={styles.pinnedTag}>
                    {t('guid.launchpad.picker.pinnedTag', { defaultValue: 'pinned' })}
                  </span>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LaunchpadPicker;
