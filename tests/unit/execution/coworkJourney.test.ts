/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * COW-06 — the complete ordinary-composer source-to-delivery journey. A user
 * brings sources through the ordinary composer (no Cowork mode switch), steers
 * a plan, the run produces a cited, type-validated, trusted DOCX artifact, the
 * Workbench projects sources/citations/validation/receipts from one canonical
 * history, and delivery is gated on that same evidence.
 */

import { describe, expect, it } from 'vitest';
import { ASSISTANT_PRESETS } from '@/common/config/presets/assistantPresets';
import { DEFAULT_PRESET_AGENT_TYPE, resolvePresetAgentType } from '@/common/config/presets/assistantDefaults';
import {
  adaptWCoreMessages,
  evaluateArtifactDelivery,
  projectExecution,
  selectCitationLedger,
  type ExecutionEvent,
  type ExecutionSeed,
  type TrustedArtifactReceipt,
} from '@/common/execution';
import { deriveWorkbenchProjections } from '@/renderer/pages/conversation/components/WorkbenchHost/projections/model';
import { assertCitedText } from '../../e2e/cowork/replayContract';
import type { TMessage } from '@/common/chat/chatLib';

const identity = { runId: 'run-1', turnId: 'turn-1', correlationId: 'corr-1' } as const;
const now = 9_000;
const digest = (char: string): `sha256:${string}` => `sha256:${char.repeat(64)}`;
const artifactDigest = digest('a');
const seed: ExecutionSeed = {
  identity,
  actor: { backend: 'wcore', agentId: 'core' },
  scope: { projectId: 'project-1', workspaceId: 'workspace-1', host: 'desktop', trust: 'trusted', scheduled: false },
  requestedGovernance: { mode: 'trusted-edits', enforceability: 'enforced' },
};

const receipt: TrustedArtifactReceipt = {
  id: 'receipt-1',
  kind: 'artifact',
  authority: 'core',
  identity,
  observedAt: now,
  origin: 'core/anvil',
  contractVersion: '1.0',
  producerSessionId: 'session-1',
  producerRunId: 'producer-run-1',
  producerTaskId: 'task-1',
  producerSequence: 0,
  artifactDigest,
  gateClosureDigest: digest('b'),
  bodyDigest: digest('c'),
  sourceDependencyDigest: digest('d'),
  status: 'verified',
};

// The full canonical journey as observed evidence, in sequence.
const journey: readonly ExecutionEvent[] = [
  { eventId: 'e0', sequence: 0, identity, observedAt: now, type: 'lifecycle', lifecycle: 'running' },
  {
    eventId: 'e1',
    sequence: 1,
    identity,
    observedAt: now,
    type: 'plan',
    revisionId: 'plan-a',
    steps: [{ id: 's1', content: 'Read source workbook and brief', status: 'in-progress' }],
  },
  {
    eventId: 'e2',
    sequence: 2,
    identity,
    observedAt: now,
    type: 'plan',
    revisionId: 'plan-b', // user steered the plan
    steps: [
      { id: 's1', content: 'Read source workbook and brief', status: 'completed' },
      { id: 's2', content: 'Draft cited executive brief as DOCX', status: 'in-progress' },
    ],
  },
  {
    eventId: 'e3',
    sequence: 3,
    identity,
    observedAt: now,
    type: 'activity',
    activity: {
      id: 'a1',
      kind: 'tool',
      name: 'Read source workbook',
      status: 'completed',
      detail: 'source: metrics.xlsx',
    },
  },
  {
    eventId: 'e4',
    sequence: 4,
    identity,
    observedAt: now,
    type: 'citation',
    citation: {
      id: 'claim-1',
      claim: 'Cycle time fell from 19 hours to 7 hours',
      source: { sourceId: 'metrics.xlsx', label: 'Q3 metrics', uri: 'file:///work/metrics.xlsx' },
      locator: { kind: 'sheet', sheet: 'Summary', cell: 'B7' },
      observedAt: now,
      outcomeId: 'artifact-1',
    },
  },
  {
    eventId: 'e5',
    sequence: 5,
    identity,
    observedAt: now,
    type: 'citation',
    citation: {
      id: 'claim-2',
      claim: 'Adoption reached 84 percent',
      source: { sourceId: 'brief.pdf', label: 'Adoption brief' },
      locator: { kind: 'page', page: 3 },
      observedAt: now,
      outcomeId: 'artifact-1',
    },
  },
  {
    eventId: 'e6',
    sequence: 6,
    identity,
    observedAt: now,
    type: 'validation',
    validation: {
      status: 'valid',
      declaredType: 'docx',
      method: 'officecli',
      reason: 'officecli validate report.docx passed',
      limits: [{ check: 'visual-render', reason: 'No renderer bundled; structure verified without pixel diff' }],
    },
  },
  { eventId: 'e7', sequence: 7, identity, observedAt: now, type: 'trusted-receipt', receipt },
  {
    eventId: 'e8',
    sequence: 8,
    identity,
    observedAt: now,
    type: 'outcome',
    outcome: {
      id: 'artifact-1',
      kind: 'artifact',
      label: 'Northstar Outcome Brief',
      uri: 'file:///work/report.docx',
      receiptId: 'receipt-1',
      artifactDigest,
      sourceDependencyDigest: digest('d'),
    },
  },
];

describe('COW-06 ordinary-composer source-to-delivery journey', () => {
  it('enters through the ordinary composer with no Cowork mode switch or provider lock-in', () => {
    const cowork = ASSISTANT_PRESETS.find((preset) => preset.id === 'cowork');
    expect(cowork).toBeDefined();
    // No dedicated agent type: Cowork is a preset over the same chat route/kernel.
    expect(cowork?.presetAgentType).toBeUndefined();
    expect(resolvePresetAgentType(cowork?.presetAgentType)).toBe(DEFAULT_PRESET_AGENT_TYPE);
    expect(DEFAULT_PRESET_AGENT_TYPE).toBe('wcore');
  });

  it('projects one canonical history that carries steer, citations, validation, and a verified receipt', () => {
    const snapshot = projectExecution(seed, journey, { now });
    expect(snapshot.integrity.status).toBe('valid');

    // Steered a plan without losing provenance.
    expect(snapshot.planHistory.map((revision) => revision.id)).toEqual(['plan-a', 'plan-b']);
    expect(snapshot.plan.map((step) => step.content)).toEqual([
      'Read source workbook and brief',
      'Draft cited executive brief as DOCX',
    ]);

    // Cited, from the durable typed ledger.
    expect(selectCitationLedger(snapshot).map((citation) => citation.id)).toEqual(['claim-1', 'claim-2']);

    // Type-declared and type-validated.
    expect(snapshot.validation).toMatchObject({ status: 'valid', declaredType: 'docx', method: 'officecli' });

    // Trusted, verified outcome.
    expect(snapshot.outcomeTrust).toEqual([
      expect.objectContaining({ receiptId: 'receipt-1', outcomeId: 'artifact-1', status: 'verified' }),
    ]);
  });

  it('surfaces sources, citations, validation, and receipts in the Workbench without a competing store', () => {
    const snapshot = projectExecution(seed, journey, { now });
    const projections = deriveWorkbenchProjections(snapshot);
    const knowledge = projections.find((projection) => projection.id === 'knowledge');
    expect(knowledge).toBeDefined();
    const citationFacet = knowledge?.facets.find((f) => f.id === 'citations');
    expect(citationFacet?.evidence.map((item) => item.label)).toEqual([
      'Cycle time fell from 19 hours to 7 hours',
      'Adoption reached 84 percent',
    ]);
    expect(citationFacet?.evidence[0].detail).toContain('Summary!B7');
    const validationFacet = knowledge?.facets.find((f) => f.id === 'validation');
    expect(validationFacet?.evidence[0].label).toBe('docx: valid');
    // Honest validation limit is surfaced, not hidden.
    expect(validationFacet?.evidence.some((item) => item.label.startsWith('Limit:'))).toBe(true);

    const core = projections.find((projection) => projection.id === 'core');
    const receiptFacet = core?.facets.find((f) => f.id === 'receipts');
    expect(receiptFacet?.evidence[0].label).toBe('verified');
  });

  it('inspects the native cited artifact and delivers it under the same evidence gate', () => {
    const snapshot = projectExecution(seed, journey, { now });
    // The delivered DOCX text carries the cited facts, source ids, and honest sections.
    const artifactText =
      'Northstar Outcome Brief. Cycle time fell from 19 hours to 7 hours [metrics.xlsx Summary!B7]. ' +
      'Adoption reached 84 percent [brief.pdf p.3]. Sources: metrics.xlsx, brief.pdf. Limitations: visual render not performed.';
    expect(() => assertCitedText(artifactText, ['metrics.xlsx', 'brief.pdf', 'Sources', 'Limitations'])).not.toThrow();

    const decision = evaluateArtifactDelivery(snapshot, {
      identity,
      outcomeId: 'artifact-1',
      declaredType: 'docx',
      artifactDigest,
    });
    expect(decision.status).toBe('ready');
    expect(decision.reasons).toEqual([]);
    // Delivery still discloses the honest validation limit.
    expect(decision.limits).toEqual([
      { check: 'visual-render', reason: 'No renderer bundled; structure verified without pixel diff' },
    ]);
  });

  it('populates the type-aware validation slot from a real officecli-validate tool run (no Core change)', () => {
    const messages = [
      {
        id: 'user-1',
        type: 'text',
        position: 'right',
        conversation_id: 'conversation-1',
        content: { content: 'Turn these sources into a cited brief as DOCX' },
      },
      {
        id: 'tools-1',
        conversation_id: 'conversation-1',
        type: 'tool_group',
        content: [
          {
            callId: 'call-1',
            name: 'run_shell_command',
            description: 'officecli validate /work/report.docx',
            status: 'Success',
          },
        ],
        createdAt: now,
      },
    ] as TMessage[];
    const events = adaptWCoreMessages(messages, { identity, observedAt: now });
    const snapshot = projectExecution(seed, events, { now });
    expect(snapshot.validation).toMatchObject({ status: 'valid', declaredType: 'docx', method: 'officecli' });
    expect(
      evaluateArtifactDelivery(snapshot, {
        identity,
        outcomeId: 'artifact-1',
        declaredType: 'docx',
        artifactDigest,
      }).status
    ).toBe('ready');
  });
});
