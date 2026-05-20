/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Alert, Button, Drawer, Tag, Typography } from '@arco-design/web-react';
import { Star } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { SkillIndexEntry } from '@/common/types/skillTypes';
import { SOURCE_LABEL, STATUS_LABEL, VERDICT_ICON } from './SkillRow';

// TODO: No body preview — would require a new getBody IPC call. Defer to a future task.

type Props = {
  entry: SkillIndexEntry | null;
  open: boolean;
  onClose: () => void;
  onTogglePin: (name: string, pinned: boolean) => void;
};

type MetaRowProps = { label: string; value: React.ReactNode };

const MetaRow: React.FC<MetaRowProps> = ({ label, value }) => (
  <div className='flex gap-8px py-6px' style={{ borderBottom: '1px solid var(--border-1)' }}>
    <Typography.Text
      className='shrink-0 text-12px'
      style={{ color: 'var(--text-tertiary)', width: 90 }}
    >
      {label}
    </Typography.Text>
    <Typography.Text className='text-12px flex-1 min-w-0 break-all' style={{ color: 'var(--text-primary)' }}>
      {value}
    </Typography.Text>
  </div>
);

const SkillDetailDrawer: React.FC<Props> = ({ entry, open, onClose, onTogglePin }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'skills' });

  if (!entry) return null;

  const verdict = entry.security?.verdict ?? 'unscanned';
  const isBlocked = verdict === 'blocked';
  const sourceLabel = entry.sourceLabel ?? SOURCE_LABEL[entry.source] ?? entry.source;
  const findings = entry.security?.findings ?? [];

  return (
    <Drawer
      width={400}
      visible={open}
      onCancel={onClose}
      footer={null}
      title={
        <div className='flex items-center gap-8px min-w-0'>
          <span
            className='text-15px font-semibold truncate'
            style={{ color: 'var(--text-primary)' }}
            title={entry.name}
          >
            {entry.name}
          </span>
          <span
            className='shrink-0 text-10px px-6px py-1px rd-4px border font-medium uppercase'
            style={{
              background: 'rgba(var(--primary-6),0.08)',
              color: 'rgb(var(--primary-6))',
              borderColor: 'rgba(var(--primary-6),0.2)',
            }}
          >
            {sourceLabel}
          </span>
          <span className='shrink-0' title={STATUS_LABEL[verdict]}>
            {VERDICT_ICON[verdict]}
          </span>
        </div>
      }
    >
      <div className='flex flex-col gap-20px'>
        {/* Description */}
        {entry.description && (
          <Typography.Text className='text-13px' style={{ color: 'var(--text-secondary)' }}>
            {entry.description}
          </Typography.Text>
        )}

        {/* Metadata */}
        <div>
          <Typography.Text
            className='block mb-8px text-11px uppercase font-semibold'
            style={{ color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}
          >
            {t('detail.metadata')}
          </Typography.Text>
          <MetaRow label='Source' value={sourceLabel} />
          <MetaRow label='Type' value={entry.type} />
          {entry.metadata.category && (
            <MetaRow label='Category' value={entry.metadata.category} />
          )}
          {entry.metadata.version && (
            <MetaRow label='Version' value={entry.metadata.version} />
          )}
          {entry.metadata.author && (
            <MetaRow label='Author' value={entry.metadata.author} />
          )}
          {entry.metadata.tags.length > 0 && (
            <MetaRow
              label='Tags'
              value={
                <div className='flex flex-wrap gap-4px'>
                  {entry.metadata.tags.map((tag) => (
                    <Tag key={tag} size='small'>
                      {tag}
                    </Tag>
                  ))}
                </div>
              }
            />
          )}
        </div>

        {/* Security */}
        <div>
          <Typography.Text
            className='block mb-8px text-11px uppercase font-semibold'
            style={{ color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}
          >
            Security
          </Typography.Text>
          <div className='flex items-center gap-6px mb-8px'>
            {VERDICT_ICON[verdict]}
            <Typography.Text className='text-12px' style={{ color: 'var(--text-primary)' }}>
              {STATUS_LABEL[verdict]}
            </Typography.Text>
          </div>
          {findings.length > 0 && (
            <div className='flex flex-col gap-6px'>
              {findings.map((f, i) => (
                <div
                  key={i}
                  className='rd-6px p-10px text-12px'
                  style={{ background: 'var(--fill-2)', border: '1px solid var(--border-1)' }}
                >
                  <div className='flex items-center gap-6px mb-4px'>
                    <span
                      className='font-semibold'
                      style={{ color: f.severity === 'critical' ? 'var(--danger)' : f.severity === 'medium' ? 'var(--warning)' : 'var(--text-secondary)' }}
                    >
                      {t(`threats.${f.threat}`)}
                    </span>
                    <span style={{ color: 'var(--text-tertiary)' }}>·</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>{t(`severity.${f.severity}`)}</span>
                  </div>
                  <Typography.Text className='text-11px break-all' style={{ color: 'var(--text-secondary)' }}>
                    {f.evidence}
                  </Typography.Text>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* When Wayland loads this */}
        <div>
          <Typography.Text
            className='block mb-6px text-11px uppercase font-semibold'
            style={{ color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}
          >
            {t('detail.whenLoaded')}
          </Typography.Text>
          <Typography.Text className='text-12px' style={{ color: 'var(--text-secondary)' }}>
            Pinned skills are always injected into every assistant. Unpinned skills are available
            on-demand via <code>wayland_search_skills</code>.
          </Typography.Text>
        </div>

        {/* Quarantine alert or pin button */}
        {isBlocked ? (
          <Alert type='error' content={t('detail.quarantined')} />
        ) : (
          <Button
            type='outline'
            icon={<Star />}
            onClick={() => onTogglePin(entry.name, true)}
            style={{ alignSelf: 'flex-start' }}
          >
            {t('actions.pin')}
          </Button>
        )}
      </div>
    </Drawer>
  );
};

export default SkillDetailDrawer;
