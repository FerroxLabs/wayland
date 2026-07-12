/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { TChatConversation } from '@/common/config/storage';
import type { IProject } from '@/common/types/project';
import { Button } from '@arco-design/web-react';
import { ArrowRight, Clock3, FileText, MessageSquare } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  buildProjectTimeline,
  filterTimeline,
  HISTORY_FILTERS,
  timelineCounts,
  type HistoryFilter,
  type HistoryKind,
  type ReferenceFile,
} from './projectHistory';
import styles from './projectCards.module.css';

function iconFor(kind: HistoryKind): React.ReactNode {
  if (kind === 'chat') return <MessageSquare size={15} />;
  if (kind === 'inventory') return <FileText size={15} />;
  return <Clock3 size={15} />;
}

/**
 * Project History timeline: the project's own create/update stamps, its chats,
 * and its reference files, folded into one selectable, filterable timeline with
 * a detail pane. References come from the project IPC bridge.
 */
const ProjectHistoryPanel: React.FC<{
  project: IProject;
  conversations: TChatConversation[];
}> = ({ project, conversations }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [references, setReferences] = useState<ReferenceFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const hasWorkspace = Boolean(project.workspace);

  const fmtTime = useCallback(
    (value?: number): string => {
      if (!value) return t('projects.timeline.noTimestamp');
      return new Intl.DateTimeFormat(i18n.language, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(value));
    },
    [i18n.language, t]
  );

  const load = useCallback(async () => {
    if (!hasWorkspace) {
      setReferences([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const refs = await ipcBridge.project.listReference.invoke({ id: project.id });
      setReferences(Array.isArray(refs) ? refs : []);
    } catch (err) {
      // Degrade gracefully — a missing reference folder is not an error state.
      console.warn('[ProjectHistoryPanel] reference load failed:', err);
      setReferences([]);
    } finally {
      setLoading(false);
    }
  }, [hasWorkspace, project.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const input = useMemo(() => ({ project, conversations, references }), [project, conversations, references]);
  const items = useMemo(() => buildProjectTimeline(t, input), [t, input]);
  const visibleItems = useMemo(() => filterTimeline(items, filter), [items, filter]);
  const counts = useMemo(() => timelineCounts(input), [input]);

  useEffect(() => {
    if (visibleItems.length === 0) {
      if (selectedId) setSelectedId(null);
      return;
    }
    if (!selectedId || !visibleItems.some((item) => item.id === selectedId)) {
      setSelectedId(visibleItems[0].id);
    }
  }, [visibleItems, selectedId]);

  const selected = visibleItems.find((item) => item.id === selectedId) ?? visibleItems[0];

  // Rendered from HISTORY_FILTERS so the pills and the "no dead pill" guard can
  // never drift apart: a filter added there shows up here and must have a source.
  const filterCount: Record<HistoryFilter, number> = {
    all: items.length,
    chat: counts.chat,
    reference: counts.reference,
  };
  const filterOptions = HISTORY_FILTERS.map((key) => ({
    key,
    label: t(`projects.timeline.filter.${key}` as 'projects.timeline.filter.all'),
    count: filterCount[key],
  }));

  if (loading) return null;

  return (
    <div className='mx-auto flex max-w-900px flex-col gap-14px'>
      <div className='flex flex-wrap items-start justify-between gap-12px'>
        <div className='flex flex-col gap-2px'>
          <div className='text-15px font-700 text-t-primary'>{t('projects.timeline.title')}</div>
          <div className='text-12px text-t-tertiary leading-relaxed'>{t('projects.timeline.subtitle')}</div>
        </div>
        <div className='flex flex-wrap items-center gap-6px'>
          {filterOptions.map((option) => {
            const active = filter === option.key;
            return (
              <button
                key={option.key}
                type='button'
                className='cursor-pointer border border-solid px-8px py-4px rd-full text-11px transition-colors'
                style={{
                  borderColor: active ? 'rgb(var(--primary-6))' : 'var(--color-border-2)',
                  background: active ? 'var(--color-primary-light-1)' : 'var(--color-fill-1)',
                  color: active ? 'rgb(var(--primary-6))' : 'var(--color-text-3)',
                }}
                onClick={() => setFilter(option.key)}
              >
                {option.label} {option.count}
              </button>
            );
          })}
        </div>
      </div>

      {visibleItems.length > 0 && (
        <div className='grid gap-14px lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]'>
          <div className={`flex flex-col ${styles.surface}`}>
            {visibleItems.map((item, index) => {
              const active = selected?.id === item.id;
              return (
                <button
                  key={item.id}
                  type='button'
                  className='flex w-full cursor-pointer items-start gap-12px border-none bg-transparent px-14px py-12px text-left transition-colors hover:bg-fill-1'
                  style={{
                    borderTop: index === 0 ? undefined : '1px solid var(--color-border-2)',
                    background: active ? 'var(--color-primary-light-1)' : undefined,
                  }}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div
                    className='flex h-32px w-32px shrink-0 items-center justify-center rd-8px'
                    style={{
                      background: active ? 'rgb(var(--primary-6) / 0.14)' : 'var(--color-fill-2)',
                      color: active ? 'rgb(var(--primary-6))' : 'var(--color-text-2)',
                    }}
                  >
                    {iconFor(item.kind)}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='text-10px font-700 uppercase text-t-tertiary'>{item.eyebrow}</div>
                    <div className='mt-1px flex flex-wrap items-center gap-x-8px gap-y-2px'>
                      <span className='text-13px font-600 text-t-primary'>{item.title}</span>
                      <span className='text-11px text-t-tertiary'>{fmtTime(item.time)}</span>
                    </div>
                    {item.meta && <div className='mt-2px truncate text-11px text-t-tertiary'>{item.meta}</div>}
                  </div>
                </button>
              );
            })}
          </div>

          {selected && (
            <aside className={`flex min-h-320px flex-col gap-14px p-16px ${styles.surface}`}>
              <div className='flex items-start gap-12px'>
                <div className='flex h-36px w-36px shrink-0 items-center justify-center rd-9px bg-fill-2 text-t-secondary'>
                  {iconFor(selected.kind)}
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='text-10px font-700 uppercase text-t-tertiary'>{selected.eyebrow}</div>
                  <h2 className='m-0 mt-2px text-16px font-700 leading-22px text-t-primary'>{selected.title}</h2>
                  <div className='mt-3px text-12px text-t-tertiary'>{fmtTime(selected.time)}</div>
                </div>
              </div>

              <div>
                <div className='mb-5px text-12px font-700 text-t-primary'>{t('projects.timeline.summaryHeading')}</div>
                <p className='m-0 text-13px leading-20px text-t-secondary'>{selected.summary}</p>
              </div>

              {selected.related.length > 0 && (
                <div className='flex flex-col gap-7px'>
                  <div className='text-12px font-700 text-t-primary'>{t('projects.timeline.relatedHeading')}</div>
                  {selected.related.map((row) => (
                    <div key={`${row.label}:${row.value}`} className='flex items-start gap-10px text-12px'>
                      <span className='w-96px shrink-0 text-t-tertiary'>{row.label}</span>
                      <span className='min-w-0 flex-1 break-words text-t-secondary'>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {selected.target && (
                <div className='mt-auto flex justify-end'>
                  <Button
                    type='primary'
                    size='small'
                    icon={<ArrowRight size={13} />}
                    onClick={() => navigate(selected.target!)}
                  >
                    {selected.targetLabel}
                  </Button>
                </div>
              )}
            </aside>
          )}
        </div>
      )}

      {visibleItems.length === 0 && (
        <div className='border border-dashed border-2 rd-8px px-14px py-16px text-center text-12px text-t-tertiary'>
          {t('projects.timeline.noMatch')}
        </div>
      )}

      {!hasWorkspace && (
        <div className='border border-dashed border-2 rd-8px px-14px py-12px text-12px text-t-tertiary'>
          {t('projects.timeline.noWorkspaceHint')}
        </div>
      )}

      <div className='flex justify-end'>
        <Button size='small' type='text' onClick={() => void load()}>
          {t('projects.timeline.refresh')}
        </Button>
      </div>
    </div>
  );
};

export default ProjectHistoryPanel;
