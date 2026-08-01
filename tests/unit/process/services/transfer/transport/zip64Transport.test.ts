import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  recoveryProtection,
  serializeTransferContainerRecord,
  TRANSFER_CHUNK_SCHEMA,
  TRANSFER_CONTAINER_CONTRACT,
  TRANSFER_CONTAINER_FORMAT_VERSION,
  TRANSFER_RECOVERY_SUITE,
  TransferContainerStreamValidator,
  transferCiphertextDigest,
  type TransferChunkDescriptor,
  type TransferContainerHeader,
  type TransferContainerTerminal,
} from '@process/services/transfer/container';
import {
  createSourceAuthorizationRecord,
  sourceScopeForGraph,
  SourceSigningAuthority,
  type SourceAuthorizationValidationPolicy,
  type TransferPublicationContainerRecord,
} from '@process/services/transfer/publish';
import {
  readTransferZip64,
  TRANSFER_ZIP64_CONTRACT,
  writeTransferZip64,
  type TransferZip64Input,
} from '@process/services/transfer/transport';
import { crc32 } from '@process/services/transfer/transport/crc32';

const CENTRAL_SIGNATURE = 0x02014b50;
const ZIP64_END_BYTES = 56;
const ZIP64_LOCATOR_BYTES = 20;
const END_BYTES = 22;
const NOW = 1_784_413_200_000;
const SOURCE_AUTHORITY = SourceSigningAuthority.issue();
const SEMANTIC_GRAPH_SHA256 = `sha256:${'a'.repeat(64)}` as const;
const BUNDLE_ID = `wtb1:${'a'.repeat(64)}`;
const MUTATION_EPOCH = { start: 'process-config:42', end: 'process-config:42' } as const;
const SOURCE_SCOPE = sourceScopeForGraph(
  SEMANTIC_GRAPH_SHA256,
  BUNDLE_ID,
  ['desktop.preferences'],
  [],
  MUTATION_EPOCH,
  { mode: 'recovery', recoveryMode: 'passphrase' }
);
const SOURCE_POLICY: SourceAuthorizationValidationPolicy = {
  trustedAuthority: SOURCE_AUTHORITY.descriptor(),
  expectedScope: SOURCE_SCOPE,
  now: () => NOW,
};

const digest = (value: string): `sha256:${string}` => `sha256:${createHash('sha256').update(value).digest('hex')}`;

function fixture(chunkCount = 1): TransferZip64Input {
  const ciphertexts = Array.from({ length: chunkCount }, (_unused, ordinal) => Buffer.alloc(32, 0x40 + ordinal));
  const header: TransferContainerHeader = {
    recordType: 'header',
    contract: TRANSFER_CONTAINER_CONTRACT,
    formatVersion: TRANSFER_CONTAINER_FORMAT_VERSION,
    bundleId: BUNDLE_ID,
    suite: TRANSFER_RECOVERY_SUITE,
    declaredChunkCount: chunkCount,
    declaredCiphertextBytes: ciphertexts.reduce((sum, value) => sum + value.length, 0),
    declaredPlaintextBytes: chunkCount * 16,
    protection: recoveryProtection(Buffer.alloc(16, 0x22)),
  };
  const validator = new TransferContainerStreamValidator(header);
  const chunks = ciphertexts.map((ciphertext, ordinal) => {
    const descriptor: TransferChunkDescriptor = {
      recordType: 'chunk',
      bundleId: header.bundleId,
      schema: TRANSFER_CHUNK_SCHEMA,
      ordinal,
      plaintextLength: 16,
      ciphertextLength: ciphertext.length,
      contentDigest: digest(`plaintext-${ordinal}`),
      ciphertextDigest: transferCiphertextDigest(ciphertext),
      nonce: Buffer.alloc(24, ordinal + 1).toString('base64url'),
    };
    const serialized = serializeTransferContainerRecord(descriptor);
    validator.acceptChunk(serialized, ciphertext);
    return { descriptor: serialized, ciphertext };
  });
  const terminal: TransferContainerTerminal = {
    recordType: 'terminal',
    bundleId: header.bundleId,
    chunkCount,
    plaintextBytes: header.declaredPlaintextBytes,
    ciphertextBytes: header.declaredCiphertextBytes,
    streamDigest: validator.currentStreamDigest(),
  };
  const terminalBytes = serializeTransferContainerRecord(terminal);
  validator.acceptTerminal(terminalBytes);
  validator.finish();
  const headerBytes = serializeTransferContainerRecord(header);
  const containerRecords: readonly TransferPublicationContainerRecord[] = [
    { recordType: 'header', serialized: headerBytes },
    ...chunks.map((chunk) => ({ recordType: 'chunk' as const, ...chunk })),
    { recordType: 'terminal', serialized: terminalBytes },
  ];
  const sourceAuthorization = createSourceAuthorizationRecord(
    containerRecords,
    header,
    terminal,
    SOURCE_SCOPE,
    { authority: SOURCE_AUTHORITY, mutationEpoch: MUTATION_EPOCH, expiresAt: NOW + 60_000 },
    NOW
  );
  return {
    header: headerBytes,
    chunks,
    terminal: terminalBytes,
    sourceAuthorization: sourceAuthorization.serialized,
  };
}

async function encode(chunkCount = 1): Promise<Buffer> {
  const parts: Buffer[] = [];
  await writeTransferZip64(
    fixture(chunkCount),
    {
      write(bytes) {
        parts.push(Buffer.from(bytes));
      },
    },
    SOURCE_POLICY
  );
  return Buffer.concat(parts);
}

function view(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function centralOffset(bytes: Uint8Array): number {
  const data = view(bytes);
  const locator = bytes.length - END_BYTES - ZIP64_LOCATOR_BYTES;
  const zip64End = Number(data.getBigUint64(locator + 8, true));
  return Number(data.getBigUint64(zip64End + 48, true));
}

function centralEntries(bytes: Uint8Array): number[] {
  const data = view(bytes);
  const offsets: number[] = [];
  let cursor = centralOffset(bytes);
  const zip64End = bytes.length - END_BYTES - ZIP64_LOCATOR_BYTES - ZIP64_END_BYTES;
  while (cursor < zip64End) {
    expect(data.getUint32(cursor, true)).toBe(CENTRAL_SIGNATURE);
    offsets.push(cursor);
    cursor += 46 + data.getUint16(cursor + 28, true) + data.getUint16(cursor + 30, true);
  }
  return offsets;
}

function localDataOffset(bytes: Uint8Array, centralEntry: number): number {
  const data = view(bytes);
  const localOffset = Number(data.getBigUint64(centralEntry + 46 + data.getUint16(centralEntry + 28, true) + 20, true));
  return localOffset + 30 + data.getUint16(localOffset + 26, true) + data.getUint16(localOffset + 28, true);
}

describe('Wayland Transfer strict ZIP64 transport', () => {
  it('uses the standard CRC-32/ISO-HDLC wire checksum', () => {
    expect(crc32(Buffer.from('123456789'))).toBe(0xcbf43926);
  });

  it('writes and reads the canonical generic record set', async () => {
    const input = fixture(2);
    const chunks: Buffer[] = [];
    const receipt = await writeTransferZip64(
      input,
      {
        async write(bytes) {
          chunks.push(Buffer.from(bytes));
        },
      },
      SOURCE_POLICY
    );
    const archive = Buffer.concat(chunks);
    expect(receipt).toEqual({
      contract: TRANSFER_ZIP64_CONTRACT,
      archiveBytes: archive.length,
      entryCount: 7,
      archiveDigest: `sha256:${createHash('sha256').update(archive).digest('hex')}`,
    });
    expect(JSON.stringify(receipt)).not.toMatch(/bundle|project|chat|user|secret|recipient/i);
    const accepted = readTransferZip64(archive, SOURCE_POLICY);
    expect(accepted.receipt).toEqual(receipt);
    expect(accepted.records.descriptors.map((descriptor) => descriptor.ordinal)).toEqual([0, 1]);
    const materialized = accepted.materialize();
    expect(Buffer.from(materialized.header)).toEqual(Buffer.from(input.header));
    expect(
      materialized.chunks.map((chunk) => ({
        descriptor: Buffer.from(chunk.descriptor),
        ciphertext: Buffer.from(chunk.ciphertext),
      }))
    ).toEqual(
      input.chunks.map((chunk) => ({
        descriptor: Buffer.from(chunk.descriptor),
        ciphertext: Buffer.from(chunk.ciphertext),
      }))
    );
    expect(Buffer.from(materialized.terminal)).toEqual(Buffer.from(input.terminal));
    expect(Buffer.from(materialized.sourceAuthorization)).toEqual(Buffer.from(input.sourceAuthorization));
    expect(materialized.validatedPublication).toEqual(accepted.records.validatedPublication);
    expect(materialized.validatedContainer.terminal.chunkCount).toBe(2);
  });

  it('rejects an archive whose final source authorization is not trusted', async () => {
    const archive = await encode();
    expect(() =>
      readTransferZip64(archive, {
        ...SOURCE_POLICY,
        trustedAuthority: SourceSigningAuthority.issue().descriptor(),
      })
    ).toThrow(/authority.*trusted/i);
  });

  it('rejects source-authorization tampering even when ZIP checksums are repaired', async () => {
    const archive = await encode();
    const authorizationEntry = centralEntries(archive).at(-1)!;
    const dataOffset = localDataOffset(archive, authorizationEntry);
    const dataLength = Number(
      view(archive).getBigUint64(
        authorizationEntry + 46 + view(archive).getUint16(authorizationEntry + 28, true) + 4,
        true
      )
    );
    const authorization = archive.subarray(dataOffset, dataOffset + dataLength);
    const signatureMarker = Buffer.from('"signature":"');
    const signatureOffset = authorization.indexOf(signatureMarker) + signatureMarker.length;
    expect(signatureOffset).toBeGreaterThan(signatureMarker.length);
    authorization[signatureOffset] = authorization[signatureOffset] === 0x41 ? 0x42 : 0x41;
    repairEntryCrc(archive, authorizationEntry, authorization);
    expect(() => readTransferZip64(archive, SOURCE_POLICY)).toThrow(/signature.*invalid/i);
  });

  it('uses STORE-only ZIP64 sentinels and generic ASCII names', async () => {
    const archive = await encode();
    const data = view(archive);
    const entries = centralEntries(archive);
    expect(entries).toHaveLength(5);
    for (const [index, offset] of entries.entries()) {
      expect(data.getUint16(offset + 6, true)).toBe(45);
      expect(data.getUint16(offset + 8, true)).toBe(0);
      expect(data.getUint16(offset + 10, true)).toBe(0);
      expect(data.getUint32(offset + 20, true)).toBe(0xffffffff);
      expect(data.getUint32(offset + 24, true)).toBe(0xffffffff);
      const name = archive.subarray(offset + 46, offset + 46 + data.getUint16(offset + 28, true)).toString('ascii');
      expect(name).toMatch(new RegExp(`^wayland-transfer/${String(index).padStart(10, '0')}\\.`));
      expect(name).not.toMatch(/bundle|project|chat|user|secret/i);
    }
  });

  it('rejects classic ZIP rather than silently accepting format drift', () => {
    const classic = Buffer.alloc(22);
    classic.writeUInt32LE(0x06054b50, 0);
    expect(() => readTransferZip64(classic, SOURCE_POLICY)).toThrow(/truncated|ZIP64/);
  });

  it('rejects trailing/polyglot bytes and truncation', async () => {
    const archive = await encode();
    expect(() => readTransferZip64(Buffer.concat([archive, Buffer.from('polyglot')]), SOURCE_POLICY)).toThrow(
      /trailing|terminal/
    );
    expect(() => readTransferZip64(archive.subarray(0, archive.length - 1), SOURCE_POLICY)).toThrow(
      /trailing|terminal|truncated/
    );
  });

  it.each([
    ['encrypted flag', 8, 0x0001, /flags|encryption/],
    ['data descriptor flag', 8, 0x0008, /flags|descriptor/],
    ['compression', 10, 8, /compression/],
    ['timestamp', 12, 1, /timestamp/],
  ])('rejects %s', async (_label, fieldOffset, value, expected) => {
    const archive = await encode();
    const offset = centralEntries(archive)[0]!;
    archive.writeUInt16LE(value, offset + fieldOffset);
    expect(() => readTransferZip64(archive, SOURCE_POLICY)).toThrow(expected);
  });

  it('rejects multi-disk archives, attributes, comments, and unknown critical extras', async () => {
    const original = await encode();
    const locator = original.length - END_BYTES - ZIP64_LOCATOR_BYTES;
    for (const mutate of [
      (bytes: Buffer) => bytes.writeUInt32LE(2, locator + 16),
      (bytes: Buffer) => bytes.writeUInt32LE(0xa0000000, centralEntries(bytes)[0]! + 38),
      (bytes: Buffer) => bytes.writeUInt16LE(1, centralEntries(bytes)[0]! + 32),
      (bytes: Buffer) => {
        const central = centralEntries(bytes)[0]!;
        const extra = central + 46 + view(bytes).getUint16(central + 28, true);
        bytes.writeUInt16LE(0xbeef, extra);
      },
    ]) {
      const archive = Buffer.from(original);
      mutate(archive);
      expect(() => readTransferZip64(archive, SOURCE_POLICY)).toThrow();
    }
  });

  it.each([
    ['absolute path', (name: Buffer) => name.fill(0x2f, 0, 1)],
    ['backslash', (name: Buffer) => name.fill(0x5c, 7, 8)],
    ['Unicode lookalike', (name: Buffer) => name.fill(0xff, 7, 8)],
    ['traversal', (name: Buffer) => Buffer.from('../').copy(name, 0)],
  ])('rejects unsafe %s names before exposing content', async (_label, mutate) => {
    const archive = await encode();
    const central = centralEntries(archive)[0]!;
    const nameLength = view(archive).getUint16(central + 28, true);
    const name = archive.subarray(central + 46, central + 46 + nameLength);
    mutate(name);
    expect(() => readTransferZip64(archive, SOURCE_POLICY)).toThrow(/Unsafe|noncanonical/);
  });

  it('rejects duplicate/noncanonical names and overlapping local offsets', async () => {
    const original = await encode(2);
    const offsets = centralEntries(original);
    const duplicate = Buffer.from(original);
    const firstDescriptor = offsets[1]!;
    const secondDescriptor = offsets[3]!;
    const nameLength = view(duplicate).getUint16(firstDescriptor + 28, true);
    duplicate.copy(duplicate, secondDescriptor + 46, firstDescriptor + 46, firstDescriptor + 46 + nameLength);
    expect(() => readTransferZip64(duplicate, SOURCE_POLICY)).toThrow(/name|order|Duplicate/);

    const overlap = Buffer.from(original);
    const second = centralEntries(overlap)[1]!;
    const secondNameLength = view(overlap).getUint16(second + 28, true);
    overlap.writeBigUInt64LE(0n, second + 46 + secondNameLength + 20);
    expect(() => readTransferZip64(overlap, SOURCE_POLICY)).toThrow(/overlap|reorder/);
  });

  it('rejects malformed ZIP64 boundaries before allocation', async () => {
    const original = await encode();
    const first = centralEntries(original)[0]!;
    const nameLength = view(original).getUint16(first + 28, true);
    const extra = first + 46 + nameLength;

    const fourGiBHeader = Buffer.from(original);
    fourGiBHeader.writeBigUInt64LE(0x1_0000_0000n, extra + 4);
    fourGiBHeader.writeBigUInt64LE(0x1_0000_0000n, extra + 12);
    expect(() => readTransferZip64(fourGiBHeader, SOURCE_POLICY)).toThrow(/size.*bounds/);

    const unsafe = Buffer.from(original);
    unsafe.writeBigUInt64LE(BigInt(Number.MAX_SAFE_INTEGER) + 1n, extra + 4);
    expect(() => readTransferZip64(unsafe, SOURCE_POLICY)).toThrow(/safe integer/);

    const malformed = Buffer.from(original);
    malformed.writeUInt16LE(16, extra + 2);
    expect(() => readTransferZip64(malformed, SOURCE_POLICY)).toThrow(/extra|malformed/);
  });

  it('rejects payload CRC damage and container damage with repaired CRCs', async () => {
    const original = await encode();
    const first = centralEntries(original)[0]!;
    const dataOffset = localDataOffset(original, first);

    const crcDamage = Buffer.from(original);
    crcDamage[dataOffset] ^= 0x01;
    expect(() => readTransferZip64(crcDamage, SOURCE_POLICY)).toThrow(/CRC/);

    const semanticDamage = Buffer.from(original);
    semanticDamage[dataOffset] = 0x5b;
    const headerLength = Number(
      view(semanticDamage).getBigUint64(first + 46 + view(semanticDamage).getUint16(first + 28, true) + 4, true)
    );
    const payload = semanticDamage.subarray(dataOffset, dataOffset + headerLength);
    const repairedCrc = crc32ForTest(payload);
    semanticDamage.writeUInt32LE(repairedCrc, first + 16);
    const localOffset = Number(
      view(semanticDamage).getBigUint64(first + 46 + view(semanticDamage).getUint16(first + 28, true) + 20, true)
    );
    semanticDamage.writeUInt32LE(repairedCrc, localOffset + 14);
    expect(() => readTransferZip64(semanticDamage, SOURCE_POLICY)).toThrow(/header|object|canonical|JSON/);
  });

  it('detects source mutation during asynchronous writing', async () => {
    const input = fixture();
    let calls = 0;
    await expect(
      writeTransferZip64(
        input,
        {
          async write() {
            calls += 1;
            if (calls === 1) input.terminal[0] ^= 0x01;
          },
        },
        SOURCE_POLICY
      )
    ).rejects.toThrow(/changed during write/);
  });

  it('detects archive mutation before materialization', async () => {
    const archive = await encode();
    const accepted = readTransferZip64(archive, SOURCE_POLICY);
    archive[0] ^= 0x01;
    expect(() => accepted.materialize()).toThrow(/changed after validation/);
  });

  it('rejects SharedArrayBuffer archives', async () => {
    if (typeof SharedArrayBuffer === 'undefined') return;
    const archive = await encode();
    const shared = new Uint8Array(new SharedArrayBuffer(archive.length));
    shared.set(archive);
    expect(() => readTransferZip64(shared, SOURCE_POLICY)).toThrow(/shared mutable/);
  });
});

function crc32ForTest(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc & 1) === 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function repairEntryCrc(archive: Buffer, centralEntry: number, payload: Uint8Array): void {
  const repaired = crc32ForTest(payload);
  archive.writeUInt32LE(repaired, centralEntry + 16);
  const nameLength = view(archive).getUint16(centralEntry + 28, true);
  const localOffset = Number(view(archive).getBigUint64(centralEntry + 46 + nameLength + 20, true));
  archive.writeUInt32LE(repaired, localOffset + 14);
}
