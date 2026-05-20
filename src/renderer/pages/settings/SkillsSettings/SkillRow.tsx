/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, ShieldAlert, ShieldOff, ShieldQuestion, Star } from 'lucide-react';
import type { SkillIndexEntry, SkillVerdict } from '@/common/types/skillTypes';

type Props = {
  entry: SkillIndexEntry;
  pinned: boolean;
  onTogglePin: (name: string, pinned: boolean) => void;
};

const VERDICT_ICON: Record<SkillVerdict, React.ReactNode> = {
  clean: <Shield size={14} style={{ color: 'var(--success)' }} />,
  review: <ShieldAlert size={14} style={{ color: 'var(--warning)' }} />,
  blocked: <ShieldOff size={14} style={{ color: 'var(--danger)' }} />,
  unscanned: <ShieldQuestion size={14} style={{ color: 'var(--text-tertiary)' }} />,
};

// Static map avoids a dynamic-key t() lookup whose template-literal type
// is too wide for react-i18next's overload signatures. Verdict copy is
// short and verdict count is small, so a static map is the right tool.
const STATUS_LABEL: Record<SkillVerdict, string> = {
  clean: 'Scanned — no red flags found',
  review: 'Needs review',
  blocked: 'Blocked — quarantined',
  unscanned: 'Not yet scanned',
};

const SOURCE_BADGE_CLASS: Record<string, string> = {
  'wayland-library': 'bg-[rgba(var(--primary-6),0.08)] text-primary-6 border-[rgba(var(--primary-6),0.2)]',
  team: 'bg-[rgba(var(--color-team),0.08)] text-[rgb(var(--color-team))] border-[rgba(var(--color-team),0.2)]',
  user: 'bg-[rgba(var(--success-6),0.08)] text-[rgb(var(--success-6))] border-[rgba(var(--success-6),0.2)]',
  imported: 'bg-[rgba(var(--orange-6),0.08)] text-orange-6 border-[rgba(var(--orange-6),0.2)]',
  'cli-discovered':
    'bg-[rgba(var(--primary-6),0.08)] text-primary-6 border-[rgba(var(--primary-6),0.2)]',
};

const SkillRow: React.FC<Props> = ({ entry, pinned, onTogglePin }) => {
  const { t } = useTranslation('skills');
  const verdict = entry.security?.verdict ?? 'unscanned';
  const sourceLabel =
    entry.sourceLabel ?? t(`filters.source.${entry.source}` as Parameters<typeof t>[0], entry.source);
  const badgeClass =
    SOURCE_BADGE_CLASS[entry.source] ?? SOURCE_BADGE_CLASS['wayland-library'];

  const handlePin = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onTogglePin(entry.name, !pinned);
    },
    [entry.name, pinned, onTogglePin]
  );

  return (
    <div
      className='group flex items-center gap-12px px-16px py-10px hover:bg-fill-1 transition-colors'
      style={{ borderBottom: '1px solid var(--border-1)' }}
    >
      {/* Name + source badge */}
      <div className='flex-1 min-w-0 flex items-center gap-8px'>
        <span
          className='text-14px font-medium truncate'
          style={{ color: 'var(--text-primary)' }}
          title={entry.name}
        >
          {entry.name}
        </span>
        <span
          className={`shrink-0 text-10px px-6px py-1px rd-4px border font-medium uppercase ${badgeClass}`}
        >
          {sourceLabel}
        </span>
      </div>

      {/* Description — hidden on small screens */}
      {entry.description && (
        <p
          className='hidden md:block flex-1 min-w-0 text-12px line-clamp-1 m-0'
          style={{ color: 'var(--text-secondary)' }}
          title={entry.description}
        >
          {entry.description}
        </p>
      )}

      {/* Security verdict */}
      <div className='shrink-0 flex items-center' title={STATUS_LABEL[verdict]}>
        {VERDICT_ICON[verdict]}
      </div>

      {/* Pin star */}
      <button
        type='button'
        className='shrink-0 p-4px rd-4px outline-none border-none bg-transparent cursor-pointer transition-colors'
        style={{ color: pinned ? 'var(--brand)' : 'var(--text-tertiary)' }}
        title={pinned ? t('actions.unpin') : t('actions.pin')}
        onClick={handlePin}
      >
        <Star size={14} fill={pinned ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
};

export default SkillRow;
