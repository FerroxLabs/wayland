/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const orchestrationMocks = vi.hoisted(() => ({
  loadProductionSourceSigningAuthority: vi.fn(),
  publishDestinationTransfer: vi.fn(),
  publishRecoveryTransfer: vi.fn(),
  runAcceptedTransferProducers: vi.fn(),
}));

vi.mock('@process/services/transfer/authority', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@process/services/transfer/authority')>()),
  loadProductionSourceSigningAuthority: orchestrationMocks.loadProductionSourceSigningAuthority,
}));

vi.mock('@process/services/transfer/publish', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@process/services/transfer/publish')>()),
  publishDestinationTransfer: orchestrationMocks.publishDestinationTransfer,
  publishRecoveryTransfer: orchestrationMocks.publishRecoveryTransfer,
}));

vi.mock('@process/services/transfer/producers', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@process/services/transfer/producers')>()),
  runAcceptedTransferProducers: orchestrationMocks.runAcceptedTransferProducers,
}));

import {
  TRANSFER_SOURCE_SIGNING_AUTHORITY_CONTRACT,
  type LoadedSourceSigningAuthority,
} from '@process/services/transfer/authority';
import { TRANSFER_DESTINATION_SUITE, TRANSFER_RECOVERY_SUITE } from '@process/services/transfer/container';
import { DESTINATION_CRYPTO_SUITE, type DestinationRecipientDescriptor } from '@process/services/transfer/crypto';
import type { TransferObjectGraph, TransferSourceCompatibility } from '@process/services/transfer/export';
import {
  createTransferPublication,
  TRANSFER_EXPORT_COORDINATOR_RECEIPT_CONTRACT,
} from '@process/services/transfer/orchestration';
import {
  SourceSigningAuthority,
  TRANSFER_SOURCE_AUTHORIZATION_ALGORITHM,
  TRANSFER_PUBLICATION_RECEIPT_CONTRACT,
  type PublishDestinationTransferInput,
  type PublishRecoveryTransferInput,
  type TransferPublication,
} from '@process/services/transfer/publish';
import type { TransferProducerAggregateCapture } from '@process/services/transfer/producers';

const NOW = 1_000_000;
const EPOCH = `sha256:${'11'.repeat(32)}` as const;
const STREAM_DIGEST = `sha256:${'22'.repeat(32)}` as const;
const SOURCE_COMPATIBILITY: TransferSourceCompatibility = Object.freeze({
  application: 'Wayland',
  appVersion: '0.11.18',
  releaseTrack: 'stable',
  desktopSchemaVersion: 42,
  platform: 'darwin',
  arch: 'arm64',
  minimumReaderFormat: 1,
  maximumReaderFormat: 1,
});
const CAPTURE: TransferProducerAggregateCapture = Object.freeze({
  objects: Object.freeze([
    Object.freeze({
      key: 'desktop-db',
      logicalStateId: 'desktop.chats-projects',
      authorityId: 'desktop.database',
      kind: 'state',
      provenance: 'snapshot-state',
      bytes: new TextEncoder().encode('captured desktop state'),
    }),
  ]),
  authorityBindings: Object.freeze([]),
  mutationEpoch: EPOCH,
});

function publication(
  graph: TransferObjectGraph,
  suite: typeof TRANSFER_RECOVERY_SUITE | typeof TRANSFER_DESTINATION_SUITE
): TransferPublication {
  return Object.freeze({
    records: Object.freeze([]),
    supportReceipt: Object.freeze({
      contract: TRANSFER_PUBLICATION_RECEIPT_CONTRACT,
      bundleId: graph.manifest.bundleId,
      suite,
      chunkCount: graph.manifest.objects.length + 1,
      plaintextBytes: graph.supportReceipt.totalBytes,
      ciphertextBytes: graph.supportReceipt.totalBytes + 16,
      streamDigest: STREAM_DIGEST,
    }),
  });
}

function recipient(fingerprint = `sha256:${'33'.repeat(32)}`): DestinationRecipientDescriptor {
  return {
    suite: DESTINATION_CRYPTO_SUITE,
    keyId: 'destination-key-1',
    publicKey: 'test-public-key',
    fingerprint,
    authorizationBinding: `sha256:${'44'.repeat(32)}`,
    expiresAt: NOW + 15 * 60 * 1000,
  };
}

function loadedIdentity(authority = SourceSigningAuthority.issue()): LoadedSourceSigningAuthority {
  const descriptor = authority.descriptor();
  return Object.freeze({
    authority,
    descriptor,
    receipt: Object.freeze({
      contract: TRANSFER_SOURCE_SIGNING_AUTHORITY_CONTRACT,
      algorithm: TRANSFER_SOURCE_AUTHORIZATION_ALGORITHM,
      publicKeyFingerprint: descriptor.publicKeyFingerprint,
      stateSha256: `sha256:${'55'.repeat(32)}`,
      continuity: 'reloaded',
    }),
  });
}

describe('createTransferPublication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orchestrationMocks.runAcceptedTransferProducers.mockResolvedValue(CAPTURE);
  });

  it('binds one accepted capture epoch into a recovery publication and content-free receipts', async () => {
    const authority = SourceSigningAuthority.issue();
    const sourceIdentity = loadedIdentity(authority);
    orchestrationMocks.loadProductionSourceSigningAuthority.mockResolvedValue(sourceIdentity);
    orchestrationMocks.publishRecoveryTransfer.mockImplementation(async (input: PublishRecoveryTransferInput) =>
      publication(input.graph, TRANSFER_RECOVERY_SUITE)
    );

    const result = await createTransferPublication({
      mode: 'recovery',
      passphrase: 'offline recovery secret',
      sourceCompatibility: SOURCE_COMPATIBILITY,
      selectedLogicalState: ['desktop.chats-projects'],
      exclusions: [],
      sourceAuthorizationExpiresAt: NOW + 15 * 60 * 1000,
      now: () => NOW,
    });

    expect(orchestrationMocks.runAcceptedTransferProducers).toHaveBeenCalledWith({
      selectedLogicalState: ['desktop.chats-projects'],
      excludedLogicalState: [],
    });
    const publishInput = orchestrationMocks.publishRecoveryTransfer.mock.calls[0][0];
    expect(publishInput.sourceAuthorization.mutationEpoch).toEqual({ start: EPOCH, end: EPOCH });
    expect(publishInput.sourceAuthorization.authority).toBe(authority);
    expect(publishInput.graph.manifest.objects).toHaveLength(1);
    expect(result.coordinatorReceipt).toMatchObject({
      contract: TRANSFER_EXPORT_COORDINATOR_RECEIPT_CONTRACT,
      bundleId: result.graphReceipt.bundleId,
      semanticGraphSha256: result.graphReceipt.semanticGraphSha256,
      mutationEpochSha256: EPOCH,
      objectCount: 1,
    });
    expect(result.archiveValidationPolicy.expectedScope).toMatchObject({
      mode: 'recovery',
      recoveryMode: 'passphrase',
      mutationEpoch: { start: EPOCH, end: EPOCH },
    });
    expect(Object.keys(result).toSorted()).toEqual([
      'archiveValidationPolicy',
      'coordinatorReceipt',
      'graphReceipt',
      'publication',
      'sourceAuthorityReceipt',
    ]);
    expect(result.sourceAuthorityReceipt.publicKeyFingerprint).toBe(authority.descriptor().publicKeyFingerprint);
  });

  it('binds the validated destination fingerprint into the signed scope', async () => {
    const target = recipient();
    orchestrationMocks.loadProductionSourceSigningAuthority.mockResolvedValue(loadedIdentity());
    orchestrationMocks.publishDestinationTransfer.mockImplementation(async (input: PublishDestinationTransferInput) =>
      publication(input.graph, TRANSFER_DESTINATION_SUITE)
    );
    const result = await createTransferPublication({
      mode: 'destination',
      recipient: target,
      sourceCompatibility: SOURCE_COMPATIBILITY,
      selectedLogicalState: ['desktop.chats-projects'],
      exclusions: [],
      sourceAuthorizationExpiresAt: NOW + 15 * 60 * 1000,
      now: () => NOW,
    });

    expect(result.archiveValidationPolicy.expectedScope).toMatchObject({
      mode: 'destination',
      destinationKeyFingerprint: target.fingerprint,
    });
    expect(orchestrationMocks.publishDestinationTransfer).toHaveBeenCalledOnce();
  });

  it('fails closed on malformed destination identity and publication graph drift', async () => {
    orchestrationMocks.loadProductionSourceSigningAuthority.mockResolvedValue(loadedIdentity());
    orchestrationMocks.publishDestinationTransfer.mockImplementation(async (input: PublishDestinationTransferInput) =>
      publication(input.graph, TRANSFER_DESTINATION_SUITE)
    );
    await expect(
      createTransferPublication({
        mode: 'destination',
        recipient: recipient('not-a-digest'),
        sourceCompatibility: SOURCE_COMPATIBILITY,
        selectedLogicalState: ['desktop.chats-projects'],
        exclusions: [],
        sourceAuthorizationExpiresAt: NOW + 15 * 60 * 1000,
        now: () => NOW,
      })
    ).rejects.toThrow(/fingerprint is malformed/);
    expect(orchestrationMocks.publishDestinationTransfer).not.toHaveBeenCalled();

    orchestrationMocks.publishRecoveryTransfer.mockImplementation(async (input: PublishRecoveryTransferInput) => ({
      ...publication(input.graph, TRANSFER_RECOVERY_SUITE),
      supportReceipt: {
        ...publication(input.graph, TRANSFER_RECOVERY_SUITE).supportReceipt,
        bundleId: `wtb1:${'ff'.repeat(32)}`,
      },
    }));

    await expect(
      createTransferPublication({
        mode: 'recovery',
        passphrase: 'offline recovery secret',
        sourceCompatibility: SOURCE_COMPATIBILITY,
        selectedLogicalState: ['desktop.chats-projects'],
        exclusions: [],
        sourceAuthorizationExpiresAt: NOW + 15 * 60 * 1000,
        now: () => NOW,
      })
    ).rejects.toThrow(/does not bind the captured graph/);
  });

  it('ignores an attempted runtime dependency injection and uses the production authority', async () => {
    const productionIdentity = loadedIdentity();
    const injectedLoader = vi.fn(async () => loadedIdentity());
    orchestrationMocks.loadProductionSourceSigningAuthority.mockResolvedValue(productionIdentity);
    orchestrationMocks.publishRecoveryTransfer.mockImplementation(async (input: PublishRecoveryTransferInput) =>
      publication(input.graph, TRANSFER_RECOVERY_SUITE)
    );

    const callWithHostileExtraArgument = createTransferPublication as unknown as (
      input: Parameters<typeof createTransferPublication>[0],
      dependencies: { loadSourceAuthority: typeof injectedLoader }
    ) => ReturnType<typeof createTransferPublication>;
    const result = await callWithHostileExtraArgument(
      {
        mode: 'recovery',
        passphrase: 'offline recovery secret',
        sourceCompatibility: SOURCE_COMPATIBILITY,
        selectedLogicalState: ['desktop.chats-projects'],
        exclusions: [],
        sourceAuthorizationExpiresAt: NOW + 15 * 60 * 1000,
        now: () => NOW,
      },
      { loadSourceAuthority: injectedLoader }
    );

    expect(injectedLoader).not.toHaveBeenCalled();
    expect(orchestrationMocks.loadProductionSourceSigningAuthority).toHaveBeenCalledOnce();
    expect(result.sourceAuthorityReceipt.publicKeyFingerprint).toBe(productionIdentity.receipt.publicKeyFingerprint);
  });
});
