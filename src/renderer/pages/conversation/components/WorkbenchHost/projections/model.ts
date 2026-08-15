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

/**
 * Facets are classified by STRUCTURED IDENTITY - `activity.kind`, the
 * producer-declared `activity.toolKind`, and the name of the tool the activity
 * invokes - never by a regex over free text.
 *
 * The free-text classifier this replaced matched `name + detail`, and `detail`
 * carries the invocation: a ToolSearch call reading
 * `{"query":"web search authoritative sources"}` matched /source/ and was filed
 * under Knowledge > Sources, so the panel presented the model's own question as
 * the answer it had found. The same read matched "Resources" inside a shell
 * cwd banner, "-plan.md" inside a file path, "specialist" as a test run, and
 * the literal word "Browser" inside a query as a live preview.
 *
 * A tool name is chosen by the tool registry; a tool's arguments and output are
 * written by the model. Only the former is identity.
 */
type ToolRole = 'terminal' | 'edit';

const TOOL_ROLES = new Map<string, ToolRole>([
  ['bash', 'terminal'],
  ['shell', 'terminal'],
  ['powershell', 'terminal'],
  ['cmd', 'terminal'],
  ['terminal', 'terminal'],
  ['exec', 'terminal'],
  ['executecommand', 'terminal'],
  ['runcommand', 'terminal'],
  ['runshellcommand', 'terminal'],
  ['shellcommand', 'terminal'],
  ['edit', 'edit'],
  ['editfile', 'edit'],
  ['multiedit', 'edit'],
  ['write', 'edit'],
  ['writefile', 'edit'],
  ['createfile', 'edit'],
  ['applypatch', 'edit'],
  ['patch', 'edit'],
  ['strreplace', 'edit'],
  ['strreplaceeditor', 'edit'],
  ['notebookedit', 'edit'],
  ['replace', 'edit'],
]);

/**
 * The producer's own typed declaration, where there is one. ACP types every
 * tool call `read | edit | execute`; a `read` deliberately maps to no role, so
 * a read opens no lane.
 */
const KIND_ROLES = new Map<NonNullable<ExecutionActivity['toolKind']>, ToolRole>([
  ['execute', 'terminal'],
  ['edit', 'edit'],
]);

const toolIdentity = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/**
 * The role this activity's STRUCTURED identity declares, or null when it
 * declares none.
 *
 * `toolKind` is checked first and is authoritative on its own: the producer
 * that sets it (ACP) puts agent-written prose in `name`, so falling through to
 * the name map there would be the free-text classification this replaced. Only
 * a producer that declares no kind (WCore, and Gemini through it) is classified
 * by the registry tool it names.
 */
const toolRole = (activity: ExecutionActivity): ToolRole | null => {
  if (activity.kind !== 'tool') return null;
  if (activity.toolKind) return KIND_ROLES.get(activity.toolKind) ?? null;
  return TOOL_ROLES.get(toolIdentity(activity.name)) ?? null;
};

const hasRole = (role: ToolRole) => (activity: ExecutionActivity) => toolRole(activity) === role;

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

  const ledger = selectCitationLedger(snapshot);
  /**
   * A source is what a tool RETURNED and the run then cited - `CitationSource`
   * is the only structurally source-shaped evidence in the snapshot. A search
   * tool CALL is an action, so it is never a source; if the run cited nothing,
   * this facet is empty and the Knowledge lane stays shut. An empty panel is
   * correct where fabricated cards are not.
   */
  const sources = [...new Map(ledger.map((citation) => [citation.source.sourceId, citation.source])).values()].map(
    (source) => ({
      id: source.sourceId,
      label: source.label ?? source.sourceId,
      ...(source.contentDigest ? { detail: source.contentDigest } : {}),
      ...(source.uri ? { uri: source.uri } : {}),
    })
  );
  const citations = ledger.map((citation) => ({
    id: citation.id,
    label: citation.claim,
    detail: `${citation.source.label ?? citation.source.sourceId} · ${formatLocator(citation.locator)}`,
    uri: citation.source.uri,
  }));
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
  // The steered plan is the outline. A call that merely touches a file whose
  // path contains "plan" is not.
  const outline = snapshot.plan.map((step) => ({ id: step.id, label: step.content, detail: step.status }));
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
  const changes = activities.filter(hasRole('edit')).map(activityEvidence);
  const terminal = activities.filter(hasRole('terminal')).map(activityEvidence);
  const artifacts = outcomes.filter((item) => item.kind === 'artifact').map(outcomeEvidence);
  // No Tests and no Preview facet. Nothing in the current event shape marks a
  // run as a test run or a preview: a test is an ordinary terminal call whose
  // only distinguishing evidence is model-authored argument text, and a preview
  // is a browser session (its own lane, keyed on `kind === 'browser'`). Showing
  // nothing beats classifying "specialist" as a test and the word "Browser"
  // inside a query as a live preview.
  const developmentFacets = compact([
    facet('files', 'Files', files),
    facet('changes', 'Changes', changes),
    facet('terminal', 'Terminal', terminal),
    facet('artifacts', 'Artifacts', artifacts),
  ]);
  if (developmentFacets.length > 0) {
    projections.push({ id: 'development', label: 'Build', priority: 50, facets: developmentFacets });
  }

  // Only the run's own declared scope can say a run is scheduled. The word
  // "trigger" appearing in a tool argument cannot, and it used to conjure the
  // entire Automation lane.
  const scheduled = snapshot.scope.scheduled || snapshot.scope.surface === 'automation';
  const schedule: ProjectionEvidence[] = snapshot.scope.scheduled
    ? [{ id: snapshot.identity.runId, label: 'Scheduled run', detail: snapshot.scope.channel }]
    : [];
  const approvals = activities.filter((item) => item.kind === 'approval').map(activityEvidence);
  const runEvidence: ProjectionEvidence[] = scheduled
    ? [{ id: snapshot.identity.runId, label: snapshot.lifecycle, detail: snapshot.identity.correlationId }]
    : [];
  const logs = activities.filter((item) => item.kind === 'system' || item.status === 'failed').map(activityEvidence);
  const automationFacets = compact([
    facet('schedule', 'Schedule', schedule),
    facet('runs', 'Runs', runEvidence),
    facet('approvals', 'Approvals', approvals),
    facet('logs', 'Logs', logs),
  ]);
  if (scheduled) {
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
