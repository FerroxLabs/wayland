/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  selectCitationLedger,
  type CitationLocator,
  type ConsequentialActionPreview,
  type ExecutionActivity,
  type ExecutionOutcome,
  type ExecutionSnapshot,
} from '@/common/execution';

export type WorkbenchProjectionId =
  | 'knowledge'
  | 'development'
  | 'automation'
  | 'consequential'
  | 'team'
  | 'core'
  | 'browser-cua';

export type ProjectionEvidence = Readonly<{
  id: string;
  label: string;
  detail?: string;
  uri?: string;
}>;

export type ProjectionFacet = Readonly<{
  id: string;
  label: string;
  evidence: readonly ProjectionEvidence[];
}>;

export type WorkbenchProjection = Readonly<{
  id: WorkbenchProjectionId;
  label: string;
  priority: number;
  facets: readonly ProjectionFacet[];
  action?: ConsequentialActionPreview;
}>;

const matches = (value: string | undefined, expressions: readonly RegExp[]) =>
  Boolean(value && expressions.some((expression) => expression.test(value)));

const activityEvidence = (activity: ExecutionActivity): ProjectionEvidence => ({
  id: activity.id,
  label: activity.name,
  detail: activity.detail ?? activity.status,
});

const outcomeEvidence = (outcome: ExecutionOutcome): ProjectionEvidence => ({
  id: outcome.id,
  label: outcome.label,
  detail: outcome.kind,
  uri: outcome.uri,
});

const facet = (id: string, label: string, evidence: readonly ProjectionEvidence[]): ProjectionFacet | null =>
  evidence.length > 0 ? { id, label, evidence } : null;

const compact = <T>(items: readonly (T | null)[]): T[] => items.filter((item): item is T => item !== null);

const activityText = (activity: ExecutionActivity) => `${activity.name} ${activity.detail ?? ''}`;
const outcomeText = (outcome: ExecutionOutcome) => `${outcome.label} ${outcome.uri ?? ''}`;

const SOURCE = [/source/i, /research/i, /web[ _-]?search/i, /browse/i, /reference/i];
const CITATION = [/citation/i, /cite/i, /bibliograph/i, /footnote/i];
const OUTLINE = [/outline/i, /plan/i, /structure/i];
const CHANGE = [/edit/i, /patch/i, /change/i, /write file/i, /diff/i];
const TERMINAL = [/terminal/i, /shell/i, /command/i, /execute/i, /bash/i, /powershell/i];
const TEST = [/test/i, /spec/i, /vitest/i, /jest/i, /pytest/i, /cargo test/i];
const PREVIEW = [/preview/i, /localhost/i, /browser/i, /render/i];
const SCHEDULE = [/schedule/i, /cron/i, /recurr/i, /trigger/i];

function formatLocator(locator: CitationLocator): string {
  switch (locator.kind) {
    case 'page':
      return `p.${locator.page}`;
    case 'sheet':
      return locator.cell ? `${locator.sheet}!${locator.cell}` : locator.sheet;
    case 'cell':
      return locator.sheet ? `${locator.sheet}!${locator.cell}` : locator.cell;
    case 'slide':
      return `slide ${locator.slide}`;
    case 'url':
      return locator.fragment ? `${locator.url}#${locator.fragment}` : locator.url;
    case 'message':
      return `message ${locator.messageId}`;
    case 'record':
      return `record ${locator.recordId}`;
    case 'section':
      return locator.section;
  }
}

function parseDestination(detail: string | undefined): string {
  if (!detail) return '';
  return detail.match(/(?:https?:\/\/|mailto:)[^\s"')]+/i)?.[0] ?? '';
}

function consequentialAction(snapshot: ExecutionSnapshot, approval: ExecutionActivity): ConsequentialActionPreview {
  const scope = snapshot.scope;
  return {
    identity: snapshot.identity,
    destination: parseDestination(approval.detail),
    effect: approval.name,
    requestedMode: snapshot.governance.requested.mode,
    scope: {
      host: scope.host,
      scheduled: scope.scheduled,
      ...(scope.channel ? { channel: scope.channel } : {}),
      ...(scope.teamId ? { teamId: scope.teamId } : {}),
      ...(scope.browserSessionId ? { browserSessionId: scope.browserSessionId } : {}),
      ...(scope.surface ? { surface: scope.surface } : {}),
    },
  };
}

/**
 * Pure, fail-closed projection from canonical execution evidence. A lane is
 * absent unless the snapshot contains evidence for it; labels alone never
 * create authority or a trusted receipt.
 */
export function deriveWorkbenchProjections(snapshot: ExecutionSnapshot): readonly WorkbenchProjection[] {
  const activities = snapshot.activities;
  const outcomes = snapshot.outcomes;
  const projections: WorkbenchProjection[] = [];

  const sources = [
    ...activities.filter((item) => matches(activityText(item), SOURCE)).map(activityEvidence),
    ...outcomes.filter((item) => matches(outcomeText(item), SOURCE)).map(outcomeEvidence),
  ];
  const citations = [
    ...selectCitationLedger(snapshot).map((citation) => ({
      id: citation.id,
      label: citation.claim,
      detail: `${citation.source.label ?? citation.source.sourceId} · ${formatLocator(citation.locator)}`,
      uri: citation.source.uri,
    })),
    ...outcomes.filter((item) => matches(outcomeText(item), CITATION)).map(outcomeEvidence),
  ];
  const validation = snapshot.validation;
  const validationEvidence =
    validation.status !== 'unvalidated' || validation.declaredType
      ? [
          {
            id: `${snapshot.identity.runId}:validation`,
            label: `${validation.declaredType ?? 'artifact'}: ${validation.status}`,
            detail: validation.reason ?? validation.method ?? undefined,
          },
          ...(validation.limits ?? []).map((limit, index) => ({
            id: `${snapshot.identity.runId}:validation-limit:${index}`,
            label: `Limit: ${limit.check}`,
            detail: limit.reason,
          })),
        ]
      : [];
  const outline = [
    ...snapshot.plan.map((step) => ({ id: step.id, label: step.content, detail: step.status })),
    ...activities.filter((item) => matches(activityText(item), OUTLINE)).map(activityEvidence),
  ];
  const knowledgeOutput = outcomes
    .filter((item) => item.kind === 'report' || item.kind === 'message')
    .map(outcomeEvidence);
  const knowledgeFacets = compact([
    facet('sources', 'Sources', sources),
    facet('outline', 'Outline', outline),
    facet('citations', 'Citations', citations),
    facet('validation', 'Validation', validationEvidence),
    facet('output', 'Output', knowledgeOutput),
  ]);
  if (
    knowledgeFacets.length > 0 &&
    (sources.length > 0 || citations.length > 0 || validationEvidence.length > 0 || knowledgeOutput.length > 0)
  ) {
    projections.push({ id: 'knowledge', label: 'Knowledge', priority: 45, facets: knowledgeFacets });
  }

  const files = outcomes.filter((item) => item.kind === 'file').map(outcomeEvidence);
  const changes = activities.filter((item) => matches(activityText(item), CHANGE)).map(activityEvidence);
  const terminal = activities.filter((item) => matches(activityText(item), TERMINAL)).map(activityEvidence);
  const tests = activities.filter((item) => matches(activityText(item), TEST)).map(activityEvidence);
  const previews = [
    ...activities.filter((item) => matches(activityText(item), PREVIEW)).map(activityEvidence),
    ...outcomes.filter((item) => matches(outcomeText(item), PREVIEW)).map(outcomeEvidence),
  ];
  const artifacts = outcomes.filter((item) => item.kind === 'artifact').map(outcomeEvidence);
  const developmentFacets = compact([
    facet('files', 'Files', files),
    facet('changes', 'Changes', changes),
    facet('terminal', 'Terminal', terminal),
    facet('tests', 'Tests', tests),
    facet('preview', 'Preview', previews),
    facet('artifacts', 'Artifacts', artifacts),
  ]);
  if (developmentFacets.length > 0) {
    projections.push({ id: 'development', label: 'Build', priority: 50, facets: developmentFacets });
  }

  const schedule = activities.filter((item) => matches(activityText(item), SCHEDULE)).map(activityEvidence);
  if (snapshot.scope.scheduled && schedule.length === 0) {
    schedule.push({ id: snapshot.identity.runId, label: 'Scheduled run', detail: snapshot.scope.channel });
  }
  const approvals = activities.filter((item) => item.kind === 'approval').map(activityEvidence);
  const runEvidence: ProjectionEvidence[] =
    snapshot.scope.scheduled || snapshot.scope.surface === 'automation' || schedule.length > 0
      ? [{ id: snapshot.identity.runId, label: snapshot.lifecycle, detail: snapshot.identity.correlationId }]
      : [];
  const logs = activities.filter((item) => item.kind === 'system' || item.status === 'failed').map(activityEvidence);
  const automationFacets = compact([
    facet('schedule', 'Schedule', schedule),
    facet('runs', 'Runs', runEvidence),
    facet('approvals', 'Approvals', approvals),
    facet('logs', 'Logs', logs),
  ]);
  if (snapshot.scope.scheduled || snapshot.scope.surface === 'automation' || schedule.length > 0) {
    projections.push({ id: 'automation', label: 'Automation', priority: 65, facets: automationFacets });
  }

  const pendingApproval = activities.find(
    (item) => item.kind === 'approval' && (item.status === 'waiting' || item.status === 'queued')
  );
  if (pendingApproval) {
    const action = consequentialAction(snapshot, pendingApproval);
    const receiptEvidence: ProjectionEvidence[] = snapshot.outcomeTrust.map((trust) => ({
      id: trust.receiptId,
      label: trust.status,
      detail: trust.reason ?? trust.artifactDigest,
    }));
    if (receiptEvidence.length === 0) {
      receiptEvidence.push({
        id: `${pendingApproval.id}:receipt-unavailable`,
        label: 'Authoritative receipt unavailable',
        detail: 'This action has not produced trusted outcome evidence.',
      });
    }
    projections.push({
      id: 'consequential',
      label: 'Needs you',
      priority: 100,
      action,
      facets: compact([
        facet('draft', 'Draft', [activityEvidence(pendingApproval)]),
        facet('destination', 'Destination', [
          { id: `${pendingApproval.id}:destination`, label: action.destination || 'Not provided' },
        ]),
        facet('effect', 'Effect', [{ id: `${pendingApproval.id}:effect`, label: action.effect }]),
        facet('receipt', 'Receipt', receiptEvidence),
      ]),
    });
  }

  const teamActivities = activities.filter((item) => item.kind === 'sub-agent').map(activityEvidence);
  if (snapshot.scope.teamId && teamActivities.length === 0) {
    teamActivities.push({ id: snapshot.scope.teamId, label: snapshot.scope.teamId, detail: 'Team scope' });
  }
  const handoffs = snapshot.handoffs.map((handoff) => ({
    id: handoff.id,
    label: `${handoff.from} to ${handoff.to}`,
    detail: handoff.requiresFreshRun ? 'Fresh run required' : handoff.checkpoint,
  }));
  if (snapshot.scope.teamId || teamActivities.length > 0 || handoffs.length > 0) {
    projections.push({
      id: 'team',
      label: 'Team',
      priority: 55,
      facets: compact([facet('agents', 'Agents', teamActivities), facet('handoffs', 'Handoffs', handoffs)]),
    });
  }

  const trustedReceipts = snapshot.outcomeTrust.map((trust) => ({
    id: trust.receiptId,
    label: trust.status,
    detail: trust.reason ?? trust.artifactDigest,
  }));
  if (
    snapshot.actor.backend === 'wcore' ||
    snapshot.receipts.length > 0 ||
    snapshot.trustedPolicy.status === 'trusted'
  ) {
    projections.push({
      id: 'core',
      label: 'Engine',
      priority: 40,
      facets: compact([
        facet('status', 'Status', [
          { id: snapshot.identity.runId, label: snapshot.integrity.status, detail: snapshot.lifecycle },
        ]),
        facet('policy', 'Policy', [
          {
            id: `${snapshot.identity.runId}:policy`,
            label: snapshot.trustedPolicy.status,
            detail:
              snapshot.trustedPolicy.status === 'trusted'
                ? `${snapshot.trustedPolicy.posture} · ${snapshot.trustedPolicy.approvals}`
                : snapshot.trustedPolicy.reason,
          },
        ]),
        facet('receipts', 'Receipts', trustedReceipts),
      ]),
    });
  }

  const browser = activities.filter((item) => item.kind === 'browser').map(activityEvidence);
  if (snapshot.scope.browserSessionId && browser.length === 0) {
    browser.push({
      id: snapshot.scope.browserSessionId,
      label: snapshot.scope.browserSessionId,
      detail: 'Browser session',
    });
  }
  const computer = activities.filter((item) => item.kind === 'computer').map(activityEvidence);
  if (snapshot.scope.browserSessionId || browser.length > 0 || computer.length > 0) {
    projections.push({
      id: 'browser-cua',
      label: 'Browser',
      priority: 70,
      facets: compact([facet('browser', 'Browser', browser), facet('computer', 'Computer', computer)]),
    });
  }

  return projections.toSorted((left, right) => right.priority - left.priority);
}
