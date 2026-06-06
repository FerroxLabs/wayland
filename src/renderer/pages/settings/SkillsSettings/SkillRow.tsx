/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MoreHorizontal,
  Shield,
  ShieldAlert,
  ShieldOff,
  ShieldQuestion,
  Star,
} from 'lucide-react';
import type { SkillIndexEntry, SkillSource, SkillVerdict } from '@/common/types/skillTypes';
import { toDisplayName } from './displayName';

type Props = {
  entry: SkillIndexEntry;
  pinned: boolean;
  onTogglePin: (name: string, pinned: boolean) => void;
  onClick?: (entry: SkillIndexEntry) => void;
};

// Shield icon + colour per verdict, used by both this row and the detail drawer.
export const VERDICT_ICON: Record<SkillVerdict, React.ReactNode> = {
  clean: <Shield size={16} style={{ color: 'var(--success, #46c46a)' }} />,
  review: <ShieldAlert size={16} style={{ color: 'var(--warning, #e9a40e)' }} />,
  blocked: <ShieldOff size={16} style={{ color: 'var(--danger, #f05e42)' }} />,
  unscanned: <ShieldQuestion size={16} style={{ color: 'var(--color-text-3)' }} />,
};

// Friendly source labels - also consumed by the detail drawer.
export const SOURCE_LABEL: Record<SkillSource, string> = {
  'wayland-library': 'Wayland library',
  team: 'Team',
  user: 'My skills',
  imported: 'Imported',
  'cli-discovered': 'From your CLIs',
};

export const STATUS_LABEL: Record<SkillVerdict, string> = {
  clean: 'Scanned - no red flags found',
  review: 'Needs review',
  blocked: 'Blocked - quarantined',
  unscanned: 'Not yet scanned',
};

// Per-source pill colour. Matches the mockup's b-wayland / b-team / b-import /
// b-you styles (orange for Wayland brand, blue for Team, green for user, amber
// for imported). Falls back to the wayland-library pill for unknown sources.
const SOURCE_BADGE_STYLE: Record<SkillSource, React.CSSProperties> = {
  'wayland-library': {
    background: 'rgba(255,107,53,0.13)',
    color: 'rgb(255,107,53)',
    borderColor: 'rgba(255,107,53,0.34)',
  },
  team: {
    background: 'rgba(110,140,200,0.13)',
    color: 'rgb(140,170,230)',
    borderColor: 'rgba(110,140,200,0.34)',
  },
  user: {
    background: 'rgba(70,196,106,0.13)',
    color: 'rgb(70,196,106)',
    borderColor: 'rgba(70,196,106,0.32)',
  },
  imported: {
    background: 'rgba(233,164,14,0.13)',
    color: 'rgb(233,164,14)',
    borderColor: 'rgba(233,164,14,0.34)',
  },
  'cli-discovered': {
    background: 'rgba(111,200,220,0.13)',
    color: 'rgb(111,200,220)',
    borderColor: 'rgba(111,200,220,0.34)',
  },
};

const SkillRow: React.FC<Props> = ({ entry, pinned, onTogglePin, onClick }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'skills' });
  const verdict = entry.security?.verdict ?? 'unscanned';
  const sourceLabel = entry.sourceLabel ?? SOURCE_LABEL[entry.source] ?? entry.source;
  const badgeStyle = SOURCE_BADGE_STYLE[entry.source] ?? SOURCE_BADGE_STYLE['wayland-library'];
  const isBlocked = verdict === 'blocked';
  const isReview = verdict === 'review';
  const showStatusPill = isBlocked || isReview;

  const handlePin = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onTogglePin(entry.name, !pinned);
    },
    [entry.name, pinned, onTogglePin]
  );

  const stopProp = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

  return (
    <div
      className='group flex items-start gap-12px px-16px py-12px hover:bg-fill-1 transition-colors cursor-pointer'
      style={{ borderBottom: '1px solid var(--color-border-1)' }}
      onClick={() => onClick?.(entry)}
    >
      {/* Shield square - colour signals verdict at a glance. */}
      <div
        className='shrink-0 mt-2px flex items-center justify-center rd-8px'
        style={{
          width: 32,
          height: 32,
          background:
            verdict === 'blocked'
              ? 'rgba(240,94,66,0.13)'
              : verdict === 'review'
                ? 'rgba(233,164,14,0.13)'
                : verdict === 'clean'
                  ? 'rgba(70,196,106,0.13)'
                  : 'var(--color-fill-2)',
        }}
        title={STATUS_LABEL[verdict]}
      >
        {VERDICT_ICON[verdict]}
      </div>

      {/* Body - name + badges row, description, category tag */}
      <div className='flex-1 min-w-0 flex flex-col gap-4px'>
        <div className='flex items-center gap-8px flex-wrap'>
          <span
            className='text-13px font-semibold truncate'
            style={{ color: 'var(--text-primary)', maxWidth: 360 }}
            title={entry.name}
          >
            {toDisplayName(entry.name)}
          </span>
          <span
            className='shrink-0 text-10px px-7px py-1px rd-4px border font-medium uppercase'
            style={{ letterSpacing: '0.04em', ...badgeStyle }}
          >
            {sourceLabel}
          </span>
          {showStatusPill ? (
            <span
              className='shrink-0 text-10px px-7px py-1px rd-4px border font-medium uppercase'
              style={{
                letterSpacing: '0.04em',
                ...(isBlocked
                  ? {
                      background: 'rgba(240,94,66,0.13)',
                      color: 'rgb(240,94,66)',
                      borderColor: 'rgba(240,94,66,0.36)',
                    }
                  : {
                      background: 'rgba(233,164,14,0.13)',
                      color: 'rgb(233,164,14)',
                      borderColor: 'rgba(233,164,14,0.34)',
                    }),
              }}
            >
              {isBlocked
                ? t('filters.verdict.blocked', 'Blocked')
                : t('filters.verdict.review', 'Review')}
            </span>
          ) : null}
        </div>

        {entry.description ? (
          <p
            className='text-12px m-0'
            style={{
              color: isBlocked ? 'var(--danger, #f05e42)' : 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={entry.description}
          >
            {entry.description}
          </p>
        ) : null}

        {entry.metadata.category ? (
          <div
            className='text-10px uppercase font-medium'
            style={{ color: 'var(--color-text-3)', letterSpacing: '0.06em' }}
          >
            {toDisplayName(entry.metadata.category)}
          </div>
        ) : null}
      </div>

      {/* Right side - pin star + more menu */}
      <div className='shrink-0 flex items-center gap-4px' onClick={stopProp}>
        <button
          type='button'
          className='p-6px rd-6px outline-none border-none bg-transparent cursor-pointer transition-colors hover:bg-fill-2'
          style={{ color: pinned ? 'var(--brand)' : 'var(--color-text-3)' }}
          title={pinned ? t('actions.unpin', 'Unpin') : t('actions.pin', 'Pin')}
          onClick={handlePin}
        >
          <Star size={16} fill={pinned ? 'currentColor' : 'none'} />
        </button>
        <button
          type='button'
          className='p-6px rd-6px outline-none border-none bg-transparent cursor-pointer transition-colors hover:bg-fill-2'
          style={{ color: 'var(--color-text-3)' }}
          title='More'
          onClick={stopProp}
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  );
};

export default SkillRow;
