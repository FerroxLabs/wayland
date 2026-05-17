import React from 'react';
import { Spin } from '@arco-design/web-react';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type LoadingStage = 'detecting' | 'verifying' | 'fetching' | 'done';

type Props = {
  stage: LoadingStage;
};

const STAGES: Array<{ key: LoadingStage; i18nKey: string }> = [
  { key: 'detecting', i18nKey: 'settings.providers.connect.detectingProvider' },
  { key: 'verifying', i18nKey: 'settings.providers.connect.verifyingKey' },
  { key: 'fetching', i18nKey: 'settings.providers.connect.fetchingCatalog' },
];

const STAGE_ORDER: LoadingStage[] = ['detecting', 'verifying', 'fetching', 'done'];

function stageIndex(s: LoadingStage): number {
  return STAGE_ORDER.indexOf(s);
}

const LoadingState = ({ stage }: Props) => {
  const { t } = useTranslation();
  const currentIdx = stageIndex(stage);

  return (
    <div className="flex flex-col gap-3 p-6 min-h-[140px] justify-center">
      {STAGES.map((s, i) => {
        const sIdx = i; // stages are ordered 0,1,2
        const isDone = currentIdx > sIdx;
        const isActive = currentIdx === sIdx;

        return (
          <div key={s.key} className="flex items-center gap-3">
            <span className="w-5 flex-shrink-0 flex items-center justify-center">
              {isDone ? (
                <CheckCircle size={18} className="text-[var(--color-success-6)]" />
              ) : isActive ? (
                <Spin size={16} />
              ) : (
                <span className="w-4 h-4 rounded-full border border-[var(--color-border-2)]" />
              )}
            </span>
            <span
              className={
                isDone
                  ? 'text-[var(--color-text-3)] line-through text-sm'
                  : isActive
                    ? 'text-[var(--color-text-1)] font-medium text-sm'
                    : 'text-[var(--color-text-4)] text-sm'
              }
            >
              {t(s.i18nKey)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default LoadingState;
