/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #252 - pure model for the live activity tree.
 *
 * Builds and merges an `IMessageActivity['content']` from the normalized
 * observability events that already flow through the wcore pipeline
 * (tool lifecycle, tool_chunk stdout, session_cost, provider circuit, browser
 * / cua ops). No React, no engine, no IO - unit-tested in isolation
 * (tests/unit/activityTree.test.ts).
 *
 * The renderer never builds this directly: chatLib.transformMessage maps a raw
 * IResponseMessage into an `ActivityEvent` and this module folds it into the
 * card content, then composeMessage merges the card by turnId (= msg_id).
 */

import type { ActivityNode, ActivityTurnCost, IMessageActivity } from './chatLib';

export type ActivityContent = IMessageActivity['content'];

/**
 * Normalized activity event. Produced by transformMessage from the raw wcore
 * IResponseMessage stream. Deliberately flat and serializable.
 */
export type ActivityEvent =
  | {
      kind: 'tool';
      callId: string;
      name: string;
      /** lifecycle phase from the engine tool_group status. */
      phase: 'running' | 'done' | 'failed';
      ts?: number;
      /** final result text on completion (optional). */
      detail?: string;
    }
  | {
      kind: 'tool_chunk';
      callId: string;
      name?: string;
      chunk: string;
      ts?: number;
    }
  | {
      kind: 'circuit';
      /** synthetic id (primary provider name). */
      id: string;
      name: string;
      detail?: string;
      ts?: number;
    }
  | {
      kind: 'browser';
      callId: string;
      name: string;
      detail?: string;
      ts?: number;
    }
  | {
      kind: 'cua';
      callId: string;
      name: string;
      detail?: string;
      ts?: number;
    }
  | {
      kind: 'cost';
      perTurn: ActivityTurnCost[];
    };

/** Fresh, empty content for a turn. */
export const emptyActivityContent = (turnId: string): ActivityContent => ({
  turnId,
  nodes: [],
  perTurnCost: undefined,
  status: 'running',
});

/** Roll the overall card status up from its nodes. */
const rollUpStatus = (nodes: ActivityNode[]): ActivityContent['status'] => {
  if (nodes.some((n) => n.status === 'running')) return 'running';
  if (nodes.some((n) => n.status === 'failed')) return 'failed';
  if (nodes.length === 0) return 'running';
  return 'done';
};

const findNode = (nodes: ActivityNode[], id: string): number => nodes.findIndex((n) => n.id === id);

/**
 * Fold one normalized event into the activity content, returning a NEW content
 * object (immutable - safe for React identity checks). Nodes are merged by id
 * (callId for tools); tool_chunk appends to the matching node's `detail`;
 * tool_result sets endTime + terminal status; session_cost attaches the
 * per-turn cost rows.
 */
export const addOrUpdateNode = (content: ActivityContent, evt: ActivityEvent): ActivityContent => {
  // Cost rows are turn-level metadata, not a node.
  if (evt.kind === 'cost') {
    return { ...content, perTurnCost: evt.perTurn };
  }

  const nodes = content.nodes.slice();

  if (evt.kind === 'tool') {
    const idx = findNode(nodes, evt.callId);
    if (idx === -1) {
      nodes.push({
        id: evt.callId,
        kind: 'tool',
        callId: evt.callId,
        name: evt.name,
        status: evt.phase,
        startTime: evt.ts,
        ...(evt.phase !== 'running' ? { endTime: evt.ts } : {}),
        ...(evt.detail ? { detail: evt.detail } : {}),
      });
    } else {
      const prev = nodes[idx];
      nodes[idx] = {
        ...prev,
        // Keep the most descriptive name (initial request name over a blank running update).
        name: evt.name || prev.name,
        status: evt.phase,
        ...(prev.startTime == null && evt.ts != null ? { startTime: evt.ts } : {}),
        ...(evt.phase !== 'running' && evt.ts != null ? { endTime: evt.ts } : {}),
        // Append final result text to any streamed chunks already accumulated.
        ...(evt.detail ? { detail: (prev.detail ?? '') + evt.detail } : {}),
      };
    }
    return { ...content, nodes, status: rollUpStatus(nodes) };
  }

  if (evt.kind === 'tool_chunk') {
    const idx = findNode(nodes, evt.callId);
    if (idx === -1) {
      // Chunk arrived before (or without) a tool_request - synthesize a running node.
      nodes.push({
        id: evt.callId,
        kind: 'tool',
        callId: evt.callId,
        name: evt.name ?? '',
        status: 'running',
        startTime: evt.ts,
        detail: evt.chunk,
      });
    } else {
      const prev = nodes[idx];
      nodes[idx] = { ...prev, detail: (prev.detail ?? '') + evt.chunk };
    }
    return { ...content, nodes, status: rollUpStatus(nodes) };
  }

  // circuit / browser / cua: compact op-trail nodes keyed by their id/callId.
  const id = 'callId' in evt ? evt.callId : evt.id;
  const idx = findNode(nodes, id);
  const status: ActivityNode['status'] = 'done';
  if (idx === -1) {
    nodes.push({
      id,
      kind: evt.kind,
      ...(evt.kind !== 'circuit' ? { callId: evt.callId } : {}),
      name: evt.name,
      status,
      startTime: evt.ts,
      endTime: evt.ts,
      ...(evt.detail ? { detail: evt.detail } : {}),
    });
  } else {
    const prev = nodes[idx];
    nodes[idx] = {
      ...prev,
      name: evt.name || prev.name,
      ...(evt.detail ? { detail: (prev.detail ? prev.detail + '\n' : '') + evt.detail } : {}),
      endTime: evt.ts ?? prev.endTime,
    };
  }
  return { ...content, nodes, status: rollUpStatus(nodes) };
};

/**
 * Merge an incoming activity content snapshot into an existing one. Used by the
 * compose paths: each normalized event is transformed into a single-delta
 * content (built via addOrUpdateNode on an empty base), then merged here into
 * the accumulated card. Node-level merge mirrors addOrUpdateNode so the two
 * paths stay consistent.
 */
export const mergeActivityContent = (prev: ActivityContent, next: ActivityContent): ActivityContent => {
  let merged = prev;
  for (const node of next.nodes) {
    merged = foldNode(merged, node);
  }
  if (next.perTurnCost) {
    merged = { ...merged, perTurnCost: next.perTurnCost };
  }
  return { ...merged, status: rollUpStatus(merged.nodes) };
};

/**
 * #252 Phase 2 - merge an incoming list of fully-formed ActivityNodes into an
 * accumulated list, keyed by node id (= callId for tools/sub-agents). Used by
 * the sub_agent compose paths to fold each streamed inner-event delta into the
 * sub-agent's subtree: a child tool's chunks/result merge into the existing tool
 * node, and a nested sub-agent's children recurse (depth-N) by id.
 *
 * Detail is appended (streamed stdout / thinking text accumulates); status
 * advances toward terminal; children merge recursively; startTime is kept,
 * endTime is taken from the latest. Immutable - returns a new array.
 */
export const mergeNodeList = (prev: ActivityNode[] = [], next: ActivityNode[] = []): ActivityNode[] => {
  const merged = prev.slice();
  for (const node of next) {
    const idx = merged.findIndex((n) => n.id === node.id);
    if (idx === -1) {
      merged.push(node);
      continue;
    }
    const prevNode = merged[idx];
    merged[idx] = {
      ...prevNode,
      name: node.name || prevNode.name,
      status: node.status,
      startTime: prevNode.startTime ?? node.startTime,
      endTime: node.endTime ?? prevNode.endTime,
      ...(node.detail != null ? { detail: (prevNode.detail ?? '') + node.detail } : {}),
      ...(node.children || prevNode.children ? { children: mergeNodeList(prevNode.children, node.children) } : {}),
    };
  }
  return merged;
};

/** Fold a fully-formed node (from a delta content) into accumulated content. */
const foldNode = (content: ActivityContent, node: ActivityNode): ActivityContent => {
  const nodes = content.nodes.slice();
  const idx = findNode(nodes, node.id);
  if (idx === -1) {
    nodes.push(node);
  } else {
    const prev = nodes[idx];
    nodes[idx] = {
      ...prev,
      name: node.name || prev.name,
      status: node.status,
      startTime: prev.startTime ?? node.startTime,
      endTime: node.endTime ?? prev.endTime,
      ...(node.detail != null ? { detail: (prev.detail ?? '') + node.detail } : {}),
    };
  }
  return { ...content, nodes };
};
