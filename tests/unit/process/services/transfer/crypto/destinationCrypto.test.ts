import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  buildDestinationAssociatedData,
  contentDigest,
  DESTINATION_MAX_CHUNK_BYTES,
  DestinationRecipientKey,
  encryptDestinationChunk,
  parseDestinationChunkEnvelope,
  serializeDestinationChunkEnvelope,
  type DestinationChunkEncryptionInput,
  type DestinationChunkEnvelope,
  type DestinationRecipientDescriptor,
} from '@process/services/transfer/crypto';

const plaintext = new TextEncoder().encode('destination-bound Wayland state');
const AUTHORIZATION_BINDING = `sha256:${'ab'.repeat(32)}` as const;
const input: DestinationChunkEncryptionInput = {
  bundleId: 'bundle-destination-1',
  schema: 'wayland-transfer/1',
  ordinal: 4,
  declaredLength: plaintext.length,
  contentDigest: contentDigest(plaintext),
  plaintext,
};

async function issue(nowValue = Date.now()): Promise<{
  key: DestinationRecipientKey;
  descriptor: Readonly<DestinationRecipientDescriptor>;
  setNow: (value: number) => void;
}> {
  let current = nowValue;
  const key = await DestinationRecipientKey.issue({
    keyId: 'destination-key-1',
    authorizationBinding: AUTHORIZATION_BINDING,
    expiresAt: nowValue + 15 * 60 * 1000,
    now: () => current,
  });
  return {
    key,
    descriptor: key.descriptor(),
    setNow: (value) => {
      current = value;
    },
  };
}

function mutate(serialized: Uint8Array, transform: (value: Record<string, unknown>) => void): string {
  const value = JSON.parse(new TextDecoder().decode(serialized)) as Record<string, unknown>;
  transform(value);
  return JSON.stringify(value);
}

describe('WT-D1 destination-bound HPKE', () => {
  it('round-trips with exact suite and bounded wire sizes', async () => {
    const { key, descriptor } = await issue();
    const serialized = await encryptDestinationChunk(input, descriptor);
    const envelope = parseDestinationChunkEnvelope(serialized);
    expect(Buffer.from(descriptor.publicKey, 'base64url')).toHaveLength(32);
    expect(Buffer.from(envelope.encapsulatedKey, 'base64url')).toHaveLength(32);
    expect(Buffer.from(envelope.ciphertext, 'base64url')).toHaveLength(plaintext.length + 16);
    await expect(key.openChunk(serialized)).resolves.toMatchObject({
      bundleId: input.bundleId,
      ordinal: input.ordinal,
      plaintext,
    });
  });

  it('uses fresh HPKE encapsulation and ciphertext for each seal', async () => {
    const { descriptor } = await issue();
    const first = parseDestinationChunkEnvelope(await encryptDestinationChunk(input, descriptor));
    const second = parseDestinationChunkEnvelope(await encryptDestinationChunk(input, descriptor));
    expect(second.encapsulatedKey).not.toBe(first.encapsulatedKey);
    expect(second.ciphertext).not.toBe(first.ciphertext);
  });

  it('never exposes the private key through the descriptor', async () => {
    const { descriptor } = await issue();
    expect(Object.keys(descriptor).toSorted()).toEqual([
      'authorizationBinding',
      'expiresAt',
      'fingerprint',
      'keyId',
      'publicKey',
      'suite',
    ]);
    expect(JSON.stringify(descriptor)).not.toMatch(/private|secret/i);
  });

  it('rejects wrong-recipient decryption', async () => {
    const first = await issue();
    const secondKey = await DestinationRecipientKey.issue({
      keyId: 'destination-key-2',
      authorizationBinding: AUTHORIZATION_BINDING,
      expiresAt: 1_900_000,
      now: () => 1_000_000,
    });
    const serialized = await encryptDestinationChunk(input, first.descriptor);
    await expect(secondKey.openChunk(serialized)).rejects.toThrow('recipient binding mismatch');
  });

  it('fails after expiry and destroys expired authority', async () => {
    const issued = await issue();
    const serialized = await encryptDestinationChunk(input, issued.descriptor);
    issued.setNow(issued.descriptor.expiresAt);
    await expect(issued.key.openChunk(serialized)).rejects.toThrow('expired');
    await expect(issued.key.openChunk(serialized)).rejects.toThrow('destroyed');
  });

  it('rejects expired, over-lifetime, and substituted source authorization', async () => {
    const now = 1_000_000;
    const issued = await issue(now);
    await expect(
      encryptDestinationChunk(input, { ...issued.descriptor, expiresAt: now - 1 }, () => now)
    ).rejects.toThrow(/expired/);
    await expect(
      encryptDestinationChunk(input, { ...issued.descriptor, expiresAt: now + 15 * 60 * 1000 + 1 }, () => now)
    ).rejects.toThrow(/15 minutes/);

    const serialized = await encryptDestinationChunk(input, issued.descriptor, () => now);
    await expect(
      issued.key.openChunk(
        mutate(serialized, (item) => {
          item.authorizationBinding = `sha256:${'cd'.repeat(32)}`;
        })
      )
    ).rejects.toThrow('recipient binding mismatch');
  });

  it('fails after explicit key destruction', async () => {
    const issued = await issue();
    const serialized = await encryptDestinationChunk(input, issued.descriptor);
    issued.key.destroy();
    await expect(issued.key.openChunk(serialized)).rejects.toThrow('destroyed');
  });

  it.each([
    ['format', 'format', 'wayland-transfer-destination-chunk/2', /Unknown destination format/],
    ['suite', 'suite', 'WT-D2', /Unknown destination crypto suite/],
    ['KEM', 'kem', 'DHKEM(P-256,HKDF-SHA256)', /KEM drift/],
    ['KDF', 'kdf', 'HKDF-SHA512', /KDF drift/],
    ['AEAD', 'aead', 'AES-128-GCM', /AEAD drift/],
  ])('rejects %s substitution', async (_label, field, value, error) => {
    const { descriptor } = await issue();
    const serialized = await encryptDestinationChunk(input, descriptor);
    expect(() => parseDestinationChunkEnvelope(mutate(serialized, (item) => (item[field] = value)))).toThrow(error);
  });

  it('rejects unknown, missing, and duplicate critical fields', async () => {
    const { descriptor } = await issue();
    const serialized = await encryptDestinationChunk(input, descriptor);
    expect(() => parseDestinationChunkEnvelope(mutate(serialized, (item) => (item.futureCritical = true)))).toThrow(
      'Unknown critical envelope field'
    );
    expect(() => parseDestinationChunkEnvelope(mutate(serialized, (item) => delete item.contentDigest))).toThrow(
      'Missing critical envelope field'
    );
    const text = new TextDecoder().decode(serialized);
    expect(() =>
      parseDestinationChunkEnvelope(text.replace('"suite":"WT-D1"', '"suite":"WT-D1","suite":"WT-D1"'))
    ).toThrow('duplicate object key');
  });

  it.each([
    ['short public key', 31],
    ['long public key', 33],
    ['all-zero public key', 32],
  ])('rejects a %s', async (label, size) => {
    const { descriptor } = await issue();
    const publicKeyBytes = Buffer.alloc(size, label === 'all-zero public key' ? 0 : 1);
    const publicKey = publicKeyBytes.toString('base64url');
    const hostile = {
      ...descriptor,
      publicKey,
      fingerprint: `sha256:${createHash('sha256').update(publicKeyBytes).digest('hex')}`,
    };
    await expect(encryptDestinationChunk(input, hostile)).rejects.toThrow();
  });

  it('rejects malformed encapsulated keys and ciphertext before open', async () => {
    const issued = await issue();
    const serialized = await encryptDestinationChunk(input, issued.descriptor);
    expect(() =>
      parseDestinationChunkEnvelope(
        mutate(serialized, (item) => (item.encapsulatedKey = Buffer.alloc(31).toString('base64url')))
      )
    ).toThrow('Malformed destination encapsulated key');
    expect(() =>
      parseDestinationChunkEnvelope(
        mutate(serialized, (item) => (item.ciphertext = Buffer.alloc(1).toString('base64url')))
      )
    ).toThrow('Malformed destination ciphertext');
  });

  it('rejects tampering and every associated-data binding drift', async () => {
    const fields: Array<keyof DestinationChunkEnvelope> = [
      'bundleId',
      'schema',
      'ordinal',
      'declaredLength',
      'contentDigest',
      'authorizationBinding',
      'expiresAt',
    ];
    await Promise.all(
      fields.map(async (field) => {
        const issued = await issue();
        const serialized = await encryptDestinationChunk(input, issued.descriptor);
        const candidate = parseDestinationChunkEnvelope(serialized);
        const changed: Record<string, unknown> = { ...candidate };
        if (field === 'bundleId') changed[field] = 'bundle-destination-2';
        if (field === 'schema') changed[field] = 'wayland-transfer/2';
        if (field === 'ordinal') changed[field] = candidate.ordinal + 1;
        if (field === 'declaredLength') {
          changed[field] = candidate.declaredLength + 1;
          changed.ciphertext = `${candidate.ciphertext}A`;
        }
        if (field === 'contentDigest') changed[field] = `sha256:${'00'.repeat(32)}`;
        if (field === 'authorizationBinding') changed[field] = `sha256:${'cd'.repeat(32)}`;
        if (field === 'expiresAt') changed[field] = candidate.expiresAt - 1;
        await expect(issued.key.openChunk(JSON.stringify(changed))).rejects.toThrow();
      })
    );
  });

  it('rejects ciphertext authentication failure', async () => {
    const issued = await issue();
    const serialized = await encryptDestinationChunk(input, issued.descriptor);
    const candidate = parseDestinationChunkEnvelope(serialized);
    const bytes = Buffer.from(candidate.ciphertext, 'base64url');
    bytes[0] ^= 0x80;
    candidate.ciphertext = bytes.toString('base64url');
    await expect(issued.key.openChunk(serializeDestinationChunkEnvelope(candidate))).rejects.toThrow(
      'authentication failed'
    );
  });

  it('rejects unsafe, negative, and oversized declared lengths', async () => {
    const { descriptor } = await issue();
    const serialized = await encryptDestinationChunk(input, descriptor);
    for (const value of [-1, Number.MAX_SAFE_INTEGER + 1, DESTINATION_MAX_CHUNK_BYTES + 1]) {
      expect(() => parseDestinationChunkEnvelope(mutate(serialized, (item) => (item.declaredLength = value)))).toThrow(
        'Invalid transfer chunk length'
      );
    }
  });

  it('binds every required metadata field into canonical AAD', () => {
    const original = Buffer.from(buildDestinationAssociatedData(input)).toString('hex');
    const variants = [
      { ...input, bundleId: 'bundle-destination-2' },
      { ...input, schema: 'wayland-transfer/2' },
      { ...input, ordinal: input.ordinal + 1 },
      { ...input, declaredLength: input.declaredLength + 1 },
      { ...input, contentDigest: `sha256:${'00'.repeat(32)}` },
    ];
    for (const variant of variants) {
      expect(Buffer.from(buildDestinationAssociatedData(variant)).toString('hex')).not.toBe(original);
    }
  });
});
