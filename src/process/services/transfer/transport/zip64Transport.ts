/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';
import {
  parseTransferContainerHeader,
  TransferContainerStreamValidator,
  TRANSFER_MAX_CHUNKS,
  TRANSFER_MAX_CHUNK_CIPHERTEXT_BYTES,
  TRANSFER_MAX_HEADER_BYTES,
  TRANSFER_MAX_RECORD_BYTES,
  type TransferChunkDescriptor,
  type TransferContainerTerminal,
} from '../container';
import { crc32 } from './crc32';
import {
  TRANSFER_ZIP64_CONTRACT,
  TRANSFER_ZIP64_MAX_ARCHIVE_BYTES,
  TRANSFER_ZIP64_MAX_ENTRIES,
  TRANSFER_ZIP64_MAX_NAME_BYTES,
  type MaterializedTransferZip64,
  type TransferZip64Input,
  type TransferZip64Receipt,
  type TransferZip64SemanticRecords,
  type TransferZip64Sink,
} from './types';

const LOCAL_SIGNATURE = 0x04034b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const ZIP64_END_SIGNATURE = 0x06064b50;
const ZIP64_LOCATOR_SIGNATURE = 0x07064b50;
const END_SIGNATURE = 0x06054b50;
const ZIP64_EXTRA_ID = 0x0001;
const ZIP64_VERSION = 45;
const UINT16_SENTINEL = 0xffff;
const UINT32_SENTINEL = 0xffffffff;
const LOCAL_FIXED_BYTES = 30;
const CENTRAL_FIXED_BYTES = 46;
const ZIP64_END_BYTES = 56;
const ZIP64_LOCATOR_BYTES = 20;
const END_BYTES = 22;
const LOCAL_ZIP64_EXTRA_BYTES = 20;
const CENTRAL_ZIP64_EXTRA_BYTES = 28;
const MAX_DESCRIPTOR_BYTES = TRANSFER_MAX_RECORD_BYTES;
const MAX_TERMINAL_BYTES = TRANSFER_MAX_RECORD_BYTES;
const NAME_PREFIX = 'wayland-transfer/';

type EntryKind = 'header' | 'descriptor' | 'ciphertext' | 'terminal';

type SourceEntry = Readonly<{
  kind: EntryKind;
  name: string;
  bytes: Uint8Array;
  sourceDigest: string;
}>;

type CentralEntry = Readonly<{
  kind: EntryKind;
  name: string;
  crc: number;
  size: number;
  localOffset: number;
  dataOffset: number;
  dataDigest: string;
}>;

/**
 * Writes one canonical, STORE-only ZIP64 archive to a caller-owned sink. The
 * sink should point at private staging storage; a rejected write is partial and
 * must never be published. No user-controlled name or metadata enters ZIP.
 */
export async function writeTransferZip64(
  input: TransferZip64Input,
  sink: TransferZip64Sink
): Promise<TransferZip64Receipt> {
  assertSink(sink);
  const entries = validateAndFlattenInput(input);
  const layout = computeLayout(entries);
  const archiveHash = createHash('sha256');
  let written = 0;

  const emit = async (bytes: Uint8Array): Promise<void> => {
    await sink.write(bytes);
    archiveHash.update(bytes);
    written += bytes.length;
  };

  for (let index = 0; index < layout.entries.length; index += 1) {
    const entry = layout.entries[index]!;
    const source = entries[index]!;
    const snapshot = Uint8Array.from(source.bytes);
    if (digestHex(snapshot) !== source.sourceDigest) throw new Error('Transfer ZIP64 input changed during write');
    // Sink writes are deliberately serial: archive order is part of the wire contract.
    // eslint-disable-next-line no-await-in-loop
    await emit(localHeader(entry));
    // eslint-disable-next-line no-await-in-loop
    await emit(snapshot);
  }
  for (const entry of layout.entries) {
    // eslint-disable-next-line no-await-in-loop
    await emit(centralHeader(entry));
  }
  await emit(zip64End(layout.entries.length, layout.centralBytes, layout.centralOffset));
  await emit(zip64Locator(layout.zip64EndOffset));
  await emit(classicEndSentinel());

  if (written !== layout.archiveBytes) throw new Error('Transfer ZIP64 writer byte-count mismatch');
  return {
    contract: TRANSFER_ZIP64_CONTRACT,
    archiveBytes: written,
    entryCount: layout.entries.length,
    archiveDigest: `sha256:${archiveHash.digest('hex')}`,
  };
}

/**
 * Strictly validates ZIP64 structure, every payload checksum/digest, canonical
 * entry order, and the real outer transfer stream before returning an archive
 * handle. The supplied bytes are never exposed directly.
 */
export function readTransferZip64(archive: Uint8Array): ValidatedTransferZip64Archive {
  assertArchiveBytes(archive);
  const archiveDigest = digestHex(archive);
  const entries = parseCentralDirectory(archive);
  validateLocalEntries(archive, entries);
  const semantic = validateContainerRecords(archive, entries);
  return new ValidatedTransferZip64Archive(archive, archiveDigest, entries, semantic);
}

export class ValidatedTransferZip64Archive {
  readonly receipt: TransferZip64Receipt;

  constructor(
    private readonly archive: Uint8Array,
    private readonly archiveDigestHex: string,
    private readonly entries: readonly CentralEntry[],
    readonly records: TransferZip64SemanticRecords
  ) {
    this.receipt = Object.freeze({
      contract: TRANSFER_ZIP64_CONTRACT,
      archiveBytes: archive.length,
      entryCount: entries.length,
      archiveDigest: `sha256:${archiveDigestHex}`,
    });
  }

  /** Copies records only after rechecking the complete immutable candidate. */
  materialize(): MaterializedTransferZip64 {
    if (digestHex(this.archive) !== this.archiveDigestHex)
      throw new Error('Transfer ZIP64 archive changed after validation');
    const header = this.copyEntry(0);
    const chunks = Array.from({ length: this.records.descriptors.length }, (_unused, ordinal) => ({
      descriptor: this.copyEntry(1 + ordinal * 2),
      ciphertext: this.copyEntry(2 + ordinal * 2),
    }));
    const terminal = this.copyEntry(this.entries.length - 1);
    const validator = new TransferContainerStreamValidator(parseTransferContainerHeader(header));
    for (const chunk of chunks) validator.acceptChunk(chunk.descriptor, chunk.ciphertext);
    validator.acceptTerminal(terminal);
    return { header, chunks, terminal, validatedContainer: validator.finish() };
  }

  private copyEntry(index: number): Uint8Array {
    const entry = this.entries[index];
    if (!entry) throw new Error('Transfer ZIP64 internal entry index mismatch');
    const bytes = this.archive.subarray(entry.dataOffset, entry.dataOffset + entry.size);
    if (digestHex(bytes) !== entry.dataDigest) throw new Error('Transfer ZIP64 entry changed after validation');
    return Uint8Array.from(bytes);
  }
}

function validateAndFlattenInput(input: TransferZip64Input): SourceEntry[] {
  if (!isRecord(input)) throw new Error('Transfer ZIP64 input must be an object');
  assertOwnedBytes(input.header, TRANSFER_MAX_HEADER_BYTES, 'header');
  assertOwnedBytes(input.terminal, MAX_TERMINAL_BYTES, 'terminal');
  if (!Array.isArray(input.chunks) || input.chunks.length < 1 || input.chunks.length > TRANSFER_MAX_CHUNKS) {
    throw new Error('Transfer ZIP64 chunk count is outside bounds');
  }
  const header = parseTransferContainerHeader(input.header);
  const validator = new TransferContainerStreamValidator(header);
  if (header.declaredChunkCount !== input.chunks.length)
    throw new Error('Transfer ZIP64 chunk count disagrees with header');

  const entries: SourceEntry[] = [sourceEntry('header', 0, input.header)];
  input.chunks.forEach((chunk, ordinal) => {
    if (!isRecord(chunk)) throw new Error('Transfer ZIP64 chunk must be an object');
    assertOwnedBytes(chunk.descriptor, MAX_DESCRIPTOR_BYTES, 'chunk descriptor');
    assertOwnedBytes(chunk.ciphertext, TRANSFER_MAX_CHUNK_CIPHERTEXT_BYTES, 'chunk ciphertext');
    validator.acceptChunk(chunk.descriptor, chunk.ciphertext);
    entries.push(sourceEntry('descriptor', entries.length, chunk.descriptor));
    entries.push(sourceEntry('ciphertext', entries.length, chunk.ciphertext));
    if (ordinal >= TRANSFER_MAX_CHUNKS) throw new Error('Transfer ZIP64 chunk ordinal overflow');
  });
  validator.acceptTerminal(input.terminal);
  validator.finish();
  entries.push(sourceEntry('terminal', entries.length, input.terminal));
  if (entries.length > TRANSFER_ZIP64_MAX_ENTRIES) throw new Error('Transfer ZIP64 entry count is outside bounds');
  return entries;
}

function sourceEntry(kind: EntryKind, index: number, bytes: Uint8Array): SourceEntry {
  return { kind, name: canonicalName(index, kind), bytes, sourceDigest: digestHex(bytes) };
}

function computeLayout(entries: readonly SourceEntry[]): {
  entries: CentralEntry[];
  centralOffset: number;
  centralBytes: number;
  zip64EndOffset: number;
  archiveBytes: number;
} {
  let offset = 0;
  const central: CentralEntry[] = [];
  for (const entry of entries) {
    const nameBytes = Buffer.byteLength(entry.name, 'ascii');
    const localOffset = offset;
    const dataOffset = checkedAdd(localOffset, LOCAL_FIXED_BYTES + nameBytes + LOCAL_ZIP64_EXTRA_BYTES, 'local entry');
    offset = checkedAdd(dataOffset, entry.bytes.length, 'archive');
    central.push({
      kind: entry.kind,
      name: entry.name,
      crc: crc32(entry.bytes),
      size: entry.bytes.length,
      localOffset,
      dataOffset,
      dataDigest: entry.sourceDigest,
    });
  }
  const centralOffset = offset;
  const centralBytes = central.reduce(
    (total, entry) =>
      checkedAdd(
        total,
        CENTRAL_FIXED_BYTES + Buffer.byteLength(entry.name, 'ascii') + CENTRAL_ZIP64_EXTRA_BYTES,
        'central directory'
      ),
    0
  );
  const zip64EndOffset = checkedAdd(centralOffset, centralBytes, 'ZIP64 end offset');
  const archiveBytes = checkedAdd(zip64EndOffset, ZIP64_END_BYTES + ZIP64_LOCATOR_BYTES + END_BYTES, 'archive');
  if (archiveBytes > TRANSFER_ZIP64_MAX_ARCHIVE_BYTES) throw new Error('Transfer ZIP64 archive exceeds size bound');
  return { entries: central, centralOffset, centralBytes, zip64EndOffset, archiveBytes };
}

function parseCentralDirectory(archive: Uint8Array): CentralEntry[] {
  if (archive.length < ZIP64_END_BYTES + ZIP64_LOCATOR_BYTES + END_BYTES)
    throw new Error('Transfer ZIP64 archive is truncated');
  const view = viewOf(archive);
  const endOffset = archive.length - END_BYTES;
  if (readU32(view, endOffset) !== END_SIGNATURE)
    throw new Error('Transfer ZIP64 archive has trailing or missing terminal bytes');
  if (
    readU16(view, endOffset + 4) !== 0 ||
    readU16(view, endOffset + 6) !== 0 ||
    readU16(view, endOffset + 8) !== UINT16_SENTINEL ||
    readU16(view, endOffset + 10) !== UINT16_SENTINEL ||
    readU32(view, endOffset + 12) !== UINT32_SENTINEL ||
    readU32(view, endOffset + 16) !== UINT32_SENTINEL ||
    readU16(view, endOffset + 20) !== 0
  ) {
    throw new Error('Transfer archive is not canonical single-disk ZIP64');
  }

  const locatorOffset = endOffset - ZIP64_LOCATOR_BYTES;
  if (readU32(view, locatorOffset) !== ZIP64_LOCATOR_SIGNATURE)
    throw new Error('Transfer archive is missing ZIP64 locator');
  if (readU32(view, locatorOffset + 4) !== 0 || readU32(view, locatorOffset + 16) !== 1)
    throw new Error('Transfer ZIP64 multi-disk archives are forbidden');
  const zip64EndOffset = safeU64(readU64(view, locatorOffset + 8), 'ZIP64 end offset');
  if (zip64EndOffset !== locatorOffset - ZIP64_END_BYTES) throw new Error('Transfer ZIP64 locator offset mismatch');
  if (readU32(view, zip64EndOffset) !== ZIP64_END_SIGNATURE || readU64(view, zip64EndOffset + 4) !== BigInt(44))
    throw new Error('Malformed transfer ZIP64 end record');
  if (readU16(view, zip64EndOffset + 12) !== ZIP64_VERSION || readU16(view, zip64EndOffset + 14) !== ZIP64_VERSION)
    throw new Error('Unsupported transfer ZIP64 version');
  if (readU32(view, zip64EndOffset + 16) !== 0 || readU32(view, zip64EndOffset + 20) !== 0)
    throw new Error('Transfer ZIP64 multi-disk archives are forbidden');
  const diskEntries = safeU64(readU64(view, zip64EndOffset + 24), 'ZIP64 disk entry count');
  const totalEntries = safeU64(readU64(view, zip64EndOffset + 32), 'ZIP64 entry count');
  if (diskEntries !== totalEntries || totalEntries < 4 || totalEntries > TRANSFER_ZIP64_MAX_ENTRIES)
    throw new Error('Transfer ZIP64 entry count is outside bounds');
  const centralBytes = safeU64(readU64(view, zip64EndOffset + 40), 'ZIP64 central size');
  const centralOffset = safeU64(readU64(view, zip64EndOffset + 48), 'ZIP64 central offset');
  if (checkedAdd(centralOffset, centralBytes, 'central directory') !== zip64EndOffset)
    throw new Error('Transfer ZIP64 central directory boundary mismatch');

  const chunkCount = (totalEntries - 2) / 2;
  if (!Number.isInteger(chunkCount) || chunkCount < 1 || chunkCount > TRANSFER_MAX_CHUNKS)
    throw new Error('Transfer ZIP64 entry set is invalid');

  const entries: CentralEntry[] = [];
  const names = new Set<string>();
  let cursor = centralOffset;
  for (let index = 0; index < totalEntries; index += 1) {
    assertRange(archive, cursor, CENTRAL_FIXED_BYTES, 'central header');
    if (readU32(view, cursor) !== CENTRAL_SIGNATURE) throw new Error('Malformed transfer ZIP64 central header');
    if (readU16(view, cursor + 4) !== ZIP64_VERSION || readU16(view, cursor + 6) !== ZIP64_VERSION)
      throw new Error('Unsupported transfer ZIP64 entry version');
    assertCanonicalEntryFlags(view, cursor + 8);
    const crc = readU32(view, cursor + 16);
    if (readU32(view, cursor + 20) !== UINT32_SENTINEL || readU32(view, cursor + 24) !== UINT32_SENTINEL)
      throw new Error('Classic ZIP sizes are forbidden for transfer entries');
    const nameLength = readU16(view, cursor + 28);
    const extraLength = readU16(view, cursor + 30);
    if (nameLength < 1 || nameLength > TRANSFER_ZIP64_MAX_NAME_BYTES || extraLength !== CENTRAL_ZIP64_EXTRA_BYTES)
      throw new Error('Malformed transfer ZIP64 entry metadata');
    if (
      readU16(view, cursor + 32) !== 0 ||
      readU16(view, cursor + 34) !== 0 ||
      readU16(view, cursor + 36) !== 0 ||
      readU32(view, cursor + 38) !== 0 ||
      readU32(view, cursor + 42) !== UINT32_SENTINEL
    ) {
      throw new Error('Transfer ZIP64 comments, disks, attributes, and links are forbidden');
    }
    const variableOffset = cursor + CENTRAL_FIXED_BYTES;
    assertRange(archive, variableOffset, nameLength + extraLength, 'central entry fields');
    const name = decodeCanonicalName(archive.subarray(variableOffset, variableOffset + nameLength));
    const expectedKind = kindAt(index, totalEntries);
    if (name !== canonicalName(index, expectedKind))
      throw new Error('Transfer ZIP64 entry name or order is noncanonical');
    if (names.has(name)) throw new Error('Duplicate transfer ZIP64 entry name');
    names.add(name);
    const extraOffset = variableOffset + nameLength;
    assertZip64Extra(view, extraOffset, 24);
    const size = safeU64(readU64(view, extraOffset + 4), 'ZIP64 uncompressed size');
    const compressedSize = safeU64(readU64(view, extraOffset + 12), 'ZIP64 compressed size');
    const localOffset = safeU64(readU64(view, extraOffset + 20), 'ZIP64 local offset');
    if (size !== compressedSize || size < 1 || size > maxBytesForKind(expectedKind))
      throw new Error('Transfer ZIP64 stored entry size is outside bounds');
    entries.push({ kind: expectedKind, name, crc, size, localOffset, dataOffset: -1, dataDigest: '' });
    cursor = checkedAdd(variableOffset, nameLength + extraLength, 'central entry cursor');
  }
  if (cursor !== zip64EndOffset) throw new Error('Transfer ZIP64 central directory contains trailing material');
  return entries;
}

function validateLocalEntries(archive: Uint8Array, central: CentralEntry[]): void {
  const view = viewOf(archive);
  let expectedOffset = 0;
  for (let index = 0; index < central.length; index += 1) {
    const entry = central[index]!;
    if (entry.localOffset !== expectedOffset) throw new Error('Transfer ZIP64 local entries overlap, gap, or reorder');
    assertRange(archive, entry.localOffset, LOCAL_FIXED_BYTES, 'local header');
    const cursor = entry.localOffset;
    if (readU32(view, cursor) !== LOCAL_SIGNATURE || readU16(view, cursor + 4) !== ZIP64_VERSION)
      throw new Error('Malformed transfer ZIP64 local header');
    assertCanonicalEntryFlags(view, cursor + 6);
    if (
      readU32(view, cursor + 14) !== entry.crc ||
      readU32(view, cursor + 18) !== UINT32_SENTINEL ||
      readU32(view, cursor + 22) !== UINT32_SENTINEL
    ) {
      throw new Error('Transfer ZIP64 local and central entry mismatch');
    }
    const nameLength = readU16(view, cursor + 26);
    const extraLength = readU16(view, cursor + 28);
    if (extraLength !== LOCAL_ZIP64_EXTRA_BYTES) throw new Error('Malformed transfer ZIP64 local extra field');
    const variableOffset = cursor + LOCAL_FIXED_BYTES;
    assertRange(archive, variableOffset, nameLength + extraLength, 'local entry fields');
    const name = decodeCanonicalName(archive.subarray(variableOffset, variableOffset + nameLength));
    if (name !== entry.name) throw new Error('Transfer ZIP64 local and central names disagree');
    const extraOffset = variableOffset + nameLength;
    assertZip64Extra(view, extraOffset, 16);
    if (
      safeU64(readU64(view, extraOffset + 4), 'local uncompressed size') !== entry.size ||
      safeU64(readU64(view, extraOffset + 12), 'local compressed size') !== entry.size
    ) {
      throw new Error('Transfer ZIP64 local size mismatch');
    }
    const dataOffset = extraOffset + extraLength;
    assertRange(archive, dataOffset, entry.size, 'stored entry');
    const data = archive.subarray(dataOffset, dataOffset + entry.size);
    if (crc32(data) !== entry.crc) throw new Error('Transfer ZIP64 CRC mismatch');
    (entry as { dataOffset: number }).dataOffset = dataOffset;
    (entry as { dataDigest: string }).dataDigest = digestHex(data);
    expectedOffset = checkedAdd(dataOffset, entry.size, 'local entry end');
  }
  const centralOffset = centralDirectoryOffset(archive);
  if (expectedOffset !== centralOffset)
    throw new Error('Transfer ZIP64 material appears between entries and directory');
}

function validateContainerRecords(archive: Uint8Array, entries: readonly CentralEntry[]): TransferZip64SemanticRecords {
  const bytesAt = (index: number): Uint8Array => {
    const entry = entries[index]!;
    return archive.subarray(entry.dataOffset, entry.dataOffset + entry.size);
  };
  const header = parseTransferContainerHeader(bytesAt(0));
  const chunkCount = (entries.length - 2) / 2;
  if (header.declaredChunkCount !== chunkCount)
    throw new Error('Transfer ZIP64 entry set disagrees with container header');
  const validator = new TransferContainerStreamValidator(header);
  const descriptors: TransferChunkDescriptor[] = [];
  for (let ordinal = 0; ordinal < chunkCount; ordinal += 1) {
    descriptors.push(validator.acceptChunk(bytesAt(1 + ordinal * 2), bytesAt(2 + ordinal * 2)).descriptor);
  }
  const terminal = validator.acceptTerminal(bytesAt(entries.length - 1));
  validator.finish();
  return Object.freeze({
    header,
    descriptors: Object.freeze(descriptors),
    terminal: terminal as TransferContainerTerminal,
  });
}

function localHeader(entry: CentralEntry): Uint8Array {
  const name = Buffer.from(entry.name, 'ascii');
  const output = Buffer.alloc(LOCAL_FIXED_BYTES + name.length + LOCAL_ZIP64_EXTRA_BYTES);
  output.writeUInt32LE(LOCAL_SIGNATURE, 0);
  output.writeUInt16LE(ZIP64_VERSION, 4);
  output.writeUInt32LE(entry.crc, 14);
  output.writeUInt32LE(UINT32_SENTINEL, 18);
  output.writeUInt32LE(UINT32_SENTINEL, 22);
  output.writeUInt16LE(name.length, 26);
  output.writeUInt16LE(LOCAL_ZIP64_EXTRA_BYTES, 28);
  name.copy(output, LOCAL_FIXED_BYTES);
  writeZip64Extra(output, LOCAL_FIXED_BYTES + name.length, entry.size, entry.size);
  return output;
}

function centralHeader(entry: CentralEntry): Uint8Array {
  const name = Buffer.from(entry.name, 'ascii');
  const output = Buffer.alloc(CENTRAL_FIXED_BYTES + name.length + CENTRAL_ZIP64_EXTRA_BYTES);
  output.writeUInt32LE(CENTRAL_SIGNATURE, 0);
  output.writeUInt16LE(ZIP64_VERSION, 4);
  output.writeUInt16LE(ZIP64_VERSION, 6);
  output.writeUInt32LE(entry.crc, 16);
  output.writeUInt32LE(UINT32_SENTINEL, 20);
  output.writeUInt32LE(UINT32_SENTINEL, 24);
  output.writeUInt16LE(name.length, 28);
  output.writeUInt16LE(CENTRAL_ZIP64_EXTRA_BYTES, 30);
  output.writeUInt32LE(UINT32_SENTINEL, 42);
  name.copy(output, CENTRAL_FIXED_BYTES);
  writeZip64Extra(output, CENTRAL_FIXED_BYTES + name.length, entry.size, entry.size, entry.localOffset);
  return output;
}

function zip64End(entryCount: number, centralBytes: number, centralOffset: number): Uint8Array {
  const output = Buffer.alloc(ZIP64_END_BYTES);
  output.writeUInt32LE(ZIP64_END_SIGNATURE, 0);
  output.writeBigUInt64LE(BigInt(44), 4);
  output.writeUInt16LE(ZIP64_VERSION, 12);
  output.writeUInt16LE(ZIP64_VERSION, 14);
  output.writeBigUInt64LE(BigInt(entryCount), 24);
  output.writeBigUInt64LE(BigInt(entryCount), 32);
  output.writeBigUInt64LE(BigInt(centralBytes), 40);
  output.writeBigUInt64LE(BigInt(centralOffset), 48);
  return output;
}

function zip64Locator(zip64EndOffset: number): Uint8Array {
  const output = Buffer.alloc(ZIP64_LOCATOR_BYTES);
  output.writeUInt32LE(ZIP64_LOCATOR_SIGNATURE, 0);
  output.writeBigUInt64LE(BigInt(zip64EndOffset), 8);
  output.writeUInt32LE(1, 16);
  return output;
}

function classicEndSentinel(): Uint8Array {
  const output = Buffer.alloc(END_BYTES);
  output.writeUInt32LE(END_SIGNATURE, 0);
  output.writeUInt16LE(UINT16_SENTINEL, 8);
  output.writeUInt16LE(UINT16_SENTINEL, 10);
  output.writeUInt32LE(UINT32_SENTINEL, 12);
  output.writeUInt32LE(UINT32_SENTINEL, 16);
  return output;
}

function writeZip64Extra(
  output: Buffer,
  offset: number,
  size: number,
  compressedSize: number,
  localOffset?: number
): void {
  output.writeUInt16LE(ZIP64_EXTRA_ID, offset);
  output.writeUInt16LE(localOffset === undefined ? 16 : 24, offset + 2);
  output.writeBigUInt64LE(BigInt(size), offset + 4);
  output.writeBigUInt64LE(BigInt(compressedSize), offset + 12);
  if (localOffset !== undefined) output.writeBigUInt64LE(BigInt(localOffset), offset + 20);
}

function assertZip64Extra(view: DataView, offset: number, payloadBytes: 16 | 24): void {
  if (readU16(view, offset) !== ZIP64_EXTRA_ID || readU16(view, offset + 2) !== payloadBytes)
    throw new Error('Unknown or malformed critical transfer ZIP64 extra field');
}

function assertCanonicalEntryFlags(view: DataView, offset: number): void {
  const flags = readU16(view, offset);
  const method = readU16(view, offset + 2);
  const time = readU16(view, offset + 4);
  const date = readU16(view, offset + 6);
  if (flags !== 0) throw new Error('Transfer ZIP64 encryption, descriptors, and flags are forbidden');
  if (method !== 0) throw new Error('Transfer ZIP64 compression is forbidden');
  if (time !== 0 || date !== 0) throw new Error('Transfer ZIP64 timestamps are forbidden');
}

function canonicalName(index: number, kind: EntryKind): string {
  return `${NAME_PREFIX}${String(index).padStart(10, '0')}.${kind}`;
}

function decodeCanonicalName(bytes: Uint8Array): string {
  for (const byte of bytes) {
    if (byte < 0x20 || byte > 0x7e || byte === 0x5c) throw new Error('Unsafe transfer ZIP64 entry name');
  }
  const name = Buffer.from(bytes).toString('ascii');
  if (
    name.startsWith('/') ||
    /^[A-Za-z]:/.test(name) ||
    name.includes('../') ||
    name.includes('/..') ||
    name.includes('//') ||
    name.includes('\0')
  ) {
    throw new Error('Unsafe transfer ZIP64 entry path');
  }
  return name;
}

function kindAt(index: number, total: number): EntryKind {
  if (index === 0) return 'header';
  if (index === total - 1) return 'terminal';
  return index % 2 === 1 ? 'descriptor' : 'ciphertext';
}

function maxBytesForKind(kind: EntryKind): number {
  if (kind === 'header') return TRANSFER_MAX_HEADER_BYTES;
  if (kind === 'ciphertext') return TRANSFER_MAX_CHUNK_CIPHERTEXT_BYTES;
  return TRANSFER_MAX_RECORD_BYTES;
}

function centralDirectoryOffset(archive: Uint8Array): number {
  const view = viewOf(archive);
  const locatorOffset = archive.length - END_BYTES - ZIP64_LOCATOR_BYTES;
  const zip64EndOffset = safeU64(readU64(view, locatorOffset + 8), 'ZIP64 end offset');
  return safeU64(readU64(view, zip64EndOffset + 48), 'ZIP64 central offset');
}

function assertArchiveBytes(archive: Uint8Array): void {
  if (!(archive instanceof Uint8Array)) throw new Error('Transfer ZIP64 archive must be bytes');
  if (typeof SharedArrayBuffer !== 'undefined' && archive.buffer instanceof SharedArrayBuffer)
    throw new Error('Transfer ZIP64 archive cannot use shared mutable memory');
  if (archive.length === 0 || archive.length > TRANSFER_ZIP64_MAX_ARCHIVE_BYTES)
    throw new Error('Transfer ZIP64 archive exceeds size bound');
}

function assertOwnedBytes(bytes: unknown, maximum: number, label: string): asserts bytes is Uint8Array {
  if (!(bytes instanceof Uint8Array)) throw new Error(`Transfer ZIP64 ${label} must be bytes`);
  if (typeof SharedArrayBuffer !== 'undefined' && bytes.buffer instanceof SharedArrayBuffer)
    throw new Error(`Transfer ZIP64 ${label} cannot use shared mutable memory`);
  if (bytes.length < 1 || bytes.length > maximum) throw new Error(`Transfer ZIP64 ${label} exceeds size bound`);
}

function assertSink(sink: TransferZip64Sink): void {
  if (!isRecord(sink) || typeof sink.write !== 'function') throw new Error('Transfer ZIP64 sink is invalid');
}

function checkedAdd(left: number, right: number, label: string): number {
  const value = left + right;
  if (!Number.isSafeInteger(value) || value < 0 || value > TRANSFER_ZIP64_MAX_ARCHIVE_BYTES)
    throw new Error(`Transfer ZIP64 ${label} exceeds size bound`);
  return value;
}

function safeU64(value: bigint, label: string): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(`Transfer ${label} exceeds safe integer range`);
  return Number(value);
}

function viewOf(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function readU16(view: DataView, offset: number): number {
  try {
    return view.getUint16(offset, true);
  } catch {
    throw new Error('Transfer ZIP64 archive is truncated');
  }
}

function readU32(view: DataView, offset: number): number {
  try {
    return view.getUint32(offset, true);
  } catch {
    throw new Error('Transfer ZIP64 archive is truncated');
  }
}

function readU64(view: DataView, offset: number): bigint {
  try {
    return view.getBigUint64(offset, true);
  } catch {
    throw new Error('Transfer ZIP64 archive is truncated');
  }
}

function assertRange(bytes: Uint8Array, offset: number, length: number, label: string): void {
  if (
    !Number.isSafeInteger(offset) ||
    !Number.isSafeInteger(length) ||
    offset < 0 ||
    length < 0 ||
    offset + length > bytes.length
  )
    throw new Error(`Transfer ZIP64 ${label} is truncated or out of bounds`);
}

function digestHex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
