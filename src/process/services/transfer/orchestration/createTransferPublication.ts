/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { LogicalStateId } from '@process/services/recovery/recoveryManifest';
import type { DestinationRecipientDescriptor } from '@process/services/transfer/crypto';
import {
  buildTransferObjectGraph,
  type TransferDigest,
  type TransferFamilyExclusion,
  type TransferObjectGraphReceipt,
  type TransferSourceCompatibility,
} from '@process/services/transfer/export';
import {
  publishDestinationTransfer,
  publishRecoveryTransfer,
  sourceScopeForGraph,
  type SourceAuthorizationValidationPolicy,
  type SourceSigningAuthority,
  type TransferMutationEpoch,
  type TransferPublication,
} from '@process/services/transfer/publish';
import {
  runAcceptedTransferProducers,
  type RunAcceptedTransferProducersInput,
  type TransferProducerAggregateCapture,
} from '@process/services/transfer/producers';

export const TRANSFER_EXPORT_COORDINATOR_RECEIPT_CONTRACT = 'wayland-transfer-export-coordinator-receipt/1.0' as const;

type DestinationMode = Readonly<{
  mode: 'destination';
  recipient: DestinationRecipientDescriptor;
}>;

type RecoveryMode = Readonly<{
  mode: 'recovery';
  passphrase: string | Uint8Array;
}>;

export type CreateTransferPublicationInput = Readonly<{
  sourceCompatibility: TransferSourceCompatibility;
  selectedLogicalState: readonly LogicalStateId[];
  exclusions: readonly TransferFamilyExclusion[];
  sourceAuthority: SourceSigningAuthority;
  sourceAuthorizationExpiresAt: number;
  now?: () => number;
}> &
  (DestinationMode | RecoveryMode);

export type TransferExportCoordinatorReceipt = Readonly<{
  contract: typeof TRANSFER_EXPORT_COORDINATOR_RECEIPT_CONTRACT;
  bundleId: string;
  semanticGraphSha256: `sha256:${string}`;
  mutationEpochSha256: `sha256:${string}`;
  selectedFamilyCount: number;
  excludedFamilyCount: number;
  objectCount: number;
}>;

export type CreatedTransferPublication = Readonly<{
  publication: TransferPublication;
  graphReceipt: TransferObjectGraphReceipt;
  coordinatorReceipt: TransferExportCoordinatorReceipt;
  archiveValidationPolicy: SourceAuthorizationValidationPolicy;
}>;

export type TransferExportCoordinatorDependencies = Readonly<{
  capture?: (input: RunAcceptedTransferProducersInput) => Promise<TransferProducerAggregateCapture>;
  publishDestination?: typeof publishDestinationTransfer;
  publishRecovery?: typeof publishRecoveryTransfer;
}>;

/**
 * Capture one accepted mutation epoch, construct the complete graph, and bind
 * that exact epoch into the signed encrypted publication. No plaintext object
 * inventory is returned outside the encrypted publication.
 */
export async function createTransferPublication(
  input: CreateTransferPublicationInput,
  dependencies: TransferExportCoordinatorDependencies = {}
): Promise<CreatedTransferPublication> {
  const excludedLogicalState = input.exclusions.map(({ logicalStateId }) => logicalStateId);
  const capture = await (dependencies.capture ?? runAcceptedTransferProducers)({
    selectedLogicalState: input.selectedLogicalState,
    excludedLogicalState,
  });
  const graph = buildTransferObjectGraph({
    sourceCompatibility: input.sourceCompatibility,
    selectedLogicalState: input.selectedLogicalState,
    exclusions: input.exclusions,
    objects: capture.objects,
  });
  const mutationEpoch: TransferMutationEpoch = Object.freeze({
    start: capture.mutationEpoch,
    end: capture.mutationEpoch,
  });
  const now = input.now ?? Date.now;
  const sourceAuthorization = {
    authority: input.sourceAuthority,
    mutationEpoch,
    expiresAt: input.sourceAuthorizationExpiresAt,
  } as const;
  const target =
    input.mode === 'destination'
      ? ({ mode: 'destination', destinationKeyFingerprint: asTransferDigest(input.recipient.fingerprint) } as const)
      : ({ mode: 'recovery', recoveryMode: 'passphrase' } as const);
  const expectedScope = sourceScopeForGraph(
    graph.manifest.resumability.semanticGraphSha256,
    graph.manifest.bundleId,
    graph.manifest.selectedLogicalState,
    graph.manifest.exclusions,
    mutationEpoch,
    target
  );
  const archiveValidationPolicy: SourceAuthorizationValidationPolicy = Object.freeze({
    trustedAuthority: input.sourceAuthority.descriptor(),
    expectedScope,
    now,
  });
  const publication =
    input.mode === 'destination'
      ? await (dependencies.publishDestination ?? publishDestinationTransfer)({
          graph,
          recipient: input.recipient,
          sourceAuthorization,
          now,
        })
      : await (dependencies.publishRecovery ?? publishRecoveryTransfer)({
          graph,
          passphrase: input.passphrase,
          sourceAuthorization,
          now,
        });
  if (publication.supportReceipt.bundleId !== graph.supportReceipt.bundleId) {
    throw new Error('Transfer export publication does not bind the captured graph');
  }
  return Object.freeze({
    publication,
    graphReceipt: Object.freeze({ ...graph.supportReceipt }),
    coordinatorReceipt: Object.freeze({
      contract: TRANSFER_EXPORT_COORDINATOR_RECEIPT_CONTRACT,
      bundleId: graph.manifest.bundleId,
      semanticGraphSha256: graph.manifest.resumability.semanticGraphSha256,
      mutationEpochSha256: capture.mutationEpoch,
      selectedFamilyCount: graph.manifest.selectedLogicalState.length,
      excludedFamilyCount: graph.manifest.exclusions.length,
      objectCount: graph.manifest.objects.length,
    }),
    archiveValidationPolicy,
  });
}

function asTransferDigest(value: string): TransferDigest {
  if (!/^sha256:[0-9a-f]{64}$/.test(value)) {
    throw new Error('Transfer destination key fingerprint is malformed');
  }
  return value as TransferDigest;
}
