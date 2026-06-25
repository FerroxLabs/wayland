/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Alert, Button, Drawer, Input, Message, Spin, Tag, Typography } from '@arco-design/web-react';
import { Pencil, Star } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SkillIndexEntry } from '@/common/types/skillTypes';
import { ipcBridge } from '@/common';
import { SOURCE_LABEL, STATUS_LABEL, VERDICT_ICON } from './SkillRow';

type Props = {
  entry: SkillIndexEntry | null;
  open: boolean;
  onClose: () => void;
  onTogglePin: (name: string, pinned: boolean) => void;
  /** Whether this skill is currently installed for all chats (pinned/always-on). */
  pinned: boolean;
};

type MetaRowProps = { label: string; value: React.ReactNode };

const MetaRow: React.FC<MetaRowProps> = ({ label, value }) => (
  <div className='flex gap-8px py-6px' style={{ borderBottom: '1px solid var(--color-border-1)' }}>
    <Typography.Text className='shrink-0 text-12px' style={{ color: 'var(--color-text-3)', width: 90 }}>
      {label}
    </Typography.Text>
    <Typography.Text className='text-12px flex-1 min-w-0 break-all' style={{ color: 'var(--text-primary)' }}>
      {value}
    </Typography.Text>
  </div>
);

const SkillDetailDrawer: React.FC<Props> = ({ entry, open, onClose, onTogglePin, pinned }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'skills' });

  // Load the skill's markdown body so the user can actually read what the skill
  // does. The getBody IPC already existed; the drawer just never called it.
  const [body, setBody] = useState<string | null>(null);
  const [bodyLoading, setBodyLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const entryName = entry?.name ?? null;
  // Only user-authored / imported skills live in a writable path.
  const editable = entry?.source === 'user' || entry?.source === 'imported';
  useEffect(() => {
    setEditing(false);
    if (!entryName || !open) {
      setBody(null);
      return;
    }
    let cancelled = false;
    setBodyLoading(true);
    ipcBridge.skills.getBody
      .invoke({ name: entryName })
      .then((b: string | null) => {
        if (!cancelled) setBody(b);
      })
      .catch(() => {
        if (!cancelled) setBody(null);
      })
      .finally(() => {
        if (!cancelled) setBodyLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entryName, open]);

  const handleStartEdit = () => {
    setDraft(body ?? '');
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!entryName) return;
    setSaving(true);
    try {
      const result = await ipcBridge.skills.updateBody.invoke({ name: entryName, body: draft });
      if (result.ok) {
        setBody(draft);
        setEditing(false);
        Message.success(t('detail.saved', { defaultValue: 'Skill saved.' }));
      } else {
        const error = (result as { error?: string }).error ?? 'unknown';
        const reason =
          error === 'blocked'
            ? t('detail.saveBlocked', { defaultValue: 'Rejected by the security scanner - the content looks unsafe.' })
            : error === 'read-only'
              ? t('detail.saveReadOnly', { defaultValue: 'This skill is built-in and cannot be edited.' })
              : error;
        Message.error(reason);
      }
    } catch (e) {
      Message.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

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
            style={{ color: 'var(--color-text-3)', letterSpacing: '0.06em' }}
          >
            {t('detail.metadata')}
          </Typography.Text>
          <MetaRow label='Source' value={sourceLabel} />
          <MetaRow label='Type' value={entry.type} />
          {entry.metadata.category && <MetaRow label='Category' value={entry.metadata.category} />}
          {entry.metadata.version && <MetaRow label='Version' value={entry.metadata.version} />}
          {entry.metadata.author && <MetaRow label='Author' value={entry.metadata.author} />}
          {Array.isArray(entry.metadata.tags) && entry.metadata.tags.length > 0 && (
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
            style={{ color: 'var(--color-text-3)', letterSpacing: '0.06em' }}
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
                  style={{ background: 'var(--color-fill-2)', border: '1px solid var(--color-border-1)' }}
                >
                  <div className='flex items-center gap-6px mb-4px'>
                    <span
                      className='font-semibold'
                      style={{
                        color:
                          f.severity === 'critical'
                            ? 'var(--danger)'
                            : f.severity === 'medium'
                              ? 'var(--warning)'
                              : 'var(--text-secondary)',
                      }}
                    >
                      {t(`threats.${f.threat}`)}
                    </span>
                    <span style={{ color: 'var(--color-text-3)' }}>·</span>
                    <span style={{ color: 'var(--color-text-3)' }}>{t(`severity.${f.severity}`)}</span>
                  </div>
                  <Typography.Text className='text-11px break-all' style={{ color: 'var(--text-secondary)' }}>
                    {f.evidence}
                  </Typography.Text>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skill content (SKILL.md body) */}
        <div>
          <div className='flex items-center justify-between mb-8px'>
            <Typography.Text
              className='text-11px uppercase font-semibold'
              style={{ color: 'var(--color-text-3)', letterSpacing: '0.06em' }}
            >
              {t('detail.content', { defaultValue: 'Skill content' })}
            </Typography.Text>
            {editable && !editing && !bodyLoading && (
              <Button type='text' size='mini' icon={<Pencil size={13} />} onClick={handleStartEdit}>
                {t('detail.edit', { defaultValue: 'Edit' })}
              </Button>
            )}
          </div>
          {bodyLoading ? (
            <div className='flex items-center justify-center py-20px'>
              <Spin />
            </div>
          ) : editing ? (
            <div className='flex flex-col gap-8px'>
              <Input.TextArea
                value={draft}
                onChange={setDraft}
                autoSize={{ minRows: 10, maxRows: 22 }}
                style={{ fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)', fontSize: 12 }}
              />
              <div className='flex gap-8px justify-end'>
                <Button size='small' onClick={() => setEditing(false)} disabled={saving}>
                  {t('detail.cancel', { defaultValue: 'Cancel' })}
                </Button>
                <Button size='small' type='primary' loading={saving} onClick={handleSaveEdit}>
                  {t('detail.save', { defaultValue: 'Save' })}
                </Button>
              </div>
            </div>
          ) : body ? (
            <pre
              className='text-12px rd-6px p-12px m-0 overflow-auto'
              style={{
                background: 'var(--color-fill-1)',
                border: '1px solid var(--color-border-1)',
                color: 'var(--text-secondary)',
                maxHeight: 360,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
              }}
            >
              {body}
            </pre>
          ) : (
            <Typography.Text className='text-12px' style={{ color: 'var(--color-text-3)' }}>
              {t('detail.noContent', { defaultValue: 'No readable content for this skill.' })}
            </Typography.Text>
          )}
        </div>

        {/* Install / availability */}
        <div>
          <Typography.Text
            className='block mb-6px text-11px uppercase font-semibold'
            style={{ color: 'var(--color-text-3)', letterSpacing: '0.06em' }}
          >
            {t('detail.installation', { defaultValue: 'Availability' })}
          </Typography.Text>
          <Typography.Text className='text-12px' style={{ color: 'var(--text-secondary)' }}>
            {t('detail.installExplain', {
              defaultValue:
                'Installed skills are loaded into every chat. Skills that are not installed are still found on-demand - relevant ones are surfaced automatically each turn, or via wayland_search_skills.',
            })}
          </Typography.Text>
        </div>

        {/* Quarantine alert or install-for-all-chats toggle */}
        {isBlocked ? (
          <Alert type='error' content={t('detail.quarantined')} />
        ) : (
          <Button
            type={pinned ? 'primary' : 'outline'}
            icon={<Star size={15} fill={pinned ? 'currentColor' : 'none'} />}
            onClick={() => onTogglePin(entry.name, !pinned)}
            style={{ alignSelf: 'flex-start' }}
          >
            {pinned
              ? t('actions.installedForAll', { defaultValue: 'Installed for all chats' })
              : t('actions.installForAll', { defaultValue: 'Install for all chats' })}
          </Button>
        )}
      </div>
    </Drawer>
  );
};

export default SkillDetailDrawer;
