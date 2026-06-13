import React from 'react';
import classNames from 'classnames';
import { Check, ExternalLink } from 'lucide-react';
import MarkdownView from '@renderer/components/Markdown';
import { openExternalUrl } from '@renderer/utils/platform';
import type { SetupGuide as GuideT, SetupStep } from '../types';
import styles from './SetupGuide.module.css';

interface Props {
  guide: GuideT;
  envValues: Record<string, string>;
  onEnvChange: (name: string, value: string) => void;
  onPrimary: (action: string) => void;
  /** Step ids the parent has determined are complete (e.g. install done, OAuth authorized). */
  completedStepIds?: ReadonlySet<string>;
  /**
   * Synthesized save action for any step that has token `inputs` but whose
   * catalog guide forgot to wire its own `primaryAction`. Co-locating the button
   * directly under the input guarantees "if there's a key box, there's a save
   * button" for every connector - regardless of guide quality (21 catalog guides
   * shipped an input with no save action) and regardless of connected state (so
   * the key can be updated). Omitted for OAuth connectors, whose connect button
   * lives in the action card / sign-in bar, not under a token field.
   */
  fallbackAction?: { action: string; label: string; pending?: boolean; pendingLabel?: string };
}

function StepCard({
  step,
  idx,
  envValues,
  onEnvChange,
  onPrimary,
  completedStepIds,
  fallbackAction,
}: Props & { step: SetupStep; idx: number }) {
  const hasInputs = !!step.inputs && step.inputs.length > 0;
  // Render the synthesized save button only when this step actually collects a
  // value and the guide didn't already supply its own primaryAction button.
  const showFallback = hasInputs && !step.primaryAction && !!fallbackAction;
  const done = !!step.autoCompletedByInstall || (completedStepIds?.has(step.id) ?? false);
  return (
    <div
      className={classNames(styles.step, { [styles.isDone]: done })}
      data-step-id={step.id}
    >
      <div className={styles.stepNum}>{done ? <Check size={14} /> : idx + 1}</div>
      <div className={styles.stepBody}>
        <div className={styles.stepTitle}>
          {step.title}
          {step.estSeconds ? (
            <span className={styles.stepEst}>
              {' '}
              {Math.max(1, Math.round(step.estSeconds / 60))} min
            </span>
          ) : null}
        </div>
        {step.body && (
          <div className={styles.stepBodyMd}>
            <MarkdownView>{step.body}</MarkdownView>
          </div>
        )}
        {step.externalAction && (
          <button
            className={styles.openLink}
            onClick={() => {
              void openExternalUrl(step.externalAction!.url);
            }}
          >
            <ExternalLink size={12} /> {step.externalAction.label}
          </button>
        )}
        {step.inputs &&
          step.inputs.map((inp) => (
            <div className={styles.stepInput} key={inp.name}>
              <label htmlFor={`mcp-input-${inp.name}`}>{inp.label}</label>
              <input
                id={`mcp-input-${inp.name}`}
                type={inp.secret ? 'password' : 'text'}
                placeholder={inp.placeholder ?? inp.label}
                value={envValues[inp.name] ?? ''}
                onChange={(e) => onEnvChange(inp.name, e.target.value)}
              />
            </div>
          ))}
        {step.warning && <div className={styles.stepWarn}>{step.warning}</div>}
        {step.primaryAction && (
          <button
            className={styles.stepPrimary}
            onClick={() => onPrimary(step.primaryAction!.action)}
          >
            {step.primaryAction.label}
          </button>
        )}
        {showFallback && (
          <button
            className={styles.stepPrimary}
            onClick={() => onPrimary(fallbackAction!.action)}
            disabled={fallbackAction!.pending}
          >
            {fallbackAction!.pending
              ? (fallbackAction!.pendingLabel ?? fallbackAction!.label)
              : fallbackAction!.label}
          </button>
        )}
      </div>
    </div>
  );
}

export function SetupGuide(props: Props) {
  return (
    <div className={styles.setupGuide}>
      {props.guide.steps.map((step, idx) => (
        <StepCard key={step.id} step={step} idx={idx} {...props} />
      ))}
    </div>
  );
}
