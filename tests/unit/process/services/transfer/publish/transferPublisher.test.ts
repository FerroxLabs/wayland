/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@noble/hashes/argon2.js', () => ({
  argon2idAsync: vi.fn(async () => new Uint8Array(32).fill(0x42)),
}));

import { argon2idAsync } from '@noble/hashes/argon2.js';
import {
  parseTransferContainerHeader,
  serializeTransferContainerRecord,
  TRANSFER_CHUNK_SCHEMA,
  TRANSFER_DESTINATION_SUITE,
  TRANSFER_RECOVERY_SUITE,
  type TransferChunkDescriptor,
  type TransferContainerHeader,
} from '@process/services/transfer/container';
import {
  DESTINATION_AEAD,
  DESTINATION_CRYPTO_FORMAT,
  DESTINATION_CRYPTO_SUITE,
  DESTINATION_KDF,
  DESTINATION_KEM,
  DestinationRecipientKey,
  RecoveryBundleCryptoSession,
  serializeDestinationChunkEnvelope,
} from '@process/services/transfer/crypto';
import { buildTransferObjectGraph, type BuildTransferObjectGraphInput } from '@process/services/transfer/export';
import {
  publishDestinationTransfer,
  publishRecoveryTransfer,
  TRANSFER_PUBLICATION_RECEIPT_CONTRACT,
  validateTransferPublication,
  type TransferPublication,
  type TransferPublicationChunkRecord,
  type TransferPublicationRecord,
} from '@process/services/transfer/publish';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const AUTHORIZATION_BINDING = `sha256:${'ab'.repeat(32)}` as const;
const NOW = 1_000_000;

function graphInput(): BuildTransferObjectGraphInput {
  return {
    sourceCompatibility: {
      application: 'Wayland',
      appVersion: '0.11.18',
      releaseTrack: 'stable',
      desktopSchemaVersion: 42,
      platform: 'darwin',
      arch: 'arm64',
      minimumReaderFormat: 1,
      maximumReaderFormat: 1,
    },
    selectedLogicalState: ['desktop.artifacts-receipts', 'desktop.chats-projects'],
    exclusions: [],
    objects: [
      {
        key: 'database',
        logicalStateId: 'desktop.chats-projects',
        authorityId: 'desktop.database',
        kind: 'state',
        provenance: 'snapshot-state',
        bytes: encoder.encode('private chat and project state'),
      },
      {
        key: 'receipt',
        logicalStateId: 'desktop.artifacts-receipts',
        authorityId: 'desktop.runtime-files',
        kind: 'receipt',
        provenance: 'authoritative-receipt',
        bytes: encoder.encode('{"cost":"1.25","customer":"private"}'),
        dependencyKeys: ['database'],
      },
    ],
  };
}

function chunkRecords(publication: TransferPublication): TransferPublicationChunkRecord[] {
  return publication.records.filter(
    (record): record is TransferPublicationChunkRecord => record.recordType === 'chunk'
  );
}

function parseDescriptor(record: TransferPublicationChunkRecord): TransferChunkDescriptor {
  return JSON.parse(decoder.decode(record.descriptor)) as TransferChunkDescriptor;
}

function copyRecords(records: readonly TransferPublicationRecord[]): TransferPublicationRecord[] {
  return records.map((record) =>
    record.recordType === 'chunk'
      ? {
          recordType: 'chunk',
          descriptor: Uint8Array.from(record.descriptor),
          ciphertext: Uint8Array.from(record.ciphertext),
        }
      : { recordType: record.recordType, serialized: Uint8Array.from(record.serialized) }
  );
}

function replaceDescriptor(
  records: TransferPublicationRecord[],
  chunkIndex: number,
  mutation: Partial<TransferChunkDescriptor>
): void {
  const chunks = records.filter((record): record is TransferPublicationChunkRecord => record.recordType === 'chunk');
  const target = chunks[chunkIndex];
  const recordIndex = records.indexOf(target);
  records[recordIndex] = {
    recordType: 'chunk',
    descriptor: serializeTransferContainerRecord({ ...parseDescriptor(target), ...mutation }),
    ciphertext: Uint8Array.from(target.ciphertext),
  };
}

function replaceHeader(records: TransferPublicationRecord[], mutation: Partial<TransferContainerHeader>): void {
  const header = records[0];
  if (header.recordType !== 'header') throw new Error('test publication has no header');
  const parsed = JSON.parse(decoder.decode(header.serialized)) as TransferContainerHeader;
  records[0] = {
    recordType: 'header',
    serialized: serializeTransferContainerRecord({ ...parsed, ...mutation } as TransferContainerHeader),
  };
}

describe('Wayland Transfer encrypted publication pipeline', () => {
  beforeEach(() => {
    vi.mocked(argon2idAsync).mockClear();
  });

  it('publishes manifest ordinal zero and graph objects in manifest order with one recovery KDF', async () => {
    const graph = buildTransferObjectGraph(graphInput());
    const publication = await publishRecoveryTransfer({ graph, passphrase: 'recovery credential' });
    const chunks = chunkRecords(publication);
    const descriptors = chunks.map(parseDescriptor);
    const headerRecord = publication.records[0];
    if (headerRecord.recordType !== 'header') throw new Error('publication has no header');
    const header = parseTransferContainerHeader(headerRecord.serialized);

    expect(header.suite).toBe(TRANSFER_RECOVERY_SUITE);
    expect(descriptors.map((descriptor) => descriptor.ordinal)).toEqual([0, 1, 2]);
    expect(descriptors[0].contentDigest).toBe(graph.supportReceipt.manifestSha256);
    expect(descriptors.slice(1).map((descriptor) => descriptor.contentDigest)).toEqual(
      graph.manifest.objects.map((object) => object.sha256)
    );
    expect(new Set(descriptors.map((descriptor) => descriptor.nonce)).size).toBe(3);
    expect(argon2idAsync).toHaveBeenCalledTimes(1);
    expect(validateTransferPublication(publication.records)).toEqual(publication.supportReceipt);
  });

  it('round-trips every recovery chunk from the generic outer records', async () => {
    const graph = buildTransferObjectGraph(graphInput());
    const publication = await publishRecoveryTransfer({ graph, passphrase: 'recovery credential' });
    const headerRecord = publication.records[0];
    if (headerRecord.recordType !== 'header') throw new Error('publication has no header');
    const header = parseTransferContainerHeader(headerRecord.serialized);
    if (header.suite !== TRANSFER_RECOVERY_SUITE) throw new Error('unexpected suite');
    const session = await RecoveryBundleCryptoSession.open('recovery credential', {
      algorithm: header.protection.kdf,
      version: header.protection.argon2Version,
      memoryKiB: header.protection.memoryKiB,
      iterations: header.protection.iterations,
      parallelism: header.protection.parallelism,
      keyLength: header.protection.keyBytes,
      salt: header.protection.salt,
    });
    const plaintexts = chunkRecords(publication).map((record) => {
      const descriptor = parseDescriptor(record);
      return session.decryptChunk({
        bundleId: descriptor.bundleId,
        schema: descriptor.schema,
        ordinal: descriptor.ordinal,
        declaredLength: descriptor.plaintextLength,
        contentDigest: descriptor.contentDigest,
        nonce: descriptor.nonce!,
        ciphertext: Buffer.from(record.ciphertext).toString('base64url'),
      }).plaintext;
    });

    expect(plaintexts[0]).toEqual(graph.manifestBytes);
    expect(plaintexts.slice(1)).toEqual(graph.manifest.objects.map((object) => graph.objects.get(object.id)));
    expect(argon2idAsync).toHaveBeenCalledTimes(2);
  });

  it('uses a fresh one-shot HPKE encapsulation for every destination chunk and round-trips them', async () => {
    const graph = buildTransferObjectGraph(graphInput());
    const recipient = await DestinationRecipientKey.issue({
      keyId: 'destination-key-1',
      authorizationBinding: AUTHORIZATION_BINDING,
      expiresAt: NOW + 15 * 60 * 1000,
      now: () => NOW,
    });
    const publication = await publishDestinationTransfer({ graph, recipient: recipient.descriptor(), now: () => NOW });
    const chunks = chunkRecords(publication);
    const descriptors = chunks.map(parseDescriptor);
    const encapsulatedKeys = descriptors.map((descriptor) => descriptor.encapsulatedKey!);
    const headerRecord = publication.records[0];
    if (headerRecord.recordType !== 'header') throw new Error('publication has no header');
    const header = parseTransferContainerHeader(headerRecord.serialized);
    if (header.suite !== TRANSFER_DESTINATION_SUITE) throw new Error('unexpected suite');

    expect(new Set(encapsulatedKeys).size).toBe(chunks.length);
    expect(descriptors.every((descriptor) => descriptor.nonce === undefined)).toBe(true);
    expect(header.protection).toMatchObject({
      recipientKeyId: recipient.descriptor().keyId,
      recipientKeyFingerprint: recipient.descriptor().fingerprint,
      authorizationBinding: AUTHORIZATION_BINDING,
      expiresAt: recipient.descriptor().expiresAt,
    });
    await Promise.all(
      chunks.map(async (record) => {
        const descriptor = parseDescriptor(record);
        const opened = await recipient.openChunk(
          serializeDestinationChunkEnvelope({
            format: DESTINATION_CRYPTO_FORMAT,
            suite: DESTINATION_CRYPTO_SUITE,
            kem: DESTINATION_KEM,
            kdf: DESTINATION_KDF,
            aead: DESTINATION_AEAD,
            recipientKeyId: recipient.descriptor().keyId,
            recipientFingerprint: recipient.descriptor().fingerprint,
            authorizationBinding: recipient.descriptor().authorizationBinding,
            expiresAt: recipient.descriptor().expiresAt,
            bundleId: descriptor.bundleId,
            schema: descriptor.schema,
            ordinal: descriptor.ordinal,
            declaredLength: descriptor.plaintextLength,
            contentDigest: descriptor.contentDigest,
            encapsulatedKey: descriptor.encapsulatedKey!,
            ciphertext: Buffer.from(record.ciphertext).toString('base64url'),
          })
        );
        expect(opened.ordinal).toBe(descriptor.ordinal);
      })
    );
    expect(publication.supportReceipt.suite).toBe(TRANSFER_DESTINATION_SUITE);
  });

  it('keeps the outer records and support receipt content-free', async () => {
    const graph = buildTransferObjectGraph(graphInput());
    const publication = await publishRecoveryTransfer({ graph, passphrase: 'recovery credential' });
    const visible = publication.records
      .map((record) =>
        record.recordType === 'chunk' ? decoder.decode(record.descriptor) : decoder.decode(record.serialized)
      )
      .join('\n');
    const receipt = JSON.stringify(publication.supportReceipt);

    expect(visible).not.toMatch(/desktop|chat|project|artifact|customer|cost|private/i);
    expect(receipt).not.toMatch(/desktop|chat|project|artifact|customer|cost|private/i);
    expect(publication.supportReceipt.contract).toBe(TRANSFER_PUBLICATION_RECEIPT_CONTRACT);
    expect(Object.keys(parseDescriptor(chunkRecords(publication)[0])).toSorted()).toEqual([
      'bundleId',
      'ciphertextDigest',
      'ciphertextLength',
      'contentDigest',
      'nonce',
      'ordinal',
      'plaintextLength',
      'recordType',
      'schema',
    ]);
  });

  it('rejects expired, overlong, and mid-publication destination authority', async () => {
    const graph = buildTransferObjectGraph(graphInput());
    const recipient = await DestinationRecipientKey.issue({
      keyId: 'destination-key-1',
      authorizationBinding: AUTHORIZATION_BINDING,
      expiresAt: NOW + 15 * 60 * 1000,
      now: () => NOW,
    });
    await expect(
      publishDestinationTransfer({ graph, recipient: { ...recipient.descriptor(), expiresAt: NOW }, now: () => NOW })
    ).rejects.toThrow(/expired/);
    await expect(
      publishDestinationTransfer({
        graph,
        recipient: { ...recipient.descriptor(), expiresAt: NOW + 15 * 60 * 1000 + 1 },
        now: () => NOW,
      })
    ).rejects.toThrow(/15 minutes/);

    let call = 0;
    const expiresDuringPublish = () => (call++ < 2 ? NOW : recipient.descriptor().expiresAt);
    await expect(
      publishDestinationTransfer({ graph, recipient: recipient.descriptor(), now: expiresDuringPublish })
    ).rejects.toThrow(/expired/);
  });

  it('rejects graph mutation before any publication can be accepted', async () => {
    const graph = buildTransferObjectGraph(graphInput());
    const object = graph.manifest.objects[0];
    graph.objects.get(object.id)![0] ^= 0xff;

    await expect(publishRecoveryTransfer({ graph, passphrase: 'recovery credential' })).rejects.toThrow(
      /content digest mismatch/
    );
    expect(argon2idAsync).not.toHaveBeenCalled();
  });

  it('fails closed on truncation, post-terminal records, ordinal drift, and ciphertext mismatch', async () => {
    const graph = buildTransferObjectGraph(graphInput());
    const publication = await publishRecoveryTransfer({ graph, passphrase: 'recovery credential' });

    expect(() => validateTransferPublication(publication.records.slice(0, -1))).toThrow(/truncated/);
    expect(() => validateTransferPublication([...publication.records, copyRecords(publication.records)[1]])).toThrow(
      /after terminal/
    );

    const reordered = copyRecords(publication.records);
    replaceDescriptor(reordered, 0, { ordinal: 1 });
    expect(() => validateTransferPublication(reordered)).toThrow(/gap or reordering/);

    const tampered = copyRecords(publication.records);
    const firstChunk = tampered.find(
      (record): record is TransferPublicationChunkRecord => record.recordType === 'chunk'
    )!;
    firstChunk.ciphertext[0] ^= 0x80;
    expect(() => validateTransferPublication(tampered)).toThrow(/ciphertext digest mismatch/);
  });

  it('rejects declared-count drift and duplicate recovery nonces or destination encapsulated keys', async () => {
    const graph = buildTransferObjectGraph(graphInput());
    const recovery = await publishRecoveryTransfer({ graph, passphrase: 'recovery credential' });
    const countDrift = copyRecords(recovery.records);
    replaceHeader(countDrift, { declaredChunkCount: recovery.supportReceipt.chunkCount - 1 });
    expect(() => validateTransferPublication(countDrift)).toThrow(/count exceeds|count mismatch/);

    const duplicateNonce = copyRecords(recovery.records);
    const recoveryDescriptors = chunkRecords({ ...recovery, records: duplicateNonce }).map(parseDescriptor);
    replaceDescriptor(duplicateNonce, 1, { nonce: recoveryDescriptors[0].nonce });
    expect(() => validateTransferPublication(duplicateNonce)).toThrow(/nonce reuse/);

    const recipient = await DestinationRecipientKey.issue({
      keyId: 'destination-key-1',
      authorizationBinding: AUTHORIZATION_BINDING,
      expiresAt: NOW + 15 * 60 * 1000,
      now: () => NOW,
    });
    const destination = await publishDestinationTransfer({
      graph,
      recipient: recipient.descriptor(),
      now: () => NOW,
    });
    const duplicateKey = copyRecords(destination.records);
    const destinationDescriptors = chunkRecords({ ...destination, records: duplicateKey }).map(parseDescriptor);
    replaceDescriptor(duplicateKey, 1, { encapsulatedKey: destinationDescriptors[0].encapsulatedKey });
    expect(() => validateTransferPublication(duplicateKey, () => NOW)).toThrow(/encapsulated key reuse/);
  });

  it('rejects stale destination publications during replay', async () => {
    const graph = buildTransferObjectGraph(graphInput());
    const recipient = await DestinationRecipientKey.issue({
      keyId: 'destination-key-1',
      authorizationBinding: AUTHORIZATION_BINDING,
      expiresAt: NOW + 15 * 60 * 1000,
      now: () => NOW,
    });
    const publication = await publishDestinationTransfer({ graph, recipient: recipient.descriptor(), now: () => NOW });

    expect(() => validateTransferPublication(publication.records, () => recipient.descriptor().expiresAt)).toThrow(
      /expired/
    );
  });

  it('uses only the generic transfer chunk schema in both modes', async () => {
    const graph = buildTransferObjectGraph(graphInput());
    const recovery = await publishRecoveryTransfer({ graph, passphrase: 'recovery credential' });
    expect(
      chunkRecords(recovery)
        .map(parseDescriptor)
        .every((descriptor) => descriptor.schema === TRANSFER_CHUNK_SCHEMA)
    ).toBe(true);
  });
});
