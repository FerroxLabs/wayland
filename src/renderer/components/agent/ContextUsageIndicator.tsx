/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Popover } from '@arco-design/web-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { TokenUsageData } from '@/common/config/storage';

// Import default context limit from modelContextLimits
import { DEFAULT_CONTEXT_LIMIT } from '@/renderer/utils/model/modelContextLimits';

interface ContextUsageIndicatorProps {
  tokenUsage: TokenUsageData | null;
  contextLimit?: number;
  className?: string;
  size?: number;
}

const ContextUsageIndicator: React.FC<ContextUsageIndicatorProps> = ({
  tokenUsage,
  contextLimit = DEFAULT_CONTEXT_LIMIT,
  className = '',
  size = 24,
}) => {
  const { t } = useTranslation();

  const { percentage, rawPercentage, displayTotal, displayLimit, isWarning, isDanger } = useMemo(() => {
    if (!tokenUsage) {
      return {
        percentage: 0,
        rawPercentage: 0,
        displayTotal: '0',
        displayLimit: formatTokenCount(contextLimit > 0 ? contextLimit : DEFAULT_CONTEXT_LIMIT, true),
        isWarning: false,
        isDanger: false,
      };
    }

    // Guard a non-finite/negative usage figure: `NaN` would sail through a bare
    // `typeof === 'number'` check upstream and paint stroke-dashoffset="NaN".
    const total = Number.isFinite(tokenUsage.totalTokens) ? Math.max(0, tokenUsage.totalTokens) : 0;
    // Guard a non-positive limit: an agent that reports usage with no window
    // would otherwise divide by zero here and drive the ring to Infinity/NaN.
    const safeLimit = contextLimit > 0 ? contextLimit : DEFAULT_CONTEXT_LIMIT;
    const pct = (total / safeLimit) * 100;

    return {
      // The RING is clamped to [0,100]: a usage figure that exceeds the window
      // (e.g. the "3M / 200K" in #733, where a cumulative counter is rendered
      // against a per-turn window) drove strokeDashoffset negative and painted
      // a corrupt arc. The TEXT below stays unclamped and honest - it still
      // reports the real numbers and the real (>100%) percentage.
      percentage: Math.min(100, Math.max(0, pct)),
      rawPercentage: pct,
      displayTotal: formatTokenCount(total),
      displayLimit: formatTokenCount(safeLimit, true),
      isWarning: pct > 70,
      isDanger: pct > 90,
    };
  }, [tokenUsage, contextLimit]);

  // Hide when there is no token data
  if (!tokenUsage) {
    return null;
  }

  // Compute ring parameters
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Choose color based on state
  const getStrokeColor = () => {
    if (isDanger) return 'rgb(var(--danger-6))';
    if (isWarning) return 'rgb(var(--warning-6))';
    return 'rgb(var(--primary-6))';
  };

  // Background ring color - adapts to light/dark themes
  const getTrackColor = () => {
    return 'var(--color-fill-3)';
  };

  const popoverContent = (
    <div className='p-8px min-w-160px'>
      <div className='text-14px font-medium text-t-primary'>
        {rawPercentage.toFixed(1)}% · {displayTotal} / {displayLimit}{' '}
        {t('conversation.contextUsage.contextUsed', 'context used')}
      </div>
    </div>
  );

  return (
    <Popover content={popoverContent} position='top' trigger='hover' className='context-usage-popover'>
      <div
        className={`context-usage-indicator cursor-pointer flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill='none'
            stroke={getTrackColor()}
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill='none'
            stroke={getStrokeColor()}
            strokeWidth={strokeWidth}
            strokeLinecap='round'
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }}
          />
        </svg>
      </div>
    </Popover>
  );
};

/**
 * Format token count for display
 * @param count token count
 * @param hideZeroDecimals when true, hide the ".0" decimal (e.g. show "1M" instead of "1.0M"); defaults to false
 * @returns formatted string such as "37.0K" or "1.2M"; when hideZeroDecimals is true, "1.0M" is shown as "1M"
 */
export function formatTokenCount(count: number, hideZeroDecimals = false): string {
  if (count >= 1_000_000) {
    const value = count / 1_000_000;
    const formatted = value.toFixed(1);
    return hideZeroDecimals && formatted.endsWith('.0') ? `${Math.floor(value)}M` : `${formatted}M`;
  }
  if (count >= 1_000) {
    const value = count / 1_000;
    const formatted = value.toFixed(1);
    return hideZeroDecimals && formatted.endsWith('.0') ? `${Math.floor(value)}K` : `${formatted}K`;
  }
  return count.toString();
}

export default ContextUsageIndicator;
