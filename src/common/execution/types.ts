/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export type ExecutionBackend = 'wcore' | 'acp' | 'gemini';
export type ExecutionHost = 'desktop' | 'web' | 'community-cloud' | 'hosted-pro';
export type ExecutionTrust = 'trusted' | 'untrusted' | 'unknown';
export type ExecutionLifecycle = 'queued' | 'running' | 'waiting' | 'blocked' | 'completed' | 'failed' | 'cancelled';
export type GovernanceMode = 'ask' | 'trusted-edits' | 'autopilot';
export type Enforceability = 'enforced' | 'brokered' | 'advisory';
export type PolicySource = 'workspace' | 'backend' | 'host' | 'scheduler' | 'channel';

export type ExecutionIdentity = Readonly<{
  runId: string;
  turnId: string;
  correlationId: string;
}>;

export type ExecutionActor = Readonly<{
  backend: ExecutionBackend;
  agentId: string;
  providerId?: string;
  modelId?: string;
  parentRunId?: string;
  parentAgentId?: string;
}>;

export type ExecutionScope = Readonly<{
  projectId?: string;
  workspaceId: string;
  workspacePath?: string;
  host: ExecutionHost;
  trust: ExecutionTrust;
  scheduled: boolean;
  channel?: string;
  teamId?: string;
  browserSessionId?: string;
  surface?: 'chat' | 'team' | 'browser' | 'automation' | 'channel';
}>;

export type GovernanceRequest = Readonly<{
  mode: GovernanceMode;
  enforceability: Enforceability;
}>;

export type GovernanceConstraint = Readonly<{
  source: PolicySource;
  mode: GovernanceMode;
  enforceability: Enforceability;
  identity: ExecutionIdentity;
  host: ExecutionHost;
  observedAt: number;
  expiresAt: number;
  receiptId: string;
}>;

export type EffectiveGovernance = Readonly<{
  status: 'effective' | 'unavailable';
  mode: GovernanceMode;
  enforceability: Enforceability;
  receiptIds: readonly string[];
  reasons: readonly string[];
}>;

export type ExecutionActivity = Readonly<{
  id: string;
  kind: 'tool' | 'thinking' | 'sub-agent' | 'browser' | 'computer' | 'approval' | 'system';
  name: string;
  status: 'queued' | 'running' | 'waiting' | 'completed' | 'failed' | 'cancelled';
  /** Streamed output or trailing text. NOT the invocation - it can be a large blob. */
  detail?: string;
  /**
   * What the step was ASKED to do (a shell command, a tool description). Kept
   * apart from `detail` because a label built from output splices result text
   * into the timeline; only this field is safe to render as "what it is doing".
   */
  command?: string;
  parentId?: string;
}>;

export type ExecutionPlanStep = Readonly<{
  id: string;
  content: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority?: 'low' | 'medium' | 'high';
}>;

export type ExecutionPlanRevision = Readonly<{
  id: string;
  source: 'producer' | 'desktop-local';
  observedAt: number;
  reason?: string;
  steps: readonly ExecutionPlanStep[];
}>;

export type AuthoritativeUsage = Readonly<{
  status: 'authoritative';
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  receiptId: string;
}>;

export type AuthoritativeCost = Readonly<{
  status: 'authoritative';
  amount: number;
  currency: string;
  receiptId: string;
}>;

export type ExecutionCostAttempt = Readonly<{
  id: string;
  providerId: string;
  modelId?: string;
  role: 'primary' | 'retry' | 'fallback';
  status: 'authoritative' | 'unavailable';
  amount?: number;
  currency?: string;
  receiptId?: string;
  reason?: string;
}>;

export type ExecutionCostLedger = Readonly<{
  status: 'unavailable' | 'authoritative' | 'mismatch' | 'paused';
  attempts: readonly ExecutionCostAttempt[];
  total?: number;
  currency?: string;
  spendLimit?: number;
  reason?: string;
}>;

export type AuthoritativeLatency = Readonly<{
  status: 'authoritative';
  milliseconds: number;
  receiptId: string;
}>;

export type UnavailableMetric = Readonly<{
  status: 'unavailable';
  reason: string;
}>;

/** Native target type declared for an artifact before work commits to a path. */
export type DeclaredArtifactType = 'docx' | 'pdf' | 'xlsx' | 'pptx' | 'html' | 'markdown' | 'text';

/** How the declared target type was validated (or why it could not be). */
export type ValidationMethod = 'officecli' | 'pdf-structural' | 'render' | 'domain' | 'none';

/** An honest, specific validation limitation surfaced to the user, not hidden. */
export type ValidationLimit = Readonly<{
  check: string;
  reason: string;
}>;

export type ExecutionValidation = Readonly<{
  status: 'unvalidated' | 'valid' | 'invalid';
  declaredType?: DeclaredArtifactType;
  method?: ValidationMethod;
  receiptId?: string;
  reason?: string;
  limits?: readonly ValidationLimit[];
}>;

/**
 * A precise, per-claim provenance locator inside a source. A discriminated
 * union keeps the address honest: the locator kind names exactly which of a
 * page, sheet/cell, slide, URL, message, record, or section pins the claim.
 */
export type CitationLocator =
  | Readonly<{ kind: 'page'; page: number }>
  | Readonly<{ kind: 'sheet'; sheet: string; cell?: string }>
  | Readonly<{ kind: 'cell'; sheet?: string; cell: string }>
  | Readonly<{ kind: 'slide'; slide: number }>
  | Readonly<{ kind: 'url'; url: string; fragment?: string }>
  | Readonly<{ kind: 'message'; messageId: string }>
  | Readonly<{ kind: 'record'; recordId: string }>
  | Readonly<{ kind: 'section'; section: string }>;

export type CitationSource = Readonly<{
  sourceId: string;
  label?: string;
  uri?: string;
  contentDigest?: string;
}>;

/**
 * One durable, typed ledger entry binding an asserted claim to the source and
 * precise locator it was inspected from. Captured on write, kept append-only so
 * it survives revision and delivery; a revision supersedes rather than erases.
 */
export type ExecutionCitation = Readonly<{
  id: string;
  claim: string;
  source: CitationSource;
  locator: CitationLocator;
  observedAt: number;
  outcomeId?: string;
  supersedes?: string;
}>;

export type OutcomeTrustStatus =
  | 'unvalidated'
  | 'domain-valid'
  | 'integrity-checked'
  | 'verified'
  | 'receipt-stale'
  | 'source-dependency-stale';

export type ExecutionReceipt = Readonly<{
  id: string;
  kind: 'policy' | 'usage' | 'cost' | 'latency' | 'validation' | 'handoff' | 'artifact';
  authority: 'provider' | 'flux' | 'core' | 'desktop';
  identity: ExecutionIdentity;
  observedAt: number;
  status?: OutcomeTrustStatus;
}>;

export type TrustedArtifactReceipt = ExecutionReceipt &
  Readonly<{
    kind: 'artifact';
    authority: 'core';
    origin: 'core/anvil';
    contractVersion: string;
    producerSessionId: string;
    producerRunId: string;
    producerTaskId: string;
    producerSequence: number;
    artifactDigest: string;
    gateClosureDigest: string;
    bodyDigest: string;
    sourceDependencyDigest?: string;
    status: OutcomeTrustStatus;
  }>;

export type ExecutionOutcome = Readonly<{
  id: string;
  kind: 'artifact' | 'file' | 'message' | 'report';
  label: string;
  uri?: string;
  receiptId?: string;
  artifactDigest?: string;
  sourceDependencyDigest?: string;
}>;

export type ExecutionOutcomeTrust = Readonly<{
  receiptId: string;
  outcomeId?: string;
  artifactDigest: string;
  sourceDependencyDigest?: string;
  status: OutcomeTrustStatus;
  reason?: string;
}>;

export type TrustedExecutionPolicy = Readonly<{
  status: 'trusted';
  contractVersion: string;
  revision: number;
  reason: 'launch' | 'mode_change' | 'resume' | 'expiry';
  effectiveAt: number;
  posture: 'smart' | 'managed' | 'dangerous';
  approvals: 'prompt' | 'auto_edit' | 'bypass';
  sandbox: 'required' | 'bypass';
  source: string;
  managedFloorActive: boolean;
  dangerousActivationId?: string;
  dangerousExpiresAt?: number;
}>;

export type UnavailableExecutionPolicy = Readonly<{
  status: 'unavailable';
  reason: string;
}>;

export type ExecutionHandoff = Readonly<{
  id: string;
  identity: ExecutionIdentity;
  from: ExecutionBackend;
  to: ExecutionBackend;
  checkpoint: string;
  preserved: readonly string[];
  lost: readonly string[];
  capabilityAdded: readonly string[];
  capabilityRemoved: readonly string[];
  unresolvedSideEffects: readonly string[];
  requiresFreshRun: boolean;
  receiptId: string;
}>;

export type ExecutionSnapshot = Readonly<{
  identity: ExecutionIdentity;
  actor: ExecutionActor;
  scope: ExecutionScope;
  lifecycle: ExecutionLifecycle;
  governance: Readonly<{
    requested: GovernanceRequest;
    effective: EffectiveGovernance;
  }>;
  activities: readonly ExecutionActivity[];
  plan: readonly ExecutionPlanStep[];
  planHistory: readonly ExecutionPlanRevision[];
  citations: readonly ExecutionCitation[];
  usage: AuthoritativeUsage | UnavailableMetric;
  cost: AuthoritativeCost | UnavailableMetric;
  costLedger: ExecutionCostLedger;
  latency: AuthoritativeLatency | UnavailableMetric;
  validation: ExecutionValidation;
  trustedPolicy: TrustedExecutionPolicy | UnavailableExecutionPolicy;
  receipts: readonly ExecutionReceipt[];
  outcomes: readonly ExecutionOutcome[];
  outcomeTrust: readonly ExecutionOutcomeTrust[];
  handoffs: readonly ExecutionHandoff[];
  integrity: Readonly<{
    status: 'valid' | 'invalid';
    reasons: readonly string[];
    lastSequence: number;
  }>;
  mcp: Readonly<{
    status: 'unsupported';
    reason: 'versioned M1M evidence unavailable';
  }>;
}>;

type ExecutionEventBase = Readonly<{
  eventId: string;
  sequence: number;
  identity: ExecutionIdentity;
  observedAt: number;
}>;

export type ExecutionEvent =
  | (ExecutionEventBase & Readonly<{ type: 'evidence-rejected'; reason: string }>)
  | (ExecutionEventBase &
      Readonly<{ type: 'lifecycle'; lifecycle: ExecutionLifecycle; action?: 'stop' | 'retry' | 'reopen' | 'resume' }>)
  | (ExecutionEventBase & Readonly<{ type: 'activity'; activity: ExecutionActivity }>)
  | (ExecutionEventBase &
      Readonly<{
        type: 'plan';
        steps: readonly ExecutionPlanStep[];
        revisionId?: string;
        source?: ExecutionPlanRevision['source'];
        reason?: string;
      }>)
  | (ExecutionEventBase & Readonly<{ type: 'governance'; constraints: readonly GovernanceConstraint[] }>)
  | (ExecutionEventBase & Readonly<{ type: 'usage'; usage: AuthoritativeUsage; receipt: ExecutionReceipt }>)
  | (ExecutionEventBase &
      Readonly<{
        type: 'cost';
        cost: AuthoritativeCost;
        receipt: ExecutionReceipt;
        attempt?: Omit<ExecutionCostAttempt, 'status' | 'amount' | 'currency' | 'receiptId'>;
        conversationTotal?: number;
      }>)
  | (ExecutionEventBase & Readonly<{ type: 'spend-pause'; limit: number; reason: string }>)
  | (ExecutionEventBase & Readonly<{ type: 'latency'; latency: AuthoritativeLatency; receipt: ExecutionReceipt }>)
  | (ExecutionEventBase & Readonly<{ type: 'validation'; validation: ExecutionValidation; receipt?: ExecutionReceipt }>)
  | (ExecutionEventBase & Readonly<{ type: 'citation'; citation: ExecutionCitation }>)
  | (ExecutionEventBase & Readonly<{ type: 'outcome'; outcome: ExecutionOutcome }>)
  | (ExecutionEventBase & Readonly<{ type: 'policy-revision'; policy: TrustedExecutionPolicy }>)
  | (ExecutionEventBase & Readonly<{ type: 'trusted-receipt'; receipt: TrustedArtifactReceipt }>)
  | (ExecutionEventBase &
      Readonly<{
        type: 'receipt-invalidated';
        receiptId: string;
        status: 'receipt-stale' | 'source-dependency-stale';
        reason: string;
        priorArtifactDigest?: string;
        observedArtifactDigest?: string;
      }>)
  | (ExecutionEventBase & Readonly<{ type: 'handoff'; handoff: ExecutionHandoff; receipt: ExecutionReceipt }>);

export type ExecutionSeed = Readonly<{
  identity: ExecutionIdentity;
  actor: ExecutionActor;
  scope: ExecutionScope;
  requestedGovernance: GovernanceRequest;
}>;

export type ExecutionProjectionOptions = Readonly<{
  now: number;
  maxEvents?: number;
  maxActivities?: number;
  maxPlanSteps?: number;
  maxReceipts?: number;
  maxOutcomes?: number;
  maxHandoffs?: number;
}>;
