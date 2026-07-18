/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Fail-closed, backend-neutral projection of one canonical chat run into the
 * data the Cockpit Progress / Outputs / Context rail needs. This module owns no
 * runtime state and creates no facts. Callers must identify the expected run;
 * evidence for any other conversation, turn, or session is rejected.
 */

import type { ActivityNode, ActivityTurnCost, IMessageCodexToolCall, IMessageToolCall, TMessage } from '../chatLib';
import { nodeToStep, type ActivitySource, type ActivityStep } from './activityStep';
import { acpToolCallToNode, subAgentToStep, toolGroupToNodes } from './projectMessages';
import { codexResultsToSources, type Source } from './sources';

export type RunIdentity = {
  readonly conversationId: string;
  readonly turnId: string;
  readonly sessionId?: string;
};

export type RunStatus = 'unknown' | 'running' | 'done' | 'failed' | 'conflicted';
export type RunReferenceState = 'proposed' | 'in_progress' | 'materialized' | 'failed';

export type RunActivityStep = Omit<ActivityStep, 'children' | 'source'> & {
  readonly source?: ActivitySource;
  readonly provenance: readonly ActivitySource[];
  readonly children?: readonly RunActivityStep[];
};

export type RunProgressItem = {
  readonly label: string;
  readonly status: 'pending' | 'in_progress' | 'completed';
  readonly priority?: 'low' | 'medium' | 'high';
};

export type RunProgress =
  | { readonly availability: 'unavailable' }
  | {
      readonly availability: 'available';
      readonly authority: 'canonical_plan';
      readonly items: readonly RunProgressItem[];
      readonly completed: number;
      readonly total: number;
      readonly ratio: number | null;
      readonly current: RunProgressItem | null;
    };

export type RunOutputReference = {
  readonly id: string;
  readonly kind: 'file' | 'image' | 'diff';
  readonly path?: string;
  readonly label: string;
  readonly state: RunReferenceState;
  readonly source: ActivitySource;
  readonly provenance: readonly ActivitySource[];
};

export type RunContextReference = {
  readonly id: string;
  readonly kind: 'url' | 'file';
  readonly value: string;
  readonly title?: string;
  readonly source: ActivitySource;
  readonly provenance: readonly ActivitySource[];
};

export type RunPendingPermission = {
  readonly id: string;
  readonly title: string;
  readonly kind?: string;
  readonly source: 'acp' | 'codex';
};

export type RunRouteFact = {
  readonly id: string;
  readonly provider: string;
  readonly detail?: string;
  readonly status: ActivityNode['status'];
};

export type RunCost =
  | { readonly availability: 'unavailable' }
  | {
      readonly availability: 'available';
      /** UI projection provenance only; this is not a billing/provider receipt. */
      readonly authority: 'chat_activity_only';
      readonly amountUsd: number;
      readonly rows: readonly ActivityTurnCost[];
    };

export type RunUsage = { readonly availability: 'unavailable' };

export type RunIntegrityIssueCode =
  | 'invalid_run_identity'
  | 'cross_run_evidence'
  | 'blank_identity'
  | 'terminal_conflict'
  | 'terminal_with_running_activity'
  | 'post_terminal_event'
  | 'duplicate_terminal_conflict'
  | 'terminal_regression'
  | 'invalid_cost_evidence'
  | 'cost_aggregation_overflow'
  | 'duplicate_cost_conflict'
  | 'duplicate_route_conflict'
  | 'missing_permission_identity'
  | 'permission_conflict'
  | 'output_lifecycle_regression'
  | 'output_lifecycle_conflict'
  | 'multiple_current_plan_items'
  | 'invalid_plan_item'
  | 'message_limit_exceeded'
  | 'reference_limit_exceeded'
  | 'plan_entry_limit_exceeded'
  | 'source_limit_exceeded'
  | 'activity_depth_exceeded'
  | 'activity_node_limit_exceeded';

export type RunIntegrityIssue = {
  readonly code: RunIntegrityIssueCode;
  readonly messageId?: string;
  readonly detail: string;
};

export type RunSnapshot = {
  readonly identity: RunIdentity;
  readonly status: RunStatus;
  readonly currentStep: RunActivityStep | null;
  readonly progress: RunProgress;
  readonly activity: readonly RunActivityStep[];
  readonly outputs: readonly RunOutputReference[];
  readonly context: readonly RunContextReference[];
  readonly pendingPermissions: readonly RunPendingPermission[];
  readonly usage: RunUsage;
  readonly cost: RunCost;
  readonly routeFacts: readonly RunRouteFact[];
  readonly integrity: {
    readonly state: 'valid' | 'invalid';
    readonly issues: readonly RunIntegrityIssue[];
  };
};

type TerminalOutcome = 'done' | 'failed';

export const MAX_RUN_ACTIVITY_DEPTH = 16;
export const MAX_RUN_ACTIVITY_NODES = 2048;
export const MAX_RUN_MESSAGES = 4096;
export const MAX_RUN_REFERENCES = 2048;
export const MAX_RUN_PLAN_ENTRIES = 512;
export const MAX_RUN_SOURCES = 2048;
export const MAX_RUN_COST_ROWS = 2048;
const TERMINAL_STEP = new Set<ActivityNode['status']>(['done', 'failed']);
const SOURCE_ORDER: readonly ActivitySource[] = ['wcore', 'acp', 'codex', 'gemini'];

/** Freeze only the projection-owned graph, iteratively to avoid stack failure. */
const freezeOwned = <T>(value: T): T => {
  const pending: object[] = [];
  if (value !== null && typeof value === 'object') pending.push(value as object);
  while (pending.length) {
    const item = pending.pop();
    if (!item || Object.isFrozen(item)) continue;
    for (const child of Object.values(item)) {
      if (child !== null && typeof child === 'object' && !Object.isFrozen(child)) pending.push(child);
    }
    Object.freeze(item);
  }
  return value;
};

const clean = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const sortedProvenance = (values: Iterable<ActivitySource>): ActivitySource[] => {
  const found = new Set(values);
  return SOURCE_ORDER.filter((source) => found.has(source));
};

const cloneSource = (source: Source): Source => ({
  ...(source.title != null ? { title: source.title } : {}),
  ...(source.url != null ? { url: source.url } : {}),
  ...(source.domain != null ? { domain: source.domain } : {}),
  ...(source.favicon != null ? { favicon: source.favicon } : {}),
  ...(source.snippet != null ? { snippet: source.snippet } : {}),
});

const cloneStep = (step: ActivityStep, inherited?: ActivitySource): RunActivityStep => {
  const source = step.source ?? inherited;
  const provenance = source ? [source] : [];
  return {
    id: `${source ?? 'local'}:${step.id}`,
    kind: step.kind,
    glyph: step.glyph,
    label: step.label,
    status: step.status,
    ...(step.startTime != null ? { startTime: step.startTime } : {}),
    ...(step.endTime != null ? { endTime: step.endTime } : {}),
    ...(step.detail != null ? { detail: step.detail } : {}),
    ...(step.agent != null ? { agent: step.agent } : {}),
    ...(source ? { source } : {}),
    provenance,
    ...(step.sources?.length ? { sources: step.sources.map(cloneSource) } : {}),
    ...(step.children?.length ? { children: step.children.map((child) => cloneStep(child, source)) } : {}),
  };
};

const validateNodeForest = (
  roots: readonly ActivityNode[],
  issues: RunIntegrityIssue[],
  budget: { count: number; sources: number },
  messageId?: string,
  initialDepth = 1
): boolean => {
  if (roots.length > MAX_RUN_ACTIVITY_NODES - budget.count) {
    issues.push({
      code: 'activity_node_limit_exceeded',
      messageId,
      detail: `Activity evidence exceeds ${MAX_RUN_ACTIVITY_NODES} nodes`,
    });
    return false;
  }
  const stack: Array<{ node: ActivityNode; depth: number }> = [];
  for (let index = roots.length - 1; index >= 0; index -= 1) stack.push({ node: roots[index], depth: initialDepth });
  while (stack.length) {
    const current = stack.pop();
    if (!current) break;
    budget.count += 1;
    if (budget.count > MAX_RUN_ACTIVITY_NODES) {
      issues.push({
        code: 'activity_node_limit_exceeded',
        messageId,
        detail: `Activity evidence exceeds ${MAX_RUN_ACTIVITY_NODES} nodes`,
      });
      return false;
    }
    if (current.depth > MAX_RUN_ACTIVITY_DEPTH) {
      issues.push({
        code: 'activity_depth_exceeded',
        messageId,
        detail: `Activity evidence exceeds depth ${MAX_RUN_ACTIVITY_DEPTH}`,
      });
      return false;
    }
    if (!clean(current.node.id)) {
      issues.push({ code: 'blank_identity', messageId, detail: 'Activity node has a blank id' });
      return false;
    }
    const sourceCount = current.node.sources?.length ?? 0;
    if (budget.sources + sourceCount > MAX_RUN_SOURCES) {
      issues.push({
        code: 'source_limit_exceeded',
        messageId,
        detail: `Activity evidence exceeds ${MAX_RUN_SOURCES} sources`,
      });
      return false;
    }
    budget.sources += sourceCount;
    const children = current.node.children ?? [];
    if (children.length > MAX_RUN_ACTIVITY_NODES - budget.count) {
      issues.push({
        code: 'activity_node_limit_exceeded',
        messageId,
        detail: `Activity evidence exceeds ${MAX_RUN_ACTIVITY_NODES} nodes`,
      });
      return false;
    }
    for (let index = children.length - 1; index >= 0; index -= 1) {
      stack.push({ node: children[index], depth: current.depth + 1 });
    }
  }
  return true;
};

const consumeNodeBudget = (
  budget: { count: number; sources: number },
  issues: RunIntegrityIssue[],
  messageId?: string
): boolean => {
  budget.count += 1;
  if (budget.count <= MAX_RUN_ACTIVITY_NODES) return true;
  issues.push({
    code: 'activity_node_limit_exceeded',
    messageId,
    detail: `Activity evidence exceeds ${MAX_RUN_ACTIVITY_NODES} nodes`,
  });
  return false;
};

const terminalFromMessage = (message: TMessage): TerminalOutcome | null => {
  if (message.type === 'activity' && message.content.status !== 'running') return message.content.status;
  if (message.type === 'text' && message.position !== 'right') {
    if (message.status === 'finish') return 'done';
    if (message.status === 'error') return 'failed';
  }
  return null;
};

/** Serialize only bounded, allowlisted projection-owned values. Caller graphs are never serialized. */
const canonicalStepForSignature = (step: RunActivityStep): Record<string, unknown> => ({
  id: clean(step.id),
  kind: typeof step.kind === 'string' ? step.kind : null,
  glyph: typeof step.glyph === 'string' ? step.glyph : null,
  label: typeof step.label === 'string' ? step.label : null,
  status: typeof step.status === 'string' ? step.status : null,
  startTime: Number.isFinite(step.startTime) ? step.startTime : null,
  endTime: Number.isFinite(step.endTime) ? step.endTime : null,
  detail: typeof step.detail === 'string' ? step.detail : null,
  agent: typeof step.agent === 'string' ? step.agent : null,
  source: typeof step.source === 'string' ? step.source : null,
  provenance: step.provenance.filter((source): source is ActivitySource => typeof source === 'string'),
  sources: (step.sources ?? []).map((source) => ({
    title: typeof source.title === 'string' ? source.title : null,
    url: typeof source.url === 'string' ? source.url : null,
    domain: typeof source.domain === 'string' ? source.domain : null,
    favicon: typeof source.favicon === 'string' ? source.favicon : null,
    snippet: typeof source.snippet === 'string' ? source.snippet : null,
  })),
  children: (step.children ?? []).map(canonicalStepForSignature),
});

const terminalSignature = (
  message: TMessage,
  outcome: TerminalOutcome,
  projectedSteps: readonly RunActivityStep[]
): string => {
  const costRows =
    message.type === 'activity'
      ? (message.content.perTurnCost ?? []).map((row) => ({
          turn: typeof row.turn === 'number' && Number.isSafeInteger(row.turn) ? row.turn : null,
          model: typeof row.model === 'string' ? clean(row.model) : null,
          provider: typeof row.provider === 'string' ? clean(row.provider) : null,
          costUsd:
            typeof row.costUsd === 'number' && Number.isFinite(row.costUsd)
              ? row.costUsd
              : typeof row.costUsd === 'number' && Number.isNaN(row.costUsd)
                ? 'nan'
                : typeof row.costUsd === 'number' && row.costUsd === Number.POSITIVE_INFINITY
                  ? 'positive_infinity'
                  : typeof row.costUsd === 'number' && row.costUsd === Number.NEGATIVE_INFINITY
                    ? 'negative_infinity'
                    : null,
        }))
      : [];
  const owned = {
    type: message.type,
    id: clean(message.id),
    msgId: clean(message.msg_id),
    conversationId: clean(message.conversation_id),
    outcome,
    turnId: message.type === 'activity' ? message.content.turnId : undefined,
    position: message.type === 'text' ? message.position : undefined,
    text: message.type === 'text' && typeof message.content.content === 'string' ? message.content.content : undefined,
    steps: projectedSteps.map(canonicalStepForSignature),
    costRows,
  };
  return JSON.stringify(owned);
};

const explicitSession = (message: TMessage): string | undefined => {
  if (message.type === 'plan' || message.type === 'acp_permission' || message.type === 'acp_tool_call') {
    return message.content.sessionId;
  }
  if (message.type === 'codex_permission') return message.content.sessionId;
  return undefined;
};

const belongsToRun = (identity: RunIdentity, message: TMessage, issues: RunIntegrityIssue[]): boolean => {
  const conversation = clean(message.conversation_id);
  if (!conversation) {
    issues.push({ code: 'blank_identity', messageId: message.msg_id, detail: 'Message conversation id is blank' });
    return false;
  }
  if (conversation !== identity.conversationId) {
    issues.push({
      code: 'cross_run_evidence',
      messageId: message.msg_id,
      detail: 'Message belongs to another conversation',
    });
    return false;
  }

  const rawTurn = message.type === 'activity' ? message.content.turnId : message.msg_id;
  const turn = clean(rawTurn);
  if (rawTurn != null && !turn) {
    issues.push({ code: 'blank_identity', messageId: message.msg_id, detail: 'Message turn id is blank' });
    return false;
  }
  const rawSession = explicitSession(message);
  const session = clean(rawSession);
  if (rawSession != null && !session) {
    issues.push({ code: 'blank_identity', messageId: message.msg_id, detail: 'Message session id is blank' });
    return false;
  }
  if (turn && turn !== identity.turnId) {
    issues.push({ code: 'cross_run_evidence', messageId: message.msg_id, detail: 'Message belongs to another turn' });
    return false;
  }
  if (identity.sessionId && session && session !== identity.sessionId) {
    issues.push({
      code: 'cross_run_evidence',
      messageId: message.msg_id,
      detail: 'Message belongs to another session',
    });
    return false;
  }
  if (!turn) {
    issues.push({
      code: 'cross_run_evidence',
      messageId: message.msg_id,
      detail: 'Message cannot prove membership in the expected run',
    });
    return false;
  }
  return true;
};

const codexStatus = (message: IMessageCodexToolCall): ActivityNode['status'] => {
  if (message.content.status === 'success') return 'done';
  if (message.content.status === 'error' || message.content.status === 'canceled') return 'failed';
  return 'running';
};

const geminiStatus = (message: IMessageToolCall): ActivityNode['status'] => {
  if (message.content.status === 'success') return 'done';
  if (message.content.status === 'error' || message.content.error) return 'failed';
  return 'running';
};

const messageToSteps = (
  message: TMessage,
  issues: RunIntegrityIssue[],
  nodeBudget: { count: number; sources: number }
): RunActivityStep[] => {
  let steps: ActivityStep[] = [];
  if (message.type === 'activity') {
    if (!validateNodeForest(message.content.nodes, issues, nodeBudget, message.msg_id)) return [];
    steps = message.content.nodes.map((node) => nodeToStep(node, 'wcore'));
  } else if (message.type === 'tool_group') {
    if (message.content.length > MAX_RUN_ACTIVITY_NODES - nodeBudget.count) {
      issues.push({
        code: 'activity_node_limit_exceeded',
        messageId: message.msg_id,
        detail: `Activity evidence exceeds ${MAX_RUN_ACTIVITY_NODES} nodes`,
      });
      return [];
    }
    if (message.content.some((tool) => !clean(tool.callId))) {
      issues.push({ code: 'blank_identity', messageId: message.msg_id, detail: 'WCore tool-call id is blank' });
      return [];
    }
    const nodes = toolGroupToNodes(message.content);
    if (!validateNodeForest(nodes, issues, nodeBudget, message.msg_id)) return [];
    steps = nodes.map((node) => nodeToStep(node, 'wcore'));
  } else if (message.type === 'acp_tool_call') {
    if (!clean(message.content.update.toolCallId)) {
      issues.push({ code: 'blank_identity', messageId: message.msg_id, detail: 'ACP tool-call id is blank' });
      return [];
    }
    const node = acpToolCallToNode(message.content);
    if (!validateNodeForest([node], issues, nodeBudget, message.msg_id)) return [];
    steps = [nodeToStep(node, 'acp')];
  } else if (message.type === 'codex_tool_call') {
    const id = clean(message.content.toolCallId);
    if (!id) {
      issues.push({ code: 'blank_identity', messageId: message.msg_id, detail: 'Codex tool-call id is blank' });
      return [];
    }
    if (!consumeNodeBudget(nodeBudget, issues, message.msg_id)) return [];
    steps = [
      nodeToStep(
        {
          id,
          callId: id,
          kind: 'tool',
          name: message.content.title ?? message.content.kind,
          status: codexStatus(message),
          startTime: message.content.startTime,
          endTime: message.content.endTime,
        },
        'codex'
      ),
    ];
  } else if (message.type === 'tool_call') {
    const id = clean(message.content.callId);
    if (!id) {
      issues.push({ code: 'blank_identity', messageId: message.msg_id, detail: 'Gemini tool-call id is blank' });
      return [];
    }
    if (!consumeNodeBudget(nodeBudget, issues, message.msg_id)) return [];
    steps = [
      nodeToStep(
        {
          id,
          callId: id,
          kind: 'tool',
          name: message.content.name,
          status: geminiStatus(message),
          ...(message.content.error ? { detail: message.content.error } : {}),
        },
        'gemini'
      ),
    ];
  } else if (message.type === 'sub_agent') {
    const id = clean(message.content.parentCallId);
    if (!id) {
      issues.push({ code: 'blank_identity', messageId: message.msg_id, detail: 'Sub-agent id is blank' });
      return [];
    }
    if (!consumeNodeBudget(nodeBudget, issues, message.msg_id)) return [];
    if (!validateNodeForest(message.content.nodes ?? [], issues, nodeBudget, message.msg_id, 2)) {
      return [];
    }
    steps = [subAgentToStep(message.content, 'wcore')];
  } else if (message.type === 'thinking') {
    if (!consumeNodeBudget(nodeBudget, issues, message.msg_id)) return [];
    steps = [
      nodeToStep(
        {
          id: `thinking:${message.msg_id ?? message.id}`,
          kind: 'thinking',
          name: message.content.subject ?? '',
          status: message.content.status === 'done' ? 'done' : 'running',
          detail: message.content.content,
        },
        undefined
      ),
    ];
  }
  return steps.map((step) => cloneStep(step));
};

const mergeSources = (left: readonly Source[] = [], right: readonly Source[] = []): Source[] => {
  const byKey = new Map<string, Source>();
  for (const source of [...left, ...right]) {
    const key = JSON.stringify([source.url ?? '', source.title ?? '', source.snippet ?? '']);
    if (!byKey.has(key)) byKey.set(key, cloneSource(source));
  }
  return [...byKey.entries()].toSorted(([a], [b]) => a.localeCompare(b)).map(([, source]) => source);
};

const mergeStepLists = (
  previous: readonly RunActivityStep[],
  incoming: readonly RunActivityStep[],
  issues: RunIntegrityIssue[],
  messageId?: string,
  path = ''
): RunActivityStep[] => {
  const result = previous.map((step) => step);
  const indices = new Map(result.map((step, index) => [step.id, index]));
  for (const next of incoming) {
    const index = indices.get(next.id);
    if (index == null) {
      indices.set(next.id, result.length);
      result.push(next);
      continue;
    }
    const prior = result[index];
    const key = path ? `${path}/${next.id}` : next.id;
    if (TERMINAL_STEP.has(prior.status) && next.status === 'running') {
      issues.push({
        code: 'terminal_regression',
        messageId,
        detail: `Activity ${key} regressed from ${prior.status} to running`,
      });
      continue;
    }
    if (TERMINAL_STEP.has(prior.status) && TERMINAL_STEP.has(next.status) && prior.status !== next.status) {
      issues.push({
        code: 'duplicate_terminal_conflict',
        messageId,
        detail: `Activity ${key} has conflicting terminal states ${prior.status} and ${next.status}`,
      });
      continue;
    }
    const provenance = sortedProvenance([...prior.provenance, ...next.provenance]);
    const children = mergeStepLists(prior.children ?? [], next.children ?? [], issues, messageId, key);
    result[index] = {
      id: prior.id,
      kind: next.kind,
      glyph: next.glyph,
      label: next.label || prior.label,
      status: next.status,
      ...((next.startTime ?? prior.startTime) != null ? { startTime: next.startTime ?? prior.startTime } : {}),
      ...((next.endTime ?? prior.endTime) != null ? { endTime: next.endTime ?? prior.endTime } : {}),
      ...((next.detail ?? prior.detail) != null ? { detail: next.detail ?? prior.detail } : {}),
      ...((next.agent ?? prior.agent) != null ? { agent: next.agent ?? prior.agent } : {}),
      ...(provenance[0] ? { source: provenance[0] } : {}),
      provenance,
      ...(children.length ? { children } : {}),
      ...(prior.sources?.length || next.sources?.length ? { sources: mergeSources(prior.sources, next.sources) } : {}),
    };
  }
  return result;
};

const findRunning = (steps: readonly RunActivityStep[]): RunActivityStep | null => {
  let found: RunActivityStep | null = null;
  for (const step of steps) {
    const descendant = step.children?.length ? findRunning(step.children) : null;
    if (descendant) found = descendant;
    else if (step.status === 'running') found = step;
  }
  return found;
};

const findLast = (steps: readonly RunActivityStep[]): RunActivityStep | null => {
  let last: RunActivityStep | null = null;
  for (const step of steps) last = step.children?.length ? (findLast(step.children) ?? step) : step;
  return last;
};

const pickCurrent = (steps: readonly RunActivityStep[]): RunActivityStep | null =>
  findRunning(steps) ?? findLast(steps);

const hasRunningStep = (steps: readonly RunActivityStep[]): boolean => findRunning(steps) !== null;

type ProjectionBudget = { count: number; sources: number; references: number };

const reserveReference = (
  isNew: boolean,
  budget: ProjectionBudget,
  issues: RunIntegrityIssue[],
  messageId?: string
): boolean => {
  if (!isNew) return true;
  budget.references += 1;
  if (budget.references <= MAX_RUN_REFERENCES) return true;
  issues.push({
    code: 'reference_limit_exceeded',
    messageId,
    detail: `Run evidence exceeds ${MAX_RUN_REFERENCES} references`,
  });
  return false;
};

const addContext = (
  map: Map<string, RunContextReference>,
  key: string,
  incoming: RunContextReference,
  budget: ProjectionBudget,
  issues: RunIntegrityIssue[],
  messageId?: string
): void => {
  const previous = map.get(key);
  if (!reserveReference(!previous, budget, issues, messageId)) return;
  if (!previous) {
    map.set(key, incoming);
    return;
  }
  const provenance = sortedProvenance([...previous.provenance, ...incoming.provenance]);
  const title = [clean(previous.title), clean(incoming.title)]
    .filter((value): value is string => value != null)
    .toSorted()[0];
  map.set(key, {
    ...previous,
    ...(title ? { title } : {}),
    source: provenance[0] ?? previous.source,
    provenance,
  });
};

const sourceToContext = (
  source: Source,
  activitySource: ActivitySource,
  context: Map<string, RunContextReference>,
  budget: ProjectionBudget,
  issues: RunIntegrityIssue[],
  messageId?: string
): void => {
  const url = clean(source.url);
  if (!url) return;
  const key = `url:${url}`;
  addContext(
    context,
    key,
    {
      id: key,
      kind: 'url',
      value: url,
      ...(source.title ? { title: source.title } : {}),
      source: activitySource,
      provenance: [activitySource],
    },
    budget,
    issues,
    messageId
  );
};

const collectStepSources = (
  steps: readonly RunActivityStep[],
  context: Map<string, RunContextReference>,
  budget: ProjectionBudget,
  issues: RunIntegrityIssue[],
  messageId?: string
): void => {
  const stack = [...steps];
  let upperBound = 0;
  for (let index = 0; index < stack.length; index += 1) {
    const step = stack[index];
    upperBound += step.sources?.length ?? 0;
    for (const child of step.children ?? []) stack.push(child);
  }
  if (upperBound > MAX_RUN_REFERENCES - budget.references) {
    issues.push({
      code: 'reference_limit_exceeded',
      messageId,
      detail: `Run evidence exceeds ${MAX_RUN_REFERENCES} references`,
    });
    return;
  }
  stack.splice(0, stack.length, ...steps);
  while (stack.length) {
    const step = stack.pop();
    if (!step) break;
    const source = step.source ?? 'wcore';
    for (const item of step.sources ?? []) sourceToContext(item, source, context, budget, issues, messageId);
    for (const child of step.children ?? []) stack.push(child);
  }
};

const toolGroupReferenceState = (status: string): RunReferenceState => {
  if (status === 'Success') return 'materialized';
  if (status === 'Error' || status === 'Canceled') return 'failed';
  if (status === 'Executing') return 'in_progress';
  return 'proposed';
};

const acpReferenceState = (status: string | undefined): RunReferenceState => {
  if (status === 'completed') return 'materialized';
  if (status === 'failed' || status === 'error') return 'failed';
  if (status === 'in_progress') return 'in_progress';
  return 'proposed';
};

const codexReferenceState = (status: string): RunReferenceState => {
  if (status === 'success') return 'materialized';
  if (status === 'error' || status === 'canceled') return 'failed';
  if (status === 'executing') return 'in_progress';
  return 'proposed';
};

const addOutput = (
  map: Map<string, RunOutputReference>,
  incoming: RunOutputReference,
  budget: ProjectionBudget,
  issues: RunIntegrityIssue[],
  messageId?: string
): void => {
  const id = `${incoming.source}:${incoming.id}`;
  const scoped = { ...incoming, id };
  const previous = map.get(id);
  if (!reserveReference(!previous, budget, issues, messageId)) return;
  if (!previous) {
    map.set(id, scoped);
    return;
  }
  const previousTerminal = previous.state === 'materialized' || previous.state === 'failed';
  const incomingTerminal = incoming.state === 'materialized' || incoming.state === 'failed';
  if (previousTerminal && !incomingTerminal) {
    issues.push({
      code: 'output_lifecycle_regression',
      messageId,
      detail: `Output ${id} regressed from ${previous.state} to ${incoming.state}`,
    });
    return;
  }
  if (previousTerminal && incomingTerminal && previous.state !== incoming.state) {
    issues.push({
      code: 'output_lifecycle_conflict',
      messageId,
      detail: `Output ${id} has conflicting terminal lifecycle states`,
    });
    return;
  }
  const rank: Record<RunReferenceState, number> = { proposed: 0, in_progress: 1, materialized: 2, failed: 2 };
  if (rank[incoming.state] < rank[previous.state]) {
    issues.push({
      code: 'output_lifecycle_regression',
      messageId,
      detail: `Output ${id} regressed from ${previous.state} to ${incoming.state}`,
    });
    return;
  }
  map.set(id, scoped);
};

const collectReferences = (
  message: TMessage,
  outputs: Map<string, RunOutputReference>,
  context: Map<string, RunContextReference>,
  budget: ProjectionBudget,
  issues: RunIntegrityIssue[]
): void => {
  if (message.type === 'tool_group') {
    const upperBound = message.content.reduce((count, tool) => {
      const result = tool.resultDisplay;
      const hasOutput =
        (result && typeof result === 'object' && 'fileName' in result && Boolean(result.fileName)) ||
        (result && typeof result === 'object' && 'relative_path' in result && Boolean(result.relative_path)) ||
        (tool.confirmationDetails?.type === 'edit' && Boolean(tool.confirmationDetails.fileName));
      const urls = tool.confirmationDetails?.type === 'info' ? (tool.confirmationDetails.urls?.length ?? 0) : 0;
      return count + (hasOutput ? 1 : 0) + urls;
    }, 0);
    if (upperBound > MAX_RUN_REFERENCES - budget.references) {
      issues.push({
        code: 'reference_limit_exceeded',
        messageId: message.msg_id,
        detail: `Run evidence exceeds ${MAX_RUN_REFERENCES} references`,
      });
      return;
    }
    for (const tool of message.content) {
      const state = toolGroupReferenceState(tool.status);
      const result = tool.resultDisplay;
      const candidate =
        result && typeof result === 'object' && 'fileName' in result && result.fileName
          ? { kind: 'diff' as const, path: result.fileName }
          : result && typeof result === 'object' && 'relative_path' in result && result.relative_path
            ? { kind: 'image' as const, path: result.relative_path }
            : tool.confirmationDetails?.type === 'edit' && tool.confirmationDetails.fileName
              ? { kind: 'file' as const, path: tool.confirmationDetails.fileName }
              : null;
      if (candidate) {
        const id = `${candidate.kind}:${candidate.path}`;
        addOutput(
          outputs,
          { id, ...candidate, label: candidate.path, state, source: 'wcore', provenance: ['wcore'] },
          budget,
          issues,
          message.msg_id
        );
      }
      if (tool.confirmationDetails?.type === 'info') {
        for (const rawUrl of tool.confirmationDetails.urls ?? []) {
          const url = clean(rawUrl);
          if (url) sourceToContext({ url }, 'wcore', context, budget, issues, message.msg_id);
        }
      }
    }
  } else if (message.type === 'acp_tool_call') {
    const remaining = MAX_RUN_REFERENCES - budget.references;
    let upperBound = message.content.update.locations?.length ?? 0;
    if (upperBound <= remaining) {
      for (const item of message.content.update.content ?? []) {
        if (item.type === 'diff') upperBound += 1;
        if (upperBound > remaining) break;
      }
    }
    if (upperBound > remaining) {
      issues.push({
        code: 'reference_limit_exceeded',
        messageId: message.msg_id,
        detail: `Run evidence exceeds ${MAX_RUN_REFERENCES} references`,
      });
      return;
    }
    const state = acpReferenceState(message.content.update.status);
    for (const location of message.content.update.locations ?? []) {
      const path = clean(location.path);
      if (path) {
        const key = `file:${path}`;
        addContext(
          context,
          key,
          { id: key, kind: 'file', value: path, source: 'acp', provenance: ['acp'] },
          budget,
          issues,
          message.msg_id
        );
      }
    }
    for (const item of message.content.update.content ?? []) {
      const path = item.type === 'diff' ? clean(item.path) : null;
      if (path)
        addOutput(
          outputs,
          { id: `diff:${path}`, kind: 'diff', path, label: path, state, source: 'acp', provenance: ['acp'] },
          budget,
          issues,
          message.msg_id
        );
    }
  } else if (message.type === 'codex_tool_call') {
    const remaining = MAX_RUN_REFERENCES - budget.references;
    const changes = message.content.subtype === 'patch_apply_begin' ? (message.content.data.changes ?? {}) : {};
    let upperBound = message.content.content?.length ?? 0;
    if (upperBound <= remaining) {
      for (const path in changes) {
        if (!Object.prototype.hasOwnProperty.call(changes, path)) continue;
        upperBound += 1;
        if (upperBound > remaining) break;
      }
    }
    if (upperBound > remaining) {
      issues.push({
        code: 'reference_limit_exceeded',
        messageId: message.msg_id,
        detail: `Run evidence exceeds ${MAX_RUN_REFERENCES} references`,
      });
      return;
    }
    const state = codexReferenceState(message.content.status);
    for (const item of message.content.content ?? []) {
      const path = clean(item.filePath);
      if (path)
        addOutput(
          outputs,
          {
            id: `diff:${path}`,
            kind: item.type === 'diff' ? 'diff' : 'file',
            path,
            label: path,
            state,
            source: 'codex',
            provenance: ['codex'],
          },
          budget,
          issues,
          message.msg_id
        );
    }
    const data = message.content.data;
    if (message.content.subtype === 'patch_apply_begin') {
      for (const rawPath in changes) {
        if (!Object.prototype.hasOwnProperty.call(changes, rawPath)) continue;
        const path = clean(rawPath);
        if (path)
          addOutput(
            outputs,
            { id: `diff:${path}`, kind: 'diff', path, label: path, state, source: 'codex', provenance: ['codex'] },
            budget,
            issues,
            message.msg_id
          );
      }
    } else if (message.content.subtype === 'web_search_end') {
      const results = data.results ?? [];
      if (budget.sources + results.length > MAX_RUN_SOURCES) {
        issues.push({
          code: 'source_limit_exceeded',
          messageId: message.msg_id,
          detail: `Run evidence exceeds ${MAX_RUN_SOURCES} sources`,
        });
        return;
      }
      budget.sources += results.length;
      for (const source of codexResultsToSources(results)) {
        sourceToContext(source, 'codex', context, budget, issues, message.msg_id);
      }
    }
  }
};

type PendingPermissionProjection = { key: string; value: RunPendingPermission };

const permissionFromMessage = (message: TMessage): PendingPermissionProjection | null => {
  if (message.type === 'acp_permission') {
    const id = clean(message.content.toolCall?.toolCallId);
    if (!id) return null;
    return {
      key: `acp:${id}`,
      value: {
        id,
        title:
          message.content.toolCall.title ?? message.content.toolCall.rawInput?.description ?? 'Permission required',
        kind: message.content.toolCall.kind,
        source: 'acp',
      },
    };
  }
  if (message.type === 'codex_permission') {
    const callId = clean(message.content.data.call_id);
    const requestId = clean(message.content.requestId);
    if (!callId || !requestId) return null;
    return {
      key: `codex:${callId}`,
      value: {
        id: requestId,
        title: message.content.title ?? message.content.description ?? 'Permission required',
        kind: message.content.subtype,
        source: 'codex',
      },
    };
  }
  return null;
};

const resolvedPermissionKey = (message: TMessage): string | null => {
  if (message.type === 'acp_tool_call' && message.content.update.status !== 'pending') {
    const id = clean(message.content.update.toolCallId);
    return id ? `acp:${id}` : null;
  }
  if (message.type === 'codex_tool_call' && message.content.status !== 'pending') {
    const id = clean(message.content.toolCallId);
    return id ? `codex:${id}` : null;
  }
  return null;
};

const samePermission = (left: RunPendingPermission, right: RunPendingPermission): boolean =>
  left.id === right.id && left.title === right.title && left.kind === right.kind && left.source === right.source;

const collectRouteFacts = (
  nodes: readonly ActivityNode[],
  routeFacts: Map<string, RunRouteFact>,
  conflicts: Set<string>,
  issues: RunIntegrityIssue[],
  messageId?: string
): void => {
  const stack = [...nodes];
  while (stack.length) {
    const node = stack.pop();
    if (!node) break;
    if (node.kind === 'circuit') {
      const id = clean(node.id);
      const provider = clean(node.name);
      if (!id || !provider) {
        issues.push({ code: 'blank_identity', messageId, detail: 'Route fact has a blank id or provider' });
      } else {
        const incoming: RunRouteFact = { id, provider, detail: node.detail, status: node.status };
        const prior = routeFacts.get(id);
        if (
          prior &&
          (prior.provider !== incoming.provider || prior.detail !== incoming.detail || prior.status !== incoming.status)
        ) {
          if (!conflicts.has(id))
            issues.push({ code: 'duplicate_route_conflict', messageId, detail: `Route fact ${id} conflicts` });
          conflicts.add(id);
          routeFacts.delete(id);
        } else if (!conflicts.has(id)) routeFacts.set(id, incoming);
      }
    }
    for (const child of node.children ?? []) stack.push(child);
  }
};

const progressFromMessages = (messages: readonly TMessage[], issues: RunIntegrityIssue[]): RunProgress => {
  const plan = messages.toReversed().find((message) => message.type === 'plan');
  if (!plan || plan.type !== 'plan') return { availability: 'unavailable' };
  const items: RunProgressItem[] = [];
  for (const entry of plan.content.entries) {
    const label = clean(entry.content);
    if (!label) {
      issues.push({ code: 'invalid_plan_item', messageId: plan.msg_id, detail: 'Plan item label is blank' });
      return { availability: 'unavailable' };
    }
    items.push({ label, status: entry.status, ...(entry.priority ? { priority: entry.priority } : {}) });
  }
  const current = items.filter((item) => item.status === 'in_progress');
  if (current.length > 1) {
    issues.push({
      code: 'multiple_current_plan_items',
      messageId: plan.msg_id,
      detail: 'Plan has multiple current items',
    });
    return { availability: 'unavailable' };
  }
  const completed = items.filter((item) => item.status === 'completed').length;
  return {
    availability: 'available',
    authority: 'canonical_plan',
    items,
    completed,
    total: items.length,
    ratio: items.length ? completed / items.length : null,
    current: current[0] ?? null,
  };
};

const addCostRows = (
  rows: readonly ActivityTurnCost[],
  costRows: Map<string, ActivityTurnCost>,
  conflicts: Set<string>,
  issues: RunIntegrityIssue[],
  messageId?: string
): void => {
  for (const row of rows) {
    const model = clean(row.model);
    const provider = clean(row.provider);
    if (
      !Number.isSafeInteger(row.turn) ||
      row.turn < 0 ||
      !model ||
      !provider ||
      !Number.isFinite(row.costUsd) ||
      row.costUsd < 0
    ) {
      issues.push({
        code: 'invalid_cost_evidence',
        messageId,
        detail: 'Cost row has an invalid turn, model, provider, or amount',
      });
      continue;
    }
    const key = JSON.stringify([row.turn, provider, model]);
    if (conflicts.has(key)) continue;
    const incoming = { turn: row.turn, model, provider, costUsd: row.costUsd };
    const prior = costRows.get(key);
    if (prior && prior.costUsd !== incoming.costUsd) {
      issues.push({ code: 'duplicate_cost_conflict', messageId, detail: `Cost row ${key} has conflicting values` });
      conflicts.add(key);
      costRows.delete(key);
    } else costRows.set(key, incoming);
  }
};

const invalidSnapshot = (identity: RunIdentity, issues: RunIntegrityIssue[]): RunSnapshot =>
  freezeOwned({
    identity,
    status: 'conflicted',
    currentStep: null,
    progress: { availability: 'unavailable' },
    activity: [],
    outputs: [],
    context: [],
    pendingPermissions: [],
    usage: { availability: 'unavailable' },
    cost: { availability: 'unavailable' },
    routeFacts: [],
    integrity: { state: 'invalid', issues },
  });

/** Project exactly one identified run into one immutable Cockpit snapshot. */
export const projectRunSnapshot = (expected: RunIdentity, messages: readonly TMessage[]): RunSnapshot => {
  const conversationId = clean(expected.conversationId);
  const turnId = clean(expected.turnId);
  const sessionId = expected.sessionId == null ? undefined : clean(expected.sessionId);
  const identity: RunIdentity = {
    conversationId: conversationId ?? '',
    turnId: turnId ?? '',
    ...(sessionId ? { sessionId } : {}),
  };
  const issues: RunIntegrityIssue[] = [];
  if (!conversationId || !turnId || (expected.sessionId != null && !sessionId)) {
    issues.push({
      code: 'invalid_run_identity',
      detail: 'Expected conversation, turn, and optional session ids must be nonblank',
    });
    return invalidSnapshot(identity, issues);
  }
  if (messages.length > MAX_RUN_MESSAGES) {
    issues.push({ code: 'message_limit_exceeded', detail: `Run evidence exceeds ${MAX_RUN_MESSAGES} messages` });
    return invalidSnapshot(identity, issues);
  }

  let activity: RunActivityStep[] = [];
  const acceptedMessages: TMessage[] = [];
  const outputs = new Map<string, RunOutputReference>();
  const context = new Map<string, RunContextReference>();
  const permissions = new Map<string, RunPendingPermission>();
  const permissionConflicts = new Set<string>();
  const resolvedPermissions = new Set<string>();
  const routeFacts = new Map<string, RunRouteFact>();
  const routeConflicts = new Set<string>();
  const costRows = new Map<string, ActivityTurnCost>();
  const costConflicts = new Set<string>();
  const terminalOutcomes = new Set<TerminalOutcome>();
  const budget: ProjectionBudget = { count: 0, sources: 0, references: 0 };
  let terminalBarrier: TerminalOutcome | null = null;
  let acceptedTerminalSignature: string | null = null;

  for (const message of messages) {
    if (!belongsToRun(identity, message, issues)) continue;
    const terminal = terminalFromMessage(message);
    if (terminalBarrier) {
      let replaySignature: string | null = null;
      if (terminal) {
        const replayBudget: ProjectionBudget = { count: 0, sources: 0, references: 0 };
        const replayCostBounded =
          message.type !== 'activity' || (message.content.perTurnCost?.length ?? 0) <= MAX_RUN_COST_ROWS;
        const replaySteps = replayCostBounded ? messageToSteps(message, issues, replayBudget) : [];
        if (!replayCostBounded) {
          issues.push({
            code: 'invalid_cost_evidence',
            messageId: message.msg_id,
            detail: `Terminal evidence exceeds ${MAX_RUN_COST_ROWS} cost rows`,
          });
        }
        if (replayCostBounded && (message.type !== 'activity' || replaySteps.length === message.content.nodes.length)) {
          replaySignature = terminalSignature(message, terminal, replaySteps);
        }
      }
      if (replaySignature && replaySignature === acceptedTerminalSignature) continue;
      issues.push({
        code: 'post_terminal_event',
        messageId: message.msg_id,
        detail: `Event ${message.type} arrived after terminal ${terminalBarrier}`,
      });
      if (terminal && terminal !== terminalBarrier) {
        issues.push({
          code: 'terminal_conflict',
          messageId: message.msg_id,
          detail: 'Later terminal contradicts the accepted terminal',
        });
        terminalOutcomes.add(terminal);
      }
      continue;
    }

    if (message.type === 'plan' && message.content.entries.length > MAX_RUN_PLAN_ENTRIES) {
      issues.push({
        code: 'plan_entry_limit_exceeded',
        messageId: message.msg_id,
        detail: `Plan evidence exceeds ${MAX_RUN_PLAN_ENTRIES} entries`,
      });
      continue;
    }
    if (message.type === 'activity' && (message.content.perTurnCost?.length ?? 0) > MAX_RUN_COST_ROWS) {
      issues.push({
        code: 'invalid_cost_evidence',
        messageId: message.msg_id,
        detail: `Run evidence exceeds ${MAX_RUN_COST_ROWS} cost rows`,
      });
      continue;
    }
    const issueCount = issues.length;
    const steps = messageToSteps(message, issues, budget);
    if (issues.length > issueCount && steps.length === 0 && message.type !== 'text' && message.type !== 'plan') {
      continue;
    }
    acceptedMessages.push(message);
    if (terminal) terminalOutcomes.add(terminal);
    activity = mergeStepLists(activity, steps, issues, message.msg_id);
    collectStepSources(steps, context, budget, issues, message.msg_id);
    collectReferences(message, outputs, context, budget, issues);

    const resolution = resolvedPermissionKey(message);
    if (resolution) {
      permissions.delete(resolution);
      resolvedPermissions.add(resolution);
    }
    const permission = permissionFromMessage(message);
    if (message.type === 'acp_permission' || message.type === 'codex_permission') {
      if (!permission) {
        issues.push({
          code: 'missing_permission_identity',
          messageId: message.msg_id,
          detail: 'Permission omitted its backend request or call id',
        });
      } else if (!resolvedPermissions.has(permission.key) && !permissionConflicts.has(permission.key)) {
        const prior = permissions.get(permission.key);
        if (prior && !samePermission(prior, permission.value)) {
          issues.push({
            code: 'permission_conflict',
            messageId: message.msg_id,
            detail: `Permission ${permission.key} has conflicting metadata`,
          });
          permissionConflicts.add(permission.key);
          permissions.delete(permission.key);
        } else permissions.set(permission.key, permission.value);
      }
    }

    if (message.type === 'activity') {
      collectRouteFacts(message.content.nodes, routeFacts, routeConflicts, issues, message.msg_id);
      addCostRows(message.content.perTurnCost ?? [], costRows, costConflicts, issues, message.msg_id);
      if (message.content.status !== 'running' && hasRunningStep(steps)) {
        issues.push({
          code: 'terminal_with_running_activity',
          messageId: message.msg_id,
          detail: 'Terminal turn contains running activity',
        });
      }
    }
    if (terminal) {
      terminalBarrier = terminal;
      acceptedTerminalSignature = terminalSignature(message, terminal, steps);
    }
  }

  if (terminalOutcomes.size > 1 && !issues.some((issue) => issue.code === 'terminal_conflict')) {
    issues.push({
      code: 'terminal_conflict',
      detail: 'Canonical messages claim both successful and failed termination',
    });
  }

  const pendingPermissions = [...permissions.values()];
  const running = hasRunningStep(activity) || pendingPermissions.length > 0;
  if (terminalOutcomes.size === 1 && running) {
    issues.push({
      code: 'terminal_with_running_activity',
      detail: 'Terminal evidence coexists with live activity or unresolved permission',
    });
  }

  const conflictCodes = new Set<RunIntegrityIssueCode>([
    'invalid_run_identity',
    'cross_run_evidence',
    'blank_identity',
    'terminal_conflict',
    'terminal_with_running_activity',
    'post_terminal_event',
    'duplicate_terminal_conflict',
    'terminal_regression',
    'permission_conflict',
    'output_lifecycle_regression',
    'output_lifecycle_conflict',
    'multiple_current_plan_items',
    'message_limit_exceeded',
    'reference_limit_exceeded',
    'plan_entry_limit_exceeded',
    'source_limit_exceeded',
    'activity_depth_exceeded',
    'activity_node_limit_exceeded',
  ]);
  const progress = progressFromMessages(acceptedMessages, issues);
  const stateConflict = issues.some((issue) => conflictCodes.has(issue.code));
  let status: RunStatus = 'unknown';
  if (stateConflict) status = 'conflicted';
  else if (terminalOutcomes.size === 1) status = terminalOutcomes.values().next().value ?? 'unknown';
  else if (running) status = 'running';

  let amountUsd = 0;
  for (const row of costRows.values()) {
    amountUsd += row.costUsd;
    if (!Number.isFinite(amountUsd)) {
      issues.push({ code: 'cost_aggregation_overflow', detail: 'Cost aggregation overflowed finite numeric range' });
      break;
    }
  }
  const costInvalid = issues.some((issue) =>
    ['invalid_cost_evidence', 'duplicate_cost_conflict', 'cost_aggregation_overflow'].includes(issue.code)
  );
  const rows = [...costRows.values()];
  const cost: RunCost =
    rows.length && !costInvalid
      ? { availability: 'available', authority: 'chat_activity_only', amountUsd, rows }
      : { availability: 'unavailable' };

  return freezeOwned({
    identity,
    status,
    currentStep: pickCurrent(activity),
    progress,
    activity,
    outputs: [...outputs.values()],
    context: [...context.values()],
    pendingPermissions,
    usage: { availability: 'unavailable' },
    cost,
    routeFacts: [...routeFacts.values()],
    integrity: { state: issues.length ? 'invalid' : 'valid', issues },
  });
};
