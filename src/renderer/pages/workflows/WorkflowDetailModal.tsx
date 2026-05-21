/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WorkflowDetailModal — opens when a WorkflowCard is clicked.
 *
 * Surfaces the workflow's name + description + (when present) the SKILL.md
 * body so the user can see exactly what they're about to run. Two CTAs:
 *
 *   - **Launch** — start a new chat with the workflow loaded as the
 *     agent's first directive. Engine picker comes in a follow-up; for
 *     this first cut the button shows a placeholder explaining the wiring
 *     is in flight.
 *   - **Schedule** — opens the existing Create Scheduled Task modal with
 *     this workflow pre-filled. Wired in step #6 of the split — until
 *     that lands the button shows a placeholder pointing at the
 *     Scheduled Tasks sidebar entry.
 */

import { Button, Modal, Spin } from '@arco-design/web-react';
import { Calendar, Rocket, Sparkles } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ipcBridge } from '@/common';
import type { SkillIndexEntry } from '@/common/types/skillTypes';
import { toDisplayName } from '@renderer/pages/settings/SkillsSettings/displayName';

interface WorkflowDetailModalProps {
  entry: SkillIndexEntry | null;
  onClose: () => void;
}

/**
 * Normalize `metadata.depends` into a string array. The vendored index
 * ships it as a space-separated string (`"a b c"`), but the
 * SkillMetadata type also allows the array shape that future user-built
 * workflows would write directly. Handle both without trusting either.
 */
function parseDepends(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((d): d is string => typeof d === 'string' && d.length > 0);
  }
  if (typeof raw === 'string') {
    return raw.split(/\s+/).filter((d) => d.length > 0);
  }
  return [];
}

const WorkflowDetailModal: React.FC<WorkflowDetailModalProps> = ({ entry, onClose }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'workflows' });
  const navigate = useNavigate();
  const [body, setBody] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const depends = useMemo(
    () => parseDepends(entry?.metadata?.depends),
    [entry],
  );

  const handleSkillClick = (slug: string) => {
    onClose();
    void navigate(`/settings/skills?q=${encodeURIComponent(slug)}`);
  };

  useEffect(() => {
    if (!entry) {
      setBody(null);
      return;
    }
    setLoading(true);
    // The Skills bridge already exposes a path-aware loader via the scan
    // endpoint; reusing it would be heavier than needed. For the detail
    // modal we lean on the report-style getter for now — it returns null
    // when no body is on disk, which is a sensible empty state.
    void ipcBridge.skills.getReport
      .invoke({ name: entry.name })
      .then(() => {
        // The report-only endpoint doesn't return the body. Until a body
        // endpoint exists, surface the description and a hint that
        // launch/schedule consume the body server-side.
        setBody(null);
      })
      .finally(() => setLoading(false));
  }, [entry]);

  const handleLaunch = async () => {
    if (!entry) return;
    // Pull the workflow body from the SkillLibrary; fall back to the
    // entry's description if the body file is missing (e.g. a
    // cli-discovered workflow whose source vanished). Then route the
    // user to /guid with the body pre-filled as a pendingPrompt.
    // GuidPage's reset hook reads location.state.pendingPrompt and
    // seeds the textarea with it instead of clearing the field. The
    // user picks engine + send from there — no separate engine picker
    // modal needed for this first cut.
    let prompt: string | null = null;
    try {
      prompt = await ipcBridge.skills.getBody.invoke({ name: entry.name });
    } catch {
      prompt = null;
    }
    const pendingPrompt = prompt && prompt.length > 0 ? prompt : entry.description;
    onClose();
    void navigate('/guid', { state: { pendingPrompt } });
  };

  const handleSchedule = () => {
    if (!entry) return;
    // Route through /scheduled?workflow=<slug>. The Scheduled Tasks page
    // reads the param on mount, opens the Create Task dialog in
    // 'From workflow' mode, and clears the param so refreshes don't
    // re-fire the dialog.
    onClose();
    void navigate(`/scheduled?workflow=${encodeURIComponent(entry.name)}`);
  };

  return (
    <Modal
      visible={entry !== null}
      onCancel={onClose}
      footer={null}
      autoFocus={false}
      style={{ width: 640 }}
      title={entry ? toDisplayName(entry.name) : ''}
    >
      {entry ? (
        <div className='flex flex-col gap-16px'>
          <p
            className='text-13px m-0'
            style={{ color: 'var(--text-secondary)' }}
          >
            {entry.description || t('noDescription', 'No description provided.')}
          </p>

          <div
            className='p-12px rd-8px text-12px'
            style={{
              background: 'var(--color-fill-1)',
              border: '1px solid var(--color-border-1)',
              color: 'var(--text-secondary)',
            }}
          >
            {loading ? (
              <Spin size={16} />
            ) : (
              <>
                <div className='font-semibold mb-4px' style={{ color: 'var(--text-primary)' }}>
                  {t('whatHappens', 'When you launch this')}
                </div>
                {body
                  ? body.slice(0, 600) + (body.length > 600 ? '…' : '')
                  : t(
                      'bodyFallback',
                      'The agent loads this workflow as its first directive and walks you through it step by step. You can interrupt or change direction at any point.',
                    )}
              </>
            )}
          </div>

          {/* Skill dependencies — every vendored workflow declares the
              skills it activates via `metadata.depends`. Surfacing them
              here turns workflows into discoverable entry points to the
              broader skill library (Sean's "connect that shit up"). */}
          {depends.length > 0 ? (
            <div className='flex flex-col gap-6px'>
              <div
                className='text-12px font-semibold flex items-center gap-6px'
                style={{ color: 'var(--text-primary)' }}
              >
                <Sparkles size={12} />
                <span>{t('depends.title', 'Uses these skills')}</span>
                <span style={{ color: 'var(--color-text-3)', fontWeight: 400 }}>
                  · {depends.length}
                </span>
              </div>
              <div className='flex flex-wrap gap-6px'>
                {depends.map((slug) => (
                  <button
                    key={slug}
                    type='button'
                    onClick={() => handleSkillClick(slug)}
                    className='text-12px px-8px py-3px rd-6px cursor-pointer transition-colors'
                    style={{
                      background: 'var(--color-fill-2)',
                      border: '1px solid var(--color-border-1)',
                      color: 'var(--text-secondary)',
                    }}
                    title={t('depends.openSkill', 'Open in Skills page')}
                  >
                    {toDisplayName(slug)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className='flex items-center justify-end gap-12px pt-8px'>
            <Button
              icon={<Calendar size={14} />}
              onClick={handleSchedule}
              style={{ borderRadius: 8 }}
              className='px-16px'
            >
              {t('actions.schedule', 'Schedule')}
            </Button>
            <Button
              type='primary'
              icon={<Rocket size={14} />}
              onClick={handleLaunch}
              className='!rounded-[100px] !h-32px !px-16px'
            >
              {t('actions.launch', 'Launch now')}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default WorkflowDetailModal;
