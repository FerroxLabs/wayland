/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input, List, Message, Spin } from '@arco-design/web-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import type { SkillIndexEntry } from '@/common/types/skillTypes';

type Props = {
  /** Called when the user adds a skill. The host decides staged vs live behaviour. */
  onAdd: (name: string, description: string) => void | Promise<void>;
  /** Skills already on this chat - rendered as "Added" (disabled) instead of an Add button. */
  addedNames: string[];
  /** Max height of the scrollable result list. */
  maxHeight?: number;
  /** Autofocus the search box (modal hosts want this; the flyout does not). */
  autoFocus?: boolean;
};

/**
 * Reusable skill library search + results list. Loads the full skill index
 * once, filters as-you-type over name + description, and surfaces an Add button
 * per row (or an "Added" marker for skills already on the chat). Extracted from
 * the original AddSkillToChatButton modal so the composer "+" Skills flyout and
 * the (legacy) modal share one implementation.
 */
const SkillPickerPanel: React.FC<Props> = ({ onAdd, addedNames, maxHeight = 320, autoFocus = false }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'skills' });
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<SkillIndexEntry[]>([]);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    ipcBridge.skills.list
      .invoke({ type: 'skill' })
      .then((list) => {
        if (cancelled) return;
        setSkills((list ?? []).filter((s) => s.security?.verdict !== 'blocked'));
      })
      .catch(() => {
        if (!cancelled) Message.error(t('addToChat.loadFailed', { defaultValue: 'Failed to load skills.' }));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const addedSet = useMemo(() => new Set(addedNames), [addedNames]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? skills.filter(
          (s) => s.name.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q)
        )
      : skills;
    return base.slice(0, 200);
  }, [skills, query]);

  const handleAdd = async (skill: SkillIndexEntry) => {
    setAdding(skill.name);
    try {
      await onAdd(skill.name, skill.description ?? '');
    } catch (e) {
      Message.error(e instanceof Error ? e.message : String(e));
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className='flex flex-col gap-12px'>
      <Input.Search
        allowClear
        autoFocus={autoFocus}
        value={query}
        onChange={setQuery}
        placeholder={t('addToChat.searchPlaceholder', { defaultValue: 'Search skills…' })}
      />
      <Spin loading={loading} style={{ display: 'block' }}>
        <div style={{ maxHeight, overflowY: 'auto' }}>
          <List
            dataSource={filtered}
            noDataElement={
              <span className='text-12px' style={{ color: 'var(--color-text-3)' }}>
                {t('addToChat.noSkills', { defaultValue: 'No matching skills.' })}
              </span>
            }
            render={(skill) => {
              const isAdded = addedSet.has(skill.name);
              return (
                <List.Item
                  key={skill.name}
                  style={{ borderBottom: '1px solid var(--color-border-1)' }}
                  extra={
                    isAdded ? (
                      <span className='text-12px' style={{ color: 'var(--color-text-3)' }}>
                        {t('addToChat.alreadyAdded', { defaultValue: 'Added' })}
                      </span>
                    ) : (
                      <Button
                        size='small'
                        type='primary'
                        loading={adding === skill.name}
                        onClick={() => void handleAdd(skill)}
                      >
                        {t('addToChat.add', { defaultValue: 'Add' })}
                      </Button>
                    )
                  }
                >
                  <List.Item.Meta
                    title={<span className='text-13px font-semibold'>{skill.name}</span>}
                    description={
                      <span className='text-12px' style={{ color: 'var(--text-secondary)' }}>
                        {skill.description}
                      </span>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </div>
      </Spin>
    </div>
  );
};

export default SkillPickerPanel;
