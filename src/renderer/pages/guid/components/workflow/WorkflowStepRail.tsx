/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WorkflowStepRail - W3.C of the Workflow Launch Surface (SPEC §5.3 + §11).
 *
 * Right-rail surface (~280px) for an active workflow session. Renders one
 * row per step with a status bullet, title, sub-line, and an inline
 * ▶ Run autonomously control (only on `todo` / `now`). Clicking a row
 * jumps the workflow to that step; clicking the run pill opens an Arco
 * confirmation modal before dispatching a sub-agent (SPEC §11 flow).
 *
 * Composition: the parent (WorkflowSurface, W3.J) injects a bottom slot
 * (`WorkflowStatusBar`) via the `children` prop. This component is fully
 * presentational - state mutations are routed through the two callbacks
 * so the parent owns the IPC layer.
 */

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Circle, CircleDot, Edit2, HelpCircle, Loader2, MinusCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { StepState, WorkflowRunMode, WorkflowSession } from '@/common/types/workflowTypes';
import styles from './WorkflowStepRail.module.css';

export type WorkflowStepRailProps = {
  session: WorkflowSession;
  /** Click on a step row → jump to that step. */
  onJumpToStep: (n: number) => void;
  /** True when the run is waiting on the user - the live step shows a blue "?" not a spinner. */
  needsInput?: boolean;
  /** Bottom slot - `WorkflowStatusBar` is composed in by the parent (W3.J) via children prop. */
  children?: React.ReactNode;
};

type BulletStatus = StepState['status'] | 'review' | 'ask';

type BulletProps = { status: BulletStatus };

const Bullet: React.FC<BulletProps> = ({ status }) => {
  const iconSize = 14;
  switch (status) {
    case 'done':
      return <CheckCircle2 size={iconSize} aria-hidden='true' />;
    case 'now':
      return <CircleDot size={iconSize} aria-hidden='true' />;
    case 'review':
      return <Edit2 size={iconSize} aria-hidden='true' />;
    case 'ask':
      return <HelpCircle size={iconSize} aria-hidden='true' />;
    case 'errored':
      return <AlertCircle size={iconSize} aria-hidden='true' />;
    case 'skipped':
      return <MinusCircle size={iconSize} aria-hidden='true' />;
    case 'todo':
    default:
      return <Circle size={iconSize} aria-hidden='true' />;
  }
};

/** Show elapsed wall time since `started_at` for a running step / autonomous run. */
const useElapsedSeconds = (startedAtMs: number | null): number => {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (startedAtMs == null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAtMs]);
  if (startedAtMs == null) return 0;
  return Math.max(0, Math.floor((now - startedAtMs) / 1000));
};

const formatMmSs = (totalSeconds: number): string => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatEtaMinutes = (etaSeconds: number): string => {
  const minutes = Math.max(1, Math.round(etaSeconds / 60));
  return `~${minutes}m`;
};

/** Sub-line copy is purely a function of step status, not autonomous_run. */
const computeSubLine = (
  step: StepState,
  t: (k: string, opts: { defaultValue: string } & Record<string, unknown>) => string
): string | null => {
  if (step.status === 'done' && step.started_at != null && step.completed_at != null) {
    const elapsed = Math.max(0, Math.floor((step.completed_at - step.started_at) / 1000));
    return formatMmSs(elapsed);
  }
  if (step.status === 'now') {
    return t('workflow.rail.inProgress', { defaultValue: 'in progress' });
  }
  if (step.status === 'errored') {
    return t('workflow.rail.errored', { defaultValue: 'needs attention' });
  }
  if (step.status === 'skipped') {
    return t('workflow.rail.skipped', { defaultValue: 'skipped' });
  }
  if (step.status === 'todo' && step.eta_seconds != null && step.eta_seconds > 0) {
    return formatEtaMinutes(step.eta_seconds);
  }
  return null;
};

type StepRowProps = {
  step: StepState;
  /** True when this is the workflow's current step (session.current_step). */
  isCurrent: boolean;
  /** The session run_mode - used to determine review/ask bullet state. */
  runMode: WorkflowRunMode;
  /** True when the run is waiting on the user (current step shows a blue "?"). */
  needsInput: boolean;
  onJump: (n: number) => void;
};

const StepRow: React.FC<StepRowProps> = ({ step, isCurrent, runMode, needsInput, onJump }) => {
  const { t } = useTranslation();
  const autonomousRunning = step.autonomous_run?.state === 'running';
  // The live step: the workflow's current step while it's still todo/now. The
  // step's own status often lags behind current_step (transitions aren't always
  // emitted), so current_step is the reliable signal for "which step is live".
  const isActiveStep = isCurrent && (step.status === 'todo' || step.status === 'now');
  const runningElapsedSec = useElapsedSeconds(autonomousRunning ? step.autonomous_run!.started_at : null);
  const sub = computeSubLine(step, t);

  // Derive display status: review/ask overlay the standard status for the current step.
  // The current step's own status often lags at 'todo' (the 'now' transition is
  // not always emitted), so treat the current step as live while the run is
  // actively running - that's what makes the rail show real progress.
  const displayStatus: BulletStatus = (() => {
    // Waiting on the user wins: the live step reads as a question, not work.
    if (isCurrent && needsInput) return 'ask';
    if (isCurrent && runMode === 'awaiting_input') return 'review';
    if (autonomousRunning) return 'now';
    if (isCurrent && runMode === 'running' && (step.status === 'todo' || step.status === 'now')) return 'now';
    return step.status;
  })();
  const showSpinner = (autonomousRunning || displayStatus === 'now') && displayStatus !== 'ask';

  const handleRowClick = () => {
    onJump(step.n);
  };

  return (
    <button
      type='button'
      onClick={handleRowClick}
      data-testid='workflow-step-rail-row'
      data-step={step.n}
      data-status={step.status}
      data-running={autonomousRunning ? 'true' : undefined}
      data-active={isActiveStep ? 'true' : undefined}
      data-needsinput={isCurrent && needsInput ? 'true' : undefined}
      className={styles.row}
      aria-label={t('workflow.rail.jumpToStep', {
        defaultValue: 'Jump to step {{n}}: {{title}}',
        n: step.n,
        title: step.title,
      })}
    >
      <span className={styles.bullet} data-status={displayStatus} aria-hidden='true'>
        {showSpinner ? (
          <Loader2 size={14} className={styles.spinner} aria-hidden='true' />
        ) : displayStatus === 'todo' ? (
          <span className={styles.numBullet}>{step.n}</span>
        ) : (
          <Bullet status={displayStatus} />
        )}
      </span>
      <span className='flex-1 min-w-0 flex flex-col'>
        {autonomousRunning ? (
          <span className={styles.runningLabel} data-testid='workflow-step-rail-running-label'>
            {t('workflow.rail.runningLabel', {
              defaultValue: 'Running... ({{elapsed}})',
              elapsed: formatMmSs(runningElapsedSec),
            })}
          </span>
        ) : (
          <span
            className={styles.title}
            data-emphasis={step.status === 'now' ? 'now' : undefined}
            data-muted={step.status === 'skipped' ? 'true' : undefined}
          >
            {step.title}
          </span>
        )}
        {!autonomousRunning && sub && <span className={styles.sub}>{sub}</span>}
      </span>
    </button>
  );
};

export const WorkflowStepRail: React.FC<WorkflowStepRailProps> = ({
  session,
  onJumpToStep,
  needsInput = false,
  children,
}) => {
  const { t } = useTranslation();

  const handleRowJump = (n: number) => {
    onJumpToStep(n);
  };

  return (
    <aside
      data-testid='workflow-step-rail'
      // Build #116: fluid width so the rail fills (and tracks the resize handle of)
      // whatever container it lands in - the tabbed sider's Steps tab (portal) or the
      // legacy 280px inline column. The left border comes from that container (the
      // sider / the .right wrapper), so the rail no longer draws its own.
      className={`${styles.rail} w-full min-w-0 box-border h-full flex flex-col overflow-y-auto bg-[color:var(--color-bg-2)] p-16px gap-6px`}
    >
      <div className={styles.titleStrip} data-testid='workflow-step-rail-title'>
        <span className={styles.modeDot} aria-hidden='true' />
        <span>{t('workflow.rail.title', { defaultValue: 'Steps' })}</span>
      </div>

      <div className='flex flex-col gap-2px'>
        {session.steps.map((step) => (
          <StepRow
            key={step.n}
            step={step}
            isCurrent={step.n === session.current_step}
            runMode={session.run_mode}
            needsInput={needsInput}
            onJump={handleRowJump}
          />
        ))}
      </div>

      {/* Bottom slot - WorkflowStatusBar is composed by the parent. */}
      <div className='mt-auto pt-12px' data-testid='workflow-step-rail-bottom-slot'>
        {children}
      </div>
    </aside>
  );
};

export default WorkflowStepRail;
