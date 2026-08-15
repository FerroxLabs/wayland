/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * DEFECT A - the Knowledge panel presented the model's own search queries as
 * "Sources". The workbench classifier matched a regex over `name + detail`, and
 * the wcore adapter puts the tool INVOCATION into `detail`, so a ToolSearch call
 * whose argument string is `{"query":"web search ... sources ..."}` was filed
 * under Knowledge > Sources. The classifier was reading the question and filing
 * it as the answer.
 *
 * Every fixture below is driven through the real shipped pipeline
 * (`adaptWCoreMessages` -> `projectExecution` -> `deriveWorkbenchProjections`)
 * so the assertions are about production behaviour, not a hand-authored
 * snapshot that no adapter can emit.
 */

import {
  adaptAcpMessages,
  adaptGeminiMessages,
  adaptWCoreMessages,
  projectExecution,
  selectCurrentExecutionMessages,
  type ExecutionEvent,
  type ExecutionSeed,
} from '@/common/execution';
import type { TMessage } from '@/common/chat/chatLib';
import { deriveWorkbenchProjections } from '@/renderer/pages/conversation/components/WorkbenchHost/projections/model';
import { describe, expect, it } from 'vitest';

const identity = { runId: 'run-attr', turnId: 'turn-1', correlationId: 'corr-1' } as const;
const now = 5_000;

const seed: ExecutionSeed = {
  identity,
  actor: { backend: 'acp', agentId: 'agent-1' },
  scope: { workspaceId: 'workspace-1', host: 'desktop', trust: 'unknown', scheduled: false },
  requestedGovernance: { mode: 'ask', enforceability: 'advisory' },
};

type ToolCall = Readonly<{ callId: string; name: string; description: string }>;

/** One real wcore `tool_group` turn, exactly as the DB stores it. */
const toolGroupTurn = (calls: readonly ToolCall[]): TMessage[] =>
  [
    {
      id: 'tools-1',
      conversation_id: 'conversation-1',
      type: 'tool_group',
      content: calls.map((call) => ({ ...call, status: 'Success' })),
      createdAt: now,
    },
  ] as unknown as TMessage[];

const projectToolCalls = (calls: readonly ToolCall[]) => {
  const events = adaptWCoreMessages(toolGroupTurn(calls), { identity, observedAt: now });
  return projectExecution(seed, events, { now });
};

const facetLabels = (projections: ReturnType<typeof deriveWorkbenchProjections>, facetId: string) =>
  projections.flatMap((projection) =>
    projection.facets.filter((f) => f.id === facetId).flatMap((f) => f.evidence.map((e) => e.label))
  );

const facetIds = (projections: ReturnType<typeof deriveWorkbenchProjections>) =>
  projections.flatMap((projection) => projection.facets.map((f) => f.id));

describe('workbench attribution - a tool CALL is an action, never knowledge', () => {
  it('sanity: the pipeline really produces the activities under test', () => {
    // Guards every zero below. A facet that is empty because the adapter
    // produced nothing would prove nothing at all.
    const snapshot = projectToolCalls([
      { callId: 'c1', name: 'ToolSearch', description: 'ToolSearch: {"query":"web search sources"}' },
    ]);
    expect(snapshot.integrity.status).toBe('valid');
    expect(snapshot.activities.map((a) => a.name)).toEqual(['ToolSearch']);
    // The invocation really does reach `detail` - this is what the old regex read.
    expect(snapshot.activities[0].detail).toContain('web search sources');
  });

  it('does not present a search tool CALL as a Source', () => {
    const snapshot = projectToolCalls([
      {
        callId: 'call_Y2UpBn0VG9EDW9RgJ6RBnbO8',
        name: 'ToolSearch',
        description: 'ToolSearch: {"query":"web search current authoritative sources retail trading strategies"}',
      },
      {
        callId: 'call_8MAzNF0GVNS4ykUOwpL1kYjW',
        name: 'ToolSearch',
        description: 'ToolSearch: {"query":"brave_web_search"}',
      },
    ]);

    const projections = deriveWorkbenchProjections(snapshot);
    expect(facetLabels(projections, 'sources')).toEqual([]);
    // Nothing was sourced, so the whole Knowledge lane must stay closed rather
    // than open onto a facet full of the model's own query text.
    expect(projections.map((p) => p.id)).not.toContain('knowledge');
  });

  it('does not present a shell call as a Source because its cwd banner contains "Resources"', () => {
    const snapshot = projectToolCalls([
      {
        callId: 'c-shell',
        name: 'Shell',
        description:
          'mkdir -p daily/2026-07-03 [current working directory /Applications/Wayland.app/Contents/Resources/app.asar.unpacked]',
      },
    ]);

    const projections = deriveWorkbenchProjections(snapshot);
    expect(facetLabels(projections, 'sources')).toEqual([]);
  });

  it('known positive: a source that a tool RETURNED is presented as a Source', () => {
    // Structurally a source: `ExecutionCitation.source` is a typed CitationSource,
    // observed after the work, not a string the model wrote into an argument.
    const events: readonly ExecutionEvent[] = [
      { eventId: 'e0', sequence: 0, identity, observedAt: now, type: 'lifecycle', lifecycle: 'running' },
      {
        eventId: 'e1',
        sequence: 1,
        identity,
        observedAt: now,
        type: 'citation',
        citation: {
          id: 'claim-1',
          claim: 'Cycle time fell from 19 hours to 7 hours',
          source: { sourceId: 'metrics.xlsx', label: 'Q3 metrics', uri: 'file:///work/metrics.xlsx' },
          locator: { kind: 'sheet', sheet: 'Summary', cell: 'B7' },
          observedAt: now,
        },
      },
      {
        eventId: 'e2',
        sequence: 2,
        identity,
        observedAt: now,
        type: 'citation',
        citation: {
          id: 'claim-2',
          claim: 'Adoption reached 84 percent',
          source: { sourceId: 'brief.pdf', label: 'Adoption brief' },
          locator: { kind: 'page', page: 3 },
          observedAt: now,
        },
      },
      {
        eventId: 'e3',
        sequence: 3,
        identity,
        observedAt: now,
        type: 'citation',
        citation: {
          id: 'claim-3',
          claim: 'Second claim from the same workbook',
          source: { sourceId: 'metrics.xlsx', label: 'Q3 metrics', uri: 'file:///work/metrics.xlsx' },
          locator: { kind: 'sheet', sheet: 'Summary', cell: 'B8' },
          observedAt: now,
        },
      },
    ];
    const projections = deriveWorkbenchProjections(projectExecution(seed, events, { now }));

    // Deduplicated by sourceId: two claims off one workbook is one source.
    expect(facetLabels(projections, 'sources')).toEqual(['Q3 metrics', 'Adoption brief']);
    const sources = projections.find((p) => p.id === 'knowledge')?.facets.find((f) => f.id === 'sources')?.evidence;
    expect(sources?.[0].uri).toBe('file:///work/metrics.xlsx');
  });

  it('negative control: an unrelated read call opens no Knowledge lane', () => {
    const projections = deriveWorkbenchProjections(
      projectToolCalls([{ callId: 'c-read', name: 'Read', description: 'Read: {"path":"/a/b.txt"}' }])
    );
    expect(projections.map((p) => p.id)).not.toContain('knowledge');
    expect(facetLabels(projections, 'sources')).toEqual([]);
  });

  it('keeps the Outline the structured plan, not every call whose path says "plan"', () => {
    // The Knowledge lane is deliberately OPEN here (a real report outcome), so a
    // missing Outline entry cannot be an artefact of the lane being closed.
    const events: readonly ExecutionEvent[] = [
      { eventId: 'e0', sequence: 0, identity, observedAt: now, type: 'lifecycle', lifecycle: 'running' },
      {
        eventId: 'e1',
        sequence: 1,
        identity,
        observedAt: now,
        type: 'plan',
        revisionId: 'plan-a',
        steps: [{ id: 's1', content: 'Draft the cited brief', status: 'in-progress' }],
      },
      {
        eventId: 'e2',
        sequence: 2,
        identity,
        observedAt: now,
        type: 'activity',
        activity: {
          id: 'c-read',
          kind: 'tool',
          name: 'Read',
          status: 'completed',
          detail: 'Read /Users/x/trader-performance-os-plan.md',
        },
      },
      {
        eventId: 'e3',
        sequence: 3,
        identity,
        observedAt: now,
        type: 'activity',
        activity: {
          id: 'c-edit',
          kind: 'tool',
          name: 'Edit',
          status: 'completed',
          detail: 'Edit /Users/x/trader-performance-os-plan.md',
        },
      },
      {
        eventId: 'e4',
        sequence: 4,
        identity,
        observedAt: now,
        type: 'outcome',
        outcome: { id: 'report-1', kind: 'report', label: 'Draft brief' },
      },
    ];
    const projections = deriveWorkbenchProjections(projectExecution(seed, events, { now }));
    expect(projections.map((p) => p.id)).toContain('knowledge');
    expect(facetLabels(projections, 'outline')).toEqual(['Draft the cited brief']);
  });

  it('does not present the word "specialist" inside a query as a Test run', () => {
    const snapshot = projectToolCalls([
      {
        callId: 'c-ts',
        name: 'ToolSearch',
        description: 'ToolSearch: {"query":"Delegate specialist agents for business plan adversarial critique"}',
      },
    ]);
    expect(facetIds(deriveWorkbenchProjections(snapshot))).not.toContain('tests');
  });

  it('does not present the word "Browser" inside a query as a Preview', () => {
    const snapshot = projectToolCalls([
      { callId: 'c-ts', name: 'ToolSearch', description: 'ToolSearch: {"query":"Browser"}' },
    ]);
    const projections = deriveWorkbenchProjections(snapshot);
    expect(facetIds(projections)).not.toContain('preview');
    expect(facetLabels(projections, 'sources')).toEqual([]);
  });

  it('does not fabricate a Schedule from the word "trigger" in an argument', () => {
    const snapshot = projectToolCalls([
      { callId: 'c-ts', name: 'ToolSearch', description: 'ToolSearch: {"query":"how do I trigger a rebuild"}' },
    ]);
    const projections = deriveWorkbenchProjections(snapshot);
    expect(projections.map((p) => p.id)).not.toContain('automation');
  });

  it('still classifies terminal and edit work by the tool it names', () => {
    const snapshot = projectToolCalls([
      { callId: 'c-bash', name: 'Bash', description: 'ls -la' },
      { callId: 'c-shell', name: 'Shell', description: 'mkdir -p daily' },
      { callId: 'c-edit', name: 'Edit', description: 'Edit /Users/x/notes.md' },
      { callId: 'c-write', name: 'Write', description: 'Write /Users/x/new.md' },
    ]);
    const projections = deriveWorkbenchProjections(snapshot);
    expect(facetLabels(projections, 'terminal')).toEqual(['Bash', 'Shell']);
    expect(facetLabels(projections, 'changes')).toEqual(['Edit', 'Write']);
  });

  it('does not classify a read as a change just because the path says "edited"', () => {
    const snapshot = projectToolCalls([
      { callId: 'c-read', name: 'Read', description: 'Read /Users/x/edited-draft.md' },
    ]);
    expect(facetLabels(deriveWorkbenchProjections(snapshot), 'changes')).toEqual([]);
  });

  it('never renders a Sources facet with no evidence in it', () => {
    // No adapter emits `citation`, so in production the ledger is empty. The
    // facet must be ABSENT rather than an empty shell, and Knowledge must stay
    // reachable through the evidence that IS emitted (validation, report).
    const events: readonly ExecutionEvent[] = [
      { eventId: 'e0', sequence: 0, identity, observedAt: now, type: 'lifecycle', lifecycle: 'running' },
      {
        eventId: 'e1',
        sequence: 1,
        identity,
        observedAt: now,
        type: 'outcome',
        outcome: { id: 'report-1', kind: 'report', label: 'Draft brief' },
      },
    ];
    const projections = deriveWorkbenchProjections(projectExecution(seed, events, { now }));
    const knowledge = projections.find((p) => p.id === 'knowledge');
    expect(knowledge).toBeDefined();
    expect(knowledge?.facets.map((f) => f.id)).not.toContain('sources');
    expect(knowledge?.facets.every((f) => f.evidence.length > 0)).toBe(true);
  });
});

/**
 * DEFECT B - the structured classifier above reads `activity.name`, which is
 * identity for WCore (a registry tool name) but FREE TEXT for ACP: the ACP
 * adapter puts `update.title` - a sentence the agent writes - in `name`, and
 * the typed protocol enum `update.kind` ('read' | 'edit' | 'execute') was
 * thrown away into `detail`. Result: a Claude Code / Codex turn that ran a
 * command and edited a file rendered ZERO lanes.
 */
describe('workbench attribution - ACP classifies on the protocol kind, not the agent-written title', () => {
  const acpSeed: ExecutionSeed = { ...seed, actor: { backend: 'acp', agentId: 'claude-code' } };

  type AcpCall = Readonly<{ id: string; title: string; kind: 'read' | 'edit' | 'execute' }>;

  /** One real ACP turn: the user bubble is the turn boundary production slices on. */
  const acpTurn = (calls: readonly AcpCall[]): TMessage[] =>
    [
      {
        id: 'user-1',
        conversation_id: 'conversation-1',
        type: 'text',
        position: 'right',
        content: { content: 'go' },
        createdAt: now - 1,
      },
      ...calls.map((call) => ({
        id: `msg-${call.id}`,
        conversation_id: 'conversation-1',
        type: 'acp_tool_call',
        content: {
          sessionId: 'session-1',
          update: {
            sessionUpdate: 'tool_call',
            toolCallId: call.id,
            status: 'completed',
            title: call.title,
            kind: call.kind,
          },
        },
        createdAt: now,
      })),
    ] as unknown as TMessage[];

  const projectAcp = (calls: readonly AcpCall[]) =>
    projectExecution(
      acpSeed,
      adaptAcpMessages(selectCurrentExecutionMessages('acp', acpTurn(calls)), { identity, observedAt: now }),
      { now }
    );

  /** The turn the verifier measured: a read, a command, an edit, a read. */
  const fourCallTurn: readonly AcpCall[] = [
    { id: 'call-1', title: 'Read src/model.ts', kind: 'read' },
    { id: 'call-2', title: 'npm test', kind: 'execute' },
    { id: 'call-3', title: 'Edit src/model.ts', kind: 'edit' },
    { id: 'call-4', title: 'Read package.json', kind: 'read' },
  ];

  it('sanity: the ACP pipeline really produces the four activities under test', () => {
    // Guards every zero below - a lane missing because the adapter produced
    // nothing would prove nothing at all.
    const snapshot = projectAcp(fourCallTurn);
    expect(snapshot.integrity.status).toBe('valid');
    expect(snapshot.activities.map((a) => a.id)).toEqual(['call-1', 'call-2', 'call-3', 'call-4']);
    expect(snapshot.activities.every((a) => a.kind === 'tool')).toBe(true);
  });

  it('renders a Build lane for an ACP turn that ran a command and edited a file', () => {
    const projections = deriveWorkbenchProjections(projectAcp(fourCallTurn));
    expect(projections.map((p) => p.id)).toContain('development');
    expect(facetLabels(projections, 'terminal')).toEqual(['npm test']);
    expect(facetLabels(projections, 'changes')).toEqual(['Edit src/model.ts']);
  });

  it('does not invent a lane from a read', () => {
    const projections = deriveWorkbenchProjections(
      projectAcp([{ id: 'call-r', title: 'Read src/model.ts', kind: 'read' }])
    );
    expect(projections.map((p) => p.id)).not.toContain('development');
    expect(facetLabels(projections, 'terminal')).toEqual([]);
    expect(facetLabels(projections, 'changes')).toEqual([]);
  });

  it('does not present an ACP tool CALL as a Source, whatever the agent titled it', () => {
    const projections = deriveWorkbenchProjections(
      projectAcp([
        { id: 'call-s', title: 'Search the web for authoritative sources on retail trading', kind: 'execute' },
      ])
    );
    expect(facetLabels(projections, 'sources')).toEqual([]);
    expect(projections.map((p) => p.id)).not.toContain('knowledge');
    // It is still an action, and an `execute` action is terminal work.
    expect(facetLabels(projections, 'terminal')).toEqual([
      'Search the web for authoritative sources on retail trading',
    ]);
  });

  it('does not classify a read as a change because the agent titled it "edit"', () => {
    const projections = deriveWorkbenchProjections(
      projectAcp([{ id: 'call-t', title: 'Edit the plan (dry run)', kind: 'read' }])
    );
    expect(facetLabels(projections, 'changes')).toEqual([]);
  });

  it('leaves Gemini unchanged - it delegates to the WCore adapter and uses real tool names', () => {
    const geminiMessages = [
      {
        id: 'tools-g',
        conversation_id: 'conversation-1',
        type: 'tool_group',
        content: [
          { callId: 'g-bash', name: 'Shell', description: 'npm test', status: 'Success' },
          { callId: 'g-edit', name: 'WriteFile', description: 'WriteFile /Users/x/new.md', status: 'Success' },
          { callId: 'g-read', name: 'ReadFile', description: 'ReadFile /Users/x/new.md', status: 'Success' },
        ],
        createdAt: now,
      },
    ] as unknown as TMessage[];
    const snapshot = projectExecution(
      { ...seed, actor: { backend: 'gemini', agentId: 'gemini' } },
      adaptGeminiMessages(geminiMessages, { identity, observedAt: now }),
      { now }
    );
    expect(snapshot.activities.map((a) => a.name)).toEqual(['Shell', 'WriteFile', 'ReadFile']);
    const projections = deriveWorkbenchProjections(snapshot);
    expect(facetLabels(projections, 'terminal')).toEqual(['Shell']);
    expect(facetLabels(projections, 'changes')).toEqual(['WriteFile']);
  });
});
