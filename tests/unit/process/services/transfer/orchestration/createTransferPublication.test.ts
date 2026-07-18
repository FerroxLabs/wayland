/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';

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
  it('binds one accepted capture epoch into a recovery publication and content-free receipts', async () => {
    const authority = SourceSigningAuthority.issue();
    const sourceIdentity = loadedIdentity(authority);
    const capture = vi.fn(async () => CAPTURE);
    const publishRecovery = vi.fn(async (input: PublishRecoveryTransferInput) =>
      publication(input.graph, TRANSFER_RECOVERY_SUITE)
    );

    const result = await createTransferPublication(
      {
        mode: 'recovery',
        passphrase: 'offline recovery secret',
        sourceCompatibility: SOURCE_COMPATIBILITY,
        selectedLogicalState: ['desktop.chats-projects'],
        exclusions: [],
        sourceAuthorizationExpiresAt: NOW + 15 * 60 * 1000,
        now: () => NOW,
      },
      { capture, loadSourceAuthority: async () => sourceIdentity, publishRecovery }
    );

    expect(capture).toHaveBeenCalledWith({
      selectedLogicalState: ['desktop.chats-projects'],
      excludedLogicalState: [],
    });
    const publishInput = publishRecovery.mock.calls[0][0];
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
    const publishDestination = vi.fn(async (input: PublishDestinationTransferInput) =>
      publication(input.graph, TRANSFER_DESTINATION_SUITE)
    );
    const result = await createTransferPublication(
      {
        mode: 'destination',
        recipient: target,
        sourceCompatibility: SOURCE_COMPATIBILITY,
        selectedLogicalState: ['desktop.chats-projects'],
        exclusions: [],
        sourceAuthorizationExpiresAt: NOW + 15 * 60 * 1000,
        now: () => NOW,
      },
      { capture: async () => CAPTURE, loadSourceAuthority: async () => loadedIdentity(), publishDestination }
    );

    expect(result.archiveValidationPolicy.expectedScope).toMatchObject({
      mode: 'destination',
      destinationKeyFingerprint: target.fingerprint,
    });
    expect(publishDestination).toHaveBeenCalledOnce();
  });

  it('fails closed on malformed destination identity and publication graph drift', async () => {
    const publishDestination = vi.fn(async (input: PublishDestinationTransferInput) =>
      publication(input.graph, TRANSFER_DESTINATION_SUITE)
    );
    await expect(
      createTransferPublication(
        {
          mode: 'destination',
          recipient: recipient('not-a-digest'),
          sourceCompatibility: SOURCE_COMPATIBILITY,
          selectedLogicalState: ['desktop.chats-projects'],
          exclusions: [],
          sourceAuthorizationExpiresAt: NOW + 15 * 60 * 1000,
          now: () => NOW,
        },
        { capture: async () => CAPTURE, loadSourceAuthority: async () => loadedIdentity(), publishDestination }
      )
    ).rejects.toThrow(/fingerprint is malformed/);
    expect(publishDestination).not.toHaveBeenCalled();

    await expect(
      createTransferPublication(
        {
          mode: 'recovery',
          passphrase: 'offline recovery secret',
          sourceCompatibility: SOURCE_COMPATIBILITY,
          selectedLogicalState: ['desktop.chats-projects'],
          exclusions: [],
          sourceAuthorizationExpiresAt: NOW + 15 * 60 * 1000,
          now: () => NOW,
        },
        {
          capture: async () => CAPTURE,
          loadSourceAuthority: async () => loadedIdentity(),
          publishRecovery: async (input) => ({
            ...publication(input.graph, TRANSFER_RECOVERY_SUITE),
            supportReceipt: {
              ...publication(input.graph, TRANSFER_RECOVERY_SUITE).supportReceipt,
              bundleId: `wtb1:${'ff'.repeat(32)}`,
            },
          }),
        }
      )
    ).rejects.toThrow(/does not bind the captured graph/);
  });
});
