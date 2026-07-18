/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { REQUIRED_LOGICAL_STATE, type LogicalStateId } from '@process/services/recovery/recoveryManifest';
import type { TransferSnapshotObjectInput } from '@process/services/transfer/export';
import { WAYLAND_PORTABILITY_REGISTRY_VALIDATION } from '@process/services/transfer/registry';

import {
  resolveAcceptedTransferProducer,
  validateTransferProducerRegistry,
  WAYLAND_TRANSFER_PRODUCER_REGISTRY,
  type TransferProducerRegistration,
} from './producerRegistry';

const LOGICAL_STATE = new Set<string>(REQUIRED_LOGICAL_STATE);
const MAX_TOTAL_OBJECTS = 100_000;

export type RunAcceptedTransferProducersInput = Readonly<{
  selectedLogicalState: readonly LogicalStateId[];
  excludedLogicalState: readonly LogicalStateId[];
  registrations?: readonly TransferProducerRegistration[];
}>;

export class TransferProducerRunError extends Error {
  constructor(
    readonly code:
      | 'PRODUCER_SELECTION_INVALID'
      | 'PRODUCER_REGISTRY_INVALID'
      | 'PRODUCER_UNAVAILABLE'
      | 'PRODUCER_EXECUTION_FAILED'
      | 'PRODUCER_OUTPUT_INVALID'
      | 'PRODUCER_OUTPUT_TOO_LARGE',
    message: string
  ) {
    super(message);
    this.name = 'TransferProducerRunError';
  }
}

function fail(code: TransferProducerRunError['code'], message: string): never {
  throw new TransferProducerRunError(code, message);
}

function canonicalSelection(values: readonly LogicalStateId[], label: string): LogicalStateId[] {
  if (!Array.isArray(values) || values.length === 0) fail('PRODUCER_SELECTION_INVALID', `${label} is invalid.`);
  const seen = new Set<string>();
  const result: LogicalStateId[] = [];
  for (const value of values as readonly unknown[]) {
    if (typeof value !== 'string' || !LOGICAL_STATE.has(value) || seen.has(value)) {
      fail('PRODUCER_SELECTION_INVALID', `${label} is invalid.`);
    }
    seen.add(value);
    result.push(value as LogicalStateId);
  }
  return result.toSorted();
}

function defensiveObject(object: TransferSnapshotObjectInput): TransferSnapshotObjectInput {
  return Object.freeze({
    key: object.key,
    logicalStateId: object.logicalStateId,
    authorityId: object.authorityId,
    kind: object.kind,
    provenance: object.provenance,
    bytes: Uint8Array.from(object.bytes),
    ...(object.dependencyKeys ? { dependencyKeys: Object.freeze([...object.dependencyKeys]) } : {}),
  });
}

/**
 * Execute only exact accepted producer registrations. The caller must hold the
 * Desktop/Core quiescence leases declared by the portability registry; this
 * function deliberately cannot mint or infer those leases.
 */
export async function runAcceptedTransferProducers(
  input: RunAcceptedTransferProducersInput
): Promise<readonly TransferSnapshotObjectInput[]> {
  if (!WAYLAND_PORTABILITY_REGISTRY_VALIDATION.valid) {
    fail('PRODUCER_REGISTRY_INVALID', 'The portability registry is invalid.');
  }
  const registrations = input.registrations ?? WAYLAND_TRANSFER_PRODUCER_REGISTRY;
  if (validateTransferProducerRegistry(registrations).length > 0) {
    fail('PRODUCER_REGISTRY_INVALID', 'The executable producer registry is invalid.');
  }
  const selected = canonicalSelection(input.selectedLogicalState, 'Selected transfer state');
  const excluded = input.excludedLogicalState.length
    ? canonicalSelection(input.excludedLogicalState, 'Excluded transfer state')
    : [];
  const selectedSet = new Set(selected);
  const excludedSet = new Set(excluded);
  if (excluded.some((logicalStateId) => !selectedSet.has(logicalStateId))) {
    fail('PRODUCER_SELECTION_INVALID', 'Excluded transfer state exceeds the selected scope.');
  }

  const descriptors = new Map(
    WAYLAND_PORTABILITY_REGISTRY_VALIDATION.descriptors.map((descriptor) => [descriptor.logicalStateId, descriptor])
  );
  const output: TransferSnapshotObjectInput[] = [];
  const keys = new Set<string>();

  for (const logicalStateId of selected) {
    if (excludedSet.has(logicalStateId)) continue;
    const descriptor = descriptors.get(logicalStateId);
    if (!descriptor || descriptor.producer.state !== 'available') {
      fail('PRODUCER_UNAVAILABLE', `${logicalStateId} has no accepted transfer producer.`);
    }
    const producer = resolveAcceptedTransferProducer(logicalStateId, descriptor.producer.id, registrations);
    if (!producer) fail('PRODUCER_UNAVAILABLE', `${logicalStateId} has no accepted transfer producer.`);

    let produced: readonly TransferSnapshotObjectInput[];
    try {
      // oxlint-disable-next-line no-await-in-loop -- Producers run serially inside one quiesced mutation epoch.
      produced = await producer.produce();
    } catch {
      fail('PRODUCER_EXECUTION_FAILED', `${logicalStateId} transfer capture failed.`);
    }
    if (!Array.isArray(produced) || produced.length === 0) {
      fail('PRODUCER_OUTPUT_INVALID', `${logicalStateId} transfer producer returned no objects.`);
    }
    if (output.length + produced.length > MAX_TOTAL_OBJECTS) {
      fail('PRODUCER_OUTPUT_TOO_LARGE', 'Transfer producer object count exceeds the format limit.');
    }

    for (const object of produced as readonly TransferSnapshotObjectInput[]) {
      if (
        !object ||
        typeof object !== 'object' ||
        object.logicalStateId !== logicalStateId ||
        !descriptor.authorityIds.includes(object.authorityId) ||
        !(object.bytes instanceof Uint8Array) ||
        object.bytes.byteLength === 0 ||
        (typeof SharedArrayBuffer !== 'undefined' && object.bytes.buffer instanceof SharedArrayBuffer)
      ) {
        fail('PRODUCER_OUTPUT_INVALID', `${logicalStateId} transfer producer returned an invalid object.`);
      }
      if (object.bytes.byteLength > descriptor.maxObjectBytes) {
        fail('PRODUCER_OUTPUT_TOO_LARGE', `${logicalStateId} transfer producer exceeded its byte limit.`);
      }
      if (typeof object.key !== 'string' || keys.has(object.key)) {
        fail('PRODUCER_OUTPUT_INVALID', `${logicalStateId} transfer producer returned a duplicate object key.`);
      }
      keys.add(object.key);
      output.push(defensiveObject(object));
    }
  }
  return Object.freeze(output);
}
