/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import type { SkillStats } from '@/common/adapter/ipcBridge';

type Props = {
  stats: SkillStats | null;
};

// 4-card health row matching .planning/brainstorm/skills-page-mockup.html:
//   1) Skills ready             - total + load-on-demand subtitle
//   2) Pinned always-on         - count + per-conversation subtitle
//   3) Sources, unified         - count + source-badge row
//   4) Skill Guard (gradient)   - verified count + flagged / blocked / review
//
// The fourth card carries a soft amber border/background and a shield icon to
// signal that Skill Guard is a real subsystem, not just a stat.
const LibraryHealth: React.FC<Props> = ({ stats }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'skills' });

  const total = stats?.total ?? 0;
  const pinned = stats?.pinned ?? 0;
  const flagged = stats?.flagged ?? 0;
  const verified = stats?.verified ?? 0;
  const bySource: Record<string, number> = stats?.bySource ?? {};
  const sourceCount = Object.keys(bySource).length;

  // Skill Guard headline + breakdown
  const guardClean = verified === 0 && flagged === 0;

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-12px'>
      {/* 1. Skills ready */}
      <div
        className='rd-12px p-15px'
        style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border-2)' }}
      >
        <div
          className='text-24px font-bold leading-none'
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          {total.toLocaleString()}
        </div>
        <div
          className='text-12px mt-7px'
          style={{ color: 'var(--text-primary)', fontWeight: 550 }}
        >
          {t('stats.total', 'Skills ready')}
        </div>
        <div className='text-11px mt-3px' style={{ color: 'var(--color-text-3)' }}>
          {t('stats.totalSubtitle', 'Loaded on demand by every task')}
        </div>
      </div>

      {/* 2. Pinned always-on */}
      <div
        className='rd-12px p-15px'
        style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border-2)' }}
      >
        <div
          className='text-24px font-bold leading-none'
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          {pinned}
        </div>
        <div
          className='text-12px mt-7px'
          style={{ color: 'var(--text-primary)', fontWeight: 550 }}
        >
          {t('stats.pinned', 'Pinned always-on')}
        </div>
        <div className='text-11px mt-3px' style={{ color: 'var(--color-text-3)' }}>
          {t('stats.pinnedSubtitle', 'Loaded every conversation')}
        </div>
      </div>

      {/* 3. Sources, unified */}
      <div
        className='rd-12px p-15px'
        style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border-2)' }}
      >
        <div
          className='text-24px font-bold leading-none'
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          {sourceCount}
        </div>
        <div
          className='text-12px mt-7px'
          style={{ color: 'var(--text-primary)', fontWeight: 550 }}
        >
          {t('stats.sources', 'Sources, unified')}
        </div>
        <div className='flex gap-4px mt-6px flex-wrap'>
          {Object.keys(bySource).slice(0, 4).map((src) => (
            <span
              key={src}
              className='text-10px px-6px py-1px rd-4px border font-medium'
              style={{
                background: 'rgba(var(--primary-6),0.08)',
                color: 'rgb(var(--primary-6))',
                borderColor: 'rgba(var(--primary-6),0.2)',
                textTransform: 'capitalize',
              }}
              title={`${bySource[src]} skills from ${src}`}
            >
              {src.replace('-', ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* 4. Skill Guard - gradient amber card */}
      <div
        className='rd-12px p-15px'
        style={{
          background: guardClean
            ? 'linear-gradient(180deg, rgba(70,196,106,0.12), transparent)'
            : 'linear-gradient(180deg, rgba(233,164,14,0.12), transparent)',
          border: `1px solid ${guardClean ? 'rgba(70,196,106,0.32)' : 'rgba(233,164,14,0.34)'}`,
        }}
      >
        <div className='flex items-center gap-8px mb-6px'>
          {guardClean ? (
            <ShieldCheck size={20} style={{ color: 'var(--success, #46c46a)' }} />
          ) : (
            <ShieldAlert size={20} style={{ color: 'var(--warning, #e9a40e)' }} />
          )}
          <div
            className='text-14px'
            style={{ color: 'var(--text-primary)', fontWeight: 600 }}
          >
            {t('stats.guard', 'Skill Guard')}
          </div>
        </div>
        <div
          className='text-21px font-bold leading-none'
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          {verified.toLocaleString()}
        </div>
        <div className='text-11px mt-3px' style={{ color: 'var(--color-text-3)' }}>
          {t('stats.guardSubtitle', 'verified safe')}
          {flagged > 0 ? (
            <>
              {' · '}
              <span style={{ color: 'var(--warning, #e9a40e)' }}>
                {flagged} {t('stats.guardFlagged', 'flagged')}
              </span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default LibraryHealth;
