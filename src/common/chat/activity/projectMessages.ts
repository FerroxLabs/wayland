/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #252 observability rework - project the per-turn observability MESSAGES
 * (tool_group, acp_tool_call, sub_agent, activity) into the unified renderer
 * model (ActivityStep[]) that ActivityTimeline consumes.
 *
 * This is where "one timeline, every backend" is realized: a wcore tool_group, a
 * Claude-Code/Codex/Gemini acp_tool_call, a spawned sub_agent card, and the live
 * activity tree all collapse onto the same canonical ActivityNode shape and the
 * same humanized step projection. Pure - no React, no IO; unit-tested.
 */

import type {
  IMessageActivity,
  IMessageAcpToolCall,
  IMessageSubAgent,
  IMessageToolGroup,
  ActivityNode,
} from '../chatLib';
import { nodeToStep, nodesToSteps, type ActivitySource, type ActivityStep } from './activityStep';
import { parseWcoreSearchOutput } from './sources';

/** wcore tool_group item status -> canonical node status. */
const TOOLGROUP_STATUS: Record<string, ActivityNode['status']> = {
  Executing: 'running',
  Pending: 'running',
  Confirming: 'running',
  Success: 'done',
  Error: 'failed',
  Canceled: 'failed',
};

/** ACP tool_call status -> canonical node status. */
const ACP_STATUS: Record<string, ActivityNode['status']> = {
  pending: 'running',
  in_progress: 'running',
  completed: 'done',
  failed: 'failed',
  error: 'failed',
};

/** Pull a human-useful detail string from a tool_group resultDisplay (string, file diff, or image). */
const toolGroupDetail = (rd: IMessageToolGroup['content'][number]['resultDisplay']): string | undefined => {
  if (rd == null) return undefined;
  if (typeof rd === 'string') return rd || undefined;
  if ('fileName' in rd) return rd.fileName;
  if ('relative_path' in rd) return rd.relative_path;
  return undefined;
};

/**
 * Names that identify a web-search tool call. Covers the named variants
 * (`web_search`, `brave_web_search`, ...) AND the bare native wcore tool
 * literally named `web` (operation=search lives in the args, not the name -
 * captured live against Flux 0.12.8). parseWcoreSearchOutput is defensive, so
 * a non-search `web` op simply yields [].
 */
const WEB_SEARCH_RE = /^web$|web[_-]?search|google[_-]?search|search[_-]?web|brave[_-]?search/i;

/**
 * #520 - the humanized command string for a tool item, when the engine gave us
 * one. For an exec/shell tool the actual command lives in the `exec`
 * confirmationDetails (`command`), set at tool_request and preserved through the
 * merge. Fall back to the item `description` (which the wcore mapper carries as
 * "Execute: <cmd>") so a non-exec command-ish tool still surfaces something.
 */
const toolGroupCommand = (t: IMessageToolGroup['content'][number]): string | undefined => {
  if (t.confirmationDetails?.type === 'exec') {
    const cmd = t.confirmationDetails.command?.trim();
    if (cmd) return cmd;
  }
  const desc = typeof t.description === 'string' ? t.description.trim() : '';
  return desc || undefined;
};

/** Map one wcore tool_group message's items to canonical tool nodes. */
export const toolGroupToNodes = (content: IMessageToolGroup['content']): ActivityNode[] =>
  content.map((t) => {
    const detail = toolGroupDetail(t.resultDisplay);
    const command = toolGroupCommand(t);
    const node: ActivityNode = {
      id: t.callId,
      kind: 'tool',
      callId: t.callId,
      name: t.name,
      status: TOOLGROUP_STATUS[t.status] ?? 'running',
      ...(detail ? { detail } : {}),
      ...(command ? { command } : {}),
    };
    if (WEB_SEARCH_RE.test(t.name)) {
      const raw = typeof t.resultDisplay === 'string' ? t.resultDisplay : '';
      const sources = parseWcoreSearchOutput(raw);
      if (sources.length) node.sources = sources;
    }
    return node;
  });

/** Map one ACP tool_call message to a canonical tool node (fields nest under `.update`). */
export const acpToolCallToNode = (content: IMessageAcpToolCall['content']): ActivityNode => {
  const u = content.update;
  // Synthesize an id when a malformed ACP event omits toolCallId, so the call
  // still surfaces as a node instead of vanishing (mirrors innerEvent's genericNode).
  const id = u.toolCallId || `acp:${u.kind ?? 'tool'}:${u.title ?? ''}`;
  return {
    id,
    kind: 'tool',
    callId: id,
    name: u.title ?? '',
    status: ACP_STATUS[u.status] ?? 'running',
  };
};

/**
 * When a sub-agent has finished, settle any still-'running' child node to 'done'
 * so the nested timeline reflects the parent's terminal state - the engine
 * advances the sub-agent ROOT status (info/error) but never re-stamps the child
 * thinking/tool nodes, which would otherwise spin forever after completion.
 */
const settleNodes = (nodes: ActivityNode[]): ActivityNode[] =>
  nodes.map((n) => ({
    ...n,
    status: n.status === 'running' ? 'done' : n.status,
    ...(n.children?.length ? { children: settleNodes(n.children) } : {}),
  }));

/**
 * Project a grouped tool_summary (mixed wcore tool_group + ACP acp_tool_call)
 * into one ordered ActivityStep[] - this REPLACES the old clunky "View Steps".
 */
export const toolSummaryToSteps = (
  messages: Array<IMessageToolGroup | IMessageAcpToolCall>,
  source?: ActivitySource
): ActivityStep[] => {
  const nodes: ActivityNode[] = [];
  for (const m of messages) {
    if (m.type === 'tool_group') nodes.push(...toolGroupToNodes(m.content));
    else nodes.push(acpToolCallToNode(m.content));
  }
  return nodes.map((n) => nodeToStep(n, source));
};

/** Project a spawned sub_agent card (parsed inner subtree) into one sub_agent step. */
export const subAgentToStep = (content: IMessageSubAgent['content'], source?: ActivitySource): ActivityStep => {
  const terminal = content.status === 'done' || content.status === 'failed';
  const children = content.nodes?.length ? (terminal ? settleNodes(content.nodes) : content.nodes) : undefined;
  return nodeToStep(
    {
      id: content.parentCallId,
      kind: 'sub_agent',
      callId: content.parentCallId,
      name: content.agentName,
      status: content.status,
      ...(content.body ? { detail: content.body } : {}),
      ...(children ? { children } : {}),
    },
    source
  );
};

/** Project the live activity-tree card into steps. */
export const activityToSteps = (content: IMessageActivity['content'], source?: ActivitySource): ActivityStep[] =>
  nodesToSteps(content.nodes, source);
