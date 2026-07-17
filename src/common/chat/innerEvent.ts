/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #252 Phase 2 - recursive parser for a sub-agent's inner event stream.
 *
 * A `sub_agent_event` carries an `inner` field that is a *serialized child
 * WCoreEvent* (verified: wcore/index.ts forwards `event.inner` verbatim,
 * WCoreManager forwards it untouched, transformMessage receives it raw). Phase 1
 * only read `inner.type` + `inner.text` and discarded the rest - so a sub-agent's
 * real tool calls, thinking spans and nested sub-agents were lost and the card
 * showed a flat string.
 *
 * This module narrows `inner` against the WCoreEvent union and produces the
 * sub-agent's actual ActivityNode children: child tool lifecycle -> tool node,
 * child thinking/text -> thinking/text node, child tool_chunk -> appended detail,
 * child sub_agent_event -> RECURSE (depth+1) into a nested subtree.
 *
 * Everything is wrapped so a malformed / opaque / too-deep inner falls back to
 * the Phase-1 text-only behavior (read inner.type + inner.text) and nothing
 * regresses. Pure: no React, no engine, no IO - unit-tested in isolation
 * (tests/unit/innerEvent.test.ts).
 *
 * KNOWN LIMIT (flagged as a Core ticket, not invented here): the inner event
 * carries the CHILD's own call_id/msg_id, but `parent_call_id` is only stamped
 * on the OUTER envelope and is NOT re-stamped inside deeper nested inner events.
 * So depth>=2 grouping under concurrent / self-spawning sub-agents is ambiguous.
 * We group best-effort by the child's own ids; deterministic depth-N grouping
 * needs an engine-stamped `agent_run_id`. See the report's Core ticket text.
 */

import type { WCoreEvent } from '@/process/agent/wcore/protocol';
import type { ActivityNode } from './chatLib';

/** Cap recursion so a malformed / cyclic inner can never blow the stack. */
export const MAX_INNER_DEPTH = 5;

/**
 * Result of parsing one inner event:
 *  - `nodes`: the child ActivityNode(s) this inner event contributes (a tool, a
 *    thinking span, an appended chunk target, or a nested sub-agent subtree).
 *  - `text`: any plain text the child emitted (text_delta), for the legacy
 *    `body` accumulation so the existing flat fallback keeps working.
 *  - `lifecycle`: 'done' | 'failed' | undefined - the sub-agent root status
 *    advance (info -> done, error -> failed), exactly as Phase 1 derived it.
 */
export type ParsedInner = {
  nodes: ActivityNode[];
  text: string;
  lifecycle?: 'done' | 'failed';
};

const EMPTY: ParsedInner = { nodes: [], text: '' };

/** Minimal duck-type guard: is this an object with a string `type`? */
const isEvent = (v: unknown): v is { type: string } & Record<string, unknown> =>
  typeof v === 'object' && v !== null && typeof (v as { type?: unknown }).type === 'string';

/**
 * Defensive node for an UNRECOGNIZED inner event - keeps a sub-agent card from
 * ever silently going blank when the engine adds an event type we don't map yet.
 */
const genericNode = (ev: { type: string; call_id?: unknown; msg_id?: unknown }): ActivityNode => {
  const key = typeof ev.call_id === 'string' ? ev.call_id : typeof ev.msg_id === 'string' ? ev.msg_id : '';
  // No synthetic timestamps - we don't actually know the timing, so don't show a
  // bogus "0.0s". Status 'done' (it happened) without inflating a duration row.
  return { id: `evt:${ev.type}:${key}`, kind: 'tool', name: ev.type, status: 'done' };
};

/** Build a browser/cua op node from a child browser_event / cua_event. */
const opNode = (kind: 'browser' | 'cua', callId: string, op: string, summary: string, url?: string): ActivityNode => ({
  id: callId,
  kind,
  callId,
  name: op,
  status: 'done',
  startTime: Date.now(),
  endTime: Date.now(),
  detail: summary + (url ? ` (${url})` : ''),
});

/** Build a tool ActivityNode from a child tool_* event. */
const toolNode = (callId: string, name: string, status: ActivityNode['status'], detail?: string): ActivityNode => ({
  id: callId,
  kind: 'tool',
  callId,
  name,
  status,
  startTime: Date.now(),
  ...(status !== 'running' ? { endTime: Date.now() } : {}),
  ...(detail ? { detail } : {}),
});

/**
 * Parse one serialized inner WCoreEvent into the sub-agent's child node(s).
 *
 * `depth` tracks nested sub_agent_event recursion (NOT call nesting). Any throw,
 * unknown shape, or depth-cap hit yields the safe text-only fallback so the
 * caller can still build the legacy flat card.
 */
export const parseInnerEvent = (inner: unknown, depth = 0): ParsedInner => {
  try {
    if (depth > MAX_INNER_DEPTH) return fallback(inner);
    if (!isEvent(inner)) return fallback(inner);

    // Narrow against the engine union. `inner` is a serialized WCoreEvent.
    const ev = inner as WCoreEvent;
    switch (ev.type) {
      case 'tool_request':
        return { nodes: [toolNode(ev.call_id, ev.tool?.name ?? '', 'running')], text: '' };

      case 'tool_running':
        return { nodes: [toolNode(ev.call_id, ev.tool_name ?? '', 'running')], text: '' };

      case 'tool_result':
        return {
          nodes: [toolNode(ev.call_id, ev.tool_name ?? '', ev.status === 'error' ? 'failed' : 'done', ev.output)],
          text: '',
        };

      case 'tool_cancelled':
        return { nodes: [toolNode(ev.call_id, '', 'failed', ev.reason)], text: '' };

      case 'tool_chunk':
        // Streamed stdout for a child tool: a running tool node whose detail is
        // the chunk. addOrUpdateNode merges it into the matching tool by callId.
        return {
          nodes: [toolNode(ev.call_id, ev.tool_name ?? '', 'running', ev.chunk)],
          text: '',
        };

      case 'thinking':
        return {
          nodes: [
            {
              id: `thinking:${ev.msg_id}`,
              kind: 'thinking',
              name: '',
              status: 'running',
              startTime: Date.now(),
              detail: ev.text ?? '',
            },
          ],
          text: '',
        };

      case 'text_delta':
        // Plain assistant text from the child. Keep feeding the legacy `body`
        // (so the flat fallback render is unchanged) AND surface it as a text
        // node so the drill-down can show the monologue.
        return {
          nodes: [
            {
              id: `text:${ev.msg_id}`,
              kind: 'thinking',
              name: '',
              status: 'running',
              startTime: Date.now(),
              detail: ev.text ?? '',
            },
          ],
          text: ev.text ?? '',
        };

      case 'sub_agent_event': {
        // Nested sub-agent: recurse into ITS inner to build a child subtree.
        const child = parseInnerEvent(ev.inner, depth + 1);
        const nested: ActivityNode = {
          id: `sub:${ev.parent_call_id}`,
          kind: 'sub_agent',
          callId: ev.parent_call_id,
          name: ev.agent_name ?? '',
          status: child.lifecycle === 'failed' ? 'failed' : child.lifecycle === 'done' ? 'done' : 'running',
          startTime: Date.now(),
          children: child.nodes,
          ...(child.text ? { detail: child.text } : {}),
        };
        return { nodes: [nested], text: '' };
      }

      case 'info':
        // Lifecycle: the engine currently signals sub-agent completion via an
        // inner `info` event (no explicit start/end framing - flagged for Core).
        return { nodes: [], text: '', lifecycle: 'done' };

      case 'error':
        return { nodes: [], text: '', lifecycle: 'failed' };

      // A child tool panic is a real failure - surface it as a failed tool node.
      case 'tool_panicked':
        return { nodes: [toolNode(ev.call_id, ev.tool_name ?? '', 'failed', ev.panic_message)], text: '' };

      // Browser / computer-use ops are meaningful drill-down content.
      case 'browser_event':
        return { nodes: [opNode('browser', ev.call_id, ev.op, ev.summary, ev.url)], text: '' };
      case 'cua_event':
        return { nodes: [opNode('cua', ev.call_id, ev.op, ev.summary)], text: '' };

      // Enumerated FRAMING / control events (shipped in protocol.ts) carry no
      // drill-down content - stay empty so the card falls back to body, no noise.
      case 'stream_start':
      case 'stream_end':
      case 'ready':
      case 'pong':
      case 'config_changed':
      case 'mcp_ready':
      case 'mcp_failed':
      case 'session_cost':
      case 'trace_event':
      case 'provider_circuit_event':
      case 'approval_required':
      case 'approval_resume':
      case 'suspend':
      case 'budget_exceeded':
      case 'plugin_registration_failed':
      case 'plugin_event':
      case 'evolution_event':
      case 'browser_policy_denied':
      case 'cua_policy_denied':
        return EMPTY;

      // Defensive (IJFW: never a blank card): a GENUINELY unenumerated inner event
      // type - e.g. a future engine event not yet in protocol.ts - still surfaces
      // as one generic step instead of vanishing. Known types are handled above.
      default:
        return { nodes: [genericNode(ev)], text: '' };
    }
  } catch (e) {
    // Don't silently swallow an unexpected parser bug - log it, then still
    // degrade gracefully to the text-only fallback (no crash, no blank).
    console.error('[parseInnerEvent] failed to parse inner event', e);
    return fallback(inner);
  }
};

/**
 * Phase-1 text-only fallback: read inner.type + inner.text exactly as the old
 * flatten did, so a malformed / opaque / too-deep inner never loses the body or
 * the lifecycle advance.
 */
const fallback = (inner: unknown): ParsedInner => {
  const o = inner as { type?: string; text?: string } | null | undefined;
  const type = o?.type ?? '';
  const lifecycle = type === 'info' ? 'done' : type === 'error' ? 'failed' : undefined;
  const text = type === 'text_delta' ? (o?.text ?? '') : '';
  return { nodes: [], text, ...(lifecycle ? { lifecycle } : {}) };
};
