/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { REQUIRED_LOGICAL_STATE, type LogicalStateId } from '@process/services/recovery/recoveryManifest';
import type { TransferSnapshotObjectInput } from '@process/services/transfer/export';
import { WAYLAND_PORTABILITY_REGISTRY_VALIDATION } from '@process/services/transfer/registry';

import {
  aggregateTransferMutationEpoch,
  canonicalAuthorityContentDigest,
  isTransferAuthorityCaptureBinding,
  type TransferAuthorityCaptureBinding,
  type TransferProducerAggregateCapture,
  type TransferProducerCaptureResult,
} from './captureEvidence';
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
      | 'PRODUCER_OUTPUT_TOO_LARGE'
      | 'PRODUCER_AUTHORITY_EVIDENCE_INVALID'
      | 'PRODUCER_AUTHORITY_EVIDENCE_MISSING'
      | 'PRODUCER_AUTHORITY_EVIDENCE_DUPLICATE'
      | 'PRODUCER_AUTHORITY_EVIDENCE_CONFLICT'
      | 'PRODUCER_AUTHORITY_CONTENT_MISMATCH',
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
): Promise<TransferProducerAggregateCapture> {
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
  const authorityBindings = new Map<string, TransferAuthorityCaptureBinding>();
  const keys = new Set<string>();

  for (const logicalStateId of selected) {
    if (excludedSet.has(logicalStateId)) continue;
    const descriptor = descriptors.get(logicalStateId);
    if (!descriptor || descriptor.producer.state !== 'available') {
      fail('PRODUCER_UNAVAILABLE', `${logicalStateId} has no accepted transfer producer.`);
    }
    const producer = resolveAcceptedTransferProducer(logicalStateId, descriptor.producer.id, registrations);
    if (!producer) fail('PRODUCER_UNAVAILABLE', `${logicalStateId} has no accepted transfer producer.`);

    let capture: TransferProducerCaptureResult;
    try {
      // oxlint-disable-next-line no-await-in-loop -- Authority captures are intentionally serialized.
      capture = await producer.produce();
    } catch {
      fail('PRODUCER_EXECUTION_FAILED', `${logicalStateId} transfer capture failed.`);
    }
    if (!capture || typeof capture !== 'object' || !Array.isArray(capture.objects)) {
      fail('PRODUCER_OUTPUT_INVALID', `${logicalStateId} transfer producer returned an invalid capture.`);
    }
    if (!Array.isArray(capture.authorityBindings)) {
      fail('PRODUCER_AUTHORITY_EVIDENCE_INVALID', `${logicalStateId} transfer authority evidence is invalid.`);
    }
    const produced = capture.objects;
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

    const emittedAuthorities = new Set(produced.map((object) => object.authorityId));
    const producerBindings = new Map<string, TransferAuthorityCaptureBinding>();
    for (const binding of capture.authorityBindings as readonly unknown[]) {
      if (!isTransferAuthorityCaptureBinding(binding) || !descriptor.authorityIds.includes(binding.authorityId)) {
        fail('PRODUCER_AUTHORITY_EVIDENCE_INVALID', `${logicalStateId} transfer authority evidence is invalid.`);
      }
      const previous = producerBindings.get(binding.authorityId);
      if (previous) {
        const conflicting =
          previous.mutationEpoch !== binding.mutationEpoch ||
          previous.canonicalContentDigest !== binding.canonicalContentDigest;
        fail(
          conflicting ? 'PRODUCER_AUTHORITY_EVIDENCE_CONFLICT' : 'PRODUCER_AUTHORITY_EVIDENCE_DUPLICATE',
          `${logicalStateId} transfer authority evidence is not unique.`
        );
      }
      if (!emittedAuthorities.has(binding.authorityId)) {
        fail('PRODUCER_AUTHORITY_EVIDENCE_INVALID', `${logicalStateId} authority evidence has no emitted object.`);
      }
      if (canonicalAuthorityContentDigest(binding.authorityId, produced) !== binding.canonicalContentDigest) {
        fail('PRODUCER_AUTHORITY_CONTENT_MISMATCH', `${logicalStateId} authority content binding does not match.`);
      }
      producerBindings.set(
        binding.authorityId,
        Object.freeze({
          authorityId: binding.authorityId,
          mutationEpoch: binding.mutationEpoch,
          canonicalContentDigest: binding.canonicalContentDigest,
        })
      );
    }
    for (const authorityId of emittedAuthorities) {
      if (!producerBindings.has(authorityId)) {
        fail('PRODUCER_AUTHORITY_EVIDENCE_MISSING', `${logicalStateId} authority evidence is missing.`);
      }
    }
    for (const [authorityId, binding] of producerBindings) {
      const previous = authorityBindings.get(authorityId);
      if (previous) {
        const conflicting =
          previous.mutationEpoch !== binding.mutationEpoch ||
          previous.canonicalContentDigest !== binding.canonicalContentDigest;
        fail(
          conflicting ? 'PRODUCER_AUTHORITY_EVIDENCE_CONFLICT' : 'PRODUCER_AUTHORITY_EVIDENCE_DUPLICATE',
          `${authorityId} transfer authority evidence is not unique.`
        );
      }
      authorityBindings.set(authorityId, binding);
    }
  }
  const frozenObjects = Object.freeze(output);
  const frozenBindings = Object.freeze(
    [...authorityBindings.values()].toSorted((left, right) => left.authorityId.localeCompare(right.authorityId))
  );
  return Object.freeze({
    objects: frozenObjects,
    authorityBindings: frozenBindings,
    mutationEpoch: aggregateTransferMutationEpoch(frozenBindings),
  });
}
