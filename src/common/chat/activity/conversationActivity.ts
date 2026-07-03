/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #252 - the sidebar "what is this agent doing" data layer.
 *
 * A conversation row in the history sidebar previously showed a bare spinner
 * while a turn ran - zero information about the actual work. This module folds
 * the raw engine stream events (the SAME `responseStream` the sidebar already
 * listens to for the generating state) into a tiny, per-conversation activity
 * SNAPSHOT: a humanized current-action label plus the live set of spawned
 * sub-agents and each one's current step.
 *
 * It is a PASSIVE, read-only projection: it reuses the existing
 * `transformMessage` + step projectors (activityStep / projectMessages /
 * activityLabels) instead of re-deriving anything, so a background conversation
 * can render its status WITHOUT mounting the full message list. Pure - no React,
 * no IO; unit-tested.
 */

import type { IResponseMessage } from '../../adapter/ipcBridge';
import { transformMessage } from '../chatLib';
import { deriveStep, type GlyphKind } from './activityLabels';
import type { ActivityStep } from './activityStep';
import { subAgentToStep, toolSummaryToSteps } from './projectMessages';

/** One spawned sub-agent and its current step, for the expandable sidebar tree. */
export type ConversationActivityAgent = {
  /** Stable id (= sub-agent parentCallId) - drives in-place update + React keys. */
  id: string;
  /** Sub-agent display name ("researcher"). */
  name: string;
  /** Humanized current inner action ("Searching the web"). */
  label: string;
  glyph: GlyphKind;
  status: ActivityStep['status'];
};

/** The passive activity snapshot a sidebar row reads to render its live status. */
export type ConversationActivitySnapshot = {
  /** Humanized current top-level action ("Reading config.ts"). */
  label: string;
  glyph: GlyphKind;
  /** Active/most-recent sub-agents in the current turn (empty for a flat turn). */
  agents: ConversationActivityAgent[];
};

/** Raw engine event types that carry sidebar-relevant activity (pre-transform). */
const ACTIVITY_EVENT_TYPES = new Set(['thinking', 'tool_group', 'acp_tool_call', 'sub_agent_event']);

/** Cap the tracked sub-agent list so a long fan-out turn stays bounded. */
const MAX_AGENTS = 8;

/** True when a raw stream event is worth folding into the activity snapshot. */
export const isActivityEvent = (type: string): boolean => ACTIVITY_EVENT_TYPES.has(type);

/**
 * The current leaf step of a subtree: the last RUNNING step (recursing into
 * children), falling back to the last step overall. This is the "what is it
 * doing right now" pick for a live label.
 */
const pickCurrent = (steps: ActivityStep[]): ActivityStep | undefined => {
  let running: ActivityStep | undefined;
  let last: ActivityStep | undefined;
  for (const step of steps) {
    const leaf = step.children?.length ? (pickCurrent(step.children) ?? step) : step;
    last = leaf;
    if (leaf.status === 'running') running = leaf;
  }
  return running ?? last;
};

/** Set the top-level label/glyph, preserving agents; dedupe to the same ref when unchanged. */
const withLabel = (
  prev: ConversationActivitySnapshot | null,
  label: string,
  glyph: GlyphKind
): ConversationActivitySnapshot => {
  if (prev && prev.label === label && prev.glyph === glyph) return prev;
  return { label, glyph, agents: prev?.agents ?? [] };
};

/** Replace a sub-agent by id (or append, bounded), returning a new array. */
const upsertAgent = (
  agents: ConversationActivityAgent[],
  agent: ConversationActivityAgent
): ConversationActivityAgent[] => {
  const idx = agents.findIndex((a) => a.id === agent.id);
  if (idx >= 0) {
    const next = agents.slice();
    next[idx] = agent;
    return next;
  }
  const next = agents.concat(agent);
  return next.length > MAX_AGENTS ? next.slice(next.length - MAX_AGENTS) : next;
};

/**
 * Fold one raw engine stream event into the prior snapshot. Returns the SAME
 * reference when nothing meaningful changed (so callers can skip re-rendering),
 * or a new snapshot when the current action / sub-agent tree advanced. Non
 * activity events (and unhandled shapes) pass the prior snapshot through.
 */
export const foldConversationActivity = (
  prev: ConversationActivitySnapshot | null,
  message: IResponseMessage
): ConversationActivitySnapshot | null => {
  if (!isActivityEvent(message.type)) return prev;

  const tMessage = transformMessage(message);
  // transformMessage can return undefined for events it chooses to drop.
  if (!tMessage) return prev;

  switch (tMessage.type) {
    case 'thinking': {
      const { label, glyph } = deriveStep({ kind: 'thinking', name: '' });
      return withLabel(prev, label, glyph);
    }
    case 'tool_group':
    case 'acp_tool_call': {
      const current = pickCurrent(toolSummaryToSteps([tMessage]));
      if (!current) return prev;
      return withLabel(prev, current.label, current.glyph);
    }
    case 'sub_agent': {
      const step = subAgentToStep(tMessage.content);
      const inner = step.children?.length ? pickCurrent(step.children) : undefined;
      const agent: ConversationActivityAgent = {
        id: step.id,
        name: step.agent ?? '',
        label: inner?.label ?? step.label,
        glyph: inner?.glyph ?? 'sub_agent',
        status: step.status,
      };
      const prevAgents = prev?.agents ?? [];
      const existing = prevAgents.find((a) => a.id === agent.id);
      const agentUnchanged =
        existing != null &&
        existing.name === agent.name &&
        existing.label === agent.label &&
        existing.glyph === agent.glyph &&
        existing.status === agent.status;
      const labelUnchanged = prev != null && prev.label === agent.label && prev.glyph === agent.glyph;
      if (agentUnchanged && labelUnchanged) return prev;
      return { label: agent.label, glyph: agent.glyph, agents: upsertAgent(prevAgents, agent) };
    }
    default:
      return prev;
  }
};
