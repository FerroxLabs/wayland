/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input, List, Message, Modal, Spin, Tooltip } from '@arco-design/web-react';
import { Plus } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import { iconColors } from '@/renderer/styles/colors';
import type { SkillIndexEntry } from '@/common/types/skillTypes';

type Props = {
  conversationId: string;
};

/**
 * Composer affordance to add a skill to THIS conversation. The skill's body is
 * injected once on the next turn (server-side via skills.add-to-conversation)
 * and surfaces in the loaded-skills chip. Self-contained modal + state so it
 * can be dropped beside the skills indicator for any backend.
 */
const AddSkillToChatButton: React.FC<Props> = ({ conversationId }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'skills' });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<SkillIndexEntry[]>([]);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState<string | null>(null);

  const loadSkills = () => {
    setLoading(true);
    ipcBridge.skills.list
      .invoke({ type: 'skill' })
      .then((list) => setSkills((list ?? []).filter((s) => s.security?.verdict !== 'blocked')))
      .catch(() => Message.error(t('addToChat.loadFailed', { defaultValue: 'Failed to load skills.' })))
      .finally(() => setLoading(false));
  };

  const handleOpen = () => {
    setOpen(true);
    setQuery('');
    loadSkills();
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return skills.slice(0, 200);
    return skills
      .filter((s) => s.name.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q))
      .slice(0, 200);
  }, [skills, query]);

  const handleAdd = async (name: string) => {
    setAdding(name);
    try {
      const result = await ipcBridge.skills.addToConversation.invoke({ conversationId, name });
      if (result.ok) {
        Message.success(t('addToChat.added', { defaultValue: 'Added - applies on your next message.' }));
        setOpen(false);
      } else {
        Message.error((result as { error?: string }).error ?? 'failed');
      }
    } catch (e) {
      Message.error(e instanceof Error ? e.message : String(e));
    } finally {
      setAdding(null);
    }
  };

  return (
    <>
      <Tooltip content={t('addToChat.tooltip', { defaultValue: 'Add a skill to this chat' })}>
        <span
          className='inline-flex items-center justify-center w-24px h-24px rounded-full bg-2 cursor-pointer'
          data-testid='add-skill-to-chat'
          onClick={handleOpen}
        >
          <Plus size={14} color={iconColors.primary} strokeWidth={2} style={{ lineHeight: 0 }} />
        </span>
      </Tooltip>
      <Modal
        title={t('addToChat.title', { defaultValue: 'Add a skill to this chat' })}
        visible={open}
        onCancel={() => setOpen(false)}
        footer={null}
        unmountOnExit
        style={{ width: 560 }}
      >
        <div className='flex flex-col gap-12px'>
          <Input.Search
            allowClear
            value={query}
            onChange={setQuery}
            placeholder={t('addToChat.searchPlaceholder', { defaultValue: 'Search skills…' })}
          />
          <Spin loading={loading} style={{ display: 'block' }}>
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              <List
                dataSource={filtered}
                noDataElement={
                  <span className='text-12px' style={{ color: 'var(--color-text-3)' }}>
                    {t('addToChat.noSkills', { defaultValue: 'No matching skills.' })}
                  </span>
                }
                render={(skill) => (
                  <List.Item
                    key={skill.name}
                    style={{ borderBottom: '1px solid var(--color-border-1)' }}
                    extra={
                      <Button
                        size='small'
                        type='primary'
                        loading={adding === skill.name}
                        onClick={() => void handleAdd(skill.name)}
                      >
                        {t('addToChat.add', { defaultValue: 'Add' })}
                      </Button>
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
                )}
              />
            </div>
          </Spin>
        </div>
      </Modal>
    </>
  );
};

export default AddSkillToChatButton;
