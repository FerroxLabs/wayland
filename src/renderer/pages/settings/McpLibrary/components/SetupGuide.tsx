import React from 'react';
import { Check, ExternalLink } from 'lucide-react';
import MarkdownView from '@renderer/components/Markdown';
import { openExternalUrl } from '@renderer/utils/platform';
import type { SetupGuide as GuideT, SetupStep } from '../types';

interface Props {
  guide: GuideT;
  envValues: Record<string, string>;
  onEnvChange: (name: string, value: string) => void;
  onPrimary: (action: string) => void;
  /** Step ids the parent has determined are complete (e.g. install done, OAuth authorized). */
  completedStepIds?: ReadonlySet<string>;
}

function StepCard({
  step,
  idx,
  envValues,
  onEnvChange,
  onPrimary,
  completedStepIds,
}: Props & { step: SetupStep; idx: number }) {
  const done = !!step.autoCompletedByInstall || (completedStepIds?.has(step.id) ?? false);
  return (
    <div className={`mcp-step ${done ? 'is-done' : ''}`} data-step-id={step.id}>
      <div className="mcp-step-num">{done ? <Check size={14} /> : idx + 1}</div>
      <div className="mcp-step-body">
        <div className="mcp-step-title">
          {step.title}
          {step.estSeconds ? (
            <span className="mcp-step-est">
              {' '}
              {Math.max(1, Math.round(step.estSeconds / 60))} min
            </span>
          ) : null}
        </div>
        {step.body && (
          <div className="mcp-step-body-md">
            <MarkdownView>{step.body}</MarkdownView>
          </div>
        )}
        {step.externalAction && (
          <button
            className="mcp-open-link"
            onClick={() => {
              void openExternalUrl(step.externalAction!.url);
            }}
          >
            <ExternalLink size={12} /> {step.externalAction.label}
          </button>
        )}
        {step.inputs &&
          step.inputs.map((inp) => (
            <div className="mcp-step-input" key={inp.name}>
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
        {step.warning && <div className="mcp-step-warn">{step.warning}</div>}
        {step.primaryAction && (
          <button
            className="mcp-step-primary"
            onClick={() => onPrimary(step.primaryAction!.action)}
          >
            {step.primaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}

export function SetupGuide(props: Props) {
  return (
    <div className="mcp-setup-guide">
      {props.guide.steps.map((step, idx) => (
        <StepCard key={step.id} step={step} idx={idx} {...props} />
      ))}
    </div>
  );
}
