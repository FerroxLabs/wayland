import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  destinationProtection,
  parseTransferContainerHeader,
  recoveryProtection,
  serializeTransferContainerRecord,
  TRANSFER_CHUNK_SCHEMA,
  TRANSFER_CONTAINER_CONTRACT,
  TRANSFER_CONTAINER_FORMAT_VERSION,
  TRANSFER_DESTINATION_SUITE,
  TRANSFER_MAX_CHUNKS,
  TRANSFER_MAX_CHUNK_CIPHERTEXT_BYTES,
  TRANSFER_MAX_CIPHERTEXT_BYTES,
  TRANSFER_MAX_HEADER_BYTES,
  TRANSFER_MAX_PLAINTEXT_BYTES,
  TRANSFER_RECOVERY_SUITE,
  TransferContainerStreamValidator,
  transferCiphertextDigest,
  type TransferChunkDescriptor,
  type TransferContainerHeader,
  type TransferContainerTerminal,
} from '@process/services/transfer/container';

const digest = (value: string): `sha256:${string}` => `sha256:${createHash('sha256').update(value).digest('hex')}`;
const recoveryNonce = Buffer.alloc(24, 0x11).toString('base64url');

function recoveryHeader(overrides: Partial<TransferContainerHeader> = {}): TransferContainerHeader {
  return {
    recordType: 'header',
    contract: TRANSFER_CONTAINER_CONTRACT,
    formatVersion: TRANSFER_CONTAINER_FORMAT_VERSION,
    bundleId: 'bundle-hostile-1',
    suite: TRANSFER_RECOVERY_SUITE,
    declaredChunkCount: 1,
    declaredCiphertextBytes: 32,
    declaredPlaintextBytes: 16,
    protection: recoveryProtection(Buffer.alloc(16, 0x22)),
    ...overrides,
  } as TransferContainerHeader;
}

function destinationHeader(overrides: Partial<TransferContainerHeader> = {}): TransferContainerHeader {
  return {
    recordType: 'header',
    contract: TRANSFER_CONTAINER_CONTRACT,
    formatVersion: TRANSFER_CONTAINER_FORMAT_VERSION,
    bundleId: 'bundle-destination-1',
    suite: TRANSFER_DESTINATION_SUITE,
    declaredChunkCount: 1,
    declaredCiphertextBytes: 32,
    declaredPlaintextBytes: 16,
    protection: destinationProtection({
      recipientKeyId: 'destination-key-1',
      recipientKeyFingerprint: digest('recipient-key'),
      authorizationBinding: digest('destination-authority'),
      expiresAt: 1_900_000,
    }),
    ...overrides,
  } as TransferContainerHeader;
}

function chunkDescriptor(
  ciphertext: Uint8Array,
  overrides: Partial<TransferChunkDescriptor> = {}
): TransferChunkDescriptor {
  return {
    recordType: 'chunk',
    bundleId: 'bundle-hostile-1',
    schema: TRANSFER_CHUNK_SCHEMA,
    ordinal: 0,
    plaintextLength: 16,
    ciphertextLength: ciphertext.length,
    contentDigest: digest('plaintext'),
    ciphertextDigest: transferCiphertextDigest(ciphertext),
    nonce: recoveryNonce,
    ...overrides,
  };
}

function terminal(
  validator: TransferContainerStreamValidator,
  overrides: Partial<TransferContainerTerminal> = {}
): TransferContainerTerminal {
  return {
    recordType: 'terminal',
    bundleId: validator.header.bundleId,
    chunkCount: validator.header.declaredChunkCount,
    plaintextBytes: validator.header.declaredPlaintextBytes,
    ciphertextBytes: validator.header.declaredCiphertextBytes,
    streamDigest: validator.currentStreamDigest(),
    ...overrides,
  };
}

function asWire(record: TransferContainerHeader | TransferChunkDescriptor | TransferContainerTerminal): Uint8Array {
  return serializeTransferContainerRecord(record);
}

function mutateCanonical<T extends object>(record: T, mutation: Record<string, unknown>): Uint8Array {
  return serializeTransferContainerRecord({ ...record, ...mutation } as T);
}

describe('Wayland Transfer v1 outer header', () => {
  it('accepts the fixed WT-R1 and WT-D1 suites without allocating a KDF', () => {
    expect(parseTransferContainerHeader(asWire(recoveryHeader())).suite).toBe(TRANSFER_RECOVERY_SUITE);
    expect(parseTransferContainerHeader(asWire(destinationHeader())).suite).toBe(TRANSFER_DESTINATION_SUITE);
  });

  it.each([
    ['format downgrade', { formatVersion: 0 }, /format version/],
    ['format upgrade', { formatVersion: 2 }, /format version/],
    ['contract substitution', { contract: 'wayland-transfer-container/0.9' }, /contract/],
    ['suite substitution', { suite: 'WT-R0' }, /crypto suite/],
    ['zero chunks', { declaredChunkCount: 0 }, /chunk count/],
    ['excess chunks', { declaredChunkCount: TRANSFER_MAX_CHUNKS + 1 }, /chunk count/],
    ['unsafe integer', { declaredChunkCount: Number.MAX_SAFE_INTEGER + 1 }, /chunk count/],
    ['ciphertext overflow', { declaredCiphertextBytes: TRANSFER_MAX_CIPHERTEXT_BYTES + 1 }, /ciphertext/],
    ['plaintext overflow', { declaredPlaintextBytes: TRANSFER_MAX_PLAINTEXT_BYTES + 1 }, /plaintext/],
    ['unsafe expansion ratio', { declaredCiphertextBytes: 1, declaredPlaintextBytes: 101 }, /ratio/],
    ['impossible plaintext count', { declaredChunkCount: 17, declaredPlaintextBytes: 16 }, /satisfy chunk count/],
    ['impossible ciphertext count', { declaredChunkCount: 2, declaredCiphertextBytes: 33 }, /satisfy chunk count/],
  ])('rejects %s', (_label, mutation, expected) => {
    expect(() => parseTransferContainerHeader(mutateCanonical(recoveryHeader(), mutation))).toThrow(expected);
  });

  it.each([
    ['algorithm', 'scrypt'],
    ['argon2Version', 18],
    ['memoryKiB', 262_143],
    ['memoryKiB', 262_145],
    ['memoryKiB', Number.MAX_SAFE_INTEGER + 1],
    ['iterations', 2],
    ['iterations', 4],
    ['parallelism', 0],
    ['parallelism', 2],
    ['keyBytes', 16],
    ['cipher', 'AES-256-GCM'],
  ])('rejects WT-R1 %s drift before KDF work', (field, value) => {
    const header = recoveryHeader();
    const protection = { ...header.protection, [field]: value };
    expect(() => parseTransferContainerHeader(mutateCanonical(header, { protection }))).toThrow();
  });

  it.each([
    ['hpkeMode', 'auth'],
    ['kem', 'P-256'],
    ['kdf', 'HKDF-SHA512'],
    ['aead', 'AES-256-GCM'],
  ])('rejects WT-D1 %s substitution', (field, value) => {
    const header = destinationHeader();
    const protection = { ...header.protection, [field]: value };
    expect(() => parseTransferContainerHeader(mutateCanonical(header, { protection }))).toThrow(/substitution/);
  });

  it.each([
    ['recipientKeyId', ''],
    ['recipientKeyFingerprint', `sha256:${'00'.repeat(31)}`],
    ['authorizationBinding', `sha256:${'00'.repeat(31)}`],
    ['expiresAt', 0],
    ['expiresAt', Number.MAX_SAFE_INTEGER + 1],
  ])('rejects malformed WT-D1 authority field %s', (field, value) => {
    const header = destinationHeader();
    const protection = { ...header.protection, [field]: value };
    expect(() => parseTransferContainerHeader(mutateCanonical(header, { protection }))).toThrow();
  });

  it('rejects duplicate, unknown, missing, noncanonical, and oversized headers', () => {
    const canonical = Buffer.from(asWire(recoveryHeader())).toString('utf8');
    expect(() =>
      parseTransferContainerHeader(canonical.replace('"bundleId":', '"bundleId":"shadow","bundleId":'))
    ).toThrow(/duplicate object key/);
    expect(() => parseTransferContainerHeader(mutateCanonical(recoveryHeader(), { futureCritical: true }))).toThrow(
      /Unknown critical/
    );
    const missing = JSON.parse(canonical) as Record<string, unknown>;
    delete missing.declaredChunkCount;
    expect(() => parseTransferContainerHeader(serializeTransferContainerRecord(missing as never))).toThrow(
      /Missing critical/
    );
    expect(() => parseTransferContainerHeader(` ${canonical}`)).toThrow(/canonical JSON/);
    expect(() => parseTransferContainerHeader(JSON.stringify(recoveryHeader()))).toThrow(/canonical JSON/);
    expect(() => parseTransferContainerHeader('{"recordType":"header"')).toThrow();
    expect(() => parseTransferContainerHeader(Uint8Array.from([0xff, 0xfe]))).toThrow(/UTF-8/);
    expect(() => parseTransferContainerHeader('x'.repeat(TRANSFER_MAX_HEADER_BYTES + 1))).toThrow(
      /bounded record size/
    );
  });

  it.each(['path', 'name', 'userId', 'chatTitle', 'projectName', 'provider'])(
    'rejects plaintext metadata field %s',
    (field) => {
      expect(() => parseTransferContainerHeader(mutateCanonical(recoveryHeader(), { [field]: 'secret' }))).toThrow(
        /Unknown critical/
      );
    }
  );

  it('rejects duplicate and unknown nested protection fields', () => {
    const canonical = Buffer.from(asWire(recoveryHeader())).toString('utf8');
    expect(() =>
      parseTransferContainerHeader(canonical.replace('"memoryKiB":262144', '"memoryKiB":262144,"memoryKiB":262144'))
    ).toThrow(/duplicate object key/);
    const header = recoveryHeader();
    expect(() =>
      parseTransferContainerHeader(
        mutateCanonical(header, { protection: { ...header.protection, path: '/private/chat' } })
      )
    ).toThrow(/Unknown critical/);
    const destination = destinationHeader();
    expect(() =>
      parseTransferContainerHeader(
        mutateCanonical(destination, {
          protection: {
            ...destination.protection,
            encapsulatedKey: Buffer.alloc(32).toString('base64url'),
          },
        })
      )
    ).toThrow(/Unknown critical/);
  });
});

describe('Wayland Transfer v1 bounded stream', () => {
  it('validates an ordered WT-R1 stream without retaining the archive', () => {
    const ciphertext = Buffer.alloc(32, 0x44);
    const validator = new TransferContainerStreamValidator(recoveryHeader());
    const validated = validator.acceptChunk(asWire(chunkDescriptor(ciphertext)), ciphertext);
    expect(validated.descriptor.ordinal).toBe(0);
    const acceptedTerminal = validator.acceptTerminal(asWire(terminal(validator)));
    expect(validator.finish().terminal).toEqual(acceptedTerminal);
  });

  it('validates two WT-D1 chunks with distinct one-shot HPKE encapsulated keys', () => {
    const firstCiphertext = Buffer.alloc(32, 0x45);
    const secondCiphertext = Buffer.alloc(32, 0x46);
    const header = destinationHeader({
      declaredChunkCount: 2,
      declaredCiphertextBytes: 64,
      declaredPlaintextBytes: 32,
    });
    const validator = new TransferContainerStreamValidator(header);
    const first: TransferChunkDescriptor = {
      ...chunkDescriptor(firstCiphertext),
      bundleId: header.bundleId,
      encapsulatedKey: Buffer.alloc(32, 0x61).toString('base64url'),
    };
    delete (first as { nonce?: string }).nonce;
    const second: TransferChunkDescriptor = {
      ...chunkDescriptor(secondCiphertext, { ordinal: 1 }),
      bundleId: header.bundleId,
      encapsulatedKey: Buffer.alloc(32, 0x62).toString('base64url'),
    };
    delete (second as { nonce?: string }).nonce;
    validator.acceptChunk(asWire(first), firstCiphertext);
    validator.acceptChunk(asWire(second), secondCiphertext);
    validator.acceptTerminal(asWire(terminal(validator)));
    expect(validator.finish().terminal.chunkCount).toBe(2);
  });

  it('rejects missing, malformed, duplicate, reused, or nonce-bearing WT-D1 chunk keys', () => {
    const ciphertext = Buffer.alloc(32, 0x47);
    const header = destinationHeader();
    const descriptor: TransferChunkDescriptor = {
      ...chunkDescriptor(ciphertext),
      bundleId: header.bundleId,
      encapsulatedKey: Buffer.alloc(32, 0x63).toString('base64url'),
    };
    delete (descriptor as { nonce?: string }).nonce;
    const missing = { ...descriptor };
    delete missing.encapsulatedKey;
    expect(() => new TransferContainerStreamValidator(header).acceptChunk(asWire(missing), ciphertext)).toThrow(
      /Missing critical/
    );
    expect(() =>
      new TransferContainerStreamValidator(header).acceptChunk(
        asWire({ ...descriptor, encapsulatedKey: Buffer.alloc(31).toString('base64url') }),
        ciphertext
      )
    ).toThrow(/Malformed/);
    expect(() =>
      new TransferContainerStreamValidator(header).acceptChunk(
        asWire({ ...descriptor, nonce: recoveryNonce }),
        ciphertext
      )
    ).toThrow(/Unknown critical/);
    const canonical = Buffer.from(asWire(descriptor)).toString('utf8');
    expect(() =>
      new TransferContainerStreamValidator(header).acceptChunk(
        canonical.replace('"encapsulatedKey":', `"encapsulatedKey":"${descriptor.encapsulatedKey}","encapsulatedKey":`),
        ciphertext
      )
    ).toThrow(/duplicate object key/);

    const twoChunkHeader = destinationHeader({
      declaredChunkCount: 2,
      declaredCiphertextBytes: 64,
      declaredPlaintextBytes: 32,
    });
    const reused = new TransferContainerStreamValidator(twoChunkHeader);
    reused.acceptChunk(asWire(descriptor), ciphertext);
    expect(() =>
      reused.acceptChunk(
        asWire({ ...descriptor, ordinal: 1, ciphertextDigest: transferCiphertextDigest(ciphertext) }),
        ciphertext
      )
    ).toThrow(/encapsulated key reuse/);

    expect(() =>
      new TransferContainerStreamValidator(recoveryHeader()).acceptChunk(
        asWire({ ...chunkDescriptor(ciphertext), encapsulatedKey: descriptor.encapsulatedKey }),
        ciphertext
      )
    ).toThrow(/Unknown critical/);
  });

  it.each([
    ['gap', { ordinal: 1 }, /gap or reordering/],
    ['wrong bundle', { bundleId: 'bundle-other' }, /bundle mismatch/],
    ['schema drift', { schema: 'wayland-transfer/chat/1' }, /chunk schema/],
    ['zero plaintext', { plaintextLength: 0 }, /plaintext length/],
    ['oversized ciphertext', { ciphertextLength: TRANSFER_MAX_CHUNK_CIPHERTEXT_BYTES + 1 }, /ciphertext length/],
    ['unsafe ratio', { plaintextLength: 1_701, ciphertextLength: 17 }, /ratio/],
    ['bad content digest', { contentDigest: 'sha256:00' }, /content digest/],
    ['bad ciphertext digest', { ciphertextDigest: 'sha256:00' }, /ciphertext digest/],
  ])('rejects a chunk with %s', (_label, mutation, expected) => {
    const ciphertext = Buffer.alloc(32, 0x46);
    const validator = new TransferContainerStreamValidator(recoveryHeader());
    expect(() => validator.acceptChunk(mutateCanonical(chunkDescriptor(ciphertext), mutation), ciphertext)).toThrow(
      expected
    );
  });

  it('rejects ciphertext length and digest mismatches', () => {
    const ciphertext = Buffer.alloc(32, 0x47);
    const descriptor = chunkDescriptor(ciphertext);
    expect(() =>
      new TransferContainerStreamValidator(recoveryHeader()).acceptChunk(asWire(descriptor), ciphertext.subarray(1))
    ).toThrow(/length mismatch/);
    const tampered = Buffer.from(ciphertext);
    tampered[0] ^= 0x80;
    expect(() =>
      new TransferContainerStreamValidator(recoveryHeader()).acceptChunk(asWire(descriptor), tampered)
    ).toThrow(/digest mismatch/);
  });

  it('rejects duplicate, missing, and noncanonical chunk descriptors', () => {
    const ciphertext = Buffer.alloc(32, 0x47);
    const descriptor = chunkDescriptor(ciphertext);
    const canonical = Buffer.from(asWire(descriptor)).toString('utf8');
    expect(() =>
      new TransferContainerStreamValidator(recoveryHeader()).acceptChunk(
        canonical.replace('"ordinal":0', '"ordinal":0,"ordinal":0'),
        ciphertext
      )
    ).toThrow(/duplicate object key/);
    const missing = { ...descriptor } as Partial<TransferChunkDescriptor>;
    delete missing.contentDigest;
    expect(() =>
      new TransferContainerStreamValidator(recoveryHeader()).acceptChunk(asWire(missing as never), ciphertext)
    ).toThrow(/Missing critical/);
    expect(() =>
      new TransferContainerStreamValidator(recoveryHeader()).acceptChunk(JSON.stringify(descriptor), ciphertext)
    ).toThrow(/canonical JSON/);
  });

  it('rejects shared mutable ciphertext before hashing', () => {
    const shared = new Uint8Array(new SharedArrayBuffer(32));
    const descriptor = chunkDescriptor(shared);
    expect(() =>
      new TransferContainerStreamValidator(recoveryHeader()).acceptChunk(asWire(descriptor), shared)
    ).toThrow(/shared mutable memory/);
  });

  it('rejects recovery nonce reuse', () => {
    const firstCiphertext = Buffer.alloc(32, 0x48);
    const secondCiphertext = Buffer.alloc(32, 0x49);
    const validator = new TransferContainerStreamValidator(
      recoveryHeader({
        declaredChunkCount: 2,
        declaredCiphertextBytes: 64,
        declaredPlaintextBytes: 32,
      })
    );
    validator.acceptChunk(asWire(chunkDescriptor(firstCiphertext)), firstCiphertext);
    expect(() =>
      validator.acceptChunk(asWire(chunkDescriptor(secondCiphertext, { ordinal: 1 })), secondCiphertext)
    ).toThrow(/nonce reuse/);
  });

  it('rejects duplicate, reordered, and excessive chunks', () => {
    const ciphertext = Buffer.alloc(32, 0x4a);
    const descriptor = chunkDescriptor(ciphertext);
    const duplicate = new TransferContainerStreamValidator(
      recoveryHeader({
        declaredChunkCount: 2,
        declaredCiphertextBytes: 64,
        declaredPlaintextBytes: 32,
      })
    );
    duplicate.acceptChunk(asWire(descriptor), ciphertext);
    expect(() => duplicate.acceptChunk(asWire(descriptor), ciphertext)).toThrow(/gap or reordering/);

    const excessive = new TransferContainerStreamValidator(recoveryHeader());
    excessive.acceptChunk(asWire(descriptor), ciphertext);
    expect(() =>
      excessive.acceptChunk(
        asWire(chunkDescriptor(ciphertext, { ordinal: 1, nonce: Buffer.alloc(24, 0x55).toString('base64url') })),
        ciphertext
      )
    ).toThrow(/exceed.*header declaration/);
  });

  it.each(['path', 'name', 'userId', 'chatTitle', 'projectName', 'provider'])(
    'rejects chunk plaintext metadata field %s',
    (field) => {
      const ciphertext = Buffer.alloc(32, 0x4b);
      expect(() =>
        new TransferContainerStreamValidator(recoveryHeader()).acceptChunk(
          mutateCanonical(chunkDescriptor(ciphertext), { [field]: 'secret' }),
          ciphertext
        )
      ).toThrow(/Unknown critical/);
    }
  );

  it('rejects truncation, terminal mismatch, digest mismatch, and post-terminal records', () => {
    const ciphertext = Buffer.alloc(32, 0x4c);
    const descriptor = chunkDescriptor(ciphertext);
    const truncated = new TransferContainerStreamValidator(recoveryHeader());
    truncated.acceptChunk(asWire(descriptor), ciphertext);
    expect(() => truncated.finish()).toThrow(/truncated/);
    expect(() => truncated.acceptTerminal(asWire(terminal(truncated, { chunkCount: 2 })))).toThrow(
      /chunk count mismatch/
    );

    const digestMismatch = new TransferContainerStreamValidator(recoveryHeader());
    digestMismatch.acceptChunk(asWire(descriptor), ciphertext);
    expect(() =>
      digestMismatch.acceptTerminal(asWire(terminal(digestMismatch, { streamDigest: digest('tampered') })))
    ).toThrow(/stream digest mismatch/);

    const complete = new TransferContainerStreamValidator(recoveryHeader());
    complete.acceptChunk(asWire(descriptor), ciphertext);
    complete.acceptTerminal(asWire(terminal(complete)));
    expect(() => complete.acceptChunk(asWire(descriptor), ciphertext)).toThrow(/after terminal/);

    const completeAgain = new TransferContainerStreamValidator(recoveryHeader());
    completeAgain.acceptChunk(asWire(descriptor), ciphertext);
    completeAgain.acceptTerminal(asWire(terminal(completeAgain)));
    expect(() => completeAgain.acceptTerminal(asWire(terminal(completeAgain)))).toThrow(/after terminal/);
  });

  it('poisons a stream after the first rejected record', () => {
    const ciphertext = Buffer.alloc(32, 0x4e);
    const validator = new TransferContainerStreamValidator(recoveryHeader());
    expect(() =>
      validator.acceptChunk(asWire(chunkDescriptor(ciphertext, { ciphertextDigest: digest('wrong') })), ciphertext)
    ).toThrow(/digest mismatch/);
    expect(() => validator.acceptChunk(asWire(chunkDescriptor(ciphertext)), ciphertext)).toThrow(
      /previously failed closed/
    );
    expect(() => validator.finish()).toThrow(/previously failed closed/);
  });

  it('rejects unknown terminal metadata and declared cumulative-byte overflow', () => {
    const ciphertext = Buffer.alloc(32, 0x4d);
    const validator = new TransferContainerStreamValidator(recoveryHeader());
    validator.acceptChunk(asWire(chunkDescriptor(ciphertext)), ciphertext);
    expect(() => validator.acceptTerminal(mutateCanonical(terminal(validator), { path: '/private/chat' }))).toThrow(
      /Unknown critical/
    );

    const tooSmall = new TransferContainerStreamValidator(recoveryHeader({ declaredCiphertextBytes: 31 }));
    expect(() => tooSmall.acceptChunk(asWire(chunkDescriptor(ciphertext)), ciphertext)).toThrow(
      /exceed header declaration/
    );
  });
});
