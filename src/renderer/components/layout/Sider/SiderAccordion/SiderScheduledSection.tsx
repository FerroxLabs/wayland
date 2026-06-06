/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Clock } from 'lucide-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAllCronJobs } from '@renderer/pages/cron/useCronJobs';
import CronJobSiderItem from '@renderer/components/layout/Sider/CronJobSiderSection/CronJobSiderItem';
import { SiderAccordionShell } from './SiderAccordionShell';
import { useSiderAccordionState } from './useSiderAccordionState';

const ROW_CAP = 5;

export interface SiderScheduledSectionProps {
  collapsed: boolean;
  pathname: string;
  onNavigate: (path: string) => void;
}

export const SiderScheduledSection: React.FC<SiderScheduledSectionProps> = ({ collapsed, pathname, onNavigate }) => {
  const { t } = useTranslation();
  const { jobs, activeCount } = useAllCronJobs();
  const { state, toggle } = useSiderAccordionState();

  // Route-aware auto-expand for /scheduled/* OR /conversation/:id where conv has a cron job.
  // ICronJob stores conversationId on metadata, not top-level.
  const conversationId = pathname.startsWith('/conversation/')
    ? (pathname.slice('/conversation/'.length).split('/')[0] ?? null)
    : null;
  const routeOpen =
    pathname.startsWith('/scheduled') ||
    (conversationId !== null && jobs.some((j) => j.metadata.conversationId === conversationId));
  const open = routeOpen || state.scheduled;

  const visibleJobs = useMemo(() => jobs.slice(0, ROW_CAP), [jobs]);
  const overflow = Math.max(0, jobs.length - ROW_CAP);

  // v0.6.2.1 hide-when-empty: TopZone "Scheduled" entry handles discover/create
  // when no enabled tasks exist, so the runtime accordion only earns its row
  // when activeCount > 0. Applies to both collapsed and expanded modes.
  if (activeCount === 0) return null;

  // Collapsed-mode fallback - icon-only nav with dot.
  if (collapsed) {
    return (
      <button
        type='button'
        className='w-full h-40px flex items-center justify-center rd-7px bg-transparent border-none cursor-pointer hover:bg-fill-2 text-text-2 hover:text-text-1 relative'
        onClick={() => onNavigate('/scheduled')}
        aria-label={t('sider.accordion.scheduled')}
        title={t('sider.accordion.scheduled')}
      >
        <Clock size={18} />
        <span className='absolute top-6px right-6px w-6px h-6px rounded-full bg-fill-3' aria-hidden />
      </button>
    );
  }

  return (
    <SiderAccordionShell
      icon={<Clock size={16} />}
      label={t('sider.accordion.scheduled')}
      badgeCount={activeCount}
      isLive={false}
      open={open}
      onToggle={() => toggle('scheduled')}
      testId='sider-scheduled-section'
    >
      {visibleJobs.map((job) => (
        <CronJobSiderItem key={job.id} job={job} pathname={pathname} onNavigate={onNavigate} />
      ))}
      {overflow > 0 ? (
        <div
          className='px-10px py-6px text-10px text-text-3 italic cursor-pointer hover:text-orange'
          onClick={() => onNavigate('/scheduled')}
        >
          {t('sider.accordion.showMore', { count: overflow })}
        </div>
      ) : (
        jobs.length > 0 && (
          <div
            className='px-10px py-6px text-10px text-text-3 italic cursor-pointer hover:text-orange'
            onClick={() => onNavigate('/scheduled')}
          >
            {t('sider.accordion.seeAllScheduled')}
          </div>
        )
      )}
    </SiderAccordionShell>
  );
};
