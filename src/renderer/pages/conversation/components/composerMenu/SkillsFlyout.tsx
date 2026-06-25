/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input, Message, Switch } from '@arco-design/web-react';
import { Check, ChevronRight, Plus, Search, SlidersHorizontal, Zap } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import { iconColors } from '@/renderer/styles/colors';
import type { SkillIndexEntry } from '@/common/types/skillTypes';
import type { OnChatSkill, UseComposerSkills } from './useComposerSkills';
import styles from './ComposerAddMenu.module.css';

type Props = {
  composer: UseComposerSkills;
  /** Current composer draft, used to surface "Suggested for '<draft>'". */
  draftText?: string;
  /**
   * Ranked suggestions for the current draft (Task 8 skills.suggest). When
   * omitted, suggestions are derived client-side from the loaded library.
   */
  suggestions?: SkillIndexEntry[];
  /** Navigate to the full Skills management page. */
  onManageAll: () => void;
};

const SUGGESTION_LIMIT = 2;

function deriveSuggestions(library: SkillIndexEntry[], draft: string, exclude: Set<string>): SkillIndexEntry[] {
  const tokens = draft
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((tok) => tok.length >= 4);
  if (tokens.length === 0) return [];
  const scored = library
    .filter((s) => !exclude.has(s.name))
    .map((s) => {
      const hay = `${s.name} ${s.description ?? ''}`.toLowerCase();
      const score = tokens.reduce((acc, tok) => (hay.includes(tok) ? acc + 1 : acc), 0);
      return { s, score };
    })
    .filter((x) => x.score > 0)
    .toSorted((a, b) => b.score - a.score);
  return scored.slice(0, SUGGESTION_LIMIT).map((x) => x.s);
}

const Tile: React.FC<{ name: string }> = ({ name }) => <div className={styles.tile}>{name.charAt(0)}</div>;

const SkillsFlyout: React.FC<Props> = ({ composer, draftText = '', suggestions, onManageAll }) => {
  const { t } = useTranslation();
  const [library, setLibrary] = useState<SkillIndexEntry[]>([]);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ipcBridge.skills.list
      .invoke({ type: 'skill' })
      .then((list) => {
        if (cancelled) return;
        setLibrary((list ?? []).filter((s) => s.security?.verdict !== 'blocked'));
      })
      .catch(() => {
        /* search just stays empty if the library can't load */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onChatNames = useMemo(() => new Set(composer.onChatList.map((s) => s.name)), [composer.onChatList]);

  // Proactive suggestions from the agent's own BM25 retrieval (skills.suggest),
  // debounced on the draft. Falls back to a client-side filter if the IPC yields
  // nothing yet. An explicit `suggestions` prop (tests) overrides both.
  const [ipcSuggestions, setIpcSuggestions] = useState<SkillIndexEntry[]>([]);
  useEffect(() => {
    if (suggestions) return;
    const q = draftText.trim();
    if (q.length < 3) {
      setIpcSuggestions([]);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(() => {
      ipcBridge.skills.suggest
        .invoke({ query: q, limit: SUGGESTION_LIMIT })
        .then((res) => {
          if (!cancelled) setIpcSuggestions(res ?? []);
        })
        .catch(() => {
          if (!cancelled) setIpcSuggestions([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [suggestions, draftText]);

  const derivedSuggestions = useMemo(() => {
    if (suggestions) return suggestions;
    const ranked = ipcSuggestions.length > 0 ? ipcSuggestions : deriveSuggestions(library, draftText, onChatNames);
    return ranked.filter((s) => !onChatNames.has(s.name)).slice(0, SUGGESTION_LIMIT);
  }, [suggestions, ipcSuggestions, library, draftText, onChatNames]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return library
      .filter((s) => s.name.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q))
      .slice(0, 100);
  }, [library, query]);

  const handleAdd = async (entry: { name: string; description?: string }) => {
    setAdding(entry.name);
    try {
      await composer.addSkill(entry.name, entry.description ?? '');
    } catch (e) {
      Message.error(e instanceof Error ? e.message : String(e));
    } finally {
      setAdding(null);
    }
  };

  const renderOnChatRow = (s: OnChatSkill) => (
    <div className={styles.row} key={`onchat-${s.name}`}>
      <Tile name={s.name} />
      <div className={styles.meta}>
        <div className={styles.name}>
          {s.name}
          <span className={styles.srcTag}>{s.kind === 'builtin' ? t('conversation.composerMenu.tagBuiltin', { defaultValue: 'builtin' }) : t('conversation.composerMenu.tagAdded', { defaultValue: 'added' })}</span>
        </div>
        <div className={styles.desc}>{s.description}</div>
      </div>
      <Switch
        size='small'
        checked={s.enabled}
        onChange={() => void composer.toggleSkill(s.name)}
        aria-label={t('conversation.composerMenu.toggleAria', { defaultValue: 'Toggle {{name}}', name: s.name })}
      />
    </div>
  );

  const renderAddRow = (entry: SkillIndexEntry) => {
    const added = onChatNames.has(entry.name);
    return (
      <div className={styles.row} key={`add-${entry.name}`}>
        <Tile name={entry.name} />
        <div className={styles.meta}>
          <div className={styles.name}>{entry.name}</div>
          <div className={styles.desc}>{entry.description}</div>
        </div>
        {added ? (
          <span className={styles.addedTag}>
            <Check size={12} strokeWidth={3} /> {t('skills.addToChat.alreadyAdded', { defaultValue: 'Added' })}
          </span>
        ) : (
          <Button
            className={styles.addBtn}
            size='mini'
            type='outline'
            loading={adding === entry.name}
            icon={<Plus size={12} strokeWidth={2.5} />}
            onClick={() => void handleAdd(entry)}
          >
            {t('skills.addToChat.add', { defaultValue: 'Add' })}
          </Button>
        )}
      </div>
    );
  };

  const searching = query.trim().length > 0;

  return (
    <div className={styles.flyout}>
      <div className={styles.flyoutHead}>
        <div className={styles.flyoutTitle}>
          <Zap size={15} color='rgb(var(--primary-6))' strokeWidth={2} />
          {t('conversation.composerMenu.skillsTitle', { defaultValue: 'Skills on this chat' })}
        </div>
        <div className={styles.flyoutSub}>
          {t('conversation.composerMenu.skillsSub', {
            defaultValue: 'Only these load by default. Everything else stays one search away.',
          })}
        </div>
      </div>

      <div className={styles.flyoutScroll}>
        <div className={styles.sectionLabel}>
          {t('conversation.composerMenu.onThisChat', { defaultValue: 'On this chat' })}
        </div>
        {composer.onChatList.map(renderOnChatRow)}

        <div className={styles.searchBox}>
          <Input
            value={query}
            onChange={setQuery}
            allowClear
            prefix={<Search size={15} color='var(--color-text-3)' />}
            placeholder={t('conversation.composerMenu.searchPlaceholder', { defaultValue: 'Search skills…' })}
          />
        </div>

        {searching ? (
          <div>
            <div className={styles.sectionLabel}>
              {results.length === 1
                ? t('conversation.composerMenu.resultsOne', { defaultValue: '1 result' })
                : t('conversation.composerMenu.resultsN', { defaultValue: '{{count}} results', count: results.length })}
            </div>
            {results.length > 0 ? (
              results.map(renderAddRow)
            ) : (
              <div className={styles.empty}>
                {t('conversation.composerMenu.noResults', { defaultValue: 'No skills match “{{query}}”.', query })}
              </div>
            )}
          </div>
        ) : derivedSuggestions.length > 0 ? (
          <div>
            <div className={styles.sectionLabel}>
              <span className={styles.hintDot} />
              {t('conversation.composerMenu.suggestedFor', {
                defaultValue: 'Suggested for “{{draft}}”',
                draft: draftText.trim().slice(0, 40),
              })}
            </div>
            {derivedSuggestions.map(renderAddRow)}
          </div>
        ) : null}
      </div>

      <div className={styles.foot}>
        <div
          className={styles.footItem}
          role='button'
          tabIndex={0}
          onClick={onManageAll}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onManageAll();
          }}
        >
          <SlidersHorizontal size={16} color={iconColors.secondary} />
          {t('conversation.composerMenu.manageAllSkills', { defaultValue: 'Manage all skills' })}
          <span className={styles.footChev}>
            <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
};

export default SkillsFlyout;
