/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';

import { REQUIRED_LOGICAL_STATE, type LogicalStateId } from '@process/services/recovery/recoveryManifest';
import {
  parseAndValidateTransferObjectGraph,
  TRANSFER_OBJECT_GRAPH_RECEIPT_CONTRACT,
  type TransferDigest,
  type TransferInnerManifest,
  type TransferObjectDescriptor,
  type TransferObjectId,
} from '@process/services/transfer/export';
import {
  WAYLAND_PORTABILITY_REGISTRY_VALIDATION,
  type PortabilityDescriptor,
} from '@process/services/transfer/registry';

import {
  TRANSFER_IMPORT_DRY_RUN_CONTRACT,
  TRANSFER_IMPORT_NON_CLAIM,
  type PlanTransferImportInput,
  type TransferImportActivation,
  type TransferImportBlocker,
  type TransferImportConflictDecision,
  type TransferImportDestinationObject,
  type TransferImportDryRunPlan,
  type TransferImportFamilyDecision,
  type TransferImportObjectDecision,
  type TransferImportPriorBinding,
  type TransferImportRequestedDecision,
} from './types';

const SAFE_INSTANCE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const DESTINATION_OBJECT_ID = /^(?:wdi1|wto1):[a-f0-9]{64}$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const MAX_IDEMPOTENCY_KEY_BYTES = 256;
const encoder = new TextEncoder();

const SEALED_PORTABILITY_DESCRIPTORS: readonly PortabilityDescriptor[] | undefined =
  WAYLAND_PORTABILITY_REGISTRY_VALIDATION.valid
    ? WAYLAND_PORTABILITY_REGISTRY_VALIDATION.descriptors.map((descriptor) =>
        Object.freeze({
          ...descriptor,
          activationPolicy: descriptor.activationPolicy,
          authorityIds: Object.freeze([...descriptor.authorityIds]),
          compatibility: Object.freeze({ ...descriptor.compatibility }),
          consumer: Object.freeze({ ...descriptor.consumer }),
          dependencies: Object.freeze([...descriptor.dependencies]),
          producer: Object.freeze({ ...descriptor.producer }),
          quiescence: Object.freeze([...descriptor.quiescence]),
        })
      )
    : undefined;

type Json = null | boolean | number | string | readonly Json[] | { readonly [key: string]: Json };

function fail(message: string): never {
  throw new Error(`Invalid transfer import dry-run: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertExactKeys(value: Record<string, unknown>, allowed: readonly string[], context: string): void {
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) fail(`unknown critical ${context} field ${unknown.toSorted()[0]}`);
}

function canonicalJson(value: Json): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const record = value as { readonly [key: string]: Json };
  return `{${Object.keys(record)
    .toSorted()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(',')}}`;
}

function digest(value: Uint8Array | string): TransferDigest {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function destinationObjectId(identity: Json): string {
  return `wdi1:${digest(canonicalJson(identity)).slice('sha256:'.length)}`;
}

function assertSafeInteger(value: unknown, context: string): asserts value is number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) fail(`${context} must be a non-negative safe integer`);
}

function validateDestination(input: PlanTransferImportInput): Map<string, TransferImportDestinationObject> {
  const { destination } = input;
  if (!isRecord(destination)) fail('destination must be an object');
  assertExactKeys(destination, ['instanceId', 'compatibility', 'existingObjects'], 'destination');
  if (!SAFE_INSTANCE_ID.test(destination.instanceId)) fail('destination instanceId is malformed');
  const compatibility = destination.compatibility;
  if (!isRecord(compatibility)) fail('destination compatibility must be an object');
  assertExactKeys(
    compatibility,
    [
      'minimumFormat',
      'maximumFormat',
      'minimumDesktopSchemaVersion',
      'maximumDesktopSchemaVersion',
      'acceptedReleaseTracks',
    ],
    'destination compatibility'
  );
  assertSafeInteger(compatibility.minimumFormat, 'destination minimumFormat');
  assertSafeInteger(compatibility.maximumFormat, 'destination maximumFormat');
  assertSafeInteger(compatibility.minimumDesktopSchemaVersion, 'destination minimumDesktopSchemaVersion');
  assertSafeInteger(compatibility.maximumDesktopSchemaVersion, 'destination maximumDesktopSchemaVersion');
  if (compatibility.minimumFormat > compatibility.maximumFormat) fail('destination format range is inverted');
  if (compatibility.minimumDesktopSchemaVersion > compatibility.maximumDesktopSchemaVersion) {
    fail('destination desktop schema range is inverted');
  }
  if (
    !Array.isArray(compatibility.acceptedReleaseTracks) ||
    compatibility.acceptedReleaseTracks.length === 0 ||
    new Set(compatibility.acceptedReleaseTracks).size !== compatibility.acceptedReleaseTracks.length ||
    compatibility.acceptedReleaseTracks.some((track) => track !== 'stable' && track !== 'preview')
  ) {
    fail('destination acceptedReleaseTracks is invalid');
  }

  const logicalState = new Set<string>(REQUIRED_LOGICAL_STATE);
  const byId = new Map<string, TransferImportDestinationObject>();
  const sourceBindings = new Map<string, string>();
  if (!Array.isArray(destination.existingObjects)) fail('destination existingObjects must be an array');
  for (const existing of destination.existingObjects) {
    if (!isRecord(existing)) fail('existing destination object must be an object');
    assertExactKeys(
      existing,
      ['destinationObjectId', 'logicalStateId', 'kind', 'sha256', 'sourceObjectId'],
      'existing destination object'
    );
    const candidate = existing as unknown as TransferImportDestinationObject;
    if (typeof candidate.destinationObjectId !== 'string' || !DESTINATION_OBJECT_ID.test(candidate.destinationObjectId))
      fail('existing destination object id is malformed');
    if (byId.has(candidate.destinationObjectId)) fail(`duplicate destination object ${candidate.destinationObjectId}`);
    if (typeof candidate.logicalStateId !== 'string' || !logicalState.has(candidate.logicalStateId))
      fail(`unknown existing family ${String(candidate.logicalStateId)}`);
    if (typeof candidate.kind !== 'string' || !['state', 'artifact', 'receipt', 'reference'].includes(candidate.kind)) {
      fail(`unknown existing object kind ${String(candidate.kind)}`);
    }
    if (typeof candidate.sha256 !== 'string' || !SHA256.test(candidate.sha256))
      fail(`existing object ${candidate.destinationObjectId} has malformed digest`);
    if (candidate.sourceObjectId !== undefined) {
      if (typeof candidate.sourceObjectId !== 'string' || !/^wto1:[a-f0-9]{64}$/.test(candidate.sourceObjectId))
        fail('existing source object id is malformed');
      const prior = sourceBindings.get(candidate.sourceObjectId);
      if (prior && prior !== candidate.destinationObjectId) {
        fail(`source object ${candidate.sourceObjectId} aliases multiple destination objects`);
      }
      sourceBindings.set(candidate.sourceObjectId, candidate.destinationObjectId);
    }
    byId.set(candidate.destinationObjectId, {
      destinationObjectId: candidate.destinationObjectId,
      logicalStateId: candidate.logicalStateId,
      kind: candidate.kind,
      sha256: candidate.sha256,
      ...(candidate.sourceObjectId ? { sourceObjectId: candidate.sourceObjectId } : {}),
    });
  }
  return byId;
}

function validateCompatibility(input: PlanTransferImportInput, manifest: TransferInnerManifest): void {
  const source = manifest.sourceCompatibility;
  const destination = input.destination.compatibility;
  const format = manifest.formatVersion;
  if (format < destination.minimumFormat || format > destination.maximumFormat) {
    fail(`format ${format} is outside destination compatibility`);
  }
  if (
    source.desktopSchemaVersion < destination.minimumDesktopSchemaVersion ||
    source.desktopSchemaVersion > destination.maximumDesktopSchemaVersion
  ) {
    fail(`desktop schema ${source.desktopSchemaVersion} is outside destination compatibility`);
  }
  if (!destination.acceptedReleaseTracks.includes(source.releaseTrack)) {
    fail(`source release track ${source.releaseTrack} is not accepted`);
  }
  if (source.minimumReaderFormat > format || source.maximumReaderFormat < format) {
    fail('source reader compatibility excludes its own format');
  }
}

function descriptors(): Map<LogicalStateId, PortabilityDescriptor> {
  if (!SEALED_PORTABILITY_DESCRIPTORS) fail('portability registry is invalid');
  return new Map(SEALED_PORTABILITY_DESCRIPTORS.map((descriptor) => [descriptor.logicalStateId, descriptor]));
}

function activationFor(descriptor: PortabilityDescriptor): TransferImportActivation {
  if (descriptor.activationPolicy === 'paused-review') return 'paused-review';
  if (descriptor.activationPolicy === 'quarantine-review') return 'quarantine-review';
  return 'inactive';
}

function targetFor(
  object: TransferObjectDescriptor,
  descriptor: PortabilityDescriptor,
  destinationInstanceId: string
): string {
  if (object.kind === 'receipt') return object.id;
  if (descriptor.conflictPolicy === 'merge' || descriptor.conflictPolicy === 'replace') {
    return destinationObjectId({
      authorityId: object.authorityId,
      destinationInstanceId,
      family: object.logicalStateId,
      kind: object.kind,
      ordinal: object.ordinal,
      slotPolicy: descriptor.conflictPolicy,
    });
  }
  return destinationObjectId({
    destinationInstanceId,
    family: object.logicalStateId,
    sourceObjectId: object.id,
    slotPolicy: descriptor.conflictPolicy,
  });
}

function decideConflict(
  object: TransferObjectDescriptor,
  descriptor: PortabilityDescriptor,
  target: string,
  existing: TransferImportDestinationObject | undefined
): TransferImportConflictDecision {
  if (!existing) return 'create';
  if (existing.logicalStateId !== object.logicalStateId) fail(`destination collision at ${target} changes family`);
  if (existing.kind !== object.kind) fail(`destination collision at ${target} changes object kind`);
  const isExact =
    existing.sha256 === object.sha256 &&
    (existing.sourceObjectId === undefined || existing.sourceObjectId === object.id);
  if (isExact) return 'skip';
  if (object.kind === 'receipt') fail(`immutable receipt ${object.id} conflicts at destination`);
  if (existing.sourceObjectId === object.id && existing.sha256 !== object.sha256) {
    fail(`source object ${object.id} has conflicting destination digest`);
  }
  if (descriptor.conflictPolicy === 'merge') return 'merge';
  if (descriptor.conflictPolicy === 'replace') return 'replace';
  fail(`${descriptor.conflictPolicy} target ${target} is already occupied`);
}

function familyDecision(
  logicalStateId: LogicalStateId,
  descriptor: PortabilityDescriptor
): TransferImportFamilyDecision {
  if (descriptor.disposition === 'reconnect-required') {
    return { logicalStateId, action: 'reconnect', executable: false };
  }
  if (descriptor.disposition === 'reference-only') {
    return { logicalStateId, action: 'external-reference', executable: false };
  }
  return { logicalStateId, action: 'skip', executable: false };
}

function validateRequestedDecisions(
  requested: readonly TransferImportRequestedDecision[],
  decisions: readonly TransferImportObjectDecision[]
): void {
  const bySource = new Map(decisions.map((decision) => [decision.sourceObjectId, decision]));
  const seen = new Set<string>();
  for (const assertion of requested) {
    if (!isRecord(assertion)) fail('requested decision must be an object');
    assertExactKeys(
      assertion,
      ['sourceObjectId', 'destinationObjectId', 'conflictDecision', 'activation'],
      'requested decision'
    );
    if (seen.has(assertion.sourceObjectId)) fail(`duplicate requested decision for ${assertion.sourceObjectId}`);
    seen.add(assertion.sourceObjectId);
    const actual = bySource.get(assertion.sourceObjectId);
    if (!actual) fail(`requested decision references unknown source ${assertion.sourceObjectId}`);
    if (
      assertion.destinationObjectId !== actual.destinationObjectId ||
      assertion.conflictDecision !== actual.conflictDecision ||
      assertion.activation !== actual.activation
    ) {
      fail(`requested decision widens policy for ${assertion.sourceObjectId}`);
    }
  }
}

function validatePriorBindings(
  priorBindings: readonly TransferImportPriorBinding[],
  idempotencyKeySha256: TransferDigest,
  destinationInstanceId: string,
  semanticGraphSha256: TransferDigest
): TransferImportPriorBinding | undefined {
  let match: TransferImportPriorBinding | undefined;
  for (const binding of priorBindings) {
    if (!isRecord(binding)) fail('prior idempotency binding must be an object');
    assertExactKeys(
      binding,
      ['idempotencyKeySha256', 'destinationInstanceId', 'semanticGraphSha256', 'planSha256'],
      'prior idempotency binding'
    );
    if (
      !SHA256.test(binding.idempotencyKeySha256) ||
      !SHA256.test(binding.semanticGraphSha256) ||
      !SHA256.test(binding.planSha256)
    ) {
      fail('prior idempotency binding contains a malformed digest');
    }
    if (!SAFE_INSTANCE_ID.test(binding.destinationInstanceId)) fail('prior destination instanceId is malformed');
    if (binding.idempotencyKeySha256 !== idempotencyKeySha256) continue;
    if (match) fail('duplicate prior idempotency binding');
    match = binding;
  }
  if (
    match &&
    (match.destinationInstanceId !== destinationInstanceId || match.semanticGraphSha256 !== semanticGraphSha256)
  ) {
    fail('idempotency key is already bound to a different graph or destination');
  }
  return match;
}

/**
 * Build a deterministic, content-free dry-run plan. This function validates
 * the complete graph again, reads no live state, and performs no mutation.
 */
export function planTransferImport(input: PlanTransferImportInput): TransferImportDryRunPlan {
  if (!isRecord(input)) fail('input must be an object');
  assertExactKeys(input, ['graph', 'destination', 'idempotencyKey', 'priorBindings', 'requestedDecisions'], 'input');
  if (typeof input.idempotencyKey !== 'string') fail('idempotency key must be a string');
  if (input.priorBindings !== undefined && !Array.isArray(input.priorBindings)) {
    fail('priorBindings must be an array');
  }
  if (input.requestedDecisions !== undefined && !Array.isArray(input.requestedDecisions)) {
    fail('requestedDecisions must be an array');
  }
  const keyBytes = encoder.encode(input.idempotencyKey);
  if (keyBytes.byteLength === 0 || keyBytes.byteLength > MAX_IDEMPOTENCY_KEY_BYTES) {
    fail(`idempotency key must be 1-${MAX_IDEMPOTENCY_KEY_BYTES} UTF-8 bytes`);
  }

  const manifest = parseAndValidateTransferObjectGraph(input.graph.manifestBytes, input.graph.objects);
  const sourceManifestSha256 = digest(input.graph.manifestBytes);
  if (
    input.graph.supportReceipt.contract !== TRANSFER_OBJECT_GRAPH_RECEIPT_CONTRACT ||
    input.graph.supportReceipt.bundleId !== manifest.bundleId ||
    input.graph.supportReceipt.manifestSha256 !== sourceManifestSha256 ||
    input.graph.supportReceipt.semanticGraphSha256 !== manifest.resumability.semanticGraphSha256 ||
    input.graph.supportReceipt.objectCount !== manifest.objects.length ||
    input.graph.supportReceipt.totalBytes !== manifest.resumability.totalBytes ||
    input.graph.supportReceipt.selectedFamilyCount !== manifest.selectedLogicalState.length ||
    input.graph.supportReceipt.excludedFamilyCount !== manifest.exclusions.length
  ) {
    fail('source graph support receipt does not bind the validated graph');
  }
  validateCompatibility(input, manifest);
  const existingById = validateDestination(input);
  const destinationInventorySha256 = digest(
    canonicalJson({
      compatibility: {
        ...input.destination.compatibility,
        acceptedReleaseTracks: [...input.destination.compatibility.acceptedReleaseTracks].toSorted(),
      } as unknown as Json,
      existingObjects: [...existingById.values()].toSorted((left, right) =>
        left.destinationObjectId.localeCompare(right.destinationObjectId)
      ) as unknown as Json,
      instanceId: input.destination.instanceId,
    })
  );
  const registry = descriptors();
  const idempotencyKeySha256 = digest(input.idempotencyKey);
  const prior = validatePriorBindings(
    input.priorBindings ?? [],
    idempotencyKeySha256,
    input.destination.instanceId,
    manifest.resumability.semanticGraphSha256
  );

  const targetBySource = new Map<TransferObjectId, string>();
  for (const object of manifest.objects) {
    const descriptor = registry.get(object.logicalStateId);
    if (!descriptor) fail(`unknown portability family ${object.logicalStateId}`);
    targetBySource.set(object.id, targetFor(object, descriptor, input.destination.instanceId));
  }
  if (new Set(targetBySource.values()).size !== targetBySource.size) fail('destination mapping aliases source objects');

  const existingSourceBindings = new Map<TransferObjectId, string>();
  for (const existing of existingById.values()) {
    if (existing.sourceObjectId) existingSourceBindings.set(existing.sourceObjectId, existing.destinationObjectId);
  }

  const objectDecisions: TransferImportObjectDecision[] = manifest.objects.map((object) => {
    const descriptor = registry.get(object.logicalStateId)!;
    if (descriptor.disposition === 'excluded' || descriptor.disposition === 'reconnect-required') {
      fail(`${object.logicalStateId} cannot produce an import object decision`);
    }
    if (descriptor.disposition === 'reference-only' && object.kind !== 'reference') {
      fail(`${object.logicalStateId} import must remain an external reference`);
    }
    const destinationId = targetBySource.get(object.id)!;
    const priorDestination = existingSourceBindings.get(object.id);
    if (priorDestination && priorDestination !== destinationId) {
      fail(`source object ${object.id} aliases destination ${priorDestination}`);
    }
    const conflictDecision = decideConflict(object, descriptor, destinationId, existingById.get(destinationId));
    const destinationDependencies = object.dependencies
      .map((dependency) => {
        const target = targetBySource.get(dependency);
        if (!target) fail(`object ${object.id} has an unmapped dependency ${dependency}`);
        return target;
      })
      .toSorted();
    return {
      sourceObjectId: object.id,
      sourceSha256: object.sha256,
      sourceByteLength: object.byteLength,
      sourceImmutableBytes: true,
      destinationObjectId: destinationId,
      destinationDependencies,
      logicalStateId: object.logicalStateId,
      kind: object.kind,
      conflictDecision,
      activation: activationFor(descriptor),
      handling:
        object.kind === 'receipt'
          ? 'immutable-receipt'
          : descriptor.disposition === 'reference-only'
            ? 'external-reference'
            : 'portable',
      preserveSourceBytes: true,
      preserveSourceId: object.kind === 'receipt',
    };
  });

  validateRequestedDecisions(input.requestedDecisions ?? [], objectDecisions);

  const familyDecisions = manifest.exclusions.map((exclusion) => {
    const descriptor = registry.get(exclusion.logicalStateId);
    if (!descriptor) fail(`unknown excluded portability family ${exclusion.logicalStateId}`);
    return familyDecision(exclusion.logicalStateId, descriptor);
  });
  const familiesRequiringConsumer = new Set<LogicalStateId>([
    ...objectDecisions.map(({ logicalStateId }) => logicalStateId),
    ...familyDecisions.filter(({ action }) => action !== 'skip').map(({ logicalStateId }) => logicalStateId),
  ]);
  const blockers: TransferImportBlocker[] = [...familiesRequiringConsumer]
    .toSorted()
    .filter((logicalStateId) => registry.get(logicalStateId)?.consumer.state !== 'available')
    .map((logicalStateId) => ({ code: 'CONSUMER_UNAVAILABLE', logicalStateId }));

  const summary = {
    objectCount: objectDecisions.length,
    createCount: objectDecisions.filter(({ conflictDecision }) => conflictDecision === 'create').length,
    mergeCount: objectDecisions.filter(({ conflictDecision }) => conflictDecision === 'merge').length,
    replaceCount: objectDecisions.filter(({ conflictDecision }) => conflictDecision === 'replace').length,
    skipCount:
      objectDecisions.filter(({ conflictDecision }) => conflictDecision === 'skip').length +
      familyDecisions.filter(({ action }) => action === 'skip').length,
    receiptCount: objectDecisions.filter(({ kind }) => kind === 'receipt').length,
    externalReferenceCount:
      objectDecisions.filter(({ handling }) => handling === 'external-reference').length +
      familyDecisions.filter(({ action }) => action === 'external-reference').length,
    reconnectFamilyCount: familyDecisions.filter(({ action }) => action === 'reconnect').length,
    blockedConsumerCount: blockers.length,
  };
  const planCore = {
    blockers,
    bundleId: manifest.bundleId,
    contract: TRANSFER_IMPORT_DRY_RUN_CONTRACT,
    destinationInstanceId: input.destination.instanceId,
    destinationInventorySha256,
    familyDecisions,
    idempotencyKeySha256,
    nonClaim: TRANSFER_IMPORT_NON_CLAIM,
    objectDecisions,
    semanticGraphSha256: manifest.resumability.semanticGraphSha256,
    sourceManifestSha256,
    summary,
  } as unknown as Json;
  const planSha256 = digest(canonicalJson(planCore));
  if (prior && prior.planSha256 !== planSha256) fail('idempotent repeat conflicts with the previously sealed plan');

  return {
    contract: TRANSFER_IMPORT_DRY_RUN_CONTRACT,
    bundleId: manifest.bundleId,
    semanticGraphSha256: manifest.resumability.semanticGraphSha256,
    sourceManifestSha256,
    destinationInstanceId: input.destination.instanceId,
    destinationInventorySha256,
    idempotencyKeySha256,
    planSha256,
    repeat: prior ? 'identical' : 'new',
    objectDecisions,
    familyDecisions,
    blockers,
    readyForTransactionalApply: blockers.length === 0,
    summary,
    nonClaim: TRANSFER_IMPORT_NON_CLAIM,
  };
}
