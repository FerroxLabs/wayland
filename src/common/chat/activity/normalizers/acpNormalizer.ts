/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #252 - PURE normalizer: maps ACP `session/update` events (Claude Code / Codex
 * / Gemini and every other backend that streams over the ACP protocol) into the
 * canonical {@link ActivityNode} model used by the observability timeline.
 *
 * This unifies the ACP backends onto the SAME activity surface the Wayland Core
 * (native) path already feeds, so the timeline renders one shape regardless of
 * which engine produced the turn.
 *
 * Returns ZERO OR MORE partial nodes per event. The caller folds them into the
 * turn's activity card by `id` via `mergeNodeList` (activityTree.ts), so
 * streaming updates merge in place: a `tool_call` then a `tool_call_update`
 * sharing the same `toolCallId` collapse onto one node, and consecutive
 * `agent_thought_chunk`s keyed by the session id append their text into one
 * thinking node (mergeNodeList concatenates `detail`).
 *
 * Pure: no React, no IO, no Node, no engine imports. Never throws.
 *
 * The input shapes are the real ACP types from `src/common/types/acpTypes.ts`:
 * the payload is nested under `sessionUpdate.update`, the session id is on the
 * top-level (`BaseSessionUpdate.sessionId`). ACP `session/update` events carry
 * no timestamps, so startTime/endTime are deliberately left undefined - the
 * timeline tolerates missing durations.
 */

import type { ActivityNode } from '../../chatLib';
import type { AcpSessionUpdate } from '../../../types/acpTypes';

/**
 * ACP tool statuses that mean the call finished and failed.
 * (ACP `status` is `'pending' | 'in_progress' | 'completed' | 'failed'` on
 * `tool_call`, and `'completed' | 'failed'` on `tool_call_update`.)
 */
const isFailedStatus = (status: string | undefined): boolean => status === 'failed' || status === 'error';

/** ACP tool statuses that mean the call finished successfully. */
const isCompletedStatus = (status: string | undefined): boolean => status === 'completed';

/**
 * Stringify the ACP tool_call_update `content` (an array of `{ type:'content',
 * content:{ type:'text', text } }` items) into a single detail string. Tolerates
 * odd / partial items defensively and returns undefined when there is nothing
 * renderable so the node simply carries no detail.
 */
const stringifyToolContent = (content: unknown): string | undefined => {
  if (!Array.isArray(content)) return undefined;
  const parts: string[] = [];
  for (const item of content) {
    if (item == null || typeof item !== 'object') continue;
    const inner = (item as { content?: unknown }).content;
    if (inner != null && typeof inner === 'object') {
      const text = (inner as { text?: unknown }).text;
      if (typeof text === 'string' && text.length > 0) {
        parts.push(text);
        continue;
      }
    }
    // Fallback: an item with a direct `text` field.
    const directText = (item as { text?: unknown }).text;
    if (typeof directText === 'string' && directText.length > 0) parts.push(directText);
  }
  return parts.length > 0 ? parts.join('\n') : undefined;
};

/**
 * Map one ACP `session/update` event to zero or more partial activity nodes.
 *
 * Mapping:
 * - `tool_call` (pending / in_progress) -> a running `tool` node keyed by
 *   `toolCallId`.
 * - `tool_call_update` (completed) -> a `done` tool node with the same id (so it
 *   merges) and stringified output as `detail`; (failed) -> a `failed` node.
 * - `agent_thought_chunk` -> a running `thinking` node keyed by the session id,
 *   the thought text in `detail` (mergeNodeList concatenates successive chunks).
 * - `agent_message_chunk` (the assistant's answer prose) -> `[]` (not activity).
 * - anything else / unknown / malformed -> `[]` (never throws).
 */
export const acpToActivityNodes = (update: AcpSessionUpdate): ActivityNode[] => {
  // Defensive: tolerate a malformed / empty object with no nested `update`.
  if (update == null || typeof update !== 'object') return [];
  const inner = (update as { update?: unknown }).update;
  if (inner == null || typeof inner !== 'object') return [];

  const kind = (inner as { sessionUpdate?: unknown }).sessionUpdate;

  switch (kind) {
    case 'tool_call': {
      const tc = inner as { toolCallId?: unknown; title?: unknown; status?: unknown };
      const id = typeof tc.toolCallId === 'string' ? tc.toolCallId : undefined;
      if (!id) return [];
      const name = typeof tc.title === 'string' ? tc.title : '';
      const status = typeof tc.status === 'string' ? tc.status : undefined;
      // A tool_call that already reports terminal status maps straight to it;
      // otherwise it is an active call -> 'running'.
      const nodeStatus: ActivityNode['status'] = isFailedStatus(status)
        ? 'failed'
        : isCompletedStatus(status)
          ? 'done'
          : 'running';
      return [{ id, kind: 'tool', callId: id, name, status: nodeStatus }];
    }

    case 'tool_call_update': {
      const tc = inner as { toolCallId?: unknown; title?: unknown; status?: unknown; content?: unknown };
      const id = typeof tc.toolCallId === 'string' ? tc.toolCallId : undefined;
      if (!id) return [];
      const name = typeof tc.title === 'string' ? tc.title : '';
      const status = typeof tc.status === 'string' ? tc.status : undefined;
      // An update is terminal by definition; default a missing/odd status to 'done'.
      const nodeStatus: ActivityNode['status'] = isFailedStatus(status) ? 'failed' : 'done';
      const detail = stringifyToolContent(tc.content);
      return [
        {
          id,
          kind: 'tool',
          callId: id,
          name,
          status: nodeStatus,
          ...(detail !== undefined ? { detail } : {}),
        },
      ];
    }

    case 'agent_thought_chunk': {
      const tc = inner as { content?: unknown };
      const content = tc.content;
      const text =
        content != null && typeof content === 'object' && typeof (content as { text?: unknown }).text === 'string'
          ? (content as { text: string }).text
          : '';
      // Thought chunks carry no per-chunk id; the only stable key on the event
      // is the top-level session id, so consecutive chunks merge into one
      // thinking node (mergeNodeList concatenates `detail`).
      const sessionId =
        typeof (update as { sessionId?: unknown }).sessionId === 'string'
          ? (update as { sessionId: string }).sessionId
          : 'unknown';
      return [{ id: `thinking:${sessionId}`, kind: 'thinking', name: '', status: 'running', detail: text }];
    }

    // The assistant's actual answer prose is NOT an activity node.
    case 'agent_message_chunk':
      return [];

    // Plan / usage / config / commands / user-echo and any unknown update type:
    // not surfaced as activity nodes here. Never throw.
    default:
      return [];
  }
};
