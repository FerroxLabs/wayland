/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hand-rolled inline SVG trend chart for the cost series (no chart library -
 * mirrors the raw-SVG approach in wiki/components/KnowledgeGraph.tsx). Renders a
 * filled area + line with a y-axis max label and start/end x labels, and a
 * hover tooltip per bucket.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CostSeriesPoint } from '@process/services/cost/types';
import { formatUsd } from '@renderer/utils/format/tokens';
import { buildChartGeometry, type CostPeriod } from './costChart';
import styles from './Cost.module.css';

const WIDTH = 760;
const HEIGHT = 200;

export type CostTrendProps = {
  series: CostSeriesPoint[];
  period: CostPeriod;
};

function formatBucketLabel(ms: number, period: CostPeriod): string {
  const d = new Date(ms);
  if (period === 'day') {
    return d.toLocaleTimeString(undefined, { hour: 'numeric' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const CostTrend: React.FC<CostTrendProps> = ({ series, period }) => {
  const { t } = useTranslation();
  const [hover, setHover] = useState<number | null>(null);
  const geo = buildChartGeometry(series, WIDTH, HEIGHT);

  if (geo.points.length === 0 || geo.maxCostUsd <= 0) {
    return (
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <span className={styles.panelTitle}>{t('missionControl.cost.trendTitle')}</span>
        </div>
        <div className={styles.panelHint}>{t('missionControl.cost.noData')}</div>
      </div>
    );
  }

  const first = geo.points[0];
  const last = geo.points[geo.points.length - 1];
  const baselineY = geo.height - geo.pad.bottom;
  const hovered = hover != null ? geo.points[hover] : null;

  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <span className={styles.panelTitle}>{t('missionControl.cost.trendTitle')}</span>
        {hovered ? (
          <span className={styles.panelHint}>
            {formatBucketLabel(hovered.point.bucketStart, period)} {'·'} {formatUsd(hovered.point.costUsd)}
          </span>
        ) : null}
      </div>
      <svg className={styles.chart} viewBox={`0 0 ${geo.width} ${geo.height}`} role='img'>
        {/* y-axis max gridline + label */}
        <line
          className={styles.chartGrid}
          x1={geo.pad.left}
          y1={geo.pad.top}
          x2={geo.width - geo.pad.right}
          y2={geo.pad.top}
        />
        <line
          className={styles.chartGrid}
          x1={geo.pad.left}
          y1={baselineY}
          x2={geo.width - geo.pad.right}
          y2={baselineY}
        />
        <text className={styles.chartAxis} x={geo.pad.left - 6} y={geo.pad.top + 4} textAnchor='end'>
          {formatUsd(geo.maxCostUsd)}
        </text>
        <text className={styles.chartAxis} x={geo.pad.left - 6} y={baselineY} textAnchor='end'>
          $0
        </text>

        <path className={styles.chartArea} d={geo.areaPath} />
        <polyline className={styles.chartLine} points={geo.linePoints} />

        {/* x-axis start/end labels */}
        <text className={styles.chartAxis} x={first.x} y={geo.height - 6} textAnchor='start'>
          {formatBucketLabel(first.point.bucketStart, period)}
        </text>
        <text className={styles.chartAxis} x={last.x} y={geo.height - 6} textAnchor='end'>
          {formatBucketLabel(last.point.bucketStart, period)}
        </text>

        {/* hover hit-targets + active dot */}
        {geo.points.map((p, i) => (
          <rect
            key={i}
            x={p.x - 6}
            y={geo.pad.top}
            width={12}
            height={baselineY - geo.pad.top}
            fill='transparent'
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover((cur) => (cur === i ? null : cur))}
          />
        ))}
        {hovered ? <circle className={styles.chartDot} cx={hovered.x} cy={hovered.y} r={3.5} /> : null}
      </svg>
    </div>
  );
};
