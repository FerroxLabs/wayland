/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #252 observability rework - the renderer-facing canonical step.
 *
 * `ActivityStep` is a thin PRESENTATIONAL projection of the existing
 * `ActivityNode` merge substrate (chatLib.ts / activityTree.ts). The substrate
 * stays the universal, immutable, unit-tested model that every backend
 * normalizes into; this projection adds only display concerns - a humanized
 * `label`, a semantic `glyph`, and a `source` tag - computed at render time.
 *
 * One renderer (ActivityTimeline) consumes ActivityStep[]; one model
 * (ActivityNode) is produced by per-backend normalizers (wcore, acp). Adding a
 * backend = a normalizer that emits ActivityNodes. Zero renderer changes.
 */

import type { ActivityNode } from '../chatLib';
import { deriveStep, type GlyphKind } from './activityLabels';
import type { Source } from './sources';

/** Which backend produced the underlying node (drives the subtle mono "src" chip). */
export type ActivitySource = 'wcore' | 'acp' | 'codex' | 'gemini';

export type ActivityStep = {
  /** Stable id (= node id / callId) - drives merge-in-place and React keys. */
  id: string;
  /** Canonical node kind (preserved). */
  kind: ActivityNode['kind'];
  /** Semantic bucket for the leading timeline glyph (web/file/command/...). */
  glyph: GlyphKind;
  /** Humanized, present-progressive display label ("Searching the web..."). */
  label: string;
  status: ActivityNode['status'];
  startTime?: number;
  endTime?: number;
  /** Expandable raw detail (input/output/query) - shown on demand. */
  detail?: string;
  /** Sub-agent name when this step is / belongs to a spawned agent. */
  agent?: string;
  source?: ActivitySource;
  /** Sub-agent recursion. */
  children?: ActivityStep[];
  /** Parsed search result sources (web_search tool only). */
  sources?: Source[];
};

/** Duration in seconds, one decimal, or undefined when not both timestamps set. */
export const stepDurationSec = (step: Pick<ActivityStep, 'startTime' | 'endTime'>): number | undefined => {
  if (step.startTime == null || step.endTime == null) return undefined;
  const d = (step.endTime - step.startTime) / 1000;
  return d >= 0 ? d : undefined;
};

/** Format a duration in seconds for the right-aligned meta ("6.2s"). */
export const formatDuration = (sec: number | undefined): string => (sec == null ? '' : `${sec.toFixed(1)}s`);

/**
 * Project a canonical ActivityNode (+ optional backend source) into the
 * renderer-facing step. Recurses into children. Pure, allocation-light.
 */
export const nodeToStep = (node: ActivityNode, source?: ActivitySource): ActivityStep => {
  const { label, glyph } = deriveStep(node);
  return {
    id: node.id,
    kind: node.kind,
    glyph,
    label,
    status: node.status,
    startTime: node.startTime,
    endTime: node.endTime,
    detail: node.detail,
    agent: node.kind === 'sub_agent' ? node.name : undefined,
    source,
    children: node.children?.length ? node.children.map((c) => nodeToStep(c, source)) : undefined,
    ...(node.sources?.length ? { sources: node.sources } : {}),
  };
};

/** Project a node list (a turn's nodes) into steps. */
export const nodesToSteps = (nodes: ActivityNode[], source?: ActivitySource): ActivityStep[] => nodes.map((n) => nodeToStep(n, source));

/** Roll a turn's step statuses up to a single header status. */
export const rollupStatus = (steps: Array<Pick<ActivityStep, 'status'>>): ActivityStep['status'] => {
  if (steps.some((s) => s.status === 'running')) return 'running';
  if (steps.some((s) => s.status === 'failed')) return 'failed';
  if (steps.length === 0) return 'running';
  return 'done';
};

/** Count of terminal (done|failed) steps - for the "Did N things" summary. */
export const doneCount = (steps: Array<Pick<ActivityStep, 'status'>>): number => steps.filter((s) => s.status === 'done' || s.status === 'failed').length;
