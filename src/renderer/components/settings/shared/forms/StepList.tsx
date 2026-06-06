import React from 'react';
import { Check } from 'lucide-react';
import classNames from 'classnames';

type Step = {
  title: string;
  body?: React.ReactNode;
  done?: boolean;
};

type StepListProps = {
  steps: Step[];
};

const StepList: React.FC<StepListProps> = ({ steps }) => {
  return (
    <ol className='flex flex-col gap-12px'>
      {steps.map((step, i) => (
        <li key={i} className='flex gap-12px'>
          <span
            className={classNames(
              'w-22px h-22px rounded-full flex items-center justify-center text-12px font-semibold shrink-0 mt-1px',
              step.done
                ? 'bg-[var(--success)] text-white'
                : 'bg-[var(--color-bg-4)] text-[var(--color-text-3)]'
            )}
          >
            {step.done ? <Check size={12} /> : i + 1}
          </span>
          <div className='flex flex-col gap-2px'>
            <div className='text-13px font-medium text-[var(--color-text-1)]'>{step.title}</div>
            {step.body && (
              <div className='text-12px text-[var(--color-text-3)] leading-relaxed'>{step.body}</div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
};

export default StepList;
