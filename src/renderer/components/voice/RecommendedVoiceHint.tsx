/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { VoiceRecommendation } from '@/common/voice/hardwareRecommend';

type RecommendedVoiceHintProps = {
  recommendation: VoiceRecommendation;
};

/**
 * Dumb presentational hint that surfaces the hardware-aware voice recommendation
 * reason. No data fetching, no logic — the caller passes a recommendation and we
 * render its `reason`.
 */
export const RecommendedVoiceHint = ({ recommendation }: RecommendedVoiceHintProps) => {
  const { t } = useTranslation();
  return (
    <div className="text-secondary text-xs">
      <span className="font-medium">
        {t('voice.recommendedForYourMachine', { defaultValue: 'Recommended for your machine' })}:
      </span>{' '}
      {recommendation.reason}
    </div>
  );
};

export default RecommendedVoiceHint;
