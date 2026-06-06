/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Button } from '@arco-design/web-react';
import { Check, ChevronDown, ChevronUp, Pause, Play, Trash2, Workflow, X } from 'lucide-react';

import AssistantIconTile from '@/renderer/pages/guid/components/AssistantIconTile';
import { resolveWorkflowPalette } from '@/renderer/pages/guid/components/workflow/workflowPalette';
import type { WorkflowSession } from '@/common/types/workflowTypes';

import styles from './WorkflowHeader.module.css';

/**
 * Chrome that sits above the chat tape when a workflow session is active.
 * Renders the workflow icon + title + meta line + pause/end controls, plus
 * a collapsible row of skill chips. Tints amber on error and collapses to
 * a single-line summary when the session completes.
 *
 * Source of truth: SPEC §5.2 + §14 (cuts).
 */

export type WorkflowHeaderProps = {
  session: WorkflowSession;
  paused: boolean;
  onPauseToggle: () => void;
  onEnd: () => void;
  onDelete: () => void;
};

const WORKFLOW_PALETTE_TO_TILE_KEY: Record<
  string,
  'cowork' | 'write' | 'sales' | 'launch' | 'research' | 'finance' | 'dev'
> = {
  'business-ops': 'cowork',
  violet: 'write',
  emerald: 'dev',
  rose: 'launch',
  blue: 'research',
  amber: 'finance',
  slate: 'cowork',
  orange: 'cowork',
};

const formatElapsed = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) {
    return seconds === 0 ? `${minutes} min` : `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return `${hours}h ${remMin}m`;
};

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const WorkflowHeader: React.FC<WorkflowHeaderProps> = ({ session, paused, onPauseToggle, onEnd, onDelete }) => {
  const [skillsOpen, setSkillsOpen] = useState(false);

  const tileKey = useMemo(() => {
    const palette = resolveWorkflowPalette(session.category);
    return WORKFLOW_PALETTE_TO_TILE_KEY[palette] ?? 'cowork';
  }, [session.category]);

  // Completed state - single-line summary collapses everything.
  if (session.status === 'complete') {
    const endedAt = session.completed_at ?? session.updated_at;
    const duration = formatDuration(endedAt - session.created_at);
    return (
      <div className={`${styles.root} ${styles.complete}`} data-testid='workflow-header' data-status='complete'>
        <div className={styles.completeRow}>
          <span className={styles.completeIcon} aria-hidden='true'>
            <Check size={16} />
          </span>
          <span>Completed in {duration}</span>
        </div>
      </div>
    );
  }

  const elapsedMs = Date.now() - session.created_at;
  const isErrored = session.status === 'errored';
  const rootClass = `${styles.root}${isErrored ? ` ${styles.errored}` : ''}`;
  const pauseLabel = paused ? 'Resume auto-advance' : 'Pause auto-advance';
  const PauseIcon = paused ? Play : Pause;

  return (
    <div className={rootClass} data-testid='workflow-header' data-status={session.status}>
      <div className={styles.row}>
        <AssistantIconTile paletteKey={tileKey} size='md'>
          <Workflow />
        </AssistantIconTile>
        <div className={styles.titleZone}>
          <div className={styles.title}>{session.workflow_title}</div>
          <div className={styles.meta}>
            <span className={styles.live}>
              <span className={styles.liveDot} aria-hidden='true' />
              Agent driving
            </span>
            <span className={styles.metaSep}>·</span>
            <span>
              Step {session.current_step} of {session.total_steps}
            </span>
            <span className={styles.metaSep}>·</span>
            <span>{formatElapsed(elapsedMs)}</span>
          </div>
        </div>
        <div className={styles.ctrl}>
          <Button
            size='small'
            type='secondary'
            icon={<PauseIcon size={12} />}
            onClick={onPauseToggle}
            aria-label={pauseLabel}
          >
            {pauseLabel}
          </Button>
          <Button
            size='small'
            type='secondary'
            status='danger'
            icon={<X size={12} />}
            onClick={onEnd}
            aria-label='End workflow'
          >
            End workflow
          </Button>
          <Button
            size='small'
            type='secondary'
            status='danger'
            icon={<Trash2 size={12} />}
            onClick={onDelete}
            aria-label='Delete workflow'
          >
            Delete
          </Button>
        </div>
      </div>

      {session.skills.length > 0 && (
        <>
          <button
            type='button'
            className={styles.skillsToggle}
            onClick={() => setSkillsOpen((v) => !v)}
            data-testid='workflow-header-skills-toggle'
            aria-expanded={skillsOpen}
          >
            {skillsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {session.skills.length} {session.skills.length === 1 ? 'skill' : 'skills'}
          </button>
          {skillsOpen && (
            <div className={styles.skillsRow} data-testid='workflow-header-skills-row'>
              {session.skills.map((skill) => (
                <span key={skill.slug} className={styles.skillChip}>
                  {skill.display_name}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WorkflowHeader;
