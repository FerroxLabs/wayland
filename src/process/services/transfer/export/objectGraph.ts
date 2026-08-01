/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';

import {
  REQUIRED_LOGICAL_STATE,
  REQUIRED_STATE_AUTHORITIES,
  type LogicalStateId,
} from '@process/services/recovery/recoveryManifest';
import { parseStrictJson } from '@process/services/transfer/crypto/strictJson';
import {
  WAYLAND_PORTABILITY_REGISTRY_VALIDATION,
  type PortabilityDescriptor,
} from '@process/services/transfer/registry';

import {
  TRANSFER_INNER_MANIFEST_CONTRACT,
  TRANSFER_INNER_MANIFEST_FORMAT,
  TRANSFER_OBJECT_GRAPH_RECEIPT_CONTRACT,
  type BuildTransferObjectGraphInput,
  type TransferBundleId,
  type TransferDigest,
  type TransferExclusionDisposition,
  type TransferExclusionReason,
  type TransferFamilyExclusion,
  type TransferInnerManifest,
  type TransferObjectDescriptor,
  type TransferObjectGraph,
  type TransferObjectId,
  type TransferObjectKind,
  type TransferProvenanceClassification,
  type TransferSnapshotObjectInput,
  type TransferSourceCompatibility,
} from './types';

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const OBJECT_ID = /^wto1:[a-f0-9]{64}$/;
const BUNDLE_ID = /^wtb1:[a-f0-9]{64}$/;
const SEMVER = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const SAFE_CONSTRUCTION_KEY = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const MAX_MANIFEST_BYTES = 64 * 1024 * 1024;
const MAX_OBJECTS = 100_000;
const MAX_OBJECT_DEPENDENCIES = 1_024;
const MAX_GRAPH_DEPTH = 512;

const LOGICAL_STATE = new Set<string>(REQUIRED_LOGICAL_STATE);
const AUTHORITIES = new Set<string>(REQUIRED_STATE_AUTHORITIES);
const OBJECT_KINDS = new Set<TransferObjectKind>(['state', 'artifact', 'receipt', 'reference']);
const PROVENANCE = new Set<TransferProvenanceClassification>([
  'snapshot-state',
  'user-artifact',
  'authoritative-receipt',
  'derived-receipt',
  'external-reference',
]);
const EXCLUSION_DISPOSITIONS = new Set<TransferExclusionDisposition>([
  'excluded',
  'reference-only',
  'reconnect-required',
]);
const EXCLUSION_REASONS = new Set<TransferExclusionReason>([
  'CREDENTIAL_RECONNECT_REQUIRED',
  'EXTERNAL_REFERENCE_ONLY',
  'POLICY_EXCLUDED',
  'PRODUCER_UNAVAILABLE',
  'UPDATER_STATE_EXCLUDED',
]);

const ROOT_KEYS = [
  'contract',
  'formatVersion',
  'bundleId',
  'sourceCompatibility',
  'selectedLogicalState',
  'exclusions',
  'objects',
  'resumability',
] as const;
const SOURCE_KEYS = [
  'application',
  'appVersion',
  'releaseTrack',
  'desktopSchemaVersion',
  'platform',
  'arch',
  'minimumReaderFormat',
  'maximumReaderFormat',
] as const;
const EXCLUSION_KEYS = ['logicalStateId', 'disposition', 'reasonCode'] as const;
const OBJECT_KEYS = [
  'id',
  'ordinal',
  'logicalStateId',
  'authorityId',
  'kind',
  'byteLength',
  'sha256',
  'dependencies',
  'provenance',
  'immutableBytes',
] as const;
const RESUMABILITY_KEYS = ['strategy', 'objectCount', 'totalBytes', 'terminalOrdinal', 'semanticGraphSha256'] as const;

type Json = null | boolean | number | string | readonly Json[] | { readonly [key: string]: Json };

function fail(message: string): never {
  throw new Error(`Invalid transfer object graph: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertExactKeys(value: Record<string, unknown>, allowed: readonly string[], context: string): void {
  const actual = Object.keys(value).toSorted();
  const expected = [...allowed].toSorted();
  const unknown = actual.filter((key) => !expected.includes(key));
  const missing = expected.filter((key) => !actual.includes(key));
  if (unknown.length > 0) fail(`unknown critical ${context} field ${unknown[0]}`);
  if (missing.length > 0) fail(`missing critical ${context} field ${missing[0]}`);
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

function digest(bytes: Uint8Array | string): TransferDigest {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

function objectId(value: Json): TransferObjectId {
  return `wto1:${digest(canonicalJson(value)).slice('sha256:'.length)}`;
}

function bundleId(graphDigest: TransferDigest): TransferBundleId {
  return `wtb1:${graphDigest.slice('sha256:'.length)}`;
}

function assertSafeInteger(value: unknown, context: string, minimum = 0): asserts value is number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum)
    fail(`${context} must be a safe integer >= ${minimum}`);
}

function assertSortedUniqueStrings(values: unknown, context: string): asserts values is string[] {
  if (!Array.isArray(values) || values.some((value) => typeof value !== 'string')) {
    fail(`${context} must be an array of strings`);
  }
  if (new Set(values).size !== values.length) fail(`${context} contains duplicates`);
  if (values.some((value, index) => index > 0 && values[index - 1] >= value)) {
    fail(`${context} must be canonically sorted`);
  }
}

function validateSource(value: unknown): asserts value is TransferSourceCompatibility {
  if (!isRecord(value)) fail('sourceCompatibility must be an object');
  assertExactKeys(value, SOURCE_KEYS, 'sourceCompatibility');
  if (value.application !== 'Wayland') fail('source application must be Wayland');
  if (typeof value.appVersion !== 'string' || !SEMVER.test(value.appVersion)) fail('source appVersion is invalid');
  if (value.releaseTrack !== 'stable' && value.releaseTrack !== 'preview') fail('source releaseTrack is invalid');
  assertSafeInteger(value.desktopSchemaVersion, 'source desktopSchemaVersion');
  if (value.platform !== 'darwin' && value.platform !== 'win32' && value.platform !== 'linux') {
    fail('source platform is invalid');
  }
  if (value.arch !== 'arm64' && value.arch !== 'x64') fail('source arch is invalid');
  if (value.minimumReaderFormat !== 1 || value.maximumReaderFormat !== 1) {
    fail('source reader compatibility must be exactly format 1');
  }
}

function validateProvenance(kind: TransferObjectKind, provenance: TransferProvenanceClassification): void {
  if (!OBJECT_KINDS.has(kind)) fail(`unknown object kind ${String(kind)}`);
  if (!PROVENANCE.has(provenance)) fail(`unknown provenance classification ${String(provenance)}`);
  if (kind === 'receipt' && provenance !== 'authoritative-receipt' && provenance !== 'derived-receipt') {
    fail('receipt objects require receipt provenance');
  }
  if (kind !== 'receipt' && (provenance === 'authoritative-receipt' || provenance === 'derived-receipt')) {
    fail('receipt provenance may only classify receipt objects');
  }
  if ((kind === 'reference') !== (provenance === 'external-reference')) {
    fail('reference objects require external-reference provenance');
  }
}

function semanticCore(
  manifest: Pick<TransferInnerManifest, 'sourceCompatibility' | 'selectedLogicalState' | 'exclusions' | 'objects'>
): Json {
  return {
    contract: TRANSFER_INNER_MANIFEST_CONTRACT,
    formatVersion: TRANSFER_INNER_MANIFEST_FORMAT,
    exclusions: manifest.exclusions as unknown as Json,
    objects: manifest.objects as unknown as Json,
    selectedLogicalState: manifest.selectedLogicalState as unknown as Json,
    sourceCompatibility: manifest.sourceCompatibility as unknown as Json,
  };
}

function descriptorIdentity(object: Omit<TransferObjectDescriptor, 'id' | 'ordinal'>): Json {
  return {
    authorityId: object.authorityId,
    byteLength: object.byteLength,
    dependencies: object.dependencies,
    immutableBytes: object.immutableBytes,
    kind: object.kind,
    logicalStateId: object.logicalStateId,
    provenance: object.provenance,
    sha256: object.sha256,
  };
}

function portabilityDescriptors(): Map<LogicalStateId, PortabilityDescriptor> {
  if (!WAYLAND_PORTABILITY_REGISTRY_VALIDATION.valid) fail('portability registry is invalid');
  return new Map(
    WAYLAND_PORTABILITY_REGISTRY_VALIDATION.descriptors.map((descriptor) => [descriptor.logicalStateId, descriptor])
  );
}

function validateExclusionPolicy(exclusion: TransferFamilyExclusion, descriptor: PortabilityDescriptor): void {
  if (descriptor.disposition === 'reconnect-required') {
    if (exclusion.disposition !== 'reconnect-required' || exclusion.reasonCode !== 'CREDENTIAL_RECONNECT_REQUIRED') {
      fail(`${exclusion.logicalStateId} must use the reconnect-required credential exclusion`);
    }
    return;
  }
  if (descriptor.disposition === 'reference-only') {
    if (exclusion.disposition !== 'reference-only' || exclusion.reasonCode !== 'EXTERNAL_REFERENCE_ONLY') {
      fail(`${exclusion.logicalStateId} must use the reference-only exclusion`);
    }
    return;
  }
  if (descriptor.disposition === 'excluded') {
    if (exclusion.disposition !== 'excluded' || exclusion.reasonCode !== 'UPDATER_STATE_EXCLUDED') {
      fail(`${exclusion.logicalStateId} must use the updater-state exclusion`);
    }
    return;
  }
  if (
    exclusion.disposition !== 'excluded' ||
    (exclusion.reasonCode !== 'POLICY_EXCLUDED' && exclusion.reasonCode !== 'PRODUCER_UNAVAILABLE')
  ) {
    fail(`${exclusion.logicalStateId} portable state may only use an explicit policy or producer exclusion`);
  }
}

function validateRegistryGraphPolicy(
  selected: ReadonlySet<LogicalStateId>,
  exclusions: ReadonlyMap<LogicalStateId, TransferFamilyExclusion>,
  objects: readonly TransferObjectDescriptor[]
): void {
  const descriptors = portabilityDescriptors();
  const objectsByFamily = new Map<LogicalStateId, TransferObjectDescriptor[]>();
  for (const object of objects) {
    const descriptor = descriptors.get(object.logicalStateId);
    if (!descriptor) fail(`missing portability descriptor for ${object.logicalStateId}`);
    if (!descriptor.authorityIds.includes(object.authorityId)) {
      fail(`authority ${object.authorityId} cannot represent ${object.logicalStateId}`);
    }
    if (object.byteLength > descriptor.maxObjectBytes) {
      fail(`object ${object.id} exceeds ${object.logicalStateId} size policy`);
    }
    if (descriptor.disposition === 'reconnect-required' || descriptor.disposition === 'excluded') {
      fail(`${object.logicalStateId} cannot contain transferable object bytes`);
    }
    if (descriptor.disposition === 'reference-only' && object.kind !== 'reference') {
      fail(`${object.logicalStateId} may contain reference objects only`);
    }
    const familyObjects = objectsByFamily.get(object.logicalStateId) ?? [];
    familyObjects.push(object);
    objectsByFamily.set(object.logicalStateId, familyObjects);
  }

  for (const [family, exclusion] of exclusions) {
    const descriptor = descriptors.get(family);
    if (!descriptor) fail(`missing portability descriptor for ${family}`);
    validateExclusionPolicy(exclusion, descriptor);
  }

  const familyByObject = new Map(objects.map((object) => [object.id, object.logicalStateId]));
  for (const family of selected) {
    if (exclusions.has(family)) continue;
    const descriptor = descriptors.get(family);
    if (!descriptor) fail(`missing portability descriptor for ${family}`);
    const familyObjects = objectsByFamily.get(family) ?? [];
    for (const dependencyFamily of descriptor.dependencies) {
      if (!selected.has(dependencyFamily) || exclusions.has(dependencyFamily)) {
        fail(`${family} requires included dependency family ${dependencyFamily}`);
      }
      const dependencyBound = familyObjects.some((object) =>
        object.dependencies.some((dependency) => familyByObject.get(dependency) === dependencyFamily)
      );
      if (!dependencyBound) fail(`${family} has no object dependency on ${dependencyFamily}`);
    }
  }
}

function validateTotalGraph(manifest: TransferInnerManifest, objectBytes: ReadonlyMap<string, Uint8Array>): void {
  if (manifest.objects.length > MAX_OBJECTS) fail(`object count exceeds ${MAX_OBJECTS}`);
  const selected = new Set(manifest.selectedLogicalState);
  const exclusions = new Map<LogicalStateId, TransferFamilyExclusion>();
  for (const exclusion of manifest.exclusions) {
    if (exclusions.has(exclusion.logicalStateId)) fail(`duplicate exclusion for ${exclusion.logicalStateId}`);
    if (!selected.has(exclusion.logicalStateId))
      fail(`exclusion ${exclusion.logicalStateId} is outside selected scope`);
    exclusions.set(exclusion.logicalStateId, exclusion);
  }

  const ids = new Set<string>();
  const ordinalSet = new Set<number>();
  const objectById = new Map<string, TransferObjectDescriptor>();
  const accounted = new Set<LogicalStateId>();
  let totalBytes = 0;
  for (const [index, object] of manifest.objects.entries()) {
    if (ids.has(object.id)) fail(`duplicate object id ${object.id}`);
    if (ordinalSet.has(object.ordinal)) fail(`duplicate object ordinal ${object.ordinal}`);
    if (object.ordinal !== index) fail('object ordinals must be contiguous and match canonical order');
    if (index > 0 && manifest.objects[index - 1].id >= object.id) fail('objects must be sorted by id');
    ids.add(object.id);
    ordinalSet.add(object.ordinal);
    objectById.set(object.id, object);
    accounted.add(object.logicalStateId);
    if (!selected.has(object.logicalStateId)) fail(`object ${object.id} is outside selected scope`);
    if (exclusions.has(object.logicalStateId)) fail(`excluded family ${object.logicalStateId} contains objects`);
    const payload = objectBytes.get(object.id);
    if (!payload) fail(`missing bytes for object ${object.id}`);
    if (!(payload instanceof Uint8Array)) fail(`object ${object.id} bytes must be a Uint8Array`);
    if (payload.byteLength !== object.byteLength) fail(`byte length mismatch for object ${object.id}`);
    if (digest(payload) !== object.sha256) fail(`content digest mismatch for object ${object.id}`);
    totalBytes += object.byteLength;
    if (!Number.isSafeInteger(totalBytes)) fail('total object bytes exceed safe integer range');
  }
  for (const key of objectBytes.keys()) if (!ids.has(key)) fail(`unreferenced object bytes ${key}`);

  for (const object of manifest.objects) {
    for (const dependency of object.dependencies) {
      if (!objectById.has(dependency)) fail(`object ${object.id} has unknown dependency ${dependency}`);
      if (dependency === object.id) fail(`object ${object.id} depends on itself`);
    }
    if (object.id !== objectId(descriptorIdentity(object))) {
      fail(`content-addressed id mismatch for object ${object.id}`);
    }
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string, depth: number): void => {
    if (depth > MAX_GRAPH_DEPTH) fail(`dependency depth exceeds ${MAX_GRAPH_DEPTH}`);
    if (visiting.has(id)) fail(`dependency cycle includes ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of objectById.get(id)?.dependencies ?? []) visit(dependency, depth + 1);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of ids) visit(id, 0);

  for (const family of selected) {
    if (!accounted.has(family) && !exclusions.has(family)) fail(`selected family ${family} is unaccounted`);
  }
  validateRegistryGraphPolicy(selected, exclusions, manifest.objects);
  if (manifest.resumability.objectCount !== manifest.objects.length) fail('resumability objectCount mismatch');
  if (manifest.resumability.totalBytes !== totalBytes) fail('resumability totalBytes mismatch');
  if (manifest.resumability.terminalOrdinal !== manifest.objects.length - 1) {
    fail('resumability terminalOrdinal mismatch');
  }
  const graphDigest = digest(canonicalJson(semanticCore(manifest)));
  if (manifest.resumability.semanticGraphSha256 !== graphDigest) fail('semantic graph digest mismatch');
  if (manifest.bundleId !== bundleId(graphDigest)) fail('bundle id mismatch');
}

function validateParsedManifest(value: unknown): TransferInnerManifest {
  if (!isRecord(value)) fail('manifest must be an object');
  assertExactKeys(value, ROOT_KEYS, 'manifest');
  if (value.contract !== TRANSFER_INNER_MANIFEST_CONTRACT) fail('unsupported manifest contract');
  if (value.formatVersion !== TRANSFER_INNER_MANIFEST_FORMAT) fail('unsupported manifest format');
  if (typeof value.bundleId !== 'string' || !BUNDLE_ID.test(value.bundleId)) fail('bundleId is malformed');
  validateSource(value.sourceCompatibility);
  assertSortedUniqueStrings(value.selectedLogicalState, 'selectedLogicalState');
  for (const family of value.selectedLogicalState)
    if (!LOGICAL_STATE.has(family)) fail(`unknown selected family ${family}`);

  if (!Array.isArray(value.exclusions)) fail('exclusions must be an array');
  let lastExclusion = '';
  for (const raw of value.exclusions) {
    if (!isRecord(raw)) fail('exclusion must be an object');
    assertExactKeys(raw, EXCLUSION_KEYS, 'exclusion');
    if (typeof raw.logicalStateId !== 'string' || !LOGICAL_STATE.has(raw.logicalStateId))
      fail('unknown exclusion family');
    if (raw.logicalStateId <= lastExclusion) fail('exclusions must be uniquely sorted by family');
    lastExclusion = raw.logicalStateId;
    if (
      typeof raw.disposition !== 'string' ||
      !EXCLUSION_DISPOSITIONS.has(raw.disposition as TransferExclusionDisposition)
    ) {
      fail('unknown exclusion disposition');
    }
    if (typeof raw.reasonCode !== 'string' || !EXCLUSION_REASONS.has(raw.reasonCode as TransferExclusionReason)) {
      fail('unknown exclusion reason');
    }
  }

  if (!Array.isArray(value.objects)) fail('objects must be an array');
  for (const raw of value.objects) {
    if (!isRecord(raw)) fail('object descriptor must be an object');
    assertExactKeys(raw, OBJECT_KEYS, 'object');
    if (typeof raw.id !== 'string' || !OBJECT_ID.test(raw.id)) fail('object id is malformed');
    assertSafeInteger(raw.ordinal, 'object ordinal');
    if (typeof raw.logicalStateId !== 'string' || !LOGICAL_STATE.has(raw.logicalStateId)) fail('unknown object family');
    if (typeof raw.authorityId !== 'string' || !AUTHORITIES.has(raw.authorityId)) fail('unknown object authority');
    if (typeof raw.kind !== 'string' || typeof raw.provenance !== 'string') fail('object kind/provenance is malformed');
    validateProvenance(raw.kind as TransferObjectKind, raw.provenance as TransferProvenanceClassification);
    assertSafeInteger(raw.byteLength, 'object byteLength');
    if (typeof raw.sha256 !== 'string' || !SHA256.test(raw.sha256)) fail('object sha256 is malformed');
    assertSortedUniqueStrings(raw.dependencies, 'object dependencies');
    if (raw.dependencies.length > MAX_OBJECT_DEPENDENCIES) {
      fail(`object dependency count exceeds ${MAX_OBJECT_DEPENDENCIES}`);
    }
    for (const dependency of raw.dependencies) if (!OBJECT_ID.test(dependency)) fail('dependency id is malformed');
    if (raw.immutableBytes !== true) fail('object bytes must be immutable');
  }

  if (!isRecord(value.resumability)) fail('resumability must be an object');
  assertExactKeys(value.resumability, RESUMABILITY_KEYS, 'resumability');
  if (value.resumability.strategy !== 'ordinal-content-addressed-v1') fail('unknown resumability strategy');
  assertSafeInteger(value.resumability.objectCount, 'resumability objectCount');
  assertSafeInteger(value.resumability.totalBytes, 'resumability totalBytes');
  assertSafeInteger(value.resumability.terminalOrdinal, 'resumability terminalOrdinal', -1);
  if (
    typeof value.resumability.semanticGraphSha256 !== 'string' ||
    !SHA256.test(value.resumability.semanticGraphSha256)
  ) {
    fail('semantic graph digest is malformed');
  }
  return value as unknown as TransferInnerManifest;
}

/** Parse duplicate-key-safe canonical manifest bytes and prove the complete object graph. */
export function parseAndValidateTransferObjectGraph(
  manifestBytes: Uint8Array | string,
  objectBytes: ReadonlyMap<string, Uint8Array>
): TransferInnerManifest {
  const text = typeof manifestBytes === 'string' ? manifestBytes : decoder.decode(manifestBytes);
  if (encoder.encode(text).byteLength > MAX_MANIFEST_BYTES) fail(`manifest exceeds ${MAX_MANIFEST_BYTES} bytes`);
  const value = parseStrictJson(text);
  const manifest = validateParsedManifest(value);
  if (canonicalJson(manifest as unknown as Json) !== text) fail('manifest JSON is not canonical');
  validateTotalGraph(manifest, objectBytes);
  return manifest;
}

/**
 * Build a deterministic inner object graph from bytes captured by an already
 * quiesced snapshot producer. This function performs no filesystem reads and
 * no publication, encryption, or mutation.
 */
export function buildTransferObjectGraph(input: BuildTransferObjectGraphInput): TransferObjectGraph {
  validateSource(input.sourceCompatibility);
  const selected = [...input.selectedLogicalState].toSorted();
  if (new Set(input.selectedLogicalState).size !== input.selectedLogicalState.length)
    fail('selectedLogicalState contains duplicates');
  if (selected.length === 0) fail('selectedLogicalState must not be empty');
  for (const family of selected) if (!LOGICAL_STATE.has(family)) fail(`unknown selected family ${family}`);

  const exclusionByFamily = new Map<LogicalStateId, TransferFamilyExclusion>();
  for (const exclusion of input.exclusions) {
    if (!selected.includes(exclusion.logicalStateId))
      fail(`exclusion ${exclusion.logicalStateId} is outside selected scope`);
    if (exclusionByFamily.has(exclusion.logicalStateId)) fail(`duplicate exclusion for ${exclusion.logicalStateId}`);
    if (!EXCLUSION_DISPOSITIONS.has(exclusion.disposition)) fail('unknown exclusion disposition');
    if (!EXCLUSION_REASONS.has(exclusion.reasonCode)) fail('unknown exclusion reason');
    exclusionByFamily.set(exclusion.logicalStateId, { ...exclusion });
  }

  const inputByKey = new Map<string, TransferSnapshotObjectInput>();
  if (input.objects.length > MAX_OBJECTS) fail(`object count exceeds ${MAX_OBJECTS}`);
  for (const object of input.objects) {
    if (!SAFE_CONSTRUCTION_KEY.test(object.key)) fail(`unsafe construction key ${String(object.key)}`);
    if (inputByKey.has(object.key)) fail(`duplicate construction key ${object.key}`);
    if (!selected.includes(object.logicalStateId)) fail(`object ${object.key} is outside selected scope`);
    if (exclusionByFamily.has(object.logicalStateId)) fail(`excluded family ${object.logicalStateId} contains objects`);
    if (!AUTHORITIES.has(object.authorityId)) fail(`object ${object.key} has unknown authority`);
    validateProvenance(object.kind, object.provenance);
    if (!(object.bytes instanceof Uint8Array)) fail(`object ${object.key} bytes must be a Uint8Array`);
    const dependencies = object.dependencyKeys ?? [];
    if (dependencies.length > MAX_OBJECT_DEPENDENCIES) {
      fail(`object ${object.key} dependency count exceeds ${MAX_OBJECT_DEPENDENCIES}`);
    }
    if (new Set(dependencies).size !== dependencies.length) fail(`object ${object.key} has duplicate dependencies`);
    inputByKey.set(object.key, object);
  }
  for (const object of input.objects) {
    for (const dependency of object.dependencyKeys ?? []) {
      if (!inputByKey.has(dependency)) fail(`object ${object.key} has unknown dependency ${dependency}`);
    }
  }

  const visiting = new Set<string>();
  const resolved = new Map<string, Omit<TransferObjectDescriptor, 'ordinal'>>();
  const payloadById = new Map<TransferObjectId, Uint8Array>();
  const resolve = (key: string, depth = 0): Omit<TransferObjectDescriptor, 'ordinal'> => {
    if (depth > MAX_GRAPH_DEPTH) fail(`dependency depth exceeds ${MAX_GRAPH_DEPTH}`);
    const prior = resolved.get(key);
    if (prior) return prior;
    if (visiting.has(key)) fail(`dependency cycle includes ${key}`);
    visiting.add(key);
    const source = inputByKey.get(key);
    if (!source) fail(`unknown construction key ${key}`);
    const dependencies = (source.dependencyKeys ?? [])
      .map((dependency) => resolve(dependency, depth + 1).id)
      .toSorted();
    visiting.delete(key);
    const bytes = Uint8Array.from(source.bytes);
    const sha256 = digest(bytes);
    const identity: Omit<TransferObjectDescriptor, 'id' | 'ordinal'> = {
      authorityId: source.authorityId,
      byteLength: bytes.byteLength,
      dependencies,
      immutableBytes: true,
      kind: source.kind,
      logicalStateId: source.logicalStateId,
      provenance: source.provenance,
      sha256,
    };
    const id = objectId(descriptorIdentity(identity));
    if (payloadById.has(id)) fail(`semantic object collision at ${id}`);
    const descriptor = { id, ...identity } as Omit<TransferObjectDescriptor, 'ordinal'>;
    resolved.set(key, descriptor);
    payloadById.set(id, bytes);
    return descriptor;
  };
  for (const key of inputByKey.keys()) resolve(key);

  const objects: TransferObjectDescriptor[] = [...resolved.values()]
    .toSorted((left, right) => left.id.localeCompare(right.id))
    .map((object, ordinal) => ({
      id: object.id,
      ordinal,
      logicalStateId: object.logicalStateId,
      authorityId: object.authorityId,
      kind: object.kind,
      byteLength: object.byteLength,
      sha256: object.sha256,
      dependencies: object.dependencies,
      provenance: object.provenance,
      immutableBytes: true,
    }));
  const exclusions = [...exclusionByFamily.values()].toSorted((left, right) =>
    left.logicalStateId.localeCompare(right.logicalStateId)
  );
  const objectFamilies = new Set(objects.map((object) => object.logicalStateId));
  for (const family of selected) {
    if (!objectFamilies.has(family) && !exclusionByFamily.has(family)) {
      fail(`selected family ${family} is unaccounted`);
    }
  }
  validateRegistryGraphPolicy(new Set(selected), exclusionByFamily, objects);
  let totalBytes = 0;
  for (const object of objects) {
    totalBytes += object.byteLength;
    if (!Number.isSafeInteger(totalBytes)) fail('total object bytes exceed safe integer range');
  }

  const core = {
    contract: TRANSFER_INNER_MANIFEST_CONTRACT,
    formatVersion: TRANSFER_INNER_MANIFEST_FORMAT,
    exclusions,
    objects,
    selectedLogicalState: selected,
    sourceCompatibility: { ...input.sourceCompatibility },
  } satisfies Json;
  const semanticGraphSha256 = digest(canonicalJson(core));
  const manifest: TransferInnerManifest = {
    contract: TRANSFER_INNER_MANIFEST_CONTRACT,
    formatVersion: TRANSFER_INNER_MANIFEST_FORMAT,
    bundleId: bundleId(semanticGraphSha256),
    sourceCompatibility: { ...input.sourceCompatibility },
    selectedLogicalState: selected,
    exclusions,
    objects,
    resumability: {
      strategy: 'ordinal-content-addressed-v1',
      objectCount: objects.length,
      totalBytes,
      terminalOrdinal: objects.length - 1,
      semanticGraphSha256,
    },
  };
  const text = canonicalJson(manifest as unknown as Json);
  const manifestBytes = encoder.encode(text);
  const objectMap = new Map<TransferObjectId, Uint8Array>();
  for (const object of objects) objectMap.set(object.id, Uint8Array.from(payloadById.get(object.id)!));
  parseAndValidateTransferObjectGraph(manifestBytes, objectMap);
  return {
    manifest,
    manifestBytes,
    objects: objectMap,
    supportReceipt: {
      contract: TRANSFER_OBJECT_GRAPH_RECEIPT_CONTRACT,
      bundleId: manifest.bundleId,
      manifestSha256: digest(manifestBytes),
      semanticGraphSha256,
      objectCount: objects.length,
      totalBytes,
      selectedFamilyCount: selected.length,
      excludedFamilyCount: exclusions.length,
    },
  };
}
