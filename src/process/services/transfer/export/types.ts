/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { LogicalStateId, StateAuthorityId } from '@process/services/recovery/recoveryManifest';

export const TRANSFER_INNER_MANIFEST_CONTRACT = 'wayland-transfer-inner-manifest/1.0' as const;
export const TRANSFER_OBJECT_GRAPH_RECEIPT_CONTRACT = 'wayland-transfer-object-graph-receipt/1.0' as const;
export const TRANSFER_INNER_MANIFEST_FORMAT = 1 as const;

export type TransferDigest = `sha256:${string}`;
export type TransferObjectId = `wto1:${string}`;
export type TransferBundleId = `wtb1:${string}`;

export type TransferSourceCompatibility = Readonly<{
  application: 'Wayland';
  appVersion: string;
  releaseTrack: 'stable' | 'preview';
  desktopSchemaVersion: number;
  platform: 'darwin' | 'win32' | 'linux';
  arch: 'arm64' | 'x64';
  minimumReaderFormat: 1;
  maximumReaderFormat: 1;
}>;

export type TransferObjectKind = 'state' | 'artifact' | 'receipt' | 'reference';
export type TransferProvenanceClassification =
  | 'snapshot-state'
  | 'user-artifact'
  | 'authoritative-receipt'
  | 'derived-receipt'
  | 'external-reference';

export type TransferSnapshotObjectInput = Readonly<{
  /** Construction-local identifier. It is never serialized into the transfer. */
  key: string;
  logicalStateId: LogicalStateId;
  authorityId: StateAuthorityId;
  kind: TransferObjectKind;
  provenance: TransferProvenanceClassification;
  bytes: Uint8Array;
  dependencyKeys?: readonly string[];
}>;

export type TransferExclusionDisposition = 'excluded' | 'reference-only' | 'reconnect-required';
export type TransferExclusionReason =
  | 'CREDENTIAL_RECONNECT_REQUIRED'
  | 'EXTERNAL_REFERENCE_ONLY'
  | 'POLICY_EXCLUDED'
  | 'PRODUCER_UNAVAILABLE'
  | 'UPDATER_STATE_EXCLUDED';

export type TransferFamilyExclusion = Readonly<{
  logicalStateId: LogicalStateId;
  disposition: TransferExclusionDisposition;
  reasonCode: TransferExclusionReason;
}>;

export type TransferObjectDescriptor = Readonly<{
  id: TransferObjectId;
  ordinal: number;
  logicalStateId: LogicalStateId;
  authorityId: StateAuthorityId;
  kind: TransferObjectKind;
  byteLength: number;
  sha256: TransferDigest;
  dependencies: readonly TransferObjectId[];
  provenance: TransferProvenanceClassification;
  immutableBytes: true;
}>;

export type TransferInnerManifest = Readonly<{
  contract: typeof TRANSFER_INNER_MANIFEST_CONTRACT;
  formatVersion: typeof TRANSFER_INNER_MANIFEST_FORMAT;
  bundleId: TransferBundleId;
  sourceCompatibility: TransferSourceCompatibility;
  selectedLogicalState: readonly LogicalStateId[];
  exclusions: readonly TransferFamilyExclusion[];
  objects: readonly TransferObjectDescriptor[];
  resumability: Readonly<{
    strategy: 'ordinal-content-addressed-v1';
    objectCount: number;
    totalBytes: number;
    terminalOrdinal: number;
    semanticGraphSha256: TransferDigest;
  }>;
}>;

/** Content-free evidence suitable for diagnostics and support logs. */
export type TransferObjectGraphReceipt = Readonly<{
  contract: typeof TRANSFER_OBJECT_GRAPH_RECEIPT_CONTRACT;
  bundleId: TransferBundleId;
  manifestSha256: TransferDigest;
  semanticGraphSha256: TransferDigest;
  objectCount: number;
  totalBytes: number;
  selectedFamilyCount: number;
  excludedFamilyCount: number;
}>;

export type TransferObjectGraph = Readonly<{
  manifest: TransferInnerManifest;
  manifestBytes: Uint8Array;
  /** Every value is a defensive copy of the already-snapshotted input bytes. */
  objects: ReadonlyMap<TransferObjectId, Uint8Array>;
  supportReceipt: TransferObjectGraphReceipt;
}>;

export type BuildTransferObjectGraphInput = Readonly<{
  sourceCompatibility: TransferSourceCompatibility;
  selectedLogicalState: readonly LogicalStateId[];
  exclusions: readonly TransferFamilyExclusion[];
  objects: readonly TransferSnapshotObjectInput[];
}>;
