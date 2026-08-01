/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { LogicalStateId } from '@process/services/recovery/recoveryManifest';
import type {
  TransferDigest,
  TransferObjectGraph,
  TransferObjectId,
  TransferObjectKind,
} from '@process/services/transfer/export';

export const TRANSFER_IMPORT_DRY_RUN_CONTRACT = 'wayland-transfer-import-dry-run/1.0' as const;
export const TRANSFER_IMPORT_NON_CLAIM =
  'Dry-run only: no live state was mutated and no consumer execution, credential reconnection, activation, or transactional commit is claimed.' as const;

export type TransferImportDestinationObject = Readonly<{
  destinationObjectId: string;
  logicalStateId: LogicalStateId;
  kind: TransferObjectKind;
  sha256: TransferDigest;
  sourceObjectId?: TransferObjectId;
}>;

export type TransferImportDestination = Readonly<{
  /** The caller must obtain this inventory from an authoritative destination snapshot. */
  instanceId: string;
  compatibility: Readonly<{
    minimumFormat: number;
    maximumFormat: number;
    minimumDesktopSchemaVersion: number;
    maximumDesktopSchemaVersion: number;
    acceptedReleaseTracks: readonly ('stable' | 'preview')[];
  }>;
  existingObjects: readonly TransferImportDestinationObject[];
}>;

export type TransferImportConflictDecision = 'create' | 'merge' | 'replace' | 'skip';
export type TransferImportActivation = 'inactive' | 'paused-review' | 'quarantine-review';

/**
 * Optional caller assertions. They cannot alter the computed plan: every field
 * must exactly match the fail-closed planner result.
 */
export type TransferImportRequestedDecision = Readonly<{
  sourceObjectId: TransferObjectId;
  destinationObjectId: string;
  conflictDecision: TransferImportConflictDecision;
  activation: TransferImportActivation;
}>;

export type TransferImportPriorBinding = Readonly<{
  idempotencyKeySha256: TransferDigest;
  destinationInstanceId: string;
  semanticGraphSha256: TransferDigest;
  planSha256: TransferDigest;
}>;

export type PlanTransferImportInput = Readonly<{
  /** The caller must authenticate and decrypt this graph before planning. */
  graph: TransferObjectGraph;
  destination: TransferImportDestination;
  idempotencyKey: string;
  priorBindings?: readonly TransferImportPriorBinding[];
  requestedDecisions?: readonly TransferImportRequestedDecision[];
}>;

export type TransferImportObjectDecision = Readonly<{
  sourceObjectId: TransferObjectId;
  sourceSha256: TransferDigest;
  sourceByteLength: number;
  sourceImmutableBytes: true;
  destinationObjectId: string;
  destinationDependencies: readonly string[];
  logicalStateId: LogicalStateId;
  kind: TransferObjectKind;
  conflictDecision: TransferImportConflictDecision;
  activation: TransferImportActivation;
  handling: 'portable' | 'external-reference' | 'immutable-receipt';
  preserveSourceBytes: true;
  preserveSourceId: boolean;
}>;

export type TransferImportFamilyDecision = Readonly<{
  logicalStateId: LogicalStateId;
  action: 'reconnect' | 'external-reference' | 'skip';
  executable: false;
}>;

export type TransferImportBlocker = Readonly<{
  code: 'CONSUMER_UNAVAILABLE';
  logicalStateId: LogicalStateId;
}>;

/** Content-free counts suitable for diagnostics. */
export type TransferImportDryRunSummary = Readonly<{
  objectCount: number;
  createCount: number;
  mergeCount: number;
  replaceCount: number;
  skipCount: number;
  receiptCount: number;
  externalReferenceCount: number;
  reconnectFamilyCount: number;
  blockedConsumerCount: number;
}>;

export type TransferImportDryRunPlan = Readonly<{
  contract: typeof TRANSFER_IMPORT_DRY_RUN_CONTRACT;
  bundleId: string;
  semanticGraphSha256: TransferDigest;
  sourceManifestSha256: TransferDigest;
  destinationInstanceId: string;
  destinationInventorySha256: TransferDigest;
  idempotencyKeySha256: TransferDigest;
  planSha256: TransferDigest;
  repeat: 'new' | 'identical';
  objectDecisions: readonly TransferImportObjectDecision[];
  familyDecisions: readonly TransferImportFamilyDecision[];
  blockers: readonly TransferImportBlocker[];
  readyForTransactionalApply: boolean;
  summary: TransferImportDryRunSummary;
  nonClaim: typeof TRANSFER_IMPORT_NON_CLAIM;
}>;
