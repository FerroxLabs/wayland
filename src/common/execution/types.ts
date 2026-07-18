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
  detail?: string;
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

export type ExecutionValidation = Readonly<{
  status: 'unvalidated' | 'valid' | 'invalid';
  receiptId?: string;
  reason?: string;
}>;

export type ExecutionReceipt = Readonly<{
  id: string;
  kind: 'policy' | 'usage' | 'cost' | 'latency' | 'validation' | 'handoff';
  authority: 'provider' | 'flux' | 'core' | 'desktop';
  identity: ExecutionIdentity;
  observedAt: number;
}>;

export type ExecutionOutcome = Readonly<{
  id: string;
  kind: 'artifact' | 'file' | 'message' | 'report';
  label: string;
  uri?: string;
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
  usage: AuthoritativeUsage | UnavailableMetric;
  cost: AuthoritativeCost | UnavailableMetric;
  costLedger: ExecutionCostLedger;
  latency: AuthoritativeLatency | UnavailableMetric;
  validation: ExecutionValidation;
  receipts: readonly ExecutionReceipt[];
  outcomes: readonly ExecutionOutcome[];
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
  | (ExecutionEventBase & Readonly<{ type: 'outcome'; outcome: ExecutionOutcome }>)
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
