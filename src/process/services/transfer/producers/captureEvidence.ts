/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';

import type { StateAuthorityId } from '@process/services/recovery/recoveryManifest';
import type { TransferDigest, TransferSnapshotObjectInput } from '@process/services/transfer/export';

const SHA256 = /^sha256:[a-f0-9]{64}$/;
const MUTATION_EPOCH = /^[a-z0-9][a-z0-9._:/-]{0,255}$/;

export type TransferAuthorityCaptureBinding = Readonly<{
  authorityId: StateAuthorityId;
  mutationEpoch: string;
  canonicalContentDigest: TransferDigest;
}>;

export type TransferProducerCaptureResult = Readonly<{
  objects: readonly TransferSnapshotObjectInput[];
  authorityBindings: readonly TransferAuthorityCaptureBinding[];
}>;

export type TransferProducerAggregateCapture = Readonly<{
  objects: readonly TransferSnapshotObjectInput[];
  authorityBindings: readonly TransferAuthorityCaptureBinding[];
  /** Digest of the sorted, content-bound authority mutation epochs. */
  mutationEpoch: TransferDigest;
}>;

function sha256(bytes: Uint8Array | string): TransferDigest {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

function canonicalObjectRecord(object: TransferSnapshotObjectInput): string {
  return JSON.stringify({
    authorityId: object.authorityId,
    byteLength: object.bytes.byteLength,
    bytesSha256: sha256(object.bytes),
    dependencyKeys: [...(object.dependencyKeys ?? [])].toSorted(),
    key: object.key,
    kind: object.kind,
    logicalStateId: object.logicalStateId,
    provenance: object.provenance,
  });
}

/** Bind an authority epoch to the exact object metadata and bytes it captured. */
export function canonicalAuthorityContentDigest(
  authorityId: StateAuthorityId,
  objects: readonly TransferSnapshotObjectInput[]
): TransferDigest {
  const authorityObjects = objects
    .filter((object) => object.authorityId === authorityId)
    .map(canonicalObjectRecord)
    .toSorted();
  return sha256(`[${authorityObjects.join(',')}]`);
}

export function createTransferAuthorityCaptureBinding(
  authorityId: StateAuthorityId,
  mutationEpoch: string,
  objects: readonly TransferSnapshotObjectInput[]
): TransferAuthorityCaptureBinding {
  if (!MUTATION_EPOCH.test(mutationEpoch)) throw new TypeError('Transfer authority mutation epoch is invalid.');
  if (!objects.some((object) => object.authorityId === authorityId)) {
    throw new TypeError('Transfer authority binding has no captured objects.');
  }
  return Object.freeze({
    authorityId,
    mutationEpoch,
    canonicalContentDigest: canonicalAuthorityContentDigest(authorityId, objects),
  });
}

export function isTransferAuthorityCaptureBinding(value: unknown): value is TransferAuthorityCaptureBinding {
  if (!value || typeof value !== 'object') return false;
  const binding = value as Partial<TransferAuthorityCaptureBinding>;
  return (
    typeof binding.authorityId === 'string' &&
    typeof binding.mutationEpoch === 'string' &&
    MUTATION_EPOCH.test(binding.mutationEpoch) &&
    typeof binding.canonicalContentDigest === 'string' &&
    SHA256.test(binding.canonicalContentDigest)
  );
}

export function aggregateTransferMutationEpoch(bindings: readonly TransferAuthorityCaptureBinding[]): TransferDigest {
  const canonical = bindings
    .map((binding) =>
      JSON.stringify({
        authorityId: binding.authorityId,
        canonicalContentDigest: binding.canonicalContentDigest,
        mutationEpoch: binding.mutationEpoch,
      })
    )
    .toSorted();
  return sha256(`[${canonical.join(',')}]`);
}
