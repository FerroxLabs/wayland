/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { TChatConversation } from '@/common/config/storage';
import { Input, Spin } from '@arco-design/web-react';
import { MessageSquare, Plus } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getAgentLogo } from '@/renderer/utils/model/agentLogo';

/**
 * A browsable, searchable list of every conversation/session — the AionUI-style
 * "all my chats" surface. Quick-search by title; click to open. Complements the
 * sidebar search popover, which is content-search and transient.
 */
const ConversationsListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [all, setAll] = useState<TChatConversation[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const result = await ipcBridge.database.getUserConversations.invoke({ page: 0, pageSize: 10000 });
      const list = Array.isArray(result) ? result : [];
      // Hide health-checks and team-attached conversations — they aren't user chats.
      const filtered = list.filter((conv) => {
        const extra = conv.extra as { isHealthCheck?: boolean; teamId?: string } | undefined;
        return extra?.isHealthCheck !== true && !extra?.teamId;
      });
      setAll(filtered);
    } catch (err) {
      console.error('[ConversationsListPage] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
    const unsub = ipcBridge.conversation.listChanged.on(() => void fetchAll());
    return () => unsub();
  }, [fetchAll]);

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q ? all.filter((c) => (c.name ?? '').toLowerCase().includes(q)) : all;
    return matched.toSorted((a, b) => (b.modifyTime ?? 0) - (a.modifyTime ?? 0));
  }, [all, query]);

  const formatTime = (ts: number | undefined): string => {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('conversations.time.now', { defaultValue: 'just now' });
    if (mins < 60) return t('conversations.time.minutes', { defaultValue: '{{n}}m ago', n: mins });
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return t('conversations.time.hours', { defaultValue: '{{n}}h ago', n: hours });
    const days = Math.floor(diff / 86400000);
    if (days < 30) return t('conversations.time.days', { defaultValue: '{{n}}d ago', n: days });
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className='flex flex-col h-full w-full overflow-hidden'>
      <div className='flex items-center justify-between px-24px py-20px shrink-0'>
        <div className='flex flex-col gap-2px'>
          <h1 className='text-20px font-700 text-t-primary m-0'>
            {t('conversations.list.title', { defaultValue: 'Conversations' })}
          </h1>
          <span className='text-13px text-t-secondary'>
            {t('conversations.list.subtitle', { defaultValue: 'Every chat and session' })}
          </span>
        </div>
        <button
          type='button'
          className='flex items-center gap-6px h-32px px-12px rd-8px border-none cursor-pointer bg-[rgb(var(--primary-6))] text-white'
          onClick={() => navigate('/guid', { state: { resetAssistant: true } })}
        >
          <Plus size={16} />
          <span className='text-13px'>{t('conversations.list.newButton', { defaultValue: 'New Chat' })}</span>
        </button>
      </div>

      <div className='px-24px pb-12px shrink-0 max-w-[720px] w-full'>
        <Input.Search
          allowClear
          value={query}
          onChange={setQuery}
          placeholder={t('conversations.list.searchPlaceholder', { defaultValue: 'Search by title…' })}
        />
      </div>

      <div className='flex-1 overflow-auto px-24px pb-24px'>
        <Spin loading={loading} style={{ display: 'block' }}>
          {!loading && sorted.length === 0 ? (
            <div className='flex flex-col items-center justify-center gap-12px py-64px text-center'>
              <div className='flex items-center justify-center w-56px h-56px rd-16px bg-fill-1 text-t-tertiary'>
                <MessageSquare size={26} />
              </div>
              <div className='text-15px font-600 text-t-primary'>
                {query
                  ? t('conversations.empty.noResults', { defaultValue: 'No conversations found' })
                  : t('conversations.empty.title', { defaultValue: 'No conversations yet' })}
              </div>
            </div>
          ) : (
            <div className='flex flex-col gap-6px max-w-[720px]'>
              {sorted.map((conv) => {
                const logo = getAgentLogo(conv.type);
                return (
                  <div
                    key={conv.id}
                    data-testid={`session-row-${conv.id}`}
                    className='flex items-center gap-12px px-12px py-10px rd-8px cursor-pointer border border-transparent hover:bg-fill-2 hover:border-[var(--color-border-2)] transition-colors'
                    onClick={() => navigate(`/conversation/${conv.id}`)}
                  >
                    <span className='w-32px h-32px flex items-center justify-center shrink-0 rd-8px bg-fill-1'>
                      {logo ? (
                        <img src={logo} alt='' className='w-18px h-18px rounded-50%' />
                      ) : (
                        <MessageSquare size={16} className='text-t-tertiary' />
                      )}
                    </span>
                    <span className='flex-1 min-w-0 text-14px text-t-primary truncate'>
                      {conv.name || t('conversation.welcome.newConversation', { defaultValue: 'Untitled' })}
                    </span>
                    <span className='text-12px text-t-tertiary shrink-0'>{formatTime(conv.modifyTime)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Spin>
      </div>
    </div>
  );
};

export default ConversationsListPage;
