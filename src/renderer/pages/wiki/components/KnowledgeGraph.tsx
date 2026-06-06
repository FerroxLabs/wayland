/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * KnowledgeGraph - SVG force graph showing concept relationships.
 * Uses raw SVG with radial/cluster positioning based on topicTag.
 * NO d3 or new dependencies - pure SVG with hand-positioned circles.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { WikiConcept } from '@/common/types/memory';
import styles from './KnowledgeGraph.module.css';

const TOPIC_COLORS: Record<string, string> = {
  Architecture: '#FF7A45',
  Design: '#60A5FA',
  Decisions: '#FBBF24',
  Patterns: '#A78BFA',
  Process: '#4ADE80',
  Brand: '#FF7A45',
};

const ORPHAN_COLOR = '#6B6E76';

// Cluster centers for each topic - radial layout around the center of the 1200×600 viewBox
const CLUSTER_CENTERS: Record<string, [number, number]> = {
  Architecture: [400, 220],
  Design: [800, 180],
  Decisions: [950, 380],
  Patterns: [750, 480],
  Process: [250, 440],
  Brand: [550, 150],
};

type NodePosition = {
  concept: WikiConcept;
  x: number;
  y: number;
  r: number;
  color: string;
};

function computePositions(concepts: WikiConcept[]): NodePosition[] {
  // Group by topic
  const byTopic = new Map<string, WikiConcept[]>();
  for (const c of concepts) {
    const arr = byTopic.get(c.topicTag) ?? [];
    arr.push(c);
    byTopic.set(c.topicTag, arr);
  }

  const positions: NodePosition[] = [];

  for (const [topic, group] of byTopic) {
    const center = CLUSTER_CENTERS[topic] ?? [600, 300];
    const color = TOPIC_COLORS[topic] ?? ORPHAN_COLOR;

    group.forEach((concept, i) => {
      const angle = (i * 2 * Math.PI) / Math.max(group.length, 1);
      const spread = 70 + Math.min(group.length * 8, 40);
      const x = center[0] + spread * Math.cos(angle);
      const y = center[1] + spread * Math.sin(angle);
      // Size nodes by ref count: min 10, max 22
      const r = Math.min(22, Math.max(10, 8 + concept.sourceMemoryIds.length * 1.2));

      positions.push({ concept, x, y, r, color });
    });
  }

  return positions;
}

function computeEdges(
  positions: NodePosition[],
  backlinkGraph: Record<string, string[]>,
): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const posMap = new Map(positions.map((p) => [p.concept.slug, p]));
  const edges: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const seen = new Set<string>();

  for (const [from, tos] of Object.entries(backlinkGraph)) {
    const fromPos = posMap.get(from);
    if (!fromPos) continue;
    for (const to of tos) {
      const key = [from, to].sort().join('--');
      if (seen.has(key)) continue;
      seen.add(key);
      const toPos = posMap.get(to);
      if (!toPos) continue;
      edges.push({ x1: fromPos.x, y1: fromPos.y, x2: toPos.x, y2: toPos.y });
    }
  }

  return edges;
}

export type KnowledgeGraphProps = {
  concepts: WikiConcept[];
  backlinkGraph?: Record<string, string[]>;
  onNavigate?: (slug: string) => void;
};

export function KnowledgeGraph({
  concepts,
  backlinkGraph = {},
  onNavigate,
}: KnowledgeGraphProps): React.ReactElement {
  const { t } = useTranslation('memory');
  const [hovered, setHovered] = useState<string | null>(null);

  const positions = computePositions(concepts);
  const edges = computeEdges(positions, backlinkGraph);

  const hoveredNode = hovered ? positions.find((p) => p.concept.slug === hovered) : null;

  return (
    <div className={styles.wrapper} data-testid='knowledge-graph'>
      <div className={styles.container}>
        <svg
          className={styles.svg}
          viewBox='0 0 1200 600'
          xmlns='http://www.w3.org/2000/svg'
          aria-label='Knowledge graph'
        >
          {/* Grid background */}
          <defs>
            <pattern id='wiki-grid' width='40' height='40' patternUnits='userSpaceOnUse'>
              <path d='M 40 0 L 0 0 0 40' fill='none' stroke='#1C1F23' strokeWidth='0.5' />
            </pattern>
          </defs>
          <rect width='1200' height='600' fill='#16181B' />
          <rect width='1200' height='600' fill='url(#wiki-grid)' />

          {/* Edges */}
          {edges.map((e, i) => (
            <line
              key={i}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke='#2E3238'
              strokeWidth='1.5'
              opacity='0.7'
            />
          ))}

          {/* Nodes */}
          {positions.map(({ concept, x, y, r, color }) => (
            <g key={concept.slug}>
              <circle
                cx={x}
                cy={y}
                r={r}
                fill={color}
                opacity={hovered === concept.slug ? 1 : 0.8}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered(concept.slug)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onNavigate?.(concept.slug)}
              />
              <text
                x={x}
                y={y + 3}
                textAnchor='middle'
                fontSize='7'
                fill='white'
                pointerEvents='none'
              >
                {concept.name.slice(0, 12)}
              </text>
              {/* Invisible hit target */}
              <circle
                cx={x}
                cy={y}
                r={r + 6}
                fill='transparent'
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered(concept.slug)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onNavigate?.(concept.slug)}
              />
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {hoveredNode && (
          <div
            className={styles.tooltip}
            style={{
              left: `${(hoveredNode.x / 1200) * 100}%`,
              top: `${(hoveredNode.y / 600) * 100}%`,
            }}
          >
            <strong>{hoveredNode.concept.name}</strong>
            <br />
            {hoveredNode.concept.sourceMemoryIds.length} sources &middot;{' '}
            {hoveredNode.concept.topicTag}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className={styles.legend} data-testid='graph-legend'>
        {Object.entries(TOPIC_COLORS).map(([topic, color]) => (
          <div key={topic} className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: color }} />
            {topic}
          </div>
        ))}
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: ORPHAN_COLOR }} />
          {t('wiki.home.emergingLabel', 'Emerging')}
        </div>
      </div>
    </div>
  );
}
