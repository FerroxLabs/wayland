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

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Modal } from '@arco-design/web-react';
import { AlertCircle, CheckCircle2, Circle, CircleDot, Loader2, MinusCircle, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { StepState, WorkflowSession } from '@/common/types/workflowTypes';
import styles from './WorkflowStepRail.module.css';

export type WorkflowStepRailProps = {
  session: WorkflowSession;
  /** Whether auto-advance compliance dropped - title flips to "manual" + amber dot. */
  mode?: 'auto' | 'manual';
  /** Click on a step row → jump to that step. */
  onJumpToStep: (n: number) => void;
  /** Click on autonomous run pill → dispatch sub-agent (after confirmation). */
  onRunAutonomously: (n: number) => void;
  /** Bottom slot - `WorkflowStatusBar` is composed in by the parent (W3.J) via children prop. */
  children?: React.ReactNode;
};

type BulletProps = { status: StepState['status'] };

const Bullet: React.FC<BulletProps> = ({ status }) => {
  const iconSize = 14;
  switch (status) {
    case 'done':
      return <CheckCircle2 size={iconSize} aria-hidden='true' />;
    case 'now':
      return <CircleDot size={iconSize} aria-hidden='true' />;
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
  onJump: (n: number) => void;
  onRequestRun: (n: number) => void;
};

const StepRow: React.FC<StepRowProps> = ({ step, isCurrent, onJump, onRequestRun }) => {
  const { t } = useTranslation();
  const autonomousRunning = step.autonomous_run?.state === 'running';
  // The live step: the workflow's current step while it's still todo/now. The
  // step's own status often lags behind current_step (transitions aren't always
  // emitted), so current_step is the reliable signal for "which step is live".
  const isActiveStep = isCurrent && (step.status === 'todo' || step.status === 'now');
  const runningElapsedSec = useElapsedSeconds(autonomousRunning ? step.autonomous_run!.started_at : null);
  const canRunAutonomously = !autonomousRunning && (step.status === 'todo' || step.status === 'now');
  const sub = computeSubLine(step, t);

  const handleRowClick = () => {
    onJump(step.n);
  };
  const handleRunClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent the row click handler from also firing a jump request.
    e.stopPropagation();
    onRequestRun(step.n);
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
      className={styles.row}
      aria-label={t('workflow.rail.jumpToStep', {
        defaultValue: 'Jump to step {{n}}: {{title}}',
        n: step.n,
        title: step.title,
      })}
    >
      <span className={styles.bullet} data-status={step.status} aria-hidden='true'>
        {autonomousRunning ? (
          <Loader2 size={14} className={styles.spinner} aria-hidden='true' />
        ) : (
          <Bullet status={step.status} />
        )}
      </span>
      <span className='flex-1 min-w-0 flex flex-col'>
        {autonomousRunning ? (
          <span className={styles.runningLabel} data-testid='workflow-step-rail-running-label'>
            {t('workflow.rail.runningLabel', {
              defaultValue: 'Running… ({{elapsed}})',
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
        {canRunAutonomously && (
          <span
            role='button'
            tabIndex={-1}
            data-testid='workflow-step-rail-run-btn'
            className={styles.runBtn}
            onClick={(e) => handleRunClick(e as unknown as React.MouseEvent<HTMLButtonElement>)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onRequestRun(step.n);
              }
            }}
            aria-label={t('workflow.rail.runAutonomouslyAria', {
              defaultValue: 'Run step {{n}} autonomously',
              n: step.n,
            })}
          >
            <Play size={10} aria-hidden='true' />
            {t('workflow.rail.runAutonomously', { defaultValue: 'Run autonomously' })}
          </span>
        )}
      </span>
    </button>
  );
};

export const WorkflowStepRail: React.FC<WorkflowStepRailProps> = ({
  session,
  mode = 'auto',
  onJumpToStep,
  onRunAutonomously,
  children,
}) => {
  const { t } = useTranslation();
  const [pendingStep, setPendingStep] = useState<number | null>(null);

  const titleLabel = useMemo(
    () =>
      mode === 'manual'
        ? t('workflow.rail.titleManual', { defaultValue: 'Workflow steps · manual' })
        : t('workflow.rail.titleAuto', { defaultValue: 'Workflow steps · auto-driven' }),
    [mode, t]
  );

  const handleRowJump = (n: number) => {
    onJumpToStep(n);
  };
  const handleRequestRun = (n: number) => {
    setPendingStep(n);
  };
  const handleConfirmRun = () => {
    if (pendingStep != null) {
      onRunAutonomously(pendingStep);
    }
    setPendingStep(null);
  };
  const handleCancelRun = () => {
    setPendingStep(null);
  };

  return (
    <aside
      data-testid='workflow-step-rail'
      data-mode={mode}
      className={`${styles.rail} w-280px shrink-0 h-full flex flex-col overflow-y-auto border-l border-solid border-[color:var(--border-base)] bg-[color:var(--color-bg-2)] p-16px gap-6px`}
    >
      <div className={styles.titleStrip} data-testid='workflow-step-rail-title'>
        <span
          className={styles.modeDot}
          data-mode={mode}
          data-testid='workflow-step-rail-mode-dot'
          aria-hidden='true'
        />
        <span>{titleLabel}</span>
      </div>

      <div className='flex flex-col gap-2px'>
        {session.steps.map((step) => (
          <StepRow
            key={step.n}
            step={step}
            isCurrent={step.n === session.current_step}
            onJump={handleRowJump}
            onRequestRun={handleRequestRun}
          />
        ))}
      </div>

      {/* Bottom slot - WorkflowStatusBar is composed by the parent. */}
      <div className='mt-auto pt-12px' data-testid='workflow-step-rail-bottom-slot'>
        {children}
      </div>

      <Modal
        visible={pendingStep != null}
        onOk={handleConfirmRun}
        onCancel={handleCancelRun}
        title={t('workflow.rail.confirmTitle', {
          defaultValue: 'Run Step {{n}} autonomously?',
          n: pendingStep ?? 0,
        })}
        okText={t('workflow.rail.confirmOk', { defaultValue: 'Run autonomously' })}
        cancelText={t('workflow.rail.confirmCancel', { defaultValue: 'Cancel' })}
      >
        <div className={styles.confirmBody}>
          {t('workflow.rail.confirmBody', {
            defaultValue:
              'Wayland will spawn an autonomous worker to complete Step {{n}} in the background. You can keep chatting on the main session.',
            n: pendingStep ?? 0,
          })}
          <div className={styles.confirmEta}>
            {t('workflow.rail.confirmEta', { defaultValue: 'ETA: 4-8 minutes.' })}
          </div>
        </div>
      </Modal>
    </aside>
  );
};

export default WorkflowStepRail;
